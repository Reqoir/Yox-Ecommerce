'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, Banknote, ArrowRight, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { DEFAULT_STORE_CONFIG } from '@/api/admin/settings';
import { ordersApi } from '@/lib/api/orders';
import { toast } from 'sonner';

export function CheckoutSummaryPanel() {
  const { getSubtotal, getSavingsTotal, getItemCount, clearCart } = useCartStore();
  const { config } = useStoreSettingsStore();
  const {
    addresses,
    selectedAddressId,
    paymentMethod,
    setOrderSuccess,
  } = useCheckoutStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const userRole = (user as any)?.role || user?.roleId || '';
  const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
  const isAdmin = userRoleUpper.includes('ADMIN') || (user?.permissions || []).includes('*');
  const isMaintenance = config.maintenanceMode && !isAdmin;

  const subtotal = getSubtotal();
  const savings = getSavingsTotal();
  const itemCount = getItemCount();

  const freeShippingThreshold = config.freeShippingThreshold ?? DEFAULT_STORE_CONFIG.freeShippingThreshold;
  const standardShippingFee = config.standardShippingFee ?? DEFAULT_STORE_CONFIG.standardShippingFee;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const grandTotal = subtotal + shippingFee;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (isMaintenance) {
      toast.error('Store maintenance is currently active. Order placement is temporarily suspended.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select or add a delivery address first');
      return;
    }

    if (itemCount === 0) {
      toast.error('Your shopping cart is empty');
      return;
    }

    setIsProcessing(true);

    try {
      const order = await ordersApi.placeOrder({
        shippingAddress: {
          fullName: selectedAddress.fullName,
          phone: selectedAddress.phone,
          streetAddress: `${(selectedAddress as any).streetAddress || (selectedAddress as any).street || ''}${((selectedAddress as any).landmark) ? `, ${(selectedAddress as any).landmark}` : ''}`,
          landmark: (selectedAddress as any).landmark || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          country: selectedAddress.country || 'India',
          postalCode: (selectedAddress as any).pincode || (selectedAddress as any).zipCode || '400001',
        },
        paymentMethod: paymentMethod,
      });

      // Delivery date estimation based on store settings
      const deliveryDays = config.estimatedDeliveryDaysMax || 4;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Clear cart in state
      clearCart();

      // Set order success details with authoritative backend values
      setOrderSuccess(true, {
        orderId: order?.orderNumber || `YOX-${Math.floor(100000 + Math.random() * 900000)}`,
        total: order?.totalAmount || grandTotal,
        paymentMethod: paymentMethod,
        deliveryDate: formattedDate,
        itemCount: order?.items?.length || itemCount,
      });

      toast.success('Order placed successfully!');
    } catch (error: any) {
      console.error('Order placement failed:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to complete order placement. Please check your login status or try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded p-6 sticky top-24">
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
          <p className="text-gray-600 truncate">{(selectedAddress as any).streetAddress || (selectedAddress as any).street || ''}, {selectedAddress.city}</p>
          <p className="text-gray-500 font-medium">Pin: {(selectedAddress as any).pincode || (selectedAddress as any).zipCode || ''}</p>
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

      {/* Maintenance Notice */}
      {isMaintenance && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <span>Checkout is currently paused for scheduled maintenance.</span>
        </div>
      )}

      {/* Dynamic CTA Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={isProcessing || !selectedAddress || itemCount === 0 || isMaintenance}
        className="w-full flex items-center justify-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold tracking-wider py-4 rounded transition-colors shadow-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isMaintenance ? (
          <span>CHECKOUT TEMPORARILY PAUSED</span>
        ) : isProcessing ? (
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
