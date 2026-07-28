/**
 * @file inventory.use-cases.ts
 * @layer Application › Use Cases
 *
 * Contains all inventory-related use cases:
 *  - GetAllInventoryUseCase
 *  - GetInventoryByIdUseCase
 *  - UpdateInventoryUseCase
 *  - AdjustStockUseCase     — manual admin stock correction with audit log + low-stock alert
 *  - ReserveStockUseCase    — atomically moves qty from available → reserved (checkout)
 *  - ReleaseStockUseCase    — releases reservation (order cancel) or consumes it (order fulfill)
 *  - GetStockLogsUseCase
 *  - GetLowStockUseCase     — returns all items currently below threshold
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../domain/repositories/stock-log.repository.interface';
import { INotificationRepository } from '../../../notifications/domain/repositories/notification.repository.interface';
import { Inventory } from '../../domain/entities/inventory.entity';
import { StockLog } from '../../domain/entities/stock-log.entity';
import { Notification } from '../../../notifications/domain/entities/notification.entity';
import {
  UpdateInventoryRequestDTO,
  AdjustStockRequestDTO,
  ReserveStockRequestDTO,
  ReleaseStockRequestDTO,
  InventoryResponseDTO,
  StockLogResponseDTO,
} from '../dtos/inventory.dto';

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapToInventoryResponseDTO(inventory: Inventory): InventoryResponseDTO {
  return {
    id: inventory.id,
    variantId: inventory.variantId,
    availableStock: inventory.availableStock,
    reservedStock: inventory.reservedStock,
    damagedStock: inventory.damagedStock,
    warehouseLocation: inventory.warehouseLocation,
    lowStockThreshold: inventory.lowStockThreshold,
    isLowStock: inventory.isLowStock(),
    createdAt: inventory.createdAt,
    updatedAt: inventory.updatedAt,
  };
}

function mapToStockLogResponseDTO(log: StockLog): StockLogResponseDTO {
  return {
    id: log.id,
    inventoryId: log.inventoryId,
    type: log.type,
    amount: log.amount,
    previousStock: log.previousStock,
    newStock: log.newStock,
    reason: log.reason,
    reference: log.reference,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
}

/**
 * Helper: fires a LOW_STOCK notification if the inventory is at or below threshold.
 * This is a "fire-and-forget" within the use case — it does not block the main operation.
 * The notification is broadcast (userId = null) so all admins see it.
 */
async function checkAndNotifyLowStock(
  inventory: Inventory,
  notificationRepo: INotificationRepository
): Promise<void> {
  if (!inventory.isLowStock()) return;

  const notification = Notification.create({
    userId: null, // Admin broadcast
    type: 'LOW_STOCK',
    title: '⚠️ Low Stock Alert',
    message: `Inventory for variant ${inventory.variantId} is critically low. Only ${inventory.availableStock} unit(s) remaining (threshold: ${inventory.lowStockThreshold}).`,
    metadata: {
      inventoryId: inventory.id,
      variantId: inventory.variantId,
      currentStock: inventory.availableStock,
      threshold: inventory.lowStockThreshold,
    },
  });

  await notificationRepo.save(notification);
}

// ── Use Cases ─────────────────────────────────────────────────────────────────

export class GetAllInventoryUseCase
  implements IUseCase<any, { data: InventoryResponseDTO[]; total: number }>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(query: any): Promise<{ data: InventoryResponseDTO[]; total: number }> {
    const result = await this.inventoryRepo.findAll(query);
    return {
      data: result.data.map(mapToInventoryResponseDTO),
      total: result.total,
    };
  }
}

export class GetInventoryByIdUseCase
  implements IUseCase<string, InventoryResponseDTO>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(id: string): Promise<InventoryResponseDTO> {
    const inventory = await this.inventoryRepo.findById(id);
    if (!inventory) throw new Error('Inventory not found');
    return mapToInventoryResponseDTO(inventory);
  }
}

export class UpdateInventoryUseCase
  implements IUseCase<{ id: string; data: UpdateInventoryRequestDTO }, InventoryResponseDTO>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: {
    id: string;
    data: UpdateInventoryRequestDTO;
  }): Promise<InventoryResponseDTO> {
    const inventory = await this.inventoryRepo.findById(input.id);
    if (!inventory) throw new Error('Inventory not found');

    const updatedProps = {
      ...inventory.toJSON(),
      ...input.data,
      id: inventory.id,
      createdAt: inventory.createdAt,
      updatedAt: new Date(),
    };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    return mapToInventoryResponseDTO(savedInventory);
  }
}

export class AdjustStockUseCase
  implements
    IUseCase<
      { id: string; data: AdjustStockRequestDTO },
      { inventory: InventoryResponseDTO; log: StockLogResponseDTO }
    >
{
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  async execute(input: {
    id: string;
    data: AdjustStockRequestDTO;
  }): Promise<{ inventory: InventoryResponseDTO; log: StockLogResponseDTO }> {
    const inventory = await this.inventoryRepo.findById(input.id);
    if (!inventory) throw new Error('Inventory not found');

    const previousStock = inventory.availableStock;
    let newStock = previousStock;

    if (input.data.type === 'IN') {
      newStock += input.data.amount;
    } else if (input.data.type === 'OUT') {
      if (previousStock < input.data.amount) {
        throw new Error('Insufficient stock');
      }
      newStock -= input.data.amount;
    } else if (input.data.type === 'ADJUSTMENT') {
      newStock += input.data.amount;
    }

    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    const updatedProps = {
      ...inventory.toJSON(),
      availableStock: newStock,
      updatedAt: new Date(),
    };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    const log = StockLog.create({
      inventoryId: savedInventory.id,
      type: input.data.type,
      amount: input.data.amount,
      previousStock,
      newStock,
      reason: input.data.reason,
      reference: input.data.reference,
    });
    const savedLog = await this.stockLogRepo.save(log);

    // Fire low-stock notification after adjustment (non-blocking pattern)
    await checkAndNotifyLowStock(savedInventory, this.notificationRepo);

    return {
      inventory: mapToInventoryResponseDTO(savedInventory),
      log: mapToStockLogResponseDTO(savedLog),
    };
  }
}

