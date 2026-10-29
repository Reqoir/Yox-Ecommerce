/**
 * @file shipment.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { ApplicationError } from '@core/application/errors/application.error';
import { IShipmentRepository } from '../../domain/repositories/shipment.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Shipment } from '../../domain/entities/shipment.entity';
import { CreateShipmentRequestDTO, UpdateShipmentStatusRequestDTO, ShipmentResponseDTO } from '../dtos/shipment.dto';
import { ShiprocketService } from '../../infrastructure/services/shiprocket.service';
import { NotificationService } from '../../../notifications/application/services/notification.service';

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
    shiprocketOrderId: shipment.shiprocketOrderId,
    shiprocketShipmentId: shipment.shiprocketShipmentId,
    awbCode: shipment.awbCode,
    courierName: shipment.courierName,
    pickupTokenNumber: shipment.pickupTokenNumber,
    pickupScheduledDate: shipment.pickupScheduledDate,
    labelUrl: shipment.labelUrl,
    invoiceUrl: shipment.invoiceUrl,
    trackingActivities: shipment.trackingActivities,
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

export class GetShipmentByOrderUseCase implements IUseCase<string, ShipmentResponseDTO | null> {
  constructor(private readonly shipmentRepo: IShipmentRepository) {}

  async execute(orderId: string): Promise<ShipmentResponseDTO | null> {
    const shipment = await this.shipmentRepo.findByOrderId(orderId);
    if (!shipment) return null;
    return mapToShipmentResponseDTO(shipment);
  }
}

export class TrackShipmentUseCase implements IUseCase<string, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(trackingNumber: string): Promise<ShipmentResponseDTO> {
    const cleanNumber = trackingNumber.trim();
    let shipment = await this.shipmentRepo.findByTrackingNumber(cleanNumber);
    if (!shipment) {
      // Fallback check order by tracking number or order number
      const order = await this.orderRepo.findByOrderNumber(cleanNumber);
      if (order) {
        shipment = await this.shipmentRepo.findByOrderId(order.id);
      }
    }
    if (!shipment) throw new Error('No active tracking info found for this tracking number');

    // Attempt live tracking fetch from Shiprocket if awbCode or trackingNumber exists
    const awbToQuery = shipment.awbCode || shipment.trackingNumber;
    if (awbToQuery) {
      try {
        const liveTrack = await ShiprocketService.getInstance().trackByAwb(awbToQuery);
        if (liveTrack.scans && liveTrack.scans.length > 0) {
          shipment.updateTrackingActivities(liveTrack.scans);
        }

        // Status normalization
        const upper = (liveTrack.currentStatus || '').toUpperCase();
        let normalizedStatus = shipment.status;
        if (upper.includes('DELIVERED')) {
          normalizedStatus = 'DELIVERED';
        } else if (upper.includes('OUT FOR DELIVERY')) {
          normalizedStatus = 'OUT_FOR_DELIVERY';
        } else if (upper.includes('IN TRANSIT') || upper.includes('PICKED UP') || upper.includes('SHIPPED')) {
          normalizedStatus = 'SHIPPED';
        }

        if (normalizedStatus !== shipment.status) {
          shipment.updateStatus(normalizedStatus, `Shiprocket status: ${liveTrack.currentStatus}`);
        }
        await this.shipmentRepo.save(shipment);

        // Sync order status
        const order = await this.orderRepo.findById(shipment.orderId);
        if (order) {
          if (normalizedStatus === 'DELIVERED' && order.orderStatus !== 'DELIVERED') {
            order.deliver();
            await this.orderRepo.save(order);
          } else if (normalizedStatus === 'OUT_FOR_DELIVERY' && order.orderStatus !== 'OUT_FOR_DELIVERY') {
            order.outForDelivery();
            await this.orderRepo.save(order);
          } else if (normalizedStatus === 'SHIPPED' && (order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED' || order.orderStatus === 'PLACED')) {
            order.ship(awbToQuery, shipment.courierName || shipment.deliveryPartnerId || undefined);
            await this.orderRepo.save(order);
          }
        }
      } catch (trackErr: any) {
        console.warn('Live Shiprocket tracking query notice:', trackErr.message);
      }
    }

    return mapToShipmentResponseDTO(shipment);
  }
}

export class SyncCourierStatusUseCase implements IUseCase<string, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(orderId: string): Promise<ShipmentResponseDTO> {
    let order = await this.orderRepo.findById(orderId);
    if (!order) order = await this.orderRepo.findByOrderNumber(orderId);
    if (!order && typeof orderId === 'string') {
      const alt = orderId.startsWith('YOX-') ? orderId.replace('YOX-', '') : `YOX-${orderId}`;
      order = await this.orderRepo.findByOrderNumber(alt);
    }
    if (!order) throw new ApplicationError('Order not found', 'NOT_FOUND');

    let shipment = await this.shipmentRepo.findByOrderId(order.id);
    if (!shipment) {
      shipment = Shipment.create({
        orderId: order.id,
        deliveryPartnerId: order.deliveryPartnerId || 'Shiprocket Partner',
        trackingNumber: order.trackingNumber || null,
        status: order.orderStatus === 'DELIVERED' ? 'DELIVERED' : order.orderStatus === 'SHIPPED' ? 'SHIPPED' : 'READY_TO_SHIP',
        estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        notes: 'Shipment auto-initialized on courier status sync',
      });
      await this.shipmentRepo.save(shipment);
    }

    let awb = shipment.awbCode || shipment.trackingNumber || order.trackingNumber;
    const srShipmentId = shipment.shiprocketShipmentId || order.shiprocketShipmentId;

    // If order has been booked in Shiprocket but has no AWB assigned yet (e.g. after wallet recharge), attempt to assign now
    if (!awb && srShipmentId) {
      try {
        const awbRes = await ShiprocketService.getInstance().assignAwb(srShipmentId);
        if (awbRes.awbCode) {
          awb = awbRes.awbCode;
          shipment.setTracking(awbRes.awbCode, awbRes.courierName);
          order.attachShiprocket({
            shiprocketOrderId: shipment.shiprocketOrderId || order.shiprocketOrderId || 0,
            shiprocketShipmentId: srShipmentId,
            awbCode: awbRes.awbCode,
            courierName: awbRes.courierName,
          });

          try {
            const labelUrl = await ShiprocketService.getInstance().generateLabel(srShipmentId);
            if (labelUrl) {
              shipment.attachShiprocketDetails({
                shiprocketOrderId: shipment.shiprocketOrderId || order.shiprocketOrderId || 0,
                shiprocketShipmentId: srShipmentId,
                labelUrl,
              });
              order.attachShiprocket({
                shiprocketOrderId: shipment.shiprocketOrderId || order.shiprocketOrderId || 0,
                shiprocketShipmentId: srShipmentId,
                labelUrl,
              });
            }
          } catch {}

          await this.orderRepo.save(order);
          await this.shipmentRepo.save(shipment);
        }
      } catch (awbErr: any) {
        throw new ApplicationError(awbErr.message || 'AWB assignment failed', 'BAD_REQUEST');
      }
    }

    if (!awb) {
      // Order is awaiting courier assignment (e.g. newly placed). Return current shipment state without 500 error
      return mapToShipmentResponseDTO(shipment);
    }

    try {
      const liveTrack = await ShiprocketService.getInstance().trackByAwb(awb);
      if (liveTrack.scans && liveTrack.scans.length > 0) {
        shipment.updateTrackingActivities(liveTrack.scans);
      }

      const upper = (liveTrack.currentStatus || '').toUpperCase();
      let normalized = shipment.status;
      if (upper.includes('DELIVERED')) {
        normalized = 'DELIVERED';
      } else if (upper.includes('OUT FOR DELIVERY')) {
        normalized = 'OUT_FOR_DELIVERY';
      } else if (upper.includes('IN TRANSIT') || upper.includes('PICKED UP') || upper.includes('SHIPPED')) {
        normalized = 'SHIPPED';
      }

      if (normalized !== shipment.status) {
        shipment.updateStatus(normalized, `Synced from Shiprocket: ${liveTrack.currentStatus}`);
      }

      if (normalized === 'DELIVERED' && order.orderStatus !== 'DELIVERED') {
        order.deliver();
        await this.orderRepo.save(order);
      } else if (normalized === 'OUT_FOR_DELIVERY' && order.orderStatus !== 'OUT_FOR_DELIVERY') {
        order.outForDelivery();
        await this.orderRepo.save(order);
      } else if (normalized === 'SHIPPED' && order.orderStatus !== 'SHIPPED') {
        order.ship(awb, shipment.courierName || undefined);
        await this.orderRepo.save(order);
      }
    } catch (trackErr: any) {
      console.warn('Live Shiprocket tracking query notice:', trackErr.message);
    }

    const savedShipment = await this.shipmentRepo.save(shipment);
    return mapToShipmentResponseDTO(savedShipment);
  }
}

export class GenerateShipmentLabelUseCase implements IUseCase<string, { labelUrl: string | null }> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(orderId: string): Promise<{ labelUrl: string | null }> {
    let order = await this.orderRepo.findById(orderId);
    if (!order) order = await this.orderRepo.findByOrderNumber(orderId);
    if (!order) throw new Error('Order not found');

    let shipment = await this.shipmentRepo.findByOrderId(order.id);
    const shipmentId = shipment?.shiprocketShipmentId || order.shiprocketShipmentId;
    if (!shipmentId) throw new Error('Shipment has not been registered in Shiprocket yet');

    const labelUrl = await ShiprocketService.getInstance().generateLabel(shipmentId);
    if (labelUrl && shipment) {
      shipment.attachShiprocketDetails({
        shiprocketOrderId: shipment.shiprocketOrderId || order.shiprocketOrderId || 0,
        shiprocketShipmentId: shipmentId,
        labelUrl,
      });
      await this.shipmentRepo.save(shipment);
    }
    return { labelUrl };
  }
}

export class GenerateShipmentInvoiceUseCase implements IUseCase<string, { invoiceUrl: string | null }> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(orderId: string): Promise<{ invoiceUrl: string | null }> {
    let order = await this.orderRepo.findById(orderId);
    if (!order) order = await this.orderRepo.findByOrderNumber(orderId);
    if (!order) throw new Error('Order not found');

    const srOrderId = order.shiprocketOrderId || (await this.shipmentRepo.findByOrderId(order.id))?.shiprocketOrderId;
    if (!srOrderId) throw new Error('Order has not been registered in Shiprocket yet');

    const invoiceUrl = await ShiprocketService.getInstance().printInvoice(srOrderId);
    return { invoiceUrl };
  }
}

export class HandleShiprocketWebhookUseCase {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(payload: any): Promise<{ success: boolean; message: string }> {
    const awb = payload?.awb || payload?.awb_code || payload?.tracking_number;
    const currentStatus = (payload?.current_status || payload?.status || '').toUpperCase();
    const rawOrderNumber = payload?.order_id || payload?.orderNumber || payload?.orderId || payload?.order_number;

    let shipment: Shipment | null = null;
    let order: any = null;

    // 1. Try finding by AWB code if provided
    if (awb) {
      shipment = await this.shipmentRepo.findByTrackingNumber(awb);
    }

    // 2. Try finding by Order Identifier (MongoDB ID, exact Order Number, or formatted)
    if (rawOrderNumber) {
      const orderStr = String(rawOrderNumber).trim();

      // Check if it is a 24-character hex MongoDB ID
      if (/^[0-9a-fA-F]{24}$/.test(orderStr)) {
        order = await this.orderRepo.findById(orderStr);
      }

      // Check by orderNumber directly
      if (!order) {
        order = await this.orderRepo.findByOrderNumber(orderStr);
      }

      // Check with/without YOX- prefix
      if (!order) {
        const alt = orderStr.startsWith('YOX-')
          ? orderStr.replace('YOX-', '')
          : `YOX-${orderStr}`;
        order = await this.orderRepo.findByOrderNumber(alt);
      }

      if (order && !shipment) {
        shipment = await this.shipmentRepo.findByOrderId(order.id);
      }
    }

    // 3. If shipment was found by AWB, resolve order
    if (!order && shipment) {
      order = await this.orderRepo.findById(shipment.orderId);
    }

    // 4. If neither order nor shipment found, return helpful diagnostic message
    if (!shipment && !order) {
      return {
        success: false,
        message: `Matching order #${rawOrderNumber || 'N/A'} or AWB #${awb || 'N/A'} not found in database. Ensure you use an existing Order Number (e.g. YOX-...) or Order ID.`,
      };
    }

    // 5. If order found but shipment entity doesn't exist yet, auto-create shipment
    if (order && !shipment) {
      shipment = Shipment.create({
        orderId: order.id,
        deliveryPartnerId: payload?.courier_name || order.deliveryPartnerId || 'Shiprocket Partner',
        trackingNumber: awb || order.trackingNumber || null,
        awbCode: awb || order.trackingNumber || null,
        status: 'READY_TO_SHIP',
        estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        notes: 'Shipment auto-registered via webhook update',
      });
    }

    // Ensure AWB is attached if provided in webhook
    if (awb && shipment && !shipment.trackingNumber) {
      shipment.setTracking(awb, payload?.courier_name);
    }

    // Process scans if provided
    if (shipment && Array.isArray(payload?.scans) && payload.scans.length > 0) {
      const formatted = payload.scans.map((s: any) => ({
        date: s.date || new Date().toISOString(),
        status: s.status || 'UPDATE',
        activity: s.activity || s.location || '',
        location: s.location || 'Hub',
      }));
      shipment.updateTrackingActivities(formatted);
    }

    // Status mapping
    if (currentStatus.includes('DELIVERED')) {
      if (shipment) shipment.updateStatus('DELIVERED', 'Delivered via Shiprocket webhook');
      if (order && order.orderStatus !== 'DELIVERED') order.deliver();
    } else if (currentStatus.includes('OUT FOR DELIVERY')) {
      if (shipment) shipment.updateStatus('OUT_FOR_DELIVERY', 'Out for delivery via Shiprocket');
      if (order && order.orderStatus !== 'OUT_FOR_DELIVERY') order.outForDelivery();
    } else if (currentStatus.includes('IN TRANSIT') || currentStatus.includes('PICKED UP') || currentStatus.includes('SHIPPED')) {
      if (shipment) shipment.updateStatus('SHIPPED', 'In transit via Shiprocket');
      if (order && (order.orderStatus === 'CONFIRMED' || order.orderStatus === 'PACKED' || order.orderStatus === 'PLACED')) {
        order.ship(awb || order.trackingNumber, payload?.courier_name || shipment?.courierName || undefined);
      }
    } else if (currentStatus.includes('RTO') || currentStatus.includes('RETURNED')) {
      if (shipment) shipment.updateStatus('RETURNED_TO_SELLER', 'Returned to origin via Shiprocket');
      if (order) order.updateStatus('RETURNED', 'Return to origin initiated');
    } else if (currentStatus.includes('CANCEL')) {
      if (shipment) shipment.updateStatus('RETURNED_TO_SELLER', 'Cancelled via courier');
      if (order && order.orderStatus !== 'CANCELLED') order.cancel({ reason: 'Cancelled via courier update', isAdmin: true });
    }

    if (shipment) await this.shipmentRepo.save(shipment);
    if (order) await this.orderRepo.save(order);

    if (order) {
      try {
        await NotificationService.getInstance().notify({
          userId: order.userId,
          type: 'ORDER_STATUS',
          title: `🚚 Tracking Update: Order #${order.orderNumber}`,
          message: `Your package status is updated to: ${currentStatus || 'In Progress'}`,
          metadata: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: currentStatus,
            awb,
          },
        });
      } catch {}
    }

    return {
      success: true,
      message: `Order #${order?.orderNumber || order?.id} status successfully updated to ${currentStatus}`,
    };
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
