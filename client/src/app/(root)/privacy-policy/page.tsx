'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Lock,
  EyeOff,
  UserCheck,
  ChevronRight,
  Phone,
  Mail,
  HelpCircle,
} from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export default function PrivacyPolicyPage() {
  const { config } = useStoreSettingsStore();

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-black selection:text-white">
      {/* ─── Breadcrumbs ──────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-[95%] max-w-7xl mx-auto py-3 text-xs text-gray-500 flex items-center gap-2">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight size={13} className="text-gray-400" />
          <span className="text-gray-900 font-medium">Privacy Policy</span>
        </div>
      </div>

      {/* ─── Hero Header ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-gray-200 py-10 sm:py-14">
        <div className="w-[95%] max-w-7xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-gray-800 bg-gray-100 px-3 py-1 mb-3 border border-gray-200">
              Legal & Compliance
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 leading-relaxed">
              At YOX Men&apos;s Fashion, protecting your personal data and respecting your privacy is foundational to our brand. This policy explains how we collect, use, and safeguard your information.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Policy Highlights Cards ─────────────────────────────────────────── */}
      <div className="w-[95%] max-w-7xl mx-auto py-10 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <Lock size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">256-Bit SSL</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">End-to-end encrypted transactions</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <EyeOff size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Zero Third-Party Sales</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">We never sell your personal information</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">OTP Security</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Passwordless phone verification</p>
          </div>

          <div className="bg-white border border-gray-200 p-5 shadow-xs">
            <div className="w-10 h-10 bg-gray-100 flex items-center justify-center text-black mb-3">
              <UserCheck size={20} />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900">Full Consent Control</h4>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1">Access, update, or delete anytime</p>
          </div>
        </div>

        {/* ─── Formal Policy Sections ─────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 divide-y divide-gray-200 shadow-xs">
          {/* Section 1 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">01</span>
              <span>Information We Collect</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              When you interact with YOX, we collect necessary information to provide you with seamless shopping and doorstep delivery services:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1.5 leading-relaxed">
              <li><strong>Contact & Identity Details:</strong> Full name, 10-digit mobile phone number, email address, and shipping/billing addresses.</li>
              <li><strong>Authentication Data:</strong> One-Time Passwords (OTPs) sent via encrypted channels for secure account sign-in.</li>
              <li><strong>Transaction & Order Data:</strong> Items purchased, order reference numbers, billing totals, and payment status (we do NOT store credit card numbers or banking passwords).</li>
              <li><strong>Technical & Device Data:</strong> IP address, device type, browser specifications, and cookie identifiers to maintain cart state and website security.</li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">02</span>
              <span>How We Use Your Information</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We process your data strictly for legitimate operational purposes:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1.5 leading-relaxed">
              <li>To confirm, process, package, and dispatch your orders.</li>
              <li>To transmit real-time delivery status updates, tracking numbers, and AWB links via SMS and email.</li>
              <li>To facilitate seamless doorstep returns, exchanges, and verified refunds.</li>
              <li>To prevent fraudulent orders, abuse, and automated intrusions.</li>
              <li>To provide customer support and address your product questions.</li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">03</span>
              <span>Sharing with Trusted Service Partners</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We never sell, rent, or lease your personal information to marketing advertisers. We share minimal necessary information only with vetted infrastructure partners:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1.5 leading-relaxed">
              <li><strong>Logistics Providers (e.g., Shiprocket & Courier Partners):</strong> Your shipping address and contact number are provided solely for doorstep delivery and pickup coordination.</li>
              <li><strong>Payment Gateways (e.g., Razorpay):</strong> For end-to-end PCI-DSS Level 1 compliant online payment authorization.</li>
              <li><strong>Communication Gateways (e.g., MSG91):</strong> For instant SMS OTP delivery and transactional order notifications.</li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">04</span>
              <span>Data Protection & Security Safeguards</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              We deploy industry-standard technical measures including SSL/TLS encryption, restricted access controls, and hashed authentication tokens. All network traffic between your browser and our servers is protected using TLS 1.3 encryption.
            </p>
          </div>

          {/* Section 5 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">05</span>
              <span>Your Rights & Choices</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              You retain full control over your personal data:
            </p>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-600 space-y-1.5 leading-relaxed">
              <li>You can view and modify your saved addresses and personal details anytime via your account settings.</li>
              <li>You may request complete deletion of your account and personal history by writing to our privacy team.</li>
              <li>You can opt out of promotional messages while keeping essential transactional delivery notifications.</li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="p-6 sm:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <span className="text-xs font-mono bg-black text-white px-2 py-0.5">06</span>
              <span>Grievance Officer & Legal Contact</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              If you have any questions, concerns, or grievances regarding this Privacy Policy or our data practices, please reach out directly:
            </p>
            <div className="p-4 border border-gray-200 bg-gray-50/60 text-xs sm:text-sm space-y-1 text-gray-700">
              <p className="font-bold text-gray-900">YOX Men&apos;s Fashion – Privacy & Legal Cell</p>
              <p>Email: <a href={`mailto:${config.supportEmail || 'support@yox.com'}`} className="underline text-black font-medium">{config.supportEmail || 'support@yox.com'}</a></p>
              {config.supportPhone && <p>Support Line: {config.supportPhone}</p>}
            </div>
          </div>
        </div>

        {/* ─── Contact Support Banner ───────────────────────────────────────── */}
        <div className="mt-12 bg-gray-50 border border-gray-200 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              Have questions about your data or account?
            </h3>
            <p className="text-xs sm:text-sm text-gray-700">
              Our support team is happy to assist with any questions or account requests.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {config.supportPhone && (
              <a
                href={`tel:${config.supportPhone}`}
                className="px-4 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
              >
                <Phone size={14} />
                <span>Call Support</span>
              </a>
            )}
            <Link
              href="/help-centre"
              className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
            >
              <HelpCircle size={14} />
              <span>Help Centre</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

