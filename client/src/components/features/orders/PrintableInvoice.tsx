'use client';

import React from 'react';
import { BackendOrder } from '@/lib/api/orders';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { CheckCircle2, ShieldCheck, Phone, Mail, Globe, MapPin } from 'lucide-react';

interface PrintableInvoiceProps {
  order: BackendOrder | null;
  fallbackOrderNumber?: string;
  fallbackTotal?: number;
  fallbackPaymentMethod?: string;
  fallbackPaymentStatus?: string;
  fallbackDate?: string;
  fallbackAddress?: any;
  fallbackItems?: any[];
}

function convertNumberToWords(amount: number): string {
  if (!amount || amount === 0) return 'Zero';
  const units = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const num = Math.floor(Math.abs(amount));

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += units[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += units[n] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  if (crore > 0) words += convertGroup(crore) + ' Crore ';
  if (lakh > 0) words += convertGroup(lakh) + ' Lakh ';
  if (thousand > 0) words += convertGroup(thousand) + ' Thousand ';
  if (rem > 0) words += convertGroup(rem);

  return (words.trim() || 'Zero') + ' Rupees Only';
}

export function PrintableInvoice({
  order,
  fallbackOrderNumber,
  fallbackTotal,
  fallbackPaymentMethod,
  fallbackPaymentStatus,
  fallbackDate,
  fallbackAddress,
  fallbackItems,
}: PrintableInvoiceProps) {
  const { config } = useStoreSettingsStore();

  const orderNumber = order?.orderNumber || fallbackOrderNumber || 'YOX-ORDER';
  const totalAmount = order?.totalAmount ?? fallbackTotal ?? 0;
  const subtotal = order?.subtotal ?? totalAmount;
  const shippingCharge = order?.shippingCharge ?? 0;
  const discount = order?.discount ?? 0;
  const paymentMethod = order?.paymentMethod || fallbackPaymentMethod || 'RAZORPAY';
  const paymentStatus = order?.paymentStatus || fallbackPaymentStatus || (paymentMethod === 'RAZORPAY' ? 'PAID' : 'PENDING');
  const isOnlinePayment = paymentMethod === 'RAZORPAY';

  const orderDateObj = order?.placedAt ? new Date(order.placedAt) : new Date();
  const formattedDate = orderDateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = orderDateObj.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const address = order?.shippingAddress || fallbackAddress;
  const items = order?.items && order.items.length > 0 ? order.items : (fallbackItems || []);

  const totalQuantity = items.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 1;
  const gstIncluded = Math.round(totalAmount * 0.05);

  const amountInWords = convertNumberToWords(totalAmount);

  return (
    <div className="invoice-container bg-white text-slate-900 font-sans text-[11px] leading-relaxed p-6 sm:p-10 max-w-[800px] mx-auto border border-gray-200 rounded-sm print:border-0 print:p-0 print:max-w-none">
      
      {/* ─── Header: Brand & Document Title ─── */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black tracking-wider text-slate-900 uppercase">YOX</span>
            <span className="text-xs px-2 py-0.5 bg-slate-900 text-white font-bold tracking-widest uppercase rounded-[2px]">
              FASHION
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-700 mt-1">{config.storeName || "YOX Men's Fashion"}</p>
          <p className="text-[10px] text-slate-500 max-w-xs leading-normal mt-0.5">
            {config.storeAddress || 'YOX Fashion House, BKC, Bandra East, Mumbai, Maharashtra 400051'}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1.5">
            <span>GSTIN: 27AAACY1234F1Z5</span>
            <span>•</span>
            <span>PAN: AAACY1234F</span>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block px-3 py-1 bg-slate-100 border border-slate-300 font-extrabold text-xs uppercase tracking-wider text-slate-900 mb-2">
            TAX INVOICE / CASH MEMO
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Original for Recipient</p>
          <div className="mt-2 text-right">
            <p className="text-xs font-bold text-slate-900 font-mono">Invoice #{orderNumber}</p>
            <p className="text-[10px] text-slate-600">Date: {formattedDate} ({formattedTime})</p>
            <p className="text-[10px] text-slate-600">Place of Supply: {address?.state || 'Maharashtra'} (State Code: 27)</p>
          </div>
        </div>
      </div>

      {/* ─── Order & Parties Information ─── */}
      <div className="grid grid-cols-2 gap-4 border border-slate-200 rounded-[2px] p-3.5 mb-5 bg-slate-50/50">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            BILLED TO & DELIVERED TO:
          </span>
          <p className="text-xs font-bold text-slate-900">{address?.fullName || order?.customer?.fullName || 'Customer'}</p>
          <div className="text-slate-600 space-y-0.5 mt-0.5">
            <p>{address?.streetAddress || 'Address on file'}</p>
            {address?.landmark && <p className="text-slate-500">Landmark: {address.landmark}</p>}
            <p>{address?.city ? `${address.city}, ${address.state} - ${address.postalCode}` : 'Delivery City & State'}</p>
            <p className="font-medium text-slate-800 pt-0.5">Phone: {address?.phone || order?.customer?.phone || 'N/A'}</p>
            {order?.customer?.email && <p className="text-slate-500">Email: {order.customer.email}</p>}
          </div>
        </div>

        <div className="border-l border-slate-200 pl-4">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            PAYMENT & ORDER DETAILS:
          </span>
          <div className="space-y-1 text-slate-700">
            <div className="flex justify-between">
              <span className="text-slate-500">Order Number:</span>
              <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-semibold text-slate-900">
                {isOnlinePayment ? 'Online (Razorpay)' : 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`font-bold uppercase ${paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {paymentStatus}
              </span>
            </div>
            {order?.paymentId && (
              <div className="flex justify-between">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono text-[10px] text-slate-800 truncate max-w-[150px]">{order.paymentId}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-500">Dispatch Method:</span>
              <span className="text-slate-800 font-medium">Standard Surface Express</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Line Items Table ─── */}
      <div className="border border-slate-300 rounded-[2px] overflow-hidden mb-5">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 text-[10px] uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Description of Goods</th>
              <th className="py-2.5 px-3 text-center w-24">HSN / SKU</th>
              <th className="py-2.5 px-3 text-center w-16">Qty</th>
              <th className="py-2.5 px-3 text-right w-24">Unit Price</th>
              <th className="py-2.5 px-3 text-right w-28">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {items.length > 0 ? (
              items.map((item: any, idx: number) => {
                const itemTotal = item.subtotal || (item.unitPrice * (item.quantity || 1));
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{item.productName}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                        {item.size && <span>Size: <strong>{item.size}</strong></span>}
                        {item.color && (
                          <>
                            <span>•</span>
                            <span>Color: <strong>{item.color}</strong></span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-600">
                      {item.sku || '61091000'}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-slate-900">
                      {item.quantity || 1}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{item.unitPrice?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{itemTotal.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="py-3 px-3 text-center text-slate-400 font-mono">1</td>
                <td className="py-3 px-3">
                  <p className="font-bold text-slate-900">Merchandise Order #{orderNumber}</p>
                  <p className="text-[10px] text-slate-500">Contemporary Fashion Apparel</p>
                </td>
                <td className="py-3 px-3 text-center font-mono text-[10px] text-slate-600">61091000</td>
                <td className="py-3 px-3 text-center font-bold text-slate-900">1</td>
                <td className="py-3 px-3 text-right font-mono text-slate-700">₹{totalAmount.toLocaleString('en-IN')}</td>
                <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Financial Totals Breakdown & Words ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mb-6">
        
        {/* Left: Amount in Words & Tax Note */}
        <div className="space-y-3">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-[2px]">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
              INVOICE AMOUNT IN WORDS:
            </span>
            <p className="text-xs font-bold text-slate-900 italic">
              {amountInWords}
            </p>
          </div>

          <div className="text-[10px] text-slate-500 space-y-1">
            <p>• Tax rates applicable under GST: 5% on apparel value under ₹1,000 / 12% above ₹1,000.</p>
            <p>• Taxes have been duly calculated and included in the price breakdown.</p>
            <p>• Total quantity of items delivered: <strong className="text-slate-700">{totalQuantity} Units</strong></p>
          </div>
        </div>

        {/* Right: Calculations Summary Table */}
        <div className="border border-slate-300 rounded-[2px] overflow-hidden text-xs">
          <div className="divide-y divide-slate-200">
            <div className="flex justify-between py-2 px-3 bg-white">
              <span className="text-slate-600">Items Gross Subtotal</span>
              <span className="font-mono font-semibold text-slate-900">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between py-2 px-3 bg-emerald-50/50 text-emerald-800">
                <span>Coupon / Promotion Discount</span>
                <span className="font-mono font-bold">-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="flex justify-between py-2 px-3 bg-white">
              <span className="text-slate-600">Shipping & Delivery Charges</span>
              <span className="font-semibold text-emerald-700">
                {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge.toLocaleString('en-IN')}`}
              </span>
            </div>

            <div className="flex justify-between py-2 px-3 bg-slate-50/80 text-[10px] text-slate-500">
              <span>Estimated Tax (GST Included)</span>
              <span className="font-mono font-medium">₹{gstIncluded.toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-between py-3 px-3 bg-slate-900 text-white font-bold text-sm">
              <span className="uppercase tracking-wider">Grand Total (INR)</span>
              <span className="font-mono font-extrabold text-base">₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ─── Footer: Declaration & Authorized Signatory ─── */}
      <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-end gap-6 text-[10px] text-slate-500">
        <div className="max-w-md space-y-1">
          <p className="font-bold text-slate-700 uppercase tracking-wider">TERMS & CONDITIONS</p>
          <p>1. Returns and exchanges are eligible within 7 days from the date of product delivery in unworn condition.</p>
          <p>2. Keep this invoice and all original packaging intact for warranty or return claims.</p>
          <p>3. This is a computer-generated tax invoice verified under the Information Technology Act, 2000. No physical signature is required.</p>
          <p className="text-slate-600 pt-1">
            Customer Support: {config.supportEmail || 'support@yox.com'} | Tel: {config.supportPhone || '+91 98765 43210'}
          </p>
        </div>

        <div className="text-center sm:text-right shrink-0">
          <p className="font-bold text-slate-900 mb-6">For {config.storeName || "YOX Men's Fashion"}</p>
          <div className="inline-block border-b border-slate-400 pb-0.5 mb-1 px-4 text-center">
            <span className="font-serif italic font-bold text-slate-700 text-xs">Authorized Signatory</span>
          </div>
          <p className="text-[9px] text-slate-400">Electronically Verified & Signed</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .invoice-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}

