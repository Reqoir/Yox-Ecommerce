/**
 * @file stock-log.repository.interface.ts
 * @layer Domain
 */

import { StockLog } from '../entities/stock-log.entity';

export interface IStockLogRepository {
  save(stockLog: StockLog): Promise<StockLog>;
  findByInventoryId(inventoryId: string, query: any): Promise<{ data: StockLog[]; total: number }>;
}
