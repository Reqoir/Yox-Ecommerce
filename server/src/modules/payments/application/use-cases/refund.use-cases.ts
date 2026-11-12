/**
 * @file refund.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import {
  ApplicationError,
  ConflictError,
} from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { IPaymentRepository, IRefundRepository } from '../../domain/repositories/payment.repository.interface';
import { IReturnRepository } from '../../../returns/domain/repositories/return.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Refund } from '../../domain/entities/payment.entity';
import { RazorpayService } from '../../infrastructure/services/razorpay.service';
import { ProcessRefundRequestDTO, RefundResponseDTO } from '../dtos/payment.dto';

export function mapToRefundResponseDTO(refund: Refund): RefundResponseDTO {
  return {
    id: refund.id,
    paymentId: refund.paymentId ?? null,
    orderId: refund.orderId,
    returnId: refund.returnId ?? null,
    amount: refund.amount,
    paymentMethod: refund.paymentMethod,
    gatewayRefundId: refund.gatewayRefundId,
    status: refund.status,
    failureReason: refund.failureReason,
    processedAt: refund.processedAt,
    createdAt: refund.createdAt,
    updatedAt: refund.updatedAt,
  };
}

export interface FlexibleProcessRefundDTO {
  returnId?: string | null;
  orderId?: string;
  amount?: number;
  reason?: string;
}

export class ProcessRefundUseCase implements IUseCase<ProcessRefundRequestDTO | FlexibleProcessRefundDTO, RefundResponseDTO> {
  private readonly razorpayService: RazorpayService;

  constructor(
    private readonly refundRepo: IRefundRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo: IOrderRepository,
    razorpayService?: RazorpayService
  ) {
    this.razorpayService = razorpayService ?? new RazorpayService();
  }

  async execute(input: ProcessRefundRequestDTO | FlexibleProcessRefundDTO): Promise<RefundResponseDTO> {
    const returnId = input.returnId || undefined;
    let returnEntity: any = null;
    let orderId = (input as FlexibleProcessRefundDTO).orderId;

    // 1. Optional Return entity resolution & state guards
    if (returnId) {
      returnEntity = await this.returnRepo.findById(returnId);
      if (!returnEntity) throw new NotFoundError('Return record not found');

      if (returnEntity.status === 'REFUNDED') {
        const existing = await this.refundRepo.findByReturnId(returnId);
        if (existing) return mapToRefundResponseDTO(existing);
      }

      if (returnEntity.status !== 'REFUND_PENDING' && returnEntity.status !== 'INSPECTED') {
        throw new ConflictError(`Cannot process refund for return in status: ${returnEntity.status}`);
      }

      const existingRefund = await this.refundRepo.findByReturnId(returnId);
      if (existingRefund) {
        if (existingRefund.status === 'COMPLETED') {
          return mapToRefundResponseDTO(existingRefund);
        }
        if (existingRefund.status === 'PROCESSING') {
          throw new ConflictError('A refund for this return is already in progress');
        }
      }

      orderId = returnEntity.orderId;
    }

    if (!orderId) {
      throw new ValidationError('orderId or returnId is required to process a refund');
    }

    // 2. Fetch Order & enforce PAID / PARTIALLY_REFUNDED invariant
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new NotFoundError('Associated order not found');

    if (!['PAID', 'PARTIALLY_REFUNDED'].includes(order.paymentStatus)) {
      throw new ConflictError(`Cannot refund an order with payment status "${order.paymentStatus}"`);
    }

    // 3. Enforce remaining refundable balance (including PROCESSING refunds to block concurrent over-refund)
    const existingOrderRefunds = await this.refundRepo.findByOrderId(order.id);
    const committedAmount = existingOrderRefunds
      .filter((r) => r.status === 'COMPLETED' || r.status === 'PROCESSING')
      .reduce((sum, r) => sum + r.amount, 0);

    const remainingRefundable = Number(Math.max(0, order.totalAmount - committedAmount).toFixed(2));
    if (remainingRefundable <= 0) {
      throw new ConflictError('No refundable balance remaining for this order');
    }

    let requestedAmount = (input as FlexibleProcessRefundDTO).amount;
    if (returnEntity && (requestedAmount === undefined || requestedAmount === null)) {
      const item = order.items.find(
        (i) =>
          i.variantId === returnEntity.orderItemId ||
          i.id === returnEntity.orderItemId ||
          i.productId === returnEntity.orderItemId
      );
      if (!item) throw new NotFoundError('Item snapshot not found in historical order items');

      const itemDiscountPerUnit = item.discount ? item.discount / item.quantity : 0;
      const netUnitPrice = Math.max(0, item.unitPrice - itemDiscountPerUnit);
      requestedAmount = Number((netUnitPrice * returnEntity.quantity).toFixed(2));
    }

    if (typeof requestedAmount !== 'number' || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new ValidationError('Refund amount must be a positive number');
    }

    if (requestedAmount > remainingRefundable) {
      throw new ConflictError(
        `Requested refund ₹${requestedAmount} exceeds remaining refundable balance ₹${remainingRefundable}`
      );
    }

    const finalRefundAmount = Number(requestedAmount.toFixed(2));

    // 4. Payment lookup
    const payment = await this.paymentRepo.findByOrderId(order.id);
    const existingReturnRefund = returnId ? await this.refundRepo.findByReturnId(returnId) : null;

    // 5. Persist PROCESSING lock record BEFORE calling external payment gateway
    let refund: Refund;
    if (existingReturnRefund) {
      existingReturnRefund.markProcessing();
      refund = await this.refundRepo.save(existingReturnRefund);
    } else {
      refund = Refund.create({
        paymentId: payment ? payment.id : null,
        orderId: order.id,
        returnId: returnEntity ? returnEntity.id : null,
        amount: finalRefundAmount,
        paymentMethod: order.paymentMethod,
        gatewayRefundId: null,
        status: 'PROCESSING',
      });
      refund = await this.refundRepo.save(refund);
    }

    const gatewayState = { created: false, gatewayRefundId: null as string | null };
    try {
      return await this.executePostLockRefund({
        refund,
        order,
        payment,
        returnEntity,
        finalRefundAmount,
        reason: (input as FlexibleProcessRefundDTO).reason,
        gatewayState,
      });
    } catch (err: any) {
      if (!gatewayState.created && refund.status !== 'COMPLETED' && refund.status !== 'FAILED') {
        refund.markFailed(err?.message || 'Unexpected error before gateway refund completion');
        await this.refundRepo.save(refund).catch(() => undefined);
      } else if (gatewayState.created && gatewayState.gatewayRefundId && refund.status === 'PROCESSING') {
        const preserved = Refund.reconstitute({
          ...refund.toJSON(),
          gatewayRefundId: gatewayState.gatewayRefundId,
          updatedAt: new Date(),
        });
        await this.refundRepo.save(preserved).catch(() => undefined);
      }
      throw err;
    }
  }

  private async executePostLockRefund(ctx: {
    refund: Refund;
    order: any;
    payment: any;
    returnEntity: any;
    finalRefundAmount: number;
    reason?: string;
    gatewayState: { created: boolean; gatewayRefundId: string | null };
  }): Promise<RefundResponseDTO> {
    let { refund } = ctx;
    const { order, payment, returnEntity, finalRefundAmount, reason, gatewayState } = ctx;

    // 5b. Two-phase post-lock balance check to block simultaneous over-refund races
    const postLockRefunds = await this.refundRepo.findByOrderId(order.id);
    const activeRefunds = postLockRefunds
      .filter((r) => r.status === 'COMPLETED' || r.status === 'PROCESSING')
      .sort((a, b) => {
        const timeDiff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (timeDiff !== 0) return timeDiff;
        return String(a.id).localeCompare(String(b.id));
      });

    const hasSelf = activeRefunds.some((r) => r.id && refund.id && r.id === refund.id);
    const orderedActive = hasSelf ? activeRefunds : [...activeRefunds, refund];

    let cumulativeThroughSelf = 0;
    for (const item of orderedActive) {
      cumulativeThroughSelf = Number((cumulativeThroughSelf + item.amount).toFixed(2));
      if ((refund.id && item.id === refund.id) || item === refund) {
        break;
      }
    }

    if (cumulativeThroughSelf > order.totalAmount) {
      throw new ConflictError(
        `Concurrent refund ₹${finalRefundAmount} exceeds remaining refundable balance for order ₹${order.totalAmount}`
      );
    }

    // 6. Execute REAL Razorpay refund for online payments (NEVER invent fake rfnd_ IDs)
    const isOnlineMethod = ['RAZORPAY', 'CARD', 'UPI', 'NET_BANKING', 'WALLET'].includes(
      String(order.paymentMethod || '').toUpperCase()
    );

    let gatewayRefundId: string | null = null;
    let gatewayStatus: string = 'processed';

    if (isOnlineMethod) {
      const razorpayPaymentId = payment?.transactionId || order.paymentId;
      if (!razorpayPaymentId || !razorpayPaymentId.startsWith('pay_')) {
        throw new ValidationError('Cannot execute Razorpay refund without a valid captured payment ID');
      }

      try {
        const rzRefund = await this.razorpayService.createRefund(
          razorpayPaymentId,
          Math.round(finalRefundAmount * 100),
          {
            orderId: order.id,
            orderNumber: order.orderNumber,
            returnId: returnEntity?.id || 'DIRECT_REFUND',
            reason: reason || 'Admin refund',
          }
        );
        gatewayRefundId = rzRefund?.id || null;
        gatewayStatus = String(rzRefund?.status || 'processed').toLowerCase();
      } catch (rzErr: any) {
        throw new ApplicationError(
          `Razorpay refund failed: ${rzErr?.message || 'Gateway rejected refund request'}`,
          'RAZORPAY_REFUND_FAILED'
        );
      }

      if (!gatewayRefundId || gatewayStatus === 'failed') {
        throw new ApplicationError(
          'Razorpay gateway failed to process refund',
          'RAZORPAY_REFUND_FAILED'
        );
      }
      gatewayState.created = true;
      gatewayState.gatewayRefundId = gatewayRefundId;
    } else {
      // COD manual/bank payout refund reference
      gatewayRefundId = `cod_rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      gatewayStatus = 'processed';
      gatewayState.created = true;
      gatewayState.gatewayRefundId = gatewayRefundId;
    }

    // Handle asynchronous/pending gateway refund cleanly without premature completion
    if (gatewayStatus === 'pending' || gatewayStatus === 'processing') {
      refund = Refund.reconstitute({
        ...refund.toJSON(),
        gatewayRefundId,
        status: 'PROCESSING',
        updatedAt: new Date(),
      });
      refund = await this.refundRepo.save(refund);
      return mapToRefundResponseDTO(refund);
    }

    // 7. Mark Refund COMPLETED and update Payment, Return & Order
    refund.markCompleted(gatewayRefundId);
    refund = await this.refundRepo.save(refund);

    if (payment) {
      payment.addRefund(finalRefundAmount);
      await this.paymentRepo.save(payment);
    }

    if (returnEntity) {
      returnEntity.markRefunded({
        refundId: refund.id,
        refundAmount: finalRefundAmount,
        refundTransactionId: gatewayRefundId,
      });
      await this.returnRepo.save(returnEntity);
    }

    const updatedOrderRefunds = await this.refundRepo.findByOrderId(order.id);
    const completedTotal = updatedOrderRefunds
      .filter((r) => r.status === 'COMPLETED' || r.id === refund.id)
      .reduce((sum, r) => sum + r.amount, 0);

    const nextPaymentStatus = completedTotal >= order.totalAmount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    if (order.paymentStatus !== nextPaymentStatus && order.paymentStatus !== 'REFUNDED') {
      order.updatePaymentStatus(nextPaymentStatus);
    }

    if (returnEntity) {
      const allReturnsForOrder = await this.returnRepo.findByOrderId(order.id);
      const totalReturnedItems = allReturnsForOrder
        .filter((r) => r.status === 'REFUNDED')
        .reduce((sum, r) => sum + r.quantity, 0);
      const totalOrderedItems = order.items.reduce((sum: number, i: { quantity: number }) => sum + i.quantity, 0);
      if (totalReturnedItems >= totalOrderedItems) {
        order.updateStatus('RETURNED', 'All items returned and refunded');
      }
    }

    await this.orderRepo.save(order);

    return mapToRefundResponseDTO(refund);
  }
}

export class GetRefundsByOrderUseCase implements IUseCase<string, RefundResponseDTO[]> {
  constructor(private readonly refundRepo: IRefundRepository) {}

  async execute(orderId: string): Promise<RefundResponseDTO[]> {
    const refunds = await this.refundRepo.findByOrderId(orderId);
    return refunds.map(r => mapToRefundResponseDTO(r));
  }
}
