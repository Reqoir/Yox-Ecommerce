/**
 * @file return.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Return } from '../entities/return.entity';

export interface IReturnRepository {
  save(returnEntity: Return): Promise<Return>;
  findById(id: string): Promise<Return | null>;
  findByOrderId(orderId: string): Promise<Return[]>;
  findByUserId(userId: string): Promise<Return[]>;
  findByOrderItemId(orderId: string, orderItemId: string): Promise<Return[]>;
  findAllReturns(query?: any): Promise<{ data: Return[]; total: number }>;
  delete(id: string): Promise<boolean>;
}
