/**
 * @file order.use-cases.ts
 * @layer Application › Use Cases
 */

import mongoose from 'mongoose';
import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import {
  ConflictError,
  ForbiddenError,
} from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IAddressRepository } from '../../../addresses/domain/repositories/address.repository.interface';
import { Order, ShippingAddressSnapshot } from '../../domain/entities/order.entity';
import { Inventory } from '../../../inventory/domain/entities/inventory.entity';
import { StockLog } from '../../../inventory/domain/entities/stock-log.entity';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { AtomicStockService } from '../../../inventory/application/services/atomic-stock.service';
import { CheckoutPricingService } from '../services/checkout-pricing.service';
import {
  PlaceOrderRequestDTO,
  CancelOrderRequestDTO,
  ShipOrderRequestDTO,
  UpdateOrderStatusRequestDTO,
  OrderResponseDTO,
} from '../dtos/order.dto';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { ProductModel } from '../../../products/infrastructure/models/product.model';
import { ProductVariantModel } from '../../../products/infrastructure/models/product-variant.model';
import { ShiprocketService } from '../../../shipments/infrastructure/services/shiprocket.service';
import { ShipmentRepository } from '../../../shipments/infrastructure/repositories/shipment.repository';
import { IShipmentRepository } from '../../../shipments/domain/repositories/shipment.repository.interface';
import { Shipment } from '../../../shipments/domain/entities/shipment.entity';
import { IOfferRepository } from '../../../offers/domain/repositories/offer.repository.interface';
import { OfferRepository } from '../../../offers/infrastructure/repositories/offer.repository';

