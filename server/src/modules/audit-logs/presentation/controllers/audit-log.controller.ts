/**
 * @file audit-log.controller.ts
 * @layer Presentation › Controllers
 */

import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@shared/utils/api-response.util';
import { GetAuditLogsUseCase, GetAuditLogByIdUseCase, GetResourceAuditLogsUseCase } from '../../application/use-cases/audit-log.use-cases';

export class AuditLogController {
  constructor(
    private readonly getAuditLogsUseCase: GetAuditLogsUseCase,
    private readonly getAuditLogByIdUseCase: GetAuditLogByIdUseCase,
    private readonly getResourceAuditLogsUseCase: GetResourceAuditLogsUseCase
  ) {}

  getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filter = {
        actorId: req.query['actorId'] as string,
        actorRole: req.query['actorRole'] as string,
        action: req.query['action'] as string,
        resourceType: req.query['resourceType'] as string,
        resourceId: req.query['resourceId'] as string,
        dateFrom: req.query['dateFrom'] as string,
        dateTo: req.query['dateTo'] as string,
        search: req.query['search'] as string,
        page: req.query['page'] ? Number(req.query['page']) : 1,
        limit: req.query['limit'] ? Number(req.query['limit']) : 20,
      };

      const result = await this.getAuditLogsUseCase.execute(filter);
      ApiResponse.success(res, result, 'Audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getAuditLogById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.getAuditLogByIdUseCase.execute(id);
      ApiResponse.success(res, result, 'Audit log detail retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getResourceAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { resourceType, resourceId } = req.params;
      const result = await this.getResourceAuditLogsUseCase.execute({ resourceType, resourceId });
      ApiResponse.success(res, result, `Audit logs for ${resourceType}:${resourceId} retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };
}
