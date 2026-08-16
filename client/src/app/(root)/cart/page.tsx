'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/useCartStore';
import { CartItemsList } from '@/components/features/cart/cart-items-list';
import { CartSummary } from '@/components/features/cart/cart-summary';
import { EmptyCart } from '@/components/features/cart/empty-cart';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
  const { items, clearCart } = useCartStore();

  if (!items || items.length === 0) {
    return (
      <main className="w-full bg-white min-h-[70vh] flex items-center justify-center">
        <EmptyCart />
      </main>
    );
  }

  return (
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[95%] lg:w-[95%] max-w-7xl mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 lg:mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-semibold">Shopping Basket</span>
            </div>
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
