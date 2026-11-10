'use client';

import React from 'react';
import Link from 'next/link';
import {
  Truck,
  Clock,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ArrowRight,
  PackageCheck,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function ShippingPage() {
  const { config } = useStoreSettingsStore();

  const freeThreshold = config.freeShippingThreshold ?? 999;
  const standardFee = config.standardShippingFee ?? 99;
  const currency = config.currencySymbol || '₹';

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
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
              Reliable Logistics
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Shipping & Delivery
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              We partner with premier courier networks to deliver contemporary menswear safely,
              swiftly, and securely to 27,000+ pin codes across India.
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
            <h3 className="text-base font-bold text-gray-900">Free Express Shipping</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Enjoy complimentary shipping on all orders over{' '}
              <strong className="text-gray-900 font-semibold">
                {currency}
                {freeThreshold}
              </strong>
              . A nominal fee of {currency}
              {standardFee} applies to orders below this amount.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="w-12 h-12 bg-gray-50 border border-gray-200 text-gray-900 flex items-center justify-center mb-4">
              <Clock size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Fast Turnaround</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Most metro deliveries arrive within <strong>2–3 business days</strong>. Rest of India
              orders are delivered within <strong>4–6 business days</strong> from dispatch.
            </p>
          </div>

          <div className="bg-white border border-gray-200 p-6 sm:p-7 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center mb-4">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-base font-bold text-gray-900">Tamper-Proof Packaging</h3>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              Every garment is carefully folded, steam-pressed, and encased in our branded,
              tamper-evident luxury packaging to ensure pristine arrival.
            </p>
          </div>
        </div>

        {/* ─── Detailed Policies & Information ───────────────────────────────── */}
        <div className="mt-12 space-y-10">
          {/* Timelines Table */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide mb-1">
              Estimated Delivery Timelines
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Timelines are calculated from the moment your order is verified and dispatched from our
              central warehouse.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-800 font-bold uppercase text-[11px] tracking-wider">
                    <th className="py-3 px-4">Region / Zone</th>
                    <th className="py-3 px-4">Estimated Transit</th>
                    <th className="py-3 px-4">Courier Partner</th>
                    <th className="py-3 px-4">Service Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-600">
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      Tier 1 Metros (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata)
                    </td>
                    <td className="py-3.5 px-4">2 – 3 Business Days</td>
                    <td className="py-3.5 px-4">Bluedart / Delhivery Express</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Air Priority</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      Tier 2 & Capital Cities (Pune, Ahmedabad, Jaipur, Kochi, Chandigarh, Lucknow)
                    </td>
                    <td className="py-3.5 px-4">3 – 4 Business Days</td>
                    <td className="py-3.5 px-4">Delhivery / Xpressbees / Ekart</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Standard Surface / Air</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-gray-900">
                      Rest of India & Remote Districts
                    </td>
                    <td className="py-3.5 px-4">4 – 6 Business Days</td>
                    <td className="py-3.5 px-4">DTDC / Ekart / India Post EMS</td>
                    <td className="py-3.5 px-4 text-gray-700 font-medium">Standard Surface</td>
                  </tr>
                </tbody>
              </table>
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
                  1:00 PM IST on business days are processed and packed on the same day.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Dispatch Notification:</strong> Once your package is
                  handed over to the courier partner, an automated SMS and email containing your AWB
                  tracking link will be dispatched immediately.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Sundays & Public Holidays:</strong> Warehouse
                  dispatches operate Monday through Saturday. Orders placed on Sundays or gazetted
                  holidays ship the following business morning.
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
                  levy any extra payment gateway fee on Cash on Delivery orders.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Cash & UPI at Doorstep:</strong> Most courier
                  partners offer digital QR / UPI collection at the doorstep in addition to cash.
                </li>
                <li className="pt-2">
                  <strong className="text-gray-900">Pre-Dispatch Verification:</strong> High-value COD
                  orders may receive a quick automated OTP verification or call to prevent spurious
                  shipments.
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
                  re-taped with generic tape. If the delivery executive insists, please record an unboxing
                  video and contact our support concierge immediately at{' '}
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

          {/* Quick Action Navigation */}
          <div className="bg-white border border-gray-200 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Looking for your current shipment?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Enter your order ID or tracking code to check real-time courier transit milestones.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href="/track-order"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Track Your Order</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/returns-process"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-bold uppercase tracking-wider transition-colors"
              >
                <span>Returns Process</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
