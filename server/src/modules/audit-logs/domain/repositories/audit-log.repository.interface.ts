/**
 * @file audit-log.repository.interface.ts
 * @layer Domain › Repositories
 */

import { AuditLog } from '../entities/audit-log.entity';

export interface AuditLogFilter {
  actorId?: string;
  actorRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IAuditLogRepository {
  save(auditLog: AuditLog): Promise<AuditLog>;
  findById(id: string): Promise<AuditLog | null>;
  find(filter: AuditLogFilter): Promise<PaginatedAuditLogs>;
  findByResource(resourceType: string, resourceId: string): Promise<AuditLog[]>;
}
