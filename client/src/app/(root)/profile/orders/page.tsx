'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, BackendOrder, OrderStatus } from '@/lib/api/orders';
import { Package, Truck, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PLACED: { label: 'Order Placed', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
  CONFIRMED: { label: 'Confirmed', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: CheckCircle2 },
  PACKED: { label: 'Packed & Ready', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Package },
  SHIPPED: { label: 'Shipped', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Truck },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Truck },
  DELIVERED: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  CANCELLED: { label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle },
  RETURNED: { label: 'Returned', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await ordersApi.getMyOrders(1, 50);
      setOrders(res.orders);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch your orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancellingId(orderId);
      const updated = await ordersApi.cancelOrder(orderId, 'Cancelled by user from profile');
      toast.success('Order cancelled successfully. Stock restored.');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Cannot cancel this order at its current shipping stage.');
    } finally {
      setCancellingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Loading your order history...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-gray-500 mt-1">Track shipping status and inspect past purchases</p>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
          {orders.length} {orders.length === 1 ? 'Order' : 'Orders'}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Found</h3>
          <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
            You haven't placed any orders yet. Explore our latest fashion collections and upgrade your wardrobe today!
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold text-xs px-6 py-3 rounded transition-all shadow"
          >
            <span>Explore Catalog</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
            const StatusIcon = statusInfo.icon;
            const canCancel = ['PLACED', 'CONFIRMED', 'PACKED'].includes(order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:border-gray-300"
              >
                {/* Card Header */}
                <div className="bg-gray-50/70 border-b border-gray-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
                  <div className="flex flex-wrap items-center gap-6">
                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Order ID</span>
                      <span className="font-mono font-bold text-[#1A2E4C] text-sm">{order.orderNumber}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Date Placed</span>
                      <span className="font-medium text-gray-800">
                        {new Date(order.placedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-semibold block text-[10px] uppercase">Total Amount</span>
                      <span className="font-bold text-gray-900 text-sm">₹{order.totalAmount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${statusInfo.color}`}>
                      <StatusIcon size={14} strokeWidth={2.5} />
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items Breakdown */}
                <div className="p-5 divide-y divide-gray-100">
                  {order.items && order.items.map((item, index) => (
                    <div key={`${order.id}-item-${index}`} className="py-3 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 shrink-0 flex items-center justify-center text-gray-400 font-mono text-[10px]">
                          {item.sku ? item.sku.split('-')[0] : 'ITEM'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.productName}</p>
                          <div className="flex items-center gap-3 text-gray-500 mt-0.5">
                            <span>SKU: <span className="font-mono text-gray-700">{item.sku}</span></span>
                            <span>Qty: <span className="font-semibold text-gray-900">x{item.quantity}</span></span>
                            {item.color && <span>Color: {item.color}</span>}
                            {item.size && <span>Size: {item.size}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-gray-900">₹{item.subtotal}</span>
                        <span className="block text-[10px] text-gray-400">(₹{item.unitPrice} / unit)</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-gray-600">
                    <div>
                      <span className="text-gray-400 font-medium">Payment: </span>
                      <span className="font-bold text-gray-800 uppercase">{order.paymentMethod}</span>
                      <span className="text-gray-400 ml-1.5 font-medium">({order.paymentStatus})</span>
                    </div>
                    {order.trackingNumber && (
                      <div>
                        <span className="text-gray-400 font-medium">Tracking: </span>
                        <span className="font-mono font-bold text-emerald-700">{order.trackingNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    {canCancel ? (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingId === order.id}
                        className="px-3.5 py-1.5 bg-white hover:bg-rose-50 border border-gray-300 hover:border-rose-200 text-rose-600 font-semibold rounded text-xs transition-colors shadow-2xs disabled:opacity-50"
                      >
                        {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    ) : order.orderStatus === 'CANCELLED' ? (
                      <span className="text-gray-400 italic text-[11px]">Order cancelled & refunded</span>
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
                        <ShieldCheck size={14} /> Protected under returns guarantee
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
