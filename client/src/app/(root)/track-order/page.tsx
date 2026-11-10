'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Copy,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  Loader2,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { shipmentsApi, BackendShipment } from '@/lib/api/shipments';
import { toast } from 'sonner';

export default function TrackOrderPage() {
  const [trackingInput, setTrackingInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [shipmentResult, setShipmentResult] = useState<BackendShipment | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = trackingInput.trim();
    if (!query) {
      toast.error('Please enter your Order ID or AWB Tracking Number');
      return;
    }

    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);

    try {
      const data = await shipmentsApi.trackShipment(query);
      if (data) {
        setShipmentResult(data);
      } else {
        setShipmentResult(null);
        setSearchError('No active shipment found matching this number.');
      }
    } catch (err: any) {
      setShipmentResult(null);
      setSearchError(
        err?.response?.data?.message ||
          'Could not locate active shipment details for this number. Please verify your order number or AWB.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStepIndex = (status?: string): number => {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 0;
      case 'READY_TO_SHIP':
      case 'CONFIRMED':
        return 1;
      case 'SHIPPED':
      case 'IN_TRANSIT':
        return 2;
      case 'OUT_FOR_DELIVERY':
        return 3;
      case 'DELIVERED':
        return 4;
      default:
        return 1;
    }
  };

  const activeStep = getStatusStepIndex(shipmentResult?.status);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Track Your Order</span>
        </div>
      </div>

      {/* ─── Hero Header & Tracking Input ────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
            Real-Time Logistics
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Track Your Order & Shipment
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            Enter your Order Number (e.g. ORD-...) or Courier AWB Tracking Number to view current
            transit milestones.
          </p>

          {/* Tracking Form */}
          <form onSubmit={handleTrackSubmit} className="mt-8 max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 border border-gray-300 shadow-sm">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Enter Order # or AWB Number"
                  className="w-full h-12 bg-transparent px-4 pl-10 text-xs sm:text-sm font-mono text-gray-900 placeholder:font-sans placeholder:text-gray-500 outline-none"
                />
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-12 px-7 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <Truck size={15} />
                    <span>Track Package</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      <div className="w-[95%] max-w-4xl mx-auto py-10 sm:py-14">
        {/* Results Card */}
        {hasSearched && shipmentResult && (
          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs mb-10 animate-in fade-in duration-200">
            {/* Header info strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                  Shipment Identification
                </span>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {shipmentResult.trackingNumber
                      ? `AWB #${shipmentResult.trackingNumber}`
                      : `Order #${shipmentResult.orderId}`}
                  </h3>
                  {shipmentResult.trackingNumber && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(shipmentResult.trackingNumber!);
                        toast.success('Tracking number copied to clipboard!');
                      }}
                      title="Copy AWB number"
                      className="p-1 text-gray-400 hover:text-black transition-colors cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Courier Partner:{' '}
                  <strong className="text-gray-900 font-semibold">
                    {shipmentResult.courierName || shipmentResult.deliveryPartnerId || 'Shiprocket Express'}
                  </strong>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                  Estimated Arrival
                </span>
                <p className="text-base sm:text-lg font-extrabold text-emerald-700">
                  {shipmentResult.estimatedDeliveryDate
                    ? new Date(shipmentResult.estimatedDeliveryDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Dispatched (In Transit)'}
                </p>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="py-8 border-b border-gray-100">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-gray-200 z-0" />
                <div
                  className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-emerald-600 z-0 transition-all duration-500"
                  style={{ width: `${(activeStep / 4) * 100}%` }}
                />

                {/* Steps */}
                {[
                  { label: 'Order Placed', step: 0 },
                  { label: 'Packed & Booked', step: 1 },
                  { label: 'In Transit', step: 2 },
                  { label: 'Out for Delivery', step: 3 },
                  { label: 'Delivered', step: 4 },
                ].map((s) => {
                  const isDone = activeStep >= s.step;
                  const isCurrent = activeStep === s.step;
                  return (
                    <div key={s.step} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white border-2 border-gray-300 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-emerald-100' : ''}`}
                      >
                        {isDone ? <CheckCircle2 size={16} /> : s.step + 1}
                      </div>
                      <span
                        className={`text-[11px] mt-2 font-semibold text-center hidden sm:block ${
                          isCurrent ? 'text-black font-bold' : isDone ? 'text-gray-700' : 'text-gray-400'
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Scan Activities Timeline */}
            <div className="pt-6">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">
                Milestone Activity History
              </h4>
              {shipmentResult.trackingActivities && shipmentResult.trackingActivities.length > 0 ? (
                <div className="space-y-4 relative pl-4 border-l-2 border-gray-100">
                  {shipmentResult.trackingActivities.map((act, idx) => (
                    <div key={idx} className="relative pl-3">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{act.activity}</p>
                        <span className="text-[11px] font-mono text-gray-500">{act.date}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin size={12} className="text-gray-400" />
                        <span>{act.location}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-100 text-xs text-gray-600 flex items-center gap-2">
                  <Clock size={15} className="text-gray-400 shrink-0" />
                  <span>
                    Your package is registered with the courier. Tracking scans will update as it passes
                    through sorting hubs.
                  </span>
                </div>
              )}

              {/* Courier tracking link */}
              {shipmentResult.trackingNumber && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Need third-party courier details?</span>
                  <a
                    href={`https://shiprocket.co/tracking/${shipmentResult.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    <span>Track on Carrier Website</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Notice */}
        {hasSearched && searchError && (
          <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 mb-10 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5 text-rose-600" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Shipment Not Located</h4>
              <p className="text-xs leading-relaxed">{searchError}</p>
              <p className="text-xs mt-2 text-rose-900 font-medium">
                Tip: Please ensure you entered either the full order number (e.g. &ldquo;ORD-2026-1001&rdquo;) or the
                courier AWB number sent to your SMS/email.
              </p>
            </div>
          </div>
        )}

        {/* ─── Informational Guidance Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <Package size={18} className="text-black" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                Where Can I Find My Tracking Info?
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed list-disc list-inside">
              <li>
                <strong>SMS Dispatch Notification:</strong> Sent to your registered mobile number as soon
                as the package is collected from our warehouse.
              </li>
              <li>
                <strong>Email Confirmation:</strong> Your order confirmation & dispatch emails include the
                direct courier tracking link.
              </li>
              <li>
                <strong>Inside Your YOX Account:</strong> Head to{' '}
                <Link href="/profile/orders" className="font-bold underline text-black">
                  My Orders
                </Link>{' '}
                to view live progress across all your recent purchases.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Signed-In Customer?
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                If you already have a YOX account, you don&apos;t need to manually type tracking codes. All your
                active orders, historical receipts, and return requests are compiled in one dashboard.
              </p>
            </div>
            <Link
              href="/profile/orders"
              className="mt-4 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors w-full sm:w-auto"
            >
              <span>View All My Orders</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ─── Quick Links Strip ──────────────────────────────────────────────── */}
        <div className="mt-10 p-5 bg-gray-50 border border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs">
          <span className="font-medium text-gray-600">Need more assistance with your delivery?</span>
          <div className="flex items-center gap-4">
            <Link href="/shipping" className="font-bold text-gray-900 hover:underline">
              Shipping Policy
            </Link>
            <span>•</span>
            <Link href="/returns-process" className="font-bold text-gray-900 hover:underline">
              Returns Process
            </Link>
            <span>•</span>
            <Link href="/help-centre" className="font-bold text-gray-900 hover:underline">
              Help Centre
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

