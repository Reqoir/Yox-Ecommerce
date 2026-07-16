/**
 * @file stock-log.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IStockLogRepository } from '../../domain/repositories/stock-log.repository.interface';
import { StockLog } from '../../domain/entities/stock-log.entity';
import { StockLogModel, IStockLogDocument } from '../models/stock-log.model';

export class StockLogRepository implements IStockLogRepository {
  
  private mapToDomain(doc: IStockLogDocument): StockLog {
    const data = doc.toObject();
    return StockLog.reconstitute({
      id: data.id,
      inventoryId: data.inventoryId,
      type: data.type,
      amount: data.amount,
      previousStock: data.previousStock,
      newStock: data.newStock,
      reason: data.reason,
      reference: data.reference,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async save(stockLog: StockLog): Promise<StockLog> {
    const data = stockLog.toJSON();
    const { id, ...rest } = data;
    
    if (id) {
      const updated = await StockLogModel.findByIdAndUpdate(id, rest, { new: true }).exec();
      if (!updated) throw new Error('Stock log not found');
      return this.mapToDomain(updated);
    } else {
      const created = new StockLogModel(rest);
      await created.save();
      return this.mapToDomain(created);
    }
  }

  async findByInventoryId(inventoryId: string, query: any): Promise<{ data: StockLog[]; total: number }> {
    const filter: any = { inventoryId };
    
    const limit = parseInt(query.limit) || 10;
    const page = parseInt(query.page) || 1;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      StockLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      StockLogModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map(doc => this.mapToDomain(doc)),
      total,
    };
  }
}
