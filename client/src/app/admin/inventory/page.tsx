'use client';

import { useState } from 'react';
import {
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Sliders,
  ChevronRight,
  Search,
  Loader2,
  X,
  ClipboardList,
  Warehouse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useInventory, useStockLogs } from '@/hooks/admin/useInventory';
import { InventoryItem, StockLog, inventoryApi } from '@/api/admin/inventory';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

type LogType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVE' | 'RELEASE';
type Filter = 'all' | 'low-stock';

const LOG_TYPE_CONFIG: Record<LogType, { label: string; color: string }> = {
  IN: { label: 'Stock In', color: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30' },
  OUT: { label: 'Stock Out', color: 'bg-rose-500/15 text-rose-600 border-rose-500/30' },
  ADJUSTMENT: { label: 'Adjustment', color: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  RESERVE: { label: 'Reserved', color: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  RELEASE: { label: 'Released', color: 'bg-purple-500/15 text-purple-600 border-purple-500/30' },
};

export default function AdminInventoryPage() {
  const { inventory, lowStockItems, lowStockTotal, isLoading, updateInventory, adjustStock, isUpdating, isAdjusting } =
    useInventory();

  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  // Edit modal
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    warehouseLocation: '',
    lowStockThreshold: 10,
  });

  // Adjust stock modal
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    type: 'IN' as 'IN' | 'OUT' | 'ADJUSTMENT',
    amount: 0,
    reason: '',
    reference: '',
  });

  // Logs modal
  const [logsItem, setLogsItem] = useState<InventoryItem | null>(null);
  const { data: logsData, isLoading: isLoadingLogs } = useStockLogs(logsItem?.id ?? null);
  const logs = (logsData?.data ?? []) as StockLog[];

  const displayedItems = (filter === 'low-stock' ? lowStockItems : inventory).filter((item) => {
    const query = search.toLowerCase();
    return (
      item.variantId.toLowerCase().includes(query) ||
      (item.productName && item.productName.toLowerCase().includes(query)) ||
      (item.sku && item.sku.toLowerCase().includes(query)) ||
      (item.variantTitle && item.variantTitle.toLowerCase().includes(query)) ||
      (item.color && item.color.toLowerCase().includes(query)) ||
      (item.size && item.size.toLowerCase().includes(query))
    );
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(displayedItems.length / itemsPerPage);
  const paginatedItems = displayedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open edit modal
  const handleOpenEdit = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm({
      warehouseLocation: item.warehouseLocation ?? '',
      lowStockThreshold: item.lowStockThreshold,
    });
  };

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateInventory(
      {
        id: editItem.id,
        data: {
          warehouseLocation: editForm.warehouseLocation || null,
          lowStockThreshold: editForm.lowStockThreshold,
        },
      },
      { onSuccess: () => setEditItem(null) }
    );
  };

  // Open adjust modal
  const handleOpenAdjust = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustForm({ type: 'IN', amount: 0, reason: '', reference: '' });
  };

  const handleAdjust = () => {
    if (!adjustItem) return;
    if (adjustForm.amount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }
    adjustStock(
      {
        id: adjustItem.id,
        data: {
          type: adjustForm.type,
          amount: adjustForm.amount,
          reason: adjustForm.reason || undefined,
          reference: adjustForm.reference || undefined,
        },
      },
      { onSuccess: () => setAdjustItem(null) }
    );
  };

  // Summary cards
  const totalItems = inventory.length;
  const totalAvailable = inventory.reduce((sum, i) => sum + i.availableStock, 0);
  const totalReserved = inventory.reduce((sum, i) => sum + i.reservedStock, 0);
  const lowStockCount = lowStockTotal;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor stock levels, adjust quantities, and track all movements
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total SKUs',
            value: totalItems,
            icon: Package,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
          },
          {
            label: 'Available Units',
            value: totalAvailable.toLocaleString(),
            icon: TrendingUp,
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
          },
          {
            label: 'Reserved Units',
            value: totalReserved.toLocaleString(),
            icon: TrendingDown,
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Low Stock Alerts',
            value: lowStockCount,
            icon: AlertTriangle,
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl border bg-card p-5 flex items-center gap-4 shadow-sm"
          >
            <div className={`${card.bg} p-3 rounded-lg`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="text-2xl font-bold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'low-stock'] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'low-stock' ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                  Low Stock ({lowStockCount})
                </>
              ) : (
                'All Inventory'
              )}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search product, SKU, variant..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="min-w-[220px]">Product & Variant</TableHead>
              <TableHead>SKU / Details</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-center">Reserved</TableHead>
              <TableHead className="text-center">Damaged</TableHead>
              <TableHead className="text-center">Threshold</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : displayedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16 text-muted-foreground">
                  {filter === 'low-stock' ? '✅ No low-stock items!' : 'No inventory records found.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item) => (
                <TableRow
                  key={item.id}
                  className={item.isLowStock ? 'bg-rose-500/5 hover:bg-rose-500/10' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted border overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName || 'Product'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium text-sm text-foreground truncate max-w-[200px]" title={item.productName || undefined}>
                          {item.productName || 'Unnamed Product'}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono truncate max-w-[160px]" title={item.variantId}>
                          ID: {item.variantId.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {item.sku ? (
                        <span className="font-mono text-xs font-semibold text-foreground">{item.sku}</span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground">No SKU</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {[item.variantTitle, item.color, item.size].filter(Boolean).join(' • ') || 'Default Variant'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-semibold">{item.availableStock}</TableCell>
                  <TableCell className="text-center text-blue-600">{item.reservedStock}</TableCell>
                  <TableCell className="text-center text-amber-600">{item.damagedStock}</TableCell>
                  <TableCell className="text-center text-muted-foreground">{item.lowStockThreshold}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.warehouseLocation ? (
                      <span className="flex items-center gap-1">
                        <Warehouse className="h-3.5 w-3.5" />
                        {item.warehouseLocation}
                      </span>
                    ) : (
                      <span className="text-xs italic">Not set</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.isLowStock ? (
                      <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 border">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30 border">
                        In Stock
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setLogsItem(item)}
                        title="View stock logs"
                      >
                        <ClipboardList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenAdjust(item)}
                        title="Adjust stock"
                      >
                        <Sliders className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        title="Edit settings"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={displayedItems.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* ── Edit Inventory Dialog ───────────────────────────────────────────────── */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Settings</DialogTitle>
            <DialogDescription>
              Update warehouse location and low-stock alert threshold.
            </DialogDescription>
            {editItem && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/60 text-xs border flex items-center gap-2">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">{editItem.productName || 'Product'}</span>
                  {editItem.sku && <span className="ml-2 font-mono text-muted-foreground">({editItem.sku})</span>}
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="warehouse">Warehouse Location</Label>
              <Input
                id="warehouse"
                placeholder="e.g. Warehouse A, Bay 3"
                value={editForm.warehouseLocation}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, warehouseLocation: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold">
                Low Stock Threshold
                <span className="ml-1 text-xs text-muted-foreground">
                  (alert fires when stock ≤ this)
                </span>
              </Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                value={editForm.lowStockThreshold}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, lowStockThreshold: parseInt(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={isUpdating}>
                {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Adjust Stock Dialog ─────────────────────────────────────────────────── */}
      <Dialog open={!!adjustItem} onOpenChange={(open) => !open && setAdjustItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Manually correct the stock level for this inventory item. All adjustments are logged.
            </DialogDescription>
            {adjustItem && (
              <div className="mt-2 p-2.5 rounded-lg bg-muted/60 text-xs border flex items-center gap-2">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <span className="font-semibold">{adjustItem.productName || 'Product'}</span>
                  {adjustItem.sku && <span className="ml-2 font-mono text-muted-foreground">({adjustItem.sku})</span>}
                </div>
              </div>
            )}
          </DialogHeader>
          {adjustItem && (
            <div className="space-y-4 pt-2">
              {/* Current stock info */}
              <div className="rounded-lg border bg-muted/30 p-3 flex gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Available</p>
                  <p className="font-bold text-lg">{adjustItem.availableStock}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reserved</p>
                  <p className="font-bold text-lg text-blue-600">{adjustItem.reservedStock}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Damaged</p>
                  <p className="font-bold text-lg text-amber-600">{adjustItem.damagedStock}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-type">Adjustment Type</Label>
                <Select
                  value={adjustForm.type}
                  onValueChange={(v) => setAdjustForm((f) => ({ ...f, type: v as 'IN' | 'OUT' | 'ADJUSTMENT' }))}
                >
                  <SelectTrigger id="adj-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Stock In (received stock)
                      </span>
                    </SelectItem>
                    <SelectItem value="OUT">
                      <span className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-rose-500" />
                        Stock Out (sold / damaged)
                      </span>
                    </SelectItem>
                    <SelectItem value="ADJUSTMENT">
                      <span className="flex items-center gap-2">
                        <Sliders className="h-4 w-4 text-amber-500" />
                        Manual Adjustment
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-amount">Amount</Label>
                <Input
                  id="adj-amount"
                  type="number"
                  min={1}
                  value={adjustForm.amount || ''}
                  onChange={(e) =>
                    setAdjustForm((f) => ({ ...f, amount: parseInt(e.target.value) || 0 }))
                  }
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-reason">Reason (optional)</Label>
                <Input
                  id="adj-reason"
                  placeholder="e.g. Received from supplier, stock count correction"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, reason: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adj-ref">Reference (optional)</Label>
                <Input
                  id="adj-ref"
                  placeholder="e.g. PO-12345, Order ID"
                  value={adjustForm.reference}
                  onChange={(e) => setAdjustForm((f) => ({ ...f, reference: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setAdjustItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleAdjust} disabled={isAdjusting}>
                  {isAdjusting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Stock Logs Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={!!logsItem} onOpenChange={(open) => !open && setLogsItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Stock Audit Log
            </DialogTitle>
            <DialogDescription className="text-xs">
              {logsItem?.productName || 'Product'} {logsItem?.sku ? `(${logsItem.sku})` : ''} • ID: {logsItem?.variantId}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {isLoadingLogs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No logs yet for this item.</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => {
                  const config = LOG_TYPE_CONFIG[log.type];
                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                    >
                      <Badge className={`${config.color} border text-xs shrink-0`}>
                        {config.label}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">
                            {log.previousStock} → {log.newStock}
                            <span className="ml-2 text-muted-foreground text-xs">
                              ({log.type === 'IN' || log.type === 'RELEASE' ? '+' : '-'}
                              {log.amount})
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(log.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        {log.reason && (
                          <p className="text-xs text-muted-foreground mt-0.5">{log.reason}</p>
                        )}
                        {log.reference && (
                          <p className="text-xs font-mono text-muted-foreground">
                            Ref: {log.reference}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
