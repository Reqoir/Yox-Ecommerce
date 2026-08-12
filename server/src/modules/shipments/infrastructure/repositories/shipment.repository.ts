/**
 * @file shipment.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IShipmentRepository } from '../../domain/repositories/shipment.repository.interface';
import { Shipment } from '../../domain/entities/shipment.entity';
import { ShipmentModel, IShipmentDocument } from '../models/shipment.model';

export class ShipmentRepository implements IShipmentRepository {
  private toDomain(doc: IShipmentDocument): Shipment {
    return Shipment.reconstitute({
      id: doc._id.toString(),
      orderId: doc.orderId,
      deliveryPartnerId: doc.deliveryPartnerId,
      trackingNumber: doc.trackingNumber,
      status: doc.status,
      estimatedDeliveryDate: doc.estimatedDeliveryDate,
      shippedAt: doc.shippedAt,
      deliveredAt: doc.deliveredAt,
      failedAt: doc.failedAt,
      notes: doc.notes,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<Shipment | null> {
    const doc = await ShipmentModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Shipment | null> {
    const doc = await ShipmentModel.findOne({ orderId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByTrackingNumber(trackingNumber: string): Promise<Shipment | null> {
    const doc = await ShipmentModel.findOne({ trackingNumber }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findAllShipments(query: any = {}): Promise<{ data: Shipment[]; total: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.orderId) filter.orderId = query.orderId;

    const [docs, total] = await Promise.all([
      ShipmentModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ShipmentModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(shipment: Shipment): Promise<Shipment> {
    if (shipment.id) {
      const doc = await ShipmentModel.findByIdAndUpdate(
        shipment.id,
        {
          orderId: shipment.orderId,
          deliveryPartnerId: shipment.deliveryPartnerId,
          trackingNumber: shipment.trackingNumber,
          status: shipment.status,
          estimatedDeliveryDate: shipment.estimatedDeliveryDate,
          shippedAt: shipment.shippedAt,
          deliveredAt: shipment.deliveredAt,
          failedAt: shipment.failedAt,
          notes: shipment.notes,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
      if (!doc) throw new Error('Shipment not found for update');
      return this.toDomain(doc);
    } else {
      const created = await ShipmentModel.create({
        orderId: shipment.orderId,
        deliveryPartnerId: shipment.deliveryPartnerId,
        trackingNumber: shipment.trackingNumber,
        status: shipment.status,
        estimatedDeliveryDate: shipment.estimatedDeliveryDate,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        failedAt: shipment.failedAt,
        notes: shipment.notes,
      });
      return this.toDomain(created);
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = await ShipmentModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
