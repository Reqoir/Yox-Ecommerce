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

  // Dynamic free shipping threshold & standard shipping fee from store settings
  const freeShippingThreshold = config.freeShippingThreshold ?? DEFAULT_STORE_CONFIG.freeShippingThreshold;
  const standardShippingFee = config.standardShippingFee ?? DEFAULT_STORE_CONFIG.standardShippingFee;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

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

  const grandTotal = Math.max(0, subtotal + shippingFee);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-none p-6 sticky top-24">
      <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Order Summary ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </h3>

      {/* Free Shipping Progress Indicator */}
      <div className="bg-white border border-emerald-100 rounded p-3 mb-5">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-1">
          <Truck size={16} className="text-emerald-600" />
          {remainingForFreeShipping === 0 ? (
            <span>You qualify for FREE Delivery!</span>
          ) : (
            <span>Add ₹{remainingForFreeShipping} more to get FREE Delivery</span>
          )}
        </div>
        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
          />
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span className="font-bold text-gray-900">₹{subtotal}</span>
        </div>

        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Bag Savings</span>
            <span className="font-bold">-₹{savings}</span>
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
            <span className="text-xl font-bold text-gray-900">₹{grandTotal}</span>
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
        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-bold tracking-wider py-4 rounded-none transition-colors shadow-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>{isMaintenance ? 'CHECKOUT PAUSED (MAINTENANCE)' : 'PROCEED TO CHECKOUT'}</span>
        {!isMaintenance && <ArrowRight size={16} />}
      </button>

      {/* Security Guarantee */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span>100% Safe & Secure Checkout</span>
      </div>
    </div>
  );
}
