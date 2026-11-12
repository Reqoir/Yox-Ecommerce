/**
 * @file razorpay-webhook.use-case.ts
 * @layer Application › Use Cases
 *
 * Verifies signed Razorpay webhooks over raw request bodies, enforces strict
 * idempotent deduplication, and safely reconciles payment.captured,
 * payment.failed, and refund.processed events.
 */

import crypto from 'crypto';
import mongoose from 'mongoose';
import { ConflictError, UnauthorizedError } from '@core/application/errors/application.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IReturnRepository } from '../../../returns/domain/repositories/return.repository.interface';
import { AtomicStockService } from '../../../inventory/application/services/atomic-stock.service';
import { IPaymentRepository, IRefundRepository } from '../../domain/repositories/payment.repository.interface';
import { PaymentRepository, RefundRepository } from '../../infrastructure/repositories/payment.repository';
import { WebhookEventModel } from '../../infrastructure/models/webhook-event.model';
import { RazorpayService } from '../../infrastructure/services/razorpay.service';
import { Order } from '../../../orders/domain/entities/order.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';
import { IOfferRepository } from '../../../offers/domain/repositories/offer.repository.interface';
import { OfferRepository } from '../../../offers/infrastructure/repositories/offer.repository';

export interface WebhookEventDeduplicator {
  recordIfNew(entry: {
    provider: 'RAZORPAY' | 'SHIPROCKET';
    eventId: string;
    eventType: string;
    orderId?: string | null;
  }): Promise<boolean>; // true = new or reclaimed failed event, false = duplicate/in-progress
  markProcessed?(provider: 'RAZORPAY' | 'SHIPROCKET', eventId: string, orderId?: string | null): Promise<void>;
  markFailed?(provider: 'RAZORPAY' | 'SHIPROCKET', eventId: string, errorMessage: string): Promise<void>;
}

export class MongooseWebhookEventDeduplicator implements WebhookEventDeduplicator {
  async recordIfNew(entry: {
    provider: 'RAZORPAY' | 'SHIPROCKET';
    eventId: string;
    eventType: string;
    orderId?: string | null;
  }): Promise<boolean> {
    if (mongoose.connection.readyState !== 1) return true;
    try {
      await WebhookEventModel.create({
        provider: entry.provider,
        eventId: entry.eventId,
        eventType: entry.eventType,
        orderId: entry.orderId || null,
        status: 'PROCESSING',
        errorMessage: null,
        processedAt: null,
      });
      return true;
    } catch (err: any) {
      if (err?.code === 11000) {
        // Safely allow retries ONLY if the prior attempt failed; block PROCESSED & concurrent PROCESSING
        const reclaimed = await WebhookEventModel.findOneAndUpdate(
          { provider: entry.provider, eventId: entry.eventId, status: 'FAILED' },
          {
            $set: {
              status: 'PROCESSING',
              errorMessage: null,
              eventType: entry.eventType,
              updatedAt: new Date(),
            },
          },
          { new: true }
        ).exec();
        return Boolean(reclaimed);
      }
      throw err;
    }
  }

  async markProcessed(provider: 'RAZORPAY' | 'SHIPROCKET', eventId: string, orderId?: string | null): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await WebhookEventModel.findOneAndUpdate(
      { provider, eventId },
      {
        $set: {
          status: 'PROCESSED',
          errorMessage: null,
          processedAt: new Date(),
          ...(orderId ? { orderId } : {}),
        },
      }
    ).catch(() => undefined);
  }

  async markFailed(provider: 'RAZORPAY' | 'SHIPROCKET', eventId: string, errorMessage: string): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    await WebhookEventModel.findOneAndUpdate(
      { provider, eventId },
      { $set: { status: 'FAILED', errorMessage } }
    ).catch(() => undefined);
  }
}

export interface HandleRazorpayWebhookInputDTO {
  rawBody?: Buffer | string;
  signature?: string;
  eventIdHeader?: string;
  payload?: any;
}

