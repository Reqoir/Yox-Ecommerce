'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';
import { authApi, CandidateAccount } from '@/api/auth';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { toast } from 'sonner';
import {
  X,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  Users,
  ChevronRight,
} from 'lucide-react';

export function AuthModal() {
  const router = useRouter();
  const { isOpen, redirectUrl, closeModal } = useAuthModalStore();
  const { user, isAuthenticated, setAuthData } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Flow step: 'phone' -> 'otp' -> (optional 'select-account')
  const [step, setStep] = useState<'phone' | 'otp' | 'select-account'>('phone');
  const [phone, setPhone] = useState('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Multi-account selection state (for legacy numbers with multiple users)
  const [candidateAccounts, setCandidateAccounts] = useState<CandidateAccount[]>([]);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

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

  // Reset steps when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setStep('phone');
      setOtpDigits(['', '', '', '']);
      setResendCountdown(0);
      setCandidateAccounts([]);
      setSelectionToken(null);
      setSelectedAccountId(null);
    }
  }, [isOpen]);

  // Close modal automatically if user is already authenticated
  useEffect(() => {
    if (user || isAuthenticated) {
      closeModal();
    }
  }, [user, isAuthenticated, closeModal]);

  // Handle ESC key to dismiss
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

  // ─── 1. SEND OTP ─────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setStep('otp');
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

  // ─── 2. RESEND OTP ───────────────────────────────────────────────────────────
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

  // ─── 3. VERIFY OTP & AUTO-LOGIN / REGISTER ───────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify with MSG91 widget to obtain token
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Authenticate / Auto-Register on server
      const res = await authApi.loginWithPhone({
        phone: formatPhoneForMsg91(phone),
        verificationToken,
      });

      // Handle multi-account selection if applicable
      if (res.multipleAccounts && res.accounts && res.selectionToken) {
        setCandidateAccounts(res.accounts);
        setSelectionToken(res.selectionToken);
        setStep('select-account');
        return;
      }

      if (res.user) {
        setAuthData(res.user, 'dummy_token');
        await useCartStore.getState().syncWithServer();

        toast.success(`Welcome, ${res.user.fullName || 'Customer'}!`);
        closeModal();

        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 429) return;
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || error?.message || 'Failed to verify OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 4. MULTI-ACCOUNT SELECTION ──────────────────────────────────────────────
  const handleSelectAccount = async (account: CandidateAccount) => {
    if (!selectionToken || isLoading) return;
    setSelectedAccountId(account.id);
    setIsLoading(true);
    try {
      const loggedUser = await authApi.selectPhoneAccount({
        selectionToken,
        userId: account.id,
      });

      setAuthData(loggedUser, 'dummy_token');
      await useCartStore.getState().syncWithServer();

      toast.success(`Welcome back, ${loggedUser.fullName || 'Customer'}!`);
      closeModal();

      if (redirectUrl) {
        router.push(redirectUrl);
      }
    } catch (error: any) {
      if (error.response?.status === 429) return;
      toast.error(error.response?.data?.message || 'Failed to select account. Please try again.');
    } finally {
      setIsLoading(false);
      setSelectedAccountId(null);
    }
  };

  // ─── OTP Digit Input Handlers ────────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.slice(-1).replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 3) {
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
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const focusIdx = Math.min(pasted.length, 3);
    otpInputRefs.current[focusIdx]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 selection:bg-black selection:text-white">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Modal Card */}
      <div
        className="relative z-10 bg-white rounded-md max-w-[500px] w-full p-6 sm:p-10 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 mx-3 sm:mx-auto max-h-[92vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-6 right-6 p-1 text-gray-500 hover:text-black transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X size={24} strokeWidth={1.5} />
        </button>

        {/* Modal Header */}
        <div className="mb-6 space-y-1.5">
          {step === 'select-account' ? (
            <>
              <div className="flex items-center gap-2">
                <Users className="text-[#C09B7A]" size={24} />
                <h2 className="text-2xl sm:text-[28px] font-normal tracking-tight text-gray-900 leading-tight">
                  Choose Account
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                Multiple accounts are linked to <span className="font-semibold text-gray-900">+91 {phone}</span>. Select which account to sign in with:
              </p>
            </>
          ) : step === 'otp' ? (
            <>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#C09B7A]" size={24} />
                <h2 className="text-2xl sm:text-[28px] font-normal tracking-tight text-gray-900 leading-tight">
                  Verify Mobile
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                We sent a 4-digit verification code to{' '}
                <span className="font-semibold text-gray-900">+91 {phone}</span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="ml-2 text-black underline underline-offset-2 hover:text-[#C09B7A] font-medium cursor-pointer"
                >
                  Edit
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl sm:text-[28px] font-normal tracking-tight text-gray-900 leading-tight">
                Login / Sign Up
              </h2>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                Enter your mobile number to get started with YOX. No password needed!
              </p>
            </>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 1: ENTER PHONE NUMBER                                         */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="modal-customer-phone" className="block text-xs font-bold text-gray-900 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="flex items-center">
                <span className="inline-flex items-center justify-center px-3 py-3 text-base sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                  +91
                </span>
                <input
                  id="modal-customer-phone"
                  type="tel"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full px-3.5 py-3 text-base sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                />
              </div>
              <p className="text-[11px] text-gray-500 pt-1">
                A 4-digit OTP will be sent to this mobile number for instant verification.
              </p>
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
              By continuing, you agree to our{' '}
              <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                Terms of Service
              </span>{' '}
              and{' '}
              <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                Privacy Policy
              </span>.
            </p>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || phone.replace(/\D/g, '').length !== 10}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>SENDING OTP...</span>
                  </span>
                ) : (
                  <span>CONTINUE</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 2: ENTER 4-DIGIT OTP                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5 pt-1">
            <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
              <ShieldCheck className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
              <div className="text-xs text-amber-900 leading-relaxed">
                Enter the 4-digit code sent to <span className="font-bold">+91 {phone}</span> to proceed.
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                Enter Verification Code
              </label>
              <div
                className="flex items-center justify-center gap-3 sm:gap-4"
                onPaste={handleOtpPaste}
              >
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
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                    autoFocus={idx === 0}
                  />
                ))}
              </div>
            </div>

            {/* Resend and Edit Actions */}
            <div className="flex items-center justify-between text-xs pt-1 px-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
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

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || otpDigits.join('').length !== 4}
                className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span>VERIFYING...</span>
                  </span>
                ) : (
                  <span>VERIFY & CONTINUE</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* STEP 3: MULTI-ACCOUNT PICKER (LEGACY EDGE CASE)                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {step === 'select-account' && (
          <div className="space-y-4 pt-1">
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {candidateAccounts.map((account) => {
                const isSelected = selectedAccountId === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSelectAccount(account)}
                    className="w-full text-left p-4 border border-gray-200 hover:border-black rounded-sm transition-all cursor-pointer bg-white hover:bg-gray-50 flex items-center justify-between group disabled:opacity-50"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-sm text-gray-900 group-hover:text-black">
                        {account.fullName || 'Customer'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">
                        {account.maskedEmail || 'Mobile Account'}
                      </div>
                    </div>
                    {isSelected ? (
                      <Loader2 size={18} className="animate-spin text-black" />
                    ) : (
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-black transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setStep('phone')}
              className="text-xs text-gray-500 hover:text-black transition-colors cursor-pointer flex items-center gap-1.5 pt-1"
            >
              <ArrowLeft size={14} />
              <span>Back to Phone</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