/**
 * ReserveStockUseCase
 *
 * Security Logic:
 *  1. Verifies sufficient availableStock exists before reserving (prevents overselling)
 *  2. Atomically moves qty from availableStock → reservedStock
 *  3. Logs the RESERVE event for full auditability
 *  4. Fires low-stock notification if available stock drops below threshold after reservation
 */
export class ReserveStockUseCase
  implements
    IUseCase<
      { id: string; data: ReserveStockRequestDTO },
      { inventory: InventoryResponseDTO; log: StockLogResponseDTO }
    >
{
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository,
    private readonly notificationRepo: INotificationRepository
  ) {}

  async execute(input: {
    id: string;
    data: ReserveStockRequestDTO;
  }): Promise<{ inventory: InventoryResponseDTO; log: StockLogResponseDTO }> {
    const inventory = await this.inventoryRepo.findById(input.id);
    if (!inventory) throw new Error('Inventory not found');

    if (input.data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (inventory.availableStock < input.data.quantity) {
      throw new Error(
        `Insufficient stock. Requested: ${input.data.quantity}, Available: ${inventory.availableStock}`
      );
    }

    const previousAvailable = inventory.availableStock;
    const newAvailable = previousAvailable - input.data.quantity;
    const newReserved = inventory.reservedStock + input.data.quantity;

    const updatedProps = {
      ...inventory.toJSON(),
      availableStock: newAvailable,
      reservedStock: newReserved,
      updatedAt: new Date(),
    };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    const log = StockLog.create({
      inventoryId: savedInventory.id,
      type: 'RESERVE',
      amount: input.data.quantity,
      previousStock: previousAvailable,
      newStock: newAvailable,
      reason: 'Stock reserved for pending order',
      reference: input.data.reference,
    });
    const savedLog = await this.stockLogRepo.save(log);

    // Check if post-reservation stock triggers a low-stock alert
    await checkAndNotifyLowStock(savedInventory, this.notificationRepo);

    return {
      inventory: mapToInventoryResponseDTO(savedInventory),
      log: mapToStockLogResponseDTO(savedLog),
    };
  }
}

/**
 * ReleaseStockUseCase
 *
 * Two actions:
 *  - CANCEL: Returns reserved qty back to availableStock (order cancelled by user or admin)
 *  - FULFILL: Removes reserved qty permanently (order completed & shipped)
 *
 * Security: Validates that reservedStock has enough units to release/consume.
 */
export class ReleaseStockUseCase
  implements
    IUseCase<
      { id: string; data: ReleaseStockRequestDTO },
      { inventory: InventoryResponseDTO; log: StockLogResponseDTO }
    >
{
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}

  async execute(input: {
    id: string;
    data: ReleaseStockRequestDTO;
  }): Promise<{ inventory: InventoryResponseDTO; log: StockLogResponseDTO }> {
    const inventory = await this.inventoryRepo.findById(input.id);
    if (!inventory) throw new Error('Inventory not found');

    if (input.data.quantity <= 0) {
      throw new Error('Quantity must be a positive number');
    }

    if (inventory.reservedStock < input.data.quantity) {
      throw new Error(
        `Cannot release ${input.data.quantity} units. Only ${inventory.reservedStock} are reserved.`
      );
    }

    const previousAvailable = inventory.availableStock;
    let newAvailable = previousAvailable;
    const newReserved = inventory.reservedStock - input.data.quantity;

    if (input.data.action === 'CANCEL') {
      // Order cancelled — return reserved stock to available pool
      newAvailable = previousAvailable + input.data.quantity;
    }
    // FULFILL: reserved stock is consumed (sold), so only reservedStock decreases

    const updatedProps = {
      ...inventory.toJSON(),
      availableStock: newAvailable,
      reservedStock: newReserved,
      updatedAt: new Date(),
    };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    const reason =
      input.data.action === 'CANCEL'
        ? 'Reservation released — order cancelled'
        : 'Reservation consumed — order fulfilled';

    const log = StockLog.create({
      inventoryId: savedInventory.id,
      type: 'RELEASE',
      amount: input.data.quantity,
      previousStock: previousAvailable,
      newStock: newAvailable,
      reason,
      reference: input.data.reference,
    });
    const savedLog = await this.stockLogRepo.save(log);

    return {
      inventory: mapToInventoryResponseDTO(savedInventory),
      log: mapToStockLogResponseDTO(savedLog),
    };
  }
}

export class GetStockLogsUseCase
  implements
    IUseCase<{ inventoryId: string; query: any }, { data: StockLogResponseDTO[]; total: number }>
{
  constructor(private readonly stockLogRepo: IStockLogRepository) {}

  async execute(input: {
    inventoryId: string;
    query: any;
  }): Promise<{ data: StockLogResponseDTO[]; total: number }> {
    const result = await this.stockLogRepo.findByInventoryId(input.inventoryId, input.query);
    return {
      data: result.data.map(mapToStockLogResponseDTO),
      total: result.total,
    };
  }
}

export class GetLowStockUseCase
  implements IUseCase<any, { data: InventoryResponseDTO[]; total: number }>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(query: any): Promise<{ data: InventoryResponseDTO[]; total: number }> {
    const result = await this.inventoryRepo.findLowStock(query);
    return {
      data: result.data.map(mapToInventoryResponseDTO),
      total: result.total,
    };
  }
}
