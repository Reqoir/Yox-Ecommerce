/**
 * @file payment.use-cases.ts
 * @layer Application › Use Cases
 * @description Secure Razorpay Order Creation & Verification Use Cases
 */

import mongoose from 'mongoose';
import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import {
  ConflictError,
  ForbiddenError,
} from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IAddressRepository } from '../../../addresses/domain/repositories/address.repository.interface';
import { Order, ShippingAddressSnapshot } from '../../../orders/domain/entities/order.entity';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentRepository } from '../../domain/repositories/payment.repository.interface';
import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { AtomicStockService } from '../../../inventory/application/services/atomic-stock.service';
import { CheckoutPricingService } from '../../../orders/application/services/checkout-pricing.service';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { OrderModel } from '../../../orders/infrastructure/models/order.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { RazorpayService } from '../../infrastructure/services/razorpay.service';
import { env } from '@core/infrastructure/config/env';
import { mapToOrderResponseDTO } from '../../../orders/application/use-cases/order.use-cases';
import { OrderResponseDTO } from '../../../orders/application/dtos/order.dto';
import { IOfferRepository } from '../../../offers/domain/repositories/offer.repository.interface';
import { OfferRepository } from '../../../offers/infrastructure/repositories/offer.repository';

export interface CreateRazorpayOrderInputDTO {
  userId: string;
  addressId?: string;
  shippingAddress?: ShippingAddressSnapshot;
  notes?: string;
  couponId?: string;
  directBuyItem?: {
    variantId: string;
    quantity: number;
    price?: number;
  };
}

export interface CreateRazorpayOrderResponseDTO {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number; // in paise
  currency: string;
  keyId: string;
}

export interface VerifyRazorpayPaymentInputDTO {
  userId: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface RecordPaymentFailureInputDTO {
  userId: string;
  orderId: string;
  razorpayPaymentId?: string;
  reason?: string;
}

export class CreateRazorpayOrderUseCase implements IUseCase<CreateRazorpayOrderInputDTO, CreateRazorpayOrderResponseDTO> {
  private readonly paymentRepo: IPaymentRepository;
  private readonly hasExplicitPaymentRepo: boolean;
  private readonly pricingService: CheckoutPricingService;
  private readonly atomicStockService: AtomicStockService;
  private readonly offerRepo?: IOfferRepository;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    variantRepo: IProductVariantRepository,
    inventoryRepo: IInventoryRepository,
    stockLogRepo: IStockLogRepository,
    private readonly addressRepo: IAddressRepository,
    private readonly razorpayService: RazorpayService,
    paymentRepo?: IPaymentRepository,
    pricingService?: CheckoutPricingService,
    atomicStockService?: AtomicStockService,
    offerRepo?: IOfferRepository
  ) {
    this.hasExplicitPaymentRepo = Boolean(paymentRepo);
    this.paymentRepo = paymentRepo ?? new PaymentRepository();
    this.offerRepo = offerRepo ?? (mongoose.connection.readyState === 1 ? new OfferRepository() : undefined);
    this.pricingService = pricingService ?? new CheckoutPricingService({ variantRepo, offerRepo: this.offerRepo });
    this.atomicStockService =
      atomicStockService ??
      new AtomicStockService(variantRepo, inventoryRepo, stockLogRepo, {
        explicitInventoryRepo: true,
        explicitStockLogRepo: true,
      });
  }

