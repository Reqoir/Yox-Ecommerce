/**
 * @file audit-log.routes.ts
 * @layer Presentation › Routes
 */

import { Router } from 'express';
import { AuditLogRepository } from '../../infrastructure/repositories/audit-log.repository';
import { AuditLogService } from '../../application/services/audit-log.service';
import {
  GetAuditLogsUseCase,
  GetAuditLogByIdUseCase,
  GetResourceAuditLogsUseCase,
} from '../../application/use-cases/audit-log.use-cases';
import { AuditLogController } from '../controllers/audit-log.controller';
import { requireAuth } from '../../../../presentation/http/middleware/require-auth.middleware';
import { requirePermission } from '../../../../presentation/http/middleware/require-permission.middleware';

const router = Router();

// DI Setup
const auditLogRepo = new AuditLogRepository();
const auditLogService = new AuditLogService(auditLogRepo);
AuditLogService.setInstance(auditLogService);

const getAuditLogsUseCase = new GetAuditLogsUseCase(auditLogRepo);
const getAuditLogByIdUseCase = new GetAuditLogByIdUseCase(auditLogRepo);
const getResourceAuditLogsUseCase = new GetResourceAuditLogsUseCase(auditLogRepo);

const controller = new AuditLogController(
  getAuditLogsUseCase,
  getAuditLogByIdUseCase,
  getResourceAuditLogsUseCase
);

// Admin / Financial Audit Protection Middleware
router.use(requireAuth);
router.use(requirePermission('view_audit_logs'));

router.get('/', controller.getAuditLogs);
router.get('/:id', controller.getAuditLogById);
router.get('/resource/:resourceType/:resourceId', controller.getResourceAuditLogs);

export { router as auditLogRouter, auditLogService };
