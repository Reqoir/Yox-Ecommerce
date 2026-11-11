'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Bell,
  CheckCircle2,
  ChevronDown,
  LogOut,
  ExternalLink,
  Loader2,
  KeyRound,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
} from 'lucide-react';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { user, logoutUser } = useAuthStore();

  // Optional password management
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Mobile OTP Reset flow
  const { sendOtp, retryOtp, verifyOtp, isLoading: isOtpLoading } = useMsg91Otp();
  const [isOtpResetMode, setIsOtpResetMode] = useState(false);
  const [otpStep, setOtpStep] = useState<'otp' | 'new-password'>('otp');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [verifiedResetToken, setVerifiedResetToken] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Notification preferences (Local UI state)
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [promotionalAlerts, setPromotionalAlerts] = useState(false);

  const rawPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = rawPhone ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : 'Not linked';

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await authApi.changePassword({
        currentPassword: currentPassword || 'default_initial_otp',
        newPassword,
        confirmPassword,
      });

      toast.success(res.message || 'Security password set successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordSectionOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update password. Please check your credentials.';
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // OTP Reset Handlers
  const handleStartOtpReset = async () => {
    if (!rawPhone) {
      toast.error('No mobile phone number is linked to your account');
      return;
    }
    setIsChangingPassword(true);
    try {
      await sendOtp(rawPhone);
      toast.success(`Verification code sent to +91 ${rawPhone}`);
      setIsOtpResetMode(true);
      setOtpStep('otp');
      setOtpCountdown(30);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP code');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleVerifyOtpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the 4-digit code');
      return;
    }
    setIsChangingPassword(true);
    try {
      const verificationToken = await verifyOtp(fullOtp);
      const verifyRes = await authApi.verifyResetPasswordPhone({
        phone: rawPhone,
        verificationToken,
      });

      const targetId = user?.id || verifyRes.user?.id || verifyRes.accounts?.[0]?.id;
      if (!targetId || !verifyRes.resetToken) {
        throw new Error('Account verification failed');
      }

      setVerifiedResetToken(verifyRes.resetToken);
      setVerifiedUserId(targetId);
      setOtpStep('new-password');
      toast.success('Phone verified! Please set your new password.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid or expired OTP code');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleConfirmOtpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await authApi.confirmResetPasswordPhone({
        resetToken: verifiedResetToken,
        userId: verifiedUserId,
        newPassword,
      });

      toast.success('Password updated successfully via Mobile OTP!');
      setNewPassword('');
      setConfirmPassword('');
      setIsOtpResetMode(false);
      setIsPasswordSectionOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      logoutUser();
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Settings</h2>
        <p className="text-xs text-gray-500 mt-1">
          Manage your security preferences, order notifications, and active session
        </p>
      </div>

      {/* ─── 1. LOGIN & SECURITY ────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#C09B7A]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Login & Security
          </h3>
        </div>

        {/* Primary Phone Auth Status Card */}
        <div className="bg-white border border-gray-200 rounded-sm p-5 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Smartphone size={20} className="text-[#C09B7A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    Phone & SMS OTP Authentication
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200/60">
                    <CheckCircle2 size={11} className="text-emerald-600" /> ACTIVE
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  Linked Number: <span className="text-gray-900 font-semibold">{formattedPhone}</span>
                </p>
              </div>
            </div>

            <span className="text-xs font-medium text-emerald-700 bg-emerald-50/70 px-3 py-1.5 rounded-sm border border-emerald-100 self-start sm:self-auto">
              Passwordless & Secure
            </span>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-xs leading-relaxed border border-gray-100">
            Every time you sign in on any device, you receive a dynamic 4-digit verification code directly to your phone. This eliminates password-theft risks and simplifies your checkout experience.
          </div>

          {/* Optional Password Collapsible */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
              className="flex items-center justify-between w-full text-left text-xs font-bold text-gray-700 hover:text-black py-1 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <KeyRound size={14} className="text-gray-400" />
                <span>Optional Password Setup</span>
                <span className="text-[10px] text-gray-400 font-normal">(Not required)</span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${isPasswordSectionOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isPasswordSectionOpen && (
              <div className="mt-4 max-w-md bg-gray-50/60 p-4 rounded-xs border border-gray-200/70 animate-in fade-in duration-150 space-y-3.5">
                {isOtpResetMode ? (
                  /* OTP Reset Mode */
                  otpStep === 'otp' ? (
                    <form onSubmit={handleVerifyOtpReset} className="space-y-3">
                      <div className="text-xs text-gray-700">
                        Enter the 4-digit code sent to <strong className="text-black">+91 {rawPhone}</strong>
                      </div>

                      <div className="flex items-center gap-2.5 my-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              otpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => {
                              const char = e.target.value.replace(/\D/g, '').slice(-1);
                              const next = [...otpDigits];
                              next[idx] = char;
                              setOtpDigits(next);
                              if (char && idx < 3) otpInputRefs.current[idx + 1]?.focus();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Backspace' && !otpDigits[idx] && idx > 0) {
                                otpInputRefs.current[idx - 1]?.focus();
                              }
                            }}
                            className="w-10 h-10 text-center text-lg font-bold border border-gray-300 bg-white focus:outline-none focus:border-black rounded-none shadow-xs"
                          />
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setIsOtpResetMode(false)}
                          className="text-gray-500 hover:text-black cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (otpCountdown > 0) return;
                            await retryOtp();
                            setOtpCountdown(30);
                            toast.success('New code sent via SMS');
                          }}
                          disabled={otpCountdown > 0 || isOtpLoading}
                          className="text-black font-semibold hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                        >
                          <RotateCcw size={12} />
                          {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend Code'}
                        </button>
                      </div>

                      <div className="pt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOtpResetMode(false)}
                          className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-black border border-gray-300 bg-white rounded-none cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingPassword || isOtpLoading || otpDigits.join('').length !== 4}
                          className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-none disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isChangingPassword || isOtpLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleConfirmOtpReset} className="space-y-3.5">
                      <div className="text-xs font-bold text-gray-900 border-b pb-1.5">
                        Set New Password
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-800">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-800">Confirm Password</label>
                        <input
                          type="password"
                          required
                          placeholder="Re-enter password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-black"
                        />
                      </div>

                      <div className="pt-1 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOtpResetMode(false)}
                          className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-black border border-gray-300 bg-white rounded-none cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isChangingPassword || newPassword.length < 8 || newPassword !== confirmPassword}
                          className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-none disabled:opacity-50 cursor-pointer shadow-xs"
                        >
                          {isChangingPassword ? 'Saving...' : 'Save Password'}
                        </button>
                      </div>
                    </form>
                  )
                ) : (
                  /* Standard Password Form */
                  <form onSubmit={handleUpdatePassword} className="space-y-3.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-gray-800">New Password</label>
                        {rawPhone && (
                          <button
                            type="button"
                            onClick={handleStartOtpReset}
                            className="text-[11px] text-black font-semibold hover:underline cursor-pointer"
                          >
                            Reset with Mobile OTP
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          placeholder="At least 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-black pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-800">Confirm Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-black"
                      />
                    </div>

                    <div className="pt-1 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPasswordSectionOpen(false)}
                        className="px-3.5 py-1.5 text-xs text-gray-600 hover:text-black border border-gray-300 bg-white rounded-none cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-none disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isChangingPassword ? 'Saving...' : 'Set Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. ORDER NOTIFICATIONS & PREFERENCES ───────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-[#C09B7A]" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Order Notifications
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100 shadow-2xs">
          {/* SMS Tracking */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                SMS Order Updates & OTPs
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Instant delivery alerts, courier dispatch tracking, and security codes via SMS
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-xs shrink-0 select-none">
              ALWAYS ON
            </span>
          </div>

          {/* WhatsApp Updates */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                WhatsApp Delivery Tracking
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Receive live live tracking links and delivery confirmations on WhatsApp
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setWhatsappAlerts(!whatsappAlerts);
                toast.success(`WhatsApp updates ${!whatsappAlerts ? 'enabled' : 'disabled'}`);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                whatsappAlerts ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  whatsappAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {/* Promotional Drops */}
          <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-900">
                Exclusive Drops & Style Previews
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Be the first to hear about seasonal collections, restocks, and private sales
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setPromotionalAlerts(!promotionalAlerts);
                toast.success(`Drop previews ${!promotionalAlerts ? 'enabled' : 'disabled'}`);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                promotionalAlerts ? 'bg-black' : 'bg-gray-300'
              }`}
            >
              <span
                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${
                  promotionalAlerts ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 3. ACCOUNT ACTIONS ─────────────────────────────────────────────── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2">
          <LogOut size={18} className="text-gray-400" />
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
            Account Session
          </h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Active Browser Session
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Securely sign out of this browser. Your cart and orders will be safely preserved.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-xs transition-colors cursor-pointer self-start sm:self-auto shrink-0 shadow-2xs"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
