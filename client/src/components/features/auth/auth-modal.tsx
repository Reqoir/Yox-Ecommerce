'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { authApi } from '@/api/auth';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { toast } from 'sonner';
import {
  X,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
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

  // OTP Verification States for Registration
  const [registerStep, setRegisterStep] = useState<'form' | 'otp'>('form');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendOtp, retryOtp, verifyOtp, formatPhoneForMsg91 } = useMsg91Otp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Reset OTP state when switching mode or closing modal
  useEffect(() => {
    setRegisterStep('form');
    setOtpDigits(['', '', '', '', '', '']);
    setResendCountdown(0);
  }, [mode, isOpen]);

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
      if (error.response?.status === 429) {
        // Handled globally with the rate limit notification
        return;
      }
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 1 of registration: validate fields and send OTP to mobile
   */
  const handleSendRegistrationOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setRegisterStep('otp');
      setResendCountdown(30);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resends OTP via SMS
   */
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[focusIdx]?.focus();
  };

  /**
   * Step 2 of registration: verify OTP with MSG91 and complete user registration
   */
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      toast.error('Please enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP with MSG91 widget
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Register user with server
      const newUser = await authApi.register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: formatPhoneForMsg91(phone),
        verificationToken,
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
      if (error.response?.status === 429) return;
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || error?.message || 'Failed to complete registration');
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
      if (error.response?.status === 429) return;
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 selection:bg-black selection:text-white">
      
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Modal Card — Responsive and elegant styling */}
      <div
        className="relative z-10 bg-white rounded-md max-w-[560px] w-full p-6 sm:p-10 lg:p-12 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 mx-3 sm:mx-auto"
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
          ) : mode === 'register' && registerStep === 'otp' ? (
            <>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={26} />
                <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                  Verify Mobile
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                We sent a 6-digit verification code to <span className="font-semibold text-gray-900">+91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setRegisterStep('form')}
                  className="ml-2 text-black underline underline-offset-2 hover:text-[#C09B7A] font-medium cursor-pointer"
                >
                  Edit
                </button>
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
        {mode !== 'forgot-password' && !(mode === 'register' && registerStep === 'otp') && (
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

            {/* Bottom Action Row: Responsive Full-width on mobile, side-by-side on desktop */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
              >
                Don&apos;t have an account? <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">Sign Up</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
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
        {mode === 'register' && registerStep === 'form' && (
          <form onSubmit={handleSendRegistrationOtp} className="space-y-3.5">
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

            {/* Mandatory Mobile Phone Number */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="modal-reg-phone" className="block text-xs font-bold text-gray-900">
                  Mobile Number
                </label>
                <span className="text-[11px] text-[#C09B7A] font-semibold">
                  * OTP Verified
                </span>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center px-3 py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                  +91
                </span>
                <input
                  id="modal-reg-phone"
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                />
              </div>
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
                  placeholder="Create a password (min. 8 characters)"
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
              By continuing, an SMS OTP will be sent to verify your phone number in accordance with our{' '}
              <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                Terms and Conditions
              </span>
            </p>

            {/* Bottom Action Row */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
              >
                Already have an account? <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">Sign In</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>SENDING OTP</span>
                  </span>
                ) : (
                  <span>VERIFY MOBILE</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* 2b. SIGN UP OTP VERIFICATION STEP */}
        {mode === 'register' && registerStep === 'otp' && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6 pt-2">
            <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
              <ShieldCheck className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-amber-900 leading-relaxed">
                Please enter the 6-digit OTP sent to <span className="font-bold">+91 {phone}</span> to verify your identity and activate your account.
              </div>
            </div>

            {/* 6-Digit Segmented OTP Input */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                Enter Verification Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => {
                      otpInputRefs.current[idx] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP Section */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => setRegisterStep('form')}
                className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Change Number</span>
              </button>

              <div>
                {resendCountdown > 0 ? (
                  <span className="text-gray-400 font-medium">
                    Resend code in 00:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="flex items-center gap-1 font-bold text-black hover:text-[#C09B7A] underline transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw size={12} />
                    <span>Resend OTP</span>
                  </button>
                )}
              </div>
            </div>

            {/* Submit Actions */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setRegisterStep('form')}
                className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
              >
                ← Back to Details
              </button>

              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>VERIFYING...</span>
                  </span>
                ) : (
                  <span>COMPLETE REGISTRATION</span>
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

                <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer py-1"
                  >
                    Back to Sign In
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
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
