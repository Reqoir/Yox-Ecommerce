'use client';

import { useEffect, useState } from 'react';
import { DateRangePicker } from '@/components/admin/reports/DateRangePicker';
import { SalesReportTab } from '@/components/admin/reports/SalesReportTab';
import { ProductPerformanceTab } from '@/components/admin/reports/ProductPerformanceTab';
import { CustomerInsightsTab } from '@/components/admin/reports/CustomerInsightsTab';
import { InventoryReportTab } from '@/components/admin/reports/InventoryReportTab';
import {
  reportsApi,
  SalesReport,
  ProductPerformanceReport,
  CustomerInsightsReport,
  InventoryReport,
} from '@/api/admin/reports';
import { PaymentReportsTab } from '@/components/admin/reports/PaymentReportsTab';
import { subDays, format } from 'date-fns';
import { Download, BarChart3, Package, Users, Warehouse, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

type ActiveTab = 'payments' | 'sales' | 'products' | 'customers' | 'inventory';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('payments');
  const [startDate, setStartDate] = useState<string>(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');

  // Reports State
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [productReport, setProductReport] = useState<ProductPerformanceReport | null>(null);
  const [customerReport, setCustomerReport] = useState<CustomerInsightsReport | null>(null);
  const [inventoryReport, setInventoryReport] = useState<InventoryReport | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const fetchCurrentTabReport = async () => {
    if (activeTab === 'payments') return;
    try {
      setLoading(true);
      const queryParams = { startDate, endDate, groupBy };

      if (activeTab === 'sales') {
        const data = await reportsApi.getSalesReport(queryParams);
        setSalesReport(data);
      } else if (activeTab === 'products') {
        const data = await reportsApi.getProductPerformanceReport(queryParams);
        setProductReport(data);
      } else if (activeTab === 'customers') {
        const data = await reportsApi.getCustomerInsightsReport(queryParams);
        setCustomerReport(data);
      } else if (activeTab === 'inventory') {
        const data = await reportsApi.getInventoryReport();
        setInventoryReport(data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentTabReport();
  }, [activeTab, startDate, endDate, groupBy]);

  const handleExportCSV = async () => {
    if (activeTab === 'payments') {
      toast.info('Use financial transaction filters for payment audit details.');
      return;
    }
    try {
      setExporting(true);
      const queryParams = { startDate, endDate, groupBy };
      const blob = await reportsApi.exportReportCSV(activeTab, queryParams);

      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`${activeTab.toUpperCase()} report exported successfully!`);
    } catch (error) {
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep insights into financial payment collections, store sales, product performance, customer behavior, and inventory health.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={exporting || loading || activeTab === 'payments'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium text-sm rounded-lg shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Date Filter Bar */}
      {activeTab !== 'inventory' && activeTab !== 'payments' && (
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          groupBy={groupBy}
          onDateChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
          }}
          onGroupByChange={(group) => setGroupBy(group)}
        />
      )}

      {/* Navigation Tabs */}
      <div className="border-b">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'payments'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Payment Reports
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'sales'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Sales & Revenue
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'products'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Product Performance
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'customers'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="h-4 w-4" />
            Customer Insights
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all ${
              activeTab === 'inventory'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Warehouse className="h-4 w-4" />
            Inventory & Stock
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      {activeTab === 'payments' && <PaymentReportsTab />}
      {activeTab === 'sales' && <SalesReportTab data={salesReport} loading={loading} />}
      {activeTab === 'products' && <ProductPerformanceTab data={productReport} loading={loading} />}
      {activeTab === 'customers' && <CustomerInsightsTab data={customerReport} loading={loading} />}
      {activeTab === 'inventory' && <InventoryReportTab data={inventoryReport} loading={loading} />}
    </div>
  );
}
