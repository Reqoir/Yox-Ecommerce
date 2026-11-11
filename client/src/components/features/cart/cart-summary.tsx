'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, ArrowRight, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { DEFAULT_STORE_CONFIG } from '@/api/admin/settings';

export function CartSummary() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { getSubtotal, getSavingsTotal, getItemCount } = useCartStore();
  const { config } = useStoreSettingsStore();

  const userRole = (user as any)?.role || user?.roleId || '';
  const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
  const isAdmin = userRoleUpper.includes('ADMIN') || (user?.permissions || []).includes('*');
  const isMaintenance = Boolean(config.maintenanceMode);

  const subtotal = getSubtotal();
  const savings = getSavingsTotal();
  const itemCount = getItemCount();

  // 100% Free Shipping nationwide on all orders
  const shippingFee = 0;

  const { setDirectBuyItem } = useCheckoutStore();

  const handleProceedToCheckout = () => {
    if (isMaintenance) {
      toast.error('Store maintenance is currently active. Checkout is temporarily paused.');
      return;
    }
    // Clear any direct buy state to ensure cart checkout is used
    setDirectBuyItem(null);

    if (!isAuthenticated) {
      toast.error('Please log in to proceed to checkout');
      router.push('/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const grandTotal = subtotal;

  return (
    <div className="w-full bg-white border border-gray-200/90 rounded-md p-4 sm:p-6 sticky top-24 shadow-2xs">
      <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 pb-2.5 sm:pb-3 border-b border-gray-200 flex items-center justify-between">
        <span>Order Summary</span>
        <span className="text-xs font-semibold text-gray-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </h3>

      {/* Free Shipping Guarantee Indicator */}
      <div className="bg-emerald-50/70 border border-emerald-100 rounded-sm p-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
          <Truck size={15} className="text-emerald-600 shrink-0" />
          <span>Complimentary 100% FREE Delivery nationwide</span>
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-2.5 text-xs mb-5">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-bold text-gray-900">₹{subtotal.toLocaleString()}</span>
        </div>

        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Bag Savings</span>
            <span className="font-bold">-₹{savings.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Estimated Delivery</span>
          {shippingFee === 0 ? (
            <span className="font-bold text-emerald-600 uppercase">FREE</span>
          ) : (
            <span className="font-bold text-gray-900">₹{shippingFee}</span>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900">Grand Total</span>
          <div className="text-right">
            <span className="text-lg sm:text-xl font-bold text-gray-900">₹{grandTotal.toLocaleString()}</span>
            <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* Maintenance alert if active */}
      {isMaintenance && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2 leading-relaxed">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <span>Checkout is paused for scheduled maintenance. Items in your cart remain saved.</span>
        </div>
      )}

      {/* Checkout CTA */}
      <button
        onClick={handleProceedToCheckout}
        disabled={itemCount === 0 || isMaintenance}
        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-bold tracking-wider py-3.5 sm:py-4 rounded-sm transition-all shadow-sm mb-3.5 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer"
      >
        <span>{isMaintenance ? 'CHECKOUT PAUSED (MAINTENANCE)' : 'PROCEED TO CHECKOUT'}</span>
        {!isMaintenance && <ArrowRight size={15} />}
      </button>

      {/* Security Guarantee */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-medium">
        <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
        <span>100% Safe & Secure Checkout</span>
      </div>
    </div>
  );
}
