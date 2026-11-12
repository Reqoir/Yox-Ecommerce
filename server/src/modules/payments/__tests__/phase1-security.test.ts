/**
 * @file phase1-security.test.ts
 * @description Comprehensive Phase 1 Payment & Financial Security Remediation test suite
 * covering SEC-CRIT-001, SEC-CRIT-002, SEC-CRIT-003, SEC-CRIT-004,
 * SEC-HIGH-009, SEC-HIGH-011, and signed Razorpay webhooks.
 */

import crypto from 'crypto';
import express from 'express';
import { PassThrough } from 'stream';

jest.mock('../../notifications/application/services/notification.service', () => ({
  NotificationService: {
    getInstance: jest.fn(() => ({
      notify: jest.fn(async () => {}),
    })),
  },
}));

jest.mock('../../audit-logs/application/services/audit-log.service', () => ({
  AuditLogService: {
    getInstance: jest.fn(() => ({
      record: jest.fn(async () => null),
    })),
  },
}));
import { Order } from '../../orders/domain/entities/order.entity';
import { Cart } from '../../cart/domain/entities/cart.entity';
import { ProductVariant } from '../../products/domain/entities/product-variant.entity';
import { Offer } from '../../offers/domain/entities/offer.entity';
import { Payment, Refund } from '../domain/entities/payment.entity';
import { Return } from '../../returns/domain/entities/return.entity';
import { Shipment } from '../../shipments/domain/entities/shipment.entity';
import { PlaceOrderUseCase, CancelOrderUseCase } from '../../orders/application/use-cases/order.use-cases';
import { CheckoutPricingService } from '../../orders/application/services/checkout-pricing.service';
import {
  CreateRazorpayOrderUseCase,
  VerifyRazorpayPaymentUseCase,
  RecordPaymentFailureUseCase,
} from '../application/use-cases/payment.use-cases';
import {
  HandleRazorpayWebhookUseCase,
  WebhookEventDeduplicator,
} from '../application/use-cases/razorpay-webhook.use-case';
import { HandleShiprocketWebhookUseCase } from '../../shipments/application/use-cases/shipment.use-cases';
import { ProcessRefundUseCase } from '../application/use-cases/refund.use-cases';
import { ProcessRefundDirectUseCase } from '../../returns/application/use-cases/return.use-cases';
import { AtomicStockService } from '../../inventory/application/services/atomic-stock.service';
import { RazorpayService } from '../infrastructure/services/razorpay.service';
import { env } from '@core/infrastructure/config/env';
import { inventoryRouter } from '../../inventory/presentation/routes/inventory.routes';
import { shipmentRouter } from '../../shipments/presentation/routes/shipment.routes';
import { paymentRouter } from '../presentation/routes/payment.routes';
import { errorHandler } from '../../../presentation/http/middleware/error-handler.middleware';

const validShippingAddress = {
  fullName: 'Aarav Sharma',
  phone: '9876543210',
  streetAddress: '42 Marine Drive',
  city: 'Mumbai',
  state: 'Maharashtra',
  country: 'India',
  postalCode: '400001',
};

function createInMemoryHarness() {
  const orders = new Map<string, Order>();
  const payments = new Map<string, Payment>();
  const refunds = new Map<string, Refund>();
  const returns = new Map<string, Return>();
  const shipments = new Map<string, Shipment>();
  const variants = new Map<string, ProductVariant>();
  const carts = new Map<string, Cart>();
  const offers = new Map<string, Offer>();
  const addresses = new Map<string, any>();
  const webhookStates = new Map<string, 'PROCESSING' | 'PROCESSED' | 'FAILED'>();
  let idCounter = 1;
  const nextId = (prefix: string) => `${prefix}-${idCounter++}`;

  const orderRepo: any = {
    save: jest.fn(async (order: Order) => {
      const id = order.id || nextId('ord');
      const saved = Order.reconstitute({ ...order.toJSON(), id });
      orders.set(id, saved);
      return Order.reconstitute(saved.toJSON());
    }),
    findById: jest.fn(async (id: string) => {
      const found = orders.get(id);
      return found ? Order.reconstitute(found.toJSON()) : null;
    }),
    findByOrderNumber: jest.fn(async (num: string) => {
      for (const o of orders.values()) {
        if (o.orderNumber === num) return Order.reconstitute(o.toJSON());
      }
      return null;
    }),
    findByUserId: jest.fn(async (userId: string) => {
      const data = [...orders.values()].filter((o) => o.userId === userId);
      return { data, total: data.length };
    }),
    findAllOrders: jest.fn(async () => ({ data: [...orders.values()], total: orders.size })),
    delete: jest.fn(async (id: string) => orders.delete(id)),
    atomicMarkPaid: jest.fn(async (orderId: string, paymentId: string, confirmedAt?: Date) => {
      const o = orders.get(orderId);
      if (!o || o.paymentStatus !== 'PENDING' || o.orderStatus === 'CANCELLED') return null;
      const updated = Order.reconstitute({
        ...o.toJSON(),
        paymentId,
        paymentStatus: 'PAID',
        orderStatus: o.orderStatus === 'PLACED' ? 'CONFIRMED' : o.orderStatus,
        confirmedAt: o.confirmedAt || confirmedAt || new Date(),
        updatedAt: new Date(),
      });
      orders.set(orderId, updated);
      return updated;
    }),
    atomicMarkPaymentFailed: jest.fn(async (orderId: string, reason: string, userId?: string) => {
      const o = orders.get(orderId);
      if (!o || o.paymentStatus !== 'PENDING' || o.orderStatus !== 'PLACED') return null;
      if (userId && o.userId !== userId) return null;
      const updated = Order.reconstitute({
        ...o.toJSON(),
        paymentStatus: 'FAILED',
        orderStatus: 'CANCELLED',
        cancelledReason: reason,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      });
      orders.set(orderId, updated);
      return updated;
    }),
    atomicCancelOrder: jest.fn(async (orderId: string, params: { reason: string; bankDetails?: any; isAdmin?: boolean }) => {
      const o = orders.get(orderId);
      if (!o) return null;
      const allowed = params.isAdmin
        ? ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY']
        : ['PLACED', 'CONFIRMED'];
      if (!allowed.includes(o.orderStatus)) return null;
      const updated = Order.reconstitute({
        ...o.toJSON(),
        orderStatus: 'CANCELLED',
        cancelledReason: params.reason,
        cancelledAt: new Date(),
        cancellationBankDetails: params.bankDetails ?? o.cancellationBankDetails,
        paymentStatus: o.paymentStatus === 'PAID' ? 'REFUND_PROCESSING' : o.paymentStatus,
        updatedAt: new Date(),
      });
      orders.set(orderId, updated);
      return updated;
    }),
  };

  const paymentRepo: any = {
    save: jest.fn(async (p: Payment) => {
      const id = p.id || nextId('payrec');
      if (p.transactionId) {
        for (const existing of payments.values()) {
          if (existing.id !== id && existing.transactionId === p.transactionId) {
            const dupErr: any = new Error('Duplicate key transactionId');
            dupErr.code = 11000;
            throw dupErr;
          }
        }
      }
      const saved = Payment.reconstitute({ ...p.toJSON(), id });
      payments.set(id, saved);
      return saved;
    }),
    findById: jest.fn(async (id: string) => payments.get(id) ?? null),
    findByOrderId: jest.fn(async (orderId: string) => {
      for (const p of payments.values()) if (p.orderId === orderId) return p;
      return null;
    }),
    findByGatewayOrderId: jest.fn(async (gwOrderId: string) => {
      for (const p of payments.values()) if (p.gatewayOrderId === gwOrderId) return p;
      return null;
    }),
    findByTransactionId: jest.fn(async (txnId: string) => {
      for (const p of payments.values()) if (p.transactionId === txnId) return p;
      return null;
    }),
    atomicMarkPaid: jest.fn(async (params: { orderId: string; gatewayOrderId: string; transactionId: string }) => {
      for (const existing of payments.values()) {
        if (existing.orderId !== params.orderId && existing.transactionId === params.transactionId) {
          const dupErr: any = new Error('E11000 duplicate key error transactionId');
          dupErr.code = 11000;
          throw dupErr;
        }
      }
      for (const [id, p] of payments.entries()) {
        if (
          p.orderId === params.orderId &&
          p.gatewayOrderId === params.gatewayOrderId &&
          ['PENDING', 'FAILED'].includes(p.paymentStatus)
        ) {
          const updated = Payment.reconstitute({
            ...p.toJSON(),
            paymentStatus: 'PAID',
            transactionId: params.transactionId,
            updatedAt: new Date(),
          });
          payments.set(id, updated);
          return updated;
        }
      }
      return null;
    }),
    atomicMarkFailed: jest.fn(async (params: { orderId: string; transactionId?: string }) => {
      for (const [id, p] of payments.entries()) {
        if (p.orderId === params.orderId && p.paymentStatus === 'PENDING') {
          const updated = Payment.reconstitute({
            ...p.toJSON(),
            paymentStatus: 'FAILED',
            transactionId: params.transactionId || p.transactionId,
            updatedAt: new Date(),
          });
          payments.set(id, updated);
          return updated;
        }
      }
      return null;
    }),
  };

  const refundRepo: any = {
    save: jest.fn(async (r: Refund) => {
      const id = r.id || nextId('rfnddoc');
      const saved = Refund.reconstitute({ ...r.toJSON(), id });
      refunds.set(id, saved);
      return Refund.reconstitute(saved.toJSON());
    }),
    findById: jest.fn(async (id: string) => {
      const found = refunds.get(id);
      return found ? Refund.reconstitute(found.toJSON()) : null;
    }),
    findByReturnId: jest.fn(async (returnId: string) => {
      for (const r of refunds.values()) if (r.returnId === returnId) return Refund.reconstitute(r.toJSON());
      return null;
    }),
    findByGatewayRefundId: jest.fn(async (gwId: string) => {
      for (const r of refunds.values()) if (r.gatewayRefundId === gwId) return Refund.reconstitute(r.toJSON());
      return null;
    }),
    findByOrderId: jest.fn(async (orderId: string) =>
      [...refunds.values()].filter((r) => r.orderId === orderId).map((r) => Refund.reconstitute(r.toJSON()))
    ),
  };

  const returnRepo: any = {
    save: jest.fn(async (r: Return) => {
      const id = r.id || nextId('ret');
      const saved = Return.reconstitute({ ...r.toJSON(), id });
      returns.set(id, saved);
      return saved;
    }),
    findById: jest.fn(async (id: string) => returns.get(id) ?? null),
    findByOrderId: jest.fn(async (orderId: string) =>
      [...returns.values()].filter((r) => r.orderId === orderId)
    ),
    findByOrderItemId: jest.fn(async (orderId: string, itemId: string) =>
      [...returns.values()].filter((r) => r.orderId === orderId && r.orderItemId === itemId)
    ),
  };

  const shipmentRepo: any = {
    save: jest.fn(async (s: Shipment) => {
      const id = s.id || nextId('ship');
      const saved = Shipment.reconstitute({ ...s.toJSON(), id });
      shipments.set(id, saved);
      return saved;
    }),
    findByOrderId: jest.fn(async (orderId: string) => {
      for (const s of shipments.values()) if (s.orderId === orderId) return s;
      return null;
    }),
    findByTrackingNumber: jest.fn(async (awb: string) => {
      for (const s of shipments.values()) {
        if (s.trackingNumber === awb || s.awbCode === awb) return s;
      }
      return null;
    }),
  };

  const variantRepo: any = {
    findById: jest.fn(async (id: string) => variants.get(id) ?? null),
    save: jest.fn(async (v: ProductVariant) => {
      variants.set(v.id, v);
      return v;
    }),
    atomicReserveStock: jest.fn(async (variantId: string, qty: number) => {
      const v = variants.get(variantId);
      if (!v || !v.isActive || v.stock < qty) return null;
      const updated = ProductVariant.reconstitute({
        ...v.toJSON(),
        stock: v.stock - qty,
        updatedAt: new Date(),
      });
      variants.set(variantId, updated);
      return updated;
    }),
    atomicReleaseStock: jest.fn(async (variantId: string, qty: number) => {
      const v = variants.get(variantId);
      if (!v) return null;
      const updated = ProductVariant.reconstitute({
        ...v.toJSON(),
        stock: v.stock + qty,
        updatedAt: new Date(),
      });
      variants.set(variantId, updated);
      return updated;
    }),
  };

  const cartRepo: any = {
    findByUserId: jest.fn(async (userId: string) => carts.get(userId) ?? null),
    save: jest.fn(async (cart: Cart) => {
      carts.set(cart.userId, cart);
      return cart;
    }),
  };

  const addressRepo: any = {
    findById: jest.fn(async (id: string) => addresses.get(id) ?? null),
  };

  const offerRepo: any = {
    findById: jest.fn(async (id: string) => {
      const o = offers.get(id);
      return o ? Offer.reconstitute(o.toJSON()) : null;
    }),
    findByCode: jest.fn(async (code: string) => {
      for (const o of offers.values()) {
        if (o.code && o.code.toUpperCase() === code.toUpperCase()) return Offer.reconstitute(o.toJSON());
      }
      return null;
    }),
    atomicIncrementUsage: jest.fn(async (offerId: string) => {
      const o = offers.get(offerId);
      if (!o || !o.isCurrentlyValid()) return null;
      if (o.usageLimit != null && o.usedCount >= o.usageLimit) return null;
      const updated = Offer.reconstitute({
        ...o.toJSON(),
        usedCount: o.usedCount + 1,
        updatedAt: new Date(),
      });
      offers.set(offerId, updated);
      return updated;
    }),
    atomicDecrementUsage: jest.fn(async (offerId: string) => {
      const o = offers.get(offerId);
      if (!o || o.usedCount <= 0) return;
      offers.set(
        offerId,
        Offer.reconstitute({
          ...o.toJSON(),
          usedCount: o.usedCount - 1,
          updatedAt: new Date(),
        })
      );
    }),
  };

  const inventoryRepo: any = {
    findByVariantId: jest.fn(async () => null),
    save: jest.fn(async (inv: any) => inv),
    atomicReserveStock: jest.fn(async () => null),
    atomicReleaseStock: jest.fn(async () => null),
  };

  const stockLogRepo: any = {
    save: jest.fn(async (l: any) => l),
  };

  const deduplicator: WebhookEventDeduplicator = {
    recordIfNew: jest.fn(async (entry) => {
      const key = `${entry.provider}:${entry.eventId}`;
      const existing = webhookStates.get(key);
      if (existing === 'PROCESSING' || existing === 'PROCESSED') return false;
      webhookStates.set(key, 'PROCESSING');
      return true;
    }),
    markProcessed: jest.fn(async (provider, eventId) => {
      webhookStates.set(`${provider}:${eventId}`, 'PROCESSED');
    }),
    markFailed: jest.fn(async (provider, eventId) => {
      webhookStates.set(`${provider}:${eventId}`, 'FAILED');
    }),
  };

  return {
    orders,
    payments,
    refunds,
    returns,
    shipments,
    variants,
    carts,
    offers,
    addresses,
    orderRepo,
    paymentRepo,
    refundRepo,
    returnRepo,
    shipmentRepo,
    variantRepo,
    cartRepo,
    addressRepo,
    offerRepo,
    inventoryRepo,
    stockLogRepo,
    deduplicator,
  };
}

