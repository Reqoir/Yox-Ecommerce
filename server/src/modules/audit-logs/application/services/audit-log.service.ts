/**
 * @file audit-log.service.ts
 * @layer Application › Services
 * @description Centralized audit logging service for recording sanitized business/security actions.
 */

import { Request } from 'express';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import { AuditLog, ActorRole } from '../../domain/entities/audit-log.entity';
import { CreateAuditLogDTO } from '../dtos/audit-log.dto';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'secret',
  'token',
  'accesstoken',
  'refreshtoken',
  'jwt',
  'cvv',
  'cardnumber',
  'creditcard',
  'razorpay_secret',
  'api_secret',
]);

export class AuditLogService {
  private static instance: AuditLogService;

  constructor(private readonly auditLogRepo: IAuditLogRepository) {}

  public static setInstance(service: AuditLogService): void {
    AuditLogService.instance = service;
  }

  public static getInstance(): AuditLogService | null {
    return AuditLogService.instance || null;
  }

  /**
   * Deeply sanitizes objects to remove sensitive keys (passwords, tokens, payment secrets).
   */
  public sanitize(data: any): any {
    if (!data || typeof data !== 'object') return data;
    if (Array.isArray(data)) return data.map((item) => this.sanitize(item));

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        sanitized[key] = '[REDACTED]';
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitize(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Helper to extract client IP address safely from Express request.
   */
  public static extractIp(req?: Request): string | null {
    if (!req) return null;
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string') {
      return xForwardedFor.split(',')[0].trim();
    }
    return req.socket?.remoteAddress || req.ip || null;
  }

  /**
   * Helper to extract User-Agent string from Express request.
   */
  public static extractUserAgent(req?: Request): string | null {
    if (!req) return null;
    return req.headers['user-agent'] || null;
  }

  /**
   * Record an audit log entry safely.
   */
  async record(dto: CreateAuditLogDTO, req?: Request): Promise<AuditLog | null> {
    try {
      // 1. Resolve Actor Details
      let actorId = dto.actorId;
      let actorRole: ActorRole | string = dto.actorRole || 'SYSTEM';

      if (req && req.user) {
        actorId = actorId || req.user.id;
        actorRole = req.user.role === 'admin' || req.user.role === 'super_admin'
          ? 'ADMIN'
          : req.user.role === 'staff'
          ? 'STAFF'
          : 'CUSTOMER';
      } else if (!actorId) {
        actorId = 'SYSTEM';
        actorRole = 'SYSTEM';
      }

      // 2. Resolve IP and User-Agent
      const ipAddress = dto.ipAddress || AuditLogService.extractIp(req);
      const userAgent = dto.userAgent || AuditLogService.extractUserAgent(req);

      // 3. Create AuditLog Domain Entity with Sanitized Payloads
      const auditLog = AuditLog.create({
        actorId: actorId!,
        actorRole: actorRole!,
        action: dto.action,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        description: dto.description,
        metadata: dto.metadata ? this.sanitize(dto.metadata) : null,
        before: dto.before ? this.sanitize(dto.before) : null,
        after: dto.after ? this.sanitize(dto.after) : null,
        ipAddress,
        userAgent,
      });

      // 4. Save to Repository
      return await this.auditLogRepo.save(auditLog);
    } catch (error) {
      // Audit log failures must be non-blocking to critical operations
      console.error('[AuditLogService Error]', error);
      return null;
    }
  }
}
