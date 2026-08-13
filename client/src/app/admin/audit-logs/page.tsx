'use client';

import React, { useEffect, useState } from 'react';
import { auditLogsApi, AuditLogItem, AuditLogQueryParams } from '@/lib/api/audit-logs';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Activity,
  FileCode,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Clock,
  Globe,
  Database,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const ACTION_OPTIONS = [
  { label: 'All Actions', value: '' },
  { label: 'Order Created', value: 'ORDER_CREATED' },
  { label: 'Order Cancelled', value: 'ORDER_CANCELLED' },
  { label: 'Order Status Changed', value: 'ORDER_STATUS_CHANGED' },
  { label: 'Payment Created', value: 'PAYMENT_CREATED' },
  { label: 'Payment Verified', value: 'PAYMENT_VERIFIED' },
  { label: 'Payment Failed', value: 'PAYMENT_FAILED' },
  { label: 'Refund Created', value: 'REFUND_CREATED' },
  { label: 'Refund Completed', value: 'REFUND_COMPLETED' },
  { label: 'Return Created', value: 'RETURN_CREATED' },
  { label: 'Return Approved', value: 'RETURN_APPROVED' },
  { label: 'Return Rejected', value: 'RETURN_REJECTED' },
  { label: 'Inventory Adjusted', value: 'INVENTORY_ADJUSTED' },
  { label: 'Role Changed', value: 'ROLE_CHANGED' },
  { label: 'User Created/Updated', value: 'USER_UPDATED' },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log Modal for JSON Diff Inspection
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async (currentPage = page) => {
    try {
      setIsLoading(true);
      const params: AuditLogQueryParams = {
        page: currentPage,
        limit: 15,
        action: actionFilter || undefined,
        actorRole: roleFilter || undefined,
        search: searchQuery.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await auditLogsApi.getAuditLogs(params);
      setLogs(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to retrieve audit log records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs(1);
  }, [actionFilter, roleFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAuditLogs(1);
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('COMPLETED')) {
      return 'bg-emerald-100 text-emerald-950 border-emerald-300 font-bold';
    }
    if (action.includes('CANCELLED') || action.includes('REJECTED') || action.includes('FAILED')) {
      return 'bg-rose-100 text-rose-950 border-rose-300 font-bold';
    }
    if (action.includes('STATUS') || action.includes('ADJUSTED')) {
      return 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
    }
    return 'bg-blue-100 text-blue-950 border-blue-300 font-bold';
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN': return 'bg-purple-100 text-purple-950 border-purple-300 font-extrabold';
      case 'STAFF': return 'bg-sky-100 text-sky-950 border-sky-300 font-extrabold';
      case 'CUSTOMER': return 'bg-slate-200 text-slate-900 border-slate-300 font-bold';
      default: return 'bg-amber-100 text-amber-950 border-amber-300 font-bold';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-900">
      {/* Top Banner Header */}
      <div className="bg-[#1A2E4C] text-white p-6 rounded-2xl shadow-md border border-[#132238] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3 tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D2925D] flex items-center justify-center border border-white/10 shrink-0">
              <ShieldCheck size={24} />
            </div>
            <span>System & Security Audit Logs</span>
          </h1>
          <p className="text-xs font-semibold text-blue-100 mt-2 max-w-2xl leading-relaxed">
            Immutable persistent record of all administrative, financial, inventory, and order state actions.
          </p>
        </div>

        <button
          onClick={() => fetchAuditLogs(page)}
          className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-[#D2925D] hover:bg-[#b87c4b] text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-sm self-start md:self-auto cursor-pointer"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Logs
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search Query */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, ID, or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-lg text-xs focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none cursor-pointer"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="text-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none cursor-pointer"
            >
              <option value="" className="text-slate-900">All Roles</option>
              <option value="ADMIN" className="text-slate-900">ADMIN</option>
              <option value="STAFF" className="text-slate-900">STAFF</option>
              <option value="CUSTOMER" className="text-slate-900">CUSTOMER</option>
              <option value="SYSTEM" className="text-slate-900">SYSTEM</option>
            </select>
          </div>

          {/* Submit Search */}
          <div>
            <button
              type="submit"
              className="w-full bg-[#1A2E4C] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#132238] transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </form>

        {/* Date Range Inputs */}
        <div className="flex flex-wrap items-center gap-4 text-xs pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">From Date:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="border border-slate-300 bg-white text-slate-900 font-medium rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">To Date:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="border border-slate-300 bg-white text-slate-900 font-medium rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
            />
          </div>
          {(actionFilter || roleFilter || searchQuery || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setActionFilter('');
                setRoleFilter('');
                setSearchQuery('');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
              className="text-rose-600 font-bold hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* High Contrast Audit Logs Table */}
      <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1A2E4C] text-white uppercase tracking-wider font-extrabold border-b border-[#132238]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Actor</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Resource</th>
                <th className="p-3.5">Description</th>
                <th className="p-3.5 text-center">Context</th>
                <th className="p-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-600">
                    <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-800">Loading audit logs from database...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-600">
                    <Database className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="font-bold text-base text-slate-900">No Audit Logs Found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filter date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr
                    key={log.id}
                    className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'} hover:bg-amber-50/50`}
                  >
                    {/* Timestamp */}
                    <td className="p-3.5 whitespace-nowrap text-slate-800">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold">
                        <Clock size={13} className="text-slate-500 shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-wider ${getRoleBadgeStyle(log.actorRole)}`}>
                          {log.actorRole}
                        </span>
                        <span className="font-mono text-slate-900 font-bold text-[11px] truncate max-w-[100px]" title={log.actorId}>
                          {log.actorId.substring(0, 10)}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider border shadow-2xs ${getActionBadgeStyle(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900 block">{log.resourceType}</span>
                      <span className="font-mono text-[10px] text-slate-600 font-semibold">{log.resourceId.substring(0, 12)}</span>
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-900 max-w-xs font-semibold">
                      <p className="truncate text-xs leading-relaxed" title={log.description}>{log.description}</p>
                    </td>

                    {/* IP Context */}
                    <td className="p-3.5 text-center whitespace-nowrap font-mono text-[11px]">
                      {log.ipAddress ? (
                        <span className="inline-flex items-center gap-1 bg-slate-100 border border-slate-300 text-slate-800 font-bold px-2 py-0.5 rounded">
                          <Globe size={11} className="text-slate-500" />
                          {log.ipAddress}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">N/A</span>
                      )}
                    </td>

                    {/* Details Inspector Trigger */}
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold rounded-lg transition-colors text-xs shadow-2xs cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* High Contrast Pagination Footer */}
        <div className="p-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-700 bg-slate-100 font-medium">
          <span>
            Showing <strong className="text-slate-900 font-bold">{logs.length}</strong> of <strong className="text-slate-900 font-bold">{total}</strong> audit records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchAuditLogs(p); }}
              disabled={page <= 1 || isLoading}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-900">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => { const p = Math.min(totalPages, page + 1); setPage(p); fetchAuditLogs(p); }}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* High Contrast JSON Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-700 text-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="text-[#D2925D]" size={20} />
                <h3 className="text-base font-bold text-white tracking-tight">
                  Audit State Snapshot — {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Context Summary Header */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-800/90 rounded-xl border border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-extrabold tracking-wider">Actor Identity</span>
                  <p className="font-bold text-white">{selectedLog.actorRole} ({selectedLog.actorId})</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-extrabold tracking-wider">Target Resource</span>
                  <p className="font-bold text-white">{selectedLog.resourceType} : {selectedLog.resourceId}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-extrabold tracking-wider">Request IP</span>
                  <p className="font-mono font-bold text-amber-300">{selectedLog.ipAddress || 'Internal / N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-extrabold tracking-wider">Log Timestamp</span>
                  <p className="font-mono font-bold text-slate-200">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <span className="font-bold text-slate-300 block mb-1">Action Description:</span>
                <p className="p-3 bg-slate-800 border border-slate-700 rounded-lg text-amber-200 font-semibold">
                  {selectedLog.description}
                </p>
              </div>

              {/* Before vs After JSON Diffs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Before State */}
                <div>
                  <span className="font-bold text-rose-400 block mb-1">Before State (Previous):</span>
                  <pre className="bg-slate-950 text-rose-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono border border-rose-900/60 h-40">
                    {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : '// No previous state'}
                  </pre>
                </div>

                {/* After State */}
                <div>
                  <span className="font-bold text-emerald-400 block mb-1">After State (Snapshot):</span>
                  <pre className="bg-slate-950 text-emerald-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono border border-emerald-900/60 h-40">
                    {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : '// No new state'}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              {selectedLog.metadata && (
                <div>
                  <span className="font-bold text-slate-300 block mb-1">Additional Metadata Payload:</span>
                  <pre className="bg-slate-950 text-sky-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono border border-slate-800">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#D2925D] hover:bg-[#b87c4b] text-slate-950 text-xs font-extrabold rounded-lg shadow-sm cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
