'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Shield,
  Key,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Bell,
  Save,
  Smartphone,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const { user } = useAuthStore();

  // ─── Notification Preferences ───────────────────────────────────────────────
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [promotionalEmails, setPromotionalEmails] = useState(false);
  const [returnUpdates, setReturnUpdates] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('yox_user_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.orderUpdates !== undefined) setOrderUpdates(parsed.orderUpdates);
          if (parsed.promotionalEmails !== undefined) setPromotionalEmails(parsed.promotionalEmails);
          if (parsed.returnUpdates !== undefined) setReturnUpdates(parsed.returnUpdates);
          if (parsed.smsAlerts !== undefined) setSmsAlerts(parsed.smsAlerts);
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, []);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'yox_user_notifications',
          JSON.stringify({
            orderUpdates,
            promotionalEmails,
            returnUpdates,
            smsAlerts,
          })
        );
      }
      setTimeout(() => {
        setIsSavingPrefs(false);
        toast.success('Notification preferences updated successfully!');
      }, 400);
    } catch {
      setIsSavingPrefs(false);
      toast.error('Failed to save preferences');
    }
  };

  // ─── Security Tab ──────────────────────────────────────────────────────────
  const [securityMethod, setSecurityMethod] = useState<'current-password' | 'phone-otp'>('current-password');

  // ─── Method 1: Change Password using Current Password ──────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Password rules validation helper
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial;
  const isMatching = newPassword.length > 0 && newPassword === confirmPassword;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!isPasswordValid) {
      toast.error('New password does not meet the security requirements');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(res.message || 'Security password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Failed to update password. Please check your current password.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ─── Method 2: Reset Password via Mobile OTP ───────────────────────────────
  const [otpStep, setOtpStep] = useState<'request' | 'verify'>('request');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpNewPassword, setOtpNewPassword] = useState('');
  const [otpConfirmPassword, setOtpConfirmPassword] = useState('');
  const [showOtpNewPassword, setShowOtpNewPassword] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendOtp, retryOtp, verifyOtp, formatPhoneForMsg91 } = useMsg91Otp();

  // Countdown timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCountdown > 0) {
      interval = setInterval(() => {
        setResendCountdown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCountdown]);

  // Clean phone number for user
  const userCleanPhone = user?.phone ? user.phone.replace(/\D/g, '').slice(-10) : '';

  const handleSendOtp = async () => {
    if (!userCleanPhone || userCleanPhone.length !== 10) {
      toast.error('No valid mobile number linked to this account. Please update your mobile number under Personal Info first.');
      return;
    }

    setIsOtpLoading(true);
    try {
      await sendOtp(userCleanPhone);
      toast.success(`Verification code sent to +91 ${userCleanPhone}`);
      setOtpStep('verify');
      setResendCountdown(30);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isOtpLoading) return;
    setIsOtpLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // OTP Digits input handlers
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.slice(-1).replace(/\D/g, '');
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);

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

    const nextDigits = [...otpDigits];
    for (let i = 0; i < 4; i++) {
      nextDigits[i] = pasted[i] || '';
    }
    setOtpDigits(nextDigits);
    const focusIdx = Math.min(pasted.length, 3);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtpAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    if (otpNewPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/;
    if (!passwordRegex.test(otpNewPassword)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (otpNewPassword !== otpConfirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!user?.id) {
      toast.error('User session expired. Please refresh the page.');
      return;
    }

    setIsOtpLoading(true);
    try {
      // 1. Verify OTP with MSG91 widget
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Call backend to verify phone and get resetToken
      const verifyRes = await authApi.verifyResetPasswordPhone({
        phone: formatPhoneForMsg91(userCleanPhone),
        verificationToken,
      });

      // 3. Confirm password reset strictly for this logged-in account
      const confirmRes = await authApi.confirmResetPasswordPhone({
        resetToken: verifyRes.resetToken,
        userId: user.id,
        newPassword: otpNewPassword,
      });

      toast.success(confirmRes.message || 'Password reset successfully!');
      setOtpStep('request');
      setOtpDigits(['', '', '', '']);
      setOtpNewPassword('');
      setOtpConfirmPassword('');
      setSecurityMethod('current-password');
    } catch (error: any) {
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || error?.message || 'Failed to reset password');
      }
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Settings & Security</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage your account credentials, security preferences, and notification alerts
        </p>
      </div>

      {/* ─── 1. SECURITY & PASSWORD SECTION ─────────────────────────────────── */}
      <div className="bg-white border border-gray-200/90 rounded-sm shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <Key size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Security & Password</h3>
              <p className="text-xs text-gray-500">Ensure your account is protected with a strong, updated password</p>
            </div>
          </div>

          {/* Method Selector Tabs */}
          <div className="inline-flex p-1 bg-gray-100/90 rounded-sm border border-gray-200/60">
            <button
              type="button"
              onClick={() => setSecurityMethod('current-password')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                securityMethod === 'current-password'
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              Current Password
            </button>
            <button
              type="button"
              onClick={() => setSecurityMethod('phone-otp')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                securityMethod === 'phone-otp'
                  ? 'bg-white text-black shadow-xs font-bold'
                  : 'text-gray-500 hover:text-black'
              }`}
            >
              <Smartphone size={13} />
              <span>Mobile OTP</span>
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {/* Method A: Standard Current Password Change */}
          {securityMethod === 'current-password' && (
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
              <div>
                <label className="text-xs font-bold text-gray-900 block mb-1">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-900 block mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>
              </div>

              {/* Password Requirements Badges */}
              {newPassword.length > 0 && (
                <div className="bg-gray-50 border border-gray-200/80 rounded-sm p-3 space-y-2 text-[11px]">
                  <p className="font-semibold text-gray-700">Password Requirements:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <span className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={hasMinLength ? 3 : 1.5} />
                      <span>8+ Characters</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={hasUpper ? 3 : 1.5} />
                      <span>Uppercase (A-Z)</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={hasLower ? 3 : 1.5} />
                      <span>Lowercase (a-z)</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={hasNumber ? 3 : 1.5} />
                      <span>Number (0-9)</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={hasSpecial ? 3 : 1.5} />
                      <span>Special Character</span>
                    </span>
                    <span className={`flex items-center gap-1.5 ${isMatching ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                      <Check size={12} strokeWidth={isMatching ? 3 : 1.5} />
                      <span>Passwords Match</span>
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSecurityMethod('phone-otp')}
                  className="text-xs text-gray-500 hover:text-black underline transition-colors cursor-pointer text-left"
                >
                  Forgot current password? Reset with Mobile OTP →
                </button>

                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !isPasswordValid || !isMatching}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={14} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Method B: Mobile OTP Reset (Instant without knowing current password) */}
          {securityMethod === 'phone-otp' && (
            <div className="space-y-4 max-w-xl">
              {userCleanPhone ? (
                otpStep === 'request' ? (
                  <div className="space-y-4">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
                      <Shield className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        Reset your password directly by verifying an SMS OTP sent to your verified mobile number{' '}
                        <span className="font-bold">+91 {userCleanPhone}</span>.
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setSecurityMethod('current-password')}
                        className="text-xs text-gray-500 hover:text-black underline transition-colors cursor-pointer text-left"
                      >
                        ← Back to Current Password
                      </button>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isOtpLoading}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                      >
                        {isOtpLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : (
                          <>
                            <Smartphone size={14} />
                            <span>Send Verification Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerifyOtpAndResetPassword} className="space-y-4">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
                      <Shield className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        Verification code sent to <span className="font-bold">+91 {userCleanPhone}</span>. Enter code and your new password:
                      </div>
                    </div>

                    {/* 4-Digit OTP Boxes */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                        Enter 4-Digit SMS Code
                      </label>
                      <div className="flex items-center justify-center gap-3" onPaste={handleOtpPaste}>
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
                            className="w-13 h-13 sm:w-14 sm:h-14 text-center text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>

                      {/* Resend row */}
                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <button
                          type="button"
                          onClick={() => setOtpStep('request')}
                          className="text-gray-500 hover:text-black transition-colors cursor-pointer"
                        >
                          ← Change
                        </button>
                        <div>
                          {resendCountdown > 0 ? (
                            <span className="text-gray-400 font-medium">
                              Resend in 00:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleResendOtp}
                              disabled={isOtpLoading}
                              className="flex items-center gap-1 font-bold text-black hover:text-[#C09B7A] underline transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <RotateCcw size={12} />
                              <span>Resend Code</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* New Password fields */}
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-gray-900 block mb-1">
                          New Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showOtpNewPassword ? 'text' : 'password'}
                            required
                            value={otpNewPassword}
                            onChange={(e) => setOtpNewPassword(e.target.value)}
                            placeholder="At least 8 characters"
                            className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOtpNewPassword(!showOtpNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          >
                            {showOtpNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-900 block mb-1">
                          Confirm New Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type={showOtpNewPassword ? 'text' : 'password'}
                          required
                          value={otpConfirmPassword}
                          onChange={(e) => setOtpConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Must contain uppercase, lowercase, number, and special character.
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setOtpStep('request')}
                        className="text-xs text-gray-500 hover:text-black underline transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={
                          isOtpLoading ||
                          otpDigits.join('').length !== 4 ||
                          otpNewPassword.length < 8 ||
                          otpNewPassword !== otpConfirmPassword
                        }
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                      >
                        {isOtpLoading ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            <span>Updating...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Verify & Set Password</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-sm text-center space-y-3">
                  <ShieldAlert className="mx-auto text-amber-600" size={32} />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 uppercase">No Mobile Number Linked</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      You must add and verify a mobile number in your profile to use SMS OTP reset.
                    </p>
                  </div>
                  <Link
                    href="/profile/personal-info"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-sm hover:bg-neutral-800 transition-colors"
                  >
                    <span>Go to Personal Info</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── 2. NOTIFICATIONS & PREFERENCES ─────────────────────────────────── */}
      <form onSubmit={handleSavePreferences} className="bg-white border border-gray-200/90 rounded-sm shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Communication & Notifications</h3>
              <p className="text-xs text-gray-500">Control how and when you receive order, shipping, and promotional updates</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 divide-y divide-gray-100">
          <div className="flex items-center justify-between py-3.5 first:pt-0">
            <div>
              <p className="text-xs font-bold text-gray-900">Order & Logistics Tracking Updates</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Receive real-time notifications when your order status changes.</p>
            </div>
            <input
              type="checkbox"
              checked={orderUpdates}
              onChange={(e) => setOrderUpdates(e.target.checked)}
              className="w-4 h-4 text-black accent-black rounded-xs border-gray-300 focus:ring-black cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-xs font-bold text-gray-900">Return & Refund Status Alerts</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Receive driver assignment & refund completed notifications.</p>
            </div>
            <input
              type="checkbox"
              checked={returnUpdates}
              onChange={(e) => setReturnUpdates(e.target.checked)}
              className="w-4 h-4 text-black accent-black rounded-xs border-gray-300 focus:ring-black cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3.5">
            <div>
              <p className="text-xs font-bold text-gray-900">SMS Express Notifications</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Send SMS alerts for delivery executive arrivals to your mobile number.</p>
            </div>
            <input
              type="checkbox"
              checked={smsAlerts}
              onChange={(e) => setSmsAlerts(e.target.checked)}
              className="w-4 h-4 text-black accent-black rounded-xs border-gray-300 focus:ring-black cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between py-3.5 last:pb-0">
            <div>
              <p className="text-xs font-bold text-gray-900">Exclusive Sales & Member Offers</p>
              <p className="text-gray-500 text-[11px] mt-0.5">Receive early access to seasonal discount sales, VIP perks, and new arrivals.</p>
            </div>
            <input
              type="checkbox"
              checked={promotionalEmails}
              onChange={(e) => setPromotionalEmails(e.target.checked)}
              className="w-4 h-4 text-black accent-black rounded-xs border-gray-300 focus:ring-black cursor-pointer"
            />
          </div>
        </div>

        <div className="p-5 sm:p-6 bg-gray-50/70 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={isSavingPrefs}
            className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-sm transition-all cursor-pointer shadow-xs active:scale-[0.99] disabled:opacity-50"
          >
            {isSavingPrefs ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
