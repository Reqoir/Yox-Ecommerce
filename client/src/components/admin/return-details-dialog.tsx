'use client';

import React, { useState } from 'react';
import { BackendReturn, InspectionResult } from '@/lib/api/returns';
import { BackendOrder } from '@/lib/api/orders';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Package,
  Truck,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  Copy,
  ExternalLink,
  ImageIcon,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  Maximize2,
  Check,
  Sparkles,
  ArrowRight,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReturnDetailsDialogProps {
  returnItem: BackendReturn | null;
  order: BackendOrder | null | undefined;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onReceive: (id: string) => Promise<void>;
  onInspect: (id: string, condition: InspectionResult) => Promise<void>;
  onOpenRefund: (ret: BackendReturn) => void;
  onOpenSchedulePickup?: (ret: BackendReturn) => void;
  onViewOrder?: (order: BackendOrder) => void;
  onPreviewPhotos: (images: string[]) => void;
  isUpdating?: boolean;
}

export const RETURN_STATUS_CONFIG: Record<
  string,
  {
    label: string;
    badge: string;
    border: string;
    bg: string;
    text: string;
    icon: any;
    description: string;
  }
> = {
  REQUESTED: {
    label: 'Return Requested',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    border: 'border-amber-500',
    bg: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    icon: Clock,
    description: 'Customer requested a return. Pending staff review.',
  },
  APPROVED: {
    label: 'Awaiting Shipment',
    badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    border: 'border-blue-500',
    bg: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
    icon: ShieldCheck,
    description: 'Return approved. Customer must dispatch item or await pickup.',
  },
  RETURN_SHIPPED: {
    label: 'Package Shipped',
    badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: Truck,
    description: 'Customer dispatched the return package with courier tracking.',
  },
  PICKUP_SCHEDULED: {
    label: 'Pickup Scheduled',
    badge: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    border: 'border-indigo-500',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400',
    icon: Calendar,
    description: 'Reverse pickup scheduled with courier executive.',
  },
  PICKED_UP: {
    label: 'Picked Up',
    badge: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800',
    border: 'border-cyan-500',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    icon: Truck,
    description: 'Item picked up by courier and in transit back to facility.',
  },
  RECEIVED: {
    label: 'Package Received',
    badge: 'bg-violet-500/10 text-violet-500 border-violet-500/20 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800',
    border: 'border-violet-500',
    bg: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    icon: Package,
    description: 'Package received at warehouse. Ready for physical inspection.',
  },
  INSPECTED: {
    label: 'Inspected',
    badge: 'bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/20 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 dark:border-fuchsia-800',
    border: 'border-fuchsia-500',
    bg: 'bg-fuchsia-500',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    icon: ShieldCheck,
    description: 'Physical quality check completed and inventory adjusted.',
  },
  REFUND_PENDING: {
    label: 'Refund Pending',
    badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800',
    border: 'border-purple-500',
    bg: 'bg-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
    icon: CreditCard,
    description: 'Quality passed. Pending refund disbursement.',
  },
  REFUNDED: {
    label: 'Refunded',
    badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    border: 'border-emerald-500',
    bg: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    icon: CheckCircle2,
    description: 'Refund successfully issued to customer.',
  },
  REJECTED: {
    label: 'Rejected',
    badge: 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    border: 'border-rose-500',
    bg: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    icon: XCircle,
    description: 'Return request rejected.',
  },
};

export const RETURN_REASON_MAP: Record<string, string> = {
  WRONG_SIZE: 'Wrong Size / Fit Issue',
  WRONG_PRODUCT: 'Incorrect Item Received',
  DAMAGED: 'Damaged in Transit',
  DEFECTIVE: 'Defective / Quality Issue',
  NOT_AS_EXPECTED: 'Not as Expected / Pictured',
  CHANGED_MIND: 'Changed Mind',
  OTHER: 'Other Reason',
};