  async execute(input: CreateRazorpayOrderInputDTO): Promise<CreateRazorpayOrderResponseDTO> {
    const { userId, addressId, shippingAddress: rawShippingAddress, notes, couponId, directBuyItem } = input;

    // 0. Clean up stale unpaid Razorpay checkout sessions atomically before stock checks
    if (mongoose.connection.readyState === 1) {
      try {
        const stalePendingOrders = await OrderModel.find({
          userId: userId,
          paymentMethod: 'RAZORPAY',
          paymentStatus: 'PENDING',
          orderStatus: 'PLACED',
        }).exec();

        for (const staleDoc of stalePendingOrders) {
          const claimed = await OrderModel.findOneAndUpdate(
            {
              _id: staleDoc._id,
              paymentStatus: 'PENDING',
              orderStatus: 'PLACED',
            },
            {
              $set: {
                orderStatus: 'CANCELLED',
                paymentStatus: 'FAILED',
                cancelledReason: 'Superseded by new checkout attempt',
                cancelledAt: new Date(),
                updatedAt: new Date(),
              },
            },
            { new: true }
          ).exec();

          if (!claimed) continue;

          await this.atomicStockService.releaseOrderItems(
            (claimed.items || []).map((i: any) => ({
              variantId: i.variantId,
              quantity: i.quantity,
              productName: i.productName,
            })),
            {
              reason: `Stock released from superseded Razorpay session #${claimed.orderNumber}`,
              reference: claimed._id.toString(),
            }
          );

          if (typeof this.paymentRepo.atomicMarkFailed === 'function') {
            await this.paymentRepo.atomicMarkFailed({ orderId: claimed._id.toString() });
          }

          if (claimed.couponId) {
            await this.pricingService.releaseCouponClaim(String(claimed.couponId));
          }
        }
      } catch (cleanupErr) {
        console.warn('Notice cleaning up stale pending orders:', cleanupErr);
      }
    } else if (
      typeof this.orderRepo.findByUserId === 'function' &&
      typeof this.orderRepo.atomicMarkPaymentFailed === 'function'
    ) {
      const userOrders = await this.orderRepo.findByUserId(userId, { limit: 50, page: 1 }).catch(() => null);
      const staleOrders = (userOrders?.data || []).filter(
        (o) => o.paymentMethod === 'RAZORPAY' && o.paymentStatus === 'PENDING' && o.orderStatus === 'PLACED'
      );

      for (const stale of staleOrders) {
        const claimed = await this.orderRepo.atomicMarkPaymentFailed(
          stale.id,
          'Superseded by new checkout attempt',
          userId
        );
        if (!claimed) continue;

        await this.atomicStockService.releaseOrderItems(
          claimed.items.map((i) => ({
            variantId: i.variantId,
            quantity: i.quantity,
            productName: i.productName,
          })),
          {
            reason: `Stock released from superseded Razorpay session #${claimed.orderNumber}`,
            reference: claimed.id,
          }
        );

        if (typeof this.paymentRepo.atomicMarkFailed === 'function') {
          await this.paymentRepo.atomicMarkFailed({ orderId: claimed.id });
        }

        if (claimed.couponId) {
          await this.pricingService.releaseCouponClaim(claimed.couponId);
        }
      }
    }

    // 1. Resolve items & coupon
    let itemsToProcess: { variantId: string; quantity: unknown; price?: unknown }[] = [];
    let isDirectBuy = false;
    let couponToApply: string | null = couponId || null;

    if (directBuyItem && directBuyItem.variantId) {
      isDirectBuy = true;
      itemsToProcess = [{
        variantId: directBuyItem.variantId,
        quantity: directBuyItem.quantity,
        price: directBuyItem.price,
      }];
    } else {
      const userCart = await this.cartRepo.findByUserId(userId);
      if (!userCart || userCart.items.length === 0) {
        throw new ValidationError('Your shopping cart is empty');
      }
      itemsToProcess = userCart.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));
      if (!couponToApply && userCart.couponId) {
        couponToApply = userCart.couponId;
      }
    }

    // 2. Resolve Shipping Address & Enforce Ownership
    let shippingAddress: ShippingAddressSnapshot | null = null;
    if (addressId) {
      const address = await this.addressRepo.findById(addressId);
      if (!address) {
        throw new NotFoundError('Selected delivery address not found');
      }
      if (address.userId && address.userId !== userId) {
        throw new ForbiddenError('You do not have permission to use this delivery address');
      }
      shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: (address as any).street || (address as any).streetAddress || '',
        city: address.city,
        state: address.state,
        country: address.country || 'India',
        postalCode: (address as any).zipCode || (address as any).postalCode || '',
      };
    } else if (rawShippingAddress && rawShippingAddress.streetAddress && rawShippingAddress.postalCode) {
      shippingAddress = { ...rawShippingAddress };
    }

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.postalCode) {
      throw new ValidationError('A complete delivery address is required for checkout');
    }

    // 3. SEC-CRIT-002: Authoritative database pricing & coupon calculation
    const pricing = await this.pricingService.calculateCheckoutPricing({
      userId,
      items: itemsToProcess,
      couponId: couponToApply,
    });

    if (pricing.totalAmount <= 0) {
      throw new ValidationError('Online payment order total must be greater than zero');
    }

    // 4. SEC-HIGH-009: Atomic multi-item stock reservation
    const orderNumber = `YOX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const reservationItems = pricing.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      productName: i.productName,
    }));

    await this.atomicStockService.reserveOrderItems(reservationItems, {
      reason: 'Stock locked for Razorpay checkout session',
      reference: orderNumber,
    });

    let couponClaimed = false;
    let savedOrder: Order | null = null;
    try {
      if (pricing.couponId) {
        couponClaimed = await this.pricingService.atomicClaimCoupon(pricing.couponId);
      }

      const order = Order.create({
        orderNumber,
        userId,
        couponId: pricing.couponId,
        paymentId: null,
        subtotal: pricing.subtotal,
        discount: pricing.discount,
        shippingCharge: pricing.shippingCharge,
        tax: pricing.tax,
        totalAmount: pricing.totalAmount,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        notes: isDirectBuy ? 'DIRECT_BUY' : (notes || null),
        shippingAddress,
        items: pricing.items,
      });

      savedOrder = await this.orderRepo.save(order);

      const amountInPaise = Math.round(pricing.totalAmount * 100);
      const rzpOrder = await this.razorpayService.createGatewayOrder({
        amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${savedOrder.orderNumber}`,
        notes: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          userId,
        },
      });

      if (this.hasExplicitPaymentRepo || mongoose.connection.readyState === 1) {
        const payment = Payment.create({
          orderId: savedOrder.id,
          userId,
          amount: pricing.totalAmount,
          paymentMethod: 'RAZORPAY',
          paymentStatus: 'PENDING',
          gatewayOrderId: rzpOrder.id,
        });
        await this.paymentRepo.save(payment);
      }

      return {
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      // Compensating rollback: release stock, coupon claim, and fail pending order if gateway or payment record creation fails
      if (couponClaimed && pricing.couponId) {
        await this.pricingService.releaseCouponClaim(pricing.couponId);
      }
      if (savedOrder) {
        if (typeof this.orderRepo.atomicMarkPaymentFailed === 'function') {
          await this.orderRepo.atomicMarkPaymentFailed(savedOrder.id, 'Payment initialization failed').catch(() => undefined);
        } else {
          savedOrder.updatePaymentStatus('FAILED');
          savedOrder.cancel({ reason: 'Payment initialization failed', isAdmin: true });
          await this.orderRepo.save(savedOrder).catch(() => undefined);
        }
      }
      await this.atomicStockService
        .releaseOrderItems(reservationItems, {
          reason: 'Rollback after Razorpay order initialization failure',
          reference: savedOrder?.id || orderNumber,
        })
        .catch(() => undefined);
      throw error;
    }
  }
}

