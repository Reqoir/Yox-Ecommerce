/**
 * @file shipment.use-cases.ts
 * @layer Application › Use Cases
 */

import crypto from 'crypto';
import { z } from 'zod';
import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import {
  ApplicationError,
  ConflictError,
  UnauthorizedError,
} from '@core/application/errors/application.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { ApiError } from '@shared/utils/api-error.util';
import { env } from '@core/infrastructure/config/env';
import { IShipmentRepository } from '../../domain/repositories/shipment.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { Shipment } from '../../domain/entities/shipment.entity';
import { CreateShipmentRequestDTO, UpdateShipmentStatusRequestDTO, ShipmentResponseDTO } from '../dtos/shipment.dto';
import { ShiprocketService } from '../../infrastructure/services/shiprocket.service';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import {
  MongooseWebhookEventDeduplicator,
  WebhookEventDeduplicator,
} from '../../../payments/application/use-cases/razorpay-webhook.use-case';

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
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo?: IOrderRepository
  ) {}

  async execute(orderId: string): Promise<ShipmentResponseDTO | null> {
    let shipment = await this.shipmentRepo.findByOrderId(orderId);
    const order = this.orderRepo ? await this.orderRepo.findById(orderId) : null;

    // 1. If shipment exists with an AWB / tracking number, query Shiprocket live tracking
    if (shipment?.trackingNumber) {
      try {
        const liveTracking = await ShiprocketService.getInstance().trackByAwb(shipment.trackingNumber);
        if (liveTracking?.estimatedDeliveryDate) {
          const estDate = new Date(liveTracking.estimatedDeliveryDate);
          if (!isNaN(estDate.getTime())) {
            (shipment as any)._props.estimatedDeliveryDate = estDate;
            if (liveTracking.courierName) {
              (shipment as any)._props.deliveryPartnerId = liveTracking.courierName;
            }
            await this.shipmentRepo.save(shipment);
          }
        }
      } catch {}
    }

    // 2. If shipment does NOT exist or has no estimated delivery date, query Shiprocket serviceability
    if (order && (!shipment || !shipment.estimatedDeliveryDate)) {
      try {
        const postalCode = order.shippingAddress?.postalCode;
        if (postalCode) {
          const serviceability = await ShiprocketService.getInstance().getEstimatedDelivery({
            deliveryPincode: postalCode,
            isCod: order.paymentMethod?.toUpperCase() === 'COD',
          });

          if (serviceability) {
            const estDate = new Date(serviceability.estimatedDeliveryDate);
            if (!shipment) {
              return {
                id: `ship_${order.id}`,
                orderId: order.id,
                deliveryPartnerId: serviceability.courierName,
                trackingNumber: order.trackingNumber || null,
                status: 'READY_TO_SHIP',
                estimatedDeliveryDate: estDate,
                notes: 'Shiprocket courier serviceability estimate',
                createdAt: new Date(),
                updatedAt: new Date(),
              };
            } else if (!shipment.estimatedDeliveryDate) {
              (shipment as any)._props.estimatedDeliveryDate = estDate;
              if (!shipment.deliveryPartnerId) {
                (shipment as any)._props.deliveryPartnerId = serviceability.courierName;
              }
              await this.shipmentRepo.save(shipment);
            }
          }
        }
      } catch {}
    }

    if (!shipment) return null;
    return mapToShipmentResponseDTO(shipment);
  }
}

export interface TrackShipmentInput {
  trackingNumber: string;
  userId?: string;
  isAdmin?: boolean;
}

