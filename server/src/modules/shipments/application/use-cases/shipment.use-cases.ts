/**
 * @file shipment.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IShipmentRepository } from '../../domain/repositories/shipment.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Shipment } from '../../domain/entities/shipment.entity';
import {
  CreateShipmentRequestDTO,
  UpdateShipmentStatusRequestDTO,
  ShipmentResponseDTO,
} from '../dtos/shipment.dto';

export function mapToShipmentResponseDTO(shipment: Shipment): ShipmentResponseDTO {
  return {
    id: shipment.id,
    orderId: shipment.orderId,
    deliveryPartnerId: shipment.deliveryPartnerId,
    trackingNumber: shipment.trackingNumber,
    status: shipment.status,
    estimatedDeliveryDate: shipment.estimatedDeliveryDate,
    shippedAt: shipment.shippedAt,
    deliveredAt: shipment.deliveredAt,
    failedAt: shipment.failedAt,
    notes: shipment.notes,
    createdAt: shipment.createdAt,
    updatedAt: shipment.updatedAt,
  };
}

export class CreateShipmentUseCase implements IUseCase<CreateShipmentRequestDTO, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(input: CreateShipmentRequestDTO): Promise<ShipmentResponseDTO> {
    const order = await this.orderRepo.findById(input.orderId);
    if (!order) {
      throw new Error(`Order ${input.orderId} not found`);
    }

    let existing = await this.shipmentRepo.findByOrderId(input.orderId);
    if (existing) {
      if (input.trackingNumber) existing.setTracking(input.trackingNumber, input.deliveryPartnerId);
      if (input.notes) existing.updateStatus(existing.status, input.notes);
      const saved = await this.shipmentRepo.save(existing);
      return mapToShipmentResponseDTO(saved);
    }

    const estDate = input.estimatedDeliveryDate ? new Date(input.estimatedDeliveryDate) : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);

    const shipment = Shipment.create({
      orderId: input.orderId,
      deliveryPartnerId: input.deliveryPartnerId || order.deliveryPartnerId,
      trackingNumber: input.trackingNumber || order.trackingNumber,
      status: 'SHIPPED',
      estimatedDeliveryDate: estDate,
      notes: input.notes,
    });

    const saved = await this.shipmentRepo.save(shipment);
    return mapToShipmentResponseDTO(saved);
  }
}

export class GetShipmentByIdUseCase implements IUseCase<string, ShipmentResponseDTO> {
  constructor(private readonly shipmentRepo: IShipmentRepository) {}

  async execute(id: string): Promise<ShipmentResponseDTO> {
    const shipment = await this.shipmentRepo.findById(id);
    if (!shipment) throw new Error('Shipment not found');
    return mapToShipmentResponseDTO(shipment);
  }
}

export class GetShipmentByOrderUseCase implements IUseCase<string, ShipmentResponseDTO> {
  constructor(private readonly shipmentRepo: IShipmentRepository) {}

  async execute(orderId: string): Promise<ShipmentResponseDTO> {
    const shipment = await this.shipmentRepo.findByOrderId(orderId);
    if (!shipment) throw new Error('No shipment record found for this order');
    return mapToShipmentResponseDTO(shipment);
  }
}

export class TrackShipmentUseCase implements IUseCase<string, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(trackingNumber: string): Promise<ShipmentResponseDTO> {
    let shipment = await this.shipmentRepo.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      // Fallback check order by tracking number or order number
      const order = await this.orderRepo.findByOrderNumber(trackingNumber);
      if (order) {
        shipment = await this.shipmentRepo.findByOrderId(order.id);
      }
    }
    if (!shipment) throw new Error('No active tracking info found for this tracking number');
    return mapToShipmentResponseDTO(shipment);
  }
}

export class UpdateShipmentStatusUseCase implements IUseCase<{ id: string; data: UpdateShipmentStatusRequestDTO }, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(input: { id: string; data: UpdateShipmentStatusRequestDTO }): Promise<ShipmentResponseDTO> {
    const shipment = await this.shipmentRepo.findById(input.id);
    if (!shipment) throw new Error('Shipment not found');

    if (input.data.trackingNumber) {
      shipment.setTracking(input.data.trackingNumber, input.data.deliveryPartnerId);
    }
    shipment.updateStatus(input.data.status, input.data.notes);
    const saved = await this.shipmentRepo.save(shipment);

    // Sync order status if matching
    const order = await this.orderRepo.findById(shipment.orderId);
    if (order) {
      if (input.data.status === 'DELIVERED' && order.orderStatus !== 'DELIVERED') {
        order.deliver();
        await this.orderRepo.save(order);
      } else if (input.data.status === 'OUT_FOR_DELIVERY' && order.orderStatus !== 'OUT_FOR_DELIVERY') {
        order.outForDelivery();
        await this.orderRepo.save(order);
      }
    }

    return mapToShipmentResponseDTO(saved);
  }
}

export class GetAllShipmentsUseCase implements IUseCase<any, { data: ShipmentResponseDTO[]; total: number }> {
  constructor(private readonly shipmentRepo: IShipmentRepository) {}

  async execute(query: any): Promise<{ data: ShipmentResponseDTO[]; total: number }> {
    const res = await this.shipmentRepo.findAllShipments(query || {});
    return {
      data: res.data.map(s => mapToShipmentResponseDTO(s)),
      total: res.total,
    };
  }
}
