'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuthStore } from '@/store/useAdminAuthStore';
import { authApi } from '@/api/auth';
import { useMsg91Otp } from '@/hooks/useMsg91Otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Phone,
  KeyRound,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { navItems, hasNavPermission } from '@/components/layout/AdminSidebar';

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginUser = useAdminAuthStore((state) => state.loginUser);
  const { sendOtp, retryOtp, verifyOtp, isLoading: isOtpLoading } = useMsg91Otp();

  // Mode: 'login' or 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Suspension alert state
  const [isSuspendedNotice, setIsSuspendedNotice] = useState(false);
  const [suspensionMessage, setSuspensionMessage] = useState('');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password flow state: 'phone' -> 'otp' -> 'new-password'
  const [forgotStep, setForgotStep] = useState<'phone' | 'otp' | 'new-password'>('phone');
  const [forgotPhone, setForgotPhone] = useState('8089399521');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '']);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [verifiedResetToken, setVerifiedResetToken] = useState('');
  const [verifiedUserId, setVerifiedUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Detect suspension redirect or stored logout reason
  useEffect(() => {
    const isSuspendedParam = searchParams?.get('suspended') === 'true';
    const reasonInStorage = typeof window !== 'undefined' ? sessionStorage.getItem('yox_admin_logout_reason') : null;
    const storedMsg = typeof window !== 'undefined' ? sessionStorage.getItem('yox_admin_logout_message') : null;

    if (isSuspendedParam || reasonInStorage === 'suspended') {
      setIsSuspendedNotice(true);
      if (storedMsg) {
        setSuspensionMessage(storedMsg);
      }
      toast.error('Account Suspended: Your staff account has been suspended by the store administrator.', {
        duration: 8000,
        id: 'admin-suspended-notice',
      });
      // Clear from session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('yox_admin_logout_reason');
        sessionStorage.removeItem('yox_admin_logout_message');
      }
    }
  }, [searchParams]);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Handle standard password sign-in
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter both work email and password');
      return;
    }

    try {
      setIsLoading(true);
      const user = await authApi.login({ email: email.trim(), password });

      loginUser(user, user.accessToken);

      toast.success('Logged in successfully');

      // Determine destination based on user permissions
      const userPermissions = user.permissions || [];
      const firstAllowed = navItems.find((item) =>
        hasNavPermission(item.permission, user, userPermissions)
      );
      router.push(firstAllowed?.href || '/admin');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password';
      const isSuspended =
        message.toLowerCase().includes('suspended') ||
        message.toLowerCase().includes('deactivated') ||
        message.toLowerCase().includes('revoked');

      if (isSuspended) {
        setIsSuspendedNotice(true);
        setSuspensionMessage(message);
        toast.error('Account Suspended: ' + message, {
          duration: 8000,
          id: 'admin-login-suspended',
        });
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Send OTP to Admin Phone
  const handleSendForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = forgotPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit registered admin phone number');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(cleanPhone);
      toast.success(`Verification OTP sent to +91 ${cleanPhone}`);
      setForgotStep('otp');
      setResendCountdown(30);
      setOtpDigits(['', '', '', '']);
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send OTP. Please check the number and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isLoading || isOtpLoading) return;
    setIsLoading(true);
    try {
      await retryOtp();
      toast.success('New verification code sent via SMS');
      setResendCountdown(30);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 4) {
      toast.error('Please enter the complete 4-digit verification code');
      return;
    }

    const cleanPhone = forgotPhone.replace(/\D/g, '');
    setIsLoading(true);
    try {
      const verificationToken = await verifyOtp(fullOtp);

      const verifyRes = await authApi.verifyResetPasswordPhone({
        phone: cleanPhone,
        verificationToken,
      });

      const targetId = verifyRes.user?.id || verifyRes.accounts?.[0]?.id;
      if (!targetId || !verifyRes.resetToken) {
        throw new Error('No administrator account associated with this phone number');
      }

      setVerifiedResetToken(verifyRes.resetToken);
      setVerifiedUserId(targetId);
      setForgotStep('new-password');
      toast.success('Mobile number verified! Please set your new password.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Invalid or expired OTP code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set New Password
  const handleConfirmNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await authApi.confirmResetPasswordPhone({
        resetToken: verifiedResetToken,
        userId: verifiedUserId,
        newPassword,
      });

      toast.success('Admin password updated successfully! Please sign in with your new password.');
      setMode('login');
      setEmail('admin@yox.com');
      setPassword('');
      setForgotStep('phone');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Digit Input Handlers
  const handleOtpDigitChange = (index: number, val: string) => {
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    if (char && index < 3) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-muted/20 text-foreground selection:bg-primary/10">
      {/* Top Bar with Return to Store and Theme Toggle */}
      <header className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex items-center justify-between">


        <div className="flex items-center gap-2">
          <ThemeToggle collapsed={true} />
        </div>
      </header>

      {/* Main Center Card */}
      <main className="w-full flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px]">
          {/* Elevation Card */}
          <div className="rounded-2xl border border-border/80 bg-card p-7 sm:p-9 shadow-sm">
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center mb-6">
              <Link
                href="/"
                className="h-10 px-3 py-1.5 bg-white dark:bg-card rounded-xl shadow-xs border border-border/60 flex items-center justify-center mb-4 transition-transform hover:scale-[1.02] cursor-pointer"
                title="YOX Fashion Store"
              >
                <img
                  src="/images/logo.png"
                  alt="YOX"
                  className="h-5 w-auto max-w-[100px] object-contain"
                />
              </Link>

              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/5 text-primary text-[11px] font-semibold border border-primary/15 mb-2">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span>Admin Console</span>
              </div>

              <h1 className="text-xl font-bold tracking-tight text-foreground">
                {mode === 'login' ? 'Sign in to Dashboard' : 'Reset Admin Password'}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {mode === 'login'
                  ? 'Enter your administrative work credentials'
                  : 'Verify your registered phone number via SMS OTP'}
              </p>
            </div>

            {/* Suspended Account Alert Banner */}
            {isSuspendedNotice && (
              <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="p-1.5 rounded-lg bg-destructive/15 shrink-0 mt-0.5">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-destructive tracking-wide uppercase">Account Suspended</p>
                    <button
                      type="button"
                      onClick={() => setIsSuspendedNotice(false)}
                      className="text-destructive/70 hover:text-destructive p-0.5 cursor-pointer -mr-1 transition-colors"
                      title="Dismiss notice"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11.5px] text-destructive/90 leading-snug">
                    {suspensionMessage ||
                      'Your staff account has been suspended by the store administrator. Access has been revoked. Please contact your manager or store owner.'}
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* VIEW A: Standard Email + Password Sign-in                */}
            {/* ======================================================== */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Work Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                    Work Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@yox.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      className="h-10 pl-9.5 text-sm bg-background/50 rounded-lg border-border/80 focus-visible:bg-background"
                    />
                  </div>
                </div>

                {/* Password with Eye toggle */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setForgotStep('phone');
                        setOtpDigits(['', '', '', '']);
                      }}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      className="h-10 pl-9.5 pr-10 text-sm bg-background/50 rounded-lg border-border/80 focus-visible:bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 mt-1 rounded-lg bg-[#1A2E4C] hover:bg-[#132238] text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign in to Dashboard</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </form>
            ) : (
              /* ======================================================== */
              /* VIEW B: Admin Password Recovery via Mobile Number OTP    */
              /* ======================================================== */
              <div className="space-y-4">
                {/* Step 1: Phone input */}
                {forgotStep === 'phone' && (
                  <form onSubmit={handleSendForgotOtp} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-phone" className="text-xs font-semibold text-foreground">
                        Admin Registered Phone Number
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground text-xs font-semibold">
                          <Phone className="h-3.5 w-3.5" />
                          <span>+91</span>
                        </div>
                        <Input
                          id="admin-phone"
                          type="tel"
                          maxLength={10}
                          placeholder="8089399521"
                          value={forgotPhone}
                          onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                          required
                          disabled={isLoading || isOtpLoading}
                          className="h-10 pl-14 text-sm bg-background/50 rounded-lg border-border/80 focus-visible:bg-background font-medium tracking-wide"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        A 4-digit verification code will be sent to your phone via SMS.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || isOtpLoading || forgotPhone.length < 10}
                      className="w-full h-10 rounded-lg bg-[#1A2E4C] hover:bg-[#132238] text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading || isOtpLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Step 2: 4-Digit OTP Input */}
                {forgotStep === 'otp' && (
                  <form onSubmit={handleVerifyForgotOtp} className="space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Code sent to <strong className="text-foreground">+91 {forgotPhone}</strong>
                      </p>
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
                          className="w-12 h-12 text-center text-xl font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-xs"
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
                        onClick={handleResendOtp}
                        disabled={resendCountdown > 0 || isLoading || isOtpLoading}
                        className="text-primary font-medium hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
                      </button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || isOtpLoading || otpDigits.join('').length !== 4}
                      className="w-full h-10 rounded-lg bg-[#1A2E4C] hover:bg-[#132238] text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading || isOtpLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Proceed</span>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Step 3: Set New Password */}
                {forgotStep === 'new-password' && (
                  <form onSubmit={handleConfirmNewPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new-pass" className="text-xs font-semibold text-foreground">
                        New Password
                      </Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="new-pass"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="h-10 pl-9.5 pr-10 text-sm bg-background/50 rounded-lg border-border/80"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-pass" className="text-xs font-semibold text-foreground">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="confirm-pass"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="h-10 pl-9.5 text-sm bg-background/50 rounded-lg border-border/80"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                      className="w-full h-10 rounded-lg bg-[#1A2E4C] hover:bg-[#132238] text-white font-medium text-xs sm:text-sm shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving New Password...</span>
                        </>
                      ) : (
                        <>
                          <span>Save & Sign in</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}

                {/* Back to Login link */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotStep('phone');
                    }}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    <span>Back to Sign in</span>
                  </button>
                </div>
              </div>
            )}

            {/* Subtle access notice */}
            <div className="mt-6 pt-5 border-t border-border/60 text-center">
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Authorized staff access only. Password resets are verified securely via your registered mobile number.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full text-center py-4 px-6">
        <p className="text-[11px] text-muted-foreground/70">
          YOX Fashion Store &bull; Internal Administration &bull; &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AdminLoginContent />
    </Suspense>
  );
}
