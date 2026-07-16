/**
 * @file inventory.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IInventoryRepository } from '../../domain/repositories/inventory.repository.interface';
import { IStockLogRepository } from '../../domain/repositories/stock-log.repository.interface';
import { Inventory } from '../../domain/entities/inventory.entity';
import { StockLog } from '../../domain/entities/stock-log.entity';
import { 
  UpdateInventoryRequestDTO, 
  AdjustStockRequestDTO, 
  InventoryResponseDTO, 
  StockLogResponseDTO 
} from '../dtos/inventory.dto';

// --- Mappers ---
function mapToInventoryResponseDTO(inventory: Inventory): InventoryResponseDTO {
  return {
    id: inventory.id,
    variantId: inventory.variantId,
    availableStock: inventory.availableStock,
    reservedStock: inventory.reservedStock,
    damagedStock: inventory.damagedStock,
    warehouseLocation: inventory.warehouseLocation,
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

// --- Use Cases ---

export class GetAllInventoryUseCase implements IUseCase<any, { data: InventoryResponseDTO[]; total: number }> {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(query: any): Promise<{ data: InventoryResponseDTO[]; total: number }> {
    const result = await this.inventoryRepo.findAll(query);
    return {
      data: result.data.map(mapToInventoryResponseDTO),
      total: result.total,
    };
  }
}

export class GetInventoryByIdUseCase implements IUseCase<string, InventoryResponseDTO> {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(id: string): Promise<InventoryResponseDTO> {
    const inventory = await this.inventoryRepo.findById(id);
    if (!inventory) throw new Error('Inventory not found');
    return mapToInventoryResponseDTO(inventory);
  }
}

export class UpdateInventoryUseCase implements IUseCase<{ id: string; data: UpdateInventoryRequestDTO }, InventoryResponseDTO> {
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: { id: string; data: UpdateInventoryRequestDTO }): Promise<InventoryResponseDTO> {
    const inventory = await this.inventoryRepo.findById(input.id);
    if (!inventory) throw new Error('Inventory not found');

    const updatedProps = { ...inventory.toJSON(), ...input.data, id: inventory.id, createdAt: inventory.createdAt, updatedAt: new Date() };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    return mapToInventoryResponseDTO(savedInventory);
  }
}

export class AdjustStockUseCase implements IUseCase<{ id: string; data: AdjustStockRequestDTO }, { inventory: InventoryResponseDTO, log: StockLogResponseDTO }> {
  constructor(
    private readonly inventoryRepo: IInventoryRepository,
    private readonly stockLogRepo: IStockLogRepository
  ) {}

  async execute(input: { id: string; data: AdjustStockRequestDTO }): Promise<{ inventory: InventoryResponseDTO, log: StockLogResponseDTO }> {
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
      // Amount could be positive or negative
      newStock += input.data.amount;
    }

    if (newStock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Update inventory
    const updatedProps = { ...inventory.toJSON(), availableStock: newStock, updatedAt: new Date() };
    const updatedInventory = Inventory.reconstitute(updatedProps);
    const savedInventory = await this.inventoryRepo.save(updatedInventory);

    // Create Stock Log
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

    return {
      inventory: mapToInventoryResponseDTO(savedInventory),
      log: mapToStockLogResponseDTO(savedLog),
    };
  }
}

export class GetStockLogsUseCase implements IUseCase<{ inventoryId: string, query: any }, { data: StockLogResponseDTO[]; total: number }> {
  constructor(private readonly stockLogRepo: IStockLogRepository) {}

  async execute(input: { inventoryId: string, query: any }): Promise<{ data: StockLogResponseDTO[]; total: number }> {
    const result = await this.stockLogRepo.findByInventoryId(input.inventoryId, input.query);
    return {
      data: result.data.map(mapToStockLogResponseDTO),
      total: result.total,
    };
  }
}
