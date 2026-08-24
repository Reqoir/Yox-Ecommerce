'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';

import { Suspense } from 'react';

// ... (other imports)
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Missing reset token. Please request a new link.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.resetPassword(data.password, token);
      setIsSuccess(true);
      toast.success(response.message || 'Password reset successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid or expired token');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !isSuccess) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="w-full max-w-md bg-background rounded-2xl border shadow-sm p-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight mb-2">Invalid Link</h1>
          <p className="text-muted-foreground mb-6">
            The password reset link is invalid or missing the token. Please request a new one.
          </p>
          <Button onClick={() => window.location.href = '/forgot-password'} className="w-full">
            Request New Link
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md bg-background rounded-2xl border shadow-sm p-8">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <CheckCircle2 className="w-16 h-16 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Password Reset Successfully</h1>
            <p className="text-muted-foreground">
              Your password has been successfully updated. You can now log in with your new password.
            </p>
            <Button onClick={() => window.location.href = '/login'} className="w-full mt-6 flex items-center justify-center gap-2">
              Continue to Login <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">Create New Password</h1>
              <p className="text-sm text-muted-foreground">
                Please enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...register('password')}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
