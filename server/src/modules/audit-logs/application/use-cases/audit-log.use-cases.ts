/**
 * @file audit-log.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogResponseDTO, AuditLogQueryFilterDTO } from '../dtos/audit-log.dto';

export function mapToAuditLogResponseDTO(auditLog: AuditLog): AuditLogResponseDTO {
  return {
    id: auditLog.id,
    actorId: auditLog.actorId,
    actorRole: auditLog.actorRole,
    action: auditLog.action,
    resourceType: auditLog.resourceType,
    resourceId: auditLog.resourceId,
    description: auditLog.description,
    metadata: auditLog.metadata,
    before: auditLog.before,
    after: auditLog.after,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    createdAt: auditLog.createdAt.toISOString(),
  };
}

export class GetAuditLogsUseCase implements IUseCase<AuditLogQueryFilterDTO, { data: AuditLogResponseDTO[]; total: number; page: number; limit: number; totalPages: number }> {
  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  async execute(filter: AuditLogQueryFilterDTO) {
    const result = await this.auditLogRepo.find({
      actorId: filter.actorId,
      actorRole: filter.actorRole,
      action: filter.action,
      resourceType: filter.resourceType,
      resourceId: filter.resourceId,
      dateFrom: filter.dateFrom ? new Date(filter.dateFrom) : undefined,
      dateTo: filter.dateTo ? new Date(filter.dateTo) : undefined,
      search: filter.search,
      page: filter.page ? Number(filter.page) : 1,
      limit: filter.limit ? Number(filter.limit) : 20,
    });

    return {
      data: result.data.map(mapToAuditLogResponseDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}

export class GetAuditLogByIdUseCase implements IUseCase<string, AuditLogResponseDTO> {
  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  async execute(id: string): Promise<AuditLogResponseDTO> {
    const auditLog = await this.auditLogRepo.findById(id);
    if (!auditLog) {
      throw new Error(`Audit log record with ID "${id}" not found`);
    }
    return mapToAuditLogResponseDTO(auditLog);
  }
}

export class GetResourceAuditLogsUseCase implements IUseCase<{ resourceType: string; resourceId: string }, AuditLogResponseDTO[]> {
  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  async execute(input: { resourceType: string; resourceId: string }): Promise<AuditLogResponseDTO[]> {
    const logs = await this.auditLogRepo.findByResource(input.resourceType, input.resourceId);
    return logs.map(mapToAuditLogResponseDTO);
  }
}
