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
import { paymentReportsApi } from '@/lib/api/payment-reports';
import { subDays, format } from 'date-fns';
import { Download, BarChart3, Package, Users, Warehouse, CreditCard, Printer, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { exportReportToPDF } from '@/lib/report-pdf';

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
    if (activeTab === 'payments') {
      setLoading(false);
      return;
    }
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
      window.URL.revokeObjectURL(url);

      toast.success(`${activeTab.toUpperCase()} report exported successfully!`);
    } catch (error) {
      toast.error('Failed to export CSV report.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      const periodStr = activeTab === 'inventory' ? 'Current Snapshot' : `${startDate} to ${endDate}`;

      if (activeTab === 'sales') {
        if (!salesReport) {
          toast.error('Sales report data is still loading.');
          return;
        }
        exportReportToPDF({
          title: 'Sales & Revenue Performance Report',
          subtitle: `Aggregated by ${groupBy.toUpperCase()}`,
          dateRange: periodStr,
          kpis: [
            { label: 'Gross Revenue', value: `₹${salesReport.summary.grossRevenue.toLocaleString('en-IN')}` },
            { label: 'Net Revenue', value: `₹${salesReport.summary.netRevenue.toLocaleString('en-IN')}` },
            { label: 'Total Orders', value: salesReport.summary.totalOrders.toLocaleString('en-IN') },
            { label: 'Avg Order Value', value: `₹${salesReport.summary.averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
            { label: 'Total Tax', value: `₹${salesReport.summary.totalTax.toLocaleString('en-IN')}` },
            { label: 'Discounts', value: `₹${salesReport.summary.totalDiscounts.toLocaleString('en-IN')}` },
          ],
          sections: [
            {
              heading: 'Sales Over Time',
              headers: ['Period', 'Orders Count', 'Revenue (₹)', 'Average Order Value (₹)'],
              rows: salesReport.timeSeries.map((t) => [
                t.period,
                t.ordersCount,
                `₹${t.revenue.toLocaleString('en-IN')}`,
                `₹${t.averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              ]),
            },
            {
              heading: 'Order Status Breakdown',
              headers: ['Order Status', 'Orders Count', 'Total Revenue (₹)'],
              rows: salesReport.statusBreakdown.map((s) => [
                s.orderStatus,
                s.count,
                `₹${s.totalRevenue.toLocaleString('en-IN')}`,
              ]),
            },
            {
              heading: 'Payment Method Breakdown',
              headers: ['Payment Method', 'Transactions', 'Total Collected (₹)'],
              rows: salesReport.paymentMethodBreakdown.map((p) => [
                p.paymentMethod,
                p.count,
                `₹${p.totalRevenue.toLocaleString('en-IN')}`,
              ]),
            },
          ],
        });
      } else if (activeTab === 'products') {
        if (!productReport) {
          toast.error('Product report data is still loading.');
          return;
        }
        exportReportToPDF({
          title: 'Product & Category Performance Report',
          dateRange: periodStr,
          kpis: [
            { label: 'Total Variants', value: productReport.inventoryHealth.totalVariants.toLocaleString() },
            { label: 'Low Stock', value: productReport.inventoryHealth.lowStockVariants.toLocaleString() },
            { label: 'Out of Stock', value: productReport.inventoryHealth.outOfStockVariants.toLocaleString() },
          ],
          sections: [
            {
              heading: 'Top Products by Revenue',
              headers: ['Product Name', 'SKU', 'Units Sold', 'Total Revenue (₹)'],
              rows: productReport.topProductsByRevenue.map((p) => [
                p.productName,
                p.sku,
                p.unitsSold,
                `₹${p.totalRevenue.toLocaleString('en-IN')}`,
              ]),
            },
            {
              heading: 'Category Sales Distribution',
              headers: ['Category Name', 'Total Products', 'Units Sold', 'Total Revenue (₹)'],
              rows: productReport.categoryBreakdown.map((c) => [
                c.categoryName,
                c.totalProducts,
                c.totalUnitsSold,
                `₹${c.totalRevenue.toLocaleString('en-IN')}`,
              ]),
            },
          ],
        });
      } else if (activeTab === 'customers') {
        if (!customerReport) {
          toast.error('Customer insights data is still loading.');
          return;
        }
        exportReportToPDF({
          title: 'Customer Insights & Lifetime Value Report',
          dateRange: periodStr,
          kpis: [
            { label: 'Total Registered', value: customerReport.summary.totalCustomers.toLocaleString('en-IN') },
            { label: 'Active in Period', value: customerReport.summary.activeCustomers.toLocaleString('en-IN') },
            { label: 'New in Period', value: customerReport.summary.newCustomersInPeriod.toLocaleString('en-IN') },
            { label: 'Repeat Rate', value: `${customerReport.summary.repeatCustomerRate.toFixed(1)}%` },
          ],
          sections: [
            {
              heading: 'Top Customers by Spend',
              headers: ['Customer Name', 'Email', 'Orders Count', 'Total Spent (₹)', 'Avg Order Value (₹)'],
              rows: customerReport.topCustomers.map((c) => [
                c.fullName,
                c.email,
                c.totalOrders,
                `₹${c.totalSpent.toLocaleString('en-IN')}`,
                `₹${c.averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
              ]),
            },
          ],
        });
      } else if (activeTab === 'inventory') {
        if (!inventoryReport) {
          toast.error('Inventory report data is still loading.');
          return;
        }
        exportReportToPDF({
          title: 'Inventory Health & Valuation Report',
          dateRange: periodStr,
          kpis: [
            { label: 'Inventory Value', value: `₹${inventoryReport.summary.totalInventoryValuation.toLocaleString('en-IN')}` },
            { label: 'Total Units', value: inventoryReport.summary.totalStockQuantity.toLocaleString('en-IN') },
            { label: 'Low Stock', value: inventoryReport.summary.lowStockCount.toLocaleString('en-IN') },
            { label: 'Out of Stock', value: inventoryReport.summary.outOfStockCount.toLocaleString('en-IN') },
          ],
          sections: [
            {
              heading: 'Low Stock Reorder Items',
              headers: ['Product', 'Variant', 'SKU', 'Current Stock', 'Threshold', 'Price (₹)'],
              rows: inventoryReport.lowStockItems.map((i) => [
                i.productName,
                i.title,
                i.sku,
                i.currentStock,
                i.lowStockThreshold,
                `₹${i.price.toLocaleString('en-IN')}`,
              ]),
            },
            {
              heading: 'Out of Stock Items',
              headers: ['Product', 'Variant', 'SKU', 'Price (₹)'],
              rows: inventoryReport.outOfStockItems.map((i) => [
                i.productName,
                i.title,
                i.sku,
                `₹${i.price.toLocaleString('en-IN')}`,
              ]),
            },
          ],
        });
      } else if (activeTab === 'payments') {
        try {
          setExporting(true);
          const paymentData = await paymentReportsApi.getFullReport({ limit: 100 });
          const s = paymentData?.summary;
          const b = paymentData?.breakdown;
          const txns = paymentData?.transactions?.data || [];

          exportReportToPDF({
            title: 'Payment Transactions & Financial Audit Report',
            subtitle: 'Aggregated Financial Overview & Audit Trail',
            dateRange: `${startDate} to ${endDate}`,
            kpis: [
              { label: 'Gross Collected', value: `₹${(s?.grossCollected || 0).toLocaleString('en-IN')}` },
              { label: 'Total Refunded', value: `₹${(s?.totalRefunded || 0).toLocaleString('en-IN')}` },
              { label: 'Net Collected', value: `₹${(s?.netCollected || 0).toLocaleString('en-IN')}` },
              { label: 'Successful', value: `${(s?.successfulTransactions || 0).toLocaleString('en-IN')}` },
              { label: 'Pending', value: `${(s?.pendingTransactions || 0).toLocaleString('en-IN')}` },
              { label: 'Failed', value: `${(s?.failedTransactions || 0).toLocaleString('en-IN')}` },
            ],
            sections: [
              {
                heading: 'Payment Method Breakdown',
                headers: ['Payment Method', 'Transactions Count', 'Amount Collected (₹)'],
                rows: Object.entries(b?.byMethod || {}).map(([method, data]) => [
                  method,
                  data.transactionCount,
                  `₹${data.amount.toLocaleString('en-IN')}`,
                ]),
              },
              {
                heading: 'Payment Status Distribution',
                headers: ['Payment Status', 'Orders Count', 'Total Amount (₹)'],
                rows: Object.entries(b?.byStatus || {}).map(([status, data]) => [
                  status,
                  data.count,
                  `₹${data.amount.toLocaleString('en-IN')}`,
                ]),
              },
              {
                heading: 'Financial Transactions Audit Trail',
                headers: ['Order Number', 'Customer Name', 'Payment Method', 'Amount (₹)', 'Status', 'Transaction ID', 'Date'],
                rows: txns.map((tx) => [
                  `#${tx.orderNumber}`,
                  tx.customerName || 'Customer',
                  tx.method,
                  `₹${tx.amount.toLocaleString('en-IN')}`,
                  tx.status,
                  tx.transactionId || 'N/A',
                  new Date(tx.createdAt).toLocaleDateString('en-IN'),
                ]),
              },
            ],
          });
        } catch (err) {
          toast.error('Failed to load payment transactions for PDF report.');
        } finally {
          setExporting(false);
        }
      }
    } catch (err: any) {
      toast.error('Failed to generate PDF report.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Deep insights into financial payment collections, store sales, product performance, customer behavior, and inventory health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-border bg-card text-foreground font-medium text-xs rounded-xl shadow-xs hover:bg-muted transition-colors disabled:opacity-50"
            title="Download CSV Spreadsheet"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            {exporting ? 'Downloading...' : 'Download CSV'}
          </button>

          <button
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A2E4C] text-white font-medium text-xs rounded-xl shadow-xs hover:bg-[#1A2E4C]/90 transition-colors disabled:opacity-50"
            title="Download PDF Document"
          >
            <Download className="h-3.5 w-3.5 text-[#D2925D]" />
            {exporting ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
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
        <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
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
            className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-sm transition-all whitespace-nowrap shrink-0 ${
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
