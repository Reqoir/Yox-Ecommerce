import apiClient from '../axios';

export interface AuditLogItem {
  id: string;
  actorId: string;
  actorRole: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SYSTEM' | string;
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

export interface PaginatedAuditLogsResponse {
  data: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogQueryParams {
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

export const auditLogsApi = {
  getAuditLogs: async (params?: AuditLogQueryParams): Promise<PaginatedAuditLogsResponse> => {
    const response = await apiClient.get<any>('/audit-logs', { params });
    const resData = response.data?.data || response.data;
    if (resData && Array.isArray(resData.data)) {
      return resData;
    }
    return {
      data: Array.isArray(resData) ? resData : [],
      total: resData?.total || 0,
      page: resData?.page || 1,
      limit: resData?.limit || 20,
      totalPages: resData?.totalPages || 1,
    };
  },

  getAuditLogById: async (id: string): Promise<AuditLogItem> => {
    const response = await apiClient.get<any>(`/audit-logs/${id}`);
    return response.data?.data || response.data;
  },

  getResourceAuditLogs: async (resourceType: string, resourceId: string): Promise<AuditLogItem[]> => {
    const response = await apiClient.get<any>(`/audit-logs/resource/${resourceType}/${resourceId}`);
    const resData = response.data?.data || response.data;
    return Array.isArray(resData) ? resData : [];
  },
};
