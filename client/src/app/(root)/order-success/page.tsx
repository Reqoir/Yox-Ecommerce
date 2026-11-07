'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Package,
  ShoppingBag,
  ArrowRight,
  Printer,
  Truck,
  MapPin,
  CreditCard,
  Banknote,
  ShieldCheck,
  Calendar,
  Phone,
  Loader2,
  ExternalLink,
  FileText,
  X,
} from 'lucide-react';
import { ordersApi, BackendOrder } from '@/lib/api/orders';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { PrintableInvoice } from '@/components/features/orders/PrintableInvoice';

function OrderSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderIdParam = searchParams?.get('orderId') || searchParams?.get('orderNumber') || '';

  const { lastOrderDetails, resetCheckout } = useCheckoutStore();
  const { config } = useStoreSettingsStore();

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderIdParam));
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchOrderData() {
      if (!orderIdParam) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedOrder = await ordersApi.getOrderById(orderIdParam);
        if (isMounted && fetchedOrder) {
          setOrder(fetchedOrder);
        }
      } catch (err) {
        console.error('Failed to load order for success page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrderData();

    return () => {
      isMounted = false;
    };
  }, [orderIdParam]);

  // If loading order details from server
  if (loading) {
    return (
      <main className="w-full min-h-[75vh] flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A2E4C]" />
          <p className="text-sm font-semibold text-gray-700">Loading your order confirmation...</p>
        </div>
      </main>
    );
  }

  // Fallback to store details if direct fetch isn't available
  const orderNumber = order?.orderNumber || lastOrderDetails?.orderId || orderIdParam || 'YOX-ORDER';
  const totalAmount = order?.totalAmount ?? lastOrderDetails?.total ?? 0;
  const paymentMethod = order?.paymentMethod || lastOrderDetails?.paymentMethod || 'RAZORPAY';
  const isOnlinePayment = paymentMethod === 'RAZORPAY';
  const paymentStatus = order?.paymentStatus || (isOnlinePayment ? 'PAID' : 'PENDING');
  const items = order?.items || [];
  const address = order?.shippingAddress;

  // Delivery estimation (prioritizes live Shiprocket delivery date)
  const deliveryDays = config.estimatedDeliveryDaysMax || 4;
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  const formattedDeliveryDate = order?.estimatedDeliveryDate
    ? new Date(order.estimatedDeliveryDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : lastOrderDetails?.deliveryDate ||
      deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <main className="w-full bg-[#f8fafc] min-h-screen py-8 lg:py-12 px-4 sm:px-6 print:bg-white print:py-0 print:px-0">
      <div className="max-w-4xl mx-auto print:hidden">

        {/* Top Header Card */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 sm:p-8 mb-6 text-center relative overflow-hidden">
          {/* Subtle decorative background gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#1A2E4C] via-emerald-600 to-[#1A2E4C]" />

          {/* Green Check Animation */}
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-inner">
            <CheckCircle2 size={44} strokeWidth={2.5} className="animate-in zoom-in-75 duration-300" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-800 uppercase tracking-wider mb-2">
            Order Confirmed
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            Thank you for your order!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto">
            Your order has been received and is now being prepared for shipping. We&apos;ve sent a confirmation email with tracking details.
          </p>

          {/* Key Reference Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 text-left">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Order Number</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#1A2E4C] block truncate">{orderNumber}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Payment Status</span>
              <span className={`text-xs sm:text-sm font-bold block ${
                paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'
              }`}>
                {paymentStatus === 'PAID' ? '✓ Paid Online' : '• Cash on Delivery'}
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Estimated Delivery</span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate">{formattedDeliveryDate}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Total Paid / Due</span>
              <span className="text-xs sm:text-sm font-extrabold text-gray-900 block">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Details: Shipping & Payment Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
              <MapPin size={15} className="text-[#1A2E4C]" />
              <span>Delivery Address</span>
            </div>
            {address ? (
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-bold text-gray-900 text-sm">{address.fullName}</p>
                <p className="text-gray-600 leading-relaxed">{address.streetAddress}</p>
                {address.landmark && <p className="text-gray-500">Landmark: {address.landmark}</p>}
                <p className="text-gray-600">{address.city}, {address.state} - {address.postalCode}</p>
                <p className="text-gray-500 pt-1 flex items-center gap-1.5 font-medium">
                  <Phone size={12} /> {address.phone}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Shipping details recorded with your account.</p>
            )}
          </div>

          {/* Payment & Security Badge */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 pb-2 border-b border-gray-100">
                {isOnlinePayment ? <CreditCard size={15} className="text-[#1A2E4C]" /> : <Banknote size={15} className="text-emerald-600" />}
                <span>Payment Summary</span>
              </div>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Method</span>
                  <span className="font-bold text-gray-900">
                    {isOnlinePayment ? 'Razorpay Secure Payment' : 'Cash on Delivery (COD)'}
                  </span>
                </div>
                {order?.paymentId && (
                  <div className="flex justify-between">
                    <span>Transaction ID</span>
                    <span className="font-mono text-gray-700 truncate max-w-[200px]">{order.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-bold text-emerald-700 uppercase">{paymentStatus}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2 text-[11px] text-gray-500 bg-slate-50 p-2 rounded">
              <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
              <span>Verified 256-bit encrypted transaction</span>
            </div>
          </div>

        </div>

        {/* Ordered Items List (if available) */}
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-5 sm:p-6 mb-6">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100 flex items-center justify-between">
              <span>Items in this Order ({items.length})</span>
              <span className="font-normal text-gray-500">Standard Delivery</span>
            </h3>

            <div className="divide-y divide-gray-100">
              {items.map((item, index) => (
                <div key={index} className="py-3 flex items-center gap-4">
                  <div className="w-14 h-16 bg-gray-100 rounded border border-gray-200 overflow-hidden relative shrink-0">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package size={20} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{item.productName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                      {item.size && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">Size: {item.size}</span>}
                      {item.color && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">Color: {item.color}</span>}
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">₹{item.subtotal || item.unitPrice * item.quantity}</p>
                    <p className="text-[10px] text-gray-400">₹{item.unitPrice} each</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal / Breakdown */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{order?.subtotal || totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Charges</span>
                <span className="font-bold text-emerald-700">
                  {order?.shippingCharge === 0 ? 'FREE' : `₹${order?.shippingCharge || 0}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                <span>Total Amount</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 print:hidden">
          <Link
            href={order?.id ? `/profile/orders/${order.id}` : '/profile/orders'}
            onClick={() => resetCheckout()}
            className="w-full sm:flex-1 py-3.5 px-6 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Package size={16} />
            <span>Track My Order</span>
          </Link>

          <Link
            href="/shop"
            onClick={() => resetCheckout()}
            className="w-full sm:flex-1 py-3.5 px-6 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 text-xs font-bold tracking-wider uppercase rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
          >
            <ShoppingBag size={16} />
            <span>Continue Shopping</span>
          </Link>

          <button
            onClick={() => setShowInvoicePreview(true)}
            className="w-full sm:w-auto py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            title="Preview Official Tax Invoice"
          >
            <FileText size={16} />
            <span>Preview Invoice</span>
          </button>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto py-3.5 px-5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            title="Print Receipt & Tax Invoice"
          >
            <Printer size={16} />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>

      {/* ─── Printable Actual Tax Invoice (Visible in Print / Save-PDF Only) ─── */}
      <div className="hidden print:block w-full">
        <PrintableInvoice
          order={order}
          fallbackOrderNumber={orderNumber}
          fallbackTotal={totalAmount}
          fallbackPaymentMethod={paymentMethod}
          fallbackPaymentStatus={paymentStatus}
          fallbackDate={formattedDeliveryDate}
          fallbackAddress={address}
          fallbackItems={items}
        />
      </div>

      {/* ─── Screen Preview Modal (Allows inspecting invoice before printing) ─── */}
      {showInvoicePreview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A2E4C]" />
                <h3 className="font-bold text-sm sm:text-base text-gray-900">Tax Invoice & Cash Memo</h3>
                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  #{orderNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-md transition-colors shadow-xs"
                >
                  <Printer size={14} />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  onClick={() => setShowInvoicePreview(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100">
              <div className="bg-white shadow-md rounded-sm">
                <PrintableInvoice
                  order={order}
                  fallbackOrderNumber={orderNumber}
                  fallbackTotal={totalAmount}
                  fallbackPaymentMethod={paymentMethod}
                  fallbackPaymentStatus={paymentStatus}
                  fallbackDate={formattedDeliveryDate}
                  fallbackAddress={address}
                  fallbackItems={items}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[75vh] flex items-center justify-center bg-slate-50">
          <Loader2 className="w-8 h-8 animate-spin text-[#1A2E4C]" />
        </div>
      }
    >
      <OrderSuccessContent />
    </Suspense>
  );
}
