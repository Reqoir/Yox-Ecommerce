'use client';

import React, { useEffect, useState } from 'react';
import { ordersApi, BackendOrder, OrderStatus } from '@/lib/api/orders';
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldAlert,
  MapPin,
  CreditCard,
  User,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; badge: string; icon: any }> = {
  PLACED: { label: 'Placed', badge: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: CheckCircle2 },
  PACKED: { label: 'Packed', badge: 'bg-purple-100 text-purple-800 border-purple-200', icon: Package },
  SHIPPED: { label: 'Shipped', badge: 'bg-amber-100 text-amber-800 border-amber-200', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', badge: 'bg-orange-100 text-orange-800 border-orange-200', icon: Truck },
  DELIVERED: { label: 'Delivered', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', badge: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
  RETURNED: { label: 'Returned', badge: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);

  // Ship Order Modal State
  const [shippingOrder, setShippingOrder] = useState<BackendOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('BlueDart / Delhivery');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchAllOrders = async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getAllOrdersAdmin(1, 100);
      setOrders(res.orders);
      setFilteredOrders(res.orders);
    } catch (error: any) {
      console.error('Failed to fetch admin orders:', error);
      toast.error(error?.response?.data?.message || 'Failed to retrieve orders list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  // Handle local searching & status filter
  useEffect(() => {
    let res = [...orders];
    if (statusFilter !== 'all') {
      res = res.filter((o) => o.orderStatus === statusFilter);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      res = res.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.shippingAddress?.fullName?.toLowerCase().includes(q) ||
          o.userId?.toLowerCase().includes(q)
      );
    }
    setFilteredOrders(res);
  }, [orders, statusFilter, searchQuery]);

  // State Transition Handlers
  const advanceOrder = async (id: string, currentStatus: string) => {
    try {
      setIsUpdating(true);
      let updated: BackendOrder | null = null;
      let msg = '';

      if (currentStatus === 'PLACED') {
        updated = await ordersApi.confirmOrder(id);
        msg = 'Order marked as CONFIRMED';
      } else if (currentStatus === 'CONFIRMED') {
        updated = await ordersApi.packOrder(id);
        msg = 'Order marked as PACKED & Ready for pickup';
      } else if (currentStatus === 'PACKED') {
        // Open shipping modal instead
        const target = orders.find((o) => o.id === id);
        if (target) setShippingOrder(target);
        setIsUpdating(false);
        return;
      } else if (currentStatus === 'SHIPPED') {
        updated = await ordersApi.outForDelivery(id);
        msg = 'Order marked OUT_FOR_DELIVERY';
      } else if (currentStatus === 'OUT_FOR_DELIVERY') {
        updated = await ordersApi.deliverOrder(id);
        msg = 'Order DELIVERED successfully! Payment confirmed & stock finalized.';
      }

      if (updated) {
        toast.success(msg);
        setOrders((prev) => prev.map((o) => (o.id === id ? updated! : o)));
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to progress order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmShipment = async () => {
    if (!shippingOrder) return;
    if (!trackingNumber.trim()) {
      toast.error('Please enter a valid tracking number');
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await ordersApi.shipOrder(shippingOrder.id, trackingNumber, deliveryPartner);
      toast.success(`Order shipped successfully with tracking #${trackingNumber}`);
      setOrders((prev) => prev.map((o) => (o.id === shippingOrder.id ? updated : o)));
      setShippingOrder(null);
      setTrackingNumber('');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to mark order as shipped.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdminCancel = async (id: string) => {
    const reason = window.prompt('Enter reason for administrative cancellation/refund:');
    if (!reason) return;
    try {
      setIsUpdating(true);
      const updated = await ordersApi.cancelOrder(id, reason);
      toast.success('Order cancelled administratively and stock restored to inventory pool.');
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex-1 p-8 bg-background max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Fulfillment & Orders</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage customer logistics, advance state machine funnels, and audit order snapshots.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAllOrders} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Refresh Funnel
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search by Order #, Customer Name, or User ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1 mr-2">
            <Filter size={14} /> Filter:
          </span>
          {['all', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all capitalize ${
                statusFilter === st
                  ? 'bg-primary text-primary-foreground shadow'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {st === 'all' ? 'All Orders' : st.toLowerCase().replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] border rounded-2xl bg-card p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-sm text-muted-foreground">Synchronizing fulfillment queues...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="border rounded-2xl bg-card p-16 text-center max-w-lg mx-auto shadow-2xs">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold">No orders found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            No customer orders matched your search or active filtering criteria.
          </p>
        </div>
      ) : (
        <div className="border rounded-xl bg-card overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                <th className="p-4">Order Number</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Current Status</th>
                <th className="p-4">Date Placed</th>
                <th className="p-4 text-right">State Machine Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                const StatusIcon = cfg.icon;
                const nextActions: Record<string, string> = {
                  PLACED: 'Confirm Order',
                  CONFIRMED: 'Pack Items',
                  PACKED: 'Ship Package',
                  SHIPPED: 'Out For Delivery',
                  OUT_FOR_DELIVERY: 'Mark Delivered',
                };
                const actionLabel = nextActions[order.orderStatus];

                return (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary flex items-center gap-2">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="hover:underline flex items-center gap-1 text-sm"
                      >
                        {order.orderNumber}
                        <Eye size={14} className="text-muted-foreground opacity-70" />
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="font-medium text-foreground text-xs">
                        {order.shippingAddress?.fullName || 'Customer'}
                      </div>
                      <div className="text-[11px] text-muted-foreground">{order.shippingAddress?.phone}</div>
                    </td>

                    <td className="p-4 text-xs">
                      <div className="font-bold">{order.paymentMethod}</div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.paymentStatus === 'REFUNDED'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>

                    <td className="p-4 font-bold text-foreground">₹{order.totalAmount}</td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.badge}`}>
                        <StatusIcon size={12} strokeWidth={2.5} />
                        <span>{cfg.label}</span>
                      </span>
                    </td>

                    <td className="p-4 text-xs text-muted-foreground">
                      {new Date(order.placedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {actionLabel && (
                        <Button
                          size="sm"
                          disabled={isUpdating}
                          onClick={() => advanceOrder(order.id, order.orderStatus)}
                          className="bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold h-8"
                        >
                          <span>{actionLabel}</span>
                          <ArrowRight size={12} className="ml-1" />
                        </Button>
                      )}
                      {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isUpdating}
                          onClick={() => handleAdminCancel(order.id)}
                          className="text-rose-600 hover:bg-rose-50 border-rose-200 h-8 text-xs font-semibold"
                        >
                          Cancel
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Shipment Details Prompt Modal */}
      <Dialog open={!!shippingOrder} onOpenChange={(val) => !val && setShippingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Enter Shipment Tracking Details</span>
            </DialogTitle>
            <DialogDescription>
              Assign logistics partner details and tracking number for Order <strong>{shippingOrder?.orderNumber}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div>
              <Label htmlFor="tracking">Tracking Number *</Label>
              <Input
                id="tracking"
                placeholder="e.g. BLUEDART-9988221"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <Label htmlFor="partner">Logistics Partner</Label>
              <Input
                id="partner"
                value={deliveryPartner}
                onChange={(e) => setDeliveryPartner(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmShipment} disabled={isUpdating} className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold">
              {isUpdating ? 'Confirming...' : 'Confirm & Mark Shipped'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Order Snapshot Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(val) => !val && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center justify-between pr-4">
              <span>Order Snapshot: <span className="font-mono text-primary">{selectedOrder?.orderNumber}</span></span>
            </DialogTitle>
            <DialogDescription>
              Immutable historical records and item pricing frozen at checkout time.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 text-xs py-2">
              {/* Customer & Address Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border">
                <div>
                  <span className="text-muted-foreground font-bold uppercase text-[10px] block mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Shipping Snapshot
                  </span>
                  <p className="font-bold text-foreground text-sm">{selectedOrder.shippingAddress?.fullName}</p>
                  <p className="text-muted-foreground mt-0.5">{selectedOrder.shippingAddress?.streetAddress}</p>
                  {selectedOrder.shippingAddress?.landmark && <p className="text-muted-foreground">Landmark: {selectedOrder.shippingAddress.landmark}</p>}
                  <p className="text-muted-foreground">{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
                  <p className="font-medium text-foreground mt-1.5">📞 {selectedOrder.shippingAddress?.phone}</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground font-bold uppercase text-[10px] block mb-1 flex items-center gap-1">
                      <CreditCard size={12} /> Financial & Payment Info
                    </span>
                    <p className="font-bold text-foreground uppercase">Method: {selectedOrder.paymentMethod}</p>
                    <p className="text-muted-foreground">Payment Status: <span className="font-bold text-primary">{selectedOrder.paymentStatus}</span></p>
                    {selectedOrder.paymentId && <p className="font-mono text-[11px] text-muted-foreground">Tx ID: {selectedOrder.paymentId}</p>}
                  </div>

                  <div>
                    <span className="text-muted-foreground font-bold uppercase text-[10px] block mb-1">Logistics Status</span>
                    <p className="font-bold text-foreground">{selectedOrder.orderStatus}</p>
                    {selectedOrder.trackingNumber && <p className="font-mono text-emerald-700 font-bold">Tracking: {selectedOrder.trackingNumber}</p>}
                    {selectedOrder.cancelledReason && <p className="text-rose-600 mt-1 font-semibold">Cancel Reason: {selectedOrder.cancelledReason}</p>}
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div>
                <h4 className="font-bold text-sm text-foreground mb-2">Purchased Items Snapshot ({selectedOrder.items?.length})</h4>
                <div className="border rounded-xl divide-y overflow-hidden">
                  {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-card flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-foreground text-sm">{item.productName}</p>
                        <p className="text-muted-foreground">
                          SKU: <span className="font-mono text-foreground">{item.sku}</span> | Qty: <strong className="text-foreground">x{item.quantity}</strong> | Price: ₹{item.unitPrice}
                        </p>
                      </div>
                      <div className="text-right font-bold text-sm text-foreground">
                        ₹{item.subtotal}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals Calculation Card */}
              <div className="bg-card border rounded-xl p-4 space-y-1.5 text-right max-w-xs ml-auto text-xs">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal:</span><span className="font-bold">₹{selectedOrder.subtotal}</span></div>
                {selectedOrder.discount > 0 && <div className="flex justify-between text-emerald-600 font-medium"><span>Discount:</span><span>-₹{selectedOrder.discount}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>Shipping Charge:</span><span className="font-bold">{selectedOrder.shippingCharge === 0 ? 'FREE' : `₹${selectedOrder.shippingCharge}`}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Tax (Included):</span><span>₹{selectedOrder.tax}</span></div>
                <div className="border-t pt-2 flex justify-between font-bold text-base text-foreground">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto font-bold bg-[#1A2E4C] hover:bg-[#132238] text-white">
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