export function mapToOrderResponseDTO(order: Order): OrderResponseDTO {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    couponId: order.couponId,
    paymentId: order.paymentId,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCharge: order.shippingCharge,
    tax: order.tax,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    notes: order.notes,
    shippingAddress: order.shippingAddress,
    items: order.items,
    placedAt: order.placedAt,
    confirmedAt: order.confirmedAt,
    packedAt: order.packedAt,
    shippedAt: order.shippedAt,
    outForDeliveryAt: order.outForDeliveryAt,
    deliveredAt: order.deliveredAt,
    cancelledAt: order.cancelledAt,
    cancelledReason: order.cancelledReason,
    cancellationBankDetails: order.cancellationBankDetails,
    trackingNumber: order.trackingNumber,
    deliveryPartnerId: order.deliveryPartnerId,
    shiprocketOrderId: order.shiprocketOrderId,
    shiprocketShipmentId: order.shiprocketShipmentId,
    labelUrl: order.labelUrl,
    invoiceUrl: order.invoiceUrl,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export class PlaceOrderUseCase implements IUseCase<{ userId: string; data: PlaceOrderRequestDTO; isAdmin?: boolean }, OrderResponseDTO> {
  private readonly pricingService: CheckoutPricingService;
  private readonly atomicStockService: AtomicStockService;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    variantRepo: IProductVariantRepository,
    inventoryRepo: IInventoryRepository,
    stockLogRepo: IStockLogRepository,
    private readonly addressRepo: IAddressRepository,
    pricingService?: CheckoutPricingService,
    atomicStockService?: AtomicStockService
  ) {
    this.pricingService = pricingService ?? new CheckoutPricingService({ variantRepo });
    this.atomicStockService =
      atomicStockService ??
      new AtomicStockService(variantRepo, inventoryRepo, stockLogRepo, {
        explicitInventoryRepo: true,
        explicitStockLogRepo: true,
      });
  }

  async execute(input: { userId: string; data: PlaceOrderRequestDTO; isAdmin?: boolean }): Promise<OrderResponseDTO> {
    const { userId, data } = input;

    // 1. SEC-CRIT-001: Only COD orders are allowed on direct POST /api/v1/orders.
    // Online orders (RAZORPAY, etc.) must be created via POST /api/v1/payments/create-order
    // and can only transition to PAID via cryptographic signature / webhook verification.
    const requestedMethod = String(data.paymentMethod || 'COD').trim().toUpperCase();
    if (requestedMethod !== 'COD') {
      throw new ValidationError(
        requestedMethod === 'RAZORPAY'
          ? 'Online payments must be initiated through the Razorpay payment flow and verified before completion.'
          : `Unsupported payment method "${data.paymentMethod}" for direct order placement. Only COD is accepted here.`
      );
    }

    // 2. Resolve Items to Order: either Direct Buy Item OR User Cart
    let itemsToProcess: { variantId: string; quantity: unknown; price?: unknown }[] = [];
    let isDirectBuy = false;
    let userCart: any = null;
    let couponToApply: string | null = data.couponId || null;

    if (data.directBuyItem && data.directBuyItem.variantId) {
      isDirectBuy = true;
      itemsToProcess = [{
        variantId: data.directBuyItem.variantId,
        quantity: data.directBuyItem.quantity,
        price: data.directBuyItem.price,
      }];
    } else {
      userCart = await this.cartRepo.findByUserId(userId);
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

    // 3. Resolve Shipping Address Snapshot & Enforce Ownership
    let shippingAddress: ShippingAddressSnapshot | null = null;
    if (data.addressId) {
      const address = await this.addressRepo.findById(data.addressId);
      if (!address) {
        throw new NotFoundError('Selected delivery address not found');
      }
      if (address.userId && address.userId !== userId && !input.isAdmin) {
        throw new ForbiddenError('You do not have permission to use this delivery address');
      }
      shippingAddress = {
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.street,
        city: address.city,
        state: address.state,
        country: address.country || 'India',
        postalCode: address.zipCode,
      };
    } else if (data.shippingAddress) {
      shippingAddress = { ...data.shippingAddress };
    }

    if (!shippingAddress || !shippingAddress.streetAddress || !shippingAddress.postalCode) {
      throw new ValidationError('A complete delivery address is required to place an order');
    }

    // 4. SEC-CRIT-002: Authoritative server-side pricing, coupon validation & COD policy check
    const pricing = await this.pricingService.calculateCheckoutPricing({
      userId,
      items: itemsToProcess,
      couponId: couponToApply,
    });

    if (!pricing.storeConfig.codEnabled) {
      throw new ValidationError('Cash on Delivery is currently unavailable. Please select an online payment method.');
    }
    if (pricing.totalAmount > pricing.storeConfig.codMaxLimit) {
      throw new ValidationError(`Cash on Delivery is only available for orders up to ₹${pricing.storeConfig.codMaxLimit}. Please pay online.`);
    }

    // 5. SEC-HIGH-009: Atomic multi-item stock reservation with rollback on failure
    const orderNumber = `YOX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const reservationItems = pricing.items.map((i) => ({
      variantId: i.variantId,
      quantity: i.quantity,
      productName: i.productName,
    }));

    await this.atomicStockService.reserveOrderItems(reservationItems, {
      reason: 'Stock locked for placed COD order',
      reference: orderNumber,
    });

    let couponClaimed = false;
    let savedOrder: Order;
    try {
      if (pricing.couponId) {
        couponClaimed = await this.pricingService.atomicClaimCoupon(pricing.couponId);
      }

      // Never trust client paymentStatus, paymentId, subtotal, discount, or totalAmount
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
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        orderStatus: 'PLACED',
        notes: data.notes,
        shippingAddress,
        items: pricing.items,
      });

      savedOrder = await this.orderRepo.save(order);
    } catch (error) {
      if (couponClaimed && pricing.couponId) {
        await this.pricingService.releaseCouponClaim(pricing.couponId);
      }
      await this.atomicStockService
        .releaseOrderItems(reservationItems, {
          reason: 'Rollback after COD order persistence failure',
          reference: orderNumber,
        })
        .catch(() => undefined);
      throw error;
    }

    // 6. Clear User Cart (Only for standard cart checkout, NOT for direct buy)
    if (!isDirectBuy && userCart) {
      userCart.clear();
      await this.cartRepo.save(userCart);
    }

    try {
      AuditLogService.getInstance()?.record({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: AuditAction.ORDER_CREATED,
        resourceType: 'ORDER',
        resourceId: savedOrder.id,
        description: `Order #${savedOrder.orderNumber} placed for ₹${savedOrder.totalAmount}`,
        after: { orderNumber: savedOrder.orderNumber, totalAmount: savedOrder.totalAmount, status: savedOrder.orderStatus },
      });
    } catch {}

    // 🔔 Real-time admin notification
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
        userId: null, // broadcast to all admins
        type: 'NEW_ORDER',
        title: '🛒 New Order Received',
        message: `${customerName} placed order #${savedOrder.orderNumber} for ₹${savedOrder.totalAmount} (${itemCount} item${itemCount !== 1 ? 's' : ''})`,
        metadata: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          totalAmount: savedOrder.totalAmount,
          itemCount,
          customerId: userId,
          customerName,
        },
      });
    } catch {}

    return mapToOrderResponseDTO(savedOrder);
  }
}

