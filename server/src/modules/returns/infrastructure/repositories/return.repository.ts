/**
 * @file return.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IReturnRepository } from '../../domain/repositories/return.repository.interface';
import { Return } from '../../domain/entities/return.entity';
import { ReturnModel, IReturnDocument } from '../models/return.model';

export class ReturnRepository implements IReturnRepository {
  private toDomain(doc: IReturnDocument): Return {
    return Return.reconstitute({
      id: doc._id.toString(),
      orderId: doc.orderId,
      orderItemId: doc.orderItemId,
      userId: doc.userId,
      quantity: doc.quantity,
      reason: doc.reason,
      customerNote: doc.customerNote,
      images: doc.images || [],
      status: doc.status,
      inspectionResult: doc.inspectionResult as any,
      rejectionReason: doc.rejectionReason,
      refundId: doc.refundId,
      refundAmount: doc.refundAmount,
      refundMethod: doc.refundMethod,
      refundTransactionId: doc.refundTransactionId,
      approvedAt: doc.approvedAt,
      receivedAt: doc.receivedAt,
      inspectedAt: doc.inspectedAt,
      refundedAt: doc.refundedAt,
      pickupDate: doc.pickupDate,
      pickupTimeSlot: doc.pickupTimeSlot,
      pickupAgentName: doc.pickupAgentName,
      pickupAgentPhone: doc.pickupAgentPhone,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<Return | null> {
    const doc = await ReturnModel.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByOrderId(orderId: string): Promise<Return[]> {
    const docs = await ReturnModel.find({ orderId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByUserId(userId: string): Promise<Return[]> {
    const docs = await ReturnModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findByOrderItemId(orderId: string, orderItemId: string): Promise<Return[]> {
    const docs = await ReturnModel.find({ orderId, orderItemId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  async findAllReturns(query: any = {}): Promise<{ data: Return[]; total: number }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;
    if (query.orderId) filter.orderId = query.orderId;

    const [docs, total] = await Promise.all([
      ReturnModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      ReturnModel.countDocuments(filter).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
    };
  }

  async save(returnEntity: Return): Promise<Return> {
    if (returnEntity.id) {
      const doc = await ReturnModel.findByIdAndUpdate(
        returnEntity.id,
        {
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
          updatedAt: new Date(),
        },
        { new: true }
      ).exec();
      if (!doc) throw new Error('Return entity not found for update');
      return this.toDomain(doc);
    } else {
      const created = await ReturnModel.create({
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
      });
      return this.toDomain(created);
    }
  }

  async delete(id: string): Promise<boolean> {
    const res = await ReturnModel.findByIdAndDelete(id).exec();
    return !!res;
  }
}
