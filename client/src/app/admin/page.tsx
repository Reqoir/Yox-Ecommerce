'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/useAuthStore';
import { analyticsApi, DashboardStats, SalesChartData } from '@/api/admin/analytics';
import { SalesChart } from '@/components/admin/analytics/sales-chart';
import {
  IndianRupee,
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  BarChart3,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { navItems, hasNavPermission } from '@/components/layout/AdminSidebar';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [salesData, setSalesData] = useState<SalesChartData[]>([]);
  const [chartDays, setChartDays] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const userPermissions = user.permissions || [];
    const canViewDashboard = hasNavPermission(['dashboard:read', 'view_analytics'], user, userPermissions);

    if (!canViewDashboard) {
      const firstAllowed = navItems.find((item) => hasNavPermission(item.permission, user, userPermissions));
      if (firstAllowed && firstAllowed.href !== '/admin') {
        router.replace(firstAllowed.href);
        return;
      }
    }

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const [statsData, chartData] = await Promise.all([
          analyticsApi.getDashboardStats(),
          analyticsApi.getSalesChart(chartDays),
        ]);
        setStats(statsData);
        setSalesData(chartData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, router]);

  const handlePeriodChange = async (days: number) => {
    if (days === chartDays) return;
    try {
      setChartLoading(true);
      setChartDays(days);
      const data = await analyticsApi.getSalesChart(days);
      setSalesData(data);
    } catch (err: any) {
      console.error('Failed to change sales chart period', err);
    } finally {
      setChartLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'PACKED':
      case 'CONFIRMED':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CANCELLED':
      case 'RETURNED':
        return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse pb-14">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-48 bg-muted rounded-md" />
              <div className="h-5 w-24 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-96 bg-muted rounded-md" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-36 bg-muted rounded-xl" />
            <div className="h-9 w-40 bg-muted rounded-xl" />
          </div>
        </div>

        {/* Primary KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/80 relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded-md" />
                <div className="h-8 w-8 bg-muted rounded-xl" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-8 w-32 bg-muted rounded-md" />
                <div className="h-3 w-48 bg-muted rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Status Pipeline Breakdown */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-5 w-64 bg-muted rounded-md mb-2" />
                <div className="h-3 w-80 bg-muted rounded-md" />
              </div>
              <div className="h-4 w-24 bg-muted rounded-md" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="p-3 rounded-xl border border-border/80 bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-16 bg-muted rounded-md" />
                    <div className="h-4 w-4 bg-muted rounded-md" />
                  </div>
                  <div className="h-7 w-12 bg-muted rounded-md" />
                  <div className="h-2 w-20 bg-muted rounded-md" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Velocity Chart */}
        <Card className="border-border shadow-2xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <div className="h-5 w-64 bg-muted rounded-md mb-2" />
              <div className="h-3 w-80 bg-muted rounded-md" />
            </div>
            <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl">
              <div className="h-6 w-16 bg-muted-foreground/20 rounded-lg" />
              <div className="h-6 w-16 bg-muted-foreground/20 rounded-lg" />
              <div className="h-6 w-16 bg-muted-foreground/20 rounded-lg" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[350px] w-full bg-muted/20 rounded-md" />
          </CardContent>
        </Card>

        {/* Recent Orders Live Table */}
        <Card className="border-border shadow-2xs overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div>
              <div className="h-5 w-48 bg-muted rounded-md mb-2" />
              <div className="h-3 w-64 bg-muted rounded-md" />
            </div>
            <div className="h-4 w-20 bg-muted rounded-md" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full h-10 bg-muted/40 border-b border-border" />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-full h-16 border-b border-border/60 flex items-center px-4 gap-4">
                <div className="h-4 w-24 bg-muted rounded-md" />
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-4 w-12 bg-muted rounded-md ml-auto" />
                <div className="h-4 w-20 bg-muted rounded-md ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-destructive/10 p-6 text-destructive border border-destructive/20 my-6">
        <h3 className="text-base font-semibold mb-1">Error Loading Dashboard</h3>
        <p className="text-sm opacity-90">{error}</p>
      </div>
    );
  }

  const orderStatus = stats?.orderStatusCounts || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-14">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Live Operations
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="font-semibold text-foreground">{user?.fullName || 'Administrator'}</span>. Here is the operational health of your store today.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/order"
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-border bg-card text-foreground font-medium text-xs rounded-xl shadow-xs hover:bg-muted transition-colors"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
            Manage Orders
          </Link>

          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#1A2E4C] text-white font-medium text-xs rounded-xl shadow-xs hover:bg-[#1A2E4C]/90 transition-colors"
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#D2925D]" />
            Reports & Insights
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Revenue */}
        <Card className="hover:shadow-md transition-shadow border-border/80 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              ₹{(stats?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>All-time net revenue (active orders)</span>
            </p>
          </CardContent>
        </Card>

        {/* Total Orders */}
        <Card className="hover:shadow-md transition-shadow border-border/80 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {(stats?.totalOrders || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Non-cancelled orders</span>
              {(orderStatus.PLACED || 0) + (orderStatus.CONFIRMED || 0) > 0 && (
                <span className="text-amber-600 font-semibold">
                  {(orderStatus.PLACED || 0) + (orderStatus.CONFIRMED || 0)} pending fulfillment
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="hover:shadow-md transition-shadow border-border/80 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Customer Base
            </CardTitle>
            <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {(stats?.totalCustomers || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <UserCheck className="h-3 w-3 text-purple-500" />
              <span>
                {stats?.newCustomersThisMonth !== undefined && stats.newCustomersThisMonth > 0
                  ? `+${stats.newCustomersThisMonth} new this month`
                  : 'Active registered accounts'}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Catalog Items */}
        <Card className="hover:shadow-md transition-shadow border-border/80 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#D2925D]" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Catalog
            </CardTitle>
            <div className="p-2.5 bg-[#D2925D]/10 text-[#D2925D] rounded-xl group-hover:scale-110 transition-transform">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-extrabold text-foreground tracking-tight">
              {(stats?.totalProducts || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-muted-foreground">Live items available in store</p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Pipeline Breakdown */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#1A2E4C]" />
                Order Pipeline & Fulfillment Status
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current order lifecycle stages requiring merchant attention
              </p>
            </div>
            <Link
              href="/admin/order"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Order Management <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Placed</span>
                <Clock className="h-3 w-3 text-amber-500" />
              </div>
              <div className="text-xl font-bold text-foreground">{orderStatus.PLACED || 0}</div>
              <span className="text-[10px] text-muted-foreground">Awaiting confirm</span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Confirmed</span>
                <CheckCircle2 className="h-3 w-3 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-foreground">{orderStatus.CONFIRMED || 0}</div>
              <span className="text-[10px] text-muted-foreground">Ready to pack</span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Packed</span>
                <PackageCheck className="h-3 w-3 text-indigo-500" />
              </div>
              <div className="text-xl font-bold text-foreground">{orderStatus.PACKED || 0}</div>
              <span className="text-[10px] text-muted-foreground">Ready to dispatch</span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Shipped</span>
                <Truck className="h-3 w-3 text-cyan-500" />
              </div>
              <div className="text-xl font-bold text-foreground">
                {(orderStatus.SHIPPED || 0) + (orderStatus.OUT_FOR_DELIVERY || 0)}
              </div>
              <span className="text-[10px] text-muted-foreground">In transit to buyer</span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Delivered</span>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
              </div>
              <div className="text-xl font-bold text-emerald-600">{orderStatus.DELIVERED || 0}</div>
              <span className="text-[10px] text-muted-foreground">Successfully fulfilled</span>
            </div>

            <div className="p-3 rounded-xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Cancelled</span>
                <XCircle className="h-3 w-3 text-rose-500" />
              </div>
              <div className="text-xl font-bold text-rose-500">{orderStatus.CANCELLED || 0}</div>
              <span className="text-[10px] text-muted-foreground">Terminated orders</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Velocity Chart */}
      <Card className="border-border shadow-2xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#1A2E4C]" />
              Sales Velocity & Revenue Trend
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily gross sales revenue generated across the last {chartDays} days.
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border border-border/60">
            {[
              { label: '7 Days', days: 7 },
              { label: '30 Days', days: 30 },
              { label: '90 Days', days: 90 },
            ].map((p) => (
              <button
                key={p.days}
                onClick={() => handlePeriodChange(p.days)}
                disabled={chartLoading}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  chartDays === p.days
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {chartLoading ? (
            <div className="h-[350px] flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <SalesChart data={salesData} />
          )}
        </CardContent>
      </Card>

      {/* Recent Orders Live Table */}
      <Card className="border-border shadow-2xs overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#1A2E4C]" />
              Recent Store Orders
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Latest incoming transactions and customer purchases
            </p>
          </div>
          <Link
            href="/admin/order"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All Orders <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase tracking-wider font-bold">
                <tr>
                  <th className="p-4">Order Ref</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4 text-center">Items</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4 text-right">Date</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {(!stats?.recentOrders || stats.recentOrders.length === 0) ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground italic">
                      No recent orders found.
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                      <td className="p-4 font-bold text-foreground">
                        #{order.orderNumber}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">{order.customerName}</div>
                        {order.email && <div className="text-[10px] text-muted-foreground">{order.email}</div>}
                      </td>
                      <td className="p-4 text-center font-medium">
                        {order.itemCount}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-foreground">
                        ₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : order.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-500/10 text-purple-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                      <td className="p-4 text-right text-muted-foreground font-mono text-[11px]">
                        {new Date(order.placedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <Link
                          href={`/admin/order`}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