export class TrackShipmentUseCase implements IUseCase<string | TrackShipmentInput, ShipmentResponseDTO> {
  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(input: string | TrackShipmentInput): Promise<ShipmentResponseDTO> {
    const trackingNumber = typeof input === 'string' ? input : input.trackingNumber;
    const userId = typeof input === 'object' ? input.userId : undefined;
    const isAdmin = typeof input === 'object' ? Boolean(input.isAdmin) : false;

    const cleanNumber = (trackingNumber || '').trim();
    if (!cleanNumber) {
      throw ApiError.badRequest('Please enter your Order ID or AWB Tracking Number');
    }

    // 1. Verify user's active orders in local database first (never hit 3rd-party API without checking local DB)
    let order: any = null;
    let shipment: any = null;

    // Check by Order Number
    order = await this.orderRepo.findByOrderNumber(cleanNumber);
    if (order) {
      // Validate customer ownership
      if (userId && !isAdmin && order.userId !== userId) {
        throw ApiError.forbidden('You are not authorized to track this order.');
      }
      shipment = await this.shipmentRepo.findByOrderId(order.id);
    } else {
      // Check by Tracking Number / AWB Code
      shipment = await this.shipmentRepo.findByTrackingNumber(cleanNumber);
      if (shipment) {
        order = await this.orderRepo.findById(shipment.orderId);
        if (order && userId && !isAdmin && order.userId !== userId) {
          throw ApiError.forbidden('You are not authorized to track this shipment.');
        }
      }
    }

    // 2. If no matching order or shipment was found in our database:
    if (!order && !shipment) {
      if (userId && !isAdmin) {
        const userOrders = await this.orderRepo.findByUserId(userId, { limit: 1 });
        if (userOrders.total === 0) {
          throw ApiError.notFound('You currently have no active orders in your account to track.');
        }
      }
      throw ApiError.notFound('No order found in your account matching this Order ID or AWB code.');
    }

    // If order was cancelled, return shipment status without calling external thirdparty API
    if (order && order.orderStatus === 'CANCELLED') {
      if (shipment) return mapToShipmentResponseDTO(shipment);
      return {
        id: `cancelled_${order.id}`,
        orderId: order.id,
        deliveryPartnerId: 'Standard Logistics',
        trackingNumber: order.orderNumber,
        status: 'CANCELLED',
        estimatedDeliveryDate: null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
    }

    // 3. Only if a valid active order exists for this user and an AWB is assigned, query Shiprocket for live scans
    const awbToQuery = shipment?.awbCode || shipment?.trackingNumber;
    if (shipment && awbToQuery && awbToQuery.trim() !== '') {
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
        if (liveTrack.estimatedDeliveryDate) {
          (shipment as any)._props.estimatedDeliveryDate = new Date(liveTrack.estimatedDeliveryDate);
        }
        if (liveTrack.courierName) {
          (shipment as any)._props.deliveryPartnerId = liveTrack.courierName;
        }
        await this.shipmentRepo.save(shipment);

        // Sync order status
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

    if (!shipment) {
      return {
        id: `pending_${order.id}`,
        orderId: order.id,
        deliveryPartnerId: 'Standard Logistics',
        trackingNumber: order.orderNumber,
        status: order.orderStatus || 'CONFIRMED',
        estimatedDeliveryDate: null,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      };
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

const shiprocketWebhookSchema = z
  .object({
    awb: z.union([z.string(), z.number()]).nullish(),
    awb_code: z.union([z.string(), z.number()]).nullish(),
    tracking_number: z.union([z.string(), z.number()]).nullish(),
    current_status: z.string().trim().nullish(),
    status: z.string().trim().nullish(),
    shipment_status: z.string().trim().nullish(),
    current_status_id: z.union([z.string(), z.number()]).nullish(),
    order_id: z.union([z.string(), z.number()]).nullish(),
    orderNumber: z.string().nullish(),
    orderId: z.string().nullish(),
    order_number: z.string().nullish(),
    channel_order_id: z.union([z.string(), z.number()]).nullish(),
    sr_order_id: z.union([z.string(), z.number()]).nullish(),
    shipment_id: z.union([z.string(), z.number()]).nullish(),
    courier_name: z.string().nullish(),
    current_timestamp: z.union([z.string(), z.number()]).nullish(),
    etd: z.string().nullish(),
    edd: z.string().nullish(),
    is_return: z.union([z.string(), z.number(), z.boolean()]).nullish(),
    scans: z.array(z.any()).nullish(),
  })
  .passthrough();

function timingSafeSecretEquals(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (providedBuf.length === 0 || providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

export class HandleShiprocketWebhookUseCase {
  private readonly deduplicator: WebhookEventDeduplicator;

  constructor(
    private readonly shipmentRepo: IShipmentRepository,
    private readonly orderRepo: IOrderRepository,
    deduplicator?: WebhookEventDeduplicator
  ) {
    this.deduplicator = deduplicator ?? new MongooseWebhookEventDeduplicator();
  }

  async execute(input: {
    payload?: any;
    apiKey?: string;
    expectedSecret?: string;
    eventId?: string;
  } | any): Promise<{ success: boolean; duplicate?: boolean; message: string }> {
    const isWrapped =
      input &&
      typeof input === 'object' &&
      ('payload' in input || 'apiKey' in input || 'expectedSecret' in input);
    const rawPayload = isWrapped ? input.payload : input;
    const providedApiKey = isWrapped && typeof input.apiKey === 'string' ? input.apiKey.trim() : '';
    const configuredSecret = (
      (isWrapped && typeof input.expectedSecret === 'string' ? input.expectedSecret : undefined) ??
      env.SHIPROCKET_WEBHOOK_SECRET ??
      ''
    ).trim();

    // SEC-CRIT-003: Mandatory shared-secret verification using timing-safe comparison
    if (!configuredSecret) {
      throw new UnauthorizedError('Shiprocket webhook secret is not configured');
    }
    if (!providedApiKey || !timingSafeSecretEquals(providedApiKey, configuredSecret)) {
      throw new UnauthorizedError('Invalid or missing Shiprocket webhook x-api-key');
    }

    const parsedResult = shiprocketWebhookSchema.safeParse(rawPayload);
    if (!parsedResult.success) {
      throw new ValidationError('Invalid Shiprocket webhook payload format');
    }
    const payload = parsedResult.data;

    const awb = payload.awb ?? payload.awb_code ?? payload.tracking_number;
    const rawAwb = awb !== undefined && awb !== null ? String(awb).trim() : '';
    const awbStr = rawAwb.length > 0 ? rawAwb : undefined;
    const currentStatus = (payload.current_status || payload.status || payload.shipment_status || '')
      .trim()
      .toUpperCase();
    const rawOrderNumber =
      payload.order_id ??
      payload.orderNumber ??
      payload.orderId ??
      payload.order_number ??
      payload.channel_order_id;
    const rawOrderStr =
      rawOrderNumber !== undefined && rawOrderNumber !== null ? String(rawOrderNumber).trim() : '';
    const normalizedOrderNumber = rawOrderStr.length > 0 ? rawOrderStr : undefined;

    // Shiprocket's dashboard "Test Webhook" / save verification can send an authenticated
    // empty JSON ping (`{}`) or sample object without AWB/Order IDs and expects HTTP 200.
    // Shared-secret auth (x-api-key) is verified above; reply cleanly without touching DB state.
    if (!awbStr && !normalizedOrderNumber) {
      return {
        success: true,
        message: 'Shiprocket webhook connectivity verified',
      };
    }

    const eventKeySource = JSON.stringify({
      awb: awbStr || null,
      order: normalizedOrderNumber || null,
      status: currentStatus,
      timestamp: payload.current_timestamp || null,
      scansCount: Array.isArray(payload.scans) ? payload.scans.length : 0,
    });
    const eventId =
      (isWrapped && input.eventId) ||
      crypto.createHash('sha256').update(eventKeySource).digest('hex');

    const isNew = await this.deduplicator.recordIfNew({
      provider: 'SHIPROCKET',
      eventId,
      eventType: currentStatus || 'SHIPROCKET_UPDATE',
    });
    if (!isNew) {
      return {
        success: true,
        duplicate: true,
        message: 'Duplicate Shiprocket webhook event ignored',
      };
    }

    try {
      const { result, orderId } = await this.applyWebhookUpdate(payload, {
        awbStr,
        currentStatus,
        rawOrderNumber: normalizedOrderNumber,
      });
      await this.deduplicator.markProcessed?.('SHIPROCKET', eventId, orderId);
      return result;
    } catch (error: any) {
      await this.deduplicator.markFailed?.('SHIPROCKET', eventId, error?.message || 'Shiprocket webhook error');
      throw error;
    }
  }

  private async applyWebhookUpdate(
    payload: any,
    ctx: { awbStr?: string; currentStatus: string; rawOrderNumber: any }
  ): Promise<{ result: { success: boolean; duplicate?: boolean; message: string }; orderId: string | null }> {
    const { awbStr, currentStatus, rawOrderNumber } = ctx;
    let shipment: Shipment | null = null;
    let order: any = null;

    // 1. Try finding by AWB code if provided
    if (awbStr) {
      shipment = await this.shipmentRepo.findByTrackingNumber(awbStr);
    }

    // 2. Try finding by Order Identifier (MongoDB ID, exact Order Number, or formatted)
    if (rawOrderNumber !== undefined && rawOrderNumber !== null) {
      const orderStr = String(rawOrderNumber).trim();

      if (/^[0-9a-fA-F]{24}$/.test(orderStr)) {
        order = await this.orderRepo.findById(orderStr);
      }
      if (!order) {
        order = await this.orderRepo.findByOrderNumber(orderStr);
      }
      if (!order && /^\d+$/.test(orderStr)) {
        order = await this.orderRepo.findById(orderStr);
      }
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

    // 4. Require matching order and valid linkage
    if (!order && !shipment) {
      return {
        orderId: null,
        result: {
          success: false,
          message: `Matching order #${rawOrderNumber || 'N/A'} or AWB #${awbStr || 'N/A'} not found in database.`,
        },
      };
    }

    if (shipment && order && shipment.orderId !== order.id) {
      throw new ConflictError('Shiprocket webhook AWB/shipment does not belong to the referenced order');
    }

    if (
      payload.sr_order_id !== undefined &&
      payload.sr_order_id !== null &&
      String(payload.sr_order_id).trim() !== '' &&
      order?.shiprocketOrderId &&
      String(order.shiprocketOrderId) !== String(payload.sr_order_id)
    ) {
      throw new ConflictError('Shiprocket order ID mismatch against stored order');
    }

    if (
      payload.shipment_id !== undefined &&
      payload.shipment_id !== null &&
      String(payload.shipment_id).trim() !== '' &&
      shipment?.shiprocketShipmentId &&
      String(shipment.shiprocketShipmentId) !== String(payload.shipment_id)
    ) {
      throw new ConflictError('Shiprocket shipment ID mismatch against stored shipment');
    }

    // Never allow webhook to fabricate a shipment for an order that was never dispatched via Shiprocket
    if (order && !shipment && !order.shiprocketOrderId) {
      throw new ConflictError('Order has no active Shiprocket shipment linked');
    }

    if (order && !shipment && order.shiprocketOrderId) {
      shipment = Shipment.create({
        orderId: order.id,
        deliveryPartnerId: payload.courier_name || order.deliveryPartnerId || 'Shiprocket Partner',
        trackingNumber: awbStr || order.trackingNumber || null,
        awbCode: awbStr || order.trackingNumber || null,
        shiprocketOrderId: order.shiprocketOrderId,
        shiprocketShipmentId: order.shiprocketShipmentId || (payload.shipment_id ? String(payload.shipment_id) : null),
        status: 'READY_TO_SHIP',
        estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        notes: 'Shipment registered via verified Shiprocket webhook',
      });
    }

    // Never ship or deliver unpaid online orders via logistics webhook
    if (order && order.paymentMethod === 'RAZORPAY' && order.paymentStatus !== 'PAID') {
      throw new ConflictError('Cannot advance fulfillment status for an unpaid online order via courier webhook');
    }

    // Ensure AWB is attached if provided in webhook
    if (awbStr && shipment && !shipment.trackingNumber) {
      shipment.setTracking(awbStr, payload.courier_name);
    }

    // Process scans if provided
    if (shipment && Array.isArray(payload.scans) && payload.scans.length > 0) {
      const formatted = payload.scans.map((s: any) => ({
        date: s.date || new Date().toISOString(),
        status: s.status || 'UPDATE',
        activity: s.activity || s.location || '',
        location: s.location || 'Hub',
      }));
      shipment.updateTrackingActivities(formatted);
    }

    // SEC-CRIT-003: Strict fulfillment transitions ONLY — webhooks NEVER modify paymentStatus (not even COD)
    try {
      if (currentStatus.includes('DELIVERED')) {
        if (order && order.orderStatus !== 'DELIVERED') {
          order.deliver({ syncCodPayment: false });
        }
        if (shipment) shipment.updateStatus('DELIVERED', 'Delivered via Shiprocket webhook');
      } else if (currentStatus.includes('OUT FOR DELIVERY')) {
        if (order && order.orderStatus !== 'OUT_FOR_DELIVERY') {
          order.outForDelivery();
        }
        if (shipment) shipment.updateStatus('OUT_FOR_DELIVERY', 'Out for delivery via Shiprocket');
      } else if (
        currentStatus.includes('IN TRANSIT') ||
        currentStatus.includes('PICKED UP') ||
        currentStatus.includes('SHIPPED')
      ) {
        if (order && !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.orderStatus)) {
          order.ship(awbStr || order.trackingNumber, payload.courier_name || shipment?.courierName || undefined);
        }
        if (shipment) shipment.updateStatus('SHIPPED', 'In transit via Shiprocket');
      } else if (currentStatus.includes('RTO') || currentStatus.includes('RETURNED')) {
        if (order && !['SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED'].includes(order.orderStatus)) {
          throw new ConflictError(`Cannot mark RTO/RETURNED from order status ${order.orderStatus}`);
        }
        if (shipment) shipment.updateStatus('RETURNED_TO_SELLER', 'Returned to origin via Shiprocket');
        if (order && order.orderStatus !== 'RETURNED') {
          order.updateStatus('RETURNED', 'Return to origin initiated');
        }
      } else if (currentStatus.includes('CANCEL')) {
        if (order && ['DELIVERED', 'RETURNED'].includes(order.orderStatus)) {
          throw new ConflictError(`Cannot cancel order in terminal status ${order.orderStatus}`);
        }
        if (shipment) shipment.updateStatus('RETURNED_TO_SELLER', 'Cancelled via courier');
        if (order && order.orderStatus !== 'CANCELLED') {
          // Do not overwrite paymentStatus on webhook; transition only orderStatus safely via updateStatus
          order.updateStatus('CANCELLED', 'Cancelled via courier webhook');
        }
      }
    } catch (transitionErr: any) {
      if (transitionErr instanceof ConflictError) throw transitionErr;
      throw new ConflictError(transitionErr?.message || 'Invalid order state transition from webhook');
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
            awb: awbStr,
          },
        });
      } catch {}
    }

    return {
      orderId: order?.id || null,
      result: {
        success: true,
        message: `Order #${order?.orderNumber || order?.id} status successfully updated to ${currentStatus}`,
      },
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