export interface HandleRazorpayWebhookResultDTO {
  received: boolean;
  duplicate?: boolean;
  ignored?: boolean;
  event?: string;
  orderId?: string;
}

export class HandleRazorpayWebhookUseCase {
  private readonly atomicStockService: AtomicStockService;
  private readonly deduplicator: WebhookEventDeduplicator;
  private readonly offerRepo?: IOfferRepository;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly paymentRepo: IPaymentRepository = new PaymentRepository(),
    private readonly refundRepo: IRefundRepository = new RefundRepository(),
    variantRepo: IProductVariantRepository,
    inventoryRepo: IInventoryRepository,
    stockLogRepo: IStockLogRepository,
    private readonly razorpayService: RazorpayService,
    private readonly returnRepo?: IReturnRepository,
    deduplicator?: WebhookEventDeduplicator,
    offerRepo?: IOfferRepository
  ) {
    this.atomicStockService = new AtomicStockService(variantRepo, inventoryRepo, stockLogRepo, {
      explicitInventoryRepo: true,
      explicitStockLogRepo: true,
    });
    this.deduplicator = deduplicator ?? new MongooseWebhookEventDeduplicator();
    this.offerRepo = offerRepo ?? (mongoose.connection.readyState === 1 ? new OfferRepository() : undefined);
  }

  async execute(input: HandleRazorpayWebhookInputDTO): Promise<HandleRazorpayWebhookResultDTO> {
    const { rawBody, signature, eventIdHeader } = input;
    if (!rawBody || !signature) {
      throw new UnauthorizedError('Missing Razorpay webhook signature or raw payload');
    }

    const isValid = this.razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedError('Invalid Razorpay webhook signature');
    }

    let body = input.payload;
    if (!body || typeof body !== 'object') {
      try {
        const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
        body = JSON.parse(text);
      } catch {
        throw new ValidationError('Invalid Razorpay webhook JSON payload');
      }
    }

    const eventType = String(body?.event || '');
    if (!eventType) {
      throw new ValidationError('Missing Razorpay webhook event type');
    }

    const rawHash = crypto
      .createHash('sha256')
      .update(Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody), 'utf8'))
      .digest('hex');
    const eventId = eventIdHeader || body?.id || rawHash;

    const isNew = await this.deduplicator.recordIfNew({
      provider: 'RAZORPAY',
      eventId,
      eventType,
    });
    if (!isNew) {
      return { received: true, duplicate: true, event: eventType };
    }

    try {
      let result: HandleRazorpayWebhookResultDTO;
      if (eventType === 'payment.captured') {
        result = await this.handlePaymentCaptured(body, eventType);
      } else if (eventType === 'payment.failed') {
        result = await this.handlePaymentFailed(body, eventType);
      } else if (eventType === 'refund.processed') {
        result = await this.handleRefundProcessed(body, eventType);
      } else {
        result = { received: true, ignored: true, event: eventType };
      }

      await this.deduplicator.markProcessed?.('RAZORPAY', eventId, result.orderId || null);
      return result;
    } catch (error: any) {
      await this.deduplicator.markFailed?.('RAZORPAY', eventId, error?.message || 'Webhook error');
      throw error;
    }
  }

  private async handlePaymentCaptured(body: any, eventType: string): Promise<HandleRazorpayWebhookResultDTO> {
    const rzpPayment = body?.payload?.payment?.entity;
    if (!rzpPayment?.id || !rzpPayment?.order_id) {
      return { received: true, ignored: true, event: eventType };
    }
    if (rzpPayment.status !== 'captured') {
      throw new ValidationError(`Rejected non-captured payment webhook event with status "${rzpPayment.status}"`);
    }
    if (String(rzpPayment.currency || '').toUpperCase() !== 'INR') {
      throw new ValidationError(`Unsupported Razorpay currency "${rzpPayment.currency}"`);
    }

    const payment = await this.paymentRepo.findByGatewayOrderId?.(rzpPayment.order_id);
    if (!payment) {
      return { received: true, ignored: true, event: eventType };
    }

    const order = await this.orderRepo.findById(payment.orderId);
    if (!order || order.paymentMethod !== 'RAZORPAY') {
      return { received: true, ignored: true, event: eventType };
    }

    const expectedPaise = Math.round(order.totalAmount * 100);
    if (Number(rzpPayment.amount) !== expectedPaise) {
      throw new ValidationError(
        `Webhook amount mismatch: expected ${expectedPaise} paise, got ${rzpPayment.amount}`
      );
    }

    if (order.paymentStatus === 'PAID') {
      if (order.paymentId && order.paymentId !== rzpPayment.id) {
        throw new ConflictError('Order already paid with a different transaction ID');
      }
      return { received: true, duplicate: true, event: eventType, orderId: order.id };
    }

    if (order.orderStatus === 'CANCELLED' || order.paymentStatus !== 'PENDING') {
      return { received: true, ignored: true, event: eventType, orderId: order.id };
    }

    if (typeof this.paymentRepo.findByTransactionId === 'function') {
      const existingTxn = await this.paymentRepo.findByTransactionId(rzpPayment.id);
      if (existingTxn && existingTxn.orderId !== order.id) {
        throw new ConflictError('Razorpay payment ID already belongs to another order');
      }
    }

    if (typeof this.paymentRepo.atomicMarkPaid === 'function') {
      try {
        await this.paymentRepo.atomicMarkPaid({
          orderId: order.id,
          gatewayOrderId: rzpPayment.order_id,
          transactionId: rzpPayment.id,
        });
      } catch (err: any) {
        if (err?.code === 11000) {
          throw new ConflictError('Razorpay payment ID already used on another order');
        }
        throw err;
      }
    } else {
      const updatedPayment = Payment.reconstitute({
        ...payment.toJSON(),
        paymentStatus: 'PAID',
        transactionId: rzpPayment.id,
        updatedAt: new Date(),
      });
      await this.paymentRepo.save(updatedPayment);
    }

    let paidOrder: Order | null = null;
    if (typeof this.orderRepo.atomicMarkPaid === 'function') {
      paidOrder = await this.orderRepo.atomicMarkPaid(order.id, rzpPayment.id);
    } else {
      order.updatePaymentStatus('PAID', rzpPayment.id);
      paidOrder = await this.orderRepo.save(order);
    }

    if (!paidOrder) {
      return { received: true, duplicate: true, event: eventType, orderId: order.id };
    }

    if (paidOrder.notes !== 'DIRECT_BUY') {
      try {
        const userCart = await this.cartRepo.findByUserId(paidOrder.userId);
        if (userCart && userCart.items.length > 0) {
          userCart.clear();
          await this.cartRepo.save(userCart);
        }
      } catch {}
    }

    try {
      AuditLogService.getInstance()?.record({
        actorId: 'RAZORPAY_WEBHOOK',
        actorRole: 'SYSTEM',
        action: AuditAction.ORDER_CREATED,
        resourceType: 'ORDER',
        resourceId: paidOrder.id,
        description: `Webhook verified payment.captured for Order #${paidOrder.orderNumber} (Txn: ${rzpPayment.id})`,
      });
    } catch {}

    return { received: true, event: eventType, orderId: paidOrder.id };
  }

  private async handlePaymentFailed(body: any, eventType: string): Promise<HandleRazorpayWebhookResultDTO> {
    const rzpPayment = body?.payload?.payment?.entity;
    if (!rzpPayment?.order_id) {
      return { received: true, ignored: true, event: eventType };
    }

    const payment = await this.paymentRepo.findByGatewayOrderId?.(rzpPayment.order_id);
    if (!payment) {
      return { received: true, ignored: true, event: eventType };
    }

    const order = await this.orderRepo.findById(payment.orderId);
    if (!order || order.paymentMethod !== 'RAZORPAY' || order.paymentStatus !== 'PENDING' || order.orderStatus !== 'PLACED') {
      return { received: true, ignored: true, event: eventType, orderId: order?.id };
    }

    const failureReason =
      rzpPayment.error_description || rzpPayment.error_reason || 'Payment failed at Razorpay gateway';

    let failedOrder = null;
    if (typeof this.orderRepo.atomicMarkPaymentFailed === 'function') {
      failedOrder = await this.orderRepo.atomicMarkPaymentFailed(order.id, failureReason);
    } else {
      order.updatePaymentStatus('FAILED');
      order.cancel({ reason: failureReason, isAdmin: true });
      failedOrder = await this.orderRepo.save(order);
    }

    if (!failedOrder) {
      return { received: true, duplicate: true, event: eventType, orderId: order.id };
    }

    if (typeof this.paymentRepo.atomicMarkFailed === 'function') {
      await this.paymentRepo.atomicMarkFailed({
        orderId: order.id,
        transactionId: rzpPayment.id || undefined,
      });
    }

    await this.atomicStockService.releaseOrderItems(
      failedOrder.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        productName: i.productName,
      })),
      {
        reason: `Stock released from Razorpay webhook payment.failed for Order #${failedOrder.orderNumber}`,
        reference: failedOrder.id,
      }
    );

    if (failedOrder.couponId && this.offerRepo?.atomicDecrementUsage) {
      await this.offerRepo.atomicDecrementUsage(failedOrder.couponId).catch(() => undefined);
    }

    return { received: true, event: eventType, orderId: failedOrder.id };
  }

  private async handleRefundProcessed(body: any, eventType: string): Promise<HandleRazorpayWebhookResultDTO> {
    const rzpRefund = body?.payload?.refund?.entity;
    if (!rzpRefund?.id) {
      return { received: true, ignored: true, event: eventType };
    }

    const refund = await this.refundRepo.findByGatewayRefundId?.(rzpRefund.id);
    if (!refund) {
      return { received: true, ignored: true, event: eventType };
    }

    if (refund.status === 'COMPLETED') {
      return { received: true, duplicate: true, event: eventType, orderId: refund.orderId };
    }

    // Reconcile Payment, Order, and Return before marking Refund COMPLETED last,
    // so a transient failure partway through can safely retry without double-counting.
    const existingOrderRefunds = await this.refundRepo.findByOrderId(refund.orderId);
    const completedExcludingSelf = existingOrderRefunds
      .filter((r) => r.status === 'COMPLETED' && r.id !== refund.id)
      .reduce((sum, r) => sum + r.amount, 0);
    const targetCompletedTotal = Number((completedExcludingSelf + refund.amount).toFixed(2));

    const payment = refund.paymentId ? await this.paymentRepo.findById(refund.paymentId) : null;
    if (payment && payment.refundedAmount < targetCompletedTotal) {
      const delta = Number((targetCompletedTotal - payment.refundedAmount).toFixed(2));
      if (delta > 0) {
        payment.addRefund(delta);
        await this.paymentRepo.save(payment);
      }
    }

    const order = await this.orderRepo.findById(refund.orderId);
    if (order) {
      const nextStatus = targetCompletedTotal >= order.totalAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
      if (order.paymentStatus !== nextStatus && order.paymentStatus !== 'REFUNDED') {
        order.updatePaymentStatus(nextStatus);
        await this.orderRepo.save(order);
      }
    }

    if (refund.returnId && this.returnRepo) {
      const returnReq = await this.returnRepo.findById(refund.returnId);
      if (returnReq && returnReq.status !== 'REFUNDED') {
        returnReq.markRefunded({
          refundId: refund.id,
          refundAmount: refund.amount,
          refundMethod: refund.paymentMethod,
          refundTransactionId: rzpRefund.id,
        });
        await this.returnRepo.save(returnReq);
      }
    }

    refund.markCompleted(rzpRefund.id);
    await this.refundRepo.save(refund);

    return { received: true, event: eventType, orderId: refund.orderId };
  }
}
