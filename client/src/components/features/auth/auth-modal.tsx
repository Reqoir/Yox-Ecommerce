'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export function AuthModal() {
  const router = useRouter();
  const { isOpen, mode, redirectUrl, closeModal, setMode } = useAuthModalStore();
  const { user, isAuthenticated, setAuthData } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal automatically if user becomes authenticated
  useEffect(() => {
    if (user || isAuthenticated) {
      closeModal();
    }
  }, [user, isAuthenticated, closeModal]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeModal]);

  if (!mounted || !isOpen || user || isAuthenticated) {
    return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const loggedUser = await authApi.login({ email, password });
      setAuthData(loggedUser, 'dummy_token');

      // Sync offline cart
      await useCartStore.getState().syncWithServer();

      toast.success('Welcome back!');
      closeModal();

      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (error: any) {
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newUser = await authApi.register({
        fullName,
        email,
        password,
        phone: phone || undefined,
      });
      setAuthData(newUser, 'dummy_token');

      // Sync offline cart
      await useCartStore.getState().syncWithServer();

      toast.success('Account created successfully!');
      closeModal();

      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (error: any) {
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authApi.forgotPassword(email);
      setForgotSuccess(true);
      toast.success(response.message || 'Reset link sent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 selection:bg-black selection:text-white">
      
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Modal Card — Exact styling matching reference image */}
      <div
        className="relative z-10 bg-white rounded-none max-w-[560px] w-full p-8 sm:p-12 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Right Close 'X' Button */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-6 right-6 p-1 text-gray-900 hover:text-black transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={26} strokeWidth={1.5} />
        </button>

        {/* Modal Title & Subtitle */}
        <div className="mb-6 space-y-1.5">
          {mode === 'forgot-password' ? (
            <>
              <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                Reset Password
              </h2>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
                Enter your email address to receive password recovery instructions
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                {mode === 'login' ? 'Sign in' : 'Sign up'}
              </h2>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                Enjoy the convenience of a single account across all participating brands
              </p>
            </>
          )}
        </div>

        {/* Mode Switcher Tabs */}
        {mode !== 'forgot-password' && (
          <div className="flex items-center gap-6 mb-6 pb-2 border-b border-gray-100">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                mode === 'login'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`text-xs font-bold uppercase tracking-wider pb-1 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-400 hover:text-gray-700'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* 1. SIGN IN MODE */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Address */}
            <div className="space-y-1">
              <label htmlFor="modal-login-email" className="block text-xs font-bold text-gray-900">
                Email Address
              </label>
              <input
                id="modal-login-email"
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-login-password" className="block text-xs font-bold text-gray-900">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-xs text-gray-500 hover:text-black underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="modal-login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions Notice */}
            <p className="text-[12px] text-gray-600 leading-snug pt-2">
              By logging in you agree to our{' '}
              <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                Terms and Conditions
              </span>
            </p>

            {/* Bottom Action Row: Continue Button aligned right */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer"
              >
                Don&apos;t have an account? Sign Up
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-none transition-all cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>PLEASE WAIT</span>
                  </span>
                ) : (
                  <span>CONTINUE</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2. SIGN UP MODE */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label htmlFor="modal-reg-name" className="block text-xs font-bold text-gray-900">
                Full Name
              </label>
              <input
                id="modal-reg-name"
                type="text"
                required
                placeholder="Enter your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label htmlFor="modal-reg-email" className="block text-xs font-bold text-gray-900">
                Email Address
              </label>
              <input
                id="modal-reg-email"
                type="email"
                required
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Phone Number (Optional) */}
            <div className="space-y-1">
              <label htmlFor="modal-reg-phone" className="block text-xs font-bold text-gray-900">
                Phone Number <span className="text-[11px] text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="modal-reg-phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label htmlFor="modal-reg-password" className="block text-xs font-bold text-gray-900">
                Password
              </label>
              <div className="relative">
                <input
                  id="modal-reg-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors p-0.5 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Terms and Conditions Notice */}
            <p className="text-[12px] text-gray-600 leading-snug pt-2">
              By creating your account you agree to our{' '}
              <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                Terms and Conditions
              </span>
            </p>

            {/* Bottom Action Row: Continue Button aligned right */}
            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer"
              >
                Already have an account? Sign In
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-none transition-all cursor-pointer disabled:opacity-60 shadow-xs"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>PLEASE WAIT</span>
                  </span>
                ) : (
                  <span>CONTINUE</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 3. FORGOT PASSWORD MODE */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            {forgotSuccess ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={46} className="mx-auto text-emerald-600" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900 uppercase">Check Your Email</h3>
                  <p className="text-xs text-gray-500">
                    If an account exists for that email, recovery instructions have been sent.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess(false);
                    setMode('login');
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 rounded-none cursor-pointer mt-2"
                >
                  RETURN TO SIGN IN
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="modal-forgot-email" className="block text-xs font-bold text-gray-900">
                    Email Address
                  </label>
                  <input
                    id="modal-forgot-email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-none transition-all cursor-pointer disabled:opacity-60 shadow-xs"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>SENDING</span>
                      </span>
                    ) : (
                      <span>SEND RESET LINK</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
