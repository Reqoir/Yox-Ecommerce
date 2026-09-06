'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ordersApi, BackendOrder, OrderStatus, PaymentStatus } from '@/lib/api/orders';
import { returnsApi, BackendReturn, InspectionResult } from '@/lib/api/returns';
import { shipmentsApi } from '@/lib/api/shipments';
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
  User,
  Mail,
  Phone,
  Copy,
  Calendar,
  DollarSign,
  TrendingUp,
  Box,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Navigation,
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
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

// Status styling configuration
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; badge: string; border: string; bg: string; text: string; icon: any; description: string }
> = {
  PLACED: {
    label: 'Placed',
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    icon: Clock,
    description: 'Order received from customer and awaiting initial verification.',
  },
  CONFIRMED: {
    label: 'Confirmed',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: ShieldCheck,
    description: 'Order verified and approved for inventory picking.',
  },
  PACKED: {
    label: 'Packed',
    badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900',
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    icon: Package,
    description: 'Items boxed, labeled, and staged for courier pickup.',
  },
  SHIPPED: {
    label: 'Shipped',
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    icon: Truck,
    description: 'Package handed over to logistics partner with tracking code.',
  },
  OUT_FOR_DELIVERY: {
    label: 'Out for Delivery',
    badge: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900',
    border: 'border-orange-500',
    bg: 'bg-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
    icon: Navigation,
    description: 'Delivery executive is en route to customer destination address.',
  },
  DELIVERED: {
    label: 'Delivered',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    description: 'Order successfully handed over and received by the customer.',
  },
  CANCELLED: {
    label: 'Cancelled',
    badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900',
    border: 'border-rose-500',
    bg: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    icon: XCircle,
    description: 'Order voided and reserved inventory pool restored.',
  },
  RETURNED: {
    label: 'Returned',
    badge: 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
    border: 'border-zinc-500',
    bg: 'bg-zinc-500',
    text: 'text-zinc-600 dark:text-zinc-400',
    icon: RotateCcw,
    description: 'Items returned by customer and received at warehouse.',
  },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; badge: string }> = {
  PAID: { label: 'Paid', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900' },
  PENDING: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900' },
  FAILED: { label: 'Failed', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900' },
  REFUND_PROCESSING: { label: 'Refund Processing', badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900' },
  REFUNDED: { label: 'Refunded', badge: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900' },
};

const FULFILLMENT_STEPS: OrderStatus[] = [
  'PLACED',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];

function AdminOrdersContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const orderIdParam = searchParams.get('orderId');
  const returnIdParam = searchParams.get('returnId');

  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>(() =>
    tabParam === 'returns' ? 'returns' : 'orders'
  );

  useEffect(() => {
    if (tabParam === 'returns') {
      setActiveTab('returns');
    } else if (tabParam === 'orders' || (!tabParam && orderIdParam)) {
      setActiveTab('orders');
    }
  }, [tabParam, orderIdParam]);

  // Orders State
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
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

  // Orders Pagination
  const [orderPage, setOrderPage] = useState(1);
  const [orderItemsPerPage, setOrderItemsPerPage] = useState(10);

  // Returns Pagination
  const [returnPage, setReturnPage] = useState(1);
  const [returnItemsPerPage, setReturnItemsPerPage] = useState(10);

  const fetchAllOrders = async (quiet = false) => {
    try {
      if (!quiet) setIsLoading(true);
      const res = await ordersApi.getAllOrdersAdmin(1, 150);
      setOrders(res.orders || []);
    } catch (error: any) {
      if (!quiet) {
        console.error('Failed to fetch admin orders:', error);
        toast.error(error?.response?.data?.message || 'Failed to retrieve orders list.');
      }
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  const fetchAllReturns = async (quiet = false) => {
    try {
      if (!quiet) setLoadingReturns(true);
      const res = await returnsApi.getAllReturnsAdmin(1, 100);
      setReturns(res.data || []);
    } catch (error: any) {
      if (!quiet) console.error('Failed to fetch admin returns:', error);
    } finally {
      if (!quiet) setLoadingReturns(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
    fetchAllReturns();
  }, []);

  // Update selected order in-sync if orders list is updated
  useEffect(() => {
    if (selectedOrder) {
      const refreshed = orders.find((o) => o.id === selectedOrder.id || o.orderNumber === selectedOrder.orderNumber);
      if (refreshed) setSelectedOrder(refreshed);
    }
  }, [orders]);

  const openSpecificOrder = async (key: string) => {
    if (!key) return;
    const cleanKey = key.replace(/^#/, '').trim();
    const cleanLower = cleanKey.toLowerCase();

    setActiveTab('orders');

    // 1. Show existing version immediately if present for fast responsiveness
    const matched = orders.find(
      (o) =>
        o.id.toLowerCase() === cleanLower ||
        o.orderNumber?.toLowerCase() === cleanLower ||
        o.orderNumber?.replace(/^#/, '').toLowerCase() === cleanLower
    );

    if (matched) {
      setSelectedOrder(matched);
    }

    // 2. ALWAYS fetch fresh order state from server to reflect latest status (e.g. CANCELLED, RETURNED, CONFIRMED)
    try {
      const fetched = await ordersApi.getOrderById(cleanKey);
      if (fetched && (fetched.id || fetched.orderNumber)) {
        setSelectedOrder(fetched);
        setOrders((prev) => {
          const index = prev.findIndex(
            (o) => o.id === fetched.id || o.orderNumber === fetched.orderNumber
          );
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = fetched;
            return updated;
          }
          return [fetched, ...prev];
        });
      }
    } catch (err) {
      console.error('Failed to fetch specific order for modal:', err);
    }
  };

  const handleCloseOrderModal = () => {
    setSelectedOrder(null);
    if (typeof window !== 'undefined' && window.location.search.includes('orderId')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('orderId');
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
    }
  };

  // Auto-open specific order modal when orderIdParam is present
  useEffect(() => {
    if (orderIdParam && activeTab !== 'returns') {
      openSpecificOrder(orderIdParam);
    }
  }, [orderIdParam, orders.length]);

  // Listen for direct open event from notification dropdown
  useEffect(() => {
    const handleOpenOrderEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ orderId?: string }>;
      const orderId = customEvent.detail?.orderId;
      if (orderId) {
        openSpecificOrder(orderId);
      }
    };

    window.addEventListener('admin:open-order', handleOpenOrderEvent);
    return () => {
      window.removeEventListener('admin:open-order', handleOpenOrderEvent);
    };
  }, [orders]);

  // Listen for real-time order / return updates from SSE & notifications
  useEffect(() => {
    const handleOrderUpdateEvent = async (e: Event) => {
      const customEvent = e as CustomEvent<{ type?: string; orderId?: string }>;
      const { orderId } = customEvent.detail || {};

      // Refetch orders & returns lists quietly in real time
      await fetchAllOrders(true);
      await fetchAllReturns(true);

      // If this specific order is currently open in the dialog, refresh it immediately
      if (orderId) {
        const cleanId = String(orderId).replace(/^#/, '');
        try {
          const fresh = await ordersApi.getOrderById(cleanId);
          if (fresh) {
            setSelectedOrder((current) => {
              if (
                current &&
                (current.id === fresh.id || current.orderNumber === fresh.orderNumber)
              ) {
                return fresh;
              }
              return current;
            });
          }
        } catch {}
      }
    };

    window.addEventListener('admin:order-updated', handleOrderUpdateEvent);
    return () => {
      window.removeEventListener('admin:order-updated', handleOrderUpdateEvent);
    };
  }, []);

  // Auto-refresh orders and returns quietly every 10s so orders page stays live
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllOrders(true);
      fetchAllReturns(true);
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-paginate and scroll to return when returnIdParam or orderIdParam is present on returns tab
  useEffect(() => {
    if (activeTab === 'returns' && returns.length > 0 && (returnIdParam || orderIdParam)) {
      const cleanReturnId = returnIdParam?.toLowerCase();
      const cleanOrderId = orderIdParam?.replace(/^#/, '').toLowerCase();

      const idx = returns.findIndex((r) => {
        const matchReturn = cleanReturnId && (r.id.toLowerCase() === cleanReturnId || r.id.toLowerCase().startsWith(cleanReturnId));
        const matchOrder = cleanOrderId && (r.orderId.toLowerCase() === cleanOrderId || r.orderId.toLowerCase().includes(cleanOrderId));
        return matchReturn || matchOrder;
      });

      if (idx !== -1) {
        const targetPage = Math.floor(idx / returnItemsPerPage) + 1;
        setReturnPage(targetPage);
        const targetReturn = returns[idx];
        setTimeout(() => {
          const el = document.getElementById(`return-row-${targetReturn.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }
    }
  }, [activeTab, returnIdParam, orderIdParam, returns, returnItemsPerPage]);

  // Summary Metrics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingProcessing = orders.filter((o) =>
      ['PLACED', 'CONFIRMED', 'PACKED'].includes(o.orderStatus)
    ).length;
    const inTransit = orders.filter((o) =>
      ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(o.orderStatus)
    ).length;
    const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
    const totalRevenue = orders
      .filter((o) => o.orderStatus !== 'CANCELLED')
      .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      totalOrders,
      pendingProcessing,
      inTransit,
      delivered,
      totalRevenue,
    };
  }, [orders]);

  // Order Counts by Status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.orderStatus] = (counts[o.orderStatus] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    let list = [...orders];

    if (statusFilter !== 'all') {
      list = list.filter((o) => o.orderStatus === statusFilter);
    }

    if (paymentFilter !== 'all') {
      list = list.filter((o) => o.paymentStatus === paymentFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((o) => {
        const orderNum = o.orderNumber?.toLowerCase() || '';
        const custName = (o.customer?.fullName || o.shippingAddress?.fullName || '').toLowerCase();
        const custEmail = (o.customer?.email || '').toLowerCase();
        const custPhone = (o.customer?.phone || o.shippingAddress?.phone || '').toLowerCase();
        const city = (o.shippingAddress?.city || '').toLowerCase();
        const notes = (o.notes || '').toLowerCase();
        const items = o.items?.map((it) => it.productName.toLowerCase()).join(' ') || '';

        return (
          orderNum.includes(q) ||
          custName.includes(q) ||
          custEmail.includes(q) ||
          custPhone.includes(q) ||
          city.includes(q) ||
          notes.includes(q) ||
          items.includes(q)
        );
      });
    }

    return list;
  }, [orders, statusFilter, paymentFilter, searchQuery]);

  // Pagination for Orders
  const totalOrderPages = Math.max(1, Math.ceil(filteredOrders.length / orderItemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderItemsPerPage;
    return filteredOrders.slice(start, start + orderItemsPerPage);
  }, [filteredOrders, orderPage, orderItemsPerPage]);

  // Pagination for Returns
  const totalReturnPages = Math.max(1, Math.ceil(returns.length / returnItemsPerPage));
  const paginatedReturns = useMemo(() => {
    const start = (returnPage - 1) * returnItemsPerPage;
    return returns.slice(start, start + returnItemsPerPage);
  }, [returns, returnPage, returnItemsPerPage]);

  // Advance Order status along state machine
  const advanceOrder = async (id: string, currentStatus: OrderStatus) => {
    if (currentStatus === 'DELIVERED') {
      toast.error('This order is already delivered and cannot be advanced further.');
      return;
    }
    try {
      setIsUpdating(true);
      let updated: BackendOrder | null = null;
      let msg = '';

      if (currentStatus === 'PLACED') {
        updated = await ordersApi.confirmOrder(id);
        msg = 'Order confirmed and ready for packaging';
      } else if (currentStatus === 'CONFIRMED') {
        updated = await ordersApi.packOrder(id);
        msg = 'Order packed and ready for carrier dispatch';
      } else if (currentStatus === 'PACKED') {
        const target = orders.find((o) => o.id === id);
        if (target) {
          setShippingOrder(target);
          setTrackingNumber(`TRK-${Date.now().toString().slice(-7)}`);
        }
        setIsUpdating(false);
        return;
      } else if (currentStatus === 'SHIPPED') {
        updated = await ordersApi.outForDelivery(id);
        msg = 'Order marked Out for Delivery';
      } else if (currentStatus === 'OUT_FOR_DELIVERY') {
        updated = await ordersApi.deliverOrder(id);
        msg = 'Order marked as Delivered successfully';
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

  // Direct Status Update for Admin
  const handleDirectStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const target = orders.find((o) => o.id === orderId);
    if (target?.orderStatus === 'DELIVERED') {
      toast.error('Delivered orders are final and cannot be modified.');
      return;
    }
    if (target?.orderStatus === 'CANCELLED') {
      toast.error('Cancelled orders cannot be modified.');
      return;
    }
    if (newStatus === 'CANCELLED') {
      handleAdminCancel(orderId);
      return;
    }
    if (newStatus === 'SHIPPED') {
      if (target) {
        setShippingOrder(target);
        setTrackingNumber(`TRK-${Date.now().toString().slice(-7)}`);
      }
      return;
    }

    try {
      setIsUpdating(true);
      const updated = await ordersApi.updateStatusAdmin(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus}`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm Shipment
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

  // Admin Cancel
  const handleAdminCancel = async (id: string) => {
    const reason = window.prompt('Enter reason for administrative cancellation / refund:');
    if (!reason) return;
    try {
      setIsUpdating(true);
      const updated = await ordersApi.cancelOrder(id, reason);
      toast.success('Order cancelled and reserved inventory restored.');
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Returns Handlers
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

  // Helper for next stage label
  const getNextStageInfo = (status: OrderStatus) => {
    switch (status) {
      case 'PLACED':
        return { label: 'Confirm Order', nextStatus: 'CONFIRMED' as OrderStatus, color: 'bg-indigo-600 hover:bg-indigo-700' };
      case 'CONFIRMED':
        return { label: 'Pack Items', nextStatus: 'PACKED' as OrderStatus, color: 'bg-purple-600 hover:bg-purple-700' };
      case 'PACKED':
        return { label: 'Ship Package', nextStatus: 'SHIPPED' as OrderStatus, color: 'bg-amber-600 hover:bg-amber-700' };
      case 'SHIPPED':
        return { label: 'Out For Delivery', nextStatus: 'OUT_FOR_DELIVERY' as OrderStatus, color: 'bg-orange-600 hover:bg-orange-700' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Mark Delivered', nextStatus: 'DELIVERED' as OrderStatus, color: 'bg-emerald-600 hover:bg-emerald-700' };
      default:
        return null;
    }
  };

  // Stepper helper
  const getStepState = (step: OrderStatus, currentStatus: OrderStatus) => {
    if (currentStatus === 'CANCELLED' || currentStatus === 'RETURNED') {
      return 'inactive';
    }
    const stepIdx = FULFILLMENT_STEPS.indexOf(step);
    const currIdx = FULFILLMENT_STEPS.indexOf(currentStatus);

    if (stepIdx < currIdx) return 'completed';
    if (stepIdx === currIdx) return 'current';
    return 'upcoming';
  };

  return (
    <div className="flex-1 p-6 md:p-8 bg-background max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Order Management</h1>
              <p className="text-muted-foreground text-xs md:text-sm mt-0.5">
                Review and fulfill customer orders, advance delivery pipelines, audit returns, and issue refunds.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAllOrders();
              fetchAllReturns();
              toast.info('Orders & returns refreshed');
            }}
            disabled={isLoading || loadingReturns}
            className="h-9 font-medium"
          >
            {isLoading || loadingReturns ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw size={14} className="mr-2" />
            )}
            Refresh Data
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black tracking-tight">{stats.totalOrders}</span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">All customer orders</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processing</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Box size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.pendingProcessing}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">Placed, Confirmed & Packed</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Transit</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {stats.inTransit}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">Shipped & Out for Delivery</span>
          </div>
        </div>

        <div className="bg-card border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivered</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.delivered}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">Successfully completed</span>
          </div>
        </div>

        <div className="col-span-2 md:col-span-1 bg-card border rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gross Revenue</span>
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-foreground tracking-tight">
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-muted-foreground block mt-0.5">Active fulfillment total</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b pb-0">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag size={16} />
            <span>Orders</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'returns'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <RotateCcw size={16} />
            <span>Returns & Refunds</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                activeTab === 'returns' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}
            >
              {returns.length}
            </span>
          </button>
        </div>
      </div>

      {/* ORDERS TAB CONTENT */}
      {activeTab === 'orders' ? (
        <div className="space-y-6">
          {/* Filter, Search & Status Pills Controls */}
          <div className="bg-card border rounded-2xl p-4 shadow-xs space-y-4">
            {/* Top Bar: Search & Payment Filter */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search order #, customer name, email, phone, city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setOrderPage(1);
                  }}
                  className="pl-9 h-10 bg-background text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                  <CreditCard size={14} /> Payment:
                </span>
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setOrderPage(1);
                  }}
                  className="h-10 text-xs font-semibold border rounded-lg px-3 bg-background text-foreground"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="PAID">Paid Only</option>
                  <option value="PENDING">Pending Only</option>
                  <option value="REFUNDED">Refunded Only</option>
                  <option value="FAILED">Failed Only</option>
                </select>

                {(statusFilter !== 'all' || paymentFilter !== 'all' || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter('all');
                      setPaymentFilter('all');
                      setSearchQuery('');
                      setOrderPage(1);
                    }}
                    className="h-10 text-xs text-muted-foreground hover:text-foreground font-medium"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>

            {/* Bottom Bar: Status Badges Carousel / Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setOrderPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>All Orders</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10 dark:bg-white/15">
                  {statusCounts.all || 0}
                </span>
              </button>

              {(
                [
                  'PLACED',
                  'CONFIRMED',
                  'PACKED',
                  'SHIPPED',
                  'OUT_FOR_DELIVERY',
                  'DELIVERED',
                  'CANCELLED',
                ] as OrderStatus[]
              ).map((st) => {
                const cfg = STATUS_CONFIG[st];
                const count = statusCounts[st] || 0;
                const isSelected = statusFilter === st;

                return (
                  <button
                    key={st}
                    onClick={() => {
                      setStatusFilter(st);
                      setOrderPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>{cfg.label}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected ? 'bg-black/15 dark:bg-white/20' : 'bg-background text-muted-foreground border'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders Table */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] border rounded-2xl bg-card p-12 shadow-xs">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Loading orders records...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="border rounded-2xl bg-card p-16 text-center max-w-lg mx-auto shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                <ShoppingBag size={28} />
              </div>
              <h3 className="text-lg font-bold">No orders found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No customer orders match your active filter or search criteria.'
                  : 'There are currently no customer orders in the system.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-4 font-semibold text-xs"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Order Card Rows (No horizontal sliding/scrolling) */}
              <div className="space-y-3">
                {paginatedOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
                  const StatusIcon = cfg.icon;
                  const nextStage = getNextStageInfo(order.orderStatus);
                  const payCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;

                  const customerName =
                    order.customer?.fullName || order.shippingAddress?.fullName || 'Customer';
                  const customerContact =
                    order.customer?.email || order.shippingAddress?.phone || order.userId;
                  const totalItemCount =
                    order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0;

                  const initials =
                    customerName
                      .trim()
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'CU';

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="bg-card border rounded-2xl p-5 hover:border-primary/50 hover:shadow-xs transition-all cursor-pointer group space-y-4"
                    >
                      {/* Top Header Bar: Order Number, Status, Tracking, Date & Action Buttons (Always strictly inside the box) */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/50">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                            {order.orderNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cfg.badge}`}
                          >
                            <StatusIcon size={12} strokeWidth={2.5} />
                            <span>{cfg.label}</span>
                          </span>
                          {order.trackingNumber && (
                            <span className="text-[11px] font-mono text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Truck size={11} />
                              <span>{order.trackingNumber}</span>
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            • Placed on {new Date(order.placedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Top-Right Action Buttons */}
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {order.orderStatus === 'DELIVERED' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl">
                              <CheckCircle2 size={14} /> Completed
                            </span>
                          ) : order.orderStatus === 'CANCELLED' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-1.5 rounded-xl">
                              <XCircle size={14} /> Cancelled
                            </span>
                          ) : order.orderStatus === 'RETURNED' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-xl">
                              <RotateCcw size={14} /> Returned
                            </span>
                          ) : nextStage ? (
                            <Button
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => advanceOrder(order.id, order.orderStatus)}
                              className={`text-white text-xs font-bold h-8 px-3.5 rounded-xl shadow-2xs ${nextStage.color}`}
                            >
                              <span>{nextStage.label}</span>
                              <ArrowRight size={13} className="ml-1" />
                            </Button>
                          ) : null}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 px-3 text-xs font-semibold rounded-xl hover:bg-muted"
                          >
                            <Eye size={13} className="mr-1.5" />
                            <span>Details</span>
                          </Button>
                        </div>
                      </div>

                      {/* Main Card Content: Customer Info, Products Preview, and Financials */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        {/* 1. Customer Details (4 cols) */}
                        <div className="md:col-span-4 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-foreground truncate">{customerName}</div>
                            <div className="text-xs text-muted-foreground truncate">{customerContact}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin size={11} className="shrink-0 text-muted-foreground/70" />
                              <span className="truncate">
                                {order.shippingAddress?.city || 'City'}, {order.shippingAddress?.state || 'State'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 2. Products Snapshot (5 cols) */}
                        <div className="md:col-span-5 flex items-center gap-3 border-t md:border-t-0 md:border-l md:pl-4 pt-3 md:pt-0">
                          <div className="w-12 h-12 rounded-xl border bg-muted/40 overflow-hidden shrink-0 shadow-2xs flex items-center justify-center">
                            {order.items?.[0]?.imageUrl ? (
                              <img
                                src={order.items[0].imageUrl}
                                alt={order.items[0].productName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon size={18} className="text-muted-foreground/40" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-xs font-bold text-foreground truncate"
                              title={order.items?.[0]?.productName}
                            >
                              {order.items?.[0]?.productName || 'Catalog Product'}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[10px]">
                              {order.items?.[0]?.size && (
                                <span className="bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground">
                                  Size: {order.items[0].size}
                                </span>
                              )}
                              {order.items?.[0]?.color && (
                                <span className="bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground truncate max-w-[100px]">
                                  {order.items[0].color}
                                </span>
                              )}
                              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 3. Financial Summary & Payment (3 cols, aligned right) */}
                        <div className="md:col-span-3 border-t md:border-t-0 md:border-l md:pl-4 pt-3 md:pt-0 flex md:flex-col justify-between items-center md:items-end">
                          <div className="text-left md:text-right">
                            <span className="text-[11px] text-muted-foreground block md:mb-0.5">Total Amount</span>
                            <div className="font-black text-lg text-foreground tracking-tight">
                              ₹{order.totalAmount?.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                            <span className="text-muted-foreground font-semibold uppercase">
                              {order.paymentMethod || 'COD'}
                            </span>
                            <span>•</span>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${payCfg.badge}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  order.paymentStatus === 'PAID'
                                    ? 'bg-emerald-500'
                                    : order.paymentStatus === 'REFUNDED'
                                    ? 'bg-purple-500'
                                    : order.paymentStatus === 'FAILED'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {payCfg.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Table Pagination */}
              <Pagination
                currentPage={orderPage}
                totalPages={totalOrderPages}
                totalItems={filteredOrders.length}
                itemsPerPage={orderItemsPerPage}
                onPageChange={setOrderPage}
                onItemsPerPageChange={setOrderItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </div>
      ) : (
        /* RETURNS & REFUNDS TAB CONTENT */
        <div className="space-y-4">
          {loadingReturns ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-2xl bg-card p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading customer returns...</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="border rounded-2xl bg-card p-12 text-center max-w-md mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                <RotateCcw size={22} />
              </div>
              <h3 className="text-base font-bold">No return requests</h3>
              <p className="text-xs text-muted-foreground mt-1">There are no active customer return requests to review.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                        <th className="p-4">Return ID</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Quantity & Reason</th>
                        <th className="p-4">Photos</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Inspection</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {paginatedReturns.map((ret) => {
                        const isHighlighted =
                          (returnIdParam && (ret.id.toLowerCase() === returnIdParam.toLowerCase() || ret.id.toLowerCase().startsWith(returnIdParam.toLowerCase()))) ||
                          (orderIdParam && (ret.orderId.toLowerCase() === orderIdParam.replace(/^#/, '').toLowerCase() || ret.orderId.toLowerCase().includes(orderIdParam.replace(/^#/, '').toLowerCase())));

                        return (
                          <tr
                            key={ret.id}
                            id={`return-row-${ret.id}`}
                            className={`transition-all text-xs ${
                              isHighlighted
                                ? 'bg-amber-500/15 border-l-4 border-l-amber-500 font-medium'
                                : 'hover:bg-muted/30'
                            }`}
                          >
                            <td className="p-4 font-mono font-bold text-foreground">
                              {ret.id.substring(0, 8)}...
                              {isHighlighted && (
                                <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white shadow-xs animate-pulse">
                                  Selected
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-mono text-primary font-bold">
                              {ret.orderId}
                            </td>
                          <td className="p-4">
                            <div className="font-bold text-foreground">Qty: {ret.quantity}</div>
                            <div className="text-muted-foreground text-[11px]">Reason: {ret.reason}</div>
                            {ret.customerNote && (
                              <div className="italic text-gray-500 text-[10px] mt-0.5">"{ret.customerNote}"</div>
                            )}
                            {ret.courierTrackingNumber && (
                              <div className="mt-1.5 p-1.5 bg-blue-50/80 border border-blue-200 rounded text-[10px] text-blue-900 space-y-0.5">
                                <div className="font-bold flex items-center gap-1 text-blue-800">
                                  <Truck size={11} />
                                  <span>{ret.courierName || 'Courier'}: {ret.courierTrackingNumber}</span>
                                </div>
                              </div>
                            )}
                            {ret.refundBankDetails && (
                              <div className="mt-1 p-1.5 bg-amber-50/80 border border-amber-200 rounded text-[10px] text-amber-950">
                                <span className="font-bold block text-amber-900">Refund A/C:</span>
                                <span>{ret.refundBankDetails.accountHolderName} • A/C: ••••{ret.refundBankDetails.accountNumber?.slice(-4)} ({ret.refundBankDetails.ifscCode})</span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {ret.images && ret.images.length > 0 ? (
                              <button
                                onClick={() => setPreviewPhotos(ret.images!)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-muted hover:bg-muted/80 rounded-lg border text-xs font-semibold transition-colors"
                              >
                                <ImageIcon size={13} className="text-primary" />
                                <span>{ret.images.length} Photos</span>
                              </button>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">No photos</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              ret.status === 'REFUNDED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : ret.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : ret.status === 'RETURN_SHIPPED'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : ret.status === 'APPROVED'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {ret.status === 'APPROVED'
                                ? 'Awaiting Shipment'
                                : ret.status === 'RETURN_SHIPPED'
                                ? 'Package Shipped'
                                : ret.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-4">
                            {ret.inspectionResult ? (
                              <span
                                className={`font-bold text-[11px] ${
                                  ret.inspectionResult === 'RESELLABLE'
                                    ? 'text-emerald-700'
                                    : 'text-rose-600'
                                }`}
                              >
                                {ret.inspectionResult}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic text-[11px]">Pending</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-1.5">
                            {ret.status === 'REQUESTED' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveReturn(ret.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectReturn(ret.id)}
                                  className="text-rose-600 border-rose-200 hover:bg-rose-50 h-7 text-xs font-semibold"
                                >
                                  Reject
                                </Button>
                              </>
                            )}

                            {ret.status === 'APPROVED' && (
                              <span className="text-[11px] text-muted-foreground italic font-medium">
                                Awaiting customer shipment
                              </span>
                            )}

                            {(ret.status === 'RETURN_SHIPPED' || ret.status === 'PICKUP_SCHEDULED' || ret.status === 'PICKED_UP') && (
                              <Button
                                size="sm"
                                onClick={() => handleReceiveReturn(ret.id)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs font-bold"
                              >
                                Mark Package Received
                              </Button>
                            )}

                            {ret.status === 'RECEIVED' && (
                              <div className="inline-flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleInspectReturn(ret.id, 'RESELLABLE')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs font-semibold"
                                >
                                  Pass (Resellable)
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleInspectReturn(ret.id, 'DAMAGED')}
                                  className="bg-rose-600 hover:bg-rose-700 text-white h-7 text-xs font-semibold"
                                >
                                  Fail (Damaged)
                                </Button>
                              </div>
                            )}

                            {(ret.status === 'REFUND_PENDING' || ret.status === 'INSPECTED') && (
                              <Button
                                size="sm"
                                onClick={() => handleOpenProcessRefund(ret)}
                                className="bg-purple-600 hover:bg-purple-700 text-white h-7 text-xs font-bold"
                              >
                                Issue Refund
                              </Button>
                            )}

                            {ret.status === 'REFUNDED' && (
                              <div className="text-emerald-700 font-bold text-right text-[11px]">
                                <div className="flex items-center justify-end gap-1">
                                  <Check size={14} /> Refunded ₹{ret.refundAmount || 0}
                                </div>
                                {ret.refundTransactionId && (
                                  <div className="text-[10px] text-muted-foreground font-mono">
                                    TXN: {ret.refundTransactionId}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>

              <Pagination
                currentPage={returnPage}
                totalPages={totalReturnPages}
                totalItems={returns.length}
                itemsPerPage={returnItemsPerPage}
                onPageChange={setReturnPage}
                onItemsPerPageChange={setReturnItemsPerPage}
                itemsPerPageOptions={[10, 25, 50, 100]}
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* COMPREHENSIVE ORDER DETAILS DIALOG (Very good way!) */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedOrder} onOpenChange={(val) => !val && handleCloseOrderModal()}>
        <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
          {selectedOrder && (
            <div className="space-y-0">
              {/* Modal Top Header */}
              <div className="p-6 border-b bg-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold tracking-tight text-foreground">
                        Order #{selectedOrder.orderNumber}
                      </h2>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          STATUS_CONFIG[selectedOrder.orderStatus]?.badge || ''
                        }`}
                      >
                        {selectedOrder.orderStatus.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.badge || ''
                        }`}
                      >
                        Payment: {selectedOrder.paymentStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        Placed on {new Date(selectedOrder.placedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>•</span>
                      <span>Customer ID: {selectedOrder.customer?.id || selectedOrder.userId}</span>
                    </div>
                  </div>

                  {/* Direct Status Control Inside Modal Header */}
                  {selectedOrder.orderStatus === 'DELIVERED' ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold shadow-2xs">
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>Order Delivered • Completed (Locked)</span>
                    </div>
                  ) : selectedOrder.orderStatus === 'CANCELLED' ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs font-bold shadow-2xs">
                      <XCircle size={16} className="text-rose-600 dark:text-rose-400 shrink-0" />
                      <span>Order Cancelled (Locked)</span>
                    </div>
                  ) : selectedOrder.orderStatus === 'RETURNED' ? (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold shadow-2xs">
                      <RotateCcw size={16} className="text-zinc-500 shrink-0" />
                      <span>Order Returned (Locked)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-xl border">
                      <span className="text-[11px] font-bold text-muted-foreground px-2">Change Status:</span>
                      <select
                        value={selectedOrder.orderStatus}
                        onChange={(e) => handleDirectStatusChange(selectedOrder.id, e.target.value as OrderStatus)}
                        disabled={isUpdating}
                        className="text-xs font-bold bg-background border rounded-lg px-2.5 py-1.5 text-foreground cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none"
                      >
                        <option value="PLACED">Placed</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="PACKED">Packed</option>
                        <option value="SHIPPED">Shipped</option>
                        <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Visual Fulfillment Stepper Progress Bar */}
                <div className="mt-6 pt-5 border-t">
                  <div className="flex items-center justify-between relative">
                    {/* Stepper background line */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted -z-0" />

                    {FULFILLMENT_STEPS.map((step, idx) => {
                      const state = getStepState(step, selectedOrder.orderStatus);
                      const cfg = STATUS_CONFIG[step];
                      const StepIcon = cfg.icon;

                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                              state === 'completed'
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : state === 'current'
                                ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-105'
                                : 'bg-background border-muted-foreground/30 text-muted-foreground'
                            }`}
                          >
                            {state === 'completed' ? (
                              <Check size={16} strokeWidth={2.5} />
                            ) : (
                              <StepIcon size={16} />
                            )}
                          </div>
                          <span
                            className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap hidden sm:block ${
                              state === 'current'
                                ? 'text-primary'
                                : state === 'completed'
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cancelled Banner if applicable */}
                  {selectedOrder.orderStatus === 'CANCELLED' && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 text-xs">
                      <XCircle size={16} className="text-rose-600 shrink-0" />
                      <div>
                        <span className="font-bold">Order Cancelled:</span>{' '}
                        {selectedOrder.cancelledReason || 'No specific cancellation reason provided.'}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Body: 2-Column Grid */}
              <div className="p-6 space-y-6">
                {/* Special Delivery Note Alert if Customer Specified */}
                {selectedOrder.notes && (
                  <div className="p-4 bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl flex items-start gap-3 text-amber-900 dark:text-amber-300">
                    <MessageSquare className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider">Customer Delivery Note / Instructions</h4>
                      <p className="text-xs mt-0.5 italic font-medium">"{selectedOrder.notes}"</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Product Items & Logistics (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Ordered Products Card */}
                    <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                      <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package size={16} className="text-primary" />
                          <h3 className="font-bold text-sm">Ordered Products ({selectedOrder.items?.length || 0})</h3>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          {selectedOrder.items?.reduce((a, b) => a + (b.quantity || 1), 0)} Total Units
                        </span>
                      </div>

                      <div className="divide-y divide-border/60">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, idx) => (
                            <div key={idx} className="p-4 flex items-start gap-3.5 hover:bg-muted/10 transition-colors">
                              {/* Product Image */}
                              <div className="w-16 h-16 rounded-xl border bg-muted/30 overflow-hidden shrink-0 flex items-center justify-center">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                                )}
                              </div>

                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-foreground line-clamp-1">
                                  {item.productName}
                                </h4>

                                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                                  {item.sku && (
                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      SKU: {item.sku}
                                    </span>
                                  )}
                                  {item.size && (
                                    <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                                      Size: {item.size}
                                    </span>
                                  )}
                                  {item.color && (
                                    <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full border border-black/20"
                                        style={{ backgroundColor: item.color.toLowerCase() }}
                                      />
                                      {item.color}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between mt-2.5">
                                  <div className="text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">₹{item.unitPrice}</span> ×{' '}
                                    <span className="font-bold text-foreground">{item.quantity}</span>
                                  </div>
                                  <div className="font-bold text-sm text-foreground">
                                    ₹{item.subtotal?.toLocaleString('en-IN')}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-muted-foreground">
                            No product item details recorded for this order.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Logistics & Tracking Card */}
                    {(selectedOrder.trackingNumber ||
                      selectedOrder.orderStatus === 'SHIPPED' ||
                      selectedOrder.orderStatus === 'DELIVERED') && (
                      <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                        <div className="flex items-center justify-between border-b pb-3">
                          <div className="flex items-center gap-2">
                            <Truck size={16} className="text-amber-600" />
                            <h3 className="font-bold text-sm">Logistics & Tracking</h3>
                          </div>
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            {selectedOrder.deliveryPartnerId || 'Delhivery / BlueDart'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Tracking Number</span>
                            <div className="flex items-center gap-1.5 mt-0.5 font-mono font-bold text-foreground">
                              <span>{selectedOrder.trackingNumber || 'Pending Courier Scan'}</span>
                              {selectedOrder.trackingNumber && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(selectedOrder.trackingNumber!);
                                    toast.success('Tracking number copied to clipboard');
                                  }}
                                  className="text-muted-foreground hover:text-foreground"
                                >
                                  <Copy size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-muted-foreground block text-[11px]">Carrier Dispatch</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                              {selectedOrder.shippedAt
                                ? new Date(selectedOrder.shippedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : 'Express Dispatch'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Customer Details, Address, Financials (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Customer Information Card */}
                    <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 border-b pb-3">
                        <User size={16} className="text-primary" />
                        <h3 className="font-bold text-sm">Customer Profile</h3>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-muted-foreground block text-[11px]">Full Name</span>
                          <span className="font-bold text-foreground text-sm">
                            {selectedOrder.customer?.fullName ||
                              selectedOrder.shippingAddress?.fullName ||
                              'Guest Customer'}
                          </span>
                        </div>

                        {(selectedOrder.customer?.email || selectedOrder.shippingAddress?.fullName) && (
                          <div>
                            <span className="text-muted-foreground block text-[11px]">Email Address</span>
                            <a
                              href={`mailto:${selectedOrder.customer?.email}`}
                              className="font-medium text-primary hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Mail size={12} />
                              <span>{selectedOrder.customer?.email || 'N/A (Checkout guest)'}</span>
                            </a>
                          </div>
                        )}

                        <div>
                          <span className="text-muted-foreground block text-[11px]">Contact Phone</span>
                          <a
                            href={`tel:${selectedOrder.customer?.phone || selectedOrder.shippingAddress?.phone}`}
                            className="font-medium text-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                          >
                            <Phone size={12} />
                            <span>
                              {selectedOrder.customer?.phone ||
                                selectedOrder.shippingAddress?.phone ||
                                'No phone provided'}
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address Card */}
                    <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                      <div className="flex items-center gap-2 border-b pb-3">
                        <MapPin size={16} className="text-emerald-600" />
                        <h3 className="font-bold text-sm">Shipping Destination</h3>
                      </div>

                      <div className="text-xs space-y-1.5 text-foreground">
                        <div className="font-bold text-sm">
                          {selectedOrder.shippingAddress?.fullName || 'Recipient'}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedOrder.shippingAddress?.streetAddress}
                        </p>
                        {selectedOrder.shippingAddress?.landmark && (
                          <p className="text-muted-foreground">
                            <span className="font-semibold text-foreground">Landmark:</span>{' '}
                            {selectedOrder.shippingAddress.landmark}
                          </p>
                        )}
                        <p className="font-semibold">
                          {[
                            selectedOrder.shippingAddress?.city,
                            selectedOrder.shippingAddress?.state,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                          {selectedOrder.shippingAddress?.postalCode
                            ? ` - ${selectedOrder.shippingAddress.postalCode}`
                            : ''}
                        </p>
                        <p className="text-muted-foreground text-[11px]">
                          {selectedOrder.shippingAddress?.country || 'India'}
                        </p>
                      </div>
                    </div>

                    {/* Payment & Invoice Breakdown */}
                    <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-purple-600" />
                          <h3 className="font-bold text-sm">Financial Summary</h3>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            PAYMENT_STATUS_CONFIG[selectedOrder.paymentStatus]?.badge || ''
                          }`}
                        >
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Payment Method</span>
                          <span className="font-bold text-foreground uppercase">
                            {selectedOrder.paymentMethod || 'COD'}
                          </span>
                        </div>

                        <div className="flex justify-between text-muted-foreground">
                          <span>Items Subtotal</span>
                          <span className="font-semibold text-foreground">
                            ₹{selectedOrder.subtotal?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>

                        {selectedOrder.discount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Promotional Discount</span>
                            <span>-₹{selectedOrder.discount?.toLocaleString('en-IN')}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-muted-foreground">
                          <span>Shipping & Handling</span>
                          <span className="font-semibold text-foreground">
                            {selectedOrder.shippingCharge
                              ? `₹${selectedOrder.shippingCharge}`
                              : 'FREE'}
                          </span>
                        </div>

                        {selectedOrder.tax > 0 && (
                          <div className="flex justify-between text-muted-foreground">
                            <span>Estimated Taxes (GST)</span>
                            <span className="font-semibold text-foreground">
                              ₹{selectedOrder.tax?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t flex justify-between items-baseline font-bold text-sm text-foreground">
                          <span>Grand Total</span>
                          <span className="text-lg text-primary font-black">
                            ₹{selectedOrder.totalAmount?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Cancellation Refund Bank Details Card (If present) */}
                    {selectedOrder.cancellationBankDetails && (
                      <div className="border border-rose-200 bg-rose-50/50 rounded-2xl p-4 shadow-xs space-y-2 text-xs">
                        <div className="flex items-center gap-2 border-b border-rose-200/70 pb-2 text-rose-900 font-bold">
                          <CreditCard size={15} className="text-rose-700" />
                          <span>Cancellation Refund Bank Details</span>
                        </div>
                        <div className="space-y-1 text-gray-800 text-[11px]">
                          <p><span className="text-muted-foreground">Account Holder:</span> <strong>{selectedOrder.cancellationBankDetails.accountHolderName}</strong></p>
                          <p><span className="text-muted-foreground">Account Number:</span> <strong className="font-mono">{selectedOrder.cancellationBankDetails.accountNumber}</strong></p>
                          <p><span className="text-muted-foreground">IFSC Code:</span> <strong className="font-mono">{selectedOrder.cancellationBankDetails.ifscCode}</strong></p>
                          {selectedOrder.cancellationBankDetails.bankName && (
                            <p><span className="text-muted-foreground">Bank:</span> {selectedOrder.cancellationBankDetails.bankName}</p>
                          )}
                          <div className="pt-1 text-[10px] text-rose-700 font-semibold">
                            Reason: {selectedOrder.cancelledReason || 'Cancelled by customer'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer with Actions */}
              <div className="p-4 md:p-6 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  {selectedOrder.orderStatus !== 'CANCELLED' &&
                    selectedOrder.orderStatus !== 'DELIVERED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isUpdating}
                        onClick={() => handleAdminCancel(selectedOrder.id)}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Cancel & Restock Order
                      </Button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCloseOrderModal()}
                    className="text-xs font-semibold"
                  >
                    Close
                  </Button>

                  {getNextStageInfo(selectedOrder.orderStatus) && (
                    <Button
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => advanceOrder(selectedOrder.id, selectedOrder.orderStatus)}
                      className={`text-white text-xs font-bold ${
                        getNextStageInfo(selectedOrder.orderStatus)!.color
                      }`}
                    >
                      <span>{getNextStageInfo(selectedOrder.orderStatus)!.label}</span>
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SHIPMENT TRACKING MODAL */}
      {/* ========================================================================= */}
      <Dialog open={!!shippingOrder} onOpenChange={(val) => !val && setShippingOrder(null)}>
        <DialogContent className="sm:max-w-md max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Enter Shipment Tracking Details</span>
            </DialogTitle>
            <DialogDescription>
              Assign logistics partner details and tracking number for Order{' '}
              <strong>{shippingOrder?.orderNumber}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            <div>
              <Label htmlFor="tracking" className="font-semibold text-xs">
                Airway Bill / Tracking Number *
              </Label>
              <Input
                id="tracking"
                placeholder="e.g. BLUEDART-9988221"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1.5 font-mono text-sm"
              />
            </div>
            <div>
              <Label htmlFor="partner" className="font-semibold text-xs">
                Logistics Partner / Courier
              </Label>
              <Input
                id="partner"
                value={deliveryPartner}
                onChange={(e) => setDeliveryPartner(e.target.value)}
                className="mt-1.5 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShippingOrder(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmShipment}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isUpdating ? 'Saving...' : 'Confirm & Mark Shipped'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* RETURNS PHOTO PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewPhotos && (
        <Dialog open={!!previewPhotos} onOpenChange={(val) => !val && setPreviewPhotos(null)}>
          <DialogContent className="sm:max-w-xl max-w-xl">
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
                <div key={idx} className="border rounded-xl overflow-hidden bg-muted/30 aspect-square">
                  <img
                    src={src}
                    alt={`Return item photo ${idx + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button size="sm" onClick={() => setPreviewPhotos(null)}>
                Close Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ========================================================================= */}
      {/* SCHEDULE RETURN PICKUP MODAL */}
      {/* ========================================================================= */}
      <Dialog open={!!schedulingReturn} onOpenChange={(val) => !val && setSchedulingReturn(null)}>
        <DialogContent className="sm:max-w-md max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" />
              <span>Schedule Return Pickup & Assign Agent</span>
            </DialogTitle>
            <DialogDescription>
              Assign pickup day, time slot window, and delivery executive details for Return #
              {schedulingReturn?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <Label htmlFor="pickupDate" className="font-semibold text-xs">
                Pickup Date *
              </Label>
              <Input
                id="pickupDate"
                type="date"
                value={pickupDateInput}
                onChange={(e) => setPickupDateInput(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timeSlot" className="font-semibold text-xs">
                Pickup Time Window Slot *
              </Label>
              <select
                id="timeSlot"
                value={pickupTimeSlotInput}
                onChange={(e) => setPickupTimeSlotInput(e.target.value)}
                className="w-full border rounded-lg p-2 bg-background mt-1 font-medium text-xs"
              >
                <option value="09:00 AM - 12:00 PM">09:00 AM - 12:00 PM (Morning)</option>
                <option value="10:00 AM - 02:00 PM">10:00 AM - 02:00 PM (Mid-Day)</option>
                <option value="02:00 PM - 06:00 PM">02:00 PM - 06:00 PM (Afternoon)</option>
                <option value="06:00 PM - 09:00 PM">06:00 PM - 09:00 PM (Evening)</option>
              </select>
            </div>

            <div>
              <Label htmlFor="agentName" className="font-semibold text-xs">
                Delivery Executive Name *
              </Label>
              <Input
                id="agentName"
                placeholder="e.g. Ramesh Kumar (YOX Logistics)"
                value={pickupAgentNameInput}
                onChange={(e) => setPickupAgentNameInput(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="agentPhone" className="font-semibold text-xs">
                Delivery Executive Phone Number *
              </Label>
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
            <Button variant="outline" size="sm" onClick={() => setSchedulingReturn(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmSchedulePickup}
              disabled={isUpdating}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isUpdating ? 'Scheduling...' : 'Save & Assign Pickup'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* PROCESS REFUND MODAL */}
      {/* ========================================================================= */}
      <Dialog open={!!refundingReturn} onOpenChange={(val) => !val && setRefundingReturn(null)}>
        <DialogContent className="sm:max-w-md max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Issue Customer Refund</span>
            </DialogTitle>
            <DialogDescription>
              Enter final refund amount and reference transaction ID for Return #
              {refundingReturn?.id.substring(0, 8)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {refundingReturn?.refundBankDetails && (
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1 text-xs text-amber-950">
                <div className="flex items-center justify-between font-bold text-amber-900 border-b border-amber-200/60 pb-1">
                  <span className="flex items-center gap-1.5">
                    <CreditCard size={13} className="text-amber-700" />
                    Customer Bank Account Details
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                    Direct NEFT/IMPS
                  </span>
                </div>
                <div className="space-y-0.5 pt-1 text-[11px]">
                  <p><span className="text-muted-foreground">Account Holder:</span> <strong>{refundingReturn.refundBankDetails.accountHolderName}</strong></p>
                  <p><span className="text-muted-foreground">Account Number:</span> <strong className="font-mono">{refundingReturn.refundBankDetails.accountNumber}</strong></p>
                  <p><span className="text-muted-foreground">IFSC Code:</span> <strong className="font-mono">{refundingReturn.refundBankDetails.ifscCode}</strong></p>
                  {refundingReturn.refundBankDetails.bankName && (
                    <p><span className="text-muted-foreground">Bank:</span> {refundingReturn.refundBankDetails.bankName}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="refundAmt" className="font-semibold text-xs">
                Refund Amount (₹) *
              </Label>
              <Input
                id="refundAmt"
                type="number"
                value={refundAmountInput}
                onChange={(e) => setRefundAmountInput(Number(e.target.value))}
                className="mt-1 font-bold text-base"
              />
            </div>

            <div>
              <Label htmlFor="refundMethod" className="font-semibold text-xs">
                Refund Payment Method
              </Label>
              <select
                id="refundMethod"
                value={refundMethodInput}
                onChange={(e) => setRefundMethodInput(e.target.value)}
                className="w-full border rounded-lg p-2 bg-background mt-1 font-medium text-xs"
              >
                <option value="UPI / Original Payment Method">UPI / Original Payment Method</option>
                <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                <option value="YOX Store Wallet Credit">YOX Store Wallet Credit</option>
              </select>
            </div>

            <div>
              <Label htmlFor="txnId" className="font-semibold text-xs">
                Refund Transaction / Reference ID *
              </Label>
              <Input
                id="txnId"
                placeholder="e.g. TXN-8877665511"
                value={refundTxnIdInput}
                onChange={(e) => setRefundTxnIdInput(e.target.value)}
                className="mt-1 font-mono text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRefundingReturn(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmProcessRefund}
              disabled={isUpdating}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
            >
              {isUpdating ? 'Processing...' : 'Confirm & Complete Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}
