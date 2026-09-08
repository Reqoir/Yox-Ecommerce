/**
 * @file audit-log.use-cases.ts
 * @layer Application › Use Cases
 */

import { IUseCase } from '@core/application/use-cases/base.use-case.interface';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogResponseDTO, AuditLogQueryFilterDTO } from '../dtos/audit-log.dto';
import { UserModel } from '../../../users/infrastructure/models/user.model';
import { RoleModel } from '../../../roles/infrastructure/models/role.model';

export function mapToAuditLogResponseDTO(
  auditLog: AuditLog,
  userMap?: Map<string, any>,
  roleMap?: Map<string, string>
): AuditLogResponseDTO {
  const user = userMap?.get(auditLog.actorId);
  const resolvedRole = user?.roleId ? roleMap?.get(user.roleId) : null;
  const isSystem = auditLog.actorId === 'SYSTEM' || auditLog.actorRole === 'SYSTEM';

  const actorName = auditLog.actorName || user?.fullName || (isSystem ? 'Automated System' : null);
  const rawEmail = auditLog.actorEmail || user?.email || null;
  const actorEmail = rawEmail === 'system@internal' ? null : rawEmail;

  // RULE: Only admin@yox.com is ADMIN. All other staff (support, manager, etc.) are STAFF.
  const emailLower = (actorEmail || '').toLowerCase();
  let actorRole: string;

  if (emailLower === 'admin@yox.com') {
    actorRole = 'ADMIN';
  } else if (auditLog.actorRole === 'CUSTOMER' || resolvedRole?.toUpperCase() === 'CUSTOMER') {
    actorRole = 'CUSTOMER';
  } else if (isSystem) {
    actorRole = 'SYSTEM';
  } else {
    actorRole = 'STAFF';
  }

  return {
    id: auditLog.id,
    actorId: auditLog.actorId,
    actorRole,
    actorName,
    actorEmail,
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

    // Collect unique actorIds to resolve
    const actorIds = Array.from(new Set(
      result.data
        .map((d) => d.actorId)
        .filter((id) => id && id !== 'SYSTEM' && id.length === 24)
    ));

    const users = actorIds.length > 0
      ? await UserModel.find({ _id: { $in: actorIds } }).select('_id fullName email roleId').lean()
      : [];
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    const roleIds = Array.from(new Set(users.map((u: any) => u.roleId).filter(Boolean)));
    const roles = roleIds.length > 0
      ? await RoleModel.find({ _id: { $in: roleIds } }).select('_id name').lean()
      : [];
    const roleMap = new Map(roles.map((r: any) => [r._id.toString(), r.name]));

    return {
      data: result.data.map((log) => mapToAuditLogResponseDTO(log, userMap, roleMap)),
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

    let userMap: Map<string, any> | undefined;
    let roleMap: Map<string, string> | undefined;
    if (auditLog.actorId && auditLog.actorId !== 'SYSTEM' && auditLog.actorId.length === 24) {
      const u = await UserModel.findById(auditLog.actorId).select('_id fullName email roleId').lean();
      if (u) {
        userMap = new Map([[u._id.toString(), u]]);
        if (u.roleId) {
          const r = await RoleModel.findById(u.roleId).select('_id name').lean();
          if (r) roleMap = new Map([[r._id.toString(), r.name]]);
        }
      }
    }

    return mapToAuditLogResponseDTO(auditLog, userMap, roleMap);
  }
}

export class GetResourceAuditLogsUseCase implements IUseCase<{ resourceType: string; resourceId: string }, AuditLogResponseDTO[]> {
  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  async execute(input: { resourceType: string; resourceId: string }): Promise<AuditLogResponseDTO[]> {
    const logs = await this.auditLogRepo.findByResource(input.resourceType, input.resourceId);
    return logs.map((log) => mapToAuditLogResponseDTO(log));
  }
}
