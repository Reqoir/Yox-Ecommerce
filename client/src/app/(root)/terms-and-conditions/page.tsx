'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  Scale,
  ShoppingBag,
  ChevronRight,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function TermsAndConditionsPage() {
  const { config } = useStoreSettingsStore();
  const returnWindowDays = config.returnWindowDays ?? 7;

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Terms and Conditions</span>
        </div>
      </div>

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
              User Agreement
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Terms & Conditions
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              These terms govern your access to and use of the YOX digital storefront, services, customer accounts, and retail transactions.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Policy Highlights Cards ─────────────────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <ShoppingBag size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">100% Authentic</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Directly crafted & certified garments</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Transparent Pricing</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">All taxes & duties clearly displayed</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <FileText size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">{returnWindowDays}-Day Returns</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Hassle-free doorstep returns & exchanges</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <Scale size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Governing Law</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Subject to laws of India</p>
          </div>
        </div>

        {/* ─── Formal Policy Sections ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 divide-y divide-gray-200 shadow-xs">
          {/* Section 1 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">01</span>
              <span>Acceptance of Terms</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              By accessing this website, creating an account via mobile phone verification, browsing product catalogs, or placing an order, you agree to comply with and be bound by these Terms and Conditions along with our Privacy Policy and Returns & Exchange Policy.
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">02</span>
              <span>Account Registration & Phone Verification</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              YOX employs passwordless mobile phone authentication for seamless security. You agree to provide a valid, active 10-digit mobile phone number that belongs to you. You are solely responsible for maintaining access to your mobile device and OTP verification codes.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">03</span>
              <span>Product Pricing, Descriptions & Availability</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We make every effort to display garment colors, weaves, cuts, and sizing specifications with maximum accuracy. However, slight variations may occur due to device display color calibrations. Prices are listed in Indian Rupees (INR) and are inclusive of all applicable statutory GST.
            </p>
          </div>

          {/* Section 4 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">04</span>
              <span>Orders, Payments & Acceptance</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Receipt of an order confirmation does not signify our final acceptance of an order. We reserve the right to cancel or limit quantities on any order in cases of pricing discrepancies, inventory shortages, or suspected fraudulent activity. If your prepaid order is cancelled, a full refund is processed immediately to your original payment source.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">05</span>
              <span>Shipping, Delivery & Risk of Loss</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We provide free standard shipping across all serviceable pin codes nationwide. Delivery timelines depend on courier partner routing. Title and risk of loss for items pass to you upon successful delivery confirmed by courier OTP or recipient signature.
            </p>
          </div>

          {/* Section 6 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">06</span>
              <span>Returns, Exchanges & Cancellations</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              All purchases are covered under our comprehensive {returnWindowDays}-day returns and exchange policy. Returned garments must remain unworn, unwashed, and in their original packaging with all brand tags intact. For complete instructions, please consult our dedicated <Link href="/returns-exchange-policy" className="underline text-black font-semibold">Returns & Exchange Policy</Link>.
            </p>
          </div>

          {/* Section 7 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">07</span>
              <span>Intellectual Property</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              All content on this website—including logos, product imagery, visual assets, text, typography, and website layouts—is the proprietary property of YOX Men&apos;s Fashion and is protected under applicable intellectual property laws. Unauthorized reproduction or commercial use is strictly prohibited.
            </p>
          </div>

          {/* Section 8 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">08</span>
              <span>Governing Law & Dispute Resolution</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              These terms shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute or claim arising out of or in connection with transactions on this platform shall be subject to the exclusive jurisdiction of the competent courts of India.
            </p>
          </div>
        </div>

        {/* ─── Contact Support Banner ───────────────────────────────────────── */}
        <div className="mt-12 bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Questions regarding our terms or store policies?
            </h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Reach out to our customer experience team for prompt assistance.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {config.supportPhone && (
              <a
                href={`tel:${config.supportPhone}`}
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone size={14} />
                <span>Call Support</span>
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

