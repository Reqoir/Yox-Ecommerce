'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerInsightsReport } from '@/api/admin/reports';
import { Users, UserPlus, RefreshCw, Crown } from 'lucide-react';

interface CustomerInsightsTabProps {
  data: CustomerInsightsReport | null;
  loading: boolean;
}

export function CustomerInsightsTab({ data, loading }: CustomerInsightsTabProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, topCustomers } = data;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Customers</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered customer accounts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active In Period</CardTitle>
            <div className="p-2 bg-emerald-500/100/10 rounded-full text-emerald-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">{summary.activeCustomers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Customers with order activity</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">New Registrations</CardTitle>
            <div className="p-2 bg-indigo-500/10 rounded-full text-indigo-600">
              <UserPlus className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">+{summary.newCustomersInPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">New users signed up</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Repeat Customer Rate</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-full text-purple-600">
              <RefreshCw className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{summary.repeatCustomerRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Customers with &gt;1 order</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Top Customers by Total Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Customer Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Avg Order Value</th>
                  <th className="px-4 py-3 text-right">Total Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No customer orders found in this date range.
                    </td>
                  </tr>
                ) : (
                  topCustomers.map((customer, idx) => (
                    <tr key={customer.userId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-xs text-muted-foreground">#{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{customer.fullName}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{customer.email}</td>
                      <td className="px-4 py-3 text-right font-semibold">{customer.totalOrders}</td>
                      <td className="px-4 py-3 text-right">${customer.averageOrderValue.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-500">
                        ${customer.totalSpent.toFixed(2)}
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
