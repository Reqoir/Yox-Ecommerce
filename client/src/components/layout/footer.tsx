"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Truck,
  ShieldCheck,
  Award,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Check,
  Clock,
  HelpCircle,
  X,
  Navigation,
  ExternalLink
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import {
  FaFacebookF,
  FaInstagram,
  FaYoutube,
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaCcPaypal,
  FaCcDiscover,
  FaCcDinersClub
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export function Footer() {
  const { config } = useStoreSettingsStore();
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isStoreLocatorOpen, setIsStoreLocatorOpen] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsSubscribed(true);
      setEmail('');
    }
  };

  // Offline stores list representing YOX retail presence
  const offlineStores = [
    {
      city: "Mumbai (Flagship Experience Store)",
      mall: "YOX Fashion House, BKC",
      address: config.storeAddress || "Plot C-59, G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051",
      phone: config.supportPhone || "+91 98765 43210",
      hours: "10:30 AM – 9:30 PM (All 7 Days)",
    },
    {
      city: "Bengaluru",
      mall: "Indiranagar 100ft Road",
      address: "No. 742, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038",
      phone: "+91 80 4123 9870",
      hours: "11:00 AM – 10:00 PM (All 7 Days)",
    },
    {
      city: "Delhi NCR",
      mall: "Ambience Mall, Vasant Kunj",
      address: "Ground Floor, Ambience Mall, Nelson Mandela Marg, Vasant Kunj, New Delhi 110070",
      phone: "+91 11 4987 6543",
      hours: "11:00 AM – 10:00 PM (All 7 Days)",
    },
    {
      city: "Hyderabad",
      mall: "Jubilee Hills Road No. 36",
      address: "Road No. 36, CBI Colony, Jubilee Hills, Hyderabad, Telangana 500033",
      phone: "+91 40 2345 6789",
      hours: "10:30 AM – 9:30 PM (All 7 Days)",
    },
    {
      city: "Kochi",
      mall: "Lulu International Mall",
      address: "1st Floor, Lulu Mall, Edappally, Kochi, Kerala 682024",
      phone: "+91 484 272 8000",
      hours: "10:00 AM – 10:00 PM (All 7 Days)",
    },
  ];

  return (
    <footer className="w-full bg-[#E5DCC5] text-gray-900 border-t border-[#C4BA9D]">
      
      {/* 1. Value Proposition & Trust Strip */}
      <div className="border-b border-[#C4BA9D] bg-[#E5DCC5]">
        <div className="w-[95%] max-w-7xl mx-auto py-8 sm:py-10 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/60 shadow-xs border border-[#C4BA9D] flex items-center justify-center text-black shrink-0">
              <Truck size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">Express Delivery</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 font-medium">
                Free on orders above {config.currencySymbol}{config.freeShippingThreshold}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/60 shadow-xs border border-[#C4BA9D] flex items-center justify-center text-black shrink-0">
              <RefreshCw size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">Easy Returns</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 font-medium">
                {config.returnWindowDays}-day hassle-free returns
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/60 shadow-xs border border-[#C4BA9D] flex items-center justify-center text-black shrink-0">
              <ShieldCheck size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">100% Secure Checkout</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 font-medium">
                Encrypted & verified payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/60 shadow-xs border border-[#C4BA9D] flex items-center justify-center text-black shrink-0">
              <Award size={20} strokeWidth={1.8} />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-900">Premium Quality</h4>
              <p className="text-[11px] sm:text-xs text-gray-600 mt-1 font-medium">
                Authentic contemporary fabrics
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Main Footer Grid: Brand, Shop, About, Help & Support, Newsletter */}
      <div className="w-[95%] max-w-7xl mx-auto py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-10 lg:gap-8">

          {/* Col 1: Brand & Contact Info (3.5 cols on lg) */}
          <div className="lg:col-span-3 sm:col-span-2 md:col-span-3 flex flex-col gap-4">
            <Link href="/" className="inline-block w-fit focus:outline-none">
              <img
                src="/images/logo.png"
                alt="YOX Men's Fashion"
                className="h-12 sm:h-14 w-auto object-contain block"
              />
            </Link>

            <p className="text-sm leading-relaxed text-gray-600 max-w-sm">
              {config.tagline || 'Elevating modern menswear with timeless tailoring, clean aesthetics, and unmatched everyday confidence.'}
            </p>

            {/* Direct Contact Touchpoints */}
            <div className="flex flex-col gap-2.5 text-sm text-gray-700 font-medium mt-1">
              {config.supportPhone && (
                <a href={`tel:${config.supportPhone}`} className="flex items-center gap-2.5 hover:text-black transition-colors w-fit">
                  <Phone size={15} className="text-gray-500 shrink-0" />
                  <span>{config.supportPhone}</span>
                </a>
              )}
              {config.supportEmail && (
                <a href={`mailto:${config.supportEmail}`} className="flex items-center gap-2.5 hover:text-black transition-colors w-fit">
                  <Mail size={15} className="text-gray-500 shrink-0" />
                  <span>{config.supportEmail}</span>
                </a>
              )}

              {config.storeAddress && (
                <div className="flex items-start gap-2.5 text-gray-600 text-xs max-w-xs leading-relaxed">
                  <MapPin size={15} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>{config.storeAddress}</span>
                </div>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2.5 mt-2">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="w-8 h-8 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all shadow-xs">
                <FaFacebookF size={12} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="X (Twitter)" className="w-8 h-8 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all shadow-xs">
                <FaXTwitter size={12} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="w-8 h-8 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all shadow-xs">
                <FaInstagram size={13} />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="w-8 h-8 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-700 hover:border-black hover:bg-black hover:text-white transition-all shadow-xs">
                <FaYoutube size={13} />
              </a>
            </div>
          </div>

          {/* Col 2: Shop Collections (2 cols on lg) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
              Shop
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-600 font-medium">
              <li><Link href="/shop" className="hover:text-black transition-colors">All Products</Link></li>
              <li><Link href="/shop?sort=newest" className="hover:text-black transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?sort=popular" className="hover:text-black transition-colors">Best Sellers</Link></li>
              <li><Link href="/shop?category=shirts" className="hover:text-black transition-colors">Shirts & Overshirts</Link></li>
              <li><Link href="/shop?category=t-shirt" className="hover:text-black transition-colors">T-Shirts & Polos</Link></li>
              <li><Link href="/shop?category=jacket" className="hover:text-black transition-colors">Jackets & Outerwear</Link></li>
              <li><Link href="/shop?category=pants" className="hover:text-black transition-colors">Pants & Trousers</Link></li>
            </ul>
          </div>

          {/* Col 3: About Column (2 cols on lg - Exact from reference) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
              About
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-600 font-medium">
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${config.supportEmail || 'support@yox.com'}`}
                  className="hover:text-black transition-colors"
                >
                  Write to us
                </a>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Take a Tour
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setIsStoreLocatorOpen(true)}
                  className="text-left text-black font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Store Locator</span>
                  <span className="text-[10px] bg-black text-white px-1.5 py-0.2 rounded-xs font-bold uppercase tracking-wider">
                    Stores
                  </span>
                </button>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  YOX Foundation
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  YOX Cares
                </Link>
              </li>
              <li>
                <Link href="/shop" className="hover:text-black transition-colors">
                  YOX Elite
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Help & Support Column (2 cols on lg - Exact from reference) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-4">
              Help
            </h4>
            <ul className="flex flex-col gap-2.5 text-sm text-gray-600 font-medium">
              <li>
                <a
                  href={`tel:${config.supportPhone || '1800-123-1444'}`}
                  className="hover:text-black transition-colors"
                >
                  Contact us
                </a>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-black transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-black transition-colors">
                  Returns Process
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-black transition-colors">
                  Returns And Exchange Policy
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-black transition-colors">
                  Help Centre
                </Link>
              </li>
              <li>
                <Link href="/profile/orders" className="hover:text-black transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Newsletter & VIP Club (3 cols on lg) */}
          <div className="lg:col-span-3 sm:col-span-2 md:col-span-3 flex flex-col gap-3.5">
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-900">
              Be In The Know
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              Subscribe to get 10% off your first order, member-only drops, and private seasonal sales.
            </p>

            {isSubscribed ? (
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-sm text-sm font-medium text-gray-900 flex items-center gap-2.5">
                <Check size={18} className="text-green-600 shrink-0" />
                <span>Thank you! You&apos;re now on our VIP subscriber list.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-white/70 border border-[#C4BA9D] rounded-sm px-4 py-2.5 h-11 text-sm text-gray-900 placeholder-gray-600 outline-none focus:border-black transition-colors"
                />
                <button
                  type="submit"
                  className="bg-black text-white hover:bg-gray-800 transition-colors text-xs sm:text-sm font-bold uppercase tracking-wider px-6 h-11 rounded-sm whitespace-nowrap cursor-pointer shadow-xs"
                >
                  Join
                </button>
              </form>
            )}
            <p className="text-xs text-gray-600">
              By subscribing, you agree to our privacy policy. No spam, ever.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Reference Contact Action Strip (Talk to us, Helpcentre, Write to us, Socials) */}
      <div className="border-t border-[#C4BA9D]">
        <div className="w-[95%] max-w-7xl mx-auto py-6 sm:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6">

          {/* Action Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 lg:gap-12">

            {/* Talk to us */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-800 shrink-0">
                <Phone size={19} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-normal">Talk to us</span>
                <a
                  href={`tel:${config.supportPhone || '1800-123-1444'}`}
                  className="text-sm sm:text-[15px] font-semibold text-gray-900 hover:text-black transition-colors"
                >
                  {config.supportPhone || '1800-123-1444'}
                </a>
              </div>
            </div>

            {/* Helpcentre */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-800 shrink-0">
                <HelpCircle size={19} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-normal">Helpcentre</span>
                <Link
                  href="/profile/orders"
                  className="text-sm sm:text-[15px] font-semibold text-gray-900 hover:text-black transition-colors"
                >
                  help.yoxfashion.in
                </Link>
              </div>
            </div>

            {/* Write to us */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full border border-[#C4BA9D] bg-white/40 flex items-center justify-center text-gray-800 shrink-0">
                <Mail size={19} strokeWidth={1.75} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-600 font-normal">Write to us</span>
                <a
                  href={`mailto:${config.supportEmail || 'help@yoxfashion.in'}`}
                  className="text-sm sm:text-[15px] font-semibold text-gray-900 hover:text-black transition-colors"
                >
                  {config.supportEmail || 'help@yoxfashion.in'}
                </a>
              </div>
            </div>

          </div>

          {/* Social Media Icons */}
          <div className="flex items-center gap-6 text-xl text-gray-800 self-start md:self-auto pt-2 md:pt-0">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="hover:text-black transition-opacity hover:opacity-75"
            >
              <FaFacebookF size={18} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="X (Twitter)"
              className="hover:text-black transition-opacity hover:opacity-75"
            >
              <FaXTwitter size={18} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="hover:text-black transition-opacity hover:opacity-75"
            >
              <FaInstagram size={20} />
            </a>
          </div>

        </div>
      </div>

      {/* 4. Bottom Bar: Copyright, Reqoir Technologies Credit, and Payment Badges */}
      <div className="border-t border-[#C4BA9D] bg-[#D6CDAF]">
        <div className="w-[95%] max-w-7xl mx-auto py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-gray-700">

          {/* Copyright & Developed by Reqoir Technologies */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <span>© {new Date().getFullYear()} YOX Men&apos;s Fashion. All rights reserved.</span>
            <span className="hidden sm:inline text-gray-400">|</span>
            <span className="flex items-center gap-1">
              <span>Developed by</span>
              <a
                href="https://reqoir.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-gray-900 hover:text-black hover:underline inline-flex items-center gap-0.5 transition-colors"
              >
                <span>Reqoir Technologies</span>

              </a>
            </span>
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Secured Payments</span>
            <div className="flex items-center gap-2.5 text-2xl text-gray-700">
              <FaCcVisa title="Visa" className="hover:text-[#1A1F71] transition-colors" />
              <FaCcMastercard title="Mastercard" className="hover:text-[#EB001B] transition-colors" />
              <FaCcAmex title="American Express" className="hover:text-[#2E77BC] transition-colors" />
              <FaCcPaypal title="PayPal" className="hover:text-[#003087] transition-colors" />
              <FaCcDiscover title="Discover" className="hover:text-[#FF6000] transition-colors" />
              <FaCcDinersClub title="Diners Club" className="hover:text-[#0079BE] transition-colors" />
            </div>
          </div>

        </div>
      </div>

      {/* Store Locator Modal */}
      {isStoreLocatorOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">

            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MapPin className="text-black" size={22} />
                <div>
                  <h3 className="font-bold text-base text-gray-900">YOX Retail Stores</h3>
                  <p className="text-xs text-gray-500">Visit our official retail stores and experience centers across India</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStoreLocatorOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Stores List */}
            <div className="p-5 overflow-y-auto space-y-4 divide-y divide-gray-100">
              {offlineStores.map((store, idx) => (
                <div key={idx} className={idx > 0 ? "pt-4" : ""}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black bg-gray-100 px-2 py-0.5 rounded-xs">
                        {store.city}
                      </span>
                      <h4 className="font-bold text-sm text-gray-900 mt-1">{store.mall}</h4>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{store.address}</p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-2 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-gray-400" />
                          {store.phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400" />
                          {store.hours}
                        </span>
                      </div>
                    </div>

                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${store.mall} ${store.address}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-black text-white text-xs font-semibold rounded-sm hover:bg-gray-800 transition-colors flex items-center gap-1 shrink-0"
                    >
                      <Navigation size={12} />
                      Directions
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center text-xs text-gray-500">
              More store openings coming soon across major shopping destinations in India.
            </div>

          </div>
        </div>
      )}

    </footer>
  );
}
