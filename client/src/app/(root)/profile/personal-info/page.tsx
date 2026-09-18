'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { profileApi, UpdateProfileDto } from '@/api/profile';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Edit3,
  Save,
  X,
  Loader2,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';

export default function PersonalInfoPage() {
  const { user, setUser } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  // OTP Verification States for Phone Number Change
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendOtp, retryOtp, verifyOtp, formatPhoneForMsg91 } = useMsg91Otp();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone ? user.phone.replace(/^(\+91|91)/, '') : '',
        email: user.email && !user.email.endsWith('@user.yox.internal') ? user.email : '',
      });
    }
  }, [user]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isPhoneChanged = () => {
    const currentLast10 = (user?.phone || '').replace(/\D/g, '').slice(-10);
    const newLast10 = formData.phone.replace(/\D/g, '').slice(-10);
    return formData.phone.trim() !== '' && newLast10 !== currentLast10;
  };

  /**
   * Main Save handler:
   * - If phone number was changed, triggers mobile OTP verification first.
   * - If only name/email changed, saves directly with server email uniqueness check.
   */
  const handleInitiateSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Check if phone number has changed
    if (isPhoneChanged()) {
      const cleanPhone = formData.phone.replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        toast.error('Please enter a valid 10-digit mobile number');
        return;
      }

      setIsLoading(true);
      try {
        await sendOtp(cleanPhone);
        toast.success(`Verification code sent to +91 ${cleanPhone}`);
        setOtpDigits(['', '', '', '']);
        setResendCountdown(30);
        setIsOtpModalOpen(true);
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to send OTP to new mobile number.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Phone was not changed: Save directly
    await executeSaveProfile();
  };

  /**
   * Direct Profile Update (without phone verification)
   */
  const executeSaveProfile = async (verificationToken?: string) => {
    setIsLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() ? formatPhoneForMsg91(formData.phone) : undefined,
        verificationToken,
      };

      const updatedUser = await profileApi.updateProfile(updateData);
      setUser(updatedUser);
      toast.success('Personal profile updated successfully!');
      setIsEditing(false);
      setIsOtpModalOpen(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update personal info.';
      toast.error(msg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Confirm OTP and complete profile update with verified phone
   */
  const handleConfirmPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      // 1. Verify OTP with MSG91 widget
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Execute profile update with verification token
      await executeSaveProfile(verificationToken);
    } catch (err: any) {
      toast.error(err?.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isVerifyingOtp) return;
    setIsVerifyingOtp(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
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

  const displayEmail =
    user?.email && !user.email.endsWith('@user.yox.internal') ? user.email : 'Not provided';
  const displayPhone = user?.phone ? `+91 ${user.phone.replace(/^(\+91|91)/, '')}` : 'Not linked';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your account credentials, primary contact email, and mobile phone number
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-[2px] transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit Information</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (user) {
                  setFormData({
                    fullName: user.fullName || '',
                    phone: user.phone ? user.phone.replace(/^(\+91|91)/, '') : '',
                    email: user.email && !user.email.endsWith('@user.yox.internal') ? user.email : '',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-medium rounded-[2px] transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleInitiateSave}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-medium rounded-[2px] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Account Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-[2px] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-[2px] bg-gray-100 text-gray-900 flex items-center justify-center font-semibold shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
              Account Name
            </span>
            <span className="text-xs font-medium text-gray-900 truncate block">
              {user?.fullName || 'Not provided'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[2px] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-[2px] bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-semibold shrink-0">
            <Mail size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
              Email Address
            </span>
            <span className="text-xs font-medium text-gray-900 truncate block">{displayEmail}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-[2px] p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-10 h-10 rounded-[2px] bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center font-semibold shrink-0">
            <Phone size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-0.5">
              Phone Contact
            </span>
            <span className="text-xs font-medium text-gray-900 truncate block">{displayPhone}</span>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleInitiateSave} className="space-y-6 pt-2">
        <div className="space-y-4 max-w-2xl">
          {/* Full Name */}
          <div>
            <label className="text-xs font-medium text-gray-800 block mb-1.5">Full Name *</label>
            <input
              type="text"
              name="fullName"
              required
              value={formData.fullName}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter your full name"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-[2px] bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50/70 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
          </div>

          {/* Email Address - Editable with Duplicate Check */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-1">
              <label className="text-xs font-medium text-gray-800">
                Email Address <span className="text-gray-400 font-normal">(Primary Login)</span>
              </label>
              {isEditing && (
                <span className="text-[11px] text-[#C09B7A] font-medium">
                  Checked for availability
                </span>
              )}
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="Enter your email address"
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-[2px] bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50/70 disabled:text-gray-500 disabled:cursor-not-allowed"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used for order receipts, tracking updates, and password recovery.
            </p>
          </div>

          {/* Phone Number - Editable with MSG91 OTP Verification */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5 gap-1">
              <label className="text-xs font-medium text-gray-800">Mobile Number</label>
              {isEditing && isPhoneChanged() && (
                <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-xs border border-amber-200">
                  * Requires SMS OTP Verification
                </span>
              )}
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center justify-center px-3 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                +91
              </span>
              <input
                type="tel"
                name="phone"
                maxLength={10}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })
                }
                disabled={!isEditing}
                placeholder="10-digit mobile number"
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 border border-gray-300 rounded-[2px] rounded-l-none bg-white focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50/70 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Used for one-click OTP login, shipping notifications, and delivery coordination.
            </p>
          </div>
        </div>

        {/* Security Assurance Banner */}
        <div className="p-4 bg-white border border-gray-200 rounded-[2px] flex items-start gap-3.5 text-xs text-gray-900 max-w-2xl shadow-2xs">
          <ShieldCheck size={18} className="text-black shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-900">Your Privacy & Data Protection</p>
            <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">
              YOX encrypts personal data using 256-bit security. Changing contact details requires
              identity and mobile verification to prevent unauthorized account access.
            </p>
          </div>
        </div>
      </form>

      {/* ─── Mobile OTP Verification Modal for Phone Change ───────────────── */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => !isVerifyingOtp && setIsOtpModalOpen(false)} />

          <div
            className="relative z-10 bg-white rounded-md max-w-[480px] w-full p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => !isVerifyingOtp && setIsOtpModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-gray-500 hover:text-black transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={22} />
            </button>

            <div className="mb-5 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#C09B7A]" size={26} />
                <h3 className="text-2xl font-normal text-gray-900">Verify Mobile Number</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                To link <span className="font-bold text-gray-900">+91 {formData.phone}</span> to your
                account, please enter the 4-digit verification code sent via SMS.
              </p>
            </div>

            <form onSubmit={handleConfirmPhoneOtp} className="space-y-5">
              {/* 4-Digit Segmented OTP Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                  Verification Code
                </label>
                <div className="flex items-center justify-center gap-3 sm:gap-4" onPaste={handleOtpPaste}>
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
                      className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend Section */}
              <div className="flex items-center justify-between text-xs pt-1 px-1">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="text-gray-500 hover:text-black underline transition-colors cursor-pointer"
                >
                  Edit Number
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
                      disabled={isVerifyingOtp}
                      className="flex items-center gap-1 font-bold text-black hover:text-[#C09B7A] underline transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw size={12} />
                      <span>Resend OTP</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  disabled={isVerifyingOtp}
                  className="px-4 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-semibold uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpDigits.join('').length !== 4}
                  className="px-6 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {isVerifyingOtp ? (
                    <span className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      <span>VERIFYING...</span>
                    </span>
                  ) : (
                    <span>CONFIRM & SAVE</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
