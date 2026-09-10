"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ShieldCheck, Award, RefreshCw, Mail, Phone, MapPin } from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { 
  FaFacebookF, 
  FaInstagram, 
  FaYoutube, 
  FaTwitter, 
  FaCcVisa, 
  FaCcMastercard, 
  FaCcAmex, 
  FaCcPaypal, 
  FaCcDiscover, 
  FaCcDinersClub 
} from 'react-icons/fa';

export function Footer() {
  const { config } = useStoreSettingsStore();

  return (
    <footer className="w-full bg-[#162b55] text-white">
      {/* Top Features Section */}
      <div className="w-[98%] max-w-[1500px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-b border-white/10">
        <div className="flex items-center gap-4">
          <Truck size={36} className="text-white/80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-white">Free Shipping</h4>
            <p className="text-white/70 text-[12px]">
              On Orders Above {config.currencySymbol}{config.freeShippingThreshold}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ShieldCheck size={36} className="text-white/80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-white">Secure Checkout</h4>
            <p className="text-white/70 text-[12px]">100% Secure Shopping</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Award size={36} className="text-white/80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-white">Member Offers</h4>
            <p className="text-white/70 text-[12px]">Special discounts with codes</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RefreshCw size={36} className="text-white/80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-white">
              Easy {config.returnWindowDays}-Day Returns
            </h4>
            <p className="text-white/70 text-[12px]">Hassle-free return window.</p>
          </div>
        </div>
      </div>

      {/* Middle Links Section */}
      <div className="w-[98%] max-w-[1500px] mx-auto py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 border-b border-white/10">
        
        {/* Brand Col */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Link href="/">
            <Image 
              src="/images/logo.png" 
              alt="YOX Logo" 
              width={110} 
              height={40} 
              className="w-auto h-auto object-contain"
              style={{ width: 'auto', height: 'auto' }}
            />
          </Link>
          <p className="text-white/70 text-[13px] leading-relaxed lg:pr-8 font-medium">
            {config.tagline || 'Style meets comfort. Discover elevated essentials and standout pieces designed for everyday confidence.'}
          </p>
          <div className="flex flex-col gap-3 text-[13px] text-white/70 font-medium">
            {config.supportPhone && (
              <a href={`tel:${config.supportPhone}`} className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Phone size={16} className="opacity-80 text-white" /> {config.supportPhone}
              </a>
            )}
            {config.supportEmail && (
              <a href={`mailto:${config.supportEmail}`} className="flex items-center gap-2 hover:text-white cursor-pointer transition-colors">
                <Mail size={16} className="opacity-80 text-white" /> {config.supportEmail}
              </a>
            )}
            {config.storeAddress && (
              <div className="flex items-start gap-2 text-white/70">
                <MapPin size={16} className="opacity-80 text-white shrink-0 mt-0.5" />
                <span className="text-xs">{config.storeAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Company Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-white">Company</h4>
          <ul className="flex flex-col gap-3.5 text-[13px] text-white/70 font-medium">
            <li><Link href="/shop" className="hover:text-white transition-colors">Shop All</Link></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">Cloth</Link></li>
            <li><Link href="/shop?category=men" className="hover:text-white transition-colors">Men's</Link></li>
            <li><Link href="/shop" className="hover:text-white transition-colors">Blogs</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Theme Features</Link></li>
          </ul>
        </div>

        {/* Information Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-white">Information</h4>
          <ul className="flex flex-col gap-3.5 text-[13px] text-white/70 font-medium">
            <li><Link href="/" className="hover:text-white transition-colors">Search</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Contact</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">FAQs</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Privacy Policy</Link></li>
            <li><Link href="/" className="hover:text-white transition-colors">Terms Of Service</Link></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="lg:col-span-4">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-white">Newsletter Signup</h4>
          <p className="text-[13px] text-white/70 mb-6 leading-relaxed font-medium">
            Join our fashion community and get early access to drops, deals & style tips.
          </p>
          <form className="flex items-center gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              suppressHydrationWarning
              type="email" 
              placeholder="Email" 
              className="flex-1 bg-white/10 border border-white/20 rounded-[24px] px-5 py-2.5 text-[13px] outline-none focus:border-white transition-colors text-white placeholder-white/50"
            />
            <button 
              suppressHydrationWarning
              type="submit" 
              className="bg-white text-[#162b55] font-bold text-[13px] tracking-wide px-7 py-2.5 rounded-[24px] hover:bg-gray-100 transition-colors shadow-sm"
            >
              Subscribe
            </button>
          </form>
        </div>

      </div>

      {/* Bottom Settings & Socials */}
      <div className="w-[98%] max-w-[1500px] mx-auto py-8 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6">
        
        {/* Language & Currency */}
        <div className="flex flex-col items-center md:items-start gap-2.5">
          <span className="text-[14px] font-bold tracking-wide text-white">Language & Currency</span>
          <div className="flex items-center gap-6 text-[12px] font-bold text-white/75">
            <button suppressHydrationWarning className="flex items-center gap-1.5 hover:text-white transition-colors">EN <span className="text-[9px]">▼</span></button>
            <button suppressHydrationWarning className="flex items-center gap-1.5 hover:text-white transition-colors">
              <span className="text-[14px] leading-none mr-0.5">🇮🇳</span> INR ₹ <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-wide text-white">Payment Methods</span>
          <div className="flex items-center gap-2.5 text-[28px]">
            <FaCcVisa className="text-[#1A1F71] bg-white rounded-sm shadow-sm" />
            <FaCcMastercard className="text-[#EB001B] bg-white rounded-sm shadow-sm" />
            <FaCcAmex className="text-[#2E77BC] bg-white rounded-sm shadow-sm" />
            <FaCcPaypal className="text-[#003087] bg-white rounded-sm shadow-sm" />
            <FaCcDiscover className="text-[#FF6000] bg-white rounded-sm shadow-sm" />
            <FaCcDinersClub className="text-[#0079BE] bg-white rounded-sm shadow-sm" />
          </div>
        </div>

        {/* Follow Us */}
        <div className="flex flex-col items-center md:items-end gap-2.5">
          <span className="text-[14px] font-bold tracking-wide text-white">Follow Us</span>
          <div className="flex items-center gap-2.5">
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group">
              <FaFacebookF size={13} className="text-white/80 group-hover:text-white" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group">
              <FaInstagram size={13} className="text-white/80 group-hover:text-white" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group">
              <FaYoutube size={13} className="text-white/80 group-hover:text-white" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors group">
              <FaTwitter size={13} className="text-white/80 group-hover:text-white" />
            </a>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="w-full bg-[#102040] py-4 text-center border-t border-white/10">
        <p className="text-[12px] font-medium text-white/60">
          © {new Date().getFullYear()} YOX. All rights reserved.
        </p>
      </div>

    </footer>
  );
}
