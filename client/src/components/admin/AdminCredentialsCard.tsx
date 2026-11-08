'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { profileApi } from '@/api/profile';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Loader2,
  ArrowRight,
  Edit3,
  X,
  Check,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export function AdminCredentialsCard() {
  const { user, updateUser } = useAdminAuthStore();
  const { sendOtp, retryOtp, verifyOtp, isLoading: isOtpLoading } = useMsg91Otp();

  // Only the main Store Owner / Super Admin can change email and phone number
  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const r = (user.role || '').toUpperCase();
    return (
      r === 'ADMIN' ||
      r === 'SUPER_ADMIN' ||
      user.email === 'admin@yox.com' ||
      (user.permissions && user.permissions.includes('*'))
    );
  }, [user]);

  // Active edit state: null | 'email' | 'phone'
  const [activeEdit, setActiveEdit] = useState<'email' | 'phone' | null>(null);

  // Email change state: 'input' -> 'otp'
  const [newEmail, setNewEmail] = useState('');
  const [emailOtpStep, setEmailOtpStep] = useState<'input' | 'otp'>('input');
  const [emailOtpDigits, setEmailOtpDigits] = useState<string[]>(['', '', '', '']);
  const [emailCountdown, setEmailCountdown] = useState(0);

  // Phone change state: 'input' -> 'otp'
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'input' | 'otp'>('input');
  const [phoneOtpDigits, setPhoneOtpDigits] = useState<string[]>(['', '', '', '']);
  const [phoneCountdown, setPhoneCountdown] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdowns
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailCountdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (phoneCountdown > 0) {
      timer = setTimeout(() => setPhoneCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [phoneCountdown]);

  // Cancel edit mode
  const cancelEdit = () => {
    setActiveEdit(null);
    setNewEmail('');
    setEmailOtpStep('input');
    setEmailOtpDigits(['', '', '', '']);
    setNewPhone('');
    setPhoneOtpStep('input');
    setPhoneOtpDigits(['', '', '', '']);
  };

  // -------------------------------------------------------------
  // CHANGE EMAIL FLOW (Protected by OTP sent to current phone)
  // -------------------------------------------------------------
  const handleStartEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      toast.error('Please enter a valid new email address');
      return;
    }
    if (clean === user?.email?.toLowerCase()) {
      toast.error('New email must be different from your current email');
      return;
    }

    const currentPhone = (user?.phone || '8089399521').replace(/\D/g, '');
    setIsSubmitting(true);
    try {
      await sendOtp(currentPhone);
      toast.success(`Verification OTP sent to your registered phone +91 ${currentPhone}`);
      setEmailOtpStep('otp');
      setEmailCountdown(30);
      setEmailOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = emailOtpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the 4-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      // Verify OTP with MSG91
      await verifyOtp(fullOtp);

      // Update profile with new email
      const updatedUser = await profileApi.updateProfile({
        email: newEmail.trim().toLowerCase(),
      });

      updateUser({ email: updatedUser.email });
      toast.success(`Official work email successfully updated to ${updatedUser.email}!`);
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update email address');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // CHANGE PHONE FLOW (Protected by OTP sent to new phone)
  // -------------------------------------------------------------
  const handleStartPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNew = newPhone.replace(/\D/g, '');
    if (cleanNew.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (cleanNew === user?.phone?.replace(/\D/g, '')) {
      toast.error('New phone number must be different from current phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      await sendOtp(cleanNew);
      toast.success(`Verification OTP sent to new mobile +91 ${cleanNew}`);
      setPhoneOtpStep('otp');
      setPhoneCountdown(30);
      setPhoneOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP code to new phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPhoneChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = phoneOtpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the 4-digit code');
      return;
    }

    const cleanNew = newPhone.replace(/\D/g, '');
    setIsSubmitting(true);
    try {
      const token = await verifyOtp(fullOtp);

      // Update profile with new phone and verification token
      const updatedUser = await profileApi.updateProfile({
        phone: cleanNew,
        verificationToken: token,
      });

      updateUser({ phone: updatedUser.phone });
      toast.success(`Admin recovery phone number successfully updated to +91 ${cleanNew}!`);
      cancelEdit();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update phone number');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDisplayPhone = user?.phone || '8089399521';

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. Official Work Email Section                            */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-card transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Official Work Email
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  Login Identifier
                </Badge>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5">
                {user?.email || 'admin@yox.com'}
              </p>
            </div>
          </div>

          {isSuperAdmin ? (
            activeEdit !== 'email' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelEdit();
                  setActiveEdit('email');
                  setNewEmail('');
                }}
                className="h-8.5 px-3.5 text-xs font-medium gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Change Email</span>
              </Button>
            )
          ) : (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60 shrink-0">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>Managed by Store Owner</span>
            </span>
          )}
        </div>

        {/* Inline Email Update Form */}
        {activeEdit === 'email' && (
          <div className="mt-4 pt-4 border-t border-border/60 bg-muted/20 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-primary" />
                Change Work Email Address
              </span>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {emailOtpStep === 'input' ? (
              <form onSubmit={handleStartEmailChange} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="new-admin-email" className="text-xs font-medium text-foreground">
                    New Work Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-admin-email"
                    type="email"
                    placeholder="e.g. owner@yox.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    disabled={isSubmitting || isOtpLoading}
                    className="h-9 text-xs bg-background"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    For security, a 4-digit verification code will be sent to your registered phone (+91 {currentDisplayPhone}).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || isOtpLoading || !newEmail.includes('@')}
                    className="h-8 px-4 text-xs font-medium gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
                  >
                    {isSubmitting || isOtpLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Phone OTP</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyEmailChange} className="space-y-3">
                <div className="text-xs text-muted-foreground text-center">
                  Enter the 4-digit code sent to your phone <strong className="text-foreground">+91 {currentDisplayPhone}</strong>
                </div>

                <div className="flex items-center justify-center gap-2.5 my-2">
                  {emailOtpDigits.map((digit, idx) => (
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
                        const next = [...emailOtpDigits];
                        next[idx] = char;
                        setEmailOtpDigits(next);
                        if (char && idx < 3) otpInputRefs.current[idx + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !emailOtpDigits[idx] && idx > 0) {
                          otpInputRefs.current[idx - 1]?.focus();
                        }
                      }}
                      className="w-10 h-10 text-center text-lg font-bold rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xs"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => setEmailOtpStep('input')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (emailCountdown > 0) return;
                      await retryOtp();
                      setEmailCountdown(30);
                      toast.success('New code sent via SMS');
                    }}
                    disabled={emailCountdown > 0}
                    className="text-primary font-medium hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {emailCountdown > 0 ? `Resend in ${emailCountdown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || emailOtpDigits.join('').length !== 4}
                    className="h-8 px-4 text-xs font-medium gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Confirm & Update Email</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* 2. Recovery Mobile Number Section                         */}
      {/* ========================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-card transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Admin Recovery Phone Number
                </span>
                <Badge variant="outline" className="text-[10px] font-semibold bg-primary/10 text-primary border-primary/20">
                  OTP Verified
                </Badge>
              </div>
              <p className="text-sm font-bold text-foreground mt-0.5 tracking-wide">
                +91 {currentDisplayPhone}
              </p>
            </div>
          </div>

          {isSuperAdmin ? (
            activeEdit !== 'phone' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  cancelEdit();
                  setActiveEdit('phone');
                  setNewPhone('');
                }}
                className="h-8.5 px-3.5 text-xs font-medium gap-1.5 cursor-pointer shrink-0"
              >
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Change Number</span>
              </Button>
            )
          ) : (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium bg-muted/40 px-2.5 py-1 rounded-lg border border-border/60 shrink-0">
              <Lock className="h-3 w-3 text-muted-foreground" />
              <span>Managed by Store Owner</span>
            </span>
          )}
        </div>

        {/* Inline Phone Update Form */}
        {activeEdit === 'phone' && (
          <div className="mt-4 pt-4 border-t border-border/60 bg-muted/20 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Change Admin Recovery Phone
              </span>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {phoneOtpStep === 'input' ? (
              <form onSubmit={handleStartPhoneChange} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="new-admin-phone" className="text-xs font-medium text-foreground">
                    New Mobile Number <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                      +91
                    </span>
                    <Input
                      id="new-admin-phone"
                      type="tel"
                      maxLength={10}
                      placeholder="8089399521"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={isSubmitting || isOtpLoading}
                      className="h-9 pl-12 text-xs bg-background font-medium tracking-wide"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    A verification OTP will be sent to this new phone number to confirm ownership.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || isOtpLoading || newPhone.length < 10}
                    className="h-8 px-4 text-xs font-medium gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
                  >
                    {isSubmitting || isOtpLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP to New Phone</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneChange} className="space-y-3">
                <div className="text-xs text-muted-foreground text-center">
                  Enter the 4-digit code sent to your new phone <strong className="text-foreground">+91 {newPhone}</strong>
                </div>

                <div className="flex items-center justify-center gap-2.5 my-2">
                  {phoneOtpDigits.map((digit, idx) => (
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
                        const next = [...phoneOtpDigits];
                        next[idx] = char;
                        setPhoneOtpDigits(next);
                        if (char && idx < 3) otpInputRefs.current[idx + 1]?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !phoneOtpDigits[idx] && idx > 0) {
                          otpInputRefs.current[idx - 1]?.focus();
                        }
                      }}
                      className="w-10 h-10 text-center text-lg font-bold rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xs"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpStep('input')}
                    className="text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (phoneCountdown > 0) return;
                      await retryOtp();
                      setPhoneCountdown(30);
                      toast.success('New code sent via SMS');
                    }}
                    disabled={phoneCountdown > 0}
                    className="text-primary font-medium hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {phoneCountdown > 0 ? `Resend in ${phoneCountdown}s` : 'Resend Code'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmitting || phoneOtpDigits.join('').length !== 4}
                    className="h-8 px-4 text-xs font-medium gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Verify & Save Phone</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="p-3.5 rounded-xl bg-muted/20 border border-border/60 text-xs text-muted-foreground flex items-center gap-2.5">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <span>
            Official work email and contact phone are company credentials managed by the store administrator. To update your work email or phone number, please contact your store owner.
          </span>
        </div>
      )}
    </div>
  );
}

