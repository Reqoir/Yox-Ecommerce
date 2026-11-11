'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  LogIn,
  ShoppingBag,
  Info,
} from 'lucide-react';
import { shipmentsApi, BackendShipment } from '@/lib/api/shipments';
import { ordersApi, BackendOrder } from '@/lib/api/orders';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

function TrackOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const { isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  const [trackingInput, setTrackingInput] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [shipmentResult, setShipmentResult] = useState<BackendShipment | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<BackendOrder[]>([]);

  // Active orders (exclude cancelled from active list)
  const activeOrders = userOrders.filter((o) => o.orderStatus !== 'CANCELLED');

  const trackMatchedOrder = async (order: BackendOrder, _queryUsed?: string) => {
    setIsLoading(true);
    setSearchError(null);
    setHasSearched(true);
    setSelectedOrder(order);
    setTrackingInput(order.orderNumber);

    try {
      // ONLY hit shipments API when the order is verified to belong to the authenticated user
      const data = await shipmentsApi.trackShipment(order.orderNumber);
      if (data) {
        setShipmentResult(data);
      } else {
        setShipmentResult(null);
        setSearchError('Tracking information is being prepared by the carrier.');
      }
    } catch (err: any) {
      setShipmentResult(null);
      setSearchError(
        err?.response?.data?.message ||
          'Could not retrieve live tracking details. Your package is scheduled with the courier.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch active user orders if authenticated
  useEffect(() => {
    if (!mounted || !isAuthenticated) {
      setIsLoadingOrders(false);
      return;
    }

    let isSubscribed = true;
    setIsLoadingOrders(true);

    ordersApi
      .getMyOrders(1, 20)
      .then((res) => {
        if (!isSubscribed) return;
        const fetched = res.orders || [];
        setUserOrders(fetched);

        // If an initial query was passed in URL (?q=...), verify and track immediately
        if (initialQuery.trim()) {
          const cleanQ = initialQuery.trim().toLowerCase();
          const matched = fetched.find(
            (o) =>
              o.orderNumber.toLowerCase() === cleanQ ||
              o.id.toLowerCase() === cleanQ
          );

          if (matched) {
            trackMatchedOrder(matched, initialQuery.trim());
          } else {
            setHasSearched(true);
            setSearchError(
              `No active order matching "${initialQuery.trim()}" was found in your account.`
            );
          }
        }
      })
      .catch((err) => {
        console.warn('Notice loading user orders for tracking:', err?.message || err);
      })
      .finally(() => {
        if (isSubscribed) setIsLoadingOrders(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [mounted, isAuthenticated, initialQuery]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please log in to track your order');
      const dest = trackingInput.trim()
        ? `/track-order?q=${encodeURIComponent(trackingInput.trim())}`
        : '/track-order';
      router.push(`/login?callbackUrl=${encodeURIComponent(dest)}`);
      return;
    }

    const query = trackingInput.trim();
    if (!query) {
      toast.error('Please enter your Order ID or AWB Tracking Number');
      return;
    }

    // CHECK: Does the user have any active orders matching this query?
    // If not matching, DO NOT HIT THE THIRDPARTY COURIER API
    const cleanQ = query.toLowerCase();
    const matched = userOrders.find(
      (o) =>
        o.orderNumber.toLowerCase() === cleanQ ||
        o.id.toLowerCase() === cleanQ
    );

    if (!matched) {
      setHasSearched(true);
      setShipmentResult(null);
      setSelectedOrder(null);
      if (activeOrders.length === 0) {
        setSearchError(
          'You currently have no active orders in your account. Third-party tracking is only available for your authorized orders.'
        );
      } else {
        setSearchError(
          `No order matching "${query}" was found in your account. Please select an order from your active orders list below.`
        );
      }
      return;
    }

    // Verified: Order belongs to this user. Now proceed to track:
    await trackMatchedOrder(matched, query);
  };

  const getStatusStepIndex = (status?: string): number => {
    switch (status?.toUpperCase()) {
      case 'PLACED':
      case 'PENDING':
        return 0;
      case 'READY_TO_SHIP':
      case 'CONFIRMED':
      case 'PACKED':
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

  const activeStep = getStatusStepIndex(
    shipmentResult?.status || selectedOrder?.orderStatus
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

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
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 mb-3 border border-emerald-200">
            Real-Time Courier Milestones
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Track Your Order & Shipment
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-lg mx-auto">
            {isAuthenticated
              ? 'Select from your active orders below or enter your Order ID to view real-time transit milestones.'
              : 'Please sign in to view real-time courier tracking milestones for your active orders.'}
          </p>

          {/* If Authenticated: Search Bar */}
          {isAuthenticated ? (
            <form onSubmit={handleTrackSubmit} className="mt-8 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-2 bg-white p-2 border border-gray-300 shadow-sm">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="Enter Order # (e.g. YOX-2026-XXXXXX)"
                    className="w-full h-12 bg-transparent px-4 pl-10 text-xs sm:text-sm font-mono text-gray-900 placeholder:font-sans placeholder:text-gray-500 outline-none"
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isLoadingOrders}
                  className="h-12 px-7 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer shrink-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Tracking...</span>
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
          ) : (
            /* If Not Authenticated: Sign-in CTA Card */
            <div className="mt-8 max-w-md mx-auto p-6 sm:p-8 bg-gray-50 border border-gray-200 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center mx-auto shadow-xs">
                <LogIn size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Sign In Required to Track
                </h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                  To view live courier milestones, protect customer privacy, and verify active orders, you must be signed in to your account.
                </p>
              </div>

              <Link
                href={
                  initialQuery.trim()
                    ? `/login?callbackUrl=${encodeURIComponent(
                        `/track-order?q=${encodeURIComponent(initialQuery.trim())}`
                      )}`
                    : '/login?callbackUrl=/track-order'
                }
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
              >
                <LogIn size={14} />
                <span>Sign In to Track Orders</span>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ─── Main Content Area ──────────────────────────────────────────────── */}
      <div className="w-[95%] max-w-4xl mx-auto py-10 sm:py-14">
        {/* If Authenticated: Active Orders Selector */}
        {isAuthenticated && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <Package size={16} />
                <span>Your Active Orders ({activeOrders.length})</span>
              </h3>
              <Link
                href="/profile/orders"
                className="text-xs font-semibold text-gray-500 hover:text-black transition-colors"
              >
                View All Orders →
              </Link>
            </div>

            {isLoadingOrders ? (
              <div className="p-8 border border-gray-200 bg-gray-50/50 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span>Checking your active orders...</span>
              </div>
            ) : activeOrders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeOrders.map((order) => {
                  const isCurrent =
                    selectedOrder?.id === order.id ||
                    trackingInput.trim().toLowerCase() ===
                      order.orderNumber.toLowerCase();

                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => trackMatchedOrder(order)}
                      className={`p-4 border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isCurrent
                          ? 'border-black bg-neutral-900 text-white shadow-xs'
                          : 'border-gray-200 bg-white hover:border-gray-400 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-mono text-xs font-bold ${
                            isCurrent ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 ${
                            isCurrent
                              ? 'bg-emerald-500 text-black'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px]">
                        <span className={isCurrent ? 'text-gray-300' : 'text-gray-500'}>
                          {order.placedAt
                            ? new Date(order.placedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent Order'}
                        </span>
                        <span
                          className={`font-bold ${
                            isCurrent ? 'text-emerald-300' : 'text-gray-900'
                          }`}
                        >
                          ₹{order.totalAmount.toLocaleString()}
                        </span>
                      </div>

                      <div
                        className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[10px] font-bold uppercase tracking-wider ${
                          isCurrent
                            ? 'border-neutral-800 text-emerald-400'
                            : 'border-gray-100 text-gray-600'
                        }`}
                      >
                        <span>{isCurrent ? 'Currently Viewing' : 'Track This Order'}</span>
                        <ArrowRight size={11} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* User is logged in but has no active orders: DO NOT HIT 3RD PARTY API */
              <div className="p-8 border border-gray-200 bg-gray-50/70 text-center space-y-3">
                <ShoppingBag size={32} className="mx-auto text-gray-400" />
                <h4 className="text-sm font-bold text-gray-900">
                  No Active Orders Found
                </h4>
                <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
                  You do not have any active orders under your account right now. Live courier tracking milestones will automatically appear here once you place an order.
                </p>
                <div className="pt-2">
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    <span>Explore Products</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Card */}
        {hasSearched && shipmentResult && (
          <div className="bg-white border border-gray-200 p-6 sm:p-8 shadow-xs mb-10 animate-in fade-in duration-200">
            {/* Header info strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-100 gap-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                  Shipment Verification
                </span>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-900">
                    {shipmentResult.trackingNumber
                      ? `AWB #${shipmentResult.trackingNumber}`
                      : `Order #${selectedOrder?.orderNumber || shipmentResult.orderId}`}
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
                    {shipmentResult.courierName ||
                      shipmentResult.deliveryPartnerId ||
                      'Priority Express Logistics'}
                  </strong>
                </p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block mb-0.5">
                  Delivery Status
                </span>
                <p className="text-base sm:text-lg font-extrabold text-emerald-700">
                  {shipmentResult.status === 'DELIVERED'
                    ? 'Delivered'
                    : shipmentResult.estimatedDeliveryDate
                    ? `Estimated: ${new Date(
                        shipmentResult.estimatedDeliveryDate
                      ).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}`
                    : shipmentResult.status || 'In Transit'}
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
                          isCurrent
                            ? 'text-black font-bold'
                            : isDone
                            ? 'text-gray-700'
                            : 'text-gray-400'
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
              {shipmentResult.trackingActivities &&
              shipmentResult.trackingActivities.length > 0 ? (
                <div className="space-y-4 relative pl-4 border-l-2 border-gray-100">
                  {shipmentResult.trackingActivities.map((act, idx) => (
                    <div key={idx} className="relative pl-3">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          {act.activity}
                        </p>
                        <span className="text-[11px] font-mono text-gray-500">
                          {act.date}
                        </span>
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
                    Your package is registered with the courier network. Tracking scans will update as it passes through sorting hubs.
                  </span>
                </div>
              )}

              {/* Carrier Direct Link if AWB exists */}
              {shipmentResult.trackingNumber && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Direct courier tracking link:</span>
                  <a
                    href={`https://shiprocket.co/tracking/${shipmentResult.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                  >
                    <span>View on Carrier Portal</span>
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
              <h4 className="text-sm font-bold">Unable to Track</h4>
              <p className="text-xs leading-relaxed">{searchError}</p>
              <p className="text-xs mt-2 text-rose-900 font-medium">
                Tip: You can only track active orders belonging to your verified account. Please select an order from the list above or check your order history under Profile &gt; My Orders.
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
                Where Can I Find My Order Details?
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed list-disc list-inside">
              <li>
                <strong>Inside Your YOX Account:</strong> Visit{' '}
                <Link href="/profile/orders" className="font-bold underline text-black">
                  My Orders
                </Link>{' '}
                to view live progress across all your purchases.
              </li>
              <li>
                <strong>SMS Dispatch Notification:</strong> Sent to your registered mobile number upon courier handover.
              </li>
              <li>
                <strong>Order Confirmation Email:</strong> Contains your order invoice and tracking number.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 p-6 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                  Account Protected Tracking
                </h3>
              </div>
              <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                To prevent unauthorized lookups, shipment tracking is restricted to logged-in customers with verified active orders.
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

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
