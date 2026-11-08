'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Phone,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { Button } from '@/components/ui/button';

interface Props {
  onSuccess?: () => void;
  className?: string;
  isModal?: boolean;
}

export function AdminChangePasswordCard({ onSuccess, className = '', isModal = false }: Props) {
  const { user } = useAdminAuthStore();
  const { sendOtp, retryOtp, verifyOtp, isLoading: isOtpLoading } = useMsg91Otp();

  // Mode: standard password change or forgot password with mobile OTP
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Standard password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Forgot password OTP flow state: 'phone' -> 'otp' -> 'new-password'
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'new-password'>('phone');
  const [forgotPhone, setForgotPhone] = useState(user?.phone || '8089399521');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifiedResetToken, setVerifiedResetToken] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update phone if user changes
  useEffect(() => {
    if (user?.phone) {
      setForgotPhone(user.phone);
    }
  }, [user]);

  // Resend OTP countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Real-time password strength checks
  const criteria = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /\d/.test(newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
    };
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (criteria.minLength) score += 1;
    if (criteria.hasUpper) score += 1;
    if (criteria.hasLower) score += 1;
    if (criteria.hasNumber) score += 1;
    if (criteria.hasSpecial) score += 1;
    return score;
  }, [criteria]);

  const strengthConfig = useMemo(() => {
    if (!newPassword) {
      return { label: '', color: 'bg-muted', text: 'text-muted-foreground', percent: 0 };
    }
    if (strengthScore <= 2) {
      return { label: 'Weak', color: 'bg-rose-500', text: 'text-rose-500', percent: 25 };
    }
    if (strengthScore === 3) {
      return { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-500', percent: 50 };
    }
    if (strengthScore === 4) {
      return { label: 'Good', color: 'bg-blue-500', text: 'text-blue-500', percent: 75 };
    }
    return { label: 'Strong & Secure', color: 'bg-emerald-500', text: 'text-emerald-500', percent: 100 };
  }, [strengthScore, newPassword]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isFormValid =
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    criteria.hasUpper &&
    criteria.hasLower &&
    criteria.hasNumber &&
    criteria.hasSpecial &&
    passwordsMatch;

  // Strong password generator helper
  const handleGeneratePassword = () => {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghijkmnopqrstuvwxyz';
    const numbers = '23456789';
    const symbols = '!@#$%^&*()_+-=';
    const all = uppercase + lowercase + numbers + symbols;

    let generated = '';
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 0; i < 12; i++) {
      generated += all[Math.floor(Math.random() * all.length)];
    }

    const shuffled = generated
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setErrorMsg(null);

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shuffled).then(() => {
        setCopiedGenerated(true);
        setTimeout(() => setCopiedGenerated(false), 2000);
      });
    }

    toast.success('Generated strong password and copied to clipboard!');
  };

  // Standard submit (with current password)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!criteria.minLength) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (!criteria.hasUpper || !criteria.hasLower || !criteria.hasNumber || !criteria.hasSpecial) {
      setErrorMsg('New password must include uppercase, lowercase, number, and a special character.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('New password must be different from your current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(res?.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update password. Please try again.';
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------------
  // FORGOT PASSWORD VIA MOBILE OTP FLOW
  // -------------------------------------------------------------------
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = (forgotPhone || user?.phone || '8089399521').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit registered phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setForgotStep('otp');
      setResendCountdown(30);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the 4-digit verification code');
      return;
    }

    const cleanPhone = (forgotPhone || user?.phone || '8089399521').replace(/\D/g, '');
    setIsSubmitting(true);
    try {
      const verificationToken = await verifyOtp(fullOtp);

      const verifyRes = await authApi.verifyResetPasswordPhone({
        phone: cleanPhone,
        verificationToken,
      });

      const targetId = user?.id || verifyRes.user?.id || verifyRes.accounts?.[0]?.id;
      if (!targetId || !verifyRes.resetToken) {
        throw new Error('Could not identify administrator account');
      }

      setVerifiedResetToken(verifyRes.resetToken);
      setVerifiedUserId(targetId);
      setForgotStep('new-password');
      toast.success('Mobile number verified! Please choose your new password.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid or expired OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.confirmResetPasswordPhone({
        resetToken: verifiedResetToken,
        userId: verifiedUserId,
        newPassword,
      });

      toast.success('Password reset successfully via Mobile OTP!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsForgotMode(false);
      setForgotStep('phone');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = char;
    setOtpDigits(next);
    if (char && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // ===================================================================
  // RENDER: Forgot Password Mode (via Mobile OTP)
  // ===================================================================
  if (isForgotMode) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Phone size={14} />
            </div>
            <div>
              <span className="text-xs font-bold text-foreground block">
                Reset Password with Mobile OTP
              </span>
              <span className="text-[10px] text-muted-foreground">
                Reset directly using your registered admin phone number
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsForgotMode(false);
              setForgotStep('phone');
              setErrorMsg(null);
            }}
            className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={12} />
            <span>Use current password</span>
          </button>
        </div>

        {/* Step 1: Send OTP to Phone */}
        {forgotStep === 'phone' && (
          <form onSubmit={handleSendForgotOtp} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Registered Administrator Phone
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="8089399521"
                  required
                  disabled={isSubmitting || isOtpLoading}
                  className="w-full pl-12 pr-4 py-2 text-sm bg-card border rounded-xl font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                A 4-digit SMS OTP will be sent to this phone number to authorize the password reset.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForgotMode(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isOtpLoading || forgotPhone.length < 10}
                className="gap-1.5 text-xs font-bold bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
              >
                {isSubmitting || isOtpLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification OTP</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 2: 4-digit OTP */}
        {forgotStep === 'otp' && (
          <form onSubmit={handleVerifyForgotOtp} className="space-y-3.5">
            <div className="text-center text-xs text-muted-foreground">
              Enter 4-digit verification code sent to <strong className="text-foreground">+91 {forgotPhone}</strong>
            </div>

            <div className="flex items-center justify-center gap-2.5 my-3">
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
                  onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="w-11 h-11 text-center text-xl font-bold rounded-xl border border-border bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xs"
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-xs px-1">
              <button
                type="button"
                onClick={() => setForgotStep('phone')}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Change number
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (resendCountdown > 0) return;
                  await retryOtp();
                  setResendCountdown(30);
                  toast.success('New code sent via SMS');
                }}
                disabled={resendCountdown > 0}
                className="text-primary font-medium hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw size={12} />
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForgotStep('phone')}
                className="text-xs cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || isOtpLoading || otpDigits.join('').length !== 4}
                className="gap-1.5 text-xs font-bold bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
              >
                {isSubmitting || isOtpLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <CheckCircle2 size={13} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step 3: Enter New Password directly without old password */}
        {forgotStep === 'new-password' && (
          <form onSubmit={handleConfirmResetPassword} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground">New Security Password</label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  <KeyRound size={12} className="text-primary" />
                  <span>Generate strong password</span>
                  {copiedGenerated && <Check size={12} className="text-emerald-500" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters with letters, numbers, and symbols"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Requirements Checklist */}
              <div className="grid grid-cols-2 gap-1.5 pt-1.5 text-[11px]">
                <div className={`flex items-center gap-1.5 ${criteria.minLength ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                  {criteria.minLength ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/40" />}
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasUpper && criteria.hasLower ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                  {criteria.hasUpper && criteria.hasLower ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/40" />}
                  <span>Upper & lowercase</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasNumber ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                  {criteria.hasNumber ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/40" />}
                  <span>At least 1 number</span>
                </div>
                <div className={`flex items-center gap-1.5 ${criteria.hasSpecial ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                  {criteria.hasSpecial ? <CheckCircle2 size={12} className="text-emerald-500" /> : <div className="w-2.5 h-2.5 rounded-full border border-muted-foreground/40" />}
                  <span>Special character (!@#)</span>
                </div>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your new password"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsForgotMode(false)}
                className="text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || newPassword.length < 8 || newPassword !== confirmPassword}
                className="gap-1.5 text-xs font-bold bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving Password...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Save Password</span>
                    <CheckCircle2 size={13} />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  // ===================================================================
  // RENDER: Standard Password Change Mode
  // ===================================================================
  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in-50">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Current Password with Forgot Link */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground flex items-center justify-between">
          <span>Current Password</span>
          <button
            type="button"
            onClick={() => {
              setIsForgotMode(true);
              setForgotStep('phone');
              setErrorMsg(null);
            }}
            className="text-[11px] text-primary hover:underline font-semibold cursor-pointer transition-colors"
          >
            Forgot current password? Reset with OTP
          </button>
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Enter your existing admin password"
            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            title={showCurrentPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* New Password & Quick Generator */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">New Security Password</label>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
          >
            <KeyRound size={12} className="text-primary" />
            <span>Generate strong password</span>
            {copiedGenerated && <Check size={12} className="text-emerald-500" />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Min 8 characters with letters, numbers, and symbols"
            className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            title={showNewPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        {/* Live Strength Meter */}
        {newPassword.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Password strength:</span>
              <span className={`font-bold ${strengthConfig.text}`}>{strengthConfig.label}</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${strengthConfig.color}`}
                style={{ width: `${strengthConfig.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Requirements Checklist */}
        <div className="grid grid-cols-2 gap-1.5 pt-2 text-[11px]">
          <div className={`flex items-center gap-1.5 ${criteria.minLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
            {criteria.minLength ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />}
            <span>At least 8 characters</span>
          </div>

          <div className={`flex items-center gap-1.5 ${criteria.hasUpper && criteria.hasLower ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
            {criteria.hasUpper && criteria.hasLower ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />}
            <span>Upper & lowercase</span>
          </div>

          <div className={`flex items-center gap-1.5 ${criteria.hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
            {criteria.hasNumber ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />}
            <span>At least 1 number</span>
          </div>

          <div className={`flex items-center gap-1.5 ${criteria.hasSpecial ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
            {criteria.hasSpecial ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> : <div className="w-3 h-3 rounded-full border border-muted-foreground/40 shrink-0" />}
            <span>Special character (!@#)</span>
          </div>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-foreground">Confirm New Password</label>
          {passwordsMatch && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 size={12} />
              <span>Passwords match</span>
            </span>
          )}
          {passwordsMismatch && (
            <span className="text-[11px] font-semibold text-rose-500 flex items-center gap-1">
              <XCircle size={12} />
              <span>Passwords do not match</span>
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Re-type your new security password"
            className={`w-full pl-3.5 pr-10 py-2.5 text-sm bg-card border rounded-xl focus:outline-none focus:ring-2 transition-all font-mono ${
              passwordsMatch
                ? 'border-emerald-500/50 focus:border-emerald-500 focus:ring-emerald-500/20'
                : passwordsMismatch
                ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20'
                : 'focus:ring-primary/20 focus:border-primary'
            }`}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        {(currentPassword || newPassword || confirmPassword) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setErrorMsg(null);
            }}
            disabled={isSubmitting}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Clear
          </Button>
        )}

        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-[#1A2E4C] hover:bg-[#132238] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Updating Password...</span>
            </>
          ) : (
            <>
              <Key size={14} />
              <span>Update Password</span>
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
