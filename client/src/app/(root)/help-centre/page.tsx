'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  Phone,
  Mail,
  MessageCircle,
  Truck,
  RotateCcw,
  CreditCard,
  User,
  Shield,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Sparkles,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

interface FAQItem {
  id: string;
  category: 'orders' | 'shipping' | 'returns' | 'payments' | 'sizing';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  // Orders & Tracking
  {
    id: 'ot-1',
    category: 'orders',
    question: 'How do I track my order in real-time?',
    answer:
      'Once your order is dispatched, you will receive an automated SMS and email containing your AWB tracking link. You can also visit our dedicated Track Your Order page anytime and enter your Order Number or courier AWB to view live milestone updates.',
  },
  {
    id: 'ot-2',
    category: 'orders',
    question: 'Can I modify my delivery address after placing an order?',
    answer:
      'If your order has not yet been packed or dispatched (status is PLACED or CONFIRMED), our support concierge can quickly update your delivery address. Please reach out via phone or email as soon as possible.',
  },
  {
    id: 'ot-3',
    category: 'orders',
    question: 'Where can I download my official GST tax invoice?',
    answer:
      'You can download your official GST invoice directly from your account. Navigate to Profile > My Orders, click on the specific order, and tap the "Download Invoice" button. An invoice is also included in your order confirmation email.',
  },

  // Shipping & Delivery
  {
    id: 'sd-1',
    category: 'shipping',
    question: 'What are your delivery timelines across India?',
    answer:
      'Tier 1 Metros (Mumbai, Delhi NCR, Bengaluru, Hyderabad, Chennai, Kolkata) typically arrive within 2–3 business days. Tier 2 and other regions generally take 4–6 business days from dispatch.',
  },
  {
    id: 'sd-2',
    category: 'shipping',
    question: 'What are the shipping charges?',
    answer:
      'We offer complimentary free shipping on all prepaid and COD orders above the store free shipping threshold. For smaller orders below this threshold, a flat delivery fee of ₹99 is added at checkout.',
  },
  {
    id: 'sd-3',
    category: 'shipping',
    question: 'Which courier partners handle YOX deliveries?',
    answer:
      'We operate with top logistics partners including Bluedart, Delhivery, Ekart, DTDC, and Xpressbees, orchestrated via automated Shiprocket courier allocation to ensure the fastest transit time to your specific pin code.',
  },

  // Returns & Refunds
  {
    id: 'rr-1',
    category: 'returns',
    question: 'What is the return window and how do I initiate a return?',
    answer:
      'You have 7 days from the confirmed date of delivery to request a return or exchange. Simply log into your YOX account, go to My Orders, click on the delivered order, select "Return Item", choose your reason, and attach 3 clear photos. Our team will verify it and book a free doorstep courier pickup.',
  },
  {
    id: 'rr-2',
    category: 'returns',
    question: 'Is reverse doorstep pickup free?',
    answer:
      'Yes, 100%! We provide free doorstep reverse pickup across all serviced pin codes. You will never be charged for reverse logistics or restocking.',
  },
  {
    id: 'rr-3',
    category: 'returns',
    question: 'How and when will I receive my refund?',
    answer:
      'For prepaid orders (Card, UPI, Netbanking), the amount is reversed to your original payment mode within 3–5 business days after quality approval. For Cash on Delivery orders, we transfer the refund directly to your bank account via IMPS/NEFT within 24–48 hours.',
  },

  // Payments & Offers
  {
    id: 'po-1',
    category: 'payments',
    question: 'What payment methods do you accept?',
    answer:
      'We support all major payment modes including UPI (Google Pay, PhonePe, Paytm, BHIM), Credit & Debit Cards (Visa, Mastercard, RuPay, Amex), Net Banking across 50+ Indian banks, and Cash on Delivery (COD).',
  },
  {
    id: 'po-2',
    category: 'payments',
    question: 'Is Cash on Delivery (COD) available for all orders?',
    answer:
      'Yes, Cash on Delivery is available for most serviceable pin codes across India with zero extra payment convenience surcharge.',
  },
  {
    id: 'po-3',
    category: 'payments',
    question: 'How do I apply a discount coupon code?',
    answer:
      'During checkout, in the order summary sidebar, enter your coupon code in the "Promo Code" field and click "Apply". Valid discounts are instantly deducted from your cart subtotal.',
  },

  // Sizing & Fabrics
  {
    id: 'sf-1',
    category: 'sizing',
    question: 'How do YOX contemporary garments fit?',
    answer:
      'Our shirts, jackets, and trousers are crafted with tailored modern fits that balance relaxed comfort with a sharp, structured silhouette. Each product page features an exact size guide with chest, shoulder, and length measurements in inches and centimeters.',
  },
  {
    id: 'sf-2',
    category: 'sizing',
    question: 'How should I care for my YOX fabrics?',
    answer:
      'To maintain the natural fibers and rich finish, we recommend cold gentle machine wash or hand washing with mild detergent. Turn garments inside out and dry in shade. Avoid bleaching or high-temperature tumble drying.',
  },
];

