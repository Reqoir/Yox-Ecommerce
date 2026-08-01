/**
 * @file order.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { ICartRepository } from '../../../cart/domain/repositories/cart.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IAddressRepository } from '../../../addresses/domain/repositories/address.repository.interface';
import { Order, OrderItemSnapshot, ShippingAddressSnapshot } from '../../domain/entities/order.entity';
import { Inventory } from '../../../inventory/domain/entities/inventory.entity';
import { StockLog } from '../../../inventory/domain/entities/stock-log.entity';
import {
  PlaceOrderRequestDTO,
  CancelOrderRequestDTO,
  ShipOrderRequestDTO,
  UpdateOrderStatusRequestDTO,
  OrderResponseDTO,
} from '../dtos/order.dto';

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
    trackingNumber: order.trackingNumber,
    deliveryPartnerId: order.deliveryPartnerId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export class PlaceOrderUseCase implements IUseCase<{ userId: string; data: PlaceOrderRequestDTO }, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly cartRepo: ICartRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository,
    private readonly addressRepo: IAddressRepository
  ) {}

  async execute(input: { userId: string; data: PlaceOrderRequestDTO }): Promise<OrderResponseDTO> {
    const { userId, data } = input;

    // 1. Fetch User Cart
    const cart = await this.cartRepo.findByUserId(userId);
    if (!cart || cart.items.length === 0) {
      throw new Error('Your shopping cart is empty');
    }

    // 2. Resolve Shipping Address Snapshot
    let shippingAddress: ShippingAddressSnapshot | null = null;
    if (data.addressId) {
      const address = await this.addressRepo.findById(data.addressId);
      if (!address) {
        throw new Error('Selected delivery address not found');
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
      throw new Error('A complete delivery address is required to place an order');
    }

    // 3. Process items and verify/deduct stock atomically
    const orderItems: OrderItemSnapshot[] = [];
    for (const item of cart.items) {
      const variant = await this.variantRepo.findById(item.variantId);
      if (!variant) {
        throw new Error(`Product variant ${item.variantId} no longer exists`);
      }

      if (variant.stock < item.quantity) {
        throw new Error(`Insufficient stock for "${variant.title || 'item'}". Available: ${variant.stock}, Requested: ${item.quantity}`);
      }

      // Deduct stock on variant entity
      variant.reduceStock(item.quantity);
      await this.variantRepo.save(variant);

      // Deduct available stock & reserve in inventory module
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
          reason: 'Stock locked for placed order',
          reference: userId,
        });
        await this.stockLogRepo.save(log);
      }

      orderItems.push({
        productId: variant.productId,
        variantId: variant.id,
        productName: `${variant.title} - ${variant.color}`,
        sku: variant.sku,
        size: variant.size,
        color: variant.color,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: 0,
        subtotal: item.quantity * item.price,
      });
    }

    // 4. Calculate Order Financials
    const subtotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
    const shippingCharge = subtotal >= 699 || subtotal === 0 ? 0 : 99;
    const discount = 0;
    const tax = 0; // Inclusive of all taxes
    const totalAmount = Math.max(0, subtotal + shippingCharge - discount);

    // 5. Generate unique Order Number
    const orderNumber = `YOX-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order = Order.create({
      orderNumber,
      userId,
      couponId: data.couponId,
      paymentId: data.paymentId,
      subtotal,
      discount,
      shippingCharge,
      tax,
      totalAmount,
      paymentMethod: data.paymentMethod || 'COD',
      paymentStatus: (data.paymentMethod && data.paymentMethod.toUpperCase() !== 'COD') ? 'PAID' : 'PENDING',
      orderStatus: 'PLACED',
      notes: data.notes,
      shippingAddress,
      items: orderItems,
    });

    const savedOrder = await this.orderRepo.save(order);

    // 6. Clear User Cart
    cart.clear();
    await this.cartRepo.save(cart);

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
    return {
      data: res.data.map((o) => mapToOrderResponseDTO(o)),
      total: res.total,
    };
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
    return mapToOrderResponseDTO(order);
  }
}

export class CancelOrderUseCase implements IUseCase<{ id: string; userId?: string; isAdmin?: boolean; data: CancelOrderRequestDTO }, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}

  async execute(input: { id: string; userId?: string; isAdmin?: boolean; data: CancelOrderRequestDTO }): Promise<OrderResponseDTO> {
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

    order.cancel(input.data?.reason || 'Cancelled by user', input.isAdmin);
    const savedOrder = await this.orderRepo.save(order);

    // Restore stock back to variants and inventory
    for (const item of savedOrder.items) {
      const variant = await this.variantRepo.findById(item.variantId);
      if (variant) {
        variant.increaseStock(item.quantity);
        await this.variantRepo.save(variant);
      }
      const inventory = await this.inventoryRepo.findByVariantId(item.variantId);
      if (inventory) {
        const prevAvail = inventory.availableStock;
        const newAvail = prevAvail + item.quantity;
        const newReserved = Math.max(0, inventory.reservedStock - item.quantity);
        const updatedInv = Inventory.reconstitute({
          ...inventory.toJSON(),
          availableStock: newAvail,
          reservedStock: newReserved,
          updatedAt: new Date(),
        });
        const savedInv = await this.inventoryRepo.save(updatedInv);

        const log = StockLog.create({
          inventoryId: savedInv.id,
          type: 'RELEASE',
          amount: item.quantity,
          previousStock: prevAvail,
          newStock: newAvail,
          reason: 'Stock returned from cancelled order',
          reference: savedOrder.orderNumber,
        });
        await this.stockLogRepo.save(log);
      }
    }

    return mapToOrderResponseDTO(savedOrder);
  }
}

export class ConfirmOrderUseCase implements IUseCase<{ id: string }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.confirm();
    const saved = await this.orderRepo.save(order);
    return mapToOrderResponseDTO(saved);
  }
}

export class PackOrderUseCase implements IUseCase<{ id: string }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.pack();
    const saved = await this.orderRepo.save(order);
    return mapToOrderResponseDTO(saved);
  }
}

export class ShipOrderUseCase implements IUseCase<{ id: string; data: ShipOrderRequestDTO }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; data: ShipOrderRequestDTO }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.ship(input.data?.trackingNumber, input.data?.deliveryPartnerId);
    const saved = await this.orderRepo.save(order);
    return mapToOrderResponseDTO(saved);
  }
}

export class OutForDeliveryUseCase implements IUseCase<{ id: string }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.outForDelivery();
    const saved = await this.orderRepo.save(order);
    return mapToOrderResponseDTO(saved);
  }
}

export class DeliverOrderUseCase implements IUseCase<{ id: string }, OrderResponseDTO> {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}
  async execute(input: { id: string }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.deliver();
    const savedOrder = await this.orderRepo.save(order);

    // Consume reserved stock permanently
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
    return mapToOrderResponseDTO(savedOrder);
  }
}

export class UpdateOrderStatusUseCase implements IUseCase<{ id: string; data: UpdateOrderStatusRequestDTO }, OrderResponseDTO> {
  constructor(private readonly orderRepo: IOrderRepository) {}
  async execute(input: { id: string; data: UpdateOrderStatusRequestDTO }): Promise<OrderResponseDTO> {
    let order = await this.orderRepo.findById(input.id);
    if (!order) order = await this.orderRepo.findByOrderNumber(input.id);
    if (!order) throw new Error('Order not found');
    order.updateStatus(input.data.status.toUpperCase(), input.data.notes);
    const saved = await this.orderRepo.save(order);
    return mapToOrderResponseDTO(saved);
  }
}
