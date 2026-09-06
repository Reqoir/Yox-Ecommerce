'use client';

import React, { useEffect } from 'react';
import { CreditCard, Banknote, ShieldCheck, CheckCircle2, Lock, AlertCircle } from 'lucide-react';
import { useCheckoutStore, PaymentMethod } from '@/store/useCheckoutStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { useCartStore } from '@/store/useCartStore';

export function PaymentSection() {
  const { paymentMethod, setPaymentMethod } = useCheckoutStore();
  const { config } = useStoreSettingsStore();
  const { getSubtotal } = useCartStore();

  const subtotal = getSubtotal();
  const isCodAllowed = config.codEnabled && (config.codMaxLimit ? subtotal <= config.codMaxLimit : true);

  // If currently selected payment method is COD but COD is disallowed, switch to online payment
  useEffect(() => {
    if (paymentMethod === 'COD' && !isCodAllowed) {
      setPaymentMethod('RAZORPAY');
    }
  }, [paymentMethod, isCodAllowed, setPaymentMethod]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded p-5 lg:p-6 mb-6">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-[#1A2E4C] text-white rounded-full flex items-center justify-center font-bold text-sm">
          2
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 leading-tight">Payment Method</h2>
          <p className="text-xs text-gray-500">Choose how you want to pay</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Razorpay Online Payment Option */}
        <div
          onClick={() => setPaymentMethod('RAZORPAY')}
          className={`cursor-pointer rounded border p-4 transition-all relative ${
            paymentMethod === 'RAZORPAY'
              ? 'border-black bg-white shadow-xs'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#072654] text-white flex items-center justify-center font-bold text-xs">
                <CreditCard size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">Razorpay Secure Online Payment</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    RECOMMENDED
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, NetBanking & Wallets
                </p>
              </div>
            </div>

            {paymentMethod === 'RAZORPAY' && (
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Reserved Payment Badge Row */}
          {paymentMethod === 'RAZORPAY' && (
            <div className="mt-4 pt-3 border-t border-gray-200/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-gray-600">
              <div className="flex items-center gap-2">
                <Lock size={12} className="text-emerald-600" />
                <span>256-Bit Encrypted Secure Checkout</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-gray-500">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">UPI</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">Cards</span>
                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-700">NetBanking</span>
              </div>
            </div>
          )}
        </div>

        {/* Cash on Delivery Option */}
        <div
          onClick={() => {
            if (isCodAllowed) {
              setPaymentMethod('COD');
            }
          }}
          className={`rounded border p-4 transition-all relative ${
            !isCodAllowed
              ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed'
              : paymentMethod === 'COD'
              ? 'border-black bg-white shadow-xs cursor-pointer'
              : 'border-gray-200 hover:border-gray-300 bg-white cursor-pointer'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded flex items-center justify-center font-bold text-xs ${
                isCodAllowed ? 'bg-emerald-700 text-white' : 'bg-gray-400 text-white'
              }`}>
                <Banknote size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-gray-900">Cash on Delivery (COD)</span>
                  {!config.codEnabled ? (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      DISABLED BY STORE
                    </span>
                  ) : subtotal > config.codMaxLimit ? (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      MAX LIMIT EXCEEDED
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {!config.codEnabled
                    ? 'Cash on Delivery is currently paused for all orders.'
                    : subtotal > config.codMaxLimit
                    ? `COD is available on orders up to ${config.currencySymbol}${config.codMaxLimit}. Please pay online for higher orders.`
                    : 'Pay cash at your doorstep when your order arrives.'}
                </p>
              </div>
            </div>

            {paymentMethod === 'COD' && isCodAllowed && (
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-1" />
            )}
          </div>

          {paymentMethod === 'COD' && isCodAllowed && (
            <div className="mt-3 pt-3 border-t border-gray-200/60 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded">
              <span className="font-bold">Note:</span> Please keep exact cash amount ready at the time of delivery.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
