"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { X, ArrowRight, Check, User, ShieldCheck } from 'lucide-react';

const DISMISS_KEY = 'yox_guest_login_prompt_dismissed';
// Standard ecommerce timing: 10-12 seconds
const PROMPT_DELAY_MS = 10000;

export function GuestLoginModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Do NOT show if user is logged in
    if (user || isAuthenticated) {
      setIsOpen(false);
      return;
    }

    // Do NOT show on auth or admin pages
    const isAuthPage = 
      pathname.startsWith('/login') ||
      pathname.startsWith('/register') ||
      pathname.startsWith('/forgot-password') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/admin-login');

    if (isAuthPage) {
      setIsOpen(false);
      return;
    }

    // Check if dismissed in this browser session
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === 'true') {
        return;
      }
    } catch {
      // Ignore storage errors in private mode
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [mounted, user, isAuthenticated, pathname]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // Ignore
    }
  };

  const handleGoToLogin = () => {
    handleDismiss();
    const redirectUrl = pathname && pathname !== '/' ? `/login?redirect=${encodeURIComponent(pathname)}` : '/login';
    router.push(redirectUrl);
  };

  const handleGoToRegister = () => {
    handleDismiss();
    const redirectUrl = pathname && pathname !== '/' ? `/register?redirect=${encodeURIComponent(pathname)}` : '/register';
    router.push(redirectUrl);
  };

  if (!mounted || !isOpen || user || isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Editorial Modal Card */}
      <div 
        className="relative z-10 bg-white rounded-xl sm:rounded-2xl max-w-[760px] w-full max-h-[92vh] overflow-y-auto md:overflow-visible shadow-2xl border border-gray-100 flex flex-col md:flex-row animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 md:bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          aria-label="Close modal"
        >
          <X size={17} />
        </button>

        {/* Left Column: High-Fashion Editorial Campaign Visual (Optimized for both mobile and desktop) */}
        <div className="md:w-[44%] relative h-[210px] sm:h-[240px] md:h-auto md:min-h-[460px] bg-black overflow-hidden flex flex-col justify-between p-4 sm:p-5 md:p-6 text-white shrink-0">
          {/* Background Fashion Photo - object-[center_top] so head, face and suit are fully visible on mobile */}
          <img
            src="/images/hero-luxury-1.jpg"
            alt="YOX Men's Fashion"
            className="absolute inset-0 w-full h-full object-cover object-[center_top] md:object-center opacity-90 md:opacity-85 hover:scale-105 transition-transform duration-700 ease-out"
          />

          {/* Luxury vignette overlay (lighter on mobile to let the full photo shine through, rich gradient on desktop) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 md:from-black/90 md:via-black/35 md:to-black/50" />

          {/* Top Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xs border border-white/20 text-white">
              YOX STORE
            </span>
          </div>

          {/* Bottom Statement (Hidden on mobile so the model image is completely unobstructed, preserved on desktop) */}
          <div className="relative z-10 hidden md:block">
            <p className="text-[11px] uppercase tracking-[0.25em] text-gray-300 font-semibold mb-1">
              ACCOUNT & PERKS
            </p>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight leading-tight text-white">
              Elevate Your Shopping Experience
            </h3>
          </div>
        </div>

        {/* Right Column: Pure Login / Sign Up Actions */}
        <div className="md:w-[56%] p-5 sm:p-8 flex flex-col justify-between bg-white">
          <div>
            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="inline-block w-2 h-2 rounded-full bg-black" />
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                YOX ACCOUNT
              </span>
            </div>

            <h2 id="modal-title" className="text-lg sm:text-2xl font-black uppercase tracking-tight text-gray-900 leading-tight">
              Log In or Sign Up
            </h2>

            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 leading-relaxed font-normal">
              Sign in to your account or create a new one to access your orders, track shipments, and save items to your wishlist.
            </p>

            {/* Account Benefits List */}
            <div className="mt-3.5 sm:mt-5 py-3 sm:py-4 border-y border-gray-100 flex flex-col gap-2 sm:gap-2.5 text-xs text-gray-700">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check size={14} className="text-black shrink-0" strokeWidth={2.5} />
                <span><strong>Track orders & deliveries</strong> with real-time status</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check size={14} className="text-black shrink-0" strokeWidth={2.5} />
                <span><strong>Save your wishlist & bag</strong> across all your devices</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check size={14} className="text-black shrink-0" strokeWidth={2.5} />
                <span><strong>Fast 1-click checkout</strong> with saved addresses</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5">
                <Check size={14} className="text-black shrink-0" strokeWidth={2.5} />
                <span><strong>Member-only offers</strong> and early sale access</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Log In & Sign Up */}
          <div className="mt-4 sm:mt-6 flex flex-col gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={handleGoToLogin}
              className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-widest py-3 sm:py-3.5 px-6 rounded-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <span>Log In</span>
              <ArrowRight size={15} />
            </button>

            <button
              type="button"
              onClick={handleGoToRegister}
              className="w-full bg-white hover:bg-gray-50 text-black border border-black font-bold text-xs sm:text-sm uppercase tracking-widest py-3 sm:py-3.5 px-6 rounded-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <span>Create an Account</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              className="mt-0.5 sm:mt-1 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium text-center cursor-pointer"
            >
              Continue browsing as guest
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
