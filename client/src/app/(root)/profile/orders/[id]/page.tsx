'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ordersApi, BackendOrder } from '@/lib/api/orders';
import { shipmentsApi, BackendShipment } from '@/lib/api/shipments';
import { returnsApi, BackendReturn, ReturnReason } from '@/lib/api/returns';
import { ReturnStatusTracker } from '@/components/features/orders/ReturnStatusTracker';
import { useCartStore } from '@/store/useCartStore';
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  CreditCard,
  Download,
  RotateCcw,
  FileText,
  MessageSquare,
  ShoppingBag,
  RefreshCw,
  Phone,
  Check,
  X,
  UploadCloud,
  ImageIcon,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STEPS = [
  { key: 'PLACED', label: 'Ordered' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PACKED', label: 'Packed' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const addItemToCart = useCartStore((state) => state.addItem);

  const [order, setOrder] = useState<BackendOrder | null>(null);
  const [shipment, setShipment] = useState<BackendShipment | null>(null);
  const [userReturns, setUserReturns] = useState<BackendReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Delivery Instructions Modal
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [savedNote, setSavedNote] = useState<string | null>(null);

  // Return Modal State
  const [returnModalTarget, setReturnModalTarget] = useState<{ orderId: string; item: any } | null>(null);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState<ReturnReason>('WRONG_SIZE');
  const [customerNote, setCustomerNote] = useState('');
  const [returnImages, setReturnImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getOrderById(resolvedParams.id);
      setOrder(data);
      if (data?.notes) setSavedNote(data.notes);

      // Attempt shipment & returns lookup concurrently
      const [shipData, returnsData] = await Promise.all([
        shipmentsApi.getShipmentByOrder(data.id).catch(() => null),
        returnsApi.getMyReturns().catch(() => []),
      ]);

      if (shipData) setShipment(shipData);
      setUserReturns(returnsData.filter((r) => r.orderId === data.id));
    } catch (error: any) {
      console.error('Failed to fetch order details:', error);
      toast.error(error?.response?.data?.message || 'Order not found');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [resolvedParams.id]);

  // Compute estimated arrival text
  const getEstimatedArrivalText = () => {
    if (!order) return '';
    if (order.orderStatus === 'DELIVERED') {
      return `Delivered on ${new Date(order.deliveredAt || order.placedAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`;
    }
    if (order.orderStatus === 'CANCELLED') {
      return 'Order Cancelled';
    }

    const baseDate = new Date(order.placedAt);
    const estimatedDate = new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000);
    const formattedDate = estimatedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    return `Arriving on ${formattedDate} between 7:00 AM - 10:00 PM`;
  };

  // Helper for tracking chart progress percentage
  const getStepProgressPercentage = () => {
    if (!order) return 0;
    if (order.orderStatus === 'CANCELLED') return 0;
    switch (order.orderStatus) {
      case 'PLACED': return 10;
      case 'CONFIRMED': return 30;
      case 'PACKED': return 50;
      case 'SHIPPED': return 70;
      case 'OUT_FOR_DELIVERY': return 90;
      case 'DELIVERED': return 100;
      default: return 0;
    }
  };

  // Cancel order handler
  const handleCancelOrder = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setIsCancelling(true);
      const updated = await ordersApi.cancelOrder(order.id, 'Cancelled by customer from order detail page');
      toast.success('Order cancelled successfully.');
      setOrder(updated);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Cannot cancel order at this current shipping stage.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Update Delivery Instructions handler
  const handleSaveInstructions = () => {
    if (!deliveryNote.trim()) {
      toast.error('Please enter delivery instructions.');
      return;
    }
    setSavedNote(deliveryNote.trim());
    setIsInstructionsOpen(false);
    toast.success('Delivery instructions updated successfully!');
  };

  // Buy Again handler
  const handleBuyAgain = () => {
    if (!order || !order.items) return;
    let addedCount = 0;
    order.items.forEach((item) => {
      addItemToCart({
        variantId: item.variantId || item.productId,
        productId: item.productId,
        name: item.productName,
        image: item.imageUrl || '/images/product-1.jpeg',
        color: item.color || 'Standard',
        size: item.size || 'Standard',
        price: item.unitPrice,
        quantity: item.quantity,
        stock: 50,
      });
      addedCount += item.quantity;
    });

    toast.success(`Added ${addedCount} items from Order #${order.orderNumber} to your basket!`, {
      action: {
        label: 'View Cart',
        onClick: () => router.push('/cart'),
      },
    });
  };

  // Printable Invoice handler
  const handleDownloadInvoice = () => {
    window.print();
  };

  // Return Modal Handlers
  const handleOpenReturnModal = (item: any) => {
    if (!order) return;
    setReturnModalTarget({ orderId: order.id, item });
    setReturnQuantity(1);
    setReturnReason('WRONG_SIZE');
    setCustomerNote('');
    setReturnImages([]);
    setImageUrlInput('');
  };

  const handleAddImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setReturnImages((prev) => [...prev, reader.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setReturnImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setReturnImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitReturn = async () => {
    if (!returnModalTarget) return;
    try {
      setIsSubmittingReturn(true);
      const res = await returnsApi.createReturn({
        orderId: returnModalTarget.orderId,
        orderItemId: returnModalTarget.item.variantId || returnModalTarget.item.productId,
        quantity: returnQuantity,
        reason: returnReason,
        customerNote,
        images: returnImages,
      });
      toast.success('Return request submitted successfully!');
      setUserReturns((prev) => [res, ...prev]);
      setReturnModalTarget(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to submit return request.');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[450px] bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8">
        <AlertCircle size={40} className="text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-gray-900 mb-1">Order Not Found</h3>
        <p className="text-xs text-gray-500 mb-6">We couldn't locate the requested order details.</p>
        <Link
          href="/profile/orders"
          className="inline-flex items-center gap-2 bg-[#1A2E4C] text-white text-xs font-bold px-5 py-2.5 rounded-lg"
        >
          <ArrowLeft size={14} /> Back to My Orders
        </Link>
      </div>
    );
  }

  const canCancel = ['PLACED', 'CONFIRMED', 'PACKED'].includes(order.orderStatus);
  const isDelivered = order.orderStatus === 'DELIVERED';
  const isTerminated = ['DELIVERED', 'CANCELLED', 'RETURNED'].includes(order.orderStatus);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 print:p-0 print:space-y-4">
      {/* Page Navigation & Title */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/profile/orders"
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span>Order #{order.orderNumber}</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Placed on {new Date(order.placedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadInvoice}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-lg transition-colors shadow-2xs"
        >
          <Download size={14} />
          <span>Download Invoice</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 1: ORDER RECEIVING / ARRIVAL HEADER                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-[#1A2E4C] text-white rounded-2xl p-6 lg:p-7 shadow-md relative overflow-hidden print:bg-white print:text-black print:border">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 text-[#D2925D] flex items-center justify-center shrink-0 border border-white/10">
              <Truck size={24} />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-200 block mb-0.5">Estimated Receiving Details</span>
              <h2 className="text-lg lg:text-xl font-bold text-white leading-tight">
                {getEstimatedArrivalText()}
              </h2>
              {shipment?.trackingNumber && (
                <p className="text-xs text-blue-200 mt-1 flex items-center gap-2 font-mono">
                  <span>Tracking: #{shipment.trackingNumber}</span>
                  <span>•</span>
                  <span>Carrier: {shipment.deliveryPartnerId || 'YOX Express Courier'}</span>
                </p>
              )}
            </div>
          </div>

          <span
            className={`self-start sm:self-auto px-3.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${
              order.orderStatus === 'DELIVERED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                : order.orderStatus === 'CANCELLED'
                ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
            }`}
          >
            {order.orderStatus.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 2: ORDER TRACKING DETAILS & ACTIONS CHART                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6 print:hidden">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Clock size={16} className="text-[#1A2E4C]" />
            Order Tracking Progress
          </h3>
          <span className="text-xs font-semibold text-gray-500">
            {order.orderStatus === 'CANCELLED' ? 'Order Cancelled' : `Stage: ${order.orderStatus.replace(/_/g, ' ')}`}
          </span>
        </div>

        {/* Visual Progress Bar Chart */}
        {order.orderStatus !== 'CANCELLED' ? (
          <div className="space-y-4 pt-2">
            <div className="relative w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#1A2E4C] h-full transition-all duration-500 ease-out"
                style={{ width: `${getStepProgressPercentage()}%` }}
              />
            </div>

            <div className="grid grid-cols-6 gap-2 text-center pt-1">
              {STATUS_STEPS.map((step, idx) => {
                const stepProgress = (idx + 1) * (100 / STATUS_STEPS.length);
                const currentProgress = getStepProgressPercentage();
                const isPassed = currentProgress >= stepProgress - 5;
                const isCurrent = order.orderStatus === step.key;

                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-[#1A2E4C] text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                      } ${isCurrent ? 'ring-4 ring-[#1A2E4C]/20 scale-110' : ''}`}
                    >
                      {isPassed ? <Check size={14} /> : idx + 1}
                    </div>
                    <span className={`text-[11px] font-semibold leading-tight ${isCurrent ? 'text-[#1A2E4C] font-bold' : isPassed ? 'text-gray-800' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-3">
            <XCircle size={20} className="text-rose-600 shrink-0" />
            <div>
              <p className="font-bold">Order Was Cancelled</p>
              <p className="text-[11px] text-rose-700 mt-0.5">Reason: {order.cancelledReason || 'Cancelled by customer'}</p>
            </div>
          </div>
        )}

        {/* Section 2 Action Buttons: Cancel Order, Update Instructions (Only Unshipped/Undelivered), Buy Again */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={isCancelling}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 border border-rose-300 text-rose-600 font-bold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50"
              >
                <XCircle size={14} />
                <span>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
              </button>
            )}

            {/* Hide Update Delivery Instructions when item is DELIVERED or CANCELLED */}
            {!isTerminated && (
              <button
                onClick={() => {
                  setDeliveryNote(savedNote || '');
                  setIsInstructionsOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-lg transition-colors"
              >
                <MessageSquare size={14} />
                <span>{savedNote ? 'Update Delivery Instructions' : 'Add Delivery Instructions'}</span>
              </button>
            )}
          </div>

          <button
            onClick={handleBuyAgain}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
          >
            <RefreshCw size={14} />
            <span>Buy Again</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SEPARATE SECTION: RETURN & REFUND MANAGEMENT (WHEN DELIVERED / HAS RETURN) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {(isDelivered || userReturns.length > 0) && (
        <div className="bg-white border border-amber-200/80 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6 print:hidden">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <RotateCcw size={16} className="text-[#1A2E4C]" />
              Return & Refund Journey Management
            </h3>
            <span className="text-xs font-semibold text-gray-500">
              {userReturns.length > 0 ? `${userReturns.length} Return Request Active` : 'Eligible for Return'}
            </span>
          </div>

          <div className="space-y-6">
            {order.items && order.items.map((item, idx) => {
              const itemId = item.variantId || item.productId;
              const existingReturn = userReturns.find((r) => r.orderItemId === itemId);

              return (
                <div key={idx} className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl || (item as any).image || (item as any).productImage || '/images/product-1.jpeg'}
                        alt={item.productName}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/product-1.jpeg'; }}
                        className="w-12 h-14 object-cover rounded-lg bg-white border border-gray-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-xs">{item.productName}</h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          SKU: {item.sku} • Qty: x{item.quantity} • Subtotal: ₹{item.subtotal}
                        </p>
                      </div>
                    </div>

                    {!existingReturn ? (
                      <button
                        onClick={() => handleOpenReturnModal(item)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                      >
                        <RotateCcw size={14} />
                        <span>Request Return & Refund</span>
                      </button>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                        existingReturn.status === 'REFUNDED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        Return Status: {existingReturn.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {/* Render Live Return Stepper Tracker if return exists for item */}
                  {existingReturn && (
                    <div className="pt-3 border-t border-gray-200/80">
                      <ReturnStatusTracker returnRecord={existingReturn} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 3: SHIPPING ADDRESS                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <MapPin size={16} className="text-[#1A2E4C]" />
            Shipping Address
          </h3>
          <span className="text-xs font-semibold text-gray-500">Destination</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5 text-xs text-gray-700">
            <p className="font-bold text-sm text-gray-900">{order.shippingAddress?.fullName || 'Customer'}</p>
            <p className="text-gray-600">{order.shippingAddress?.streetAddress}</p>
            {order.shippingAddress?.landmark && <p className="text-gray-500 italic">Landmark: {order.shippingAddress.landmark}</p>}
            <p className="text-gray-800 font-medium">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - <span className="font-mono font-bold">{order.shippingAddress?.postalCode}</span>
            </p>
            <p className="text-gray-800 font-medium">{order.shippingAddress?.country}</p>
            {order.shippingAddress?.phone && (
              <p className="text-gray-900 font-bold pt-1 flex items-center gap-1.5">
                <Phone size={12} className="text-[#1A2E4C]" />
                <span>Phone: {order.shippingAddress.phone}</span>
              </p>
            )}
          </div>

          {/* Delivery Note Display if present */}
          {savedNote && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-950">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <MessageSquare size={13} className="text-amber-700" />
                Delivery Instructions Saved:
              </span>
              <p className="italic text-amber-900">"{savedNote}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* SECTION 4: ORDER DETAILS & RECEIPT                                 */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-7 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <FileText size={16} className="text-[#1A2E4C]" />
            Order Details & Items ({order.items?.length || 0})
          </h3>
          <span className="text-xs font-mono font-bold text-gray-500">Ref: #{order.id.substring(0, 10)}</span>
        </div>

        {/* Purchased Items List */}
        <div className="divide-y divide-gray-100">
          {order.items && order.items.map((item, idx) => (
            <div key={idx} className="py-4 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0">
              <div className="flex items-center gap-4">
                <img
                  src={item.imageUrl || (item as any).image || (item as any).productImage || '/images/product-1.jpeg'}
                  alt={item.productName}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/product-1.jpeg'; }}
                  className="w-14 h-16 object-cover rounded-lg bg-gray-100 border border-gray-200 shrink-0"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{item.productName}</h4>
                  <div className="flex items-center gap-3 text-gray-500 mt-1">
                    <span>SKU: <span className="font-mono text-gray-700 font-semibold">{item.sku}</span></span>
                    {item.color && <span>Color: <span className="font-semibold text-gray-800">{item.color}</span></span>}
                    {item.size && <span>Size: <span className="font-semibold text-gray-800">{item.size}</span></span>}
                    <span>Qty: <span className="font-bold text-gray-900">x{item.quantity}</span></span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-gray-900 text-sm">₹{item.subtotal}</span>
                <span className="block text-[10px] text-gray-400">₹{item.unitPrice} / unit</span>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Payment Receipt Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100 text-xs">
          {/* Summary Breakdown */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 md:col-span-2">
            <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider mb-2">Order Summary</h4>
            <div className="flex justify-between text-gray-600">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-gray-900">₹{order.subtotal}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping Fee:</span>
              <span className="font-semibold text-gray-900">{order.shippingCharge === 0 ? 'FREE Shipping' : `₹${order.shippingCharge}`}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Promotional Discount:</span>
                <span>-₹{order.discount}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Estimated Tax (GST):</span>
                <span className="font-semibold text-gray-900">₹{order.tax}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm text-gray-900">
              <span>Grand Total:</span>
              <span className="text-[#1A2E4C] text-base">₹{order.totalAmount}</span>
            </div>
          </div>

          {/* Payment Method & Ship To */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Payment Method</span>
              <p className="font-bold text-gray-900 text-xs mt-0.5 uppercase">{order.paymentMethod}</p>
              <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold mt-1 ${
                order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {order.paymentStatus}
              </span>
            </div>

            <div className="border-t border-gray-200 pt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ship To</span>
              <p className="font-bold text-gray-900 text-xs mt-0.5">{order.shippingAddress?.fullName}</p>
              <p className="text-[11px] text-gray-600 truncate">{order.shippingAddress?.city}, {order.shippingAddress?.country}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Instructions Modal */}
      {isInstructionsOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-[#1A2E4C]" size={18} /> Update Delivery Instructions
              </h3>
              <button onClick={() => setIsInstructionsOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="font-bold text-gray-800 block">
                Instructions for Delivery Agent (e.g. Call before delivery, gate code, leave at door):
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Please ring doorbell twice or call +91 9876543210 upon arrival."
                className="w-full border border-gray-300 rounded-lg p-3 text-xs h-28 focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsInstructionsOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveInstructions}
                className="px-4 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                Save Instructions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal */}
      {returnModalTarget && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-gray-200 text-gray-900 my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <RotateCcw className="text-[#1A2E4C]" size={18} /> Request Item Return & Refund
              </h3>
              <button onClick={() => setReturnModalTarget(null)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                <img
                  src={returnModalTarget.item.imageUrl || (returnModalTarget.item as any).image || '/images/product-1.jpeg'}
                  alt={returnModalTarget.item.productName}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/product-1.jpeg'; }}
                  className="w-10 h-12 object-cover rounded bg-white border shrink-0"
                />
                <div>
                  <h4 className="font-bold text-gray-900">{returnModalTarget.item.productName}</h4>
                  <p className="text-[11px] text-gray-500">Unit Price: ₹{returnModalTarget.item.unitPrice}</p>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Return Reason *</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs bg-white focus:ring-2 focus:ring-[#1A2E4C]"
                >
                  <option value="WRONG_SIZE">Wrong Size / Fit Issue</option>
                  <option value="WRONG_PRODUCT">Wrong Product Delivered</option>
                  <option value="DAMAGED">Damaged Package / Product</option>
                  <option value="DEFECTIVE">Defective / Quality Issue</option>
                  <option value="NOT_AS_EXPECTED">Not As Expected / Color Mismatch</option>
                  <option value="CHANGED_MIND">Changed Mind</option>
                  <option value="OTHER">Other Reason</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Quantity to Return *</label>
                <input
                  type="number"
                  min={1}
                  max={returnModalTarget.item.quantity}
                  value={returnQuantity}
                  onChange={(e) => setReturnQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-24 border border-gray-300 rounded-lg p-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Additional Customer Note</label>
                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Describe the issue with the item..."
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-xs h-20"
                />
              </div>

              <div>
                <label className="font-bold text-gray-800 block mb-1">Attach Item Photos</label>
                <input type="file" accept="image/*" multiple onChange={handleAddImageFile} className="text-xs mb-2 block" />
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Or enter Image URL"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg p-2 text-xs"
                  />
                  <button type="button" onClick={handleAddImageUrl} className="px-3 py-2 bg-gray-100 text-xs font-bold rounded-lg hover:bg-gray-200">
                    Add
                  </button>
                </div>

                {returnImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {returnImages.map((src, i) => (
                      <div key={i} className="relative w-14 h-14 border rounded-lg overflow-hidden group">
                        <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(i)}
                          className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setReturnModalTarget(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                disabled={isSubmittingReturn}
                className="px-5 py-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50"
              >
                {isSubmittingReturn ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