const RETURN_PIPELINE_STEPS = [
  { key: 'REQUESTED', label: 'Requested', icon: Clock },
  { key: 'APPROVED', label: 'Approved', icon: ShieldCheck },
  { key: 'RETURN_SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'RECEIVED', label: 'Received', icon: Package },
  { key: 'INSPECTED', label: 'Inspected', icon: ShieldCheck },
  { key: 'REFUNDED', label: 'Refunded', icon: CheckCircle2 },
];

export function ReturnDetailsDialog({
  returnItem,
  order,
  isOpen,
  onClose,
  onApprove,
  onReject,
  onReceive,
  onInspect,
  onOpenRefund,
  onOpenSchedulePickup,
  onViewOrder,
  onPreviewPhotos,
  isUpdating = false,
}: ReturnDetailsDialogProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!returnItem) return null;

  const copyToClipboard = (text: string, key: string, label = 'Copied') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isRejected = returnItem.status === 'REJECTED';
  const statusCfg = RETURN_STATUS_CONFIG[returnItem.status] || RETURN_STATUS_CONFIG.REQUESTED;
  const StatusIcon = statusCfg.icon;

  // Find targeted item in order
  const orderItem =
    order?.items?.find(
      (it) =>
        it.variantId === returnItem.orderItemId ||
        (it as any).id === returnItem.orderItemId ||
        it.productId === returnItem.orderItemId
    ) || order?.items?.[0];

  const customerName =
    order?.customer?.fullName || order?.shippingAddress?.fullName || 'Customer';
  const customerEmail = order?.customer?.email || 'N/A';
  const customerPhone = order?.customer?.phone || order?.shippingAddress?.phone || 'N/A';
  const customerInitials =
    customerName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'CU';

  const unitPrice = orderItem?.unitPrice || 0;
  const calculatedRefundValue = returnItem.refundAmount || (unitPrice > 0 ? unitPrice * returnItem.quantity : 799);

  // Stepper state calculation
  const getStepState = (stepKey: string): 'completed' | 'current' | 'upcoming' => {
    if (isRejected) return 'upcoming';

    const orderRank: Record<string, number> = {
      REQUESTED: 0,
      APPROVED: 1,
      PICKUP_SCHEDULED: 1,
      PICKED_UP: 2,
      RETURN_SHIPPED: 2,
      RECEIVED: 3,
      INSPECTED: 4,
      REFUND_PENDING: 4,
      REFUNDED: 5,
    };

    const currentRank = orderRank[returnItem.status] ?? 0;
    const thisStepRank = orderRank[stepKey] ?? 0;

    if (currentRank > thisStepRank) return 'completed';
    if (currentRank === thisStepRank) return 'current';
    return 'upcoming';
  };

  // Timestamp for each step
  const getStepTimestamp = (stepKey: string): string | null => {
    if (stepKey === 'REQUESTED') return returnItem.createdAt;
    if (stepKey === 'APPROVED') return returnItem.approvedAt || null;
    if (stepKey === 'RETURN_SHIPPED') return returnItem.customerShippedAt || null;
    if (stepKey === 'RECEIVED') return returnItem.receivedAt || null;
    if (stepKey === 'INSPECTED') return returnItem.inspectedAt || null;
    if (stepKey === 'REFUNDED') return returnItem.refundedAt || null;
    return null;
  };

  const handleCopyBankDetails = () => {
    if (!returnItem.refundBankDetails) return;
    const b = returnItem.refundBankDetails;
    const text = `Account Holder: ${b.accountHolderName}
Account Number: ${b.accountNumber}
IFSC Code: ${b.ifscCode}
Bank Name: ${b.bankName || 'N/A'}
Return Ref: #${returnItem.id.substring(0, 8)}
Amount: ₹${calculatedRefundValue}`;
    copyToClipboard(text, 'all_bank', 'Complete Bank Transfer Details');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-4xl max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl">
        {/* Top Header */}
        <div className="p-6 border-b bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-bold tracking-tight text-foreground font-mono">
                    Return #{returnItem.id.substring(0, 8)}
                  </h2>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(returnItem.id, 'retId', 'Return ID')}
                    className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted transition-colors"
                    title="Copy full Return ID"
                  >
                    {copiedKey === 'retId' ? (
                      <Check size={14} className="text-emerald-500" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>

                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusCfg.badge}`}
                >
                  <StatusIcon size={12} strokeWidth={2.5} />
                  <span>{statusCfg.label}</span>
                </span>

                {returnItem.inspectionResult && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      returnItem.inspectionResult === 'RESELLABLE'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                    }`}
                  >
                    <ShieldCheck size={11} />
                    <span>Inspection: {returnItem.inspectionResult}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  Requested on{' '}
                  {new Date(returnItem.createdAt).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>•</span>
                {order ? (
                  <div className="flex items-center gap-1">
                    <span>Order:</span>
                    <button
                      type="button"
                      onClick={() => onViewOrder?.(order)}
                      className="font-mono font-bold text-primary hover:underline inline-flex items-center gap-1"
                    >
                      #{order.orderNumber}
                      <ExternalLink size={11} />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono">Order ID: {returnItem.orderId.substring(0, 10)}...</span>
                )}
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              {returnItem.status === 'REQUESTED' && (
                <>
                  <Button
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onApprove(returnItem.id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs rounded-xl shadow-2xs"
                  >
                    <Check size={13} className="mr-1.5" />
                    Approve Return
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => onReject(returnItem.id)}
                    className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 text-xs font-semibold rounded-xl"
                  >
                    <XCircle size={13} className="mr-1.5" />
                    Reject
                  </Button>
                </>
              )}

              {(returnItem.status === 'RETURN_SHIPPED' ||
                returnItem.status === 'PICKUP_SCHEDULED' ||
                returnItem.status === 'PICKED_UP') && (
                <Button
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onReceive(returnItem.id)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-8 text-xs rounded-xl shadow-2xs"
                >
                  <Package size={13} className="mr-1.5" />
                  Mark Received
                </Button>
              )}

              {returnItem.status === 'RECEIVED' && (
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    disabled={isUpdating}
                    onClick={() => onInspect(returnItem.id, 'RESELLABLE')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 text-xs rounded-xl shadow-2xs"
                  >
                    <CheckCircle2 size={13} className="mr-1.5" />
                    Pass (Resellable)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdating}
                    onClick={() => onInspect(returnItem.id, 'DAMAGED')}
                    className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold h-8 text-xs rounded-xl"
                  >
                    <XCircle size={13} className="mr-1.5" />
                    Fail (Damaged)
                  </Button>
                </div>
              )}

              {(returnItem.status === 'INSPECTED' || returnItem.status === 'REFUND_PENDING') && (
                <Button
                  size="sm"
                  disabled={isUpdating}
                  onClick={() => onOpenRefund(returnItem)}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold h-8 text-xs rounded-xl shadow-2xs"
                >
                  <CreditCard size={13} className="mr-1.5" />
                  Issue Refund (₹{calculatedRefundValue})
                </Button>
              )}

              {returnItem.status === 'REFUNDED' && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                  <CheckCircle2 size={14} /> Refund Completed
                </span>
              )}
            </div>
          </div>

          {/* Visual Fulfillment Stepper Progress Bar */}
          <div className="mt-6 pt-5 border-t">
            <div className="flex items-center justify-between relative">
              {/* Stepper background line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-muted -z-0" />

              {RETURN_PIPELINE_STEPS.map((step) => {
                const state = getStepState(step.key);
                const StepIcon = step.icon;
                const timestamp = getStepTimestamp(step.key);

                return (
                  <div key={step.key} className="flex flex-col items-center relative z-10">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                        state === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : state === 'current'
                          ? 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 scale-105 shadow-xs'
                          : 'bg-background border-muted-foreground/30 text-muted-foreground'
                      }`}
                    >
                      {state === 'completed' ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        <StepIcon size={15} />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold mt-2 text-center whitespace-nowrap hidden sm:block ${
                        state === 'current'
                          ? 'text-primary'
                          : state === 'completed'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </span>
                    {timestamp && (
                      <span className="text-[9px] text-muted-foreground mt-0.5 hidden md:block">
                        {new Date(timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Rejection Alert Banner if applicable */}
            {isRejected && (
              <div className="mt-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl flex items-start gap-2.5 text-xs">
                <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Return Request Rejected:</span>{' '}
                  <span>
                    {returnItem.rejectionReason || 'No specific rejection explanation provided.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body Grid */}
        <div className="p-6 space-y-6">
          {/* Customer Note / Reason Highlight Banner */}
          {returnItem.customerNote && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 text-amber-900 dark:text-amber-300">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider">
                    Customer Return Statement & Comments
                  </h4>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200">
                    Reason: {RETURN_REASON_MAP[returnItem.reason] || returnItem.reason}
                  </span>
                </div>
                <p className="text-xs mt-1 italic font-medium">"{returnItem.customerNote}"</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Product Info & Evidence Photos (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Product Returned Card */}
              <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">Returned Item Details</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Qty: {returnItem.quantity} unit{returnItem.quantity > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4 flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl border bg-muted/40 overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {orderItem?.imageUrl ? (
                      <img
                        src={orderItem.imageUrl}
                        alt={orderItem.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">
                      {orderItem?.productName || 'Catalog Product Item'}
                    </h4>

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      {orderItem?.sku && (
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          SKU: {orderItem.sku}
                        </span>
                      )}
                      {orderItem?.size && (
                        <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                          Size: {orderItem.size}
                        </span>
                      )}
                      {orderItem?.color && (
                        <span className="font-semibold text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: orderItem.color.toLowerCase() }}
                          />
                          {orderItem.color}
                        </span>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs border-t border-border/50">
                      <span className="text-muted-foreground">Original Unit Price:</span>
                      <span className="font-bold text-foreground">₹{unitPrice || 799}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Estimated Refund Value:</span>
                      <span className="font-black text-primary text-sm">
                        ₹{calculatedRefundValue}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Condition Photos Gallery */}
              <div className="border rounded-2xl bg-card overflow-hidden shadow-xs">
                <div className="p-4 bg-muted/30 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">
                      Customer Condition Photos ({returnItem.images?.length || 0})
                    </h3>
                  </div>
                  {returnItem.images && returnItem.images.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPreviewPhotos(returnItem.images!)}
                      className="h-7 text-xs font-semibold gap-1 text-primary"
                    >
                      <Maximize2 size={12} />
                      Full View
                    </Button>
                  )}
                </div>

                <div className="p-4">
                  {returnItem.images && returnItem.images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {returnItem.images.map((src, idx) => (
                        <div
                          key={idx}
                          onClick={() => onPreviewPhotos(returnItem.images!)}
                          className="group relative aspect-square rounded-xl border bg-muted/20 overflow-hidden cursor-pointer hover:border-primary transition-all shadow-2xs"
                        >
                          <img
                            src={src}
                            alt={`Condition photo ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                            <Maximize2 size={14} />
                            <span>Zoom</span>
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                            Photo {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground text-xs italic">
                      No photos were provided by the customer for this return request.
                    </div>
                  )}
                </div>
              </div>

              {/* Inspection Quality Check Result Card */}
              <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">Quality & Inventory Inspection</h3>
                  </div>
                  {returnItem.inspectionResult ? (
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                        returnItem.inspectionResult === 'RESELLABLE'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400'
                      }`}
                    >
                      {returnItem.inspectionResult === 'RESELLABLE'
                        ? 'Passed • Restocked into Inventory'
                        : 'Failed • Moved to Damaged Stock'}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      Inspection Pending
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Automated Restocking:</strong> Marking a return as{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      RESELLABLE
                    </span>{' '}
                    automatically replenishes available warehouse inventory pool.
                  </p>
                  {returnItem.inspectedAt && (
                    <p className="text-[11px]">
                      Inspected on{' '}
                      {new Date(returnItem.inspectedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                {returnItem.status === 'RECEIVED' && (
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isUpdating}
                      onClick={() => onInspect(returnItem.id, 'RESELLABLE')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex-1"
                    >
                      <CheckCircle2 size={14} className="mr-1.5" />
                      Mark Resellable (Restock)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdating}
                      onClick={() => onInspect(returnItem.id, 'DAMAGED')}
                      className="text-rose-600 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold text-xs rounded-xl flex-1"
                    >
                      <XCircle size={14} className="mr-1.5" />
                      Mark Damaged
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Customer, Logistics, Bank Details & Refund (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Customer Info Card */}
              <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">Customer Details</h3>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ID: {returnItem.userId.substring(0, 8)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0 border border-primary/20">
                    {customerInitials}
                  </div>
                  <div className="min-w-0 flex-1 text-xs space-y-0.5">
                    <div className="font-bold text-foreground truncate">{customerName}</div>
                    <div className="text-muted-foreground flex items-center gap-1.5 truncate">
                      <Mail size={12} className="shrink-0" />
                      <span className="truncate">{customerEmail}</span>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-1.5">
                      <Phone size={12} className="shrink-0" />
                      <span>{customerPhone}</span>
                    </div>
                  </div>
                </div>

                {order?.shippingAddress && (
                  <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={13} className="shrink-0 mt-0.5 text-muted-foreground" />
                      <span>
                        {order.shippingAddress.streetAddress || (order.shippingAddress as any).addressLine1 || 'Address'}
                        {order.shippingAddress.city && `, ${order.shippingAddress.city}`}
                        {order.shippingAddress.state && `, ${order.shippingAddress.state}`}
                        {order.shippingAddress.postalCode && ` - ${order.shippingAddress.postalCode}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Logistics & Tracking Card */}
              <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-primary" />
                    <h3 className="font-bold text-sm">Return Courier Logistics</h3>
                  </div>
                  {returnItem.courierTrackingNumber ? (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Dispatched
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground italic">Pending Dispatch</span>
                  )}
                </div>

                {returnItem.courierTrackingNumber ? (
                  <div className="p-3 bg-muted/40 rounded-xl space-y-2 text-xs border">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground font-medium">Logistics Partner:</span>
                      <strong className="text-foreground">
                        {returnItem.courierName || 'India Post / Courier'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border/50">
                      <span className="text-muted-foreground font-medium">Tracking Number:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-primary">
                        <span>{returnItem.courierTrackingNumber}</span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              returnItem.courierTrackingNumber!,
                              'trk',
                              'Tracking number'
                            )
                          }
                          className="hover:text-foreground"
                          title="Copy tracking code"
                        >
                          {copiedKey === 'trk' ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {returnItem.customerShippedAt && (
                      <div className="text-[11px] text-muted-foreground pt-1">
                        Dispatched on:{' '}
                        {new Date(returnItem.customerShippedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground italic">
                    Customer has not yet submitted reverse tracking credentials.
                  </div>
                )}
              </div>

              {/* Customer Refund Bank Account Details Card */}
              <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-amber-500" />
                    <h3 className="font-bold text-sm">Customer Bank Account</h3>
                  </div>

                  {returnItem.refundBankDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyBankDetails}
                      className="h-7 px-2.5 text-[11px] font-bold gap-1 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      {copiedKey === 'all_bank' ? (
                        <Check size={12} className="text-emerald-500" />
                      ) : (
                        <Copy size={12} />
                      )}
                      Copy All Details
                    </Button>
                  )}
                </div>

                {returnItem.refundBankDetails ? (
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2 text-xs text-foreground">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account Holder:</span>
                      <strong className="text-foreground">
                        {returnItem.refundBankDetails.accountHolderName}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                      <span className="text-muted-foreground">Account Number:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                        <span>{returnItem.refundBankDetails.accountNumber}</span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              returnItem.refundBankDetails!.accountNumber,
                              'acct',
                              'Account number'
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy account number"
                        >
                          {copiedKey === 'acct' ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                      <span className="text-muted-foreground">IFSC Code:</span>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                        <span>{returnItem.refundBankDetails.ifscCode}</span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              returnItem.refundBankDetails!.ifscCode,
                              'ifsc',
                              'IFSC code'
                            )
                          }
                          className="text-muted-foreground hover:text-foreground"
                          title="Copy IFSC code"
                        >
                          {copiedKey === 'ifsc' ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </div>

                    {returnItem.refundBankDetails.bankName && (
                      <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                        <span className="text-muted-foreground">Bank / Branch:</span>
                        <span className="font-semibold text-foreground">
                          {returnItem.refundBankDetails.bankName}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-muted/30 rounded-xl text-xs text-muted-foreground italic">
                    Customer has not yet attached bank account credentials for direct transfer.
                  </div>
                )}
              </div>

              {/* Refund Disbursement Card */}
              <div className="border rounded-2xl bg-card p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-purple-500" />
                    <h3 className="font-bold text-sm">Refund Disbursement</h3>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      returnItem.status === 'REFUNDED'
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-600 border border-purple-500/20'
                    }`}
                  >
                    {returnItem.status === 'REFUNDED' ? 'DISBURSED' : 'PENDING'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Refund Amount:</span>
                    <span className="text-lg font-black text-foreground">
                      ₹{calculatedRefundValue}
                    </span>
                  </div>

                  {returnItem.refundTransactionId && (
                    <div className="flex items-center justify-between pt-1 border-t">
                      <span className="text-muted-foreground">Transaction ID:</span>
                      <span className="font-mono font-bold text-primary">
                        {returnItem.refundTransactionId}
                      </span>
                    </div>
                  )}

                  {returnItem.refundMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Refund Method:</span>
                      <span className="font-semibold text-foreground">
                        {returnItem.refundMethod}
                      </span>
                    </div>
                  )}

                  {returnItem.refundedAt && (
                    <div className="text-[11px] text-muted-foreground pt-1">
                      Processed on{' '}
                      {new Date(returnItem.refundedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 md:p-6 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {order && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewOrder?.(order)}
                className="text-xs font-semibold gap-1.5 rounded-xl"
              >
                <Package size={13} />
                <span>View Full Order #{order.orderNumber}</span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-semibold rounded-xl"
            >
              Close
            </Button>

            {returnItem.status === 'REQUESTED' && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => onApprove(returnItem.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                <Check size={13} className="mr-1.5" />
                <span>Approve Return</span>
              </Button>
            )}

            {(returnItem.status === 'RETURN_SHIPPED' ||
              returnItem.status === 'PICKUP_SCHEDULED' ||
              returnItem.status === 'PICKED_UP') && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => onReceive(returnItem.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                <Package size={13} className="mr-1.5" />
                <span>Mark Received</span>
              </Button>
            )}

            {(returnItem.status === 'INSPECTED' || returnItem.status === 'REFUND_PENDING') && (
              <Button
                size="sm"
                disabled={isUpdating}
                onClick={() => onOpenRefund(returnItem)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs"
              >
                <CreditCard size={13} className="mr-1.5" />
                <span>Issue Refund (₹{calculatedRefundValue})</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
