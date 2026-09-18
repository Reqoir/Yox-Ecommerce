'use client';

import React, { useState, useMemo } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles,
  Lock,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';

interface Props {
  onSuccess?: () => void;
  className?: string;
  isModal?: boolean;
}

export function AdminChangePasswordCard({ onSuccess, className = '', isModal = false }: Props) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedGenerated, setCopiedGenerated] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    // Ensure at least one of each
    generated += uppercase[Math.floor(Math.random() * uppercase.length)];
    generated += lowercase[Math.floor(Math.random() * lowercase.length)];
    generated += numbers[Math.floor(Math.random() * numbers.length)];
    generated += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 0; i < 12; i++) {
      generated += all[Math.floor(Math.random() * all.length)];
    }

    // Shuffle characters
    const shuffled = generated
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');

    setNewPassword(shuffled);
    setConfirmPassword(shuffled);
    setShowNewPassword(true);
    setShowConfirmPassword(true);
    setErrorMsg(null);

    // Copy to clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shuffled).then(() => {
        setCopiedGenerated(true);
        setTimeout(() => setCopiedGenerated(false), 2000);
      });
    }

    toast.success('Generated strong password and copied to clipboard!');
  };

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

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`}>
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs animate-in fade-in-50">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Current Password */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground flex items-center justify-between">
          <span>Current Password</span>
          <span className="text-[10px] text-muted-foreground font-normal">Required for identity verification</span>
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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
            <Sparkles size={12} className="text-amber-500" />
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
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
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}

        <Button
          type="submit"
          disabled={!isFormValid || isSubmitting}
          className="gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
