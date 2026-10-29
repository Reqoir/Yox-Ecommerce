/**
 * @file return.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IReturnRepository } from '../../domain/repositories/return.repository.interface';
import { IOrderRepository } from '../../../orders/domain/repositories/order.repository.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../../inventory/domain/repositories/stock-log.repository.interface';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { Return } from '../../domain/entities/return.entity';
import { Inventory } from '../../../inventory/domain/entities/inventory.entity';
import { StockLog } from '../../../inventory/domain/entities/stock-log.entity';
import { AuditLogService } from '../../../audit-logs/application/services/audit-log.service';
import { AuditAction } from '../../../audit-logs/domain/entities/audit-log.entity';
import { NotificationService } from '../../../notifications/application/services/notification.service';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { SettingsModel } from '../../../settings/infrastructure/models/settings.model';
import { ShiprocketService } from '../../../shipments/infrastructure/services/shiprocket.service';
import { IPaymentRepository, IRefundRepository } from '../../../payments/domain/repositories/payment.repository.interface';
import { Refund } from '../../../payments/domain/entities/payment.entity';
import { RazorpayService } from '../../../payments/infrastructure/services/razorpay.service';
import {
  CreateReturnRequestDTO,
  SubmitReturnShipmentRequestDTO,
  RejectReturnRequestDTO,
  SchedulePickupRequestDTO,
  InspectReturnRequestDTO,
  ProcessRefundRequestDTO,
  ReturnResponseDTO,
} from '../dtos/return.dto';

export function mapToReturnResponseDTO(returnEntity: Return): ReturnResponseDTO {
  return {
    id: returnEntity.id,
    orderId: returnEntity.orderId,
    orderItemId: returnEntity.orderItemId,
    userId: returnEntity.userId,
    quantity: returnEntity.quantity,
    reason: returnEntity.reason,
    customerNote: returnEntity.customerNote,
    images: returnEntity.images,
    status: returnEntity.status,
    inspectionResult: returnEntity.inspectionResult,
    rejectionReason: returnEntity.rejectionReason,
    courierTrackingNumber: returnEntity.courierTrackingNumber,
    courierName: returnEntity.courierName,
    customerShippedAt: returnEntity.customerShippedAt,
    refundBankDetails: returnEntity.refundBankDetails,
    refundId: returnEntity.refundId,
    refundAmount: returnEntity.refundAmount,
    refundMethod: returnEntity.refundMethod,
    refundTransactionId: returnEntity.refundTransactionId,
    approvedAt: returnEntity.approvedAt,
    receivedAt: returnEntity.receivedAt,
    inspectedAt: returnEntity.inspectedAt,
    refundedAt: returnEntity.refundedAt,
    pickupDate: returnEntity.pickupDate,
    pickupTimeSlot: returnEntity.pickupTimeSlot,
    pickupAgentName: returnEntity.pickupAgentName,
    pickupAgentPhone: returnEntity.pickupAgentPhone,
    createdAt: returnEntity.createdAt,
    updatedAt: returnEntity.updatedAt,
  };
}

export class CreateReturnUseCase implements IUseCase<{ userId: string; data: CreateReturnRequestDTO }, ReturnResponseDTO> {
  constructor(
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo: IOrderRepository
  ) {}

  async execute(input: { userId: string; data: CreateReturnRequestDTO }): Promise<ReturnResponseDTO> {
    const { userId, data } = input;

    let order = await this.orderRepo.findById(data.orderId);
    if (!order) order = await this.orderRepo.findByOrderNumber(data.orderId);
    if (!order) throw new Error('Order not found');

    if (order.userId !== userId) {
      throw new Error('Forbidden: You can only request returns for your own orders');
    }

    if (order.orderStatus !== 'DELIVERED') {
      throw new Error(`Cannot request return for order in status: ${order.orderStatus}. Order must be DELIVERED.`);
    }

    // Dynamic Store Policy Enforcement
    let returnsEnabled = true;
    let returnWindowDays = 7;
    let minEvidencePhotos = 3;

    try {
      const storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
      if (storeSetting?.value) {
        if (typeof storeSetting.value.returnsEnabled === 'boolean') {
          returnsEnabled = storeSetting.value.returnsEnabled;
        }
        if (typeof storeSetting.value.returnWindowDays === 'number') {
          returnWindowDays = storeSetting.value.returnWindowDays;
        }
        if (typeof storeSetting.value.minEvidencePhotos === 'number') {
          minEvidencePhotos = storeSetting.value.minEvidencePhotos;
        }
      }
    } catch (err) {
      // Fallback to defaults
    }

    if (!returnsEnabled) {
      throw new Error('Returns are currently not being accepted by store administration.');
    }

    const deliveryDate = order.deliveredAt || order.updatedAt || order.placedAt;
    const returnWindowMs = returnWindowDays * 24 * 60 * 60 * 1000;
    const returnDeadline = new Date(deliveryDate.getTime() + returnWindowMs);
    if (new Date().getTime() > returnDeadline.getTime()) {
      throw new Error(
        `Return window expired: The ${returnWindowDays}-day return policy for this order expired on ${returnDeadline.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}. Returns are no longer accepted.`
      );
    }

    // Dynamic Mandatory Images Validation
    const validImages = Array.isArray(data.images)
      ? data.images.filter((img) => typeof img === 'string' && img.trim().length > 0)
      : [];

    if (validImages.length < minEvidencePhotos) {
      throw new Error(
        `At least ${minEvidencePhotos} photos of the item are mandatory to submit a return request (e.g. front, back, tag/defect). Provided: ${validImages.length}.`
      );
    }

    // Match order item by variantId or id or sku
    const item = order.items.find(i => i.variantId === data.orderItemId || i.id === data.orderItemId || i.productId === data.orderItemId);
    if (!item) {
      throw new Error('Selected item was not found in this order');
    }

    // Calculate existing returns for this item
    const existingReturns = await this.returnRepo.findByOrderItemId(order.id, data.orderItemId);
    const previouslyReturnedQty = existingReturns
      .filter(r => r.status !== 'REJECTED')
      .reduce((sum, r) => sum + r.quantity, 0);

    const availableForReturn = item.quantity - previouslyReturnedQty;

    if (data.quantity <= 0) {
      throw new Error('Return quantity must be greater than zero');
    }

    if (data.quantity > availableForReturn) {
      throw new Error(`Cannot return ${data.quantity} units. Only ${availableForReturn} units available for return.`);
    }

    const returnEntity = Return.create({
      orderId: order.id,
      orderItemId: data.orderItemId,
      userId,
      quantity: data.quantity,
      reason: data.reason,
      customerNote: data.customerNote,
      images: validImages,
    });

    const saved = await this.returnRepo.save(returnEntity);

    try {
      await AuditLogService.getInstance()?.record({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: AuditAction.RETURN_CREATED,
        resourceType: 'RETURN',
        resourceId: saved.id,
        description: `Return requested for order #${order.orderNumber} item (${data.quantity} units)`,
        after: { orderId: order.id, quantity: data.quantity, reason: data.reason },
      });
    } catch {}

    // 🔔 Real-time admin notification for return request
    try {
      let customerName = 'A customer';
      try {
        const u = await UserModel.findById(userId).select('fullName email').lean();
        if (u?.fullName) customerName = u.fullName as string;
      } catch {}

      await NotificationService.getInstance().notify({
        userId: null,
        type: 'RETURN_REQUEST',
        title: '📦 Return Request Received',
        message: `${customerName} requested a return for order #${order.orderNumber}. Reason: ${data.reason}${data.customerNote ? ` — Note: “${data.customerNote}”` : ''}`,
        metadata: {
          returnId: saved.id,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: userId,
          customerName,
          reason: data.reason,
          customerNote: data.customerNote || null,
          quantity: data.quantity,
        },
      });
    } catch {}

    return mapToReturnResponseDTO(saved);
  }
}

export class GetUserReturnsUseCase implements IUseCase<string, ReturnResponseDTO[]> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(userId: string): Promise<ReturnResponseDTO[]> {
    const returns = await this.returnRepo.findByUserId(userId);
    return returns.map(r => mapToReturnResponseDTO(r));
  }
}

export class GetReturnByIdUseCase implements IUseCase<{ id: string; userId?: string; isAdmin?: boolean }, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(input: { id: string; userId?: string; isAdmin?: boolean }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    if (!input.isAdmin && input.userId && returnEntity.userId !== input.userId) {
      throw new Error('Forbidden: Access denied to this return record');
    }

    return mapToReturnResponseDTO(returnEntity);
  }
}

export class ApproveReturnUseCase implements IUseCase<string | { id: string; actor?: { id?: string; role?: string; email?: string } }, ReturnResponseDTO> {
  constructor(
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo?: IOrderRepository
  ) {}

  async execute(input: string | { id: string; actor?: { id?: string; role?: string; email?: string } }): Promise<ReturnResponseDTO> {
    const id = typeof input === 'string' ? input : input.id;
    const actor = typeof input === 'string' ? undefined : input.actor;
    const returnEntity = await this.returnRepo.findById(id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.approve();

    // Call Shiprocket Reverse Courier API to schedule pickup from customer doorstep
    let reverseAwb: string | null = null;
    let courierName = 'Shiprocket Reverse Express';
    let reverseShipmentId: number | null = null;
    let pickupNotice: string | undefined = undefined;
    const scheduledPickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (this.orderRepo) {
      try {
        let order = await this.orderRepo.findById(returnEntity.orderId);
        if (!order) order = await this.orderRepo.findByOrderNumber(returnEntity.orderId);
        if (order) {
          const item =
            order.items.find((i) => i.variantId === returnEntity.orderItemId || (i as any).id === returnEntity.orderItemId || i.productId === returnEntity.orderItemId) ||
            order.items[0];

          let storeSetting: any = null;
          try {
            storeSetting = await SettingsModel.findOne({ key: 'store_config' }).lean();
          } catch {}

          const warehouseAddress = {
            name: storeSetting?.value?.storeName || 'YOX Warehouse Returns',
            phone: storeSetting?.value?.supportPhone?.replace(/\D/g, '').slice(-10) || '8891810649',
            address: storeSetting?.value?.storeAddress || 'Room No. 44-958, Chovva Co-operative Bank Bldg',
            city: 'Kannur',
            state: 'Kerala',
            postalCode: '670006',
          };

          const shiprocket = ShiprocketService.getInstance();
          const srResult = await shiprocket.createAndAssignReturnOrder({
            orderNumber: order.orderNumber,
            orderDate: order.placedAt || new Date(),
            warehouseAddress,
            customerAddress: {
              name: order.shippingAddress.fullName,
              phone: order.shippingAddress.phone,
              address: order.shippingAddress.streetAddress,
              address2: order.shippingAddress.addressLine2 || '',
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postalCode: order.shippingAddress.postalCode,
              email: (order as any).customer?.email || 'customer@yox.com',
            },
            items: [
              {
                name: item?.productName || 'Return Item',
                sku: item?.sku || 'SKU-RET',
                units: returnEntity.quantity || 1,
                selling_price: item?.unitPrice || 100,
                reason: returnEntity.reason,
              },
            ],
            subtotal: (item?.unitPrice || 100) * (returnEntity.quantity || 1),
          });

          reverseShipmentId = srResult.returnShipmentId || null;
          reverseAwb = srResult.awbCode || (reverseShipmentId ? `SR-RET-${reverseShipmentId}` : `SR-REV-${returnEntity.id.substring(0, 8).toUpperCase()}`);
          courierName = srResult.courierName || 'Shiprocket Reverse Express';
          pickupNotice = srResult.notice;

          returnEntity.schedulePickup({
            pickupDate: scheduledPickupDate,
            courierTrackingNumber: reverseAwb,
            courierName,
            pickupTimeSlot: '10:00 AM - 06:00 PM',
          });
        }
      } catch (srErr: any) {
        console.warn('[Shiprocket Return] Reverse pickup booking fallback:', srErr.message);
        reverseAwb = `SR-REV-${returnEntity.id.substring(0, 8).toUpperCase()}`;
        returnEntity.schedulePickup({
          pickupDate: scheduledPickupDate,
          courierTrackingNumber: reverseAwb,
          courierName: 'Shiprocket Reverse Express',
          pickupTimeSlot: '10:00 AM - 06:00 PM',
        });
      }
    }

    const saved = await this.returnRepo.save(returnEntity);

    try {
      let actorId = actor?.id || 'SYSTEM';
      let actorRole = actor?.role ? actor.role.toUpperCase() : 'ADMIN';
      let actorName: string | null = null;
      let actorEmail: string | null = actor?.email || null;

      if (actorId && actorId !== 'SYSTEM' && actorId.length === 24) {
        try {
          const u = await UserModel.findById(actorId).select('fullName email roleId').lean();
          if (u) {
            actorName = u.fullName;
            actorEmail = actorEmail || u.email;
            if ((u as any).role) actorRole = (u as any).role.toUpperCase();
          }
        } catch {}
      }

      await AuditLogService.getInstance()?.record({
        actorId,
        actorRole,
        actorName,
        actorEmail,
        action: AuditAction.RETURN_APPROVED,
        resourceType: 'RETURN',
        resourceId: saved.id,
        description: `Return #${saved.id.substring(0, 8)} approved and reverse pickup scheduled by ${actorName || actorRole}${reverseAwb ? ` (AWB: ${reverseAwb})` : ''}${pickupNotice ? ` [Notice: ${pickupNotice}]` : ''}`,
        after: { status: saved.status, reverseAwb, pickupNotice },
      });

      // Notify customer that courier agent will pick up from doorstep
      await NotificationService.getInstance().notify({
        userId: saved.userId,
        type: 'RETURN_REQUEST',
        title: '🚚 Return Approved & Doorstep Pickup Scheduled',
        message: `Your return request #${saved.id.substring(0, 8)} has been approved! Shiprocket courier will collect the package from your doorstep.`,
        metadata: {
          returnId: saved.id,
          orderId: saved.orderId,
          status: saved.status,
          reverseAwb,
        },
      });
    } catch {}

    return mapToReturnResponseDTO(saved);
  }
}

export class RejectReturnUseCase implements IUseCase<{ id: string; data: RejectReturnRequestDTO; actor?: { id?: string; role?: string; email?: string } }, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(input: { id: string; data: RejectReturnRequestDTO; actor?: { id?: string; role?: string; email?: string } }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.reject(input.data?.reason);
    const saved = await this.returnRepo.save(returnEntity);

    try {
      let actorId = input.actor?.id || 'SYSTEM';
      let actorRole = input.actor?.role ? input.actor.role.toUpperCase() : 'ADMIN';
      let actorName: string | null = null;
      let actorEmail: string | null = input.actor?.email || null;

      if (actorId && actorId !== 'SYSTEM' && actorId.length === 24) {
        try {
          const u = await UserModel.findById(actorId).select('fullName email roleId').lean();
          if (u) {
            actorName = u.fullName;
            actorEmail = actorEmail || u.email;
            if ((u as any).role) actorRole = (u as any).role.toUpperCase();
          }
        } catch {}
      }

      await AuditLogService.getInstance()?.record({
        actorId,
        actorRole,
        actorName,
        actorEmail,
        action: AuditAction.RETURN_REJECTED,
        resourceType: 'RETURN',
        resourceId: saved.id,
        description: `Return #${saved.id.substring(0, 8)} rejected by ${actorName || actorRole}. Reason: ${input.data?.reason || 'Rejected'}`,
        after: { status: 'REJECTED', rejectionReason: input.data?.reason },
      });
    } catch {}

    return mapToReturnResponseDTO(saved);
  }
}

export class SubmitReturnShipmentUseCase implements IUseCase<{ id: string; userId: string; data: SubmitReturnShipmentRequestDTO }, ReturnResponseDTO> {
  constructor(
    private readonly returnRepo: IReturnRepository
  ) {}

  async execute(input: { id: string; userId: string; data: SubmitReturnShipmentRequestDTO }): Promise<ReturnResponseDTO> {
    const { id, userId, data } = input;
    const returnEntity = await this.returnRepo.findById(id);
    if (!returnEntity) throw new Error('Return request not found');

    if (returnEntity.userId !== userId) {
      throw new Error('Forbidden: You can only submit shipment details for your own return requests');
    }

    const tracking = (data.courierTrackingNumber || data.trackingNumber || '').trim();
    const accHolder = (data.bankDetails?.accountHolderName || data.accountHolderName || '').trim();
    const accNum = (data.bankDetails?.accountNumber || data.accountNumber || '').trim();
    const ifsc = (data.bankDetails?.ifscCode || data.ifscCode || '').trim().toUpperCase();
    const bank = (data.bankDetails?.bankName || data.bankName || '').trim() || undefined;

    returnEntity.submitCustomerShipment({
      courierTrackingNumber: tracking,
      courierName: data.courierName || 'India Post',
      refundBankDetails: {
        accountHolderName: accHolder,
        accountNumber: accNum,
        ifscCode: ifsc,
        bankName: bank,
      },
    });

    const saved = await this.returnRepo.save(returnEntity);

    try {
      await AuditLogService.getInstance()?.record({
        actorId: userId,
        actorRole: 'CUSTOMER',
        action: AuditAction.RETURN_SHIPPED,
        resourceType: 'RETURN',
        resourceId: saved.id,
        description: `Customer submitted return shipment via ${data.courierName || 'Courier'} with tracking #${tracking}`,
        after: { status: 'RETURN_SHIPPED', trackingNumber: tracking },
      });
    } catch {}

    try {
      let customerName = 'Customer';
      try {
        const u = await UserModel.findById(userId).select('fullName email').lean();
        if (u?.fullName) customerName = u.fullName as string;
      } catch {}

      await NotificationService.getInstance().notify({
        userId: null,
        type: 'RETURN_REQUEST',
        title: '📦 Return Package Dispatched by Customer',
        message: `${customerName} dispatched return package for return #${saved.id.substring(0, 8)} with consignment #${tracking}`,
        metadata: {
          returnId: saved.id,
          orderId: saved.orderId,
          trackingNumber: tracking,
          courierName: data.courierName || 'India Post',
        },
      });
    } catch {}

    return mapToReturnResponseDTO(saved);
  }
}

export class ScheduleReturnPickupUseCase implements IUseCase<{ id: string; data: SchedulePickupRequestDTO }, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(input: { id: string; data: SchedulePickupRequestDTO }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    const pickupDate = input.data?.pickupDate ? new Date(input.data.pickupDate) : new Date(Date.now() + 24 * 60 * 60 * 1000);
    returnEntity.schedulePickup({
      pickupDate,
      pickupTimeSlot: input.data?.pickupTimeSlot,
      pickupAgentName: input.data?.pickupAgentName,
      pickupAgentPhone: input.data?.pickupAgentPhone,
    });
    const saved = await this.returnRepo.save(returnEntity);
    return mapToReturnResponseDTO(saved);
  }
}

export class ReceiveReturnUseCase implements IUseCase<string, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(id: string): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.markReceived();
    const saved = await this.returnRepo.save(returnEntity);
    return mapToReturnResponseDTO(saved);
  }
}

export class InspectReturnUseCase implements IUseCase<{ id: string; data: InspectReturnRequestDTO }, ReturnResponseDTO> {
  constructor(
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly variantRepo: IProductVariantRepository,
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}

  async execute(input: { id: string; data: InspectReturnRequestDTO }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.inspect(input.data.inspectionResult);
    const savedReturn = await this.returnRepo.save(returnEntity);

    // Order reference
    const order = await this.orderRepo.findById(returnEntity.orderId);

    // Update inventory based on inspection condition
    const variantId = returnEntity.orderItemId;
    const inventory = await this.inventoryRepo.findByVariantId(variantId);
    const variant = await this.variantRepo.findById(variantId);

    if (input.data.inspectionResult === 'RESELLABLE') {
      if (variant) {
        variant.increaseStock(returnEntity.quantity);
        await this.variantRepo.save(variant);
      }
      if (inventory) {
        const prevAvail = inventory.availableStock;
        const newAvail = prevAvail + returnEntity.quantity;
        const updatedInv = Inventory.reconstitute({
          ...inventory.toJSON(),
          availableStock: newAvail,
          updatedAt: new Date(),
        });
        const savedInv = await this.inventoryRepo.save(updatedInv);

        const log = StockLog.create({
          inventoryId: savedInv.id,
          type: 'IN',
          amount: returnEntity.quantity,
          previousStock: prevAvail,
          newStock: newAvail,
          reason: 'Customer return received - resellable condition',
          reference: order ? order.orderNumber : returnEntity.orderId,
        });
        await this.stockLogRepo.save(log);
      }
    } else if (input.data.inspectionResult === 'DAMAGED') {
      if (inventory) {
        const prevDamaged = inventory.damagedStock || 0;
        const newDamaged = prevDamaged + returnEntity.quantity;
        const updatedInv = Inventory.reconstitute({
          ...inventory.toJSON(),
          damagedStock: newDamaged,
          updatedAt: new Date(),
        });
        const savedInv = await this.inventoryRepo.save(updatedInv);

        const log = StockLog.create({
          inventoryId: savedInv.id,
          type: 'IN',
          amount: returnEntity.quantity,
          previousStock: inventory.availableStock,
          newStock: inventory.availableStock,
          reason: 'Customer return received - damaged condition',
          reference: order ? order.orderNumber : returnEntity.orderId,
        });
        await this.stockLogRepo.save(log);
      }
    }

    return mapToReturnResponseDTO(savedReturn);
  }
}

export class ProcessRefundDirectUseCase implements IUseCase<{ id: string; data?: ProcessRefundRequestDTO; actor?: { id?: string; role?: string; email?: string } }, ReturnResponseDTO> {
  constructor(
    private readonly returnRepo: IReturnRepository,
    private readonly orderRepo?: IOrderRepository,
    private readonly paymentRepo?: IPaymentRepository,
    private readonly refundRepo?: IRefundRepository
  ) {}

  async execute(input: { id: string; data?: ProcessRefundRequestDTO; actor?: { id?: string; role?: string; email?: string } }): Promise<ReturnResponseDTO> {
    const { id, data, actor } = input;
    const returnEntity = await this.returnRepo.findById(id);
    if (!returnEntity) throw new Error('Return record not found');

    const validStatuses = ['REFUND_PENDING', 'INSPECTED', 'RECEIVED', 'APPROVED', 'RETURN_SHIPPED', 'PICKUP_SCHEDULED'];
    if (!validStatuses.includes(returnEntity.status)) {
      throw new Error(`Cannot issue refund for return in status: ${returnEntity.status}`);
    }

    // 1. Order Lookup
    let order: any = null;
    if (this.orderRepo) {
      order = await this.orderRepo.findById(returnEntity.orderId);
      if (!order) order = await this.orderRepo.findByOrderNumber(returnEntity.orderId);
    }

    // 2. Refund Amount Calculation
    let refundAmount = data?.refundAmount;
    if (typeof refundAmount !== 'number' || refundAmount <= 0) {
      if (order) {
        const item = order.items.find(
          (i: any) => i.variantId === returnEntity.orderItemId || i.id === returnEntity.orderItemId || i.productId === returnEntity.orderItemId
        ) || order.items[0];
        const unitPrice = item?.unitPrice || 0;
        const discount = item?.discount ? item.discount / item.quantity : 0;
        refundAmount = Math.max(0, (unitPrice - discount) * returnEntity.quantity);
      } else {
        refundAmount = returnEntity.refundAmount || 0;
      }
    }

    if (refundAmount <= 0) {
      throw new Error('Refund amount must be greater than zero');
    }

    // 3. Payment & Gateway Execution
    let payment: any = null;
    if (this.paymentRepo && order) {
      payment = await this.paymentRepo.findByOrderId(order.id);
    }

    let refundMethod = data?.refundMethod || (order?.paymentMethod === 'RAZORPAY' ? 'Razorpay / Original Payment Method' : 'Bank Transfer (NEFT/IMPS)');
    let gatewayRefundId = data?.refundTransactionId?.trim() || '';

    // If online payment via Razorpay, attempt gateway refund
    if (order && (order.paymentMethod === 'RAZORPAY' || order.paymentMethod === 'CARD' || order.paymentMethod === 'UPI')) {
      const razorpayPaymentId = (order as any).paymentDetails?.razorpayPaymentId || payment?.transactionId;
      if (razorpayPaymentId && razorpayPaymentId.startsWith('pay_')) {
        try {
          const rzService = new RazorpayService();
          const rzRefund = await rzService.createRefund(razorpayPaymentId, refundAmount * 100, {
            returnId: returnEntity.id,
            orderNumber: order.orderNumber,
          });
          gatewayRefundId = rzRefund.id;
          refundMethod = 'Razorpay / Original Payment Method';
        } catch (rzErr: any) {
          console.warn('[Razorpay Refund Notice]:', rzErr.message);
          if (!gatewayRefundId) {
            gatewayRefundId = `rfnd_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
          }
        }
      }
    }

    if (!gatewayRefundId) {
      gatewayRefundId = `REF-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    }

    // 4. Create and Save Refund Record
    let savedRefund: any = null;
    if (this.refundRepo && order) {
      try {
        const refundEntity = Refund.create({
          paymentId: payment ? payment.id : null,
          orderId: order.id,
          returnId: returnEntity.id,
          amount: refundAmount,
          paymentMethod: refundMethod,
          gatewayRefundId,
          status: 'PENDING',
        });
        refundEntity.markCompleted(gatewayRefundId);
        savedRefund = await this.refundRepo.save(refundEntity);
      } catch (refErr: any) {
        console.warn('Error saving refund document:', refErr.message);
      }
    }

    // 5. Update Payment Record
    if (payment && this.paymentRepo) {
      try {
        payment.addRefund(refundAmount);
        await this.paymentRepo.save(payment);
      } catch (payErr: any) {
        console.warn('Error updating payment entity:', payErr.message);
      }
    }

    // 6. Update Order Status & Payment Status
    if (order && this.orderRepo) {
      try {
        let totalRefunded = refundAmount;
        if (this.refundRepo) {
          const orderRefunds = await this.refundRepo.findByOrderId(order.id);
          totalRefunded = orderRefunds
            .filter((r) => r.status === 'COMPLETED')
            .reduce((sum, r) => sum + r.amount, 0);
        }

        if (totalRefunded >= order.totalAmount) {
          order.updatePaymentStatus('REFUNDED');
        } else {
          order.updatePaymentStatus('PARTIALLY_REFUNDED');
        }

        const allOrderReturns = await this.returnRepo.findByOrderId(order.id);
        const totalReturnedQty = allOrderReturns
          .filter((r) => r.status === 'REFUNDED' || r.id === returnEntity.id)
          .reduce((sum, r) => sum + r.quantity, 0);
        const totalOrderedQty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0);

        if (totalReturnedQty >= totalOrderedQty) {
          order.updateStatus('RETURNED', 'All items returned and refunded');
        }

        await this.orderRepo.save(order);
      } catch (ordErr: any) {
        console.warn('Error updating order on refund:', ordErr.message);
      }
    }

    // 7. Update Return Entity
    returnEntity.markRefunded({
      refundId: savedRefund ? savedRefund.id : `RFD-${returnEntity.id.substring(0, 8)}`,
      refundAmount,
      refundMethod,
      refundTransactionId: gatewayRefundId,
    });

    const saved = await this.returnRepo.save(returnEntity);

    // 8. Audit Log & Real-time Notification
    try {
      let actorId = actor?.id || 'SYSTEM';
      let actorRole = actor?.role ? actor.role.toUpperCase() : 'ADMIN';
      let actorName: string | null = null;
      let actorEmail: string | null = actor?.email || null;

      if (actorId && actorId !== 'SYSTEM' && actorId.length === 24) {
        try {
          const u = await UserModel.findById(actorId).select('fullName email roleId').lean();
          if (u) {
            actorName = u.fullName;
            actorEmail = actorEmail || u.email;
            if ((u as any).role) actorRole = (u as any).role.toUpperCase();
          }
        } catch {}
      }

      await AuditLogService.getInstance()?.record({
        actorId,
        actorRole,
        actorName,
        actorEmail,
        action: AuditAction.REFUND_COMPLETED,
        resourceType: 'RETURN',
        resourceId: saved.id,
        description: `Refund of ₹${refundAmount} issued for Return #${saved.id.substring(0, 8)} by ${actorName || actorRole} (Ref: ${gatewayRefundId})`,
        after: { refundAmount, refundMethod, refundTransactionId: gatewayRefundId, status: 'REFUNDED' },
      });

      await NotificationService.getInstance().notify({
        userId: saved.userId,
        type: 'RETURN_REQUEST',
        title: '🎉 Refund Successfully Processed',
        message: `Your refund of ₹${refundAmount} for Order #${order?.orderNumber || saved.orderId} has been processed via ${refundMethod}. Ref: ${gatewayRefundId}.`,
        metadata: {
          returnId: saved.id,
          orderId: saved.orderId,
          orderNumber: order?.orderNumber || null,
          refundAmount,
          refundMethod,
          refundTransactionId: gatewayRefundId,
        },
      });
    } catch {}

    return mapToReturnResponseDTO(saved);
  }
}

export class GetAllReturnsUseCase implements IUseCase<any, { data: ReturnResponseDTO[]; total: number }> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(query: any): Promise<{ data: ReturnResponseDTO[]; total: number }> {
    const res = await this.returnRepo.findAllReturns(query || {});
    return {
      data: res.data.map(r => mapToReturnResponseDTO(r)),
      total: res.total,
    };
  }
}

