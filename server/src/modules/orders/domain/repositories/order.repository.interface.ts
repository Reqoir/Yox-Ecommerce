/**
 * @file order.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Order } from '../entities/order.entity';

export interface IOrderRepository {
  save(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByUserId(userId: string, query?: any): Promise<{ data: Order[]; total: number }>;
  findAllOrders(query?: any): Promise<{ data: Order[]; total: number }>;
  delete(id: string): Promise<boolean>;
}