export class GetAllOrdersUseCase implements IUseCase<any, { data: OrderResponseDTO[]; total: number }> {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(input: any): Promise<{ data: OrderResponseDTO[]; total: number }> {
    let res: { data: Order[]; total: number };
    if (input && input.userId && !input.isAdmin) {
      res = await this.orderRepo.findByUserId(input.userId, input);
    } else {
      res = await this.orderRepo.findAllOrders(input || {});
    }

    try {
      const userIds = Array.from(new Set(res.data.map((o) => o.userId).filter(Boolean)));
      const users = await UserModel.find({ _id: { $in: userIds } }).select('email fullName phone').lean();
      const userMap = new Map(
        users.map((u) => [
          u._id.toString(),
          { id: u._id.toString(), fullName: u.fullName, email: u.email, phone: u.phone },
        ])
      );

      const variantIds = Array.from(
        new Set(res.data.flatMap((o) => o.items.map((i) => i.variantId)).filter(Boolean))
      );
      const variants = await ProductVariantModel.find({ _id: { $in: variantIds } }).select('images').lean();
      const variantMap = new Map<string, string | null>(
        variants.map((v: any) => [v._id.toString(), (v.images?.[0] as string) || null])
      );

      const enriched = res.data.map((o) => {
        const dto = mapToOrderResponseDTO(o);
        dto.customer = userMap.get(o.userId) || null;
        if (dto.items) {
          dto.items.forEach((item) => {
            if (!item.imageUrl && item.variantId) {
              const img = variantMap.get(item.variantId);
              if (img) item.imageUrl = img;
            }
          });
        }
        return dto;
      });

      return {
        data: enriched,
        total: res.total,
      };
    } catch (e) {
      return {
        data: res.data.map((o) => mapToOrderResponseDTO(o)),
        total: res.total,
      };
    }
  }
}

export class GetOrderByIdUseCase implements IUseCase<{ id: string; userId?: string; isAdmin?: boolean }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(input: { id: string; userId?: string; isAdmin?: boolean }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) {
      order = await this.orderRepo.findByOrderNumber(input.id);
    }
    if (!order) {
      throw new Error('Order not found');
    }
    if (!input.isAdmin && input.userId && order.userId !== input.userId) {
      throw new Error('Forbidden: You do not have permission to view this order');
    }
    const dto = mapToOrderResponseDTO(order);

    try {
      if (dto.userId) {
        const user = await UserModel.findById(dto.userId).select('email fullName phone').lean();
        if (user) {
          dto.customer = {
            id: user._id.toString(),
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
          };
        }
      }

      if (dto.items && Array.isArray(dto.items)) {
        for (const item of dto.items) {
          if (!item.imageUrl) {
            if (item.variantId) {
              const variant = await ProductVariantModel.findById(item.variantId).select('images').lean();
              if (variant?.images && variant.images.length > 0) {
                item.imageUrl = variant.images[0];
                continue;
              }
            }
            if (item.productId) {
              const product = await ProductModel.findById(item.productId).select('thumbnail').lean();
              if (product?.thumbnail) {
                item.imageUrl = product.thumbnail;
              }
            }
          }
        }
      }
    } catch (e) {
      // Ignore enrichment error
    }

    return dto;
  }
}

