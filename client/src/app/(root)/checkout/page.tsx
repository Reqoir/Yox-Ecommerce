'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AddressSection } from '@/components/features/checkout/address-section';
import { PaymentSection } from '@/components/features/checkout/payment-section';
import { OrderItemsReview } from '@/components/features/checkout/order-items-review';
import { CheckoutSummaryPanel } from '@/components/features/checkout/checkout-summary-panel';
import { OrderSuccessModal } from '@/components/features/checkout/order-success-modal';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { ShieldCheck, Lock, ArrowLeft, Loader2, Wrench, AlertTriangle, Zap, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams?.get('buyNow') === '1' || searchParams?.get('buyNow') === 'true';

  const { items } = useCartStore();
  const { directBuyItem, setDirectBuyItem } = useCheckoutStore();
  const { isAuthenticated, user } = useAuthStore();
  const { config, fetchSettings } = useStoreSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Clean up directBuyItem if user navigated to standard cart checkout without buyNow query
  useEffect(() => {
    if (!isBuyNow && directBuyItem) {
      setDirectBuyItem(null);
    }
  }, [isBuyNow, directBuyItem, setDirectBuyItem]);

  const userRole = (user as any)?.role || user?.roleId || '';
  const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
  const isAdmin = userRoleUpper.includes('ADMIN') || (user?.permissions || []).includes('*');
  const isMaintenance = config.maintenanceMode && !isAdmin;

  if (isMaintenance) {
    return (
      <main className="w-full bg-slate-50 min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-amber-200 p-8 sm:p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Wrench size={32} />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-amber-700 uppercase bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300">
              <AlertTriangle size={12} /> Scheduled System Maintenance
            </span>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Checkout is Temporarily Paused</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              We are currently optimizing our checkout and payment gateways to deliver an even smoother experience. Your cart items are completely safe.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <p className="font-bold text-slate-800">Support & Inquiries</p>
            <p>
              Email: <span className="font-semibold text-slate-900">{config.supportEmail || 'support@yox.com'}</span>
            </p>
            <p>
              Helpline: <span className="font-semibold text-slate-900">{config.supportPhone || '+91 98765 43210'}</span>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/"
              className="flex-1 py-3 bg-black hover:bg-gray-900 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center"
            >
              Continue Shopping
            </Link>
            <Link
              href="/cart"
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition-colors flex items-center justify-center"
            >
              View Saved Bag
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Check if items are present
  const isDirectCheckout = isBuyNow && !!directBuyItem;
  const hasItems = isDirectCheckout || items.length > 0;

  if (!hasItems) {
    return (
      <main className="w-full bg-white min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
            <ShoppingBag size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Your Checkout is Empty</h2>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            {isBuyNow
              ? 'No direct purchase item was selected. Please choose a product to buy.'
              : 'You have no items in your shopping bag to checkout.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/shop"
              className="px-5 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-800 transition-colors"
            >
              Start Shopping
            </Link>
            {items.length > 0 && (
              <Link
                href="/cart"
                className="px-5 py-2.5 bg-gray-100 text-gray-800 text-xs font-semibold rounded hover:bg-gray-200 transition-colors"
              >
                View Cart ({items.length})
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        
        {/* Buy Now Informational Banner */}
        {isDirectCheckout && (
          <div className="mb-6 p-3 bg-amber-50/90 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs shrink-0">
                <Zap size={14} className="fill-amber-600 text-amber-700" />
              </span>
              <p className="text-xs font-medium text-amber-900">
                <strong className="font-bold">Buy It Now Mode:</strong> Checking out{' '}
                <span className="underline decoration-amber-300 font-semibold">{directBuyItem.name}</span> only.
                {items.length > 0 && (
                  <span className="text-amber-800 font-normal ml-1">
                    (Your other {items.length} cart item{items.length !== 1 ? 's' : ''} remain safe in your cart).
                  </span>
                )}
              </p>
            </div>
            {items.length > 0 && (
              <Link
                href="/checkout"
                onClick={() => setDirectBuyItem(null)}
                className="text-[11px] font-bold text-amber-900 hover:text-black hover:underline shrink-0 whitespace-nowrap"
              >
                Switch to Cart Checkout →
              </Link>
            )}
          </div>
        )}

        {/* Header Breadcrumb & Security Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 mb-6 lg:mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              {isDirectCheckout ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="hover:text-gray-900 flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft size={12} /> Back to Product
                </button>
              ) : (
                <Link href="/cart" className="hover:text-gray-900 flex items-center gap-1">
                  <ArrowLeft size={12} /> Back to Cart
                </Link>
              )}
              <span>&gt;</span>
              <span className="text-gray-900 font-semibold">
                {isDirectCheckout ? 'Direct Buy Checkout' : 'Checkout'}
              </span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              {isDirectCheckout ? 'Direct Buy Checkout & Payment' : 'Checkout & Payment'}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-100 self-start sm:self-auto">
            <Lock size={14} />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Multi-Step Forms */}
          <div className="w-full lg:w-[65%]">
            <AddressSection />
            <PaymentSection />
            <OrderItemsReview />
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="w-full lg:w-[35%]">
            <CheckoutSummaryPanel />
          </div>

        </div>

      </div>

      {/* Order Success Confirmation Modal */}
      <OrderSuccessModal />
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A2E4C]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
