/**
 * @file audit-log.repository.ts
 * @layer Infrastructure › Repositories
 */

import { IAuditLogRepository, AuditLogFilter, PaginatedAuditLogs } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogModel, IAuditLogDocument } from '../models/audit-log.model';

export class AuditLogRepository implements IAuditLogRepository {
  private toDomain(doc: IAuditLogDocument): AuditLog {
    const data = doc.toObject ? doc.toObject() : doc;
    return AuditLog.reconstitute({
      id: doc._id ? doc._id.toString() : data.id || '',
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      description: data.description,
      metadata: data.metadata,
      before: data.before,
      after: data.after,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    });
  }

  async save(auditLog: AuditLog): Promise<AuditLog> {
    const data = auditLog.toJSON();
    const created = await AuditLogModel.create({
      actorId: data.actorId,
      actorRole: data.actorRole,
      action: data.action,
      resourceType: data.resourceType,
      resourceId: data.resourceId,
      description: data.description,
      metadata: data.metadata || null,
      before: data.before || null,
      after: data.after || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
    return this.toDomain(created);
  }

  async findById(id: string): Promise<AuditLog | null> {
    const doc = await AuditLogModel.findById(id).exec();
    if (!doc) return null;
    return this.toDomain(doc);
  }

  async find(filter: AuditLogFilter): Promise<PaginatedAuditLogs> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (filter.actorId) query.actorId = filter.actorId;
    if (filter.actorRole) query.actorRole = filter.actorRole;
    if (filter.action) query.action = filter.action;
    if (filter.resourceType) query.resourceType = filter.resourceType;
    if (filter.resourceId) query.resourceId = filter.resourceId;

    const isValidDate = (d?: any) => d && typeof d === 'string' && d.trim() !== '' && !isNaN(new Date(d).getTime());

    if (isValidDate(filter.dateFrom) || isValidDate(filter.dateTo)) {
      query.createdAt = {};
      if (isValidDate(filter.dateFrom)) query.createdAt.$gte = new Date(filter.dateFrom!);
      if (isValidDate(filter.dateTo)) query.createdAt.$lte = new Date(filter.dateTo!);
    }

    if (filter.search && filter.search.trim() !== '') {
      const searchRegex = new RegExp(filter.search.trim(), 'i');
      query.$or = [
        { description: searchRegex },
        { resourceId: searchRegex },
        { resourceType: searchRegex },
        { actorId: searchRegex },
      ];
    }

    const [docs, total] = await Promise.all([
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => this.toDomain(doc)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByResource(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    const docs = await AuditLogModel.find({ resourceType, resourceId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((doc) => this.toDomain(doc));
  }
}
