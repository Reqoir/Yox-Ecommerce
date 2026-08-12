/**
 * @file shipment.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Shipment } from '../entities/shipment.entity';

export interface IShipmentRepository {
  save(shipment: Shipment): Promise<Shipment>;
  findById(id: string): Promise<Shipment | null>;
  findByOrderId(orderId: string): Promise<Shipment | null>;
  findByTrackingNumber(trackingNumber: string): Promise<Shipment | null>;
  findAllShipments(query?: any): Promise<{ data: Shipment[]; total: number }>;
  delete(id: string): Promise<boolean>;
}