function seedVariant(
  variants: Map<string, ProductVariant>,
  id: string,
  overrides: Partial<{ price: number; stock: number; isActive: boolean; productId: string }> = {}
): ProductVariant {
  const v = ProductVariant.reconstitute({
    id,
    productId: overrides.productId ?? 'prod-1',
    sku: `SKU-${id}`,
    title: 'Classic Oxford Shirt',
    color: 'Navy',
    size: 'M',
    price: overrides.price ?? 1999,
    stock: overrides.stock ?? 10,
    lowStockThreshold: 2,
    images: [],
    isDefault: true,
    isActive: overrides.isActive ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  variants.set(id, v);
  return v;
}

function makePricing(h: ReturnType<typeof createInMemoryHarness>) {
  return new CheckoutPricingService({
    variantRepo: h.variantRepo,
    offerRepo: h.offerRepo,
    getStoreConfig: async () => ({
      maintenanceMode: false,
      codEnabled: true,
      codMaxLimit: 5000,
      isTaxInclusive: true,
      taxRatePercent: 18,
    }),
    countUserCouponUsage: async () => 0,
  });
}

describe('Phase 1: Payment & Financial Security Remediation Suite', () => {
  beforeAll(() => {
    env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID || 'rzp_test_unitkey';
    env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET || 'unit_test_secret_key_12345';
    env.RAZORPAY_WEBHOOK_SECRET = 'unit_test_webhook_secret_12345';
    env.SHIPROCKET_WEBHOOK_SECRET = 'unit_test_shiprocket_secret_12345';
  });

  // ── TASK 1: SEC-CRIT-001 (Payment bypass on order creation) ─────────────────
  it('1. SEC-CRIT-001: Rejects RAZORPAY and unsupported payment methods on POST /orders (PlaceOrderUseCase)', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1500, stock: 5 });

    const useCase = new PlaceOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      makePricing(h)
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          paymentMethod: 'RAZORPAY',
          shippingAddress: validShippingAddress,
          directBuyItem: { variantId: 'var-1', quantity: 1 },
        },
      })
    ).rejects.toThrow(/Razorpay/i);

    await expect(
      useCase.execute({
        userId: 'user-1',
        data: {
          paymentMethod: 'CRYPTO',
          shippingAddress: validShippingAddress,
          directBuyItem: { variantId: 'var-1', quantity: 1 },
        },
      })
    ).rejects.toThrow(/Unsupported payment method/i);

    expect(h.orders.size).toBe(0);
    expect(h.variants.get('var-1')?.stock).toBe(5);
  });

  it('2. SEC-CRIT-001: Ignores client-supplied paymentStatus/paymentId/totalAmount on COD order creation', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1200, stock: 5 });

    const useCase = new PlaceOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      makePricing(h)
    );

    const created = await useCase.execute({
      userId: 'user-1',
      data: {
        paymentMethod: 'COD',
        paymentStatus: 'PAID',
        paymentId: 'pay_spoofed_999',
        totalAmount: 1,
        shippingAddress: validShippingAddress,
        directBuyItem: { variantId: 'var-1', quantity: 2, price: 1 },
      } as any,
    });

    expect(created.paymentMethod).toBe('COD');
    expect(created.paymentStatus).toBe('PENDING');
    expect(created.paymentId).toBeNull();
    expect(created.totalAmount).toBe(2400);
  });

  it('3. SEC-CRIT-001: Order.create defaults online orders to PENDING & updatePaymentStatus blocks illegal transitions', () => {
    const order = Order.create({
      orderNumber: 'YOX-2026-100001',
      userId: 'user-1',
      subtotal: 1000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1000,
      paymentMethod: 'RAZORPAY',
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Shirt',
          sku: 'SKU-1',
          quantity: 1,
          unitPrice: 1000,
          discount: 0,
          subtotal: 1000,
        },
      ],
    });

    expect(order.paymentStatus).toBe('PENDING');
    order.updatePaymentStatus('PAID', 'pay_valid_1');
    order.updatePaymentStatus('REFUNDED');
    expect(() => order.updatePaymentStatus('PENDING')).toThrow(/Invalid payment status transition/);
  });

  it('4. SEC-CRIT-001: PlaceOrderUseCase rejects addressId owned by another customer', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1000, stock: 5 });
    h.addresses.set('addr-victim', {
      id: 'addr-victim',
      userId: 'victim-user',
      fullName: 'Victim',
      phone: '9999999999',
      street: '10 Victim St',
      city: 'Pune',
      state: 'MH',
      country: 'India',
      zipCode: '411001',
    });

    const useCase = new PlaceOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      makePricing(h)
    );

    await expect(
      useCase.execute({
        userId: 'attacker-user',
        data: {
          paymentMethod: 'COD',
          addressId: 'addr-victim',
          directBuyItem: { variantId: 'var-1', quantity: 1 },
        },
      })
    ).rejects.toThrow(/permission/i);
  });

  // ── TASK 2: SEC-CRIT-002 (Server-side pricing & coupon validation) ──────────
  it('5. SEC-CRIT-002: Rejects negative/zero prices and non-positive or fractional quantities', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1000, stock: 5 });

    const pricing = makePricing(h);
    await expect(
      pricing.calculateCheckoutPricing({
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: -2 }],
      })
    ).rejects.toThrow(/positive integer/i);

    await expect(
      pricing.calculateCheckoutPricing({
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1.5 }],
      })
    ).rejects.toThrow(/positive integer/i);

    await expect(
      pricing.calculateCheckoutPricing({
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1, price: -100 }],
      })
    ).rejects.toThrow(/Invalid client price/i);
  });

  it('6. SEC-CRIT-002: CreateRazorpayOrderUseCase ignores stale cart price & uses live DB price for Razorpay amount', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 2499, stock: 5 });

    const cart = Cart.create({ userId: 'user-1', items: [] });
    cart.addItem({ variantId: 'var-1', quantity: 2, price: 1 }); // tampered/stale ₹1 in cart
    h.carts.set('user-1', cart);

    const mockGateway: any = {
      createGatewayOrder: jest.fn(async (input) => ({
        id: 'order_rzp_live_001',
        amount: input.amountInPaise,
        currency: 'INR',
        status: 'created',
      })),
    };

    const createRzp = new CreateRazorpayOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      mockGateway,
      h.paymentRepo,
      makePricing(h)
    );

    const res = await createRzp.execute({
      userId: 'user-1',
      shippingAddress: validShippingAddress,
    });

    expect(mockGateway.createGatewayOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountInPaise: 499800, currency: 'INR' })
    );
    expect(res.amount).toBe(499800);
    expect(h.orders.get(res.orderId)?.totalAmount).toBe(4998);
    expect(h.orders.get(res.orderId)?.paymentStatus).toBe('PENDING');
  });

  it('7. SEC-CRIT-002: Enforces active offer rules (expired, usageLimit, minOrderValue, maxDiscountAmount cap)', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1000, stock: 10 });

    const expiredOffer = Offer.reconstitute({
      id: 'off-exp',
      title: 'Expired',
      code: 'EXPIRED50',
      offerType: 'CELEBRATION',
      discountType: 'PERCENTAGE',
      discountValue: 50,
      applicableProductIds: [],
      applicableCategoryIds: [],
      applicableBrandIds: [],
      isLimitedTime: true,
      endDate: new Date(Date.now() - 86400000),
      priority: 1,
      isActive: true,
    });
    h.offers.set('off-exp', expiredOffer);

    const cappedOffer = Offer.reconstitute({
      id: 'off-cap',
      title: 'Festive 20%',
      code: 'FEST20',
      offerType: 'CELEBRATION',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      minOrderValue: 1500,
      maxDiscountAmount: 300,
      usageLimit: 5,
      usedCount: 1,
      applicableProductIds: [],
      applicableCategoryIds: [],
      applicableBrandIds: [],
      isLimitedTime: false,
      priority: 1,
      isActive: true,
    });
    h.offers.set('off-cap', cappedOffer);

    const pricing = makePricing(h);
    await expect(
      pricing.calculateCheckoutPricing({
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 2 }],
        couponId: 'EXPIRED50',
      })
    ).rejects.toThrow(/expired/i);

    await expect(
      pricing.calculateCheckoutPricing({
        userId: 'user-1',
        items: [{ variantId: 'var-1', quantity: 1 }],
        couponId: 'FEST20',
      })
    ).rejects.toThrow(/Minimum order value/i);

    const priced = await pricing.calculateCheckoutPricing({
      userId: 'user-1',
      items: [{ variantId: 'var-1', quantity: 3 }], // 3000 -> 20% = 600, capped at 300
      couponId: 'FEST20',
    });
    expect(priced.subtotal).toBe(3000);
    expect(priced.discount).toBe(300);
    expect(priced.totalAmount).toBe(2700);
  });

  it('8. SEC-CRIT-002 / SEC-HIGH-009: Releases reserved stock when Razorpay gateway order creation fails', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1500, stock: 4 });

    const failingGateway: any = {
      createGatewayOrder: jest.fn(async () => {
        throw new Error('Razorpay API unreachable');
      }),
    };

    const createRzp = new CreateRazorpayOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      failingGateway,
      h.paymentRepo,
      makePricing(h)
    );

    await expect(
      createRzp.execute({
        userId: 'user-1',
        shippingAddress: validShippingAddress,
        directBuyItem: { variantId: 'var-1', quantity: 2 },
      })
    ).rejects.toThrow(/Razorpay API unreachable/);

    expect(h.variants.get('var-1')?.stock).toBe(4);
    const createdOrder = [...h.orders.values()][0];
    expect(createdOrder?.orderStatus).toBe('CANCELLED');
    expect(createdOrder?.paymentStatus).toBe('FAILED');
  });

  // ── TASK 3: SEC-CRIT-004 (Razorpay verify hardening & replay protection) ────
  function seedPendingRazorpayOrder(
    h: ReturnType<typeof createInMemoryHarness>,
    opts: { orderId?: string; userId?: string; rzpOrderId?: string; totalAmount?: number } = {}
  ) {
    const orderId = opts.orderId ?? 'ord-rzp-1';
    const rzpOrderId = opts.rzpOrderId ?? 'order_rzp_1';
    const totalAmount = opts.totalAmount ?? 1999;
    const order = Order.reconstitute({
      id: orderId,
      orderNumber: `YOX-2026-${orderId}`,
      userId: opts.userId ?? 'user-1',
      subtotal: totalAmount,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Shirt',
          sku: 'SKU-1',
          quantity: 1,
          unitPrice: totalAmount,
          discount: 0,
          subtotal: totalAmount,
        },
      ],
      placedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.orders.set(orderId, order);

    const payDoc = Payment.reconstitute({
      id: `paydoc-${orderId}`,
      orderId,
      userId: opts.userId ?? 'user-1',
      amount: totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      gatewayOrderId: rzpOrderId,
      transactionId: null,
      refundedAmount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.payments.set(payDoc.id, payDoc);
    return { order, payDoc };
  }

  function signRzpCheckout(rzpOrderId: string, rzpPaymentId: string): string {
    return crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${rzpOrderId}|${rzpPaymentId}`)
      .digest('hex');
  }

  it('9. SEC-CRIT-004: Rejects tampered Razorpay HMAC signature', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h);
    const rzpService = new RazorpayService();
    (rzpService as any).fetchPayment = jest.fn();

    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-rzp-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_test_1',
        razorpaySignature: '0'.repeat(64),
      })
    ).rejects.toThrow(/signature/i);
    expect((rzpService as any).fetchPayment).not.toHaveBeenCalled();
  });

  it('10. SEC-CRIT-004: Rejects mismatched Razorpay order_id (cross-order substitution)', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h, { orderId: 'ord-1', rzpOrderId: 'order_rzp_actual' });
    const rzpService = new RazorpayService();
    (rzpService as any).fetchPayment = jest.fn(async () => ({
      id: 'pay_test_1',
      order_id: 'order_rzp_different',
      currency: 'INR',
      status: 'captured',
      amount: 199900,
    }));

    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);

    // Mismatch against stored Payment.gatewayOrderId
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_spoofed',
        razorpayPaymentId: 'pay_test_1',
        razorpaySignature: signRzpCheckout('order_rzp_spoofed', 'pay_test_1'),
      })
    ).rejects.toThrow(/does not match/i);

    // Gateway fetch returns different rzpPayment.order_id
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_actual',
        razorpayPaymentId: 'pay_test_1',
        razorpaySignature: signRzpCheckout('order_rzp_actual', 'pay_test_1'),
      })
    ).rejects.toThrow(/does not belong to the specified Razorpay order/i);
  });

  it('11. SEC-CRIT-004: Rejects non-INR currency and amount mismatch', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h, { orderId: 'ord-1', rzpOrderId: 'order_rzp_1', totalAmount: 1999 });
    const rzpService = new RazorpayService();
    const sig = signRzpCheckout('order_rzp_1', 'pay_1');

    (rzpService as any).fetchPayment = jest.fn().mockResolvedValueOnce({
      id: 'pay_1',
      order_id: 'order_rzp_1',
      currency: 'USD',
      status: 'captured',
      amount: 199900,
    });
    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: sig,
      })
    ).rejects.toThrow(/INR/);

    (rzpService as any).fetchPayment = jest.fn().mockResolvedValueOnce({
      id: 'pay_1',
      order_id: 'order_rzp_1',
      currency: 'INR',
      status: 'captured',
      amount: 100, // tampered partial paise
    });
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_1',
        razorpaySignature: sig,
      })
    ).rejects.toThrow(/amount mismatch/i);
  });

  it('12. SEC-CRIT-004: Rejects merely authorized or pending Razorpay payments (requires captured)', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h, { orderId: 'ord-1', rzpOrderId: 'order_rzp_1', totalAmount: 1999 });
    const rzpService = new RazorpayService();
    (rzpService as any).fetchPayment = jest.fn(async () => ({
      id: 'pay_auth_only',
      order_id: 'order_rzp_1',
      currency: 'INR',
      status: 'authorized',
      amount: 199900,
    }));

    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);
    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_auth_only',
        razorpaySignature: signRzpCheckout('order_rzp_1', 'pay_auth_only'),
      })
    ).rejects.toThrow(/authorized/);

    expect(h.orders.get('ord-1')?.paymentStatus).toBe('PENDING');
  });

  it('13. SEC-CRIT-004: Blocks payment replay of the same razorpayPaymentId across a second order', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h, { orderId: 'ord-A', rzpOrderId: 'order_rzp_A', totalAmount: 1999 });
    seedPendingRazorpayOrder(h, { orderId: 'ord-B', rzpOrderId: 'order_rzp_B', totalAmount: 1999 });

    const rzpService = new RazorpayService();
    (rzpService as any).fetchPayment = jest.fn(async (pid: string) => ({
      id: pid,
      order_id: 'order_rzp_A',
      currency: 'INR',
      status: 'captured',
      amount: 199900,
    }));

    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);
    const paidA = await verify.execute({
      userId: 'user-1',
      orderId: 'ord-A',
      razorpayOrderId: 'order_rzp_A',
      razorpayPaymentId: 'pay_replayed_1',
      razorpaySignature: signRzpCheckout('order_rzp_A', 'pay_replayed_1'),
    });
    expect(paidA.paymentStatus).toBe('PAID');

    await expect(
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-B',
        razorpayOrderId: 'order_rzp_B',
        razorpayPaymentId: 'pay_replayed_1',
        razorpaySignature: signRzpCheckout('order_rzp_B', 'pay_replayed_1'),
      })
    ).rejects.toThrow(/already been used/i);
    expect(h.orders.get('ord-B')?.paymentStatus).toBe('PENDING');
  });

  it('14. SEC-CRIT-004: Handles concurrent duplicate verification atomically and idempotently', async () => {
    const h = createInMemoryHarness();
    seedPendingRazorpayOrder(h, { orderId: 'ord-1', rzpOrderId: 'order_rzp_1', totalAmount: 1999 });
    const cart = Cart.create({ userId: 'user-1', items: [] });
    cart.addItem({ variantId: 'var-1', quantity: 1, price: 1999 });
    h.carts.set('user-1', cart);

    const rzpService = new RazorpayService();
    (rzpService as any).fetchPayment = jest.fn(async () => ({
      id: 'pay_concurrent_1',
      order_id: 'order_rzp_1',
      currency: 'INR',
      status: 'captured',
      amount: 199900,
    }));

    const verify = new VerifyRazorpayPaymentUseCase(h.orderRepo, h.cartRepo, rzpService, h.paymentRepo);
    const sig = signRzpCheckout('order_rzp_1', 'pay_concurrent_1');

    const [res1, res2] = await Promise.all([
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_concurrent_1',
        razorpaySignature: sig,
      }),
      verify.execute({
        userId: 'user-1',
        orderId: 'ord-1',
        razorpayOrderId: 'order_rzp_1',
        razorpayPaymentId: 'pay_concurrent_1',
        razorpaySignature: sig,
      }),
    ]);

    expect(res1.paymentStatus).toBe('PAID');
    expect(res2.paymentStatus).toBe('PAID');
    expect(h.orderRepo.atomicMarkPaid).toHaveBeenCalledTimes(1);
  });

  // ── TASK 4: SEC-CRIT-003 (Shiprocket webhook auth, transitions & COD separation) ─
  it('15. SEC-CRIT-003: Shiprocket webhook rejects missing/invalid x-api-key and empty secret', async () => {
    const h = createInMemoryHarness();
    const webhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);

    await expect(
      webhook.execute({ payload: { order_id: 'YOX-2026-1', current_status: 'DELIVERED' } })
    ).rejects.toThrow(/x-api-key/);

    await expect(
      webhook.execute({
        payload: { order_id: 'YOX-2026-1', current_status: 'DELIVERED' },
        apiKey: 'wrong_key',
      })
    ).rejects.toThrow(/x-api-key/);

    await expect(
      webhook.execute({
        payload: { order_id: 'YOX-2026-1', current_status: 'DELIVERED' },
        apiKey: 'anything',
        expectedSecret: '',
      })
    ).rejects.toThrow(/not configured/);
  });

  it('16. SEC-CRIT-003: Shiprocket webhook blocks invalid jumps & NEVER marks COD orders PAID on delivery', async () => {
    const h = createInMemoryHarness();
    const codOrder = Order.reconstitute({
      id: 'ord-cod-1',
      orderNumber: 'YOX-2026-5001',
      userId: 'user-1',
      subtotal: 1200,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1200,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'SHIPPED',
      shiprocketOrderId: 'SR-9001',
      trackingNumber: 'AWB12345',
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Shirt',
          sku: 'SKU-1',
          quantity: 1,
          unitPrice: 1200,
          discount: 0,
          subtotal: 1200,
        },
      ],
      placedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.orders.set(codOrder.id, codOrder);
    h.shipments.set(
      'ship-1',
      Shipment.reconstitute({
        id: 'ship-1',
        orderId: codOrder.id,
        deliveryPartnerId: 'Delhivery',
        trackingNumber: 'AWB12345',
        awbCode: 'AWB12345',
        shiprocketOrderId: 'SR-9001',
        shiprocketShipmentId: 'SRS-9001',
        status: 'SHIPPED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const webhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);

    // Valid delivery of shipped COD order updates orderStatus to DELIVERED but keeps paymentStatus PENDING
    const res = await webhook.execute({
      apiKey: env.SHIPROCKET_WEBHOOK_SECRET,
      payload: {
        awb: 'AWB12345',
        order_id: 'YOX-2026-5001',
        sr_order_id: 'SR-9001',
        current_status: 'DELIVERED',
        payment_status: 'PAID', // spoofed payment field must be ignored
      },
    });
    expect(res.success).toBe(true);
    expect(h.orders.get('ord-cod-1')?.orderStatus).toBe('DELIVERED');
    expect(h.orders.get('ord-cod-1')?.paymentStatus).toBe('PENDING');

    // Duplicate delivery replay is ignored safely
    const dupRes = await webhook.execute({
      apiKey: env.SHIPROCKET_WEBHOOK_SECRET,
      payload: {
        awb: 'AWB12345',
        order_id: 'YOX-2026-5001',
        sr_order_id: 'SR-9001',
        current_status: 'DELIVERED',
      },
    });
    expect(dupRes.duplicate).toBe(true);

    // Unshipped PLACED order cannot jump straight to DELIVERED
    const placedOrder = Order.reconstitute({
      ...codOrder.toJSON(),
      id: 'ord-placed-2',
      orderNumber: 'YOX-2026-5002',
      orderStatus: 'PLACED',
      trackingNumber: 'AWB999',
    });
    h.orders.set(placedOrder.id, placedOrder);
    h.shipments.set(
      'ship-2',
      Shipment.reconstitute({
        id: 'ship-2',
        orderId: placedOrder.id,
        deliveryPartnerId: 'Delhivery',
        trackingNumber: 'AWB999',
        awbCode: 'AWB999',
        status: 'READY_TO_SHIP',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    await expect(
      webhook.execute({
        apiKey: env.SHIPROCKET_WEBHOOK_SECRET,
        payload: { awb: 'AWB999', order_id: 'YOX-2026-5002', current_status: 'DELIVERED' },
      })
    ).rejects.toThrow(/Cannot deliver order from status: PLACED/);
  });

  // ── TASK 5: SEC-HIGH-009 (Stock races, fail-order replay, inventory ACL) ────
  it('17. SEC-HIGH-009: Concurrent checkout race on stock=1 permits only 1 order and prevents negative stock', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-scarce', { price: 1500, stock: 1 });

    const mockGateway: any = {
      createGatewayOrder: jest.fn(async (input) => ({
        id: `order_rzp_${Math.random()}`,
        amount: input.amountInPaise,
        currency: 'INR',
        status: 'created',
      })),
    };

    const createRzp = new CreateRazorpayOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      mockGateway,
      h.paymentRepo,
      makePricing(h)
    );

    const results = await Promise.allSettled([
      createRzp.execute({
        userId: 'buyer-1',
        shippingAddress: validShippingAddress,
        directBuyItem: { variantId: 'var-scarce', quantity: 1 },
      }),
      createRzp.execute({
        userId: 'buyer-2',
        shippingAddress: validShippingAddress,
        directBuyItem: { variantId: 'var-scarce', quantity: 1 },
      }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(h.variants.get('var-scarce')?.stock).toBe(0);
  });

  it('18. SEC-HIGH-009: Multi-item reservation rolls back earlier items when a later item fails', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-a', { price: 1000, stock: 5 });
    seedVariant(h.variants, 'var-b', { price: 1000, stock: 0 });

    const stockService = new AtomicStockService(h.variantRepo, h.inventoryRepo, h.stockLogRepo, {
      explicitInventoryRepo: true,
      explicitStockLogRepo: true,
    });

    await expect(
      stockService.reserveOrderItems(
        [
          { variantId: 'var-a', quantity: 2 },
          { variantId: 'var-b', quantity: 1 },
        ],
        { reason: 'Test multi-item checkout', reference: 'test-ref' }
      )
    ).rejects.toThrow(/Insufficient stock/i);

    expect(h.variants.get('var-a')?.stock).toBe(5);
    expect(h.variants.get('var-b')?.stock).toBe(0);
  });

  it('19. SEC-HIGH-009: Duplicate/concurrent fail-order releases stock AT MOST ONCE and blocks PAID orders', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1999, stock: 8 }); // 2 reserved out of 10
    const { order } = seedPendingRazorpayOrder(h, { orderId: 'ord-fail-1', totalAmount: 3998 });
    const updatedOrder = Order.reconstitute({
      ...order.toJSON(),
      items: [{ ...order.items[0], variantId: 'var-1', quantity: 2 }],
    });
    h.orders.set('ord-fail-1', updatedOrder);

    const failUseCase = new RecordPaymentFailureUseCase(
      h.orderRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.paymentRepo
    );

    const [f1, f2, f3] = await Promise.all([
      failUseCase.execute({ userId: 'user-1', orderId: 'ord-fail-1', reason: 'Closed modal' }),
      failUseCase.execute({ userId: 'user-1', orderId: 'ord-fail-1', reason: 'Duplicate retry' }),
      failUseCase.execute({ userId: 'user-1', orderId: 'ord-fail-1', reason: 'Third retry' }),
    ]);

    const successes = [f1, f2, f3].filter((r) => r.success);
    expect(successes).toHaveLength(1);
    expect(h.variants.get('var-1')?.stock).toBe(10); // 8 + 2, NEVER 12 or 14

    // Refuses to fail an already PAID order
    seedPendingRazorpayOrder(h, { orderId: 'ord-paid-2', rzpOrderId: 'order_paid_2' });
    await h.orderRepo.atomicMarkPaid('ord-paid-2', 'pay_ok_2');
    const paidFailRes = await failUseCase.execute({ userId: 'user-1', orderId: 'ord-paid-2' });
    expect(paidFailRes.success).toBe(false);
    expect(h.orders.get('ord-paid-2')?.paymentStatus).toBe('PAID');
  });

  it('20. SEC-HIGH-009: Inventory reserve/release routes require manage_inventory permission (blocks customers) & CancelOrder prevents double restore', async () => {
    const reserveLayer = (inventoryRouter as any).stack.find((l: any) => l.route?.path === '/:id/reserve');
    const releaseLayer = (inventoryRouter as any).stack.find((l: any) => l.route?.path === '/:id/release');
    expect(reserveLayer.route.stack.length).toBeGreaterThanOrEqual(3); // requireAuth + requirePermission + controller
    expect(releaseLayer.route.stack.length).toBeGreaterThanOrEqual(3);

    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1000, stock: 7 });
    const order = Order.reconstitute({
      id: 'ord-cancel-1',
      orderNumber: 'YOX-2026-777',
      userId: 'user-1',
      subtotal: 3000,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 3000,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      shippingAddress: validShippingAddress,
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          productName: 'Shirt',
          sku: 'SKU-1',
          quantity: 3,
          unitPrice: 1000,
          discount: 0,
          subtotal: 3000,
        },
      ],
      placedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.orders.set(order.id, order);

    const cancelUseCase = new CancelOrderUseCase(
      h.orderRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.shipmentRepo
    );

    const [c1, c2] = await Promise.allSettled([
      cancelUseCase.execute({ id: 'ord-cancel-1', userId: 'user-1', data: { reason: 'Changed mind' } }),
      cancelUseCase.execute({ id: 'ord-cancel-1', userId: 'user-1', data: { reason: 'Double click' } }),
    ]);
    expect([c1, c2].filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect([c1, c2].filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(h.variants.get('var-1')?.stock).toBe(10); // 7 + 3 ONCE
  });

  // ── TASK 6 & TASK 7: SEC-HIGH-011 + Razorpay Webhook ────────────────────────
  it('21. SEC-HIGH-011: Refunds block unpaid orders, over-refunds, and Razorpay failure (never fakes rfnd_ or marks return REFUNDED)', async () => {
    const h = createInMemoryHarness();
    const { order } = seedPendingRazorpayOrder(h, { orderId: 'ord-ref-1', totalAmount: 2000 });

    const returnReq = Return.reconstitute({
      id: 'ret-1',
      orderId: 'ord-ref-1',
      orderItemId: 'var-1',
      userId: 'user-1',
      quantity: 1,
      reason: 'SIZE_ISSUE',
      status: 'REFUND_PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.returns.set('ret-1', returnReq);

    const mockRzpService: any = {
      createRefund: jest.fn(async () => {
        throw new Error('Gateway 500 timeout');
      }),
    };

    const refundDirect = new ProcessRefundDirectUseCase(
      h.returnRepo,
      h.orderRepo,
      h.paymentRepo,
      h.refundRepo,
      mockRzpService
    );

    // 1. Reject refund on PENDING unpaid order
    await expect(refundDirect.execute({ id: 'ret-1' })).rejects.toThrow(/payment status/i);

    // Transition order & payment to PAID
    await h.paymentRepo.atomicMarkPaid({
      orderId: 'ord-ref-1',
      gatewayOrderId: 'order_rzp_1',
      transactionId: 'pay_real_777',
    });
    await h.orderRepo.atomicMarkPaid('ord-ref-1', 'pay_real_777');

    // 2. Reject over-refund above order total
    await expect(refundDirect.execute({ id: 'ret-1', data: { refundAmount: 2500 } })).rejects.toThrow(
      /exceeds remaining refundable balance/i
    );

    // 3. Razorpay failure throws, saves FAILED refund record, and leaves Return in REFUND_PENDING (NOT REFUNDED!)
    await expect(refundDirect.execute({ id: 'ret-1', data: { refundAmount: 1000 } })).rejects.toThrow(
      /Razorpay refund failed/i
    );
    expect(h.returns.get('ret-1')?.status).toBe('REFUND_PENDING');
    expect(h.refunds.get([...h.refunds.keys()][0])?.status).toBe('FAILED');
    expect(h.refunds.get([...h.refunds.keys()][0])?.gatewayRefundId).toBeNull();

    // 4. Subsequent legitimate retry succeeds via real gateway
    mockRzpService.createRefund.mockResolvedValueOnce({
      id: 'rfnd_real_9001',
      paymentId: 'pay_real_777',
      amount: 100000,
      status: 'processed',
    });
    const successRet = await refundDirect.execute({ id: 'ret-1', data: { refundAmount: 1000 } });
    expect(successRet.status).toBe('REFUNDED');
    expect(successRet.refundTransactionId).toBe('rfnd_real_9001');
    expect(h.orders.get(order.id)?.paymentStatus).toBe('PARTIALLY_REFUNDED');

    // 5. Direct ProcessRefundUseCase blocks issuing another refund exceeding remaining ₹1000 balance
    const directRefundUseCase = new ProcessRefundUseCase(
      h.refundRepo,
      h.paymentRepo,
      h.returnRepo,
      h.orderRepo,
      mockRzpService
    );
    await expect(
      directRefundUseCase.execute({ orderId: 'ord-ref-1', amount: 1200 })
    ).rejects.toThrow(/exceeds remaining refundable balance/i);
  });

  it('22. Task 7: Razorpay webhook verifies raw-body HMAC, deduplicates, captures payments, and finalizes async pending refunds', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-1', { price: 1999, stock: 9 });
    seedPendingRazorpayOrder(h, { orderId: 'ord-wh-1', rzpOrderId: 'order_wh_1', totalAmount: 1999 });

    const rzpService = new RazorpayService();
    const webhook = new HandleRazorpayWebhookUseCase(
      h.orderRepo,
      h.cartRepo,
      h.paymentRepo,
      h.refundRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      rzpService,
      h.returnRepo,
      h.deduplicator
    );

    const signWebhook = (raw: string) =>
      crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');

    // Rejects invalid signature
    const capturedBody = JSON.stringify({
      id: 'evt_cap_1',
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_wh_captured_1',
            order_id: 'order_wh_1',
            amount: 199900,
            currency: 'INR',
            status: 'captured',
          },
        },
      },
    });
    await expect(
      webhook.execute({ rawBody: Buffer.from(capturedBody), signature: 'bad_sig' })
    ).rejects.toThrow(/Invalid Razorpay webhook signature/);

    // Processes valid payment.captured webhook
    const capRes = await webhook.execute({
      rawBody: Buffer.from(capturedBody),
      signature: signWebhook(capturedBody),
      eventIdHeader: 'evt_cap_1',
    });
    expect(capRes.received).toBe(true);
    expect(h.orders.get('ord-wh-1')?.paymentStatus).toBe('PAID');

    // Duplicate eventId is ignored
    const dupRes = await webhook.execute({
      rawBody: Buffer.from(capturedBody),
      signature: signWebhook(capturedBody),
      eventIdHeader: 'evt_cap_1',
    });
    expect(dupRes.duplicate).toBe(true);

    // Handles async pending refund -> completed via refund.processed webhook
    const returnReq = Return.reconstitute({
      id: 'ret-wh-1',
      orderId: 'ord-wh-1',
      orderItemId: 'var-1',
      userId: 'user-1',
      quantity: 1,
      reason: 'DAMAGED',
      status: 'REFUND_PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.returns.set('ret-wh-1', returnReq);
    (rzpService as any).createRefund = jest.fn(async () => ({
      id: 'rfnd_async_77',
      paymentId: 'pay_wh_captured_1',
      amount: 199900,
      status: 'pending',
    }));

    const refundDirect = new ProcessRefundDirectUseCase(
      h.returnRepo,
      h.orderRepo,
      h.paymentRepo,
      h.refundRepo,
      rzpService
    );
    const pendingRes = await refundDirect.execute({ id: 'ret-wh-1', data: { refundAmount: 1999 } });
    expect(pendingRes.status).toBe('REFUND_PENDING'); // not prematurely completed while gateway status=pending

    const refundBody = JSON.stringify({
      id: 'evt_rfnd_1',
      event: 'refund.processed',
      payload: {
        refund: {
          entity: {
            id: 'rfnd_async_77',
            payment_id: 'pay_wh_captured_1',
            amount: 199900,
            status: 'processed',
          },
        },
      },
    });
    await webhook.execute({
      rawBody: Buffer.from(refundBody),
      signature: signWebhook(refundBody),
      eventIdHeader: 'evt_rfnd_1',
    });
    expect(h.returns.get('ret-wh-1')?.status).toBe('REFUNDED');
    expect(h.orders.get('ord-wh-1')?.paymentStatus).toBe('REFUNDED');
  });

  it('23. Webhook processing failures mark event FAILED, allow safe retry without double-counting, and block duplicate after success', async () => {
    const h = createInMemoryHarness();
    const webhookSecret = 'whsec_retry_test_secret';
    env.RAZORPAY_WEBHOOK_SECRET = webhookSecret;
    const signWebhook = (raw: string) =>
      crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');

    const order = Order.reconstitute({
      id: 'ord-retry-1',
      orderNumber: 'YOX-2026-RT1',
      userId: 'user-1',
      subtotal: 1999,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1999,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PAID',
      paymentId: 'pay_retry_1',
      orderStatus: 'DELIVERED',
      shippingAddress: validShippingAddress,
      items: [{ id: 'i1', productId: 'p1', variantId: 'v1', productName: 'Shirt', sku: 'SKU-1', quantity: 1, unitPrice: 1999, discount: 0, subtotal: 1999 }],
      placedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.orders.set('ord-retry-1', order);
    h.payments.set(
      'pay-retry-1',
      Payment.reconstitute({
        id: 'pay-retry-1',
        orderId: 'ord-retry-1',
        userId: 'user-1',
        amount: 1999,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        transactionId: 'pay_retry_1',
        gatewayOrderId: 'order_retry_1',
        refundedAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.refunds.set(
      'rfnd-retry-1',
      Refund.reconstitute({
        id: 'rfnd-retry-1',
        paymentId: 'pay-retry-1',
        orderId: 'ord-retry-1',
        returnId: 'ret-retry-1',
        amount: 1999,
        paymentMethod: 'RAZORPAY',
        gatewayRefundId: 'rfnd_retry_gw_1',
        status: 'PROCESSING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.returns.set(
      'ret-retry-1',
      Return.reconstitute({
        id: 'ret-retry-1',
        orderId: 'ord-retry-1',
        orderItemId: 'v1',
        userId: 'user-1',
        quantity: 1,
        reason: 'DEFECTIVE',
        status: 'REFUND_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const rzpWebhook = new HandleRazorpayWebhookUseCase(
      h.orderRepo,
      h.cartRepo,
      h.paymentRepo,
      h.refundRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      new RazorpayService(),
      h.returnRepo,
      h.deduplicator,
      h.offerRepo
    );

    // Simulate transient DB write failure on orderRepo.save AFTER paymentRepo.save succeeded
    h.orderRepo.save.mockRejectedValueOnce(new Error('Transient MongoDB timeout'));
    const refundBody = JSON.stringify({
      id: 'evt_retry_rfnd_1',
      event: 'refund.processed',
      payload: { refund: { entity: { id: 'rfnd_retry_gw_1', amount: 199900, status: 'processed' } } },
    });

    await expect(
      rzpWebhook.execute({
        rawBody: Buffer.from(refundBody),
        signature: signWebhook(refundBody),
        eventIdHeader: 'evt_retry_rfnd_1',
      })
    ).rejects.toThrow('Transient MongoDB timeout');
    expect(h.deduplicator.markFailed).toHaveBeenCalledWith('RAZORPAY', 'evt_retry_rfnd_1', 'Transient MongoDB timeout');

    // Retry succeeds and does NOT double-count payment.refundedAmount
    const retryRes = await rzpWebhook.execute({
      rawBody: Buffer.from(refundBody),
      signature: signWebhook(refundBody),
      eventIdHeader: 'evt_retry_rfnd_1',
    });
    expect(retryRes.duplicate).toBeUndefined();
    expect(h.payments.get('pay-retry-1')?.refundedAmount).toBe(1999);
    expect(h.orders.get('ord-retry-1')?.paymentStatus).toBe('REFUNDED');
    expect(h.returns.get('ret-retry-1')?.status).toBe('REFUNDED');

    // Replay after success is ignored as duplicate
    const afterSuccess = await rzpWebhook.execute({
      rawBody: Buffer.from(refundBody),
      signature: signWebhook(refundBody),
      eventIdHeader: 'evt_retry_rfnd_1',
    });
    expect(afterSuccess.duplicate).toBe(true);

    // Same safe retry behavior for Shiprocket webhook
    const shipOrder = Order.reconstitute({
      id: 'ord-sr-retry',
      orderNumber: 'YOX-2026-SRR1',
      userId: 'user-1',
      subtotal: 1999,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 1999,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      orderStatus: 'SHIPPED',
      shiprocketOrderId: '991100',
      trackingNumber: 'AWB-RETRY-1',
      shippingAddress: validShippingAddress,
      items: [],
      placedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    h.orders.set('ord-sr-retry', shipOrder);
    h.shipments.set(
      'ship-sr-retry',
      Shipment.reconstitute({
        id: 'ship-sr-retry',
        orderId: 'ord-sr-retry',
        deliveryPartnerId: 'Delhivery',
        trackingNumber: 'AWB-RETRY-1',
        awbCode: 'AWB-RETRY-1',
        shiprocketShipmentId: '881100',
        status: 'SHIPPED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const srWebhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);
    h.orderRepo.save.mockRejectedValueOnce(new Error('Transient Shiprocket save error'));

    const srPayload = { awb: 'AWB-RETRY-1', order_id: 'YOX-2026-SRR1', current_status: 'OUT FOR DELIVERY' };
    await expect(
      srWebhook.execute({ payload: srPayload, apiKey: 'sr-sec', expectedSecret: 'sr-sec', eventId: 'evt_sr_retry_1' })
    ).rejects.toThrow('Transient Shiprocket save error');

    const srRetryOk = await srWebhook.execute({
      payload: srPayload,
      apiKey: 'sr-sec',
      expectedSecret: 'sr-sec',
      eventId: 'evt_sr_retry_1',
    });
    expect(srRetryOk.success).toBe(true);
    expect(srRetryOk.duplicate).toBeUndefined();
    expect(h.orders.get('ord-sr-retry')?.orderStatus).toBe('OUT_FOR_DELIVERY');
    expect(h.orders.get('ord-sr-retry')?.paymentStatus).toBe('PENDING');

    const srDup = await srWebhook.execute({
      payload: srPayload,
      apiKey: 'sr-sec',
      expectedSecret: 'sr-sec',
      eventId: 'evt_sr_retry_1',
    });
    expect(srDup.duplicate).toBe(true);
  });

  it('24. Stale-order cleanup racing concurrently with VerifyRazorpayPayment never leaves paid + stock-released inconsistent state', async () => {
    const h = createInMemoryHarness();
    const initialVariant = seedVariant(h.variants, 'var-race', { price: 1500, stock: 5 });
    expect(initialVariant.stock).toBe(5);
    h.variants.set(
      'var-race',
      ProductVariant.reconstitute({ ...initialVariant.toJSON(), stock: 4 })
    ); // 1 unit locked for ord-stale

    h.orders.set(
      'ord-stale',
      Order.reconstitute({
        id: 'ord-stale',
        orderNumber: 'YOX-2026-STALE1',
        userId: 'user-race',
        subtotal: 1500,
        discount: 0,
        shippingCharge: 0,
        tax: 0,
        totalAmount: 1500,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        notes: 'DIRECT_BUY',
        shippingAddress: validShippingAddress,
        items: [{ id: 'i1', productId: 'prod-1', variantId: 'var-race', productName: 'Shirt', sku: 'SKU-RACE', quantity: 1, unitPrice: 1500, discount: 0, subtotal: 1500 }],
        placedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.payments.set(
      'pay-stale',
      Payment.reconstitute({
        id: 'pay-stale',
        orderId: 'ord-stale',
        userId: 'user-race',
        amount: 1500,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PENDING',
        gatewayOrderId: 'order_rzp_stale',
        refundedAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const rzpKeySecret = 'rzp_test_stale_secret';
    env.RAZORPAY_KEY_SECRET = rzpKeySecret;
    const rzpService = new RazorpayService();
    (rzpService as any).createGatewayOrder = jest.fn(async ({ amountInPaise }: any) => ({
      id: 'order_rzp_fresh_2',
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'rcpt_fresh',
    }));
    (rzpService as any).fetchPayment = jest.fn(async (id: string) => ({
      id,
      order_id: 'order_rzp_stale',
      status: 'captured',
      currency: 'INR',
      amount: 150000,
    }));

    const sig = crypto
      .createHmac('sha256', rzpKeySecret)
      .update('order_rzp_stale|pay_stale_1')
      .digest('hex');

    const createNewCheckout = new CreateRazorpayOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      rzpService,
      h.paymentRepo,
      new CheckoutPricingService({ variantRepo: h.variantRepo, offerRepo: h.offerRepo }),
      undefined,
      h.offerRepo
    );
    const verifyOldCheckout = new VerifyRazorpayPaymentUseCase(
      h.orderRepo,
      h.cartRepo,
      rzpService,
      h.paymentRepo
    );

    await Promise.allSettled([
      createNewCheckout.execute({
        userId: 'user-race',
        shippingAddress: validShippingAddress,
        directBuyItem: { variantId: 'var-race', quantity: 1 },
      }),
      verifyOldCheckout.execute({
        userId: 'user-race',
        orderId: 'ord-stale',
        razorpayOrderId: 'order_rzp_stale',
        razorpayPaymentId: 'pay_stale_1',
        razorpaySignature: sig,
      }),
    ]);

    const staleAfter = h.orders.get('ord-stale')!;
    const stockAfter = h.variants.get('var-race')!.stock;

    // Stale order either got cancelled cleanly (releasing 1 -> 5, minus 1 for fresh order = 4)
    // OR got paid cleanly (not released -> 5 starting from 4 minus 1 for fresh order = 3).
    if (staleAfter.orderStatus === 'CANCELLED') {
      expect(staleAfter.paymentStatus).toBe('FAILED');
      expect(stockAfter).toBe(4);
    } else {
      expect(staleAfter.paymentStatus).toBe('PAID');
      expect(stockAfter).toBe(3);
    }
  });

  it('25. Simultaneous refund requests exceeding remaining balance block over-refund and clean up failed PROCESSING locks', async () => {
    const h = createInMemoryHarness();
    h.orders.set(
      'ord-conc-rfnd',
      Order.reconstitute({
        id: 'ord-conc-rfnd',
        orderNumber: 'YOX-2026-CRF1',
        userId: 'user-1',
        subtotal: 2000,
        discount: 0,
        shippingCharge: 0,
        tax: 0,
        totalAmount: 2000,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        paymentId: 'pay_conc_1',
        orderStatus: 'DELIVERED',
        shippingAddress: validShippingAddress,
        items: [
          { id: 'i1', productId: 'p1', variantId: 'v1', productName: 'Shirt', sku: 'SKU-V1', quantity: 1, unitPrice: 1200, discount: 0, subtotal: 1200 },
          { id: 'i2', productId: 'p2', variantId: 'v2', productName: 'Jeans', sku: 'SKU-V2', quantity: 1, unitPrice: 800, discount: 0, subtotal: 800 },
        ],
        placedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.payments.set(
      'pay-conc-1',
      Payment.reconstitute({
        id: 'pay-conc-1',
        orderId: 'ord-conc-rfnd',
        userId: 'user-1',
        amount: 2000,
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        transactionId: 'pay_conc_1',
        gatewayOrderId: 'order_conc_1',
        refundedAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.returns.set(
      'ret-conc-1',
      Return.reconstitute({
        id: 'ret-conc-1',
        orderId: 'ord-conc-rfnd',
        orderItemId: 'v1',
        userId: 'user-1',
        quantity: 1,
        reason: 'DEFECTIVE',
        status: 'REFUND_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.returns.set(
      'ret-conc-2',
      Return.reconstitute({
        id: 'ret-conc-2',
        orderId: 'ord-conc-rfnd',
        orderItemId: 'v2',
        userId: 'user-1',
        quantity: 1,
        reason: 'DEFECTIVE',
        status: 'REFUND_PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const rzpService = new RazorpayService();
    let gwCallCount = 0;
    (rzpService as any).createRefund = jest.fn(async (_pid: string, amountInPaise: number) => ({
      id: `rfnd_conc_${++gwCallCount}`,
      paymentId: 'pay_conc_1',
      amount: amountInPaise,
      status: 'processed',
    }));

    const processRefund = new ProcessRefundUseCase(
      h.refundRepo,
      h.paymentRepo,
      h.returnRepo,
      h.orderRepo,
      rzpService
    );

    // Two concurrent requests (₹1200 + ₹1000 = ₹2200 > ₹2000 paid)
    const results = await Promise.allSettled([
      processRefund.execute({ returnId: 'ret-conc-1', amount: 1200 }),
      processRefund.execute({ returnId: 'ret-conc-2', amount: 1000 }),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(gwCallCount).toBe(1);

    // Rejected lock must NOT remain stuck in PROCESSING
    const allRefunds = [...h.refunds.values()];
    expect(allRefunds.some((r) => r.status === 'PROCESSING')).toBe(false);
    expect(allRefunds.some((r) => r.status === 'FAILED')).toBe(true);
    const totalCompleted = allRefunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((s, r) => s + r.amount, 0);
    expect(totalCompleted).toBeLessThanOrEqual(2000);
  });

  it('26. Rejects all illegal Payment, Refund, and Order payment state transitions', () => {
    const pendingOrder = Order.create({
      orderNumber: 'YOX-2026-TRN1',
      userId: 'user-1',
      subtotal: 500,
      discount: 0,
      shippingCharge: 0,
      tax: 0,
      totalAmount: 500,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      shippingAddress: validShippingAddress,
      items: [{ id: 'i1', productId: 'p1', variantId: 'v1', productName: 'Shirt', sku: 'SKU-T1', quantity: 1, unitPrice: 500, discount: 0, subtotal: 500 }],
    });
    expect(() => pendingOrder.updatePaymentStatus('REFUNDED')).toThrow(/Invalid payment status transition/);

    const refundedOrder = Order.reconstitute({ ...pendingOrder.toJSON(), id: 'ord-r1', paymentStatus: 'REFUNDED' });
    expect(() => refundedOrder.updatePaymentStatus('PAID')).toThrow(/Invalid payment status transition/);

    const unpaidPayment = Payment.create({
      orderId: 'ord-1',
      userId: 'user-1',
      amount: 500,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
    });
    expect(() => unpaidPayment.addRefund(100)).toThrow(/Cannot add refund/);

    const paidPayment = Payment.reconstitute({ ...unpaidPayment.toJSON(), id: 'pay-1', paymentStatus: 'PAID' });
    expect(() => paidPayment.addRefund(0)).toThrow(/positive/);
    expect(() => paidPayment.addRefund(600)).toThrow(/exceeds remaining refundable limit/);

    const activeRefund = Refund.create({
      orderId: 'ord-1',
      returnId: null,
      amount: 200,
      paymentMethod: 'RAZORPAY',
      status: 'PROCESSING',
    });
    expect(() => activeRefund.markProcessing()).toThrow(/Cannot transition a PROCESSING refund/);
    activeRefund.markFailed('Failed');
    expect(() => activeRefund.markCompleted('rfnd_x')).toThrow(/Cannot mark a FAILED refund directly as COMPLETED/);
    activeRefund.markProcessing();
    activeRefund.markCompleted('rfnd_y');
    expect(() => activeRefund.markCompleted('rfnd_z')).toThrow(/already COMPLETED/);
  });

  it('27. Enforces offer usageLimit under concurrent checkouts, perUserLimit, inactive offers, minOrderValue, and ignores client discount', async () => {
    const h = createInMemoryHarness();
    seedVariant(h.variants, 'var-offer', { price: 1000, stock: 10 });

    const now = new Date();
    h.offers.set(
      'off-limited',
      Offer.reconstitute({
        id: 'off-limited',
        title: 'Flash Single Use',
        code: 'FLASH1',
        offerType: 'CELEBRATION',
        discountType: 'PERCENTAGE',
        discountValue: 20, // 20%
        minOrderValue: 500,
        maxDiscountAmount: 150, // capped at ₹150
        applicableProductIds: [],
        applicableCategoryIds: [],
        applicableBrandIds: [],
        isLimitedTime: true,
        startDate: new Date(now.getTime() - 60_000),
        endDate: new Date(now.getTime() + 60_000),
        priority: 1,
        isActive: true,
        usageLimit: 1,
        usedCount: 0,
        perUserLimit: 1,
        createdAt: now,
        updatedAt: now,
      })
    );
    h.offers.set(
      'off-inactive',
      Offer.reconstitute({
        id: 'off-inactive',
        title: 'Disabled Offer',
        code: 'DISABLED',
        offerType: 'CELEBRATION',
        discountType: 'FLAT',
        discountValue: 300,
        applicableProductIds: [],
        applicableCategoryIds: [],
        applicableBrandIds: [],
        isLimitedTime: false,
        priority: 1,
        isActive: false,
        usageLimit: null,
        usedCount: 0,
        perUserLimit: null,
        createdAt: now,
        updatedAt: now,
      })
    );

    const pricingService = new CheckoutPricingService({
      variantRepo: h.variantRepo,
      offerRepo: h.offerRepo,
      countUserCouponUsage: async (uid, cid) =>
        [...h.orders.values()].filter(
          (o) => o.userId === uid && o.couponId === cid && o.orderStatus !== 'CANCELLED' && o.paymentStatus !== 'FAILED'
        ).length,
    });

    const placeOrder = new PlaceOrderUseCase(
      h.orderRepo,
      h.cartRepo,
      h.variantRepo,
      h.inventoryRepo,
      h.stockLogRepo,
      h.addressRepo,
      pricingService
    );

    // Concurrent checkouts competing for usageLimit = 1
    const raceResults = await Promise.allSettled([
      placeOrder.execute({
        userId: 'user-a',
        data: {
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          couponId: 'FLASH1',
          discount: 9999, // client attempt to spoof discount
          totalAmount: 1,
          directBuyItem: { variantId: 'var-offer', quantity: 1, price: 1 },
        } as any,
      }),
      placeOrder.execute({
        userId: 'user-b',
        data: {
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          couponId: 'FLASH1',
          directBuyItem: { variantId: 'var-offer', quantity: 1 },
        } as any,
      }),
    ]);

    const won = raceResults.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const lost = raceResults.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
    expect(won).toHaveLength(1);
    expect(lost).toHaveLength(1);
    // Max discount capped at ₹150 despite 20% of 1000 = ₹200 and spoofed discount=9999
    expect(won[0].value.discount).toBe(150);
    expect(won[0].value.totalAmount).toBe(850);
    // Loser's reserved stock rolled back: 10 - 1 = 9 remaining
    expect(h.variants.get('var-offer')?.stock).toBe(9);
    expect(h.offers.get('off-limited')?.usedCount).toBe(1);

    // Per-user limit rejection on unlimited-global coupon
    h.offers.set(
      'off-peruser',
      Offer.reconstitute({
        ...h.offers.get('off-limited')!.toJSON(),
        id: 'off-peruser',
        code: 'ONCEUSER',
        usageLimit: 100,
        usedCount: 0,
        perUserLimit: 1,
      })
    );
    await placeOrder.execute({
      userId: 'user-c',
      data: {
        paymentMethod: 'COD',
        shippingAddress: validShippingAddress,
        couponId: 'ONCEUSER',
        directBuyItem: { variantId: 'var-offer', quantity: 1 },
      } as any,
    });
    await expect(
      placeOrder.execute({
        userId: 'user-c',
        data: {
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          couponId: 'ONCEUSER',
          directBuyItem: { variantId: 'var-offer', quantity: 1 },
        } as any,
      })
    ).rejects.toThrow(/per-user usage limit/);

    // Inactive coupon rejected
    await expect(
      placeOrder.execute({
        userId: 'user-d',
        data: {
          paymentMethod: 'COD',
          shippingAddress: validShippingAddress,
          couponId: 'DISABLED',
          directBuyItem: { variantId: 'var-offer', quantity: 1 },
        } as any,
      })
    ).rejects.toThrow(/expired or is no longer active/);
  });

  it('28. Shiprocket webhook rejects spoofed sr_order_id or shipment_id linking to wrong order', async () => {
    const h = createInMemoryHarness();
    h.orders.set(
      'ord-sr-spoof',
      Order.reconstitute({
        id: 'ord-sr-spoof',
        orderNumber: 'YOX-2026-SRS1',
        userId: 'user-1',
        subtotal: 1200,
        discount: 0,
        shippingCharge: 0,
        tax: 0,
        totalAmount: 1200,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'SHIPPED',
        shiprocketOrderId: 'SR-REAL-100',
        trackingNumber: 'AWB-REAL-100',
        shippingAddress: validShippingAddress,
        items: [],
        placedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
    h.shipments.set(
      'ship-sr-spoof',
      Shipment.reconstitute({
        id: 'ship-sr-spoof',
        orderId: 'ord-sr-spoof',
        deliveryPartnerId: 'Delhivery',
        trackingNumber: 'AWB-REAL-100',
        awbCode: 'AWB-REAL-100',
        shiprocketOrderId: 'SR-REAL-100',
        shiprocketShipmentId: 'SHIP-REAL-100',
        status: 'SHIPPED',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    const srWebhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);
    await expect(
      srWebhook.execute({
        payload: {
          awb: 'AWB-REAL-100',
          order_id: 'YOX-2026-SRS1',
          sr_order_id: 'SR-ATTACKER-999',
          current_status: 'DELIVERED',
        },
        apiKey: 'sr-secret',
        expectedSecret: 'sr-secret',
        eventId: 'evt_sr_spoof_1',
      })
    ).rejects.toThrow(/order ID mismatch/i);

    await expect(
      srWebhook.execute({
        payload: {
          awb: 'AWB-REAL-100',
          order_id: 'YOX-2026-SRS1',
          shipment_id: 'SHIP-ATTACKER-999',
          current_status: 'DELIVERED',
        },
        apiKey: 'sr-secret',
        expectedSecret: 'sr-secret',
        eventId: 'evt_sr_spoof_2',
      })
    ).rejects.toThrow(/shipment ID mismatch/i);

    expect(h.orders.get('ord-sr-spoof')?.orderStatus).toBe('SHIPPED');
  });

  it('29. Missing webhook secrets reject webhook calls with UnauthorizedError and do not leak secret details', async () => {
    const h = createInMemoryHarness();
    const prevRzpWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;
    env.RAZORPAY_WEBHOOK_SECRET = '';
    try {
      const rzpWebhook = new HandleRazorpayWebhookUseCase(
        h.orderRepo,
        h.cartRepo,
        h.paymentRepo,
        h.refundRepo,
        h.variantRepo,
        h.inventoryRepo,
        h.stockLogRepo,
        new RazorpayService(),
        h.returnRepo,
        h.deduplicator
      );
      await expect(
        rzpWebhook.execute({
          rawBody: Buffer.from(JSON.stringify({ event: 'payment.captured' })),
          signature: 'any_sig',
        })
      ).rejects.toThrow('Invalid Razorpay webhook signature');
    } finally {
      env.RAZORPAY_WEBHOOK_SECRET = prevRzpWebhookSecret;
    }

    const srWebhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);
    await expect(
      srWebhook.execute({
        payload: { awb: 'AWB-1', current_status: 'DELIVERED' },
        apiKey: 'anything',
        expectedSecret: '',
      })
    ).rejects.toThrow('Shiprocket webhook secret is not configured');
  });

  it('30. Shiprocket webhook {} test ping succeeds only with valid x-api-key and rejects invalid/missing keys with 401', async () => {
    const h = createInMemoryHarness();
    const recordSpy = jest.spyOn(h.deduplicator, 'recordIfNew');
    const srWebhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);

    await expect(
      srWebhook.execute({
        payload: {},
        apiKey: '',
        expectedSecret: 'sr-test-secret',
      })
    ).rejects.toThrow(/Invalid or missing Shiprocket webhook x-api-key/);

    await expect(
      srWebhook.execute({
        payload: {},
        apiKey: 'wrong-secret',
        expectedSecret: 'sr-test-secret',
      })
    ).rejects.toThrow(/Invalid or missing Shiprocket webhook x-api-key/);

    const pingRes = await srWebhook.execute({
      payload: {},
      apiKey: 'sr-test-secret',
      expectedSecret: 'sr-test-secret',
    });
    expect(pingRes).toEqual({
      success: true,
      message: 'Shiprocket webhook connectivity verified',
    });
    expect(recordSpy).not.toHaveBeenCalled();
  });

  it('31. Shiprocket sample payloads with nullable/empty optional fields and extra courier fields pass schema without 422', async () => {
    const h = createInMemoryHarness();
    const srWebhook = new HandleShiprocketWebhookUseCase(h.shipmentRepo, h.orderRepo, h.deduplicator);

    // Sample payload with null optional fields, empty current_status, extra fields (etd, is_return)
    const sampleRes = await srWebhook.execute({
      payload: {
        awb: '14589237465',
        order_id: 'ORD-SAMPLE-2026',
        sr_order_id: null,
        shipment_id: null,
        current_status: 'OUT FOR DELIVERY',
        shipment_status: 'Out For Delivery',
        courier_name: null,
        current_timestamp: '2026-11-12 19:30:00',
        etd: '2026-11-15 18:00:00',
        is_return: 0,
        scans: null,
      },
      apiKey: 'sr-secret',
      expectedSecret: 'sr-secret',
      eventId: 'evt_sr_sample_nullable',
    });
    expect(sampleRes.success).toBe(false);
    expect(sampleRes.message).toMatch(/not found in database/i);

    // Sample with empty identifiers + null scans/status still acts as authenticated ping (200)
    const emptyIdsRes = await srWebhook.execute({
      payload: {
        awb: '',
        order_id: null,
        current_status: '',
        courier_name: null,
        scans: null,
      },
      apiKey: 'sr-secret',
      expectedSecret: 'sr-secret',
    });
    expect(emptyIdsRes.success).toBe(true);
  });

  it('32. Express webhook routes: /webhook/courier & /webhook/razorpay precede requireAuth and enforce HTTP 401 vs 200', async () => {
    const srStack = (shipmentRouter as any).stack;
    const courierIdx = srStack.findIndex((l: any) => l.route?.path === '/webhook/courier');
    const legacySrIdx = srStack.findIndex((l: any) => l.route?.path === '/webhook/shiprocket');
    const srAuthIdx = srStack.findIndex((l: any) => !l.route && l.name === 'requireAuth');
    expect(courierIdx).toBeGreaterThanOrEqual(0);
    expect(legacySrIdx).toBeGreaterThanOrEqual(0);
    expect(srAuthIdx).toBeGreaterThan(courierIdx);
    expect(srAuthIdx).toBeGreaterThan(legacySrIdx);

    const payStack = (paymentRouter as any).stack;
    const rzpIdx = payStack.findIndex((l: any) => l.route?.path === '/webhook/razorpay');
    const payAuthIdx = payStack.findIndex((l: any) => !l.route && l.name === 'requireAuth');
    expect(rzpIdx).toBeGreaterThanOrEqual(0);
    expect(payAuthIdx).toBeGreaterThan(rzpIdx);

    const app = express();
    app.use(express.json());
    app.use('/api/v1/shipments', shipmentRouter);
    app.use('/api/v1/payments', paymentRouter);
    app.use(errorHandler);

    const prevSrSecret = env.SHIPROCKET_WEBHOOK_SECRET;
    env.SHIPROCKET_WEBHOOK_SECRET = 'shiprocket-live-test-key';

    const dispatch = (path: string, headers: Record<string, string>, payload: unknown) =>
      new Promise<{ status: number; body: any }>((resolve, reject) => {
        const raw = Buffer.from(JSON.stringify(payload), 'utf8');
        const reqStream = new PassThrough();
        const fakeSocket: any = Object.assign(new PassThrough(), {
          remoteAddress: '127.0.0.1',
        });
        const req: any = Object.assign(reqStream, {
          method: 'POST',
          url: path,
          originalUrl: path,
          headers: {
            'content-type': 'application/json',
            'content-length': String(raw.length),
            ...headers,
          },
          socket: fakeSocket,
          connection: fakeSocket,
        });
        reqStream.end(raw);

        const resHeaders: Record<string, string | string[]> = {};
        const chunks: Buffer[] = [];
        const resStream = new PassThrough();
        const res: any = Object.assign(resStream, {
          statusCode: 200,
          locals: {},
          headersSent: false,
          setHeader(name: string, val: string | string[]) {
            resHeaders[name.toLowerCase()] = val;
            return this;
          },
          getHeader(name: string) {
            return resHeaders[name.toLowerCase()];
          },
          removeHeader(name: string) {
            delete resHeaders[name.toLowerCase()];
          },
          get(name: string) {
            return resHeaders[name.toLowerCase()];
          },
          writeHead(code: number) {
            this.statusCode = code;
            return this;
          },
          write(chunk: any) {
            if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            return true;
          },
          end(chunk?: any) {
            if (chunk && typeof chunk !== 'function') {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
            }
            this.headersSent = true;
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ status: this.statusCode, body: text ? JSON.parse(text) : null });
            return this;
          },
        });

        (app as any)(req, res, (err: any) => {
          if (err) reject(err);
        });
      });

    try {
      const missingKeyRes = await dispatch('/api/v1/shipments/webhook/courier', {}, {});
      expect(missingKeyRes.status).toBe(401);
      expect(missingKeyRes.body.message).toMatch(/Invalid or missing Shiprocket webhook x-api-key/);

      const badKeyRes = await dispatch(
        '/api/v1/shipments/webhook/courier',
        { 'x-api-key': 'wrong-key' },
        {}
      );
      expect(badKeyRes.status).toBe(401);

      const okPingRes = await dispatch(
        '/api/v1/shipments/webhook/courier',
        { 'x-api-key': 'shiprocket-live-test-key' },
        {}
      );
      expect(okPingRes.status).toBe(200);
      expect(okPingRes.body.success).toBe(true);
    } finally {
      env.SHIPROCKET_WEBHOOK_SECRET = prevSrSecret;
    }
  });
});

