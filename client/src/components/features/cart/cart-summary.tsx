'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, ArrowRight, Tag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function CartSummary() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { getSubtotal, getSavingsTotal, getItemCount } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const subtotal = getSubtotal();
  const savings = getSavingsTotal();
  const itemCount = getItemCount();

  // Free shipping threshold above 699
  const freeShippingThreshold = 699;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;

    if (promoCode.toUpperCase() === 'YOX10' || promoCode.toUpperCase() === 'MAX400') {
      const discount = promoCode.toUpperCase() === 'MAX400' ? 400 : Math.round(subtotal * 0.1);
      setDiscountAmount(discount);
      setAppliedCode(promoCode.toUpperCase());
      toast.success(`Promo code ${promoCode.toUpperCase()} applied!`);
    } else {
      toast.error('Invalid promo code. Try "MAX400" or "YOX10"');
    }
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to proceed to checkout');
      router.push('/login?callbackUrl=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const grandTotal = Math.max(0, subtotal + shippingFee - discountAmount);

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

        {appliedCode && (
          <div className="flex justify-between text-emerald-600 font-medium pt-1 border-t border-dashed border-emerald-200">
            <span className="flex items-center gap-1">
              <Tag size={12} />
              Promo ({appliedCode})
            </span>
            <span className="font-bold">-₹{discountAmount}</span>
          </div>
        )}

        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900">Grand Total</span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">₹{grandTotal}</span>
            <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* Promo Code Input */}
      <form onSubmit={handleApplyPromo} className="mb-6">
        <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
          Have a promo code?
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. MAX400"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded bg-white outline-none focus:border-[#1A2E4C]"
          />
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded transition-colors"
          >
            Apply
          </button>
        </div>
      </form>

      {/* Checkout CTA */}
      <button
        onClick={handleProceedToCheckout}
        disabled={itemCount === 0}
        className="w-full flex items-center justify-center gap-2 bg-black hover:bg-gray-900 text-white text-xs font-bold tracking-wider py-4 rounded-none transition-colors shadow-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>PROCEED TO CHECKOUT</span>
        <ArrowRight size={16} />
      </button>

      {/* Security Guarantee */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span>100% Secure Checkout & Easy Returns</span>
      </div>
    </div>
  );
}
