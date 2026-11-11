'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ChevronDown, Phone, Mail, X } from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export type FAQCategory =
  | 'top'
  | 'terms'
  | 'shipping'
  | 'cancellation'
  | 'returns'
  | 'orders'
  | 'payments'
  | 'coupons'
  | 'sizing';

export interface FAQItem {
  id: string;
  category: FAQCategory;
  question: string;
  answer: string;
}

const CATEGORIES: { id: FAQCategory; label: string }[] = [
  { id: 'top', label: 'Top Queries' },
  { id: 'terms', label: 'Terms and Conditions' },
  { id: 'shipping', label: 'Shipping, Order Tracking & Delivery' },
  { id: 'cancellation', label: 'Cancellations and Modifications' },
  { id: 'returns', label: 'Returns and Exchange' },
  { id: 'orders', label: 'Orders & Tracking' },
  { id: 'payments', label: 'Payments & Refunds' },
  { id: 'coupons', label: 'Coupons and Offers' },
  { id: 'sizing', label: 'Sizing & Garment Care' },
];

export const FAQS: FAQItem[] = [
  // ─── Top Queries ───────────────────────────────────────────────────────────
  {
    id: 'top-1',
    category: 'top',
    question: 'Why are there different prices for the same product? Is it legal?',
    answer:
      'Prices may vary based on seasonal promotions, limited-time flash offers, or specific color variants. All prices displayed are inclusive of taxes and fully compliant with Indian consumer pricing regulations.',
  },
  {
    id: 'top-2',
    category: 'top',
    question: 'How do I track my order status?',
    answer:
      'You can track your order anytime on our Track Your Order page by entering your Order ID, or view real-time status updates directly under Profile > My Orders.',
  },
  {
    id: 'top-3',
    category: 'top',
    question: 'Do you charge for shipping?',
    answer:
      'No. All orders ship free across India. There are no delivery charges, convenience fees, or minimum order thresholds required.',
  },
  {
    id: 'top-4',
    category: 'top',
    question: 'Which courier partners handle YOX deliveries?',
    answer:
      'We ship all orders through Shiprocket, partnering with trusted courier services including Blue Dart, Delhivery, Ekart, DTDC, and Xpressbees to ensure fast, reliable doorstep delivery across India.',
  },
  {
    id: 'top-5',
    category: 'top',
    question: 'How will I detect fraudulent emails/calls seeking sensitive personal and confidential information?',
    answer:
      'YOX will never contact you asking for your debit/credit card PIN, CVV, OTP, or net banking password. Always ensure emails come from official @yoxfashion.in addresses and never share financial credentials.',
  },
  {
    id: 'top-6',
    category: 'top',
    question: 'How do I cancel the order, I have placed?',
    answer:
      'You can cancel your order directly before it is dispatched. Go to Profile > My Orders, select your order, and tap "Cancel Order".',
  },
  {
    id: 'top-7',
    category: 'top',
    question: 'How do I create a Return Request?',
    answer:
      'Go to Profile > My Orders, select the delivered order, tap "Return / Exchange", choose your reason, and confirm. Our courier partner will pick up the item from your doorstep for free.',
  },
  {
    id: 'top-8',
    category: 'top',
    question: 'I have created a Return request. When will the product be picked up?',
    answer:
      'Doorstep pickup is typically arranged within 24 to 48 hours of submitting your return request. The courier will notify you via SMS before arrival to coordinate pickup.',
  },
  {
    id: 'top-9',
    category: 'top',
    question: 'I have created a Return request. When will I get the refund?',
    answer:
      'Once the returned item reaches our facility and passes basic quality inspection, your refund is credited within 24–48 hours to your original payment method (or directly to your bank account for COD orders).',
  },
  {
    id: 'top-10',
    category: 'top',
    question: 'Where should I self-ship the Returns?',
    answer:
      'We provide free reverse doorstep pickup for almost all serviceable pin codes. In the rare case that your pin code is not covered for reverse pickup, our customer support team will guide you on self-shipping and reimburse the courier fee.',
  },
  {
    id: 'top-11',
    category: 'top',
    question: 'Are there extra charges for Cash on Delivery (COD)?',
    answer:
      'No. Cash on Delivery is 100% free with no handling fees, cash collection charges, or extra surcharges.',
  },

  // ─── Terms and Conditions ──────────────────────────────────────────────────
  {
    id: 'terms-1',
    category: 'terms',
    question: 'What is YOX’s fair usage policy?',
    answer:
      'Our returns and exchange services are provided complimentary for genuine customer satisfaction. Accounts showing unusually excessive cancellations or returns violating fair usage guidelines may be reviewed by our team.',
  },
  {
    id: 'terms-2',
    category: 'terms',
    question: 'How is customer privacy and personal data protected?',
    answer:
      'We use secure encryption and certified payment gateways to safeguard your personal information. We never sell, lease, or trade your private data to third parties.',
  },
  {
    id: 'terms-3',
    category: 'terms',
    question: 'How can I identify genuine communications from YOX?',
    answer:
      'All legitimate customer communications originate from our official domain (@yoxfashion.in) or registered SMS sender IDs. We never ask for passwords, OTPs, or remote screen access.',
  },

  // ─── Shipping, Order Tracking & Delivery ───────────────────────────────────
  {
    id: 'ship-1',
    category: 'shipping',
    question: 'Do you charge for shipping?',
    answer:
      'No. All orders ship free across India. There are no shipping charges, delivery fees, or minimum order value required.',
  },
  {
    id: 'ship-2',
    category: 'shipping',
    question: 'How fast will my order be delivered?',
    answer:
      'Orders are dispatched within 24–48 hours. Most metro locations receive packages within 2–4 business days, while non-metro locations take 4–6 business days.',
  },
  {
    id: 'ship-3',
    category: 'shipping',
    question: 'Which courier partners handle YOX deliveries?',
    answer:
      'We ship all orders through Shiprocket, partnering with trusted courier services including Blue Dart, Delhivery, Ekart, DTDC, and Xpressbees to ensure fast, reliable doorstep delivery across India.',
  },
  {
    id: 'ship-4',
    category: 'shipping',
    question: 'Do you deliver across India?',
    answer:
      'Yes, we deliver nationwide to over 27,000+ pin codes across India. You can enter your 6-digit pin code on any product page to check delivery estimates.',
  },
  {
    id: 'ship-5',
    category: 'shipping',
    question: 'What happens if I miss the delivery?',
    answer:
      'Our courier partner will attempt delivery up to 3 times on consecutive business days. You will also receive an SMS beforehand with delivery details.',
  },
  {
    id: 'ship-6',
    category: 'shipping',
    question: 'Can I change my delivery address or phone number?',
    answer:
      'If your order has not yet been dispatched, contact our customer support team and we will update your delivery address or contact number.',
  },

  // ─── Cancellations and Modifications ───────────────────────────────────────
  {
    id: 'canc-1',
    category: 'cancellation',
    question: 'How do I cancel my order?',
    answer:
      'You can cancel your order directly from your account before it is dispatched. Go to Profile > My Orders, click on the order, and tap "Cancel Order".',
  },
  {
    id: 'canc-2',
    category: 'cancellation',
    question: 'Can I cancel an order after it has shipped?',
    answer:
      'Once an order has shipped, it cannot be cancelled online. However, you can simply decline the package when the courier arrives, and your refund will be processed once the item returns to our warehouse.',
  },
  {
    id: 'canc-3',
    category: 'cancellation',
    question: 'When will I receive my refund for a cancelled order?',
    answer:
      'For prepaid orders (UPI, cards, net banking), refunds are returned to your original payment method within 24–48 hours. For Cash on Delivery orders, no payment was collected so no refund is needed.',
  },
  {
    id: 'canc-4',
    category: 'cancellation',
    question: 'Can I cancel a single item from an order?',
    answer:
      'Yes. You can cancel individual items before they are packed, or contact our support team to update your order.',
  },
  {
    id: 'canc-5',
    category: 'cancellation',
    question: 'Can I modify the size or color of an item in my order?',
    answer:
      'If your order has not yet shipped, contact our support team to check if size or color adjustments can be made before packaging.',
  },

  // ─── Returns and Exchange ──────────────────────────────────────────────────
  {
    id: 'ret-1',
    category: 'returns',
    question: 'What is your return and exchange window?',
    answer:
      'We offer a 7-day return and exchange window from the date your order is delivered. You can request a return or exchange directly from Profile > My Orders.',
  },
  {
    id: 'ret-2',
    category: 'returns',
    question: 'Is return pickup free?',
    answer:
      'Yes. Doorstep return pickup is completely free. We never charge return shipping, logistics, or restocking fees.',
  },
  {
    id: 'ret-3',
    category: 'returns',
    question: 'How do I exchange an item for a different size or color?',
    answer:
      'Go to Profile > My Orders, select your order, tap "Exchange", and choose your new size or color. Once your original item is picked up, your replacement is dispatched.',
  },
  {
    id: 'ret-4',
    category: 'returns',
    question: 'What condition must returned items be in?',
    answer:
      'Items must be unused, unwashed, and returned in their original condition with all brand tags and packaging attached.',
  },
  {
    id: 'ret-5',
    category: 'returns',
    question: 'When will I receive my return refund?',
    answer:
      'Once your returned item reaches our warehouse and is checked, your refund is processed within 24–48 hours to your original payment method (or your bank account for COD orders).',
  },
  {
    id: 'ret-6',
    category: 'returns',
    question: 'Where should I self-ship the Returns?',
    answer:
      'In rare cases where reverse pickup is unavailable for a remote location, our team will provide our warehouse address and reimburse up to ₹100 for your courier charges.',
  },

  // ─── Orders & Tracking ─────────────────────────────────────────────────────
  {
    id: 'ord-1',
    category: 'orders',
    question: 'How can I track my order?',
    answer:
      'You can track your order anytime on our Track Your Order page by entering your Order ID or tracking number. You can also view real-time status updates under Profile > My Orders.',
  },
  {
    id: 'ord-2',
    category: 'orders',
    question: 'What do the order statuses mean?',
    answer:
      'Placed → Confirmed → Packed → Dispatched → Out for Delivery → Delivered. You will receive SMS and email notifications at each stage.',
  },
  {
    id: 'ord-3',
    category: 'orders',
    question: 'Where can I download my tax invoice?',
    answer:
      'Go to Profile > My Orders, click on your order, and tap "Download Invoice" to download your official GST invoice PDF.',
  },
  {
    id: 'ord-4',
    category: 'orders',
    question: 'What if I did not receive an order confirmation?',
    answer:
      'Order confirmations are sent by email and SMS immediately after placing an order. Please check your spam folder or visit Profile > My Orders to check your active orders.',
  },

  // ─── Payments & Refunds ────────────────────────────────────────────────────
  {
    id: 'pay-1',
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer:
      'We accept UPI (Google Pay, PhonePe, Paytm, BHIM), credit and debit cards (Visa, Mastercard, RuPay), net banking, and Cash on Delivery (COD).',
  },
  {
    id: 'pay-2',
    category: 'payments',
    question: 'Are there extra charges for Cash on Delivery (COD)?',
    answer:
      'No. Cash on Delivery is completely free with no extra fees or convenience charges.',
  },
  {
    id: 'pay-3',
    category: 'payments',
    question: 'What if money was deducted but the order failed?',
    answer:
      'If money was deducted from your bank during a network timeout, banks automatically reverse the full amount back to your account within 2–4 business days.',
  },
  {
    id: 'pay-4',
    category: 'payments',
    question: 'Is my payment information secure?',
    answer:
      'Yes. All payments are encrypted and processed through certified, bank-grade payment gateways. We never store your full card number or CVV.',
  },
  {
    id: 'pay-5',
    category: 'payments',
    question: 'How are COD refunds credited?',
    answer:
      'For COD orders, you can enter your bank account details or UPI ID under Profile > My Orders when initiating a return, and the refund is transferred via IMPS/NEFT.',
  },

  // ─── Coupons and Offers ────────────────────────────────────────────────────
  {
    id: 'coup-1',
    category: 'coupons',
    question: 'How do I apply a coupon code?',
    answer:
      'On the Cart or Checkout page, enter your promo code into the "Apply Coupon" field and click Apply. The discount will instantly reflect on your bill summary.',
  },
  {
    id: 'coup-2',
    category: 'coupons',
    question: 'Can I use multiple coupons on a single order?',
    answer:
      'Only one promo coupon can be applied per order. However, coupon codes can be combined with existing automatic store discounts.',
  },
  {
    id: 'coup-3',
    category: 'coupons',
    question: 'Why is my coupon code not applying?',
    answer:
      'Please verify that the coupon has not expired and that your cart meets any applicable minimum cart criteria or eligible product categories.',
  },

  // ─── Sizing & Garment Care ─────────────────────────────────────────────────
  {
    id: 'size-1',
    category: 'sizing',
    question: 'How do YOX clothes fit?',
    answer:
      'Our clothing fits true to standard Indian sizing. If you prefer a looser or oversized look, we recommend choosing one size up.',
  },
  {
    id: 'size-2',
    category: 'sizing',
    question: 'How do I find my exact size?',
    answer:
      'Each product page features a detailed size chart with chest, waist, and length measurements in inches and centimeters to help you choose the right fit.',
  },
  {
    id: 'size-3',
    category: 'sizing',
    question: 'Do fabrics shrink after washing?',
    answer:
      'Our fabrics are pre-shrunk to retain their shape and fit. Following the care label on your garment will keep it looking its best.',
  },
  {
    id: 'size-4',
    category: 'sizing',
    question: 'How should I care for my garments?',
    answer:
      'Check the care tag inside each garment. Most shirts and tees can be machine washed cold. For outerwear and jackets, professional dry cleaning is recommended.',
  },
];

