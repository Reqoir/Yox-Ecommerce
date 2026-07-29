'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, Banknote, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { toast } from 'sonner';

export function CheckoutSummaryPanel() {
  const { getSubtotal, getSavingsTotal, getItemCount, clearCart } = useCartStore();
  const {
    addresses,
    selectedAddressId,
    paymentMethod,
    setOrderSuccess,
  } = useCheckoutStore();

  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = getSubtotal();
  const savings = getSavingsTotal();
  const itemCount = getItemCount();

  const freeShippingThreshold = 699;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error('Please select or add a delivery address first');
      return;
    }

    if (itemCount === 0) {
      toast.error('Your shopping cart is empty');
      return;
    }

    setIsProcessing(true);

    // Simulate order placement API call (COD or Razorpay SDK execution)
    setTimeout(() => {
      const orderId = `YOX-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // Delivery date estimation (3-5 business days)
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + 4);
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Clear cart
      clearCart();

      // Set order success details
      setOrderSuccess(true, {
        orderId,
        total: grandTotal,
        paymentMethod,
        deliveryDate: formattedDate,
        itemCount,
      });

      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="w-full bg-[#F7F8F7] border border-gray-200 rounded p-6 sticky top-24">
      <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Payment Details
      </h3>

      {/* Selected Address Preview */}
      {selectedAddress ? (
        <div className="bg-white border border-gray-200 rounded p-3 mb-5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Shipping To
          </span>
          <p className="font-bold text-gray-900">{selectedAddress.fullName}</p>
          <p className="text-gray-600 truncate">{selectedAddress.streetAddress}, {selectedAddress.city}</p>
          <p className="text-gray-500 font-medium">Pin: {selectedAddress.pincode}</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 mb-5 text-xs font-semibold">
          ⚠️ Please select a delivery address
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-bold text-gray-900">₹{subtotal}</span>
        </div>

        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Bag Savings</span>
            <span className="font-bold">-₹{savings}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Delivery Charge</span>
          {shippingFee === 0 ? (
            <span className="font-bold text-emerald-600 uppercase">FREE</span>
          ) : (
            <span className="font-bold text-gray-900">₹{shippingFee}</span>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900">Total Payable</span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">₹{grandTotal}</span>
            <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* Dynamic CTA Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={isProcessing || !selectedAddress || itemCount === 0}
        className="w-full flex items-center justify-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold tracking-wider py-4 rounded transition-colors shadow-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span>PROCESSING ORDER...</span>
        ) : paymentMethod === 'RAZORPAY' ? (
          <>
            <CreditCard size={16} />
            <span>PAY ₹{grandTotal} WITH RAZORPAY</span>
          </>
        ) : (
          <>
            <Banknote size={16} />
            <span>PLACE ORDER (COD)</span>
          </>
        )}
      </button>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
        <Lock size={14} className="text-emerald-600" />
        <span>Safe & Encrypted Transactions</span>
      </div>
    </div>
  );
}
