'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Package, ArrowRight, Home, Calendar, Truck } from 'lucide-react';
import { useCheckoutStore } from '@/store/useCheckoutStore';

export function OrderSuccessModal() {
  const { isOrderSuccess, lastOrderDetails, resetCheckout } = useCheckoutStore();

  if (!isOrderSuccess || !lastOrderDetails) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Animated Check Icon */}
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Order Placed Successfully!</h2>
        <p className="text-xs text-gray-500 mb-6">
          Thank you for shopping with YOX Men&apos;s Fashion. We are preparing your order for shipment.
        </p>

        {/* Order Details Card */}
        <div className="bg-gray-50 border border-gray-100 rounded-md p-4 mb-6 text-left text-xs space-y-2.5">
          <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono font-bold text-[#1A2E4C]">{lastOrderDetails.orderId}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Amount Paid / Due</span>
            <span className="font-bold text-gray-900">₹{lastOrderDetails.total}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-500">Payment Mode</span>
            <span className="font-semibold text-gray-800">
              {lastOrderDetails.paymentMethod === 'RAZORPAY' ? 'Razorpay Online' : 'Cash on Delivery'}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 text-emerald-700 font-bold">
            <span className="flex items-center gap-1">
              <Truck size={14} /> Estimated Delivery
            </span>
            <span>{lastOrderDetails.deliveryDate}</span>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/profile"
            onClick={() => resetCheckout()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold text-xs py-3 px-4 rounded transition-colors shadow-sm"
          >
            <Package size={16} />
            <span>View My Orders</span>
          </Link>

          <Link
            href="/shop"
            onClick={() => resetCheckout()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-4 rounded transition-colors"
          >
            <Home size={16} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
