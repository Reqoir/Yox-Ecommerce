'use client';

import React from 'react';
import Link from 'next/link';
import {
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  Camera,
  Package,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function ReturnsProcessPage() {
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
          <span className="text-gray-900 font-medium">Returns Process</span>
        </div>
      </div>

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
              Customer First
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Returns & Exchanges Process
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              We make returns effortless. If an item doesn&apos;t fit your style or expectation, you have{' '}
              <strong className="text-black font-bold">{returnWindowDays} days</strong> from delivery to
              request a doorstep pickup and 100% full refund or size exchange.
            </p>
          </div>
        </div>
      </section>

      {/* ─── 4-Step Visual Journey ───────────────────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Simple 4-Step Journey
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
            How Your Return Works From Start To Finish
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-white bg-black px-2.5 py-1">
                  STEP 01
                </span>
                <Camera size={20} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Initiate In &ldquo;My Orders&rdquo;</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Log in to your YOX account, open your order details, select the product, choose your return
                reason, and upload 3 clear photos of the item and its tags.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
              Takes less than 2 minutes online
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-white bg-black px-2.5 py-1">
                  STEP 02
                </span>
                <FileCheck2 size={20} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Instant Verification</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Our logistics system reviews the submission and automatically books a reverse courier pickup
                via Shiprocket within 24 hours of approval.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-[11px] text-emerald-700 font-semibold">
              Reverse AWB dispatched to SMS
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-white bg-black px-2.5 py-1">
                  STEP 03
                </span>
                <Truck size={20} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Free Doorstep Pickup</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                A courier executive arrives at your doorstep to pick up the parcel. Keep the item packed
                neatly with original brand tags attached. Zero pickup charges!
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-[11px] text-gray-500 font-medium">
              100% Free Doorstep Collection
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white border border-gray-200 p-6 shadow-xs relative flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-white bg-black px-2.5 py-1">
                  STEP 04
                </span>
                <ShieldCheck size={20} className="text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Fast Refund / Exchange</h3>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                Upon quick warehouse quality check, your refund is credited within 24–48 hours (to original
                payment card/UPI or NEFT for COD), or your replacement size ships immediately.
              </p>
            </div>
            <div className="mt-5 pt-4 border-t border-gray-100 text-[11px] text-emerald-700 font-semibold">
              Instant Bank / UPI Transfer
            </div>
          </div>
        </div>

        {/* ─── Ready to Return Banner CTA ────────────────────────────────────── */}
        <div className="mt-12 bg-black text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg sm:text-xl font-bold">Have an item you want to return or exchange?</h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">
              You can initiate a return or size exchange directly from your account. No emails or phone calls
              required!
            </p>
          </div>
          <Link
            href="/profile/orders"
            className="px-7 py-3.5 bg-white hover:bg-gray-100 text-black text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-xs inline-flex items-center gap-2"
          >
            <span>Go to My Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* ─── Return Readiness Checklist ─────────────────────────────────────── */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Items Accepted For Return
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                <span>
                  Items in pristine, unworn, and unwashed condition with no perfume, stains, or markings.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                <span>
                  Original brand tags, size labels, spare buttons, and barcode tags must remain attached.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                <span>
                  Shipped back in the original polybag or brand protective box whenever possible.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
                <span>
                  Return requested within the active <strong>{returnWindowDays}-day window</strong> from the
                  date of confirmed delivery.
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <AlertCircle size={20} className="text-rose-600" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Items Not Eligible For Return
              </h3>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-gray-600">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                <span>Garments that have been tailored, altered, washed, or worn outdoors.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                <span>Items with missing original brand tags or severed price tickets.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                <span>Personal hygiene categories such as innerwear, briefs, and socks.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mt-2 shrink-0" />
                <span>Items specifically marked as &ldquo;Final Clearance&rdquo; at the time of purchase.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Return Process FAQs ────────────────────────────────────────────── */}
        <div className="mt-14 bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide mb-6">
            Frequently Asked Questions About Returns
          </h2>

          <div className="divide-y divide-gray-100 text-xs sm:text-sm">
            <div className="py-4 first:pt-0">
              <h4 className="font-bold text-gray-900 mb-1">
                How many attempts will the courier make for reverse pickup?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                The courier will make up to 3 pickup attempts. You will receive an SMS alert with the
                courier executive&apos;s details on the day of scheduled pickup.
              </p>
            </div>

            <div className="py-4">
              <h4 className="font-bold text-gray-900 mb-1">
                What if I paid via Cash on Delivery (COD)? How will I get my refund?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                When you initiate a return for a COD order, you will be prompted to provide your bank account
                details (Account Number, IFSC, Account Holder Name). Once the returned product is verified,
                the refund is transferred directly to your bank account via IMPS/NEFT within 24–48 hours.
              </p>
            </div>

            <div className="py-4">
              <h4 className="font-bold text-gray-900 mb-1">
                Can I exchange an item for a different size instead of a refund?
              </h4>
              <p className="text-gray-600 leading-relaxed">
                Yes! When submitting a return request, select &ldquo;Exchange for different size&rdquo;. As soon as
                the pickup is scheduled, we reserve the replacement size and ship it directly to you.
              </p>
            </div>

            <div className="py-4 last:pb-0">
              <h4 className="font-bold text-gray-900 mb-1">
                Read our complete legal return terms:
              </h4>
              <p className="text-gray-600 leading-relaxed">
                For detailed legal terms, conditions, and special circumstances, please view our full{' '}
                <Link
                  href="/returns-exchange-policy"
                  className="font-bold text-black underline hover:text-emerald-700 transition-colors"
                >
                  Returns and Exchange Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

