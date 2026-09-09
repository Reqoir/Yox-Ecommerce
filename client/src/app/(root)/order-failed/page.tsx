'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  XCircle,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
  Phone,
  Mail,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || searchParams?.get('orderNumber') || '';
  const reason = searchParams?.get('reason') || 'The transaction was cancelled or could not be completed by your bank.';
  const paymentId = searchParams?.get('paymentId') || '';

  const { config } = useStoreSettingsStore();

  return (
    <main className="w-full bg-[#f8fafc] min-h-screen py-10 lg:py-16 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">

        {/* Main Failure Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center relative overflow-hidden mb-6">
          {/* Top Red Accent Stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />

          {/* Red/Amber Warning Icon */}
          <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-inner">
            <XCircle size={44} strokeWidth={2} className="animate-in zoom-in-75 duration-300" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 text-rose-800 uppercase tracking-wider mb-2">
            Payment Incomplete
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Order Payment Failed
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed mb-6">
            We couldn&apos;t complete your payment. Don&apos;t worry—your items are still saved in your shopping bag.
          </p>

          {/* Reason Box */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left text-xs space-y-2 mb-6">
            <div className="flex items-center justify-between text-gray-500 border-b border-gray-200/60 pb-2">
              <span className="font-medium">Status</span>
              <span className="font-bold text-rose-600">FAILED / UNPAID</span>
            </div>

            {orderId && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-gray-900">{orderId}</span>
              </div>
            )}

            {paymentId && (
              <div className="flex justify-between items-center text-gray-700">
                <span>Payment Reference:</span>
                <span className="font-mono text-gray-700">{paymentId}</span>
              </div>
            )}

            <div className="pt-1 text-gray-600 leading-relaxed">
              <span className="font-bold text-gray-800">Reason: </span>
              {reason}
            </div>
          </div>

          {/* Auto Refund Assurance Alert */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 text-left text-xs text-amber-900 flex items-start gap-2.5 mb-6">
            <ShieldAlert size={16} className="text-amber-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-amber-950">Was money deducted from your bank or UPI?</p>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                In rare cases where an amount is debited during a failed transaction, banks automatically reverse the funds back to your source account within <strong>3–5 business days</strong>.
              </p>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/checkout"
              className="flex-1 py-3.5 px-6 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <RefreshCw size={15} />
              <span>Retry Payment</span>
            </Link>

            <Link
              href="/cart"
              className="flex-1 py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
            >
              <ShoppingBag size={15} />
              <span>Return to Cart</span>
            </Link>
          </div>
        </div>

        {/* Common Troubleshooting / Support Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-5 sm:p-6">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2 pb-2 border-b border-gray-100">
            <HelpCircle size={15} className="text-[#1A2E4C]" />
            <span>Common Payment Solutions</span>
          </h3>

          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside mb-5">
            <li>Ensure UPI apps (GPay, PhonePe, Paytm) are updated and have sufficient balance.</li>
            <li>Double-check card expiry dates, CVV, and OTP received from your bank.</li>
            <li>Alternatively, you can choose <strong>Cash on Delivery (COD)</strong> at checkout.</li>
          </ul>

          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-500">
            <span>Need assistance with your order?</span>
            <div className="flex items-center gap-4 text-gray-800 font-semibold">
              <a
                href={`mailto:${config.supportEmail || 'support@yox.com'}`}
                className="hover:text-black flex items-center gap-1.5"
              >
                <Mail size={13} /> {config.supportEmail || 'support@yox.com'}
              </a>
              {config.supportPhone && (
                <a
                  href={`tel:${config.supportPhone}`}
                  className="hover:text-black flex items-center gap-1.5"
                >
                  <Phone size={13} /> {config.supportPhone}
                </a>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A2E4C]" />
        </div>
      }
    >
      <OrderFailedContent />
    </Suspense>
  );
}
