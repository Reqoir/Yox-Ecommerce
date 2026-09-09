'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InventoryReport } from '@/api/admin/reports';
import { Warehouse, IndianRupee, AlertTriangle, XCircle, PackageCheck } from 'lucide-react';

interface InventoryReportTabProps {
  data: InventoryReport | null;
  loading: boolean;
}

export function InventoryReportTab({ data, loading }: InventoryReportTabProps) {
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Valuation Metrics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="h-3 w-24 bg-muted rounded-md" />
                <div className="h-8 w-8 bg-muted rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted rounded-md mb-2" />
                <div className="h-3 w-36 bg-muted rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Low Stock Warning Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-48 bg-muted rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="w-full h-10 bg-muted/40 border-b border-border" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-12 border-b border-border/60 flex items-center px-4 gap-4">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-3 w-20 bg-muted rounded-md" />
                <div className="h-3 w-16 bg-muted rounded-md" />
                <div className="h-4 w-12 bg-muted rounded-md ml-auto" />
                <div className="h-3 w-16 bg-muted rounded-md ml-auto" />
                <div className="h-4 w-16 bg-muted rounded-md ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Out of Stock Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-5 w-48 bg-muted rounded-md" />
          </CardHeader>
          <CardContent>
            <div className="w-full h-10 bg-muted/40 border-b border-border" />
            {[1, 2].map((i) => (
              <div key={i} className="w-full h-12 border-b border-border/60 flex items-center px-4 gap-4">
                <div className="h-4 w-32 bg-muted rounded-md" />
                <div className="h-3 w-20 bg-muted rounded-md" />
                <div className="h-3 w-16 bg-muted rounded-md" />
                <div className="h-4 w-8 bg-muted rounded-md ml-auto" />
                <div className="h-4 w-16 bg-muted rounded-md ml-auto" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { summary, lowStockItems, outOfStockItems } = data;

  return (
    <div className="space-y-6">
      {/* Valuation Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Inventory Value</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-500">
              <IndianRupee className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              ₹{summary.totalInventoryValuation.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total retail value of active stock</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Total Stock Quantity</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-600">
              <PackageCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalStockQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total units across all variants</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Low Stock Alerts</CardTitle>
            <div className="p-2 bg-amber-500/100/10 rounded-full text-amber-500">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{summary.lowStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Variants below reorder threshold</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">Out of Stock</CardTitle>
            <div className="p-2 bg-rose-500/100/10 rounded-full text-rose-500">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">{summary.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Variants with 0 available units</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Warning Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Low Stock Reorder List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Variant Title</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Current Stock</th>
                  <th className="px-4 py-3 text-right">Threshold</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                      No items currently flagged as low stock.
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => (
                    <tr key={item.variantId} className="hover:bg-amber-500/10/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-xs">{item.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-500">{item.currentStock}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{item.lowStockThreshold}</td>
                      <td className="px-4 py-3 text-right">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <XCircle className="h-4 w-4 text-rose-500" />
            Out of Stock Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b">
                <tr>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Variant Title</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {outOfStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                      No out of stock items.
                    </td>
                  </tr>
                ) : (
                  outOfStockItems.map((item) => (
                    <tr key={item.variantId} className="hover:bg-rose-500/10/50 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-xs">{item.title}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                      <td className="px-4 py-3 text-right font-bold text-rose-500">0</td>
                      <td className="px-4 py-3 text-right">₹{item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
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