export class VerifyRazorpayPaymentUseCase implements IUseCase<VerifyRazorpayPaymentInputDTO, OrderResponseDTO> {
  private readonly paymentRepo: IPaymentRepository;
  private readonly hasExplicitPaymentRepo: boolean;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly razorpayService: RazorpayService,
    paymentRepo?: IPaymentRepository
  ) {
    this.hasExplicitPaymentRepo = Boolean(paymentRepo);
    this.paymentRepo = paymentRepo ?? new PaymentRepository();
  }

  async execute(input: VerifyRazorpayPaymentInputDTO): Promise<OrderResponseDTO> {
    const { userId, orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // 1. Fetch Order from DB & verify ownership
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    if (order.userId !== userId) {
      throw new ForbiddenError('Unauthorized: Order does not belong to the current authenticated user');
    }
    if (order.paymentMethod !== 'RAZORPAY') {
      throw new ValidationError('Only Razorpay orders can be verified here');
    }

    // Idempotent handling when already PAID with the SAME payment ID
    if (order.paymentStatus === 'PAID') {
      if (order.paymentId && order.paymentId !== razorpayPaymentId) {
        throw new ConflictError('Order has already been paid with a different Razorpay payment ID');
      }
      return mapToOrderResponseDTO(order);
    }

    if (order.orderStatus === 'CANCELLED' || order.paymentStatus !== 'PENDING') {
      throw new ConflictError(
        `Cannot verify payment for order in status ${order.orderStatus} (${order.paymentStatus})`
      );
    }

    // 2. SEC-CRIT-004: Verify gatewayOrderId & block payment replay across orders
    const canQueryPayments = this.hasExplicitPaymentRepo || mongoose.connection.readyState === 1;
    let paymentRecord: Payment | null = null;
    if (canQueryPayments) {
      paymentRecord = await this.paymentRepo.findByOrderId(order.id);
      if (!paymentRecord || paymentRecord.gatewayOrderId !== razorpayOrderId) {
        throw new ValidationError('Razorpay order ID does not match this internal order');
      }
      if (typeof this.paymentRepo.findByTransactionId === 'function') {
        const existingTxn = await this.paymentRepo.findByTransactionId(razorpayPaymentId);
        if (existingTxn && existingTxn.orderId !== order.id) {
          throw new ConflictError('This Razorpay payment ID has already been used for another order');
        }
      }
    }

    // 3. Cryptographically Verify Signature with timing-safe HMAC SHA-256
    const isValidSignature = this.razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      throw new ValidationError('Invalid Razorpay payment signature. Payment verification failed.');
    }

    // 4. Secondary Gateway Verification: Fetch payment directly from Razorpay
    const rzpPayment = await this.razorpayService.fetchPayment(razorpayPaymentId);

    if (rzpPayment.order_id !== razorpayOrderId) {
      throw new ValidationError('Razorpay payment does not belong to the specified Razorpay order ID');
    }
    if (String(rzpPayment.currency || '').toUpperCase() !== 'INR') {
      throw new ValidationError(`Invalid payment currency "${rzpPayment.currency}". Only INR is accepted.`);
    }
    // Strict capture check: authorized/pending/created payments are NOT captured funds
    if (rzpPayment.status !== 'captured') {
      throw new ValidationError(`Payment verification failed: Razorpay payment status is "${rzpPayment.status}"`);
    }

    const expectedAmountInPaise = Math.round(order.totalAmount * 100);
    if (Number(rzpPayment.amount) !== expectedAmountInPaise) {
      throw new ValidationError(
        `Payment amount mismatch: Expected ₹${order.totalAmount} (${expectedAmountInPaise} paise) but paid ${Number(rzpPayment.amount)} paise`
      );
    }

    // 5. Atomic Payment & Order Updates (concurrency + replay safe)
    if (canQueryPayments && paymentRecord) {
      try {
        if (typeof this.paymentRepo.atomicMarkPaid === 'function') {
          const updatedPayment = await this.paymentRepo.atomicMarkPaid({
            orderId: order.id,
            gatewayOrderId: razorpayOrderId,
            transactionId: razorpayPaymentId,
          });
          if (!updatedPayment) {
            const latestPayment = await this.paymentRepo.findByOrderId(order.id);
            if (latestPayment?.paymentStatus === 'PAID' && latestPayment.transactionId === razorpayPaymentId) {
              const latestOrder = await this.orderRepo.findById(order.id);
              if (latestOrder && latestOrder.paymentStatus === 'PAID') {
                return mapToOrderResponseDTO(latestOrder);
              }
            } else {
              throw new ConflictError('Payment record could not be transitioned cleanly');
            }
          }
        } else {
          const updatedPayment = Payment.reconstitute({
            ...paymentRecord.toJSON(),
            paymentStatus: 'PAID',
            transactionId: razorpayPaymentId,
            updatedAt: new Date(),
          });
          await this.paymentRepo.save(updatedPayment);
        }
      } catch (err: any) {
        if (err?.code === 11000) {
          throw new ConflictError('Duplicate Razorpay payment ID detected');
        }
        throw err;
      }
    }

    let savedOrder: Order | null = null;
    if (typeof this.orderRepo.atomicMarkPaid === 'function') {
      savedOrder = await this.orderRepo.atomicMarkPaid(order.id, razorpayPaymentId);
      if (!savedOrder) {
        const latestOrder = await this.orderRepo.findById(order.id);
        if (latestOrder?.paymentStatus === 'PAID' && latestOrder.paymentId === razorpayPaymentId) {
          return mapToOrderResponseDTO(latestOrder);
        }
        throw new ConflictError('Order payment state changed concurrently and could not be finalized');
      }
    } else {
      order.updatePaymentStatus('PAID', razorpayPaymentId);
      savedOrder = await this.orderRepo.save(order);
    }

    // 6. Clear user cart (only for cart checkout, not for direct buy)
    if (savedOrder.notes !== 'DIRECT_BUY') {
      try {
        const userCart = await this.cartRepo.findByUserId(userId);
        if (userCart) {
          userCart.clear();
          await this.cartRepo.save(userCart);
        }
      } catch {}
    }

    // 7. Audit Log
    try {
      AuditLogService.getInstance()?.record({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: AuditAction.ORDER_CREATED,
        resourceType: 'ORDER',
        resourceId: savedOrder.id,
        description: `Payment verified & Order #${savedOrder.orderNumber} confirmed for ₹${savedOrder.totalAmount} (Txn: ${razorpayPaymentId})`,
        after: { orderNumber: savedOrder.orderNumber, totalAmount: savedOrder.totalAmount, paymentStatus: 'PAID' },
      });
    } catch {}

    // 8. Admin Notification
    const itemCount = savedOrder.items.reduce((s, i) => s + i.quantity, 0);
    let customerName = 'A customer';
    if (mongoose.connection.readyState === 1) {
      try {
        const u = await UserModel.findById(userId).select('fullName').lean();
        if (u?.fullName) customerName = u.fullName as string;
      } catch {}
    }

    try {
      await NotificationService.getInstance().notify({
        userId: null,
        type: 'NEW_ORDER',
        title: '💳 Online Payment Received',
        message: `${customerName} paid ₹${savedOrder.totalAmount} via Razorpay for Order #${savedOrder.orderNumber}`,
        metadata: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          totalAmount: savedOrder.totalAmount,
          itemCount,
          paymentId: razorpayPaymentId,
        },
      });
    } catch {}

    return mapToOrderResponseDTO(savedOrder);
  }
}

