'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { CartItemsList } from '@/components/features/cart/cart-items-list';
import { CartSummary } from '@/components/features/cart/cart-summary';
import { EmptyCart } from '@/components/features/cart/empty-cart';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 lg:mb-8 gap-2">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Shopping Basket ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h1>
          </div>

          <button
            onClick={() => {
              clearCart();
              toast.success('Shopping basket cleared');
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors self-start sm:self-auto"
          >
            <Trash2 size={14} />
            <span>Clear Basket</span>
          </button>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
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
    </main>
  );
}
