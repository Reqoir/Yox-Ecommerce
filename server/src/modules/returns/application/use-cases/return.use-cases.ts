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
import {
  CreateReturnRequestDTO,
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
      images: data.images || [],
    });

    const saved = await this.returnRepo.save(returnEntity);

    AuditLogService.getInstance()?.record({
      actorId: userId,
      actorRole: 'CUSTOMER',
      action: AuditAction.RETURN_CREATED,
      resourceType: 'RETURN',
      resourceId: saved.id,
      description: `Return requested for order #${order.orderNumber} item (${data.quantity} units)`,
      after: { orderId: order.id, quantity: data.quantity, reason: data.reason },
    });

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

export class ApproveReturnUseCase implements IUseCase<string, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(id: string): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.approve();
    const saved = await this.returnRepo.save(returnEntity);

    AuditLogService.getInstance()?.record({
      action: AuditAction.RETURN_APPROVED,
      resourceType: 'RETURN',
      resourceId: saved.id,
      description: `Return #${saved.id.substring(0, 8)} approved by admin`,
      after: { status: 'APPROVED' },
    });

    return mapToReturnResponseDTO(saved);
  }
}

export class RejectReturnUseCase implements IUseCase<{ id: string; data: RejectReturnRequestDTO }, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(input: { id: string; data: RejectReturnRequestDTO }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    returnEntity.reject(input.data?.reason);
    const saved = await this.returnRepo.save(returnEntity);

    AuditLogService.getInstance()?.record({
      action: AuditAction.RETURN_REJECTED,
      resourceType: 'RETURN',
      resourceId: saved.id,
      description: `Return #${saved.id.substring(0, 8)} rejected. Reason: ${input.data?.reason}`,
      after: { status: 'REJECTED', rejectionReason: input.data?.reason },
    });

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

export class ProcessRefundDirectUseCase implements IUseCase<{ id: string; data?: ProcessRefundRequestDTO }, ReturnResponseDTO> {
  constructor(private readonly returnRepo: IReturnRepository) {}

  async execute(input: { id: string; data?: ProcessRefundRequestDTO }): Promise<ReturnResponseDTO> {
    const returnEntity = await this.returnRepo.findById(input.id);
    if (!returnEntity) throw new Error('Return record not found');

    const refundAmount = input.data?.refundAmount ?? (returnEntity.refundAmount || 0);
    const refundMethod = input.data?.refundMethod || 'Original Payment Method';
    const refundTransactionId = input.data?.refundTransactionId || `REF-${Date.now()}`;

    returnEntity.markRefunded({
      refundId: `RFD-${returnEntity.id.substring(0, 8)}`,
      refundAmount,
      refundMethod,
      refundTransactionId,
    });

    const saved = await this.returnRepo.save(returnEntity);
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