async function resolveActorDetails(actor?: { id?: string; role?: string; email?: string }) {
  let actorId = actor?.id || 'SYSTEM';
  let actorRole = actor?.role ? actor.role.toUpperCase() : (actorId === 'SYSTEM' ? 'SYSTEM' : 'STAFF');
  let actorName: string | null = null;
  let actorEmail: string | null = actor?.email || null;

  if (actorId && actorId !== 'SYSTEM' && actorId.length === 24 && mongoose.connection.readyState === 1) {
    try {
      const u = await UserModel.findById(actorId).select('fullName email roleId').lean();
      if (u) {
        actorName = u.fullName;
        actorEmail = actorEmail || u.email;
        if ((u as any).role) actorRole = (u as any).role.toUpperCase();
      }
    } catch {}
  }

  return { actorId, actorRole, actorName, actorEmail };
}

export class CancelOrderUseCase implements IUseCase<{ id: string; userId?: string; isAdmin?: boolean; data: CancelOrderRequestDTO; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  private readonly offerRepo?: IOfferRepository;

  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository,
    private readonly shipmentRepo: IShipmentRepository = new ShipmentRepository(),
    offerRepo?: IOfferRepository
  ) {
    this.offerRepo = offerRepo ?? (mongoose.connection.readyState === 1 ? new OfferRepository() : undefined);
  }

  async execute(input: { id: string; userId?: string; isAdmin?: boolean; data: CancelOrderRequestDTO; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) {
      order = await this.orderRepo.findByOrderNumber(input.id);
    }
    if (!order) {
      throw new Error('Order not found');
    }
    if (!input.isAdmin && input.userId && order.userId !== input.userId) {
      throw new Error('Forbidden: You do not have permission to cancel this order');
    }

    // If order was pushed to Shiprocket, cancel the shipment with courier agency
    if (order.shiprocketOrderId) {
      try {
        await ShiprocketService.getInstance().cancelOrder(order.shiprocketOrderId);
        const shipment = await this.shipmentRepo.findByOrderId(order.id);
        if (shipment) {
          shipment.updateStatus('RETURNED_TO_SELLER', 'Shipment cancelled with courier agency via Shiprocket');
          await this.shipmentRepo.save(shipment);
        }
      } catch (srErr: any) {
        console.warn('Shiprocket courier cancellation warning:', srErr.message);
      }
    }

    const prevStatus = order.orderStatus;
    const cancelReason = input.data?.reason || 'Cancelled by user';
    order.cancel({
      reason: cancelReason,
      bankDetails: input.data?.bankDetails,
      isAdmin: input.isAdmin,
    });

    let savedOrder: Order;
    if (typeof this.orderRepo.atomicCancelOrder === 'function') {
      const atomicCancelled = await this.orderRepo.atomicCancelOrder(order.id, {
        reason: cancelReason,
        bankDetails: input.data?.bankDetails || null,
        isAdmin: input.isAdmin,
      });
      if (!atomicCancelled) {
        throw new ConflictError('Order is already cancelled or can no longer be cancelled');
      }
      savedOrder = atomicCancelled;
    } else {
      savedOrder = await this.orderRepo.save(order);
    }

    // SEC-HIGH-009: Release stock ONLY after this caller exclusively wins cancellation transition
    const atomicStock = new AtomicStockService(
      this.variantRepo,
      this.inventoryRepo,
      this.stockLogRepo,
      { explicitInventoryRepo: true, explicitStockLogRepo: true }
    );
    await atomicStock.releaseOrderItems(
      savedOrder.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        productName: i.productName,
      })),
      {
        reason: 'Stock returned from cancelled order',
        reference: savedOrder.orderNumber,
      }
    );

    if (savedOrder.couponId && this.offerRepo?.atomicDecrementUsage) {
      await this.offerRepo.atomicDecrementUsage(savedOrder.couponId).catch(() => undefined);
    }

    const actorInfo = await resolveActorDetails(input.actor || { id: input.userId, role: input.isAdmin ? 'ADMIN' : 'CUSTOMER' });

    AuditLogService.getInstance()?.record({
      actorId: actorInfo.actorId,
      actorRole: actorInfo.actorRole,
      actorName: actorInfo.actorName,
      actorEmail: actorInfo.actorEmail,
      action: AuditAction.ORDER_CANCELLED,
      resourceType: 'ORDER',
      resourceId: savedOrder.id,
      description: `Order #${savedOrder.orderNumber} cancelled by ${actorInfo.actorName || actorInfo.actorRole}. Reason: ${input.data?.reason || 'Cancelled'}`,
      before: { status: prevStatus },
      after: { status: 'CANCELLED' },
    });

    // 🔔 Real-time admin notification for ALL cancellations (customer OR admin)
    {
      const isCustomer = !input.isAdmin || order.userId === input.userId;
      const cancelledBy = isCustomer ? 'Customer' : 'Admin';
      let cancellerName = isCustomer ? 'Customer' : 'Admin';
      if (mongoose.connection.readyState === 1) {
        try {
          const u = await UserModel.findById(input.userId).select('fullName').lean();
          if (u?.fullName) cancellerName = u.fullName as string;
        } catch {}
      }
      await NotificationService.getInstance().notify({
        userId: null,
        type: 'ORDER_CANCELLED',
        title: `❌ Order Cancelled by ${cancelledBy}`,
        message: `${cancellerName} cancelled order #${savedOrder.orderNumber}. Reason: ${input.data?.reason || 'No reason provided'}`,
        metadata: {
          orderId: savedOrder.id,
          orderNumber: savedOrder.orderNumber,
          cancelledBy: input.userId,
          cancellerName,
          cancelledByRole: cancelledBy,
          reason: input.data?.reason || null,
        },
      });
    }

    return mapToOrderResponseDTO(savedOrder);
  }
}

