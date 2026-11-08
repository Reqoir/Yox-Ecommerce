'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import { profileApi, UpdateProfileDto } from '@/api/profile';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import {
  User,
  Mail,
  Smartphone,
  CheckCircle2,
  Edit3,
  Save,
  X,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Info,
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
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'otp'>('input');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { sendOtp, retryOtp, verifyOtp, formatPhoneForMsg91 } = useMsg91Otp();

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName && user.fullName.toLowerCase() !== 'customer' ? user.fullName : '',
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

  /**
   * Save Profile Name and Email (No password or mandatory email required)
   */
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateProfileDto = {
        fullName: formData.fullName.trim() || undefined,
        email: formData.email.trim(),
      };

      const updatedUser = await profileApi.updateProfile(updateData);
      setUser(updatedUser);
      toast.success('Profile details saved successfully!');
      setIsEditing(false);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to update personal details.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Phone Change Step 1: Send OTP to new mobile number
   */
  const handleSendPhoneChangeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPhoneNumber.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    const currentClean = (user?.phone || '').replace(/\D/g, '').slice(-10);
    if (cleanPhone === currentClean) {
      toast.error('This is already your current mobile number');
      return;
    }

    setIsPhoneLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setPhoneStep('otp');
      setOtpDigits(['', '', '', '']);
      setResendCountdown(30);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP to new mobile number.');
    } finally {
      setIsPhoneLoading(false);
    }
  };

  /**
   * Phone Change Step 2: Verify OTP and update phone in DB
   */
  const handleVerifyPhoneChangeOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsPhoneLoading(true);
    try {
      const verificationToken = await verifyOtp(fullOtp);
      const cleanPhone = newPhoneNumber.replace(/\D/g, '').slice(-10);

      const updatedUser = await profileApi.updateProfile({
        phone: formatPhoneForMsg91(cleanPhone),
        verificationToken,
      });

      setUser(updatedUser);
      toast.success('Mobile number updated and verified successfully!');
      setIsPhoneModalOpen(false);
      setNewPhoneNumber('');
      setPhoneStep('input');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleResendPhoneOtp = async () => {
    if (resendCountdown > 0 || isPhoneLoading) return;
    setIsPhoneLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsPhoneLoading(false);
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

  const rawPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
  const displayPhone = rawPhone ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : 'Not linked';
  const displayEmail = user?.email && !user.email.endsWith('@user.yox.internal') ? user.email : null;
  const displayName = user?.fullName && user.fullName.toLowerCase() !== 'customer' ? user.fullName : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-1">
            Your personal profile and contact preferences for orders and deliveries
          </p>
        </div>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                if (user) {
                  setFormData({
                    fullName: displayName || '',
                    phone: rawPhone,
                    email: displayEmail || '',
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-xs transition-colors cursor-pointer"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDetails}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modern Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Verified Mobile Number (Primary) */}
        <div className="bg-white border-2 border-[#C09B7A]/40 rounded-sm p-4 relative flex flex-col justify-between shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#C09B7A] uppercase tracking-wider">
                Primary Account Login
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-xs border border-emerald-200/60">
                <CheckCircle2 size={11} className="text-emerald-600" /> VERIFIED
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-sm bg-neutral-900 text-white flex items-center justify-center shrink-0">
                <Smartphone size={18} className="text-[#C09B7A]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 tracking-wide font-mono">
                  {displayPhone}
                </p>
                <p className="text-[11px] text-gray-400">Instant OTP Access</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPhoneStep('input');
              setNewPhoneNumber('');
              setIsPhoneModalOpen(true);
            }}
            className="mt-4 text-xs font-bold text-black hover:text-[#C09B7A] underline underline-offset-2 text-left cursor-pointer transition-colors"
          >
            Change Mobile Number →
          </button>
        </div>

        {/* Card 2: Full Name */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Full Name
            </span>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-sm bg-gray-100 text-gray-800 flex items-center justify-center shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {displayName || 'Not provided yet'}
                </p>
                <p className="text-[11px] text-gray-400">Used for greetings & labels</p>
              </div>
            </div>
          </div>

          {!displayName && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-4 text-xs font-bold text-black hover:text-[#C09B7A] underline underline-offset-2 text-left cursor-pointer transition-colors"
            >
              + Add Full Name
            </button>
          )}
        </div>

        {/* Card 3: Email Address (Optional) */}
        <div className="bg-white border border-gray-200 rounded-sm p-4 flex flex-col justify-between shadow-2xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Email Address
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Optional</span>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-sm bg-gray-100 text-gray-800 flex items-center justify-center shrink-0">
                <Mail size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {displayEmail || 'Not added'}
                </p>
                <p className="text-[11px] text-gray-400">For tax invoices & receipts</p>
              </div>
            </div>
          </div>

          {!displayEmail && !isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="mt-4 text-xs font-bold text-black hover:text-[#C09B7A] underline underline-offset-2 text-left cursor-pointer transition-colors"
            >
              + Add Email for Receipts
            </button>
          )}
        </div>
      </div>

      {/* Editing Form */}
      {isEditing && (
        <form onSubmit={handleSaveDetails} className="bg-gray-50/70 border border-gray-200 rounded-sm p-5 sm:p-6 space-y-4 max-w-xl animate-in fade-in duration-200">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200/70">
            <Edit3 size={16} className="text-[#C09B7A]" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Edit Account Details
            </h3>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-800 block">
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xs bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
            <p className="text-[11px] text-gray-500">
              Your name will appear on package shipping slips and order receipts.
            </p>
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-800">
                Email Address
              </label>
              <span className="text-[11px] text-gray-400">Optional</span>
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. john@example.com"
              className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-300 rounded-xs bg-white focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
            />
            <p className="text-[11px] text-gray-500">
              Provide your email if you wish to receive digital GST invoices and tracking emails.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black border border-gray-300 bg-white rounded-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-black hover:bg-neutral-800 rounded-xs transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* Info notice about modern phone login */}
      <div className="bg-neutral-50 border border-neutral-200/80 rounded-sm p-4 flex items-start gap-3">
        <Info size={16} className="text-[#C09B7A] shrink-0 mt-0.5" />
        <div className="text-xs text-neutral-600 leading-relaxed">
          <span className="font-semibold text-neutral-900">Phone-First Account Security:</span> Your mobile number is your primary security credential. When signing in from any device, we send an instant SMS OTP. No passwords to remember or reset!
        </div>
      </div>

      {/* ─── MODAL: CHANGE MOBILE NUMBER WITH OTP ───────────────────────────── */}
      {isPhoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-md max-w-[460px] w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative">
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute top-5 right-5 p-1 text-gray-400 hover:text-black cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="mb-5 space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="text-[#C09B7A]" size={22} />
                <h3 className="text-xl font-bold text-gray-900">
                  {phoneStep === 'input' ? 'Change Mobile Number' : 'Verify New Number'}
                </h3>
              </div>
              <p className="text-xs text-gray-500">
                {phoneStep === 'input'
                  ? 'Enter your new 10-digit mobile number. We will send an SMS OTP to verify ownership.'
                  : `Enter the 4-digit verification code sent to +91 ${newPhoneNumber}`}
              </p>
            </div>

            {phoneStep === 'input' ? (
              <form onSubmit={handleSendPhoneChangeOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-900 uppercase tracking-wider block">
                    New Mobile Number
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center px-3 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      placeholder="10-digit number"
                      value={newPhoneNumber}
                      onChange={(e) => setNewPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-300 rounded-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPhoneLoading || newPhoneNumber.length !== 10}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPhoneLoading ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneChangeOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                    Enter 4-Digit Code
                  </label>
                  <div className="flex items-center justify-center gap-3">
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
                        className="w-12 h-12 text-center text-xl font-bold text-gray-900 border border-gray-300 rounded-none focus:border-[#C09B7A] focus:outline-none"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="text-gray-500 hover:text-black underline cursor-pointer"
                  >
                    Change Number
                  </button>

                  <div>
                    {resendCountdown > 0 ? (
                      <span className="text-gray-400">Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendPhoneOtp}
                        disabled={isPhoneLoading}
                        className="font-bold text-black hover:text-[#C09B7A] underline cursor-pointer"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-black border border-gray-300 rounded-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPhoneLoading || otpDigits.join('').length !== 4}
                    className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded-xs disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPhoneLoading ? 'Verifying...' : 'Verify & Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
