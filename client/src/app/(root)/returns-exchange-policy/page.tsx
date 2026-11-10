'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ChevronRight,
  ArrowRight,
  Phone,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function ReturnsExchangePolicyPage() {
  const { config } = useStoreSettingsStore();
  const returnWindowDays = config.returnWindowDays ?? 7;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Returns and Exchange Policy</span>
        </div>
      </div>

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
              Legal & Policy
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Returns, Exchange & Refund Policy
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              We stand behind every garment we craft. Our returns and exchange policy is designed to be
              transparent, straightforward, and respectful of your time.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Policy Highlights Cards ─────────────────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-black block mb-1">
              {returnWindowDays} Days
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Return Window</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">From confirmed delivery date</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block mb-1">
              100% Free
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Doorstep Pickup</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Zero reverse logistics fee</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-black block mb-1">
              1-Time
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Free Size Exchange</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Priority dispatch for size fits</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 block mb-1">
              24–48 Hrs
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Refund Processing</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Direct to Bank / Original Mode</p>
          </div>
        </div>

        {/* ─── Formal Policy Sections ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 divide-y divide-gray-200 shadow-xs">
          {/* Section 1: Overview */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">01</span>
              <span>Overview & Scope</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              This policy governs all purchases made through <strong>yoxfashion.in</strong>. If you are
              not completely satisfied with your order, you may request a return or exchange within{' '}
              <strong>{returnWindowDays} calendar days</strong> of receiving your delivery. We offer free
              reverse pickups from the original shipping address.
            </p>
          </div>

          {/* Section 2: Eligibility */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">02</span>
              <span>Conditions for Returns and Exchanges</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              To be eligible for an exchange or full refund, returned merchandise must satisfy the
              following criteria upon arrival at our fulfillment center:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-600 list-disc list-inside">
              <li>
                <strong>Pristine Condition:</strong> The garment must be unworn, unwashed, unaltered, and
                free from cologne, deodorant, body odors, pet hair, or any markings.
              </li>
              <li>
                <strong>Original Tags Intact:</strong> All security tags, brand labels, fabric composition
                hangtags, and price tags must remain firmly attached in their original placement.
              </li>
              <li>
                <strong>Original Packaging:</strong> Garments should be folded and placed back in the
                original branded polybag with all included dust bags, belts, or spare buttons intact.
              </li>
              <li>
                <strong>Proof of Purchase:</strong> The digital order invoice or order number must be
                provided when raising the return request.
              </li>
            </ul>
          </div>

          {/* Section 3: Non-Returnable Items */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">03</span>
              <span>Non-Returnable & Final Sale Items</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              For hygiene, health, and personalized craftsmanship reasons, certain categories cannot be
              returned or exchanged once delivered:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
              <div className="p-3 bg-gray-50 border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Undergarments, briefs, and boxers</span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Socks, caps, and bandanas</span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Custom altered or tailored garments</span>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Items marked as &ldquo;Final Clearance&rdquo;</span>
              </div>
            </div>
          </div>

          {/* Section 4: Exchange Policy */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">04</span>
              <span>Exchanges For Sizing</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Need a smaller or larger size? We offer <strong>complimentary size exchanges</strong>. When
              you select &ldquo;Exchange&rdquo; in your order dashboard, we instantly reserve the desired size from our
              inventory. Once the reverse courier pickup is booked or verified, your replacement unit will be
              dispatched without any additional delivery fees.
            </p>
          </div>

          {/* Section 5: Refund Methods */}
          <div className="p-6 sm:p-8 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">05</span>
              <span>Refund Timelines & Payout Methods</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Refunds are processed promptly after the returned merchandise undergoes physical quality check
              (QC) at our fulfillment facility:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 bg-gray-50/60 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase">Prepaid Orders (Cards, UPI, Netbanking)</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Refunds are reversed directly to the original bank account, card, or UPI VPA within{' '}
                  <strong>3–5 business days</strong> from QC approval, depending on your card issuer&apos;s
                  settlement cycle.
                </p>
              </div>

              <div className="p-4 border border-gray-200 bg-gray-50/60 space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase">Cash on Delivery (COD) Orders</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Refunds are sent via direct <strong>IMPS / NEFT bank transfer</strong> to the bank details
                  you provide when initiating the return request. Transfers are executed within{' '}
                  <strong>24–48 hours</strong> of verification.
                </p>
              </div>
            </div>
          </div>

          {/* Section 6: Damaged or Defective Deliveries */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">06</span>
              <span>Damaged, Defective, or Incorrect Deliveries</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              While our quality control inspectors inspect every item before packaging, if you receive a
              damaged, defective, or incorrect piece, please notify us within <strong>48 hours</strong> of
              delivery with photos. We will immediately schedule a priority doorstep collection and dispatch
              a brand-new replacement at zero cost.
            </p>
          </div>

          {/* Section 7: Cancellation Policy */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">07</span>
              <span>Order Cancellation</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              You can cancel any order directly from your order management dashboard as long as the status is{' '}
              <strong>&ldquo;PLACED&rdquo;</strong> or <strong>&ldquo;CONFIRMED&rdquo;</strong>. Once an order is packed and assigned
              a courier AWB for dispatch, cancellations can no longer be processed online; you may simply
              refuse delivery when the courier executive arrives or initiate a return upon receipt.
            </p>
          </div>
        </div>

        {/* ─── Contact Concierge Banner ───────────────────────────────────────── */}
        <div className="mt-12 bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Need assistance with an existing return or refund?
            </h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Our support team is available 7 days a week to help resolve queries.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {config.supportPhone && (
              <a
                href={`tel:${config.supportPhone}`}
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone size={14} />
                <span>Call Concierge</span>
              </a>
            )}
            <Link
              href="/help-centre"
              className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} />
              <span>Help Centre</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

