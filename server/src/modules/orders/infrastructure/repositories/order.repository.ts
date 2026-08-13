/**
 * @file order.repository.ts
 * @layer Infrastructure › Repositories
 */

import { Types } from 'mongoose';
import { IOrderRepository } from '../../domain/repositories/order.repository.interface';
import { Order } from '../../domain/entities/order.entity';
import { OrderModel, IOrderDocument } from '../models/order.model';

export class OrderRepository implements IOrderRepository {
  private toDomain(doc: IOrderDocument): Order {
    const data = doc.toObject ? doc.toObject() : doc;
    return Order.reconstitute({
      id: doc._id ? doc._id.toString() : data.id || '',
      orderNumber: data.orderNumber,
      userId: data.userId,
      couponId: data.couponId,
      paymentId: data.paymentId,
      subtotal: data.subtotal,
      discount: data.discount,
      shippingCharge: data.shippingCharge,
      tax: data.tax,
      totalAmount: data.totalAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus: data.paymentStatus,
      orderStatus: data.orderStatus,
      notes: data.notes,
      shippingAddress: data.shippingAddress,
      items: data.items ? data.items.map((item: any) => ({
        id: item._id ? item._id.toString() : item.id,
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        imageUrl: item.imageUrl || item.image || null,
      })) : [],
      placedAt: data.placedAt || data.createdAt || new Date(),
      confirmedAt: data.confirmedAt,
      packedAt: data.packedAt,
      shippedAt: data.shippedAt,
      outForDeliveryAt: data.outForDeliveryAt,
      deliveredAt: data.deliveredAt,
      cancelledAt: data.cancelledAt,
      cancelledReason: data.cancelledReason,
      trackingNumber: data.trackingNumber,
      deliveryPartnerId: data.deliveryPartnerId,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    });
  }

  async save(order: Order): Promise<Order> {
    const data = order.toJSON();
    const { id, ...rest } = data;

    let doc: IOrderDocument | null = null;
    if (id && Types.ObjectId.isValid(id)) {
      doc = await OrderModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!doc) throw new Error('Order not found in database');
    } else {
      const created = new OrderModel(rest);
      doc = await created.save();
    }

    return this.toDomain(doc);
  }

  async findById(id: string): Promise<Order | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OrderModel.findById(id).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const doc = await OrderModel.findOne({ orderNumber }).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async findByUserId(userId: string, query: any = {}): Promise<{ data: Order[]; total: number }> {
    const filter: any = { userId };
    if (query.status && query.status !== 'ALL') {
      filter.orderStatus = query.status.toUpperCase();
    }

    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      OrderModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async findAllOrders(query: any = {}): Promise<{ data: Order[]; total: number }> {
    const filter: any = {};
    if (query.status && query.status !== 'ALL') {
      filter.orderStatus = query.status.toUpperCase();
    }
    if (query.userId) {
      filter.userId = query.userId;
    }
    if (query.search) {
      filter.$or = [
        { orderNumber: { $regex: query.search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: query.search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: query.search, $options: 'i' } },
      ];
    }

    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      OrderModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const result = await OrderModel.findByIdAndDelete(id).exec();
    return !!result;
  }
}