export class ConfirmOrderUseCase implements IUseCase<{ id: string; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly shipmentRepo: IShipmentRepository = new ShipmentRepository()
  ) {}

  async execute(input: { id: string; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    // Safety check: online orders must be paid before admin can confirm and book courier
    if (order.paymentMethod !== 'COD' && order.paymentStatus !== 'PAID') {
      throw new Error(`Cannot accept order #${order.orderNumber}: Online payment status is ${order.paymentStatus}. Payment must be completed before booking with Shiprocket.`);
    }
    order.confirm();

    // Call Shiprocket Courier API: Order creation, AWB assignment & pickup generation
    let awbCode: string | null = null;
    let courierName: string = 'Shiprocket Courier';
    let pickupToken: string | null = null;
    let pickupDate: Date | null = null;
    let labelUrl: string | null = null;
    let invoiceUrl: string | null = null;

    try {
      let customerEmail = 'customer@yox.com';
      let customerPhone = order.shippingAddress.phone || '9876543210';
      try {
        const u = await UserModel.findById(order.userId).select('email phone').lean();
        if (u?.email) customerEmail = u.email;
        if (u?.phone && !customerPhone) customerPhone = u.phone;
      } catch {}

      const shiprocket = ShiprocketService.getInstance();

      // 1. Create Order in Shiprocket
      const srOrder = await shiprocket.createAdhocOrder({
        orderNumber: order.orderNumber,
        orderDate: order.placedAt || new Date(),
        customerName: order.shippingAddress.fullName,
        customerEmail,
        customerPhone,
        shippingAddress: {
          address: order.shippingAddress.streetAddress,
          address2: order.shippingAddress.addressLine2 || order.shippingAddress.landmark || '',
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: order.shippingAddress.country || 'India',
          postalCode: order.shippingAddress.postalCode,
        },
        items: order.items.map((item) => ({
          name: item.productName,
          sku: item.sku || 'SKU-ITEM',
          units: item.quantity,
          selling_price: item.unitPrice,
          discount: item.discount || 0,
        })),
        paymentMethod: order.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
        subtotal: order.totalAmount,
      });

      // 2. Assign Courier & Generate AWB Code
      let awbNotice: string | null = null;
      try {
        const awbRes = await shiprocket.assignAwb(srOrder.shipmentId);
        awbCode = awbRes.awbCode;
        courierName = awbRes.courierName;
      } catch (awbErr: any) {
        awbNotice = awbErr.message;
        console.warn('AWB generation notice:', awbErr.message);
      }

      // 3. Schedule Courier Pickup from Kannur Warehouse
      try {
        const pickupRes = await shiprocket.requestPickup(srOrder.shipmentId);
        pickupToken = pickupRes.pickupTokenNumber || null;
        if (pickupRes.pickupScheduledDate) {
          pickupDate = new Date(pickupRes.pickupScheduledDate);
        }
      } catch (pickupErr: any) {
        console.warn('Pickup scheduling notice:', pickupErr.message);
      }

      // 4. Generate Label & Invoice URLs
      try {
        labelUrl = await shiprocket.generateLabel(srOrder.shipmentId);
      } catch {}
      try {
        invoiceUrl = await shiprocket.printInvoice(srOrder.orderId);
      } catch {}

      // Attach details to Order aggregate
      order.attachShiprocket({
        shiprocketOrderId: srOrder.orderId,
        shiprocketShipmentId: srOrder.shipmentId,
        awbCode,
        courierName,
        labelUrl,
        invoiceUrl,
      });

      // 5. Create or Update Shipment Entity
      let shipment = await this.shipmentRepo.findByOrderId(order.id);
      if (!shipment) {
        shipment = Shipment.create({
          orderId: order.id,
          deliveryPartnerId: courierName,
          trackingNumber: awbCode,
          status: 'READY_TO_SHIP',
          estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          notes: awbNotice
            ? `Shiprocket Order #${srOrder.orderId} created. AWB Pending: ${awbNotice}`
            : `Shiprocket Order #${srOrder.orderId} booked. Courier: ${courierName}.`,
        });
      }
      shipment.attachShiprocketDetails({
        shiprocketOrderId: srOrder.orderId,
        shiprocketShipmentId: srOrder.shipmentId,
        awbCode,
        courierName,
        pickupTokenNumber: pickupToken,
        pickupScheduledDate: pickupDate,
        labelUrl,
        invoiceUrl,
      });
      shipment.updateStatus('READY_TO_SHIP', `Courier ${courierName} assigned. AWB: ${awbCode || 'Assigned'}`);
      shipment.updateTrackingActivities([
        {
          date: new Date().toISOString(),
          status: 'MANIFEST_GENERATED',
          activity: `Order accepted and booked via Shiprocket. Assigned courier: ${courierName}. AWB: ${awbCode || 'Pending'}.`,
          location: 'Kannur Warehouse',
        },
      ]);
      await this.shipmentRepo.save(shipment);

      // Real-time notification to customer
      try {
        await NotificationService.getInstance().notify({
          userId: order.userId,
          type: 'ORDER_STATUS',
          title: '🚚 Order Confirmed & Courier Booked',
          message: `Your order #${order.orderNumber} is confirmed! Assigned to ${courierName} (AWB: ${awbCode || 'Assigned'}). Pickup scheduled.`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            courierName,
            awbCode,
            trackingNumber: awbCode,
          },
        });
      } catch {}
    } catch (srErr: any) {
      console.error('Shiprocket order creation error:', srErr.message);
      order.updateStatus('CONFIRMED', `Shiprocket notice: ${srErr.message}`);
    }

    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} confirmed and booked with Shiprocket (${courierName}${awbCode ? ', AWB: ' + awbCode : ''}) by ${actorInfo.actorName || actorInfo.actorRole}`,
        before: { status: prevStatus },
        after: { status: 'CONFIRMED', courierName, awbCode },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}

export class PackOrderUseCase implements IUseCase<{ id: string; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    order.pack();
    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} packed by ${actorInfo.actorName || actorInfo.actorRole}`,
        before: { status: prevStatus },
        after: { status: 'PACKED' },
      });
    } catch {}

    try {
      await NotificationService.getInstance().notify({
        userId: saved.userId,
        type: 'ORDER_STATUS',
        title: '📦 Order Packed & Ready',
        message: `Your order #${saved.orderNumber} has been packed at our warehouse and is waiting for courier handover!`,
        metadata: {
          orderId: saved.id,
          orderNumber: saved.orderNumber,
          status: 'PACKED',
        },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}

export class ShipOrderUseCase implements IUseCase<{ id: string; data: ShipOrderRequestDTO; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; data: ShipOrderRequestDTO; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    order.ship(input.data?.trackingNumber, input.data?.deliveryPartnerId);
    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} shipped via ${input.data?.deliveryPartnerId || 'Carrier'} by ${actorInfo.actorName || actorInfo.actorRole} (Tracking: ${input.data?.trackingNumber || 'N/A'})`,
        before: { status: prevStatus },
        after: { status: 'SHIPPED', trackingNumber: input.data?.trackingNumber },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}

export class OutForDeliveryUseCase implements IUseCase<{ id: string; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    order.outForDelivery();
    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} marked out for delivery by ${actorInfo.actorName || actorInfo.actorRole}`,
        before: { status: prevStatus },
        after: { status: 'OUT_FOR_DELIVERY' },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}

export class DeliverOrderUseCase implements IUseCase<{ id: string; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}
  async execute(input: { id: string; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    order.deliver();
    const savedOrder = await this.orderRepo.save(order);

    // Consume reserved stock permanently
    try {
      for (const item of savedOrder.items) {
        const inventory = await this.inventoryRepo.findByVariantId(item.variantId);
        if (inventory && inventory.reservedStock >= item.quantity) {
          const updatedInv = Inventory.reconstitute({
            ...inventory.toJSON(),
            reservedStock: inventory.reservedStock - item.quantity,
            updatedAt: new Date(),
          });
          const savedInv = await this.inventoryRepo.save(updatedInv);
          const log = StockLog.create({
            inventoryId: savedInv.id,
            type: 'OUT',
            amount: item.quantity,
            previousStock: savedInv.availableStock,
            newStock: savedInv.availableStock,
            reason: 'Reserved stock fulfilled on order delivery',
            reference: savedOrder.orderNumber,
          });
          await this.stockLogRepo.save(log);
        }
      }
    } catch {}

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: savedOrder.id,
        description: `Order #${savedOrder.orderNumber} marked delivered by ${actorInfo.actorName || actorInfo.actorRole}`,
        before: { status: prevStatus },
        after: { status: 'DELIVERED' },
      });
    } catch {}

    return mapToOrderResponseDTO(savedOrder);
  }
}