export default function HelpCentrePage() {
  const { config } = useStoreSettingsStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('ot-1');

  // Filter FAQs based on search and category tab
  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  const supportPhone = config.supportPhone || '1800-123-1444';
  const supportEmail = config.supportEmail || 'support@yoxfashion.in';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Help Centre</span>
        </div>
      </div>

      {/* ─── Hero Header With Search Bar ─────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
            24/7 Dedicated Support
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            How Can We Assist You Today?
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto">
            Search our knowledge base for instant answers on orders, shipping, returns, sizing, and payments.
          </p>

          {/* Interactive Search Bar */}
          <div className="mt-6 max-w-2xl mx-auto relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g. 'track shipment', 'return window', 'cod refund')..."
                className="w-full bg-white border border-gray-300 rounded-none py-3.5 pl-12 pr-4 text-xs sm:text-sm text-gray-900 placeholder:text-gray-500 shadow-xs outline-none focus:border-black transition-colors"
              />
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-black bg-gray-100 px-2 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Direct Concierge Contact Touchpoints ────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-14">
          {/* Call Support */}
          <a
            href={`tel:${supportPhone}`}
            className="bg-white border border-gray-200 p-6 shadow-xs hover:border-black transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-4 group-hover:bg-neutral-800 transition-colors">
                <Phone size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Call Concierge</h4>
              <p className="text-xs text-gray-500 mt-1">Direct phone assistance</p>
              <p className="text-sm font-extrabold text-black mt-3">{supportPhone}</p>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>9:30 AM – 9:30 PM IST</span>
              <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          {/* Email Support */}
          <a
            href={`mailto:${supportEmail}`}
            className="bg-white border border-gray-200 p-6 shadow-xs hover:border-black transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-4 group-hover:bg-neutral-800 transition-colors">
                <Mail size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Email Concierge</h4>
              <p className="text-xs text-gray-500 mt-1">Detailed written queries</p>
              <p className="text-xs sm:text-sm font-extrabold text-black mt-3 truncate">{supportEmail}</p>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>Average reply: Under 2 hrs</span>
              <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </a>

          {/* Track Order Direct */}
          <Link
            href="/track-order"
            className="bg-white border border-gray-200 p-6 shadow-xs hover:border-black transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-4 group-hover:bg-neutral-800 transition-colors">
                <Truck size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Track Your Order</h4>
              <p className="text-xs text-gray-500 mt-1">Real-time courier milestones</p>
              <p className="text-xs font-semibold text-emerald-700 mt-3">Live AWB Tracking Lookup</p>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>Instant Lookup</span>
              <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>

          {/* Returns & Exchanges */}
          <Link
            href="/returns-process"
            className="bg-white border border-gray-200 p-6 shadow-xs hover:border-black transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 bg-black text-white flex items-center justify-center mb-4 group-hover:bg-neutral-800 transition-colors">
                <RotateCcw size={18} />
              </div>
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Returns Guide</h4>
              <p className="text-xs text-gray-500 mt-1">7-Day free doorstep pickups</p>
              <p className="text-xs font-semibold text-black mt-3">Step-by-step instructions</p>
            </div>
            <span className="text-[11px] text-gray-500 font-medium mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span>View Returns Process</span>
              <ArrowRight size={13} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>

        {/* ─── Frequently Asked Questions Section ─────────────────────────────── */}
        <div className="bg-white border border-gray-200 p-6 sm:p-10 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                Frequently Asked Questions
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Browse popular topics or select a category below
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'All Topics' },
                { id: 'orders', label: 'Orders' },
                { id: 'shipping', label: 'Shipping' },
                { id: 'returns', label: 'Returns' },
                { id: 'payments', label: 'Payments' },
                { id: 'sizing', label: 'Sizing' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-none transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:text-black hover:bg-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <div className="divide-y divide-gray-100 mt-2">
            {filteredFaqs.length > 0 ? (
              filteredFaqs.map((faq) => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left gap-4 py-1 cursor-pointer group"
                    >
                      <span className="text-sm font-bold text-gray-900 group-hover:text-black transition-colors">
                        {faq.question}
                      </span>
                      <ChevronDown
                        size={17}
                        className={`text-gray-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-black' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed pr-6 animate-in fade-in duration-150">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center space-y-2">
                <HelpCircle size={32} className="text-gray-400 mx-auto" />
                <p className="text-sm font-semibold text-gray-800">No matching questions found</p>
                <p className="text-xs text-gray-500">
                  Try searching for another keyword or contact our support concierge directly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Still Need Help Banner ─────────────────────────────────────────── */}
        <div className="mt-12 bg-black text-white p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-lg font-bold">Still haven&apos;t found what you are looking for?</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              Our customer success team is available 7 days a week from 9:30 AM to 9:30 PM IST.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
            <a
              href={`tel:${supportPhone}`}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-black text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Phone size={14} />
              <span>Call Us Now</span>
            </a>
            <a
              href={`mailto:${supportEmail}`}
              className="px-6 py-3 border border-gray-600 hover:border-white text-white text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer inline-flex items-center gap-2"
            >
              <Mail size={14} />
              <span>Send An Email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

