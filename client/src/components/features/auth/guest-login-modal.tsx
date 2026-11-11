"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { X, ArrowRight } from 'lucide-react';

const DISMISS_KEY = 'yox_guest_login_prompt_dismissed';
// Standard polite delay for guest prompt
const PROMPT_DELAY_MS = 5000;

export function GuestLoginModal() {
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
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
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
      const state = useAuthStore.getState();
      if (!state.user && !state.isAuthenticated) {
        setIsOpen(true);
      }
    }, PROMPT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [mounted, user, isAuthenticated]);

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
    useAuthModalStore.getState().openModal('login');
  };

  if (!mounted || !isOpen || user || isAuthenticated) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={handleDismiss} />

      {/* Minimalist Luxury Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 bg-white border border-gray-200/90 shadow-2xl w-full max-w-[390px] p-7 sm:p-9 text-center animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={1.5} />
        </button>

        {/* Brand Emblem */}
        <div className="mx-auto mb-4 flex items-center justify-center">
          <img
            src="/favicon.ico"
            alt="YOX Fashion Store"
            className="h-12 sm:h-14 w-auto object-contain brightness-[1.03] contrast-[1.04]"
          />
        </div>

        {/* Clean Headline */}
        <h2
          id="guest-modal-title"
          className="text-lg sm:text-xl font-bold tracking-tight text-gray-900"
        >
          Welcome to YOX
        </h2>

        {/* Subtle, elegant subtext */}
        <p className="text-xs sm:text-[13px] text-gray-500 mt-2 mb-6 leading-relaxed">
          Sign in or create an account to track orders, save items to your wishlist, and enjoy seamless checkout.
        </p>

        {/* High-end actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGoToLogin}
            className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest py-3.5 px-6 transition-all cursor-pointer flex items-center justify-center gap-2 group shadow-xs active:scale-[0.99]"
          >
            <span>Log In / Sign Up</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="w-full text-xs font-semibold text-gray-400 hover:text-gray-700 py-2 transition-colors cursor-pointer"
          >
            Continue as Guest
          </button>
        </div>
      </div>
    </div>
  );
}
