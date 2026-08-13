'use client';

import React from 'react';
import { BackendReturn } from '@/lib/api/returns';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Truck,
  PackageCheck,
  ShieldCheck,
  CreditCard,
  XCircle,
  Phone,
  User,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface ReturnStatusTrackerProps {
  returnRecord: BackendReturn;
}

export function ReturnStatusTracker({ returnRecord }: ReturnStatusTrackerProps) {
  const isRejected = returnRecord.status === 'REJECTED';

  // Phases list in chronological order
  const phases = [
    {
      key: 'REQUESTED',
      label: 'Return Requested',
      description: 'Request submitted with reason',
      timestamp: returnRecord.createdAt,
      icon: RotateCcw,
    },
    {
      key: 'APPROVED',
      label: isRejected ? 'Return Rejected' : 'Admin Approval',
      description: isRejected
        ? returnRecord.rejectionReason || 'Return request rejected by staff'
        : 'Request verified and approved',
      timestamp: isRejected ? returnRecord.updatedAt : returnRecord.approvedAt,
      icon: isRejected ? XCircle : CheckCircle2,
      isDanger: isRejected,
    },
    {
      key: 'PICKUP_SCHEDULED',
      label: 'Pickup Scheduled',
      description: returnRecord.pickupDate
        ? `Scheduled for ${new Date(returnRecord.pickupDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
        : 'Pickup executive assignment in progress',
      timestamp: returnRecord.pickupDate,
      icon: Calendar,
      extraInfo: returnRecord.pickupAgentName ? (
        <div className="mt-2.5 p-3 bg-amber-50/80 border border-amber-200 rounded-lg text-xs space-y-1.5 text-amber-950">
          <div className="font-bold flex items-center justify-between text-amber-900">
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-amber-700" />
              Delivery Executive Assigned
            </span>
            <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
              {returnRecord.pickupTimeSlot || '10:00 AM - 02:00 PM'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium pt-0.5">
            <div className="flex items-center gap-1">
              <User size={13} className="text-amber-700" />
              <span>{returnRecord.pickupAgentName}</span>
            </div>
            {returnRecord.pickupAgentPhone && (
              <a
                href={`tel:${returnRecord.pickupAgentPhone}`}
                className="flex items-center gap-1 text-emerald-700 font-bold hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
              >
                <Phone size={12} />
                <span>{returnRecord.pickupAgentPhone}</span>
              </a>
            )}
          </div>
        </div>
      ) : null,
    },
    {
      key: 'PICKED_UP',
      label: 'Item Picked Up',
      description: 'Item collected by logistics executive',
      timestamp: returnRecord.status === 'PICKED_UP' || returnRecord.receivedAt ? returnRecord.updatedAt : null,
      icon: Truck,
    },
    {
      key: 'RECEIVED',
      label: 'Received & Inspected',
      description: returnRecord.inspectionResult
        ? `Inspection: ${returnRecord.inspectionResult}`
        : 'Item undergoing quality check at warehouse',
      timestamp: returnRecord.inspectedAt || returnRecord.receivedAt,
      icon: PackageCheck,
    },
    {
      key: 'REFUNDED',
      label: 'Refund Completed',
      description: returnRecord.refundAmount
        ? `Refund of ₹${returnRecord.refundAmount} issued`
        : 'Refund processed to original payment method',
      timestamp: returnRecord.refundedAt,
      icon: CreditCard,
      extraInfo: returnRecord.refundTransactionId ? (
        <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-1 text-emerald-950">
          <div className="flex items-center justify-between font-bold">
            <span className="text-emerald-800">Refund Amount: ₹{returnRecord.refundAmount || 0}</span>
            <span className="text-[10px] text-emerald-700 font-mono">TXN: {returnRecord.refundTransactionId}</span>
          </div>
          <p className="text-[11px] text-emerald-700">Method: {returnRecord.refundMethod || 'Original Payment Method'}</p>
        </div>
      ) : null,
    },
  ];

  // Helper to calculate phase completion state index
  const getPhaseIndex = (status: string) => {
    switch (status) {
      case 'REQUESTED': return 0;
      case 'APPROVED': return 1;
      case 'REJECTED': return 1;
      case 'PICKUP_SCHEDULED': return 2;
      case 'PICKED_UP': return 3;
      case 'RECEIVED': return 4;
      case 'INSPECTED': return 4;
      case 'REFUND_PENDING': return 4;
      case 'REFUNDED': return 5;
      default: return 0;
    }
  };

  const currentIndex = getPhaseIndex(returnRecord.status);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-5">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Return Reference</span>
          <span className="font-mono font-bold text-[#1A2E4C] text-sm">#{returnRecord.id.substring(0, 12)}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border ${
              returnRecord.status === 'REFUNDED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : returnRecord.status === 'REJECTED'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : returnRecord.status === 'PICKUP_SCHEDULED'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {returnRecord.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Stepper Vertical Timeline */}
      <div className="relative pl-4 space-y-6 before:absolute before:left-7 before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-200">
        {phases.map((phase, idx) => {
          const isDone = idx <= currentIndex && !isRejected;
          const isCurrent = idx === currentIndex;
          const isDanger = phase.isDanger;
          const IconComponent = phase.icon;

          // Stop showing subsequent steps if request is rejected
          if (isRejected && idx > 1) return null;

          return (
            <div key={phase.key} className="relative flex items-start gap-4 z-10">
              {/* Circle Icon Indicator */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                  isDanger
                    ? 'bg-rose-600 text-white border-rose-600 shadow'
                    : isDone
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                    : isCurrent
                    ? 'bg-[#1A2E4C] text-white border-[#1A2E4C] ring-4 ring-[#1A2E4C]/10 shadow'
                    : 'bg-white text-gray-400 border-gray-300'
                }`}
              >
                <IconComponent size={14} />
              </div>

              {/* Phase Content Details */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs font-bold ${isCurrent ? 'text-gray-900' : isDone ? 'text-gray-800' : 'text-gray-400'}`}>
                    {phase.label}
                  </h4>
                  {phase.timestamp && (
                    <span className="text-[10px] text-gray-400 font-medium shrink-0">
                      {new Date(phase.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 mt-0.5">{phase.description}</p>

                {/* Extra detailed cards e.g. Pickup Executive or Refund receipt */}
                {phase.extraInfo}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
