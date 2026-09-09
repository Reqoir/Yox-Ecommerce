'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CreditCard, Banknote, ArrowRight, AlertCircle } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { DEFAULT_STORE_CONFIG } from '@/api/admin/settings';
import { useSearchParams, useRouter } from 'next/navigation';
import { ordersApi } from '@/lib/api/orders';
import { paymentsApi } from '@/lib/api/payments';
import { loadRazorpayScript } from '@/lib/razorpay';
import { PaymentProcessingOverlay } from '@/components/features/checkout/payment-processing-overlay';
import { toast } from 'sonner';

export function CheckoutSummaryPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBuyNow = searchParams?.get('buyNow') === '1' || searchParams?.get('buyNow') === 'true';

  const { getSubtotal, getSavingsTotal, getItemCount, clearCart } = useCartStore();
  const { config } = useStoreSettingsStore();
  const {
    addresses,
    selectedAddressId,
    paymentMethod,
    setOrderSuccess,
    directBuyItem,
    setDirectBuyItem,
  } = useCheckoutStore();
  const { user } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingOverlay, setIsLoadingOverlay] = useState(false);

  const isDirectCheckout = isBuyNow && !!directBuyItem;

  const userRole = (user as any)?.role || user?.roleId || '';
  const userRoleUpper = typeof userRole === 'string' ? userRole.toUpperCase() : '';
  const isAdmin = userRoleUpper.includes('ADMIN') || (user?.permissions || []).includes('*');
  const isMaintenance = Boolean(config.maintenanceMode);

  const subtotal = isDirectCheckout
    ? directBuyItem.price * directBuyItem.quantity
    : getSubtotal();

  const savings = isDirectCheckout
    ? (directBuyItem.comparePrice && directBuyItem.comparePrice > directBuyItem.price
        ? (directBuyItem.comparePrice - directBuyItem.price) * directBuyItem.quantity
        : 0)
    : getSavingsTotal();

  const itemCount = isDirectCheckout
    ? directBuyItem.quantity
    : getItemCount();

  const freeShippingThreshold = config.freeShippingThreshold ?? DEFAULT_STORE_CONFIG.freeShippingThreshold;
  const standardShippingFee = config.standardShippingFee ?? DEFAULT_STORE_CONFIG.standardShippingFee;
  const shippingFee = subtotal >= freeShippingThreshold || subtotal === 0 ? 0 : standardShippingFee;
  const grandTotal = subtotal + shippingFee;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const handlePlaceOrder = async () => {
    if (isMaintenance) {
      toast.error('Store maintenance is currently active. Order placement is temporarily suspended.');
      return;
    }

    if (!selectedAddress) {
      toast.error('Please select or add a delivery address first');
      return;
    }

    if (itemCount === 0) {
      toast.error(isDirectCheckout ? 'No item selected for purchase' : 'Your shopping cart is empty');
      return;
    }

    setIsProcessing(true);

    const shippingAddressSnapshot = {
      fullName: selectedAddress.fullName,
      phone: selectedAddress.phone,
      streetAddress: `${(selectedAddress as any).streetAddress || (selectedAddress as any).street || ''}${((selectedAddress as any).landmark) ? `, ${(selectedAddress as any).landmark}` : ''}`,
      landmark: (selectedAddress as any).landmark || '',
      city: selectedAddress.city,
      state: selectedAddress.state,
      country: selectedAddress.country || 'India',
      postalCode: (selectedAddress as any).pincode || (selectedAddress as any).zipCode || '400001',
    };

    const directBuyPayload = isDirectCheckout && directBuyItem ? {
      variantId: directBuyItem.variantId || directBuyItem.id,
      quantity: directBuyItem.quantity,
      price: directBuyItem.price,
    } : undefined;

    // ──────────────────────────────────────────────────────────────────────────
    // FLOW 1: RAZORPAY ONLINE PAYMENT
    // ──────────────────────────────────────────────────────────────────────────
    if (paymentMethod === 'RAZORPAY') {
      let rzpInstance: any = null;

      const forceCloseRazorpay = () => {
        try {
          if (rzpInstance && typeof rzpInstance.close === 'function') {
            rzpInstance.close();
          }
        } catch {}
        if (typeof document !== 'undefined') {
          const elements = document.querySelectorAll('.razorpay-container, iframe[name^="razorpay"]');
          elements.forEach((el) => {
            try {
              el.remove();
            } catch {}
          });
          document.body.style.overflow = '';
        }
      };

      try {
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error('Razorpay SDK failed to load. Please check your internet connection and try again.');
        }

        // 1. Authoritative order initialization on server (only button spinner shows)
        const rzpInitData = await paymentsApi.createRazorpayOrder({
          shippingAddress: shippingAddressSnapshot,
          addressId: selectedAddress.id,
          directBuyItem: directBuyPayload,
        });

        // 2. Configure and Open Razorpay Checkout Popup
        const options = {
          key: rzpInitData.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpInitData.amount,
          currency: rzpInitData.currency || 'INR',
          name: "YOX Men's Fashion",
          description: `Order #${rzpInitData.orderNumber}`,
          order_id: rzpInitData.razorpayOrderId,
          prefill: {
            name: user?.fullName || selectedAddress.fullName,
            email: user?.email || '',
            contact: selectedAddress.phone || user?.phone || '',
          },
          theme: {
            color: '#1A2E4C',
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setIsLoadingOverlay(false);
              if (isDirectCheckout) {
                toast.info('Payment was cancelled. You can retry checkout anytime.');
              } else {
                toast.info('Payment was cancelled. Your items remain saved in your bag.');
              }
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            // STEP A: Automatically and immediately close the Razorpay modal
            forceCloseRazorpay();

            // STEP B: Show minimal YOX spinner loading animation during verification
            setIsLoadingOverlay(true);

            try {
              // 3. Cryptographic Signature Verification on Backend
              const verifiedOrder = await paymentsApi.verifyRazorpayPayment({
                orderId: rzpInitData.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              });

              // Delivery date estimation
              const deliveryDays = config.estimatedDeliveryDaysMax || 4;
              const deliveryDate = new Date();
              deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
              const formattedDate = deliveryDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });

              if (isDirectCheckout) {
                setDirectBuyItem(null);
              } else {
                clearCart();
              }

              setOrderSuccess(true, {
                orderId: verifiedOrder.orderNumber,
                total: verifiedOrder.totalAmount,
                paymentMethod: 'RAZORPAY',
                deliveryDate: formattedDate,
                itemCount: verifiedOrder.items?.length || itemCount,
              });

              // Brief pause with the spinner before redirect
              await new Promise((r) => setTimeout(r, 600));

              // STEP D: Redirect to Payment Success Page
              router.push(`/order-success?orderId=${verifiedOrder.orderNumber}`);
            } catch (verifyError: any) {
              console.error('Payment verification failed:', verifyError);
              const msg = verifyError?.response?.data?.message || 'Payment verification failed.';

              await new Promise((r) => setTimeout(r, 600));
              router.push(`/order-failed?orderId=${rzpInitData.orderNumber}&paymentId=${response.razorpay_payment_id}&reason=${encodeURIComponent(msg)}`);
            } finally {
              setIsProcessing(false);
            }
          },
        };

        rzpInstance = new window.Razorpay(options);

        // On Payment Failed: Automatically close Razorpay panel -> show spinner -> redirect to failure page
        rzpInstance.on('payment.failed', async (response: any) => {
          setIsProcessing(false);
          forceCloseRazorpay();
          setIsLoadingOverlay(true);

          const reason = response?.error?.description || 'Payment was declined by your bank or UPI app.';
          await new Promise((r) => setTimeout(r, 600));
          router.push(`/order-failed?orderId=${rzpInitData.orderNumber}&paymentId=${response?.error?.metadata?.payment_id || ''}&reason=${encodeURIComponent(reason)}`);
        });

        // Open Razorpay Popup
        rzpInstance.open();
        setIsProcessing(false);
      } catch (error: any) {
        setIsProcessing(false);
        setIsLoadingOverlay(false);
        console.error('Razorpay initialization failed:', error);
        const msg = error?.response?.data?.message || error?.message || 'Failed to initialize payment. Please try again.';
        toast.error(msg);
      }
      return;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // FLOW 2: CASH ON DELIVERY (COD)
    // ──────────────────────────────────────────────────────────────────────────
    try {
      setIsLoadingOverlay(true);

      const orderPayload: any = {
        shippingAddress: shippingAddressSnapshot,
        paymentMethod: paymentMethod,
        directBuyItem: directBuyPayload,
      };

      const order = await ordersApi.placeOrder(orderPayload);

      // Delivery date estimation based on store settings
      const deliveryDays = config.estimatedDeliveryDaysMax || 4;
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
      const formattedDate = deliveryDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Clear only if normal cart checkout! For direct buy, keep customer's cart intact!
      if (isDirectCheckout) {
        setDirectBuyItem(null);
      } else {
        clearCart();
      }

      // Set order success details with authoritative backend values
      setOrderSuccess(true, {
        orderId: order?.orderNumber || `YOX-${Math.floor(100000 + Math.random() * 900000)}`,
        total: order?.totalAmount || grandTotal,
        paymentMethod: paymentMethod,
        deliveryDate: formattedDate,
        itemCount: order?.items?.length || itemCount,
      });

      toast.success('Order placed successfully!');
      
      // Redirect to dedicated YOX Order Success Page
      router.push(`/order-success?orderId=${order.orderNumber}`);
    } catch (error: any) {
      setIsLoadingOverlay(false);
      console.error('Order placement failed:', error);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Failed to complete order placement. Please check your login status or try again.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded p-6 sticky top-24">
      {isDirectCheckout && (
        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-center justify-between">
          <span className="font-bold">⚡ Buy It Now Item</span>
          <span className="text-[11px] text-amber-700">Other cart items remain saved</span>
        </div>
      )}

      <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Payment Details
      </h3>

      {/* Selected Address Preview */}
      {selectedAddress ? (
        <div className="bg-white border border-gray-200 rounded p-3 mb-5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
            Shipping To
          </span>
          <p className="font-bold text-gray-900">{selectedAddress.fullName}</p>
          <p className="text-gray-600 truncate">{(selectedAddress as any).streetAddress || (selectedAddress as any).street || ''}, {selectedAddress.city}</p>
          <p className="text-gray-500 font-medium">Pin: {(selectedAddress as any).pincode || (selectedAddress as any).zipCode || ''}</p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded p-3 mb-5 text-xs font-semibold">
          ⚠️ Please select a delivery address
        </div>
      )}

      {/* Pricing Breakdown */}
      <div className="space-y-3 text-xs mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} items)</span>
          <span className="font-bold text-gray-900">₹{subtotal}</span>
        </div>

        {savings > 0 && (
          <div className="flex justify-between text-emerald-600 font-medium">
            <span>Bag Savings</span>
            <span className="font-bold">-₹{savings}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Delivery Charge</span>
          {shippingFee === 0 ? (
            <span className="font-bold text-emerald-600 uppercase">FREE</span>
          ) : (
            <span className="font-bold text-gray-900">₹{shippingFee}</span>
          )}
        </div>

        <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
          <span className="text-sm font-bold text-gray-900">Total Payable</span>
          <div className="text-right">
            <span className="text-xl font-bold text-gray-900">₹{grandTotal}</span>
            <p className="text-[10px] text-gray-400">Inclusive of all taxes</p>
          </div>
        </div>
      </div>

      {/* Maintenance Notice */}
      {isMaintenance && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-2">
          <AlertCircle size={15} className="text-amber-600 mt-0.5 shrink-0" />
          <span>Checkout is currently paused for scheduled maintenance.</span>
        </div>
      )}

      {/* Dynamic CTA Button */}
      <button
        onClick={handlePlaceOrder}
        disabled={isProcessing || !selectedAddress || itemCount === 0 || isMaintenance}
        className="w-full flex items-center justify-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold tracking-wider py-4 rounded transition-colors shadow-sm mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isMaintenance ? (
          <span>CHECKOUT TEMPORARILY PAUSED</span>
        ) : isProcessing ? (
          <span>PROCESSING ORDER...</span>
        ) : paymentMethod === 'RAZORPAY' ? (
          <>
            <CreditCard size={16} />
            <span>PAY ₹{grandTotal} WITH RAZORPAY</span>
          </>
        ) : (
          <>
            <Banknote size={16} />
            <span>PLACE ORDER (COD)</span>
          </>
        )}
      </button>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
        <Lock size={14} className="text-emerald-600" />
        <span>Safe & Encrypted Transactions</span>
      </div>

      {/* Full-Screen Minimalist YOX Loading Spinner */}
      <PaymentProcessingOverlay isOpen={isLoadingOverlay} />
    </div>
  );
}
