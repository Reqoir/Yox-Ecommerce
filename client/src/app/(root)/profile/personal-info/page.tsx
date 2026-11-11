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
  Edit2,
  X,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function PersonalInfoPage() {
  const { user, setUser } = useAuthStore();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
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
   * Save Profile Name and Email
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
      toast.success('Personal details updated successfully');
      setIsEditModalOpen(false);
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
      toast.success('Mobile number updated and verified successfully');
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
      {/* ─── Header (Matches Addresses Page pattern) ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-5 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Personal Information</h2>
          <p className="text-xs text-gray-500 mt-1">
            Manage your personal profile and account credentials
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (user) {
              setFormData({
                fullName: displayName || '',
                email: displayEmail || '',
              });
            }
            setIsEditModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-medium rounded-sm transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          <Edit2 size={15} />
          <span>Edit Profile</span>
        </button>
      </div>

      {/* ─── Profile Cards Grid (Matches Addresses Page 2-column pattern) ────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Primary Mobile Login (Styled like Default Address Card) */}
        <div className="relative p-5 rounded-sm border transition-all duration-200 flex flex-col justify-between border-[#1A2E4C] bg-blue-50/20 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-[#1A2E4C]" />
                <span className="font-semibold text-sm text-gray-900">Mobile Number</span>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 bg-[#1A2E4C] text-white rounded-sm uppercase tracking-wider shadow-2xs">
                <CheckCircle2 size={12} /> Primary
              </span>
            </div>

            <p className="text-sm font-semibold text-gray-900 font-mono tracking-wide mt-1">
              {displayPhone}
            </p>

            <div className="text-xs text-gray-600 leading-relaxed mt-2 space-y-0.5">
              <p>Primary sign-in credential with instant 1-tap OTP verification.</p>
              <p>Used for shipping notifications, delivery coordination & returns.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => {
                setPhoneStep('input');
                setNewPhoneNumber('');
                setIsPhoneModalOpen(true);
              }}
              className="flex items-center gap-1.5 font-medium text-[#1A2E4C] hover:underline cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Change Number</span>
            </button>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
              <CheckCircle2 size={12} /> Verified
            </span>
          </div>
        </div>

        {/* Card 2: Personal Details (Name & Email) */}
        <div className="relative p-5 rounded-sm border transition-all duration-200 flex flex-col justify-between border-gray-200 bg-white hover:border-gray-300">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <User size={16} className="text-gray-700" />
                <span className="font-semibold text-sm text-gray-900">Personal Details</span>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-sm">
                Profile Info
              </span>
            </div>

            <div className="text-xs text-gray-600 leading-relaxed space-y-2 mt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Full Name
                </span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {displayName || (
                    <span className="text-gray-400 font-normal italic">Not provided yet</span>
                  )}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Email Address (Optional)
                </span>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                  {displayEmail || (
                    <span className="text-gray-400 font-normal italic">Not added (used for invoices)</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => {
                if (user) {
                  setFormData({
                    fullName: displayName || '',
                    email: displayEmail || '',
                  });
                }
                setIsEditModalOpen(true);
              }}
              className="flex items-center gap-1.5 font-medium text-[#1A2E4C] hover:underline cursor-pointer"
            >
              <Edit2 size={13} />
              <span>Edit Details</span>
            </button>

            <span className="text-[11px] text-gray-400">
              Invoices & Delivery Slips
            </span>
          </div>
        </div>
      </div>

      {/* ─── Security Notice Box (Matches Address Empty/Info Box Style) ──────── */}
      <div className="p-4 rounded-sm border border-gray-200 bg-gray-50/50 flex items-start gap-3">
        <ShieldCheck size={18} className="text-[#1A2E4C] shrink-0 mt-0.5" />
        <div className="text-xs text-gray-600 leading-relaxed">
          <span className="font-semibold text-gray-900">Phone-First Account Security:</span> Your mobile number is your primary credential for fast, passwordless 1-tap OTP sign-in and real-time delivery notifications across all devices.
        </div>
      </div>

      {/* ─── MODAL: EDIT PERSONAL DETAILS (Matches AddressForm style) ────────── */}
      {isEditModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xl p-6 sm:p-7 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black p-1 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="mb-5 pb-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                Edit Personal Details
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Update your name and email address for order receipts
              </p>
            </div>

            <form onSubmit={handleSaveDetails} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 block">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-gray-500">
                  Displayed on delivery slips and customer correspondence.
                </p>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-700">
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
                  className="w-full px-3.5 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] focus:border-transparent transition-all"
                />
                <p className="text-[11px] text-gray-500">
                  Used for digital tax invoices, dispatch updates, and return summaries.
                </p>
              </div>

              {/* Actions (Matches AddressForm footer style) */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-medium rounded-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
                >
                  {isLoading && <Loader2 size={13} className="animate-spin" />}
                  <span>{isLoading ? 'Saving...' : 'Save Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CHANGE MOBILE NUMBER WITH OTP ───────────────────────────── */}
      {isPhoneModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsPhoneModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-sm border border-gray-200 shadow-xl p-6 sm:p-7 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPhoneModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-black p-1 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="mb-5 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone size={18} className="text-[#1A2E4C]" />
                <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                  {phoneStep === 'input' ? 'Change Mobile Number' : 'Verify Mobile Number'}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {phoneStep === 'input'
                  ? 'Enter your new 10-digit mobile number to receive a verification code.'
                  : `Enter the 4-digit verification code sent to +91 ${newPhoneNumber}`}
              </p>
            </div>

            {phoneStep === 'input' ? (
              <form onSubmit={handleSendPhoneChangeOtp} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 block">
                    New Mobile Number
                  </label>
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center px-3.5 py-2.5 text-xs font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-200 rounded-l-sm select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      autoFocus
                      maxLength={10}
                      placeholder="10-digit number"
                      value={newPhoneNumber}
                      onChange={(e) =>
                        setNewPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-r-sm focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] focus:border-transparent text-gray-900 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPhoneLoading || newPhoneNumber.length !== 10}
                    className="flex-1 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-medium rounded-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    {isPhoneLoading && <Loader2 size={13} className="animate-spin" />}
                    <span>{isPhoneLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneChangeOtp} className="space-y-4">
                <div className="space-y-2 text-center py-2">
                  <label className="text-xs font-medium text-gray-700 block">
                    Enter 4-Digit Code
                  </label>
                  <div className="flex justify-center gap-2.5">
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
                        className="w-12 h-12 text-center text-lg font-bold border border-gray-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] focus:border-transparent text-gray-900 transition-all shadow-2xs"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => setPhoneStep('input')}
                    className="text-gray-500 hover:text-black font-medium"
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendPhoneOtp}
                    disabled={resendCountdown > 0 || isPhoneLoading}
                    className="text-[#1A2E4C] font-semibold hover:underline disabled:text-gray-400 disabled:no-underline cursor-pointer"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </button>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsPhoneModalOpen(false)}
                    className="flex-1 py-2.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-sm hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPhoneLoading || otpDigits.join('').length !== 4}
                    className="flex-1 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-medium rounded-sm transition-colors shadow-2xs disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    {isPhoneLoading && <Loader2 size={13} className="animate-spin" />}
                    <span>{isPhoneLoading ? 'Verifying...' : 'Verify & Update'}</span>
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
