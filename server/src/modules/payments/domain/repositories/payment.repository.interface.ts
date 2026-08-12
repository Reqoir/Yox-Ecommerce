/**
 * @file payment.repository.interface.ts
 * @layer Domain › Repositories
 */

import { Payment, Refund } from '../entities/payment.entity';

export interface IPaymentRepository {
  save(payment: Payment): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByOrderId(orderId: string): Promise<Payment | null>;
  findByTransactionId(transactionId: string): Promise<Payment | null>;
  delete(id: string): Promise<boolean>;
}

export interface IRefundRepository {
  save(refund: Refund): Promise<Refund>;
  findById(id: string): Promise<Refund | null>;
  findByReturnId(returnId: string): Promise<Refund | null>;
  findByOrderId(orderId: string): Promise<Refund[]>;
  delete(id: string): Promise<boolean>;
}
