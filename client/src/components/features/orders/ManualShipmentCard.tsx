'use client';

import React, { useState } from 'react';
import { BackendReturn, returnsApi } from '@/lib/api/returns';
import {
  MapPin,
  Truck,
  Building2,
  CreditCard,
  CheckCircle2,
  Info,
  Send,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface ManualShipmentCardProps {
  returnRecord: BackendReturn;
  onShipmentSubmitted: (updatedReturn: BackendReturn) => void;
}

export const YOX_RETURN_ADDRESS = {
  department: 'YOX Returns & Quality Inspection Department',
  building: 'Building #42, Industrial Fashion Hub',
  area: 'Udyog Vihar Phase 4',
  city: 'Gurgaon',
  state: 'Haryana',
  postalCode: '122016',
  country: 'India',
  contactEmail: 'returns@yox.com',
  contactPhone: '+91 98765 43210',
};

export function ManualShipmentCard({ returnRecord, onShipmentSubmitted }: ManualShipmentCardProps) {
  const [courierTrackingNumber, setCourierTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('India Post');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCopiedAddress, setHasCopiedAddress] = useState(false);

  const handleCopyAddress = () => {
    const fullAddress = `${YOX_RETURN_ADDRESS.department}
${YOX_RETURN_ADDRESS.building}, ${YOX_RETURN_ADDRESS.area}
${YOX_RETURN_ADDRESS.city}, ${YOX_RETURN_ADDRESS.state} - ${YOX_RETURN_ADDRESS.postalCode}, ${YOX_RETURN_ADDRESS.country}
Phone: ${YOX_RETURN_ADDRESS.contactPhone}`;

    navigator.clipboard.writeText(fullAddress);
    setHasCopiedAddress(true);
    toast.success('YOX Return Address copied to clipboard!');
    setTimeout(() => setHasCopiedAddress(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!courierTrackingNumber.trim()) {
      toast.error('Please enter the Courier Tracking / Consignment Number.');
      return;
    }

    if (!accountHolderName.trim() || !accountNumber.trim() || !ifscCode.trim()) {
      toast.error('Please fill in all required bank details for your refund.');
      return;
    }

    try {
      setIsSubmitting(true);
      const targetId = returnRecord.id || (returnRecord as any)._id;
      if (!targetId) {
        toast.error('Return record ID is missing.');
        return;
      }

      const updated = await returnsApi.submitReturnShipment(targetId, {
        courierTrackingNumber: courierTrackingNumber.trim(),
        trackingNumber: courierTrackingNumber.trim(),
        courierName: courierName.trim() || 'India Post',
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim() || undefined,
        bankDetails: {
          accountHolderName: accountHolderName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          bankName: bankName.trim() || undefined,
        },
      });

      toast.success('Shipment & Refund details submitted successfully! We will verify once received.');
      onShipmentSubmitted(updated);
    } catch (error: any) {
      console.error('submitReturnShipment error:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to submit shipment details.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/70 via-white to-amber-50/40 border-2 border-blue-200/90 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Approval banner header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <span>Your Return Request Has Been Approved</span>
            </h3>
            <p className="text-xs text-gray-600 mt-0.5">
              Please manually send the package to our return address and enter consignment details below.
            </p>
          </div>
        </div>
        <span className="self-start sm:self-auto text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 px-3 py-1 rounded-full">
          Action Required
        </span>
      </div>

      {/* Return Address & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={15} className="text-[#1A2E4C]" />
              YOX Return Address
            </h4>
            <button
              type="button"
              onClick={handleCopyAddress}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1A2E4C] hover:text-[#132238] bg-gray-50 hover:bg-gray-100 px-2.5 py-1 rounded border border-gray-200 transition-colors"
            >
              {hasCopiedAddress ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{hasCopiedAddress ? 'Copied' : 'Copy Address'}</span>
            </button>
          </div>

          <div className="text-xs space-y-1 text-gray-700 font-medium">
            <p className="font-bold text-gray-900">{YOX_RETURN_ADDRESS.department}</p>
            <p>{YOX_RETURN_ADDRESS.building}</p>
            <p>{YOX_RETURN_ADDRESS.area}</p>
            <p>
              {YOX_RETURN_ADDRESS.city}, {YOX_RETURN_ADDRESS.state} -{' '}
              <span className="font-mono font-bold text-gray-900">{YOX_RETURN_ADDRESS.postalCode}</span>
            </p>
            <p className="text-gray-900 font-semibold">{YOX_RETURN_ADDRESS.country}</p>
            <div className="pt-2 text-[11px] text-gray-500 border-t border-gray-100">
              <p>Email: {YOX_RETURN_ADDRESS.contactEmail} | Phone: {YOX_RETURN_ADDRESS.contactPhone}</p>
            </div>
          </div>
        </div>

        {/* Step Guide */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-3 text-xs text-gray-700">
          <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={15} className="text-[#1A2E4C]" />
            Return Instructions
          </h4>
          <ol className="space-y-2 list-decimal list-inside text-gray-600">
            <li>Pack the item securely in its original packaging along with tags and invoices.</li>
            <li>
              Ship the package via <strong className="text-gray-900">India Post (Speed Post)</strong> or any reputable courier (Blue Dart, DTDC, Delhivery).
            </li>
            <li>Note down your <strong className="text-gray-900">Courier Tracking / Consignment Number</strong> from the receipt.</li>
            <li>Submit your tracking number and refund bank details in the form below.</li>
          </ol>
        </div>
      </div>

      {/* Shipment & Refund Bank Details Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs space-y-5">
        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2.5">
          <Send size={15} className="text-[#1A2E4C]" />
          Submit Shipping & Refund Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-gray-800 block mb-1">
              Courier Tracking Number / Consignment Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={courierTrackingNumber}
              onChange={(e) => setCourierTrackingNumber(e.target.value)}
              placeholder="e.g. IN123456789 or SPEEDPOST-XYZ"
              className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#1A2E4C]"
            />
          </div>

          <div>
            <label className="font-bold text-gray-800 block mb-1">Courier Service Name</label>
            <input
              type="text"
              value={courierName}
              onChange={(e) => setCourierName(e.target.value)}
              placeholder="e.g. India Post (Speed Post), DTDC, Blue Dart"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
            />
          </div>
        </div>

        {/* Bank Details Sub-section */}
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-[#1A2E4C]" />
            <h5 className="font-bold text-xs text-gray-900">Refund Bank Account Details</h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-800 block mb-1">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={accountHolderName}
                onChange={(e) => setAccountHolderName(e.target.value)}
                placeholder="Full name as on bank passbook"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Bank account number"
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono text-xs focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>

            <div>
              <label className="font-bold text-gray-800 block mb-1">
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. SBIN0001234"
                className="w-full border border-gray-300 rounded-lg p-2.5 font-mono uppercase text-xs focus:ring-2 focus:ring-[#1A2E4C]"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-gray-800 block mb-1">Bank Name / Branch (Optional)</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. State Bank of India, Connaught Place"
              className="w-full border border-gray-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-[#1A2E4C]"
            />
          </div>
        </div>

        {/* Security & Refund Timeline Notice */}
        <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
          <Info size={16} className="text-blue-700 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            ℹ️ Once YOX receives and verifies your returned package at our facility, your refund of the item amount will be credited directly to your provided bank account within <strong className="font-bold text-blue-950">2 business days</strong>.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Submitting Details...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Submit Shipping & Refund Details</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
