'use client';

import React, { useEffect, useState } from 'react';
import {
  paymentReportsApi,
  FullPaymentReportResponse,
  PaymentReportFilter,
} from '@/lib/api/payment-reports';
import {
  CreditCard,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  Wallet,
  Building2,
  Smartphone,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

export function PaymentReportsTab() {
  const [report, setReport] = useState<FullPaymentReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [preset, setPreset] = useState<'today' | 'yesterday' | 'last7days' | 'last30days' | 'currentMonth' | 'custom'>('last30days');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchReport = async (targetPage = page) => {
    try {
      setLoading(true);
      const params: PaymentReportFilter = {
        preset: preset !== 'custom' ? preset : undefined,
        dateFrom: preset === 'custom' ? dateFrom : undefined,
        dateTo: preset === 'custom' ? dateTo : undefined,
        method: methodFilter || undefined,
        status: statusFilter || undefined,
        page: targetPage,
        limit: 15,
      };

      const res = await paymentReportsApi.getFullReport(params);
      setReport(res);
    } catch (error: any) {
      console.error('Failed to fetch payment report:', error);
      toast.error('Failed to retrieve financial payment reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(1);
  }, [preset, dateFrom, dateTo, methodFilter, statusFilter]);

  const summary = report?.summary;
  const breakdown = report?.breakdown;
  const transactions = report?.transactions;

  const getMethodIcon = (method: string) => {
    switch (method.toUpperCase()) {
      case 'RAZORPAY': return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'UPI': return <Smartphone className="w-4 h-4 text-emerald-500" />;
      case 'CARD': return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'COD': return <Wallet className="w-4 h-4 text-amber-500" />;
      case 'NET_BANKING': return <Building2 className="w-4 h-4 text-indigo-600" />;
      default: return <DollarSign className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Date Filter Preset Pills */}
      <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
              <Filter size={14} className="text-[#1A2E4C]" /> Preset Range:
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'last30days', label: 'Last 30 Days' },
              { id: 'currentMonth', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setPreset(item.id as any);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  preset === item.id
                    ? 'bg-[#1A2E4C] text-white shadow-2xs'
                    : 'bg-muted text-foreground/90 hover:bg-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchReport(page)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-muted hover:bg-gray-200 text-foreground text-xs font-bold rounded-lg transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-border/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">From Date:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-input rounded-lg px-2.5 py-1 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-muted-foreground">To Date:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-input rounded-lg px-2.5 py-1 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Gross Collected */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Gross Collected</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground font-mono">
            ₹{(summary?.grossCollected || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Total collected before refunds</p>
        </div>

        {/* Total Refunded */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500">Total Refunded</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-rose-500 font-mono">
            ₹{(summary?.totalRefunded || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Completed order refunds</p>
        </div>

        {/* Net Collected */}
        <div className="bg-[#1A2E4C] text-white p-4 rounded-2xl shadow-md space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-200">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Net Collected</span>
            <div className="w-8 h-8 rounded-lg bg-card/10 text-[#D2925D] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">
            ₹{(summary?.netCollected || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-blue-200">Gross Collected - Refunded</p>
        </div>

        {/* Successful Transactions */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">Successful</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-emerald-700 font-mono">
            {(summary?.successfulTransactions || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Paid order transactions</p>
        </div>

        {/* Pending Transactions */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-amber-700 font-mono">
            {(summary?.pendingTransactions || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Uncollected / Unpaid COD</p>
        </div>

        {/* Failed Transactions */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">Failed</span>
            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="text-xl font-extrabold text-foreground/90 font-mono">
            {(summary?.failedTransactions || 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">Gateway failure attempts</p>
        </div>
      </div>

      {/* Breakdowns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Breakdown */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
            <CreditCard size={16} className="text-[#1A2E4C]" />
            Payment Method Breakdown
          </h3>

          <div className="space-y-3 text-xs">
            {breakdown?.byMethod && Object.keys(breakdown.byMethod).length > 0 ? (
              Object.entries(breakdown.byMethod).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-card rounded-lg border border-border shadow-2xs">
                      {getMethodIcon(method)}
                    </div>
                    <div>
                      <span className="font-bold text-foreground block">{method}</span>
                      <span className="text-[10px] text-muted-foreground">{data.transactionCount} transactions</span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground font-mono text-sm">
                    ₹{data.amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-6">No method data recorded for selected period.</p>
            )}
          </div>
        </div>

        {/* Payment Status Breakdown */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/50 pb-3">
            <ShieldCheck size={16} className="text-[#1A2E4C]" />
            Payment Status Distribution
          </h3>

          <div className="space-y-3 text-xs">
            {breakdown?.byStatus && Object.keys(breakdown.byStatus).length > 0 ? (
              Object.entries(breakdown.byStatus).map(([status, data]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl border border-border/50">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      status === 'PAID'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : status === 'REFUNDED'
                        ? 'bg-purple-500/10 text-purple-500'
                        : status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}>
                      {status}
                    </span>
                    <span className="text-muted-foreground font-medium">{data.count} Orders</span>
                  </div>
                  <span className="font-bold text-foreground font-mono text-sm">
                    ₹{data.amount.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic text-center py-6">No status data recorded for selected period.</p>
            )}
          </div>
        </div>
      </div>

      {/* Paginated Transactions List Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xs space-y-4">
        <div className="p-4 border-b border-border/50 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign size={16} className="text-[#1A2E4C]" />
            Financial Transactions Audit Trail
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <select
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
              className="border border-input rounded-lg p-1.5 text-xs bg-card"
            >
              <option value="">All Methods</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="COD">COD</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="NET_BANKING">Net Banking</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-input rounded-lg p-1.5 text-xs bg-card"
            >
              <option value="">All Statuses</option>
              <option value="PAID">PAID</option>
              <option value="PENDING">PENDING</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
              <tr>
                <th className="p-4">Order Ref</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Amount</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Transaction ID</th>
                <th className="p-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted-foreground">
                    <Loader2 className="w-7 h-7 text-[#1A2E4C] animate-spin mx-auto mb-2" />
                    <p className="font-medium">Aggregating transaction records...</p>
                  </td>
                </tr>
              ) : transactions?.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-muted-foreground italic">
                    No financial transaction records found for the selected filter.
                  </td>
                </tr>
              ) : (
                transactions?.data.map((tx) => (
                  <tr key={tx.id} className="hover:bg-muted/40 transition-colors">
                    <td className="p-4 font-bold text-foreground">
                      #{tx.orderNumber}
                    </td>

                    <td className="p-4 text-foreground font-medium">
                      {tx.customerName || 'Customer'}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        {getMethodIcon(tx.method)}
                        <span>{tx.method}</span>
                      </div>
                    </td>

                    <td className="p-4 text-right font-mono font-bold text-foreground">
                      ₹{tx.amount.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : tx.status === 'REFUNDED'
                          ? 'bg-purple-500/10 text-purple-500'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-rose-500/10 text-rose-500'
                      }`}>
                        {tx.status}
                      </span>
                    </td>

                    <td className="p-4 font-mono text-[11px] text-muted-foreground truncate max-w-[150px]" title={tx.transactionId || ''}>
                      {tx.transactionId || 'N/A'}
                    </td>

                    <td className="p-4 text-right text-muted-foreground font-mono text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Transactions Pagination */}
        <div className="p-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <span>
            Showing <strong className="text-foreground">{transactions?.data.length || 0}</strong> of <strong className="text-foreground">{transactions?.total || 0}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { const p = Math.max(1, page - 1); setPage(p); fetchReport(p); }}
              disabled={page <= 1 || loading}
              className="p-1.5 border border-input rounded-lg hover:bg-card disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-bold text-foreground">
              Page {page} of {transactions?.totalPages || 1}
            </span>
            <button
              onClick={() => { const p = Math.min(transactions?.totalPages || 1, page + 1); setPage(p); fetchReport(p); }}
              disabled={page >= (transactions?.totalPages || 1) || loading}
              className="p-1.5 border border-input rounded-lg hover:bg-card disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
