'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddressSection } from '@/components/features/checkout/address-section';
import { PaymentSection } from '@/components/features/checkout/payment-section';
import { OrderItemsReview } from '@/components/features/checkout/order-items-review';
import { CheckoutSummaryPanel } from '@/components/features/checkout/checkout-summary-panel';
import { OrderSuccessModal } from '@/components/features/checkout/order-success-modal';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { items } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        
        {/* Header Breadcrumb & Security Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 mb-6 lg:mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/cart" className="hover:text-gray-900 flex items-center gap-1">
                <ArrowLeft size={12} /> Back to Cart
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-semibold">Checkout</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              Checkout & Payment
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