export class UpdateOrderStatusUseCase implements IUseCase<{ id: string; data: UpdateOrderStatusRequestDTO; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; data: UpdateOrderStatusRequestDTO; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevStatus = order.orderStatus;
    order.updateStatus(input.data.status.toUpperCase(), input.data.notes);
    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: AuditAction.ORDER_STATUS_CHANGED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} status updated to ${input.data.status.toUpperCase()} by ${actorInfo.actorName || actorInfo.actorRole}`,
        before: { status: prevStatus },
        after: { status: input.data.status.toUpperCase() },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}

export class UpdateOrderPaymentStatusUseCase implements IUseCase<{ id: string; paymentStatus: string; transactionId?: string; notes?: string; actor?: { id?: string; role?: string; email?: string } }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; paymentStatus: string; transactionId?: string; notes?: string; actor?: { id?: string; role?: string; email?: string } }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    const prevPaymentStatus = order.paymentStatus;
    order.updatePaymentStatus(input.paymentStatus.toUpperCase(), input.transactionId);
    if (input.notes) {
      order.updateStatus(order.orderStatus, input.notes);
    }
    const saved = await this.orderRepo.save(order);

    try {
      const actorInfo = await resolveActorDetails(input.actor);
      await AuditLogService.getInstance()?.record({
        actorId: actorInfo.actorId,
        actorRole: actorInfo.actorRole,
        actorName: actorInfo.actorName,
        actorEmail: actorInfo.actorEmail,
        action: input.paymentStatus.toUpperCase() === 'REFUNDED' ? AuditAction.REFUND_COMPLETED : AuditAction.PAYMENT_VERIFIED,
        resourceType: 'ORDER',
        resourceId: saved.id,
        description: `Order #${saved.orderNumber} payment status updated to ${input.paymentStatus.toUpperCase()} by ${actorInfo.actorName || actorInfo.actorRole}${input.transactionId ? ` (TXN: ${input.transactionId})` : ''}`,
        before: { paymentStatus: prevPaymentStatus },
        after: { paymentStatus: input.paymentStatus.toUpperCase(), paymentId: input.transactionId },
      });
    } catch {}

    return mapToOrderResponseDTO(saved);
  }
}
