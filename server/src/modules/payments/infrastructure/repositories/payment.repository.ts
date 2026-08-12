/**
 * @file payment.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IPaymentRepository, IRefundRepository } from '../../domain/repositories/payment.repository.interface';
import { Payment, Refund } from '../../domain/entities/payment.entity';
import { PaymentModel, RefundModel, IPaymentDocument, IRefundDocument } from '../models/payment.model';

export class PaymentRepository implements IPaymentRepository {
  private toDomain(doc: IPaymentDocument): Payment {
    return Payment.reconstitute({
      id: doc._id.toString(),
      orderId: doc.orderId,
      userId: doc.userId,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      paymentStatus: doc.paymentStatus,
      transactionId: doc.transactionId,
      gatewayOrderId: doc.gatewayOrderId,
      refundedAmount: doc.refundedAmount,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<Payment | null> {
    const doc = await PaymentModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ orderId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByTransactionId(transactionId: string): Promise<Payment | null> {
    const doc = await PaymentModel.findOne({ transactionId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async save(payment: Payment): Promise<Payment> {
    if (payment.id) {
      const doc = await PaymentModel.findByIdAndUpdate(
        payment.id,
        {
          orderId: payment.orderId,
          userId: payment.userId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod,
          paymentStatus: payment.paymentStatus,
          transactionId: payment.transactionId,
          gatewayOrderId: payment.gatewayOrderId,
          refundedAmount: payment.refundedAmount,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
      if (!doc) throw new Error('Payment record not found for update');
      return this.toDomain(doc);
    } else {
      const created = await PaymentModel.create({
        orderId: payment.orderId,
        userId: payment.userId,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        transactionId: payment.transactionId,
        gatewayOrderId: payment.gatewayOrderId,
        refundedAmount: payment.refundedAmount,
      });
      return this.toDomain(created);
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = await PaymentModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}

export class RefundRepository implements IRefundRepository {
  private toDomain(doc: IRefundDocument): Refund {
    return Refund.reconstitute({
      id: doc._id.toString(),
      paymentId: doc.paymentId,
      orderId: doc.orderId,
      returnId: doc.returnId,
      amount: doc.amount,
      paymentMethod: doc.paymentMethod,
      gatewayRefundId: doc.gatewayRefundId,
      status: doc.status,
      failureReason: doc.failureReason,
      processedAt: doc.processedAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<Refund | null> {
    const doc = await RefundModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByReturnId(returnId: string): Promise<Refund | null> {
    const doc = await RefundModel.findOne({ returnId }).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Refund[]> {
    const docs = await RefundModel.find({ orderId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async save(refund: Refund): Promise<Refund> {
    if (refund.id) {
      const doc = await RefundModel.findByIdAndUpdate(
        refund.id,
        {
          paymentId: refund.paymentId,
          orderId: refund.orderId,
          returnId: refund.returnId,
          amount: refund.amount,
          paymentMethod: refund.paymentMethod,
          gatewayRefundId: refund.gatewayRefundId,
          status: refund.status,
          failureReason: refund.failureReason,
          processedAt: refund.processedAt,
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
      if (!doc) throw new Error('Refund record not found for update');
      return this.toDomain(doc);
    } else {
      const created = await RefundModel.create({
        paymentId: refund.paymentId,
        orderId: refund.orderId,
        returnId: refund.returnId,
        amount: refund.amount,
        paymentMethod: refund.paymentMethod,
        gatewayRefundId: refund.gatewayRefundId,
        status: refund.status,
        failureReason: refund.failureReason,
        processedAt: refund.processedAt,
      });
      return this.toDomain(created);
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = await RefundModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
