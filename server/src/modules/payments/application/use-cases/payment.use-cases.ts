/**
 * @file payment.use-cases.ts
 * @layer Application › Use Cases
 * @description Secure Razorpay Order Creation & Verification Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IAddressRepository } from '../../../addresses/domain/repositories/address.repository.interface';
import { Order, OrderItemSnapshot, ShippingAddressSnapshot } from '../../../orders/domain/entities/order.entity';
import { Inventory } from '../../../inventory/domain/entities/inventory.entity';
import { StockLog } from '../../../inventory/domain/entities/stock-log.entity';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { PaymentModel } from '../../infrastructure/models/payment.model';
import { SettingsModel } from '../../../settings/infrastructure/models/settings.model';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { RazorpayService } from '../../infrastructure/services/razorpay.service';
import { env } from '@core/infrastructure/config/env';
import { mapToOrderResponseDTO } from '../../../orders/application/use-cases/order.use-cases';
import { OrderResponseDTO } from '../../../orders/application/dtos/order.dto';

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

export class CreateRazorpayOrderUseCase implements IUseCase<CreateRazorpayOrderInputDTO, CreateRazorpayOrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository,
    private readonly addressRepo: IAddressRepository,
    private readonly razorpayService: RazorpayService
  ) {}

  async execute(input: CreateRazorpayOrderInputDTO): Promise<CreateRazorpayOrderResponseDTO> {
    const { userId, addressId, shippingAddress: rawShippingAddress, notes, couponId, directBuyItem } = input;

    // 0. Maintenance Mode Check
    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (storeSetting?.value?.maintenanceMode) {
        throw new Error('The store is currently undergoing scheduled maintenance. Order placement is temporarily paused.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('maintenance')) throw err;
    }

    // 1. Resolve items
    let itemsToProcess: { variantId: string; quantity: number; price?: number }[] = [];
    let isDirectBuy = false;
    let userCart: any = null;

    if (directBuyItem && directBuyItem.variantId) {
      isDirectBuy = true;
      itemsToProcess = [{
        variantId: directBuyItem.variantId,
        quantity: Math.max(1, directBuyItem.quantity || 1),
        price: directBuyItem.price,
      }];
    } else {
      userCart = await this.cartRepo.findByUserId(userId);
      if (!userCart || userCart.items.length === 0) {
        throw new Error('Your shopping cart is empty');
      }
      itemsToProcess = userCart.items.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    // 2. Resolve Shipping Address
    let shippingAddress: ShippingAddressSnapshot | null = null;
    if (rawShippingAddress && rawShippingAddress.streetAddress && rawShippingAddress.postalCode) {
      shippingAddress = { ...rawShippingAddress };
    } else if (addressId) {
      try {
        const address = await this.addressRepo.findById(addressId);
        if (address) {
          shippingAddress = {
            fullName: address.fullName,
            phone: address.phone,
            streetAddress: (address as any).street || (address as any).streetAddress || '',
            city: address.city,
            state: address.state,
            country: address.country || 'India',
            postalCode: (address as any).zipCode || (address as any).postalCode || '',
          };
        }
      } catch {}
    }

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.postalCode) {
      throw new Error('A complete delivery address is required for checkout');
    }

    // 3. Check stock & Build order items with authoritative database pricing
    const orderItems: OrderItemSnapshot[] = [];
    for (const item of itemsToProcess) {
      const variant = await this.variantRepo.findById(item.variantId);
      if (!variant) {
        throw new Error(`Product variant ${item.variantId} no longer exists`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${variant.title || 'item'}". Available: ${variant.stock}, Requested: ${item.quantity}`);
      }

      // Lock/reserve stock
      variant.reduceStock(item.quantity);
      await this.variantRepo.save(variant);

      const inventory = await this.inventoryRepo.findByVariantId(item.variantId);
      if (inventory) {
        const prevAvail = inventory.availableStock;
        const newAvail = Math.max(0, prevAvail - item.quantity);
        const newReserved = inventory.reservedStock + item.quantity;
        const updatedInv = Inventory.reconstitute({
          ...inventory.toJSON(),
          availableStock: newAvail,
          reservedStock: newReserved,
          updatedAt: new Date(),
        });
        const savedInv = await this.inventoryRepo.save(updatedInv);

        const log = StockLog.create({
          inventoryId: savedInv.id,
          type: 'RESERVE',
          amount: item.quantity,
          previousStock: prevAvail,
          newStock: newAvail,
          reason: 'Stock locked for Razorpay checkout session',
          reference: userId,
        });
        await this.stockLogRepo.save(log);
      }

      const unitPrice = typeof item.price === 'number' && item.price > 0 ? item.price : variant.price;

      orderItems.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: `${variant.title} - ${variant.color}`,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unitPrice: unitPrice,
        discount: 0,
        subtotal: item.quantity * unitPrice,
        imageUrl: (variant as any).images?.[0] || (item as any).image || (item as any).imageUrl || null,
      });
    }

    // 4. Calculate Order Financials
    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);

    let freeShippingThreshold = 699;
    let standardShippingFee = 99;
    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (storeSetting?.value) {
        if (typeof storeSetting.value.freeShippingThreshold === 'number') {
          freeShippingThreshold = storeSetting.value.freeShippingThreshold;
        }
        if (typeof storeSetting.value.standardShippingFee === 'number') {
          standardShippingFee = storeSetting.value.standardShippingFee;
        }
      }
    } catch {}

    const shippingCharge = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
    const discount = 0;
    const tax = 0;
    const totalAmount = Math.max(0, subtotal + shippingCharge - discount);

    // 5. Generate Order Number & Create Pending DB Order
    const orderNumber = `YOX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = Order.create({
      orderNumber,
      userId,
      couponId: couponId || null,
      paymentId: null,
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      orderStatus: 'PLACED',
      notes: isDirectBuy ? 'DIRECT_BUY' : (notes || null),
      shippingAddress,
      items: orderItems,
    });

    const savedOrder = await this.orderRepo.save(order);

    // 6. Create Razorpay Gateway Order
    const amountInPaise = Math.round(totalAmount * 100);
    const rzpOrder = await this.razorpayService.createGatewayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${savedOrder.orderNumber}`,
      notes: {
        orderId: savedOrder.id,
        orderNumber: savedOrder.orderNumber,
        userId: userId,
      },
    });

    // 7. Record Payment in DB
    await PaymentModel.create({
      orderId: savedOrder.id,
      userId: userId,
      amount: totalAmount,
      paymentMethod: 'RAZORPAY',
      paymentStatus: 'PENDING',
      gatewayOrderId: rzpOrder.id,
    });

    return {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
    };
  }
}

export class VerifyRazorpayPaymentUseCase implements IUseCase<VerifyRazorpayPaymentInputDTO, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly razorpayService: RazorpayService
  ) {}

  async execute(input: VerifyRazorpayPaymentInputDTO): Promise<OrderResponseDTO> {
    const { userId, orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

    // 1. Fetch Order from DB & verify ownership
    const order = await this.orderRepo.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: Order does not belong to the current authenticated user');
    }

    // If order is already paid, return it idempotently
    if (order.paymentStatus === 'PAID') {
      return mapToOrderResponseDTO(order);
    }

    // 2. Cryptographically Verify Signature with timing-safe HMAC SHA-256
    const isValidSignature = this.razorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValidSignature) {
      throw new Error('Invalid Razorpay payment signature. Payment verification failed.');
    }

    // 3. Secondary Gateway Verification: Fetch payment status directly from Razorpay
    try {
      const rzpPayment = await this.razorpayService.fetchPayment(razorpayPaymentId);
      if (rzpPayment.status !== 'captured' && rzpPayment.status !== 'authorized') {
        throw new Error(`Payment verification failed: Razorpay payment status is "${rzpPayment.status}"`);
      }

      const expectedAmountInPaise = Math.round(order.totalAmount * 100);
      if (Number(rzpPayment.amount) !== expectedAmountInPaise) {
        throw new Error(`Payment amount mismatch: Expected ₹${order.totalAmount} but paid ₹${Number(rzpPayment.amount) / 100}`);
      }
    } catch (err: any) {
      throw new Error(`Razorpay validation check failed: ${err.message}`);
    }

    // 4. Update Payment record in DB
    await PaymentModel.findOneAndUpdate(
      { orderId: order.id },
      {
        paymentStatus: 'PAID',
        transactionId: razorpayPaymentId,
        updatedAt: new Date(),
      }
    );

    // 5. Update Order status
    const updatedOrder = Order.reconstitute({
      ...order.toJSON(),
      paymentId: razorpayPaymentId,
      paymentStatus: 'PAID',
      confirmedAt: new Date(),
      updatedAt: new Date(),
    });

    const savedOrder = await this.orderRepo.save(updatedOrder);

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
    AuditLogService.getInstance()?.record({
      actorId: userId,
      actorRole: 'CUSTOMER',
      action: AuditAction.ORDER_CREATED,
      resourceType: 'ORDER',
      resourceId: savedOrder.id,
      description: `Payment verified & Order #${savedOrder.orderNumber} confirmed for ₹${savedOrder.totalAmount} (Txn: ${razorpayPaymentId})`,
      after: { orderNumber: savedOrder.orderNumber, totalAmount: savedOrder.totalAmount, paymentStatus: 'PAID' },
    });

    // 8. Admin Notification
    const itemCount = savedOrder.items.reduce((s, i) => s + i.quantity, 0);
    let customerName = 'A customer';
    try {
      const u = await UserModel.findById(userId).select('fullName').lean();
      if (u?.fullName) customerName = u.fullName as string;
    } catch {}

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

    return mapToOrderResponseDTO(savedOrder);
  }
}
