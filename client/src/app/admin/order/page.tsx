'use client';

import React, { useEffect, useState } from 'react';
import { ordersApi, BackendOrder } from '@/lib/api/orders';
import { returnsApi, BackendReturn, InspectionResult } from '@/lib/api/returns';
import { shipmentsApi, BackendShipment } from '@/lib/api/shipments';
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
  MapPin,
  CreditCard,
  RotateCcw,
  RefreshCw,
  Check,
  ImageIcon,
  X,
  MessageSquare,
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
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');

  // Orders State
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);

  // Returns State
  const [returns, setReturns] = useState<BackendReturn[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [previewPhotos, setPreviewPhotos] = useState<string[] | null>(null);

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

  const fetchAllReturns = async () => {
    try {
      setLoadingReturns(true);
      const res = await returnsApi.getAllReturnsAdmin(1, 100);
      setReturns(res.data);
    } catch (error: any) {
      console.error('Failed to fetch admin returns:', error);
    } finally {
      setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchAllReturns();
  }, []);

  // Handle local searching & status filter for orders
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

  // State Transition Handlers for Orders
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
        const target = orders.find((o) => o.id === id);
        if (target) setShippingOrder(target);
        setIsUpdating(false);
        return;
      } else if (currentStatus === 'SHIPPED') {
        updated = await ordersApi.outForDelivery(id);
        msg = 'Order marked OUT_FOR_DELIVERY';
      } else if (currentStatus === 'OUT_FOR_DELIVERY') {
        updated = await ordersApi.deliverOrder(id);
        msg = 'Order DELIVERED successfully!';
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
      
      try {
        await shipmentsApi.updateShipmentStatus(shippingOrder.id, 'SHIPPED', `Tracking: ${trackingNumber}`);
      } catch (e) {
        // non-blocking fallback
      }

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

  // Return Management Handlers
  const [schedulingReturn, setSchedulingReturn] = useState<BackendReturn | null>(null);
  const [pickupDateInput, setPickupDateInput] = useState('');
  const [pickupTimeSlotInput, setPickupTimeSlotInput] = useState('10:00 AM - 02:00 PM');
  const [pickupAgentNameInput, setPickupAgentNameInput] = useState('Ramesh Kumar (YOX Express)');
  const [pickupAgentPhoneInput, setPickupAgentPhoneInput] = useState('+91 98765 43210');

  const [refundingReturn, setRefundingReturn] = useState<BackendReturn | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<number>(0);
  const [refundMethodInput, setRefundMethodInput] = useState('UPI / Original Payment Method');
  const [refundTxnIdInput, setRefundTxnIdInput] = useState('');

  const handleApproveReturn = async (id: string) => {
    try {
      const updated = await returnsApi.approveReturn(id);
      toast.success('Return request approved');
      setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve return request.');
    }
  };

  const handleRejectReturn = async (id: string) => {
    const reason = window.prompt('Enter reason for rejecting return request:');
    if (!reason) return;
    try {
      const updated = await returnsApi.rejectReturn(id, reason);
      toast.success('Return request rejected');
      setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject return request.');
    }
  };

  const handleOpenSchedulePickup = (ret: BackendReturn) => {
    setSchedulingReturn(ret);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setPickupDateInput(tomorrow);
    setPickupTimeSlotInput('10:00 AM - 02:00 PM');
    setPickupAgentNameInput('Ramesh Kumar (YOX Express)');
    setPickupAgentPhoneInput('+91 98765 43210');
  };

  const handleConfirmSchedulePickup = async () => {
    if (!schedulingReturn) return;
    try {
      setIsUpdating(true);
      const updated = await returnsApi.schedulePickup(schedulingReturn.id, {
        pickupDate: pickupDateInput,
        pickupTimeSlot: pickupTimeSlotInput,
        pickupAgentName: pickupAgentNameInput,
        pickupAgentPhone: pickupAgentPhoneInput,
      });
      toast.success('Return pickup scheduled with delivery executive assigned!');
      setReturns((prev) => prev.map((r) => (r.id === schedulingReturn.id ? updated : r)));
      setSchedulingReturn(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to schedule pickup.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReceiveReturn = async (id: string) => {
    try {
      const updated = await returnsApi.receiveReturn(id);
      toast.success('Return marked as received at warehouse');
      setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to mark received.');
    }
  };

  const handleInspectReturn = async (id: string, condition: InspectionResult) => {
    try {
      const updated = await returnsApi.inspectReturn(id, condition);
      toast.success(`Return inspected as ${condition}. Inventory updated!`);
      setReturns((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to record inspection.');
    }
  };

  const handleOpenProcessRefund = (ret: BackendReturn) => {
    setRefundingReturn(ret);
    setRefundAmountInput(ret.refundAmount || 799);
    setRefundMethodInput('UPI / Original Payment Method');
    setRefundTxnIdInput(`REF-${Date.now().toString().substring(5)}`);
  };

  const handleConfirmProcessRefund = async () => {
    if (!refundingReturn) return;
    try {
      setIsUpdating(true);
      const updated = await returnsApi.processRefundDirect(refundingReturn.id, {
        refundAmount: Number(refundAmountInput),
        refundMethod: refundMethodInput,
        refundTransactionId: refundTxnIdInput,
      });
      toast.success(`Refund of ₹${refundAmountInput} processed successfully!`);
      setReturns((prev) => prev.map((r) => (r.id === refundingReturn.id ? updated : r)));
      setRefundingReturn(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to process refund.');
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
            <h1 className="text-3xl font-bold tracking-tight">Fulfillment, Returns & Refunds</h1>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage logistics, advance state machine funnels, audit returns, and issue refunds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => { fetchAllOrders(); fetchAllReturns(); }} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw size={14} className="mr-2" />}
            Refresh Funnel
          </Button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'returns'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <RotateCcw size={14} /> Returns & Refunds ({returns.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
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
                          {order.notes && (
                            <div className="mt-1 text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <MessageSquare size={11} className="text-amber-700 shrink-0" />
                              <span className="truncate max-w-[200px]" title={order.notes}>Note: "{order.notes}"</span>
                            </div>
                          )}
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
        </>
      ) : (
        /* Returns Management Tab */
        <div className="space-y-4">
          {loadingReturns ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-2xl bg-card p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading customer returns...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="border rounded-2xl bg-card p-12 text-center max-w-md mx-auto">
              <RotateCcw className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <h3 className="text-base font-bold">No return requests</h3>
              <p className="text-xs text-muted-foreground mt-1">There are no customer return requests to review.</p>
            </div>
          ) : (
            <div className="border rounded-xl bg-card overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground uppercase font-semibold">
                    <th className="p-4">Return ID</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Quantity & Reason</th>
                    <th className="p-4">Customer Photos</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Inspection</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {returns.map((ret) => (
                    <tr key={ret.id} className="hover:bg-muted/30 text-xs">
                      <td className="p-4 font-mono font-bold">{ret.id.substring(0, 8)}...</td>
                      <td className="p-4 font-mono text-primary font-bold">{ret.orderId}</td>
                      <td className="p-4">
                        <div className="font-bold text-foreground">Qty: {ret.quantity}</div>
                        <div className="text-muted-foreground text-[11px]">Reason: {ret.reason}</div>
                        {ret.customerNote && <div className="italic text-gray-500 text-[10px]">"{ret.customerNote}"</div>}
                      </td>
                      <td className="p-4">
                        {ret.images && ret.images.length > 0 ? (
                          <button
                            onClick={() => setPreviewPhotos(ret.images!)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 rounded border text-xs font-semibold transition-colors"
                          >
                            <ImageIcon size={14} className="text-primary" />
                            <span>{ret.images.length} Photos</span>
                          </button>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">No photos</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {ret.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        {ret.inspectionResult ? (
                          <span className={`font-bold text-[11px] ${ret.inspectionResult === 'RESELLABLE' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {ret.inspectionResult}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Pending</span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1.5">
                        {ret.status === 'REQUESTED' && (
                          <>
                            <Button size="sm" onClick={() => handleApproveReturn(ret.id)} className="bg-emerald-700 hover:bg-emerald-800 text-white h-7 text-xs">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRejectReturn(ret.id)} className="text-rose-600 border-rose-200 h-7 text-xs">
                              Reject
                            </Button>
                          </>
                        )}

                        {(ret.status === 'APPROVED' || ret.status === 'PICKUP_SCHEDULED') && (
                          <div className="inline-flex gap-1.5 items-center">
                            <Button size="sm" onClick={() => handleOpenSchedulePickup(ret)} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs font-semibold">
                              {ret.pickupAgentName ? 'Re-Schedule Pickup' : 'Schedule Pickup & Agent'}
                            </Button>
                            <Button size="sm" onClick={() => handleReceiveReturn(ret.id)} className="bg-indigo-700 hover:bg-indigo-800 text-white h-7 text-xs">
                              Mark Received
                            </Button>
                          </div>
                        )}

                        {ret.status === 'PICKED_UP' && (
                          <Button size="sm" onClick={() => handleReceiveReturn(ret.id)} className="bg-indigo-700 hover:bg-indigo-800 text-white h-7 text-xs font-bold">
                            Mark Received at Warehouse
                          </Button>
                        )}

                        {ret.status === 'RECEIVED' && (
                          <div className="inline-flex gap-1">
                            <Button size="sm" onClick={() => handleInspectReturn(ret.id, 'RESELLABLE')} className="bg-emerald-700 hover:bg-emerald-800 text-white h-7 text-xs">
                              Pass (Resellable)
                            </Button>
                            <Button size="sm" onClick={() => handleInspectReturn(ret.id, 'DAMAGED')} className="bg-amber-700 hover:bg-amber-800 text-white h-7 text-xs">
                              Fail (Damaged)
                            </Button>
                          </div>
                        )}

                        {(ret.status === 'REFUND_PENDING' || ret.status === 'INSPECTED') && (
                          <Button size="sm" onClick={() => handleOpenProcessRefund(ret)} className="bg-purple-700 hover:bg-purple-800 text-white h-7 text-xs font-bold">
                            Issue Refund
                          </Button>
                        )}

                        {ret.status === 'REFUNDED' && (
                          <div className="text-emerald-700 font-bold text-right text-[11px]">
                            <div className="flex items-center justify-end gap-1"><Check size={14} /> Refunded ₹{ret.refundAmount || 0}</div>
                            {ret.refundTransactionId && <div className="text-[10px] text-muted-foreground font-mono">TXN: {ret.refundTransactionId}</div>}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customer Photos Preview Modal */}
      {previewPhotos && (
        <Dialog open={!!previewPhotos} onOpenChange={(val) => !val && setPreviewPhotos(null)}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>Customer Return Photos ({previewPhotos.length})</span>
              </DialogTitle>
              <DialogDescription>
                Attached item photos for physical condition verification.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-3 max-h-[60vh] overflow-y-auto">
              {previewPhotos.map((src, idx) => (
                <div key={idx} className="border rounded-lg overflow-hidden bg-muted/30 aspect-square">
                  <img src={src} alt={`Return item photo ${idx + 1}`} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button onClick={() => setPreviewPhotos(null)}>Close Preview</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Admin Schedule Return Pickup Dialog */}
      <Dialog open={!!schedulingReturn} onOpenChange={(val) => !val && setSchedulingReturn(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Schedule Return Pickup & Assign Agent</span>
            </DialogTitle>
            <DialogDescription>
              Assign pickup day, time slot window, and delivery executive details for Return #{schedulingReturn?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label htmlFor="pickupDate">Pickup Date *</Label>
              <Input
                id="pickupDate"
                type="date"
                value={pickupDateInput}
                onChange={(e) => setPickupDateInput(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timeSlot">Pickup Time Window Slot *</Label>
              <select
                id="timeSlot"
                value={pickupTimeSlotInput}
                onChange={(e) => setPickupTimeSlotInput(e.target.value)}
                className="w-full border rounded-md p-2 bg-background mt-1 font-medium"
              >
                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                <option value="10:00 AM - 02:00 PM">10:00 AM - 02:00 PM (Mid-Day)</option>
                <option value="02:00 PM - 06:00 PM">02:00 PM - 06:00 PM (Afternoon)</option>
                <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="agentName">Delivery Executive Name *</Label>
              <Input
                id="agentName"
                placeholder="e.g. Ramesh Kumar (YOX Logistics)"
                value={pickupAgentNameInput}
                onChange={(e) => setPickupAgentNameInput(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agentPhone">Delivery Executive Phone Number *</Label>
              <Input
                id="agentPhone"
                placeholder="e.g. +91 98765 43210"
                value={pickupAgentPhoneInput}
                onChange={(e) => setPickupAgentPhoneInput(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSchedulingReturn(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSchedulePickup} disabled={isUpdating} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              {isUpdating ? 'Scheduling...' : 'Save & Assign Pickup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Process Refund Dialog */}
      <Dialog open={!!refundingReturn} onOpenChange={(val) => !val && setRefundingReturn(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Issue Customer Refund</span>
            </DialogTitle>
            <DialogDescription>
              Enter final refund amount and reference transaction ID for Return #{refundingReturn?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label htmlFor="refundAmt">Refund Amount (₹) *</Label>
              <Input
                id="refundAmt"
                type="number"
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                className="mt-1 font-bold text-base"
              />
            </div>

            <div>
              <Label htmlFor="refundMethod">Refund Payment Method</Label>
              <select
                id="refundMethod"
                value={refundMethodInput}
                onChange={(e) => setRefundMethodInput(e.target.value)}
                className="w-full border rounded-md p-2 bg-background mt-1 font-medium"
              >
                <option value="UPI / Original Payment Method">UPI / Original Payment Method</option>
                <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                <option value="YOX Store Wallet Credit">YOX Store Wallet Credit</option>
              </select>
            </div>

            <div>
              <Label htmlFor="txnId">Refund Transaction / Reference ID *</Label>
              <Input
                id="txnId"
                placeholder="e.g. TXN-8877665511"
                value={refundTxnIdInput}
                onChange={(e) => setRefundTxnIdInput(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundingReturn(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmProcessRefund} disabled={isUpdating} className="bg-purple-700 hover:bg-purple-800 text-white font-bold">
              {isUpdating ? 'Processing...' : 'Confirm & Complete Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Admin Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(val) => !val && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 border-b pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span>Order Details — #{selectedOrder?.orderNumber}</span>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-bold bg-primary/10 text-primary">
                {selectedOrder?.orderStatus.replace(/_/g, ' ')}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-xs">
              {/* Delivery Instructions / Order Notes Banner */}
              {selectedOrder.notes ? (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl space-y-1 text-amber-950">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900 text-xs">
                    <MessageSquare size={14} className="text-amber-700 shrink-0" />
                    Customer Delivery Instructions:
                  </span>
                  <p className="italic text-amber-900 font-medium">"{selectedOrder.notes}"</p>
                </div>
              ) : (
                <div className="p-3 bg-muted/40 border rounded-xl text-muted-foreground italic">
                  No special delivery instructions specified by customer.
                </div>
              )}

              {/* Shipping Address */}
              <div className="border rounded-xl p-4 bg-muted/20 space-y-1">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider mb-1">Shipping Recipient</h4>
                <p className="font-bold text-sm text-foreground">{selectedOrder.shippingAddress?.fullName}</p>
                <p>{selectedOrder.shippingAddress?.streetAddress}</p>
                <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.postalCode}</p>
                <p className="font-semibold text-primary">Phone: {selectedOrder.shippingAddress?.phone}</p>
              </div>

              {/* Ordered Items Table */}
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/50 border-b font-semibold text-muted-foreground uppercase">
                    <tr>
                      <th className="p-3">Item</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-bold">{item.productName}</td>
                        <td className="p-3 font-mono">{item.sku}</td>
                        <td className="p-3 text-right">₹{item.unitPrice}</td>
                        <td className="p-3 text-right font-bold">x{item.quantity}</td>
                        <td className="p-3 text-right font-bold text-foreground">₹{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Totals */}
              <div className="flex justify-between items-center bg-muted/40 p-4 rounded-xl border">
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="font-bold text-xs uppercase text-primary">{selectedOrder.paymentMethod} • {selectedOrder.paymentStatus}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold">Grand Total</span>
                  <span className="text-base font-bold text-primary">₹{selectedOrder.totalAmount}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedOrder(null)} className="bg-primary text-primary-foreground font-bold">
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
