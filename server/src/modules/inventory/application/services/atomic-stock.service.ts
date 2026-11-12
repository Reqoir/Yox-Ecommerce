/**
 * @file atomic-stock.service.ts
 * @layer Application › Services
 *
 * SEC-HIGH-009: Provides atomic, race-condition-safe stock reservation and
 * release across ProductVariant and Inventory repositories with compensating
 * rollback when any item in a multi-item checkout fails.
 */

import mongoose from 'mongoose';
import { ConflictError } from '@core/application/errors/application.error';
import { NotFoundError } from '@core/domain/errors/not-found.error';
import { ValidationError } from '@core/domain/errors/validation.error';
import { Inventory } from '../../domain/entities/inventory.entity';
import { StockLog } from '../../domain/entities/stock-log.entity';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../domain/repositories/stock-log.repository.interface';
import { InventoryRepository } from '../../infrastructure/repositories/inventory.repository';
import { StockLogRepository } from '../../infrastructure/repositories/stock-log.repository';
import { IProductVariantRepository } from '../../../products/domain/repositories/product-variant.repository.interface';
import { ProductVariantRepository } from '../../../products/infrastructure/repositories/product-variant.repository';
import { ProductVariant } from '../../../products/domain/entities/product-variant.entity';

export interface StockReservationItem {
  variantId: string;
  quantity: number;
  productName?: string;
}

export interface StockActionContext {
  reason: string;
  reference?: string | null;
}

const variantLocks = new Map<string, Promise<unknown>>();

/**
 * Serializes fallback read-modify-write operations on the same variantId when a
 * mock repository without atomic DB operations is used in unit tests.
 */
export async function withVariantMutex<T>(variantId: string, fn: () => Promise<T>): Promise<T> {
  const prev = variantLocks.get(variantId) || Promise.resolve();
  let releaseLock!: () => void;
  const current = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  const chained = prev.catch(() => undefined).then(() => current);
  variantLocks.set(variantId, chained);

  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    releaseLock();
    if (variantLocks.get(variantId) === chained) {
      variantLocks.delete(variantId);
    }
  }
}

export class AtomicStockService {
  private readonly hasExplicitInventoryRepo: boolean;
  private readonly hasExplicitStockLogRepo: boolean;

  constructor(
    private readonly variantRepo: IProductVariantRepository = new ProductVariantRepository(),
    private readonly inventoryRepo: IInventoryRepository = new InventoryRepository(),
    private readonly stockLogRepo: IStockLogRepository = new StockLogRepository(),
    options?: { explicitInventoryRepo?: boolean; explicitStockLogRepo?: boolean }
  ) {
    this.hasExplicitInventoryRepo = options?.explicitInventoryRepo ?? false;
    this.hasExplicitStockLogRepo = options?.explicitStockLogRepo ?? false;
  }

  private canUseInventoryRepo(): boolean {
    return this.hasExplicitInventoryRepo || mongoose.connection.readyState === 1;
  }

  private canUseStockLogRepo(): boolean {
    return this.hasExplicitStockLogRepo || mongoose.connection.readyState === 1;
  }