export default function HelpCentrePage() {
  const { config } = useStoreSettingsStore();
  const [selectedCategory, setSelectedCategory] = useState<FAQCategory>('top');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Handle URL hash changes (e.g. /help-centre#shipping, #cancellation, etc.)
  const handleHashChange = () => {
    if (typeof window === 'undefined') return;
    const rawHash = window.location.hash.replace('#', '').toLowerCase();

    let targetCat: FAQCategory | null = null;
    if (rawHash === 'shipping' || rawHash === 'delivery') targetCat = 'shipping';
    else if (rawHash === 'cancellation' || rawHash === 'cancel') targetCat = 'cancellation';
    else if (rawHash === 'returns' || rawHash === 'exchange' || rawHash === 'refund') targetCat = 'returns';
    else if (rawHash === 'orders' || rawHash === 'tracking' || rawHash === 'track') targetCat = 'orders';
    else if (rawHash === 'payments' || rawHash === 'payment' || rawHash === 'cod') targetCat = 'payments';
    else if (rawHash === 'sizing' || rawHash === 'size' || rawHash === 'care') targetCat = 'sizing';
    else if (rawHash === 'terms') targetCat = 'terms';
    else if (rawHash === 'coupons' || rawHash === 'offers') targetCat = 'coupons';

    if (targetCat) {
      setSelectedCategory(targetCat);
    }
  };

  useEffect(() => {
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const selectCategory = (catId: FAQCategory) => {
    setSelectedCategory(catId);
    setOpenFaqId(null);
    if (catId !== 'top') {
      window.history.replaceState(null, '', `#${catId}`);
    } else {
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const currentCategoryDef = CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0];
  const filteredFaqs = FAQS.filter((faq) => faq.category === selectedCategory);

  const supportPhone = config.supportPhone || '1800-123-1444';
  const supportEmail = config.supportEmail || 'support@yoxfashion.in';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Main Content Container ───────────────────────────────────────────── */}
      <div className="w-[92%] max-w-6xl mx-auto py-8 lg:py-12">
        {/* ─── Top Header Bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-gray-200 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm text-gray-500">Still need help?</span>
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-600 rounded-none uppercase tracking-wider transition-colors cursor-pointer"
            >
              CONTACT US
            </button>
          </div>
        </div>

        {/* ─── Two-Column FAQ Layout ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 pt-8">
          {/* ─── Left Sidebar Navigation ─────────────────────────────────────── */}
          <div className="md:col-span-5 lg:col-span-4 border-b md:border-b-0 md:border-r border-gray-200 pb-6 md:pb-0 md:pr-4">
            <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible no-scrollbar gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => selectCategory(cat.id)}
                    className={`relative w-full text-left flex items-center gap-3 py-3 px-3 transition-colors cursor-pointer whitespace-nowrap md:whitespace-normal group ${
                      isActive
                        ? 'text-[#F4A71D] font-semibold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Star
                      size={17}
                      className={`shrink-0 transition-colors ${
                        isActive
                          ? 'fill-[#F4A71D] text-[#F4A71D]'
                          : 'text-gray-400 stroke-[1.5] group-hover:text-gray-600'
                      }`}
                    />
                    <span className="text-xs sm:text-sm leading-tight">{cat.label}</span>

                    {/* Active Golden Right Bar (Matches screenshot) */}
                    {isActive && (
                      <span className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-[#F4A71D] rounded-l" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* ─── Right Content Area ───────────────────────────────────────────── */}
          <div className="md:col-span-7 lg:col-span-8 pl-0 md:pl-2">
            {/* Category Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-4">
              {currentCategoryDef.label}
            </h2>

            {/* Order Action Sub-banner (Matches screenshot) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-dashed border-gray-300 gap-3 mb-6">
              <span className="text-xs sm:text-sm text-gray-600">
                You can track your orders in &apos;My Orders.&apos;
              </span>
              <Link
                href="/profile/orders"
                className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-600 uppercase tracking-wider rounded-none transition-colors self-start sm:self-auto"
              >
                TRACK ORDERS
              </Link>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => {
                  const isOpen = openFaqId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className="border-b border-gray-100 last:border-b-0 pb-3.5"
                    >
                      <button
                        type="button"
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full text-left flex items-start justify-between gap-4 group cursor-pointer"
                      >
                        <span
                          className={`text-xs sm:text-sm font-bold leading-snug transition-colors ${
                            isOpen ? 'text-black' : 'text-gray-800 group-hover:text-black'
                          }`}
                        >
                          {faq.question}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`text-gray-400 shrink-0 mt-0.5 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-black' : 'group-hover:text-gray-700'
                          }`}
                        />
                      </button>

                      {isOpen && (
                        <div className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed pr-4 animate-fadeIn">
                          <p>{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No questions currently listed under this category.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Contact Us Modal ─────────────────────────────────────────────────── */}
      {isContactModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsContactModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border border-gray-200 p-6 sm:p-8 shadow-xl relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsContactModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black p-1 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Contact Customer Support
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Our customer care team is available Monday to Saturday, 9:30 AM – 9:30 PM IST.
            </p>

            <div className="mt-6 space-y-3">
              {/* Phone */}
              <a
                href={`tel:${supportPhone}`}
                className="flex items-center justify-between p-3.5 border border-gray-200 hover:border-black transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
                    <Phone size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Phone Call
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      {supportPhone}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                  Call Now
                </span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-center justify-between p-3.5 border border-gray-200 hover:border-black transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center">
                    <Mail size={14} />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Email Support
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 truncate max-w-[180px] sm:max-w-[220px] block">
                      {supportEmail}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-blue-600 group-hover:underline">
                  Send Email
                </span>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
              <span>Average response time: &lt; 2 hrs</span>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                className="text-gray-900 font-bold hover:underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
