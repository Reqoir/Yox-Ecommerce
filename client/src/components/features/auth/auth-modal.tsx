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
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  RotateCcw,
  Mail,
  Smartphone,
  KeyRound,
  Users,
  ChevronRight,
} from 'lucide-react';

export function AuthModal() {
  const router = useRouter();
  const { isOpen, mode, redirectUrl, closeModal, setMode } = useAuthModalStore();
  const { user, isAuthenticated, setAuthData } = useAuthStore();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ─── Sign In States ────────────────────────────────────────────────────────
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('otp');
  // Password login
  const [loginIdentifier, setLoginIdentifier] = useState(''); // Email or Mobile
  const [loginPassword, setLoginPassword] = useState('');
  // OTP login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtpStep, setLoginOtpStep] = useState<'phone' | 'otp' | 'select-account'>('phone');
  const [loginOtpDigits, setLoginOtpDigits] = useState<string[]>(['', '', '', '']);
  const [loginResendCountdown, setLoginResendCountdown] = useState(0);
  const loginOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Multi-account selection state
  const [candidateAccounts, setCandidateAccounts] = useState<CandidateAccount[]>([]);
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // ─── Sign Up States ────────────────────────────────────────────────────────
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('phone');
  // Common fields
  const [signupFullName, setSignupFullName] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  // Email signup fields
  const [signupEmail, setSignupEmail] = useState('');
  const [signupOptionalPhone, setSignupOptionalPhone] = useState('');
  // Phone signup fields
  const [signupPhone, setSignupPhone] = useState('');
  const [signupOptionalEmail, setSignupOptionalEmail] = useState('');
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');
  const [signupOtpDigits, setSignupOtpDigits] = useState<string[]>(['', '', '', '']);
  const [signupResendCountdown, setSignupResendCountdown] = useState(0);
  const signupOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── Forgot Password States (Mobile OTP Only with Multi-Account Safe Reset) ─
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'select-account' | 'new-password'>('phone');
  const [forgotOtpDigits, setForgotOtpDigits] = useState<string[]>(['', '', '', '']);
  const [forgotResetToken, setForgotResetToken] = useState<string | null>(null);
  const [forgotCandidateAccounts, setForgotCandidateAccounts] = useState<CandidateAccount[]>([]);
  const [selectedForgotAccount, setSelectedForgotAccount] = useState<CandidateAccount | null>(null);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotResendCountdown, setForgotResendCountdown] = useState(0);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const forgotOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── OTP Hook ──────────────────────────────────────────────────────────────
  const { sendOtp, retryOtp, verifyOtp, formatPhoneForMsg91 } = useMsg91Otp();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Countdown timer for Login OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loginResendCountdown > 0) {
      interval = setInterval(() => {
        setLoginResendCountdown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loginResendCountdown]);

  // Countdown timer for Sign Up OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (signupResendCountdown > 0) {
      interval = setInterval(() => {
        setSignupResendCountdown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [signupResendCountdown]);

  // Countdown timer for Forgot Password OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (forgotResendCountdown > 0) {
      interval = setInterval(() => {
        setForgotResendCountdown((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [forgotResendCountdown]);

  // Reset steps when mode changes or modal opens/closes
  useEffect(() => {
    setLoginOtpStep('phone');
    setLoginOtpDigits(['', '', '', '']);
    setLoginResendCountdown(0);
    setCandidateAccounts([]);
    setSelectionToken(null);
    setSelectedAccountId(null);

    setSignupStep('form');
    setSignupOtpDigits(['', '', '', '']);
    setSignupResendCountdown(0);

    setForgotStep('phone');
    setForgotOtpDigits(['', '', '', '']);
    setForgotResendCountdown(0);
    setForgotResetToken(null);
    setForgotCandidateAccounts([]);
    setSelectedForgotAccount(null);
    setForgotSuccess(false);
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  }, [mode, isOpen, loginMethod, signupMethod]);

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

  // ─── 1. SIGN IN: EMAIL OR PHONE + PASSWORD ─────────────────────────────────
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim()) {
      toast.error('Please enter your email address or mobile number');
      return;
    }
    if (!loginPassword) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const loggedUser = await authApi.login({
        email: loginIdentifier.trim(),
        password: loginPassword,
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
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Invalid email/mobile or password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 2. SIGN IN: SEND OTP TO PHONE ─────────────────────────────────────────
  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = loginPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setLoginOtpStep('otp');
      setLoginResendCountdown(30);
      setTimeout(() => {
        loginOtpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (loginResendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setLoginResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = loginOtpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP with MSG91 widget to obtain token
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Authenticate on server
      const res = await authApi.loginWithPhone({
        phone: formatPhoneForMsg91(loginPhone),
        verificationToken,
      });

      // If multiple accounts share this number, prompt user to choose their account
      if (res.multipleAccounts && res.accounts && res.selectionToken) {
        setCandidateAccounts(res.accounts);
        setSelectionToken(res.selectionToken);
        setLoginOtpStep('select-account');
        return;
      }

      if (res.user) {
        setAuthData(res.user, 'dummy_token');
        await useCartStore.getState().syncWithServer();

        toast.success(`Welcome back, ${res.user.fullName || 'Customer'}!`);
        closeModal();

        if (redirectUrl) {
          router.push(redirectUrl);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 429) return;
      if (error.response?.status === 404) {
        toast.error('No account found with this number. Please switch to Sign Up to create your account.');
        // Auto-switch to signup with this phone
        setSignupPhone(loginPhone);
        setSignupMethod('phone');
        setMode('register');
        return;
      }
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || error?.message || 'Failed to verify OTP');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // ─── 3. SIGN UP: WITH EMAIL (DIRECT, NO OTP REQUIRED) ──────────────────────
  const handleRegisterEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!signupEmail.trim() || !/^\S+@\S+\.\S+$/.test(signupEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (signupPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    const cleanOptionalPhone = signupOptionalPhone.replace(/\D/g, '');
    if (cleanOptionalPhone && cleanOptionalPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number or leave it blank');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await authApi.register({
        fullName: signupFullName.trim(),
        email: signupEmail.trim().toLowerCase(),
        password: signupPassword,
        phone: cleanOptionalPhone ? formatPhoneForMsg91(cleanOptionalPhone) : undefined,
      });

      setAuthData(newUser, 'dummy_token');
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
        toast.error(error.response?.data?.message || 'Failed to complete registration');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── 4. SIGN UP: WITH PHONE & OTP ──────────────────────────────────────────
  const handleSendSignupPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    const cleanPhone = signupPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    if (signupPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (signupOptionalEmail.trim() && !/^\S+@\S+\.\S+$/.test(signupOptionalEmail)) {
      toast.error('Please enter a valid email address or leave it blank');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setSignupStep('otp');
      setSignupResendCountdown(30);
      setTimeout(() => {
        signupOtpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignupPhoneOtp = async () => {
    if (signupResendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setSignupResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndRegisterPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = signupOtpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP with MSG91 widget
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Register user with server
      const newUser = await authApi.register({
        fullName: signupFullName.trim(),
        phone: formatPhoneForMsg91(signupPhone),
        password: signupPassword,
        email: signupOptionalEmail.trim() ? signupOptionalEmail.trim().toLowerCase() : undefined,
        verificationToken,
      });

      setAuthData(newUser, 'dummy_token');
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

  // ─── 5. FORGOT PASSWORD: WITH PHONE & OTP ─────────────────────────────────
  const handleSendForgotPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification code sent to +91 ${cleanPhone}`);
      setForgotStep('otp');
      setForgotResendCountdown(30);
      setTimeout(() => {
        forgotOtpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendForgotPhoneOtp = async () => {
    if (forgotResendCountdown > 0 || isLoading) return;
    setIsLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setForgotResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = forgotOtpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Verify OTP with MSG91 widget
      const verificationToken = await verifyOtp(fullOtp);

      // 2. Call backend to verify phone and retrieve candidate accounts
      const res = await authApi.verifyResetPasswordPhone({
        phone: formatPhoneForMsg91(forgotPhone),
        verificationToken,
      });

      setForgotResetToken(res.resetToken);

      if (res.multipleAccounts && res.accounts && res.accounts.length > 1) {
        setForgotCandidateAccounts(res.accounts);
        setSelectedForgotAccount(null);
        setForgotStep('select-account');
      } else if (res.user) {
        setSelectedForgotAccount(res.user);
        setForgotStep('new-password');
      } else if (res.accounts && res.accounts.length === 1) {
        setSelectedForgotAccount(res.accounts[0]);
        setForgotStep('new-password');
      } else {
        toast.error('No active account found for this mobile number');
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

  const handleSelectForgotAccount = (account: CandidateAccount) => {
    setSelectedForgotAccount(account);
    setForgotStep('new-password');
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotResetToken || !selectedForgotAccount) {
      toast.error('Session expired. Please verify your mobile number again.');
      setForgotStep('phone');
      return;
    }

    if (forgotNewPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/;
    if (!passwordRegex.test(forgotNewPassword)) {
      toast.error('Password must contain uppercase, lowercase, number, and special character');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('New password and confirm password do not match');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.confirmResetPasswordPhone({
        resetToken: forgotResetToken,
        userId: selectedForgotAccount.id,
        newPassword: forgotNewPassword,
      });

      toast.success(res.message || 'Password reset successfully!');
      setForgotSuccess(true);
    } catch (error: any) {
      if (error.response?.status === 429) return;
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || error?.message || 'Failed to reset password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─── OTP Digit Handlers Helper ─────────────────────────────────────────────
  const makeOtpChangeHandler =
    (digits: string[], setDigits: (d: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) =>
    (index: number, value: string) => {
      const digit = value.slice(-1).replace(/\D/g, '');
      const newDigits = [...digits];
      newDigits[index] = digit;
      setDigits(newDigits);

      if (digit && index < 3) {
        refs.current[index + 1]?.focus();
      }
    };

  const makeOtpKeyDownHandler =
    (digits: string[], refs: React.MutableRefObject<(HTMLInputElement | null)[]>) =>
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !digits[index] && index > 0) {
        refs.current[index - 1]?.focus();
      }
    };

  const makeOtpPasteHandler =
    (digits: string[], setDigits: (d: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>) =>
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
      if (!pasted) return;

      const newDigits = [...digits];
      for (let i = 0; i < 4; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);

      const focusIdx = Math.min(pasted.length, 3);
      refs.current[focusIdx]?.focus();
    };

  const isOtpStepActive =
    (mode === 'login' && loginMethod === 'otp' && loginOtpStep === 'otp') ||
    (mode === 'register' && signupMethod === 'phone' && signupStep === 'otp') ||
    (mode === 'forgot-password' && forgotStep === 'otp');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 selection:bg-black selection:text-white">
      {/* Backdrop click dismiss */}
      <div className="absolute inset-0" onClick={closeModal} />

      {/* Modal Card */}
      <div
        className="relative z-10 bg-white rounded-md max-w-[560px] w-full p-6 sm:p-10 lg:p-12 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 mx-3 sm:mx-auto max-h-[92vh] overflow-y-auto"
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
        <div className="mb-5 space-y-1.5">
          {mode === 'forgot-password' ? (
            forgotSuccess ? (
              <>
                <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                  Password Reset
                </h2>
                <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
                  Your password has been successfully reset
                </p>
              </>
            ) : forgotStep === 'select-account' ? (
              <>
                <div className="flex items-center gap-2">
                  <Users className="text-[#C09B7A]" size={26} />
                  <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                    Choose Account
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                  Multiple accounts are linked to <span className="font-semibold text-gray-900">+91 {forgotPhone}</span>. Select which account to reset:
                </p>
              </>
            ) : forgotStep === 'new-password' ? (
              <>
                <div className="flex items-center gap-2">
                  <KeyRound className="text-[#C09B7A]" size={26} />
                  <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                    Set New Password
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                  {selectedForgotAccount?.fullName
                    ? `Create a new password for ${selectedForgotAccount.fullName}`
                    : 'Create a strong new password for your account'}
                </p>
              </>
            ) : isOtpStepActive ? (
              <>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#C09B7A]" size={26} />
                  <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                    Verify Mobile
                  </h2>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                  We sent a 4-digit verification code to{' '}
                  <span className="font-semibold text-gray-900">+91 {forgotPhone}</span>
                  <button
                    type="button"
                    onClick={() => setForgotStep('phone')}
                    className="ml-2 text-black underline underline-offset-2 hover:text-[#C09B7A] font-medium cursor-pointer"
                  >
                    Edit
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                  Reset Password
                </h2>
                <p className="text-xs sm:text-[13px] text-gray-500 font-normal">
                  Enter your registered mobile number to receive an SMS verification code
                </p>
              </>
            )
          ) : mode === 'login' && loginOtpStep === 'select-account' ? (
            <>
              <div className="flex items-center gap-2">
                <Users className="text-[#C09B7A]" size={26} />
                <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                  Choose Account
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                Multiple accounts are linked to <span className="font-semibold text-gray-900">+91 {loginPhone}</span>. Select which account to sign in with:
              </p>
            </>
          ) : isOtpStepActive ? (
            <>
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[#C09B7A]" size={26} />
                <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                  Verify Mobile
                </h2>
              </div>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                We sent a 4-digit verification code to{' '}
                <span className="font-semibold text-gray-900">
                  +91 {mode === 'login' ? loginPhone : signupPhone}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'login') setLoginOtpStep('phone');
                    else setSignupStep('form');
                  }}
                  className="ml-2 text-black underline underline-offset-2 hover:text-[#C09B7A] font-medium cursor-pointer"
                >
                  Edit
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl sm:text-[34px] font-normal tracking-tight text-gray-900 leading-tight">
                {mode === 'login' ? 'Sign in' : 'Create Account'}
              </h2>
              <p className="text-xs sm:text-[13px] text-gray-500 font-normal pt-0.5">
                Enjoy the convenience of a single account across all participating brands
              </p>
            </>
          )}
        </div>

        {/* Primary Mode Switcher Tabs (Sign In / Sign Up) */}
        {mode !== 'forgot-password' && !isOtpStepActive && loginOtpStep !== 'select-account' && (
          <div className="flex items-center gap-6 mb-5 pb-2 border-b border-gray-100">
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 1. SIGN IN SECTION                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'login' && (
          <div className="space-y-4">
            {/* Dual Method Toggle: Password vs OTP */}
            {loginOtpStep === 'phone' && (
              <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-sm mb-4">
                <button
                  type="button"
                  onClick={() => setLoginMethod('otp')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                    loginMethod === 'otp'
                      ? 'bg-white text-black shadow-xs font-bold'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>Phone & OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('password')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                    loginMethod === 'password'
                      ? 'bg-white text-black shadow-xs font-bold'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <KeyRound size={14} />
                  <span>Password</span>
                </button>
              </div>
            )}

            {/* 1A. Password Sign In */}
            {loginMethod === 'password' && (
              <form onSubmit={handlePasswordLoginSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="modal-login-id" className="block text-xs font-bold text-gray-900">
                    Email or Mobile Number
                  </label>
                  <input
                    id="modal-login-id"
                    type="text"
                    required
                    placeholder="Enter your email address or mobile number"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

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
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
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

                <p className="text-[12px] text-gray-600 leading-snug pt-1">
                  By logging in you agree to our{' '}
                  <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                    Terms and Conditions
                  </span>
                </p>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    Don&apos;t have an account?{' '}
                    <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">
                      Sign Up
                    </span>
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
                      <span>SIGN IN</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 1B. Phone & OTP Sign In (Step 1: Enter Phone) */}
            {loginMethod === 'otp' && loginOtpStep === 'phone' && (
              <form onSubmit={handleSendLoginOtp} className="space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-login-phone" className="block text-xs font-bold text-gray-900">
                      Mobile Number
                    </label>
                    <span className="text-[11px] text-[#C09B7A] font-semibold">
                      Instant OTP Sign In
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center px-3 py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                      +91
                    </span>
                    <input
                      id="modal-login-phone"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 pt-1">
                    We will send a 4-digit verification code to this number. No password required.
                  </p>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    Don&apos;t have an account?{' '}
                    <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">
                      Sign Up
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || loginPhone.replace(/\D/g, '').length !== 10}
                    className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>SENDING OTP</span>
                      </span>
                    ) : (
                      <span>SEND OTP</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 1C. Phone & OTP Sign In (Step 2: Enter 4-Digit OTP) */}
            {loginMethod === 'otp' && loginOtpStep === 'otp' && (
              <form onSubmit={handleVerifyLoginOtp} className="space-y-5 pt-1">
                <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
                  <ShieldCheck className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    Enter the 4-digit verification code sent to{' '}
                    <span className="font-bold">+91 {loginPhone}</span> to log in.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                    Enter Verification Code
                  </label>
                  <div
                    className="flex items-center justify-center gap-3 sm:gap-4"
                    onPaste={makeOtpPasteHandler(loginOtpDigits, setLoginOtpDigits, loginOtpInputRefs)}
                  >
                    {loginOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          loginOtpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          makeOtpChangeHandler(
                            loginOtpDigits,
                            setLoginOtpDigits,
                            loginOtpInputRefs
                          )(idx, e.target.value)
                        }
                        onKeyDown={(e) =>
                          makeOtpKeyDownHandler(loginOtpDigits, loginOtpInputRefs)(idx, e)
                        }
                        className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP */}
                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setLoginOtpStep('phone')}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Change Number</span>
                  </button>

                  <div>
                    {loginResendCountdown > 0 ? (
                      <span className="text-gray-400 font-medium">
                        Resend code in 00:
                        {loginResendCountdown < 10
                          ? `0${loginResendCountdown}`
                          : loginResendCountdown}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendLoginOtp}
                        disabled={isLoading}
                        className="flex items-center gap-1 font-bold text-black hover:text-[#C09B7A] underline transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RotateCcw size={12} />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setLoginOtpStep('phone')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    ← Back to Phone
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || loginOtpDigits.join('').length !== 4}
                    className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>VERIFYING...</span>
                      </span>
                    ) : (
                      <span>SIGN IN</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 1D. Phone & OTP Sign In (Step 3: Choose Account from Multiple Accounts) */}
            {loginMethod === 'otp' && loginOtpStep === 'select-account' && (
              <div className="space-y-4 pt-1">
                <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-2.5">
                  <Users className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    Found <span className="font-bold">{candidateAccounts.length} accounts</span> registered with <span className="font-bold">+91 {loginPhone}</span>. Please click on your account to sign in:
                  </div>
                </div>

                <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden shadow-xs">
                  {candidateAccounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-all cursor-pointer group disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-[#C09B7A] transition-colors">
                          {acc.fullName ? acc.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-gray-900 group-hover:text-black">
                            {acc.fullName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {acc.maskedEmail || acc.email || 'Mobile Account'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isLoading && selectedAccountId === acc.id ? (
                          <Loader2 size={18} className="animate-spin text-black" />
                        ) : (
                          <ChevronRight
                            size={18}
                            className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all"
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginOtpStep('phone');
                      setCandidateAccounts([]);
                      setSelectionToken(null);
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer py-1"
                  >
                    ← Use a different mobile number
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 2. SIGN UP SECTION                                                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'register' && (
          <div className="space-y-4">
            {/* Dual Method Toggle: With Email vs With Phone & OTP */}
            {signupStep !== 'otp' && (
              <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-sm mb-4">
                <button
                  type="button"
                  onClick={() => setSignupMethod('phone')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                    signupMethod === 'phone'
                      ? 'bg-white text-black shadow-xs font-bold'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Smartphone size={14} />
                  <span>With Phone & OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSignupMethod('email')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xs transition-all cursor-pointer ${
                    signupMethod === 'email'
                      ? 'bg-white text-black shadow-xs font-bold'
                      : 'text-gray-500 hover:text-black'
                  }`}
                >
                  <Mail size={14} />
                  <span>With Email</span>
                </button>
              </div>
            )}

            {/* 2A. Sign Up with Email (Direct, no OTP) */}
            {signupMethod === 'email' && (
              <form onSubmit={handleRegisterEmailSubmit} className="space-y-3.5">
                <div className="space-y-1">
                  <label htmlFor="modal-reg-name-email" className="block text-xs font-bold text-gray-900">
                    Full Name
                  </label>
                  <input
                    id="modal-reg-name-email"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-reg-email" className="block text-xs font-bold text-gray-900">
                    Email Address
                  </label>
                  <input
                    id="modal-reg-email"
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-reg-password-email" className="block text-xs font-bold text-gray-900">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="modal-reg-password-email"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password (min. 8 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
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

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-reg-phone-opt" className="block text-xs font-bold text-gray-900">
                      Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <span className="inline-flex items-center justify-center px-3 py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 border border-r-0 border-gray-300 select-none">
                      +91
                    </span>
                    <input
                      id="modal-reg-phone-opt"
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={signupOptionalPhone}
                      onChange={(e) =>
                        setSignupOptionalPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                </div>

                <p className="text-[12px] text-gray-600 leading-snug pt-1">
                  By registering you agree to our{' '}
                  <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                    Terms and Conditions
                  </span>
                </p>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    Already have an account?{' '}
                    <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">
                      Sign In
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 sm:px-12 rounded-sm transition-all cursor-pointer disabled:opacity-60 shadow-xs active:scale-[0.99]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        <span>CREATING ACCOUNT</span>
                      </span>
                    ) : (
                      <span>CREATE ACCOUNT</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* 2B. Sign Up with Phone & OTP (Step 1: Enter Details) */}
            {signupMethod === 'phone' && signupStep === 'form' && (
              <form onSubmit={handleSendSignupPhoneOtp} className="space-y-3.5">
                <div className="space-y-1">
                  <label htmlFor="modal-reg-name-phone" className="block text-xs font-bold text-gray-900">
                    Full Name
                  </label>
                  <input
                    id="modal-reg-name-phone"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label htmlFor="modal-reg-phone-req" className="block text-xs font-bold text-gray-900">
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
                      id="modal-reg-phone-req"
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      value={signupPhone}
                      onChange={(e) =>
                        setSignupPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                      }
                      className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-reg-password-phone" className="block text-xs font-bold text-gray-900">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="modal-reg-password-phone"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Create a password (min. 8 characters)"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
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

                <div className="space-y-1">
                  <label htmlFor="modal-reg-email-opt" className="block text-xs font-bold text-gray-900">
                    Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    id="modal-reg-email-opt"
                    type="email"
                    placeholder="Enter email address (optional)"
                    value={signupOptionalEmail}
                    onChange={(e) => setSignupOptionalEmail(e.target.value)}
                    className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                  />
                </div>

                <p className="text-[12px] text-gray-600 leading-snug pt-1">
                  By continuing, an SMS OTP will be sent to verify your phone number in accordance with our{' '}
                  <span className="text-[#C09B7A] font-medium underline cursor-pointer hover:opacity-80">
                    Terms and Conditions
                  </span>
                </p>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    Already have an account?{' '}
                    <span className="font-bold text-black underline underline-offset-2 hover:text-[#C09B7A]">
                      Sign In
                    </span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || signupPhone.replace(/\D/g, '').length !== 10}
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

            {/* 2C. Sign Up with Phone & OTP (Step 2: 4-Digit OTP Input) */}
            {signupMethod === 'phone' && signupStep === 'otp' && (
              <form onSubmit={handleVerifyAndRegisterPhone} className="space-y-5 pt-1">
                <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-3">
                  <ShieldCheck className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                  <div className="text-xs text-amber-900 leading-relaxed">
                    Please enter the 4-digit OTP sent to{' '}
                    <span className="font-bold">+91 {signupPhone}</span> to activate your account.
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                    Enter Verification Code
                  </label>
                  <div
                    className="flex items-center justify-center gap-3 sm:gap-4"
                    onPaste={makeOtpPasteHandler(signupOtpDigits, setSignupOtpDigits, signupOtpInputRefs)}
                  >
                    {signupOtpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          signupOtpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) =>
                          makeOtpChangeHandler(
                            signupOtpDigits,
                            setSignupOtpDigits,
                            signupOtpInputRefs
                          )(idx, e.target.value)
                        }
                        onKeyDown={(e) =>
                          makeOtpKeyDownHandler(signupOtpDigits, signupOtpInputRefs)(idx, e)
                        }
                        className="w-14 sm:w-16 h-14 sm:h-16 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                        autoFocus={idx === 0}
                      />
                    ))}
                  </div>
                </div>

                {/* Resend OTP Section */}
                <div className="flex items-center justify-between text-xs pt-1 px-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep('form')}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-black transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Change Number</span>
                  </button>

                  <div>
                    {signupResendCountdown > 0 ? (
                      <span className="text-gray-400 font-medium">
                        Resend code in 00:
                        {signupResendCountdown < 10
                          ? `0${signupResendCountdown}`
                          : signupResendCountdown}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendSignupPhoneOtp}
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
                    onClick={() => setSignupStep('form')}
                    className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                  >
                    ← Back to Details
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading || signupOtpDigits.join('').length !== 4}
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
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* 3. FORGOT PASSWORD SECTION                                          */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {mode === 'forgot-password' && (
          <div className="space-y-4">
            {forgotSuccess ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 size={46} className="mx-auto text-emerald-600" />
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900 uppercase">Password Reset Successful</h3>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Your password for{' '}
                    <span className="font-semibold text-gray-800">
                      {selectedForgotAccount?.fullName || 'your account'}
                    </span>{' '}
                    has been updated. You can now sign in with your new credentials.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSuccess(false);
                    setMode('login');
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 rounded-none cursor-pointer mt-2 transition-all shadow-xs"
                >
                  RETURN TO SIGN IN
                </button>
              </div>
            ) : (
              <>
                {/* 3A. Step 1: Mobile Number Input */}
                {forgotStep === 'phone' && (
                  <form onSubmit={handleSendForgotPhoneOtp} className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="modal-forgot-phone" className="block text-xs font-bold text-gray-900">
                        Registered Mobile Number
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 text-xs sm:text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 font-medium">
                          +91
                        </span>
                        <input
                          id="modal-forgot-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          required
                          placeholder="10-digit mobile number"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="flex-1 px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-gray-400">
                        We will send a 4-digit verification code to reset your password.
                      </p>
                    </div>

                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black underline transition-colors cursor-pointer py-1"
                      >
                        Back to Sign In
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading || forgotPhone.replace(/\D/g, '').length !== 10}
                        className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span>SENDING...</span>
                          </span>
                        ) : (
                          <span>SEND OTP</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* 3B. Step 2: 4-Digit OTP Verification */}
                {forgotStep === 'otp' && (
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-3 rounded-sm flex items-start gap-2.5">
                      <ShieldCheck className="text-[#C09B7A] shrink-0 mt-0.5" size={16} />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        Verification code sent to{' '}
                        <span className="font-bold">+91 {forgotPhone}</span>.
                      </div>
                    </div>

                    {/* 4-Digit OTP Boxes */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider text-center">
                        Enter Verification Code
                      </label>
                      <div
                        className="flex items-center justify-center gap-3 sm:gap-4"
                        onPaste={makeOtpPasteHandler(forgotOtpDigits, setForgotOtpDigits, forgotOtpInputRefs)}
                      >
                        {forgotOtpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              forgotOtpInputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={1}
                            value={digit}
                            onChange={(e) =>
                              makeOtpChangeHandler(
                                forgotOtpDigits,
                                setForgotOtpDigits,
                                forgotOtpInputRefs
                              )(idx, e.target.value)
                            }
                            onKeyDown={(e) =>
                              makeOtpKeyDownHandler(forgotOtpDigits, forgotOtpInputRefs)(idx, e)
                            }
                            className="w-13 sm:w-15 h-13 sm:h-15 text-center text-xl sm:text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] transition-all shadow-xs"
                            autoFocus={idx === 0}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Resend OTP Row */}
                    <div className="flex items-center justify-between text-xs pt-0.5 px-1">
                      <button
                        type="button"
                        onClick={() => setForgotStep('phone')}
                        className="flex items-center gap-1 text-gray-500 hover:text-black transition-colors cursor-pointer"
                      >
                        <ArrowLeft size={13} />
                        <span>Change Number</span>
                      </button>

                      <div>
                        {forgotResendCountdown > 0 ? (
                          <span className="text-gray-400 font-medium">
                            Resend in 00:
                            {forgotResendCountdown < 10
                              ? `0${forgotResendCountdown}`
                              : forgotResendCountdown}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResendForgotPhoneOtp}
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
                        onClick={() => setForgotStep('phone')}
                        className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        disabled={isLoading || forgotOtpDigits.join('').length !== 4}
                        className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span>VERIFYING...</span>
                          </span>
                        ) : (
                          <span>VERIFY CODE</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* 3C. Step 3 (Only if Multiple Accounts): Choose Account */}
                {forgotStep === 'select-account' && (
                  <div className="space-y-4 pt-1">
                    <div className="bg-amber-50/70 border border-amber-200/60 p-3.5 rounded-sm flex items-start gap-2.5">
                      <Users className="text-[#C09B7A] shrink-0 mt-0.5" size={18} />
                      <div className="text-xs text-amber-900 leading-relaxed">
                        Found <span className="font-bold">{forgotCandidateAccounts.length} accounts</span> registered with <span className="font-bold">+91 {forgotPhone}</span>. Select which account you want to reset password for:
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden shadow-xs">
                      {forgotCandidateAccounts.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => handleSelectForgotAccount(acc)}
                          className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-sm shrink-0 group-hover:bg-[#C09B7A] transition-colors">
                              {acc.fullName ? acc.fullName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-black">
                                {acc.fullName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {acc.maskedEmail || acc.email || 'Mobile Account'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-400 group-hover:text-black hidden sm:inline">
                              Reset Password
                            </span>
                            <ChevronRight
                              size={18}
                              className="text-gray-400 group-hover:text-black group-hover:translate-x-0.5 transition-all"
                            />
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setForgotStep('phone')}
                        className="text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
                      >
                        ← Use another mobile number
                      </button>
                    </div>
                  </div>
                )}

                {/* 3D. Step 4: Set New Password for Selected Account */}
                {forgotStep === 'new-password' && (
                  <form onSubmit={handleConfirmResetPassword} className="space-y-4 pt-1">
                    {/* Selected Account Card */}
                    {selectedForgotAccount && (
                      <div className="bg-neutral-50 border border-gray-200 p-3 rounded-sm flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs shrink-0">
                          {selectedForgotAccount.fullName ? selectedForgotAccount.fullName[0].toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-gray-900 truncate">
                            {selectedForgotAccount.fullName}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {selectedForgotAccount.maskedEmail || selectedForgotAccount.email || 'Mobile Account'}
                          </div>
                        </div>
                        {forgotCandidateAccounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setForgotStep('select-account')}
                            className="text-[11px] font-semibold text-black hover:text-[#C09B7A] underline cursor-pointer shrink-0"
                          >
                            Switch Account
                          </button>
                        )}
                      </div>
                    )}

                    {/* New Password */}
                    <div className="space-y-1">
                      <label htmlFor="modal-forgot-new-pwd" className="block text-xs font-bold text-gray-900">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="modal-forgot-new-pwd"
                          type={showForgotNewPassword ? 'text' : 'password'}
                          required
                          placeholder="At least 8 characters"
                          value={forgotNewPassword}
                          onChange={(e) => setForgotNewPassword(e.target.value)}
                          className="w-full px-3.5 py-3 pr-10 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        >
                          {showForgotNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                      <label htmlFor="modal-forgot-confirm-pwd" className="block text-xs font-bold text-gray-900">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="modal-forgot-confirm-pwd"
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        placeholder="Re-enter your new password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-none focus:outline-none focus:border-[#C09B7A] focus:ring-1 focus:ring-[#C09B7A] text-gray-900 placeholder:text-gray-400 transition-all"
                      />
                      <p className="text-[11px] text-gray-400">
                        Must contain uppercase, lowercase, number, and special character.
                      </p>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          if (forgotCandidateAccounts.length > 1) {
                            setForgotStep('select-account');
                          } else {
                            setForgotStep('phone');
                          }
                        }}
                        className="order-2 sm:order-1 text-center sm:text-left text-xs font-medium text-gray-500 hover:text-black transition-colors cursor-pointer py-1"
                      >
                        ← Back
                      </button>

                      <button
                        type="submit"
                        disabled={
                          isLoading ||
                          forgotNewPassword.length < 8 ||
                          forgotNewPassword !== forgotConfirmPassword
                        }
                        className="order-1 sm:order-2 w-full sm:w-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm uppercase tracking-wider py-3.5 px-8 rounded-sm transition-all cursor-pointer disabled:opacity-50 shadow-xs active:scale-[0.99]"
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={16} className="animate-spin" />
                            <span>UPDATING...</span>
                          </span>
                        ) : (
                          <span>UPDATE PASSWORD</span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
