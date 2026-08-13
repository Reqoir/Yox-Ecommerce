'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi, BackendOrder } from '@/lib/api/orders';
import { returnsApi, BackendReturn } from '@/lib/api/returns';
import { Loader2, ShoppingBag, ArrowRight, ChevronRight, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [userReturns, setUserReturns] = useState<BackendReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrdersAndReturns = async () => {
    try {
      setIsLoading(true);
      const [orderRes, returnRes] = await Promise.all([
        ordersApi.getMyOrders(1, 50),
        returnsApi.getMyReturns().catch(() => []),
      ]);
      setOrders(orderRes.orders);
      setUserReturns(returnRes);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch your orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrdersAndReturns();
  }, []);

  // Helper for computing order receiving details & color coding
  const getOrderReceivingInfo = (order: BackendOrder) => {
    // Check if order has a return
    const orderReturn = userReturns.find((r) => r.orderId === order.id);

    if (order.orderStatus === 'CANCELLED') {
      return {
        text: `Cancelled`,
        subText: order.cancelledReason ? `Reason: ${order.cancelledReason}` : `Order was cancelled`,
        colorClass: 'text-rose-600 font-bold',
        badgeBg: 'bg-rose-50 border-rose-200 text-rose-700',
      };
    }

    if (order.orderStatus === 'RETURNED' || (orderReturn && orderReturn.status === 'REFUNDED')) {
      return {
        text: `Returned & Refunded`,
        subText: `Refund of ₹${orderReturn?.refundAmount || order.totalAmount} completed`,
        colorClass: 'text-emerald-700 font-bold',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      };
    }

    if (orderReturn && orderReturn.status !== 'REFUNDED') {
      return {
        text: `Return Progress (${orderReturn.status.replace(/_/g, ' ')})`,
        subText: `Return requested for order item`,
        colorClass: 'text-amber-700 font-bold',
        badgeBg: 'bg-amber-50 border-amber-200 text-amber-800',
      };
    }

    if (order.orderStatus === 'DELIVERED') {
      const deliveredDate = new Date(order.deliveredAt || order.placedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return {
        text: `Delivered on ${deliveredDate}`,
        subText: `Package handed to recipient`,
        colorClass: 'text-emerald-600 font-bold',
        badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      };
    }

    // Default active / arriving orders
    const baseDate = new Date(order.placedAt);
    const estimatedDate = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    const formattedDate = estimatedDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
    });

    return {
      text: `Arriving ${formattedDate} between 7:00 AM - 10:00 PM`,
      subText: `Order #${order.orderNumber} • ${order.orderStatus.replace(/_/g, ' ')}`,
      colorClass: 'text-emerald-600 font-bold',
      badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    };
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
          <p className="text-xs text-gray-500 mt-1">Click on any order to view full tracking chart & receipt details</p>
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
            You haven't placed any orders yet. Explore our latest fashion collections!
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
            const receivingInfo = getOrderReceivingInfo(order);
            const firstItem = order.items && order.items.length > 0 ? order.items[0] : null;

            return (
              <Link
                key={order.id}
                href={`/profile/orders/${order.id}`}
                className="block bg-white border border-gray-200 hover:border-[#1A2E4C] rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Product Photo & Receiving Details */}
                  <div className="flex items-center gap-4">
                    {/* Product Photo */}
                    <div className="relative w-20 h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                      <img
                        src={
                          firstItem?.imageUrl ||
                          (firstItem as any)?.image ||
                          (firstItem as any)?.productImage ||
                          '/images/product-1.jpeg'
                        }
                        alt={firstItem?.productName || 'YOX Product'}
                        onError={(e) => {
                          // Fallback to stock fashion placeholder image if URL fails to load
                          (e.target as HTMLImageElement).src = '/images/product-1.jpeg';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Multiple Items Indicator Badge */}
                      {order.items && order.items.length > 1 && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                          +{order.items.length - 1}
                        </span>
                      )}
                    </div>

                    {/* Receiving Details */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-[#1A2E4C] transition-colors">
                        {firstItem?.productName || `Order #${order.orderNumber}`}
                        {order.items && order.items.length > 1 && (
                          <span className="text-gray-500 font-normal ml-1">
                            (+{order.items.length - 1} more {order.items.length - 1 === 1 ? 'item' : 'items'})
                          </span>
                        )}
                      </p>

                      {/* Order Receiving Details in Green / Red / Custom Label */}
                      <p className={`text-sm lg:text-base ${receivingInfo.colorClass}`}>
                        {receivingInfo.text}
                      </p>

                      <p className="text-xs text-gray-500">
                        {receivingInfo.subText}
                      </p>
                    </div>
                  </div>

                  {/* Right Chevron indicating full card clickability */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:inline-block text-xs font-bold text-gray-400 group-hover:text-[#1A2E4C] transition-colors">
                      ₹{order.totalAmount}
                    </span>
                    <div className="w-9 h-9 rounded-full bg-gray-50 group-hover:bg-[#1A2E4C] text-gray-400 group-hover:text-white flex items-center justify-center transition-all">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
