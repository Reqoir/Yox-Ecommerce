"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Truck, ShieldCheck, Award, RefreshCw, Mail, Phone } from 'lucide-react';
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
  return (
    <footer className="w-full bg-[#E5DCC5] text-gray-900">
      {/* Top Features Section */}
      <div className="w-[98%] max-w-[1500px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 py-10 border-b border-gray-300">
        <div className="flex items-center gap-4">
          <Truck size={36} className="text-gray-700 opacity-80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-gray-900">Free Shipping</h4>
            <p className="text-gray-600 text-[12px]">On Order Above $26</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ShieldCheck size={36} className="text-gray-700 opacity-80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-gray-900">Secure Checkout</h4>
            <p className="text-gray-600 text-[12px]">100% Secure Shopping</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Award size={36} className="text-gray-700 opacity-80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-gray-900">Member Offers</h4>
            <p className="text-gray-600 text-[12px]">Orders $50 or more</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <RefreshCw size={36} className="text-gray-700 opacity-80" strokeWidth={1} />
          <div>
            <h4 className="font-bold text-[14px] tracking-wide mb-0.5 text-gray-900">Easy 7-Day Returns</h4>
            <p className="text-gray-600 text-[12px]">Returns Within 7 Days.</p>
          </div>
        </div>
      </div>

      {/* Middle Links Section */}
      <div className="w-[98%] max-w-[1500px] mx-auto py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-12 border-b border-gray-300">
        
        {/* Brand Col */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Link href="/">
            <Image 
              src="/images/logo.png" 
              alt="YOX Logo" 
              width={110} 
              height={40} 
              className="object-contain" 
            />
          </Link>
          <p className="text-gray-600 text-[13px] leading-relaxed lg:pr-8 font-medium">
            Style meets comfort. Discover elevated essentials and standout pieces designed for everyday confidence.
          </p>
          <div className="flex flex-col gap-3 text-[13px] text-gray-600 font-medium">
            <div className="flex items-center gap-2 hover:text-black cursor-pointer transition-colors">
              <Phone size={16} className="opacity-80 text-gray-700" /> 0123-456-789
            </div>
            <div className="flex items-center gap-2 hover:text-black cursor-pointer transition-colors">
              <Mail size={16} className="opacity-80 text-gray-700" /> demo@demo.com
            </div>
          </div>
        </div>

        {/* Company Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-gray-900">Company</h4>
          <ul className="flex flex-col gap-3.5 text-[13px] text-gray-600 font-medium">
            <li><Link href="/shop" className="hover:text-black transition-colors">Shop All</Link></li>
            <li><Link href="/shop" className="hover:text-black transition-colors">Cloth</Link></li>
            <li><Link href="/shop?category=women" className="hover:text-black transition-colors">Women's</Link></li>
            <li><Link href="/shop?category=men" className="hover:text-black transition-colors">Men's</Link></li>
            <li><Link href="/blog" className="hover:text-black transition-colors">Blogs</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">Theme Features</Link></li>
          </ul>
        </div>

        {/* Information Links */}
        <div className="lg:col-span-2">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-gray-900">Information</h4>
          <ul className="flex flex-col gap-3.5 text-[13px] text-gray-600 font-medium">
            <li><Link href="/" className="hover:text-black transition-colors">Search</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">About Us</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">Contact</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">FAQs</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">Privacy Policy</Link></li>
            <li><Link href="/" className="hover:text-black transition-colors">Terms Of Service</Link></li>
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="lg:col-span-4">
          <h4 className="text-[16px] font-bold tracking-wide mb-6 text-gray-900">Newsletter Signup</h4>
          <p className="text-[13px] text-gray-600 mb-6 leading-relaxed font-medium">
            Join our fashion community and get early access to drops, deals & style tips.
          </p>
          <form className="flex items-center gap-3" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Email" 
              className="flex-1 bg-transparent border border-gray-400 rounded-[24px] px-5 py-2.5 text-[13px] outline-none focus:border-gray-900 transition-colors text-gray-900 placeholder-gray-500"
            />
            <button 
              type="submit" 
              className="bg-gray-900 text-white font-bold text-[13px] tracking-wide px-7 py-2.5 rounded-[24px] hover:bg-black transition-colors"
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
          <span className="text-[14px] font-bold tracking-wide text-gray-900">Language & Currency</span>
          <div className="flex items-center gap-6 text-[12px] font-bold text-gray-600">
            <button className="flex items-center gap-1.5 hover:text-black transition-colors">EN <span className="text-[9px]">▼</span></button>
            <button className="flex items-center gap-1.5 hover:text-black transition-colors">
              <span className="text-[14px] leading-none mr-0.5">🇮🇳</span> INR ₹ <span className="text-[9px]">▼</span>
            </button>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="flex flex-col items-center gap-2.5">
          <span className="text-[14px] font-bold tracking-wide text-gray-900">Payment Methods</span>
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
          <span className="text-[14px] font-bold tracking-wide text-gray-900">Follow Us</span>
          <div className="flex items-center gap-2.5">
            <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors group">
              <FaFacebookF size={13} className="text-gray-700 group-hover:text-black" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors group">
              <FaInstagram size={13} className="text-gray-700 group-hover:text-black" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors group">
              <FaYoutube size={13} className="text-gray-700 group-hover:text-black" />
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors group">
              <FaTwitter size={13} className="text-gray-700 group-hover:text-black" />
            </a>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="w-full bg-[#D6CDAF] py-4 text-center border-t border-gray-300">
        <p className="text-[12px] font-bold text-gray-700">
          © 2026, YOX Theme Powered by Shopify
        </p>
      </div>

    </footer>
  );
}
