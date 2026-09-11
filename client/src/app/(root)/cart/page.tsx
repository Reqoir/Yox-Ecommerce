'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { DEFAULT_STORE_CONFIG } from '@/api/admin/settings';
import { CartItemsList } from '@/components/features/cart/cart-items-list';
import { CartSummary } from '@/components/features/cart/cart-summary';
import { EmptyCart } from '@/components/features/cart/empty-cart';
import { Trash2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const router = useRouter();
  const { items, clearCart, getSubtotal, getItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const { setDirectBuyItem } = useCheckoutStore();
  const { config } = useStoreSettingsStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isMaintenance = Boolean(config.maintenanceMode);
  const subtotal = getSubtotal();
  const freeShippingThreshold = config.freeShippingThreshold ?? DEFAULT_STORE_CONFIG.freeShippingThreshold;
  const standardShippingFee = config.standardShippingFee ?? DEFAULT_STORE_CONFIG.standardShippingFee;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const grandTotal = Math.max(0, subtotal + shippingFee);
  const itemCount = getItemCount();

  const handleProceedToCheckout = () => {
    if (isMaintenance) {
      toast.error('Store maintenance is currently active. Checkout is temporarily paused.');
      return;
    }
    setDirectBuyItem(null);
    if (!isAuthenticated) {
      toast.error('Please log in to proceed to checkout');
      router.push('/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (!mounted) {
    return (
      <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8 animate-pulse">
        <div className="w-[98%] max-w-[1500px] mx-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 lg:mb-8 gap-2">
            <div className="h-8 w-64 bg-gray-100 rounded-sm" />
            <div className="h-4 w-24 bg-gray-100 rounded-sm self-start sm:self-auto" />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            {/* Left Column: Items List Skeleton */}
            <div className="w-full lg:w-[65%] divide-y divide-gray-100">
              {[1, 2].map((i) => (
                <div key={i} className="py-6 flex gap-4 lg:gap-6 items-start">
                  <div className="w-28 lg:w-36 flex-shrink-0 aspect-[3/4] bg-gray-100 rounded-sm" />
                  <div className="flex-1 flex flex-col justify-between min-h-[8rem]">
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="h-5 w-2/3 bg-gray-100 rounded-sm" />
                        <div className="h-5 w-16 bg-gray-100 rounded-sm flex-shrink-0" />
                      </div>
                      <div className="flex gap-2 mb-3">
                        <div className="h-3 w-32 bg-gray-100 rounded-xs" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                      <div className="h-8 w-24 bg-gray-100 rounded-sm" />
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-32 bg-gray-100 rounded-sm hidden sm:block" />
                        <div className="h-8 w-20 bg-gray-100 rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Order Summary Skeleton */}
            <div className="w-full lg:w-[35%]">
              <div className="bg-gray-50 p-6 rounded-sm">
                <div className="h-6 w-1/2 bg-gray-200 rounded-sm mb-6" />
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between"><div className="h-4 w-1/3 bg-gray-200 rounded-sm" /><div className="h-4 w-1/4 bg-gray-200 rounded-sm" /></div>
                  <div className="flex justify-between"><div className="h-4 w-1/3 bg-gray-200 rounded-sm" /><div className="h-4 w-1/4 bg-gray-200 rounded-sm" /></div>
                </div>
                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between"><div className="h-5 w-1/3 bg-gray-200 rounded-sm" /><div className="h-5 w-1/4 bg-gray-200 rounded-sm" /></div>
                </div>
                <div className="h-12 w-full bg-gray-200 rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!items || items.length === 0) {
    return (
      <main className="w-full bg-white min-h-[70vh] flex items-center justify-center">
        <EmptyCart />
      </main>
    );
  }

  return (
    <main className="w-full bg-white min-h-screen pb-36 lg:pb-16 pt-3 sm:pt-6 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4 lg:mb-8">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Shopping Basket
            </h1>
            <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your shopping basket?')) {
                clearCart();
                toast.success('Shopping basket cleared');
              }
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors py-1 px-2 rounded-sm cursor-pointer"
          >
            <Trash2 size={13} />
            <span className="hidden xs:inline sm:inline">Clear Basket</span>
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
          
          {/* Left Column: Items List */}
          <div className="w-full lg:w-[65%]">
            <CartItemsList items={items} />
          </div>

          {/* Right Column: Order Summary */}
          <div className="w-full lg:w-[35%]">
            <CartSummary />
          </div>
          
        </div>
      </div>

      {/* Mobile Sticky Bottom Checkout Bar (Above BottomNav) */}
      <div className="fixed bottom-14 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-md border-t border-gray-200 px-4 py-2.5 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total</span>
            <span className="text-base font-extrabold text-gray-900 leading-tight block">
              ₹{grandTotal.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-semibold block truncate">
              {shippingFee === 0 ? 'FREE Delivery' : `+₹${shippingFee} Delivery`}
            </span>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={items.length === 0 || isMaintenance}
            className="flex-1 max-w-[210px] flex items-center justify-center gap-1.5 bg-black hover:bg-gray-900 text-white text-xs font-bold tracking-wider py-3 px-4 rounded-sm transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <span>{isMaintenance ? 'MAINTENANCE' : 'CHECKOUT'}</span>
            {!isMaintenance && <ArrowRight size={14} />}
          </button>
        </div>
      </div>
    </main>
  );
}
