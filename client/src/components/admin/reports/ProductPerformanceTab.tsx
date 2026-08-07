'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductPerformanceReport } from '@/api/admin/reports';
import { Package, Award, AlertTriangle, XCircle, FolderTree } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';

interface ProductPerformanceTabProps {
  data: ProductPerformanceReport | null;
  loading: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];

export function ProductPerformanceTab({ data, loading }: ProductPerformanceTabProps) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl"></div>
          ))}
        </div>
        <div className="h-72 bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (!data) return null;

  const { topProductsByRevenue, categoryBreakdown, inventoryHealth } = data;

  return (
    <div className="space-y-6">
      {/* Inventory Health Banner */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Active Variants</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryHealth.totalVariants}</div>
            <p className="text-xs text-muted-foreground mt-1">Total active SKUs in catalog</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{inventoryHealth.lowStockVariants}</div>
            <p className="text-xs text-muted-foreground mt-1">Stock ≤ alert threshold</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between pb-1">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Out of Stock</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{inventoryHealth.outOfStockVariants}</div>
            <p className="text-xs text-muted-foreground mt-1">Zero stock remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Category Sales Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              No category sales data for this timeframe.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip formatter={(val: any) => [`$${Number(val || 0).toFixed(2)}`, 'Revenue']} />
                  <Bar dataKey="totalRevenue" radius={[6, 6, 0, 0]}>
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Top Performing Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Units Sold</th>
                  <th className="px-4 py-3 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {topProductsByRevenue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No product sales recorded in this timeframe.
                    </td>
                  </tr>
                ) : (
                  topProductsByRevenue.map((product, idx) => (
                    <tr key={product.productId} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-xs text-muted-foreground">#{idx + 1}</td>
                      <td className="px-4 py-3 font-medium">{product.productName}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{product.sku}</td>
                      <td className="px-4 py-3 text-right font-semibold">{product.unitsSold}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        ${product.totalRevenue.toFixed(2)}
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