export class RecordPaymentFailureUseCase implements IUseCase<RecordPaymentFailureInputDTO, { success: boolean; message: string }> {
  private readonly paymentRepo: IPaymentRepository;
  private readonly hasExplicitPaymentRepo: boolean;
  private readonly atomicStockService: AtomicStockService;
  private readonly offerRepo?: IOfferRepository;

  constructor(
    private readonly orderRepo: IOrderRepository,
    variantRepo: IProductVariantRepository,
    inventoryRepo: IInventoryRepository,
    stockLogRepo: IStockLogRepository,
    paymentRepo?: IPaymentRepository,
    atomicStockService?: AtomicStockService,
    offerRepo?: IOfferRepository
  ) {
    this.hasExplicitPaymentRepo = Boolean(paymentRepo);
    this.paymentRepo = paymentRepo ?? new PaymentRepository();
    this.offerRepo = offerRepo ?? (mongoose.connection.readyState === 1 ? new OfferRepository() : undefined);
    this.atomicStockService =
      atomicStockService ??
      new AtomicStockService(variantRepo, inventoryRepo, stockLogRepo, {
        explicitInventoryRepo: true,
        explicitStockLogRepo: true,
      });
  }

  async execute(input: RecordPaymentFailureInputDTO): Promise<{ success: boolean; message: string }> {
    const { userId, orderId, razorpayPaymentId, reason } = input;
    let order = await this.orderRepo.findById(orderId);
    if (!order) order = await this.orderRepo.findByOrderNumber(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    if (order.userId !== userId) {
      throw new ForbiddenError('Unauthorized: Order does not belong to the current authenticated user');
    }
    if (order.paymentMethod !== 'RAZORPAY') {
      throw new ValidationError('Only Razorpay orders can be marked as payment-failed here');
    }

    if (order.paymentStatus === 'PAID') {
      return { success: false, message: 'Order has already been paid' };
    }
    if (order.paymentStatus !== 'PENDING' || order.orderStatus !== 'PLACED') {
      return { success: false, message: 'Order payment failure has already been processed' };
    }

    // SEC-HIGH-009: Transition order status ATOMICALLY BEFORE releasing stock so concurrent/duplicate calls cannot double-release
    const failureReason = reason || 'Payment was declined or cancelled by customer';
    let claimedOrder: Order | null = null;
    if (typeof this.orderRepo.atomicMarkPaymentFailed === 'function') {
      claimedOrder = await this.orderRepo.atomicMarkPaymentFailed(order.id, failureReason, userId);
    } else {
      order.updatePaymentStatus('FAILED');
      order.cancel({ reason: failureReason, isAdmin: true });
      claimedOrder = await this.orderRepo.save(order);
    }

    if (!claimedOrder) {
      return { success: false, message: 'Order payment state changed or already failed' };
    }

    // Only the winning caller reaches stock restoration and payment failure update
    await this.atomicStockService.releaseOrderItems(
      claimedOrder.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        productName: i.productName,
      })),
      {
        reason: `Stock released from failed Razorpay checkout for Order #${claimedOrder.orderNumber}`,
        reference: claimedOrder.id,
      }
    );

    if (this.hasExplicitPaymentRepo || mongoose.connection.readyState === 1) {
      if (typeof this.paymentRepo.atomicMarkFailed === 'function') {
        await this.paymentRepo.atomicMarkFailed({
          orderId: claimedOrder.id,
          transactionId: razorpayPaymentId || undefined,
        });
      }
    }

    if (claimedOrder.couponId && this.offerRepo?.atomicDecrementUsage) {
      await this.offerRepo.atomicDecrementUsage(claimedOrder.couponId).catch(() => undefined);
    }

    return { success: true, message: 'Order marked as failed and stock released' };
  }
}

