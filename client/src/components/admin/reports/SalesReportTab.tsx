'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesReport } from '@/api/admin/reports';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { DollarSign, ShoppingCart, TrendingUp, CreditCard, Percent, Truck } from 'lucide-react';

interface SalesReportTabProps {
  data: SalesReport | null;
  loading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];

export function SalesReportTab({ data, loading }: SalesReportTabProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="h-80 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, timeSeries, statusBreakdown, paymentMethodBreakdown } = data;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Net Revenue</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              ${summary.netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Excludes cancelled orders</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalOrders.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Placed in this period</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Avg Order Value</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-full text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Average per transaction</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Gross Discounts</CardTitle>
            <div className="p-2 bg-rose-500/10 rounded-full text-rose-600">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary.totalDiscounts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total coupons & discounts</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revenue Trend & Growth</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSeries.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No sales data found for the selected period.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `$${val}`} />
                  <Tooltip
                    formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Breakdown Grids */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusBreakdown.map((item) => (
                <div key={item.orderStatus} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                  <span className="text-sm font-medium">{item.orderStatus}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count} orders</div>
                    <div className="text-xs text-muted-foreground">${item.totalRevenue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Payment Methods Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentMethodBreakdown.map((pm, idx) => (
                <div key={pm.paymentMethod} className="flex items-center justify-between p-2.5 bg-muted/40 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                    <span className="text-sm font-medium">{pm.paymentMethod}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">${pm.totalRevenue.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{pm.count} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
