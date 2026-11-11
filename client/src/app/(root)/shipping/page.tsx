'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  PackageCheck,
  CreditCard,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function ShippingPage() {
  const { config } = useStoreSettingsStore();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Shipping & Delivery</span>
        </div>
      </div>

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 mb-3 border border-emerald-200">
              100% Free Shipping Nationwide
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Shipping & Delivery Policy
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              We provide fast, complimentary express shipping on all orders across India. Zero hidden shipping
              charges, zero delivery fees, and automated courier routing for prompt doorstep arrival.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Core Delivery Highlights ────────────────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mb-4">
              <Truck size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">100% Free Shipping</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Every single order on YOX qualifies for free delivery nationwide. No minimum purchase threshold,
              no hidden fees, and zero shipping charges added at checkout.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="w-12 h-12 bg-gray-50 border border-gray-200 text-gray-900 flex items-center justify-center mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Fast Express Dispatch</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Orders are packaged and dispatched with top priority via air and express surface networks.
              Real-time automated courier allocation ensures the quickest route to your doorstep.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Tamper-Proof Packaging</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Every garment is individually inspected, steam-pressed, and packed into our reinforced,
              tamper-evident luxury packaging to guarantee immaculate condition upon arrival.
            </p>
          </div>
        </div>

        {/* ─── Detailed Logistics Information ─────────────────────────────────── */}
        <div className="mt-12 space-y-10">
          {/* Express Logistics Grid */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-1">
              Priority Carrier Network & Fulfillment
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              All orders are fulfilled via Shiprocket, dynamically routing packages through leading courier partners based on pin code efficiency.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Courier Allocation</span>
                <p className="text-sm font-bold text-gray-900 mt-1">Bluedart & Delhivery</p>
                <p className="text-xs text-gray-600 mt-1">Air priority express routing for rapid delivery across serviceable zones.</p>
              </div>

              <div className="p-4 border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Pan-India Reach</span>
                <p className="text-sm font-bold text-gray-900 mt-1">Ekart, DTDC & Xpressbees</p>
                <p className="text-xs text-gray-600 mt-1">Full coverage across 27,000+ pin codes including remote districts.</p>
              </div>

              <div className="p-4 border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Live Tracking</span>
                <p className="text-sm font-bold text-gray-900 mt-1">Automated AWB Milestones</p>
                <p className="text-xs text-gray-600 mt-1">Instant SMS & email alerts with live courier tracking at every stage.</p>
              </div>

              <div className="p-4 border border-gray-200 bg-gray-50/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Zero Surcharges</span>
                <p className="text-sm font-bold text-gray-900 mt-1">100% Free Nationwide</p>
                <p className="text-xs text-gray-600 mt-1">No shipping fees, no handling charges, and zero COD transaction fees.</p>
              </div>
            </div>
          </div>

          {/* Logistics & Order Processing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Order Processing & Dispatch
                  </h3>
                  <p className="text-xs text-gray-500">How we prepare your items</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed divide-y divide-gray-100">
                <li className="pt-2">
                  <strong className="text-gray-900">Same-Day Processing:</strong> Orders placed before
                  1:00 PM IST on working days are verified, picked, and packed on the same day.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Dispatch Notification:</strong> Once your package is
                  handed over to the courier partner, an automated SMS and email containing your official AWB
                  tracking link will be dispatched immediately.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Sundays & Public Holidays:</strong> Warehouse
                  dispatches operate Monday through Saturday. Orders placed on Sundays or public holidays
                  ship the following business morning.
                </li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                    Cash on Delivery (COD) Terms
                  </h3>
                  <p className="text-xs text-gray-500">Transparent payment rules</p>
                </div>
              </div>

              <ul className="space-y-3 text-xs sm:text-sm text-gray-600 leading-relaxed divide-y divide-gray-100">
                <li className="pt-2">
                  <strong className="text-gray-900">Zero COD Convenience Surcharge:</strong> We do not
                  levy any extra payment gateway fee or surcharge on Cash on Delivery orders.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Cash & UPI at Doorstep:</strong> Most delivery
                  executives support QR code / UPI collection at the doorstep in addition to cash.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">3 Delivery Attempts:</strong> Our courier partners
                  will make up to 3 delivery attempts before returning the shipment to our warehouse.
                </li>
              </ul>
            </div>
          </div>

          {/* Delivery Inspection & Damaged Shipments */}
          <div className="bg-amber-50/70 border border-amber-200/80 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle size={24} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Parcel Acceptance & Tamper Policy
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  Please do not accept any parcel if the outer seal is visibly broken, tampered with, or
                  re-taped with generic tape. If you encounter any issue upon delivery, please contact our
                  customer care team immediately at{' '}
                  <a
                    href={`mailto:${config.supportEmail || 'support@yoxfashion.in'}`}
                    className="font-bold underline text-black"
                  >
                    {config.supportEmail || 'support@yoxfashion.in'}
                  </a>{' '}
                  or call{' '}
                  <a
                    href={`tel:${config.supportPhone || '1800-123-1444'}`}
                    className="font-bold underline text-black"
                  >
                    {config.supportPhone || '1800-123-1444'}
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>

          {/* Quick FAQ Shortcuts */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-gray-700" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Have Questions or Need to Cancel?
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Explore our detailed FAQs for instant answers on shipping, order cancellation, returns, and refunds.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <Link
                href="/help-centre#shipping"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Shipping FAQs</span>
                <ArrowRight size={13} />
              </Link>
              <Link
                href="/help-centre#cancellation"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-900 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Cancellation FAQs</span>
              </Link>
              <Link
                href="/track-order"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-900 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Track Order</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
