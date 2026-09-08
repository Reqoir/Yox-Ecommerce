'use client';

import React, { useEffect, useState } from 'react';
import { auditLogsApi, AuditLogItem, AuditLogQueryParams } from '@/lib/api/audit-logs';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Database,
  X,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Cpu,
  FileCode,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const ACTION_OPTIONS = [
  { label: 'All Actions', value: '' },
  { label: 'Order Created', value: 'ORDER_CREATED' },
  { label: 'Order Status Changed', value: 'ORDER_STATUS_CHANGED' },
  { label: 'Order Cancelled', value: 'ORDER_CANCELLED' },
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
  { label: 'User Updated', value: 'USER_UPDATED' },
];

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Selected Log Modal for JSON Diff & Inspector
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Helper: Only admin@yox.com is the real system admin, all other staff are STAFF team members
  const isMainAdmin = (email?: string | null) => {
    return (email || '').trim().toLowerCase() === 'admin@yox.com';
  };

  const getEffectiveRole = (log: AuditLogItem): 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'SYSTEM' => {
    if (isMainAdmin(log.actorEmail)) return 'ADMIN';
    if (log.actorRole === 'CUSTOMER') return 'CUSTOMER';
    if (log.actorRole === 'SYSTEM' || log.actorId === 'SYSTEM') return 'SYSTEM';
    return 'STAFF';
  };

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

  // CSV Exporter for audit trails
  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      toast.info('Preparing audit log CSV export...');

      const res = await auditLogsApi.getAuditLogs({
        page: 1,
        limit: 1000,
        action: actionFilter || undefined,
        actorRole: roleFilter || undefined,
        search: searchQuery.trim() || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });

      const exportData = res.data || [];
      if (exportData.length === 0) {
        toast.error('No records found to export.');
        return;
      }

      const headers = [
        'Log ID',
        'Timestamp',
        'Actor Name',
        'Actor Email',
        'Actor Role',
        'Actor ID',
        'Action',
        'Resource Type',
        'Resource ID',
        'Description',
        'Before Status',
        'After Status',
      ];

      const csvRows = exportData.map((log) => {
        const effectiveRole = getEffectiveRole(log);
        const cleanEmail = log.actorEmail === 'system@internal' ? '' : (log.actorEmail || '');
        const beforeStatus = log.before?.status || log.before?.paymentStatus || '';
        const afterStatus = log.after?.status || log.after?.paymentStatus || '';
        return [
          `"${log.id}"`,
          `"${new Date(log.createdAt).toISOString()}"`,
          `"${(log.actorName || '').replace(/"/g, '""')}"`,
          `"${cleanEmail.replace(/"/g, '""')}"`,
          `"${effectiveRole}"`,
          `"${log.actorId || ''}"`,
          `"${log.action || ''}"`,
          `"${log.resourceType || ''}"`,
          `"${log.resourceId || ''}"`,
          `"${(log.description || '').replace(/"/g, '""')}"`,
          `"${beforeStatus}"`,
          `"${afterStatus}"`,
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${exportData.length} audit records to CSV.`);
    } catch (error: any) {
      console.error('CSV Export Error:', error);
      toast.error('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getRoleBadgeStyle = (effectiveRole: string) => {
    switch (effectiveRole) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold';
      case 'STAFF':
        return 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      case 'CUSTOMER':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300 font-medium';
    }
  };

  const getActorAvatarInitials = (name?: string | null, email?: string | null, role?: string) => {
    if (name && name.trim().length > 0) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0].slice(0, 2).toUpperCase();
    }
    if (email && email.includes('@')) {
      return email.slice(0, 2).toUpperCase();
    }
    if (role === 'SYSTEM') return 'SYS';
    return role ? role.slice(0, 2).toUpperCase() : '??';
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('CREATED') || action.includes('APPROVED') || action.includes('COMPLETED') || action.includes('VERIFIED')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (action.includes('CANCELLED') || action.includes('REJECTED') || action.includes('FAILED')) {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    if (action.includes('STATUS') || action.includes('ADJUSTED') || action.includes('UPDATED')) {
      return 'bg-amber-50 text-amber-900 border-amber-200';
    }
    return 'bg-blue-50 text-blue-800 border-blue-200';
  };

  // Helper to detect if log has a status change transition
  const getStatusTransition = (log: AuditLogItem) => {
    const beforeStatus = log.before?.status || log.before?.paymentStatus || log.before?.fulfillmentStatus;
    const afterStatus = log.after?.status || log.after?.paymentStatus || log.after?.fulfillmentStatus;
    if (beforeStatus && afterStatus && beforeStatus !== afterStatus) {
      return { from: String(beforeStatus), to: String(afterStatus) };
    }
    return null;
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 text-slate-900 w-full max-w-full">
      {/* Top Banner Header */}
      <div className="bg-[#1A2E4C] text-white p-5 rounded-2xl shadow-sm border border-[#132238] flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/5 rounded-full blur-xl pointer-events-none" />
        <div className="relative">
          <h1 className="text-xl lg:text-2xl font-black text-white flex items-center gap-2.5 tracking-tight">
            <div className="w-9 h-9 rounded-xl bg-white/10 text-[#D2925D] flex items-center justify-center border border-white/10 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <span>Audit Trail & Activity Logs</span>
          </h1>
          <p className="text-xs font-medium text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Record tracking order status updates, fulfillment actions, and store activities by staff team members and administrators.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-all border border-white/15 cursor-pointer disabled:opacity-50"
            title="Download CSV report of audit logs"
          >
            <Download size={14} className={isExporting ? 'animate-bounce' : ''} />
            <span>{isExporting ? 'Exporting...' : 'Download CSV'}</span>
          </button>

          <button
            onClick={() => fetchAuditLogs(page)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#D2925D] hover:bg-[#b87c4b] text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
          {/* Search Query */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff name, email, order #, action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 bg-white text-slate-900 font-medium rounded-xl text-xs focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none cursor-pointer"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter: Only admin@yox.com is ADMIN, others are STAFF */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border border-slate-300 rounded-xl p-2 text-xs bg-white text-slate-900 font-medium focus:ring-2 focus:ring-[#1A2E4C] focus:outline-none cursor-pointer"
            >
              <option value="">All Actors & Roles</option>
              <option value="STAFF">STAFF (Team Members)</option>
              <option value="ADMIN">ADMIN (admin@yox.com)</option>
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="SYSTEM">SYSTEM (Automated)</option>
            </select>
          </div>

          {/* Search Button */}
          <div>
            <button
              type="submit"
              className="w-full bg-[#1A2E4C] text-white font-bold py-2 px-4 rounded-xl hover:bg-[#132238] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Search size={14} />
              <span>Filter Logs</span>
            </button>
          </div>
        </form>

        {/* Date Range Inputs & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-2.5 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-slate-300 bg-white text-slate-900 font-medium rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-600">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-slate-300 bg-white text-slate-900 font-medium rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>
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
              className="text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <X size={13} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Audit Log Table: FITS ON ONE SCREEN WITHOUT HORIZONTAL SLIDER */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs w-full">
        <div className="w-full">
          <table className="w-full text-left text-xs border-collapse table-fixed">
            <thead className="bg-[#1A2E4C] text-white uppercase tracking-wider font-extrabold border-b border-[#132238]">
              <tr>
                <th className="p-3 pl-4 w-[14%]">Time & Date</th>
                <th className="p-3 w-[26%]">Staff / Actor</th>
                <th className="p-3 w-[21%]">Action & State</th>
                <th className="p-3 w-[14%]">Target Resource</th>
                <th className="p-3 w-[18%]">Narrative</th>
                <th className="p-3 pr-4 text-right w-[7%]">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-slate-900">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-600">
                    <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mx-auto mb-2" />
                    <p className="font-bold text-sm text-slate-800">Fetching audit log history...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-600">
                    <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-base text-slate-900">No Audit Logs Found</p>
                    <p className="text-xs text-slate-500 mt-1">Try modifying your search filter or selecting a wider date range.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const transition = getStatusTransition(log);
                  const effectiveRole = getEffectiveRole(log);
                  const isSystem = effectiveRole === 'SYSTEM';
                  const displayEmail = log.actorEmail && log.actorEmail !== 'system@internal' ? log.actorEmail : null;
                  const initials = getActorAvatarInitials(log.actorName, displayEmail, effectiveRole);

                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-amber-50/40`}
                    >
                      {/* Timestamp */}
                      <td className="p-3 pl-4 text-slate-800">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* Staff / Actor Identification */}
                      <td className="p-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Avatar Circle */}
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 border ${
                              isSystem
                                ? 'bg-slate-100 text-slate-700 border-slate-300'
                                : effectiveRole === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : effectiveRole === 'STAFF'
                                ? 'bg-sky-100 text-sky-800 border-sky-300'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {isSystem ? <Cpu size={13} /> : initials}
                          </div>

                          <div className="flex flex-col min-w-0 truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-xs truncate">
                                {log.actorName || (isSystem ? 'Automated Service' : effectiveRole)}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase border ${getRoleBadgeStyle(effectiveRole)}`}>
                                {effectiveRole}
                              </span>
                            </div>

                            {/* Email or Reference (never system@internal) */}
                            <span className="text-[11px] text-slate-500 font-medium truncate" title={displayEmail || ''}>
                              {displayEmail ? displayEmail : isSystem ? 'Automated Job' : (log.actorId ? `#${log.actorId.slice(-6)}` : '')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action & Status Transition */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1 items-start min-w-0">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border truncate max-w-full ${getActionBadgeStyle(log.action)}`}>
                            {log.action}
                          </span>

                          {/* Visual Status Transition (if status changed) */}
                          {transition && (
                            <div className="inline-flex items-center gap-1 text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                              <span className="text-slate-600">{transition.from}</span>
                              <ArrowRight size={9} className="text-amber-600 shrink-0" />
                              <span className="text-emerald-700 font-black">{transition.to}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Target Resource */}
                      <td className="p-3">
                        <div className="flex flex-col min-w-0">
                          <span className="font-black text-slate-900 text-xs">{log.resourceType}</span>
                          <span className="font-mono text-[11px] text-slate-500 font-medium truncate">
                            {log.resourceId ? `#${log.resourceId.slice(-8)}` : '—'}
                          </span>
                        </div>
                      </td>

                      {/* Narrative / Description */}
                      <td className="p-3 text-slate-800 font-medium">
                        <p className="text-xs leading-tight truncate" title={log.description}>
                          {log.description}
                        </p>
                      </td>

                      {/* Inspect Button */}
                      <td className="p-3 pr-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center justify-center p-1.5 bg-slate-100 hover:bg-[#1A2E4C] text-slate-700 hover:text-white font-bold rounded-lg transition-colors border border-slate-200 hover:border-[#1A2E4C] cursor-pointer"
                          title="Inspect Event Snapshot"
                        >
                          <Eye size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/80 font-medium">
          <span>
            Showing <strong className="text-slate-900 font-bold">{logs.length}</strong> of <strong className="text-slate-900 font-bold">{total}</strong> audit logs
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const p = Math.max(1, page - 1);
                setPage(p);
                fetchAuditLogs(p);
              }}
              disabled={page <= 1 || isLoading}
              className="p-1 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-slate-900 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => {
                const p = Math.min(totalPages, page + 1);
                setPage(p);
                fetchAuditLogs(p);
              }}
              disabled={page >= totalPages || isLoading}
              className="p-1 border border-slate-300 rounded-lg bg-white text-slate-800 font-bold hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Audit State Snapshot & Deep Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl border border-slate-800 text-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#D2925D] flex items-center justify-center shrink-0">
                  <FileCode size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    Audit Snapshot — {selectedLog.action}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Event ID: <span className="font-mono text-slate-300">{selectedLog.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Actor Identity Card */}
              {(() => {
                const effectiveRole = getEffectiveRole(selectedLog);
                const displayEmail = selectedLog.actorEmail && selectedLog.actorEmail !== 'system@internal' ? selectedLog.actorEmail : null;
                return (
                  <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                        Staff / Actor Responsible
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getRoleBadgeStyle(effectiveRole)}`}>
                        {effectiveRole}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1A2E4C] border border-[#2d4d7a] text-amber-300 font-bold text-xs flex items-center justify-center">
                        {getActorAvatarInitials(selectedLog.actorName, displayEmail, effectiveRole)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-white">
                          {selectedLog.actorName || (effectiveRole === 'SYSTEM' ? 'Automated Service' : 'Staff Team Member')}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {displayEmail ? <>Email: <span className="text-slate-200">{displayEmail}</span> &bull; </> : null}
                          ID: <span className="font-mono text-slate-300">{selectedLog.actorId}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Resource Target</span>
                  <p className="font-bold text-white text-xs mt-0.5">{selectedLog.resourceType} : {selectedLog.resourceId}</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Timestamp</span>
                  <p className="font-mono font-bold text-slate-200 text-xs mt-0.5">
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Narrative */}
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700">
                <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block mb-1">
                  Event Narrative
                </span>
                <p className="text-xs text-slate-100 font-semibold leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>

              {/* Before vs After State Comparison */}
              {(selectedLog.before || selectedLog.after) && (
                <div className="space-y-2">
                  <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block">
                    State Transition
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/50 space-y-1">
                      <div className="flex items-center justify-between text-rose-400 font-bold text-[11px]">
                        <span>Previous State (Before)</span>
                      </div>
                      <pre className="text-rose-300 text-[11px] font-mono overflow-x-auto max-h-44 p-1">
                        {selectedLog.before ? JSON.stringify(selectedLog.before, null, 2) : '// None'}
                      </pre>
                    </div>

                    {/* After */}
                    <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/50 space-y-1">
                      <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px]">
                        <span>Updated State (After)</span>
                      </div>
                      <pre className="text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-44 p-1">
                        {selectedLog.after ? JSON.stringify(selectedLog.after, null, 2) : '// None'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <span className="text-slate-400 uppercase font-bold text-[10px] tracking-wider block mb-1">
                    Metadata
                  </span>
                  <pre className="bg-slate-950 text-sky-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono border border-slate-800 max-h-36">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(selectedLog, null, 2))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition-colors"
              >
                {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedId ? 'Copied Full JSON' : 'Copy JSON'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-[#D2925D] hover:bg-[#b87c4b] text-slate-950 text-xs font-black rounded-xl shadow-xs cursor-pointer transition-colors"
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