  public async reserveOrderItems(
    items: StockReservationItem[],
    context: StockActionContext
  ): Promise<void> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new ValidationError('At least one item is required for stock reservation');
    }

    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        throw new ValidationError('Item quantity must be a positive integer');
      }
    }

    const reserved: StockReservationItem[] = [];

    try {
      for (const item of items) {
        const updatedVariant = await this.reserveSingleVariant(item);
        if (!updatedVariant) {
          const existing = await this.variantRepo.findById(item.variantId);
          if (!existing) {
            throw new NotFoundError(`Product variant ${item.variantId} no longer exists`);
          }
          if (!existing.isActive) {
            throw new ConflictError(`"${item.productName || existing.title || 'Item'}" is currently unavailable`);
          }
          throw new ConflictError(
            `Insufficient stock for "${item.productName || existing.title || 'item'}". Available: ${existing.stock}, Requested: ${item.quantity}`
          );
        }

        reserved.push(item);
        await this.syncInventoryReserve(item.variantId, item.quantity, context);
      }
    } catch (error) {
      if (reserved.length > 0) {
        await this.releaseOrderItems([...reserved].reverse(), {
          reason: `Rollback after failed reservation: ${context.reason}`,
          reference: context.reference,
        }).catch(() => undefined);
      }
      throw error;
    }
  }

  public async releaseOrderItems(
    items: StockReservationItem[],
    context: StockActionContext
  ): Promise<void> {
    if (!Array.isArray(items) || items.length === 0) return;

    for (const item of items) {
      if (!item.variantId || !Number.isInteger(item.quantity) || item.quantity <= 0) {
        continue;
      }

      await this.releaseSingleVariant(item.variantId, item.quantity);
      await this.syncInventoryRelease(item.variantId, item.quantity, context);
    }
  }

  private async reserveSingleVariant(item: StockReservationItem): Promise<ProductVariant | null> {
    if (typeof this.variantRepo.atomicReserveStock === 'function') {
      return this.variantRepo.atomicReserveStock(item.variantId, item.quantity);
    }

    return withVariantMutex(item.variantId, async () => {
      const variant = await this.variantRepo.findById(item.variantId);
      if (!variant || !variant.isActive || variant.stock < item.quantity) {
        return null;
      }
      variant.reduceStock(item.quantity);
      return this.variantRepo.save(variant);
    });
  }

  private async releaseSingleVariant(variantId: string, quantity: number): Promise<ProductVariant | null> {
    if (typeof this.variantRepo.atomicReleaseStock === 'function') {
      return this.variantRepo.atomicReleaseStock(variantId, quantity);
    }

    return withVariantMutex(variantId, async () => {
      const variant = await this.variantRepo.findById(variantId);
      if (!variant) return null;
      variant.increaseStock(quantity);
      return this.variantRepo.save(variant);
    });
  }

  private async syncInventoryReserve(
    variantId: string,
    quantity: number,
    context: StockActionContext
  ): Promise<void> {
    if (!this.canUseInventoryRepo()) return;
    try {
      if (typeof this.inventoryRepo.atomicReserveStock === 'function') {
        const atomicInv = await this.inventoryRepo.atomicReserveStock(variantId, quantity);
        if (atomicInv) {
          await this.writeStockLog(
            atomicInv.id,
            'RESERVE',
            quantity,
            atomicInv.availableStock + quantity,
            atomicInv.availableStock,
            context
          );
          return;
        }
      }

      const inventory = await this.inventoryRepo.findByVariantId(variantId);
      if (!inventory) return;

      const prevAvail = inventory.availableStock;
      const newAvail = Math.max(0, prevAvail - quantity);
      const newReserved = inventory.reservedStock + quantity;
      const updatedInv = Inventory.reconstitute({
        ...inventory.toJSON(),
        availableStock: newAvail,
        reservedStock: newReserved,
        updatedAt: new Date(),
      });
      const savedInv = await this.inventoryRepo.save(updatedInv);
      await this.writeStockLog(savedInv.id, 'RESERVE', quantity, prevAvail, newAvail, context);
    } catch {
      // Variant stock has already been atomically guarded; do not fail if secondary inventory log errors
    }
  }

  private async syncInventoryRelease(
    variantId: string,
    quantity: number,
    context: StockActionContext
  ): Promise<void> {
    if (!this.canUseInventoryRepo()) return;
    try {
      if (typeof this.inventoryRepo.atomicReleaseStock === 'function') {
        const atomicInv = await this.inventoryRepo.atomicReleaseStock(variantId, quantity);
        if (atomicInv) {
          await this.writeStockLog(
            atomicInv.id,
            'RELEASE',
            quantity,
            Math.max(0, atomicInv.availableStock - quantity),
            atomicInv.availableStock,
            context
          );
          return;
        }
      }

      const inventory = await this.inventoryRepo.findByVariantId(variantId);
      if (!inventory) return;

      const prevAvail = inventory.availableStock;
      const newAvail = prevAvail + quantity;
      const newReserved = Math.max(0, inventory.reservedStock - quantity);
      const updatedInv = Inventory.reconstitute({
        ...inventory.toJSON(),
        availableStock: newAvail,
        reservedStock: newReserved,
        updatedAt: new Date(),
      });
      const savedInv = await this.inventoryRepo.save(updatedInv);
      await this.writeStockLog(savedInv.id, 'RELEASE', quantity, prevAvail, newAvail, context);
    } catch {
      // Secondary inventory telemetry must not block stock restoration
    }
  }

  private async writeStockLog(
    inventoryId: string,
    type: 'RESERVE' | 'RELEASE',
    amount: number,
    previousStock: number,
    newStock: number,
    context: StockActionContext
  ): Promise<void> {
    if (!this.canUseStockLogRepo()) return;
    const log = StockLog.create({
      inventoryId,
      type,
      amount,
      previousStock,
      newStock,
      reason: context.reason,
      reference: context.reference || null,
    });
    await this.stockLogRepo.save(log);
  }
}

