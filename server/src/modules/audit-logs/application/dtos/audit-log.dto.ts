/**
 * @file audit-log.dto.ts
 * @layer Application › DTOs
 */

import { AuditAction, ActorRole } from '../../domain/entities/audit-log.entity';

export interface CreateAuditLogDTO {
  actorId?: string;
  actorRole?: ActorRole | string;
  action: AuditAction | string;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, any> | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogResponseDTO {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  description: string;
  metadata?: Record<string, any> | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface AuditLogQueryFilterDTO {
  actorId?: string;
  actorRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}
