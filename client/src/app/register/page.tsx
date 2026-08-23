'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShoppingBag, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerRegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuthData = useAuthStore((state) => state.setAuthData);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await authApi.register({ fullName, email, password, phone: phone || undefined });
      setAuthData(user, 'dummy_token'); // Since HttpOnly cookies are used, token in state is optional
      
      // Sync the offline cart with the user's account
      await useCartStore.getState().syncWithServer();

      toast.success('Account created successfully!');
      router.push('/'); // Redirect to the storefront
    } catch (error: any) {
      if (error.response?.data?.errors && error.response.data.errors.length > 0) {
        toast.error(error.response.data.errors[0].message);
      } else {
        toast.error(error.response?.data?.message || 'Failed to create account');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Visual */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white">
        <div className="flex items-center gap-2 font-bold text-2xl">
          <ShoppingBag className="w-8 h-8" />
          YOX
        </div>
        <div className="space-y-6 max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Start your journey with us today.
          </h1>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-zinc-400 w-5 h-5" />
              <span className="text-zinc-300">Fast and secure checkout</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-zinc-400 w-5 h-5" />
              <span className="text-zinc-300">Exclusive member discounts</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-zinc-400 w-5 h-5" />
              <span className="text-zinc-300">Early access to new collections</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-zinc-500">
          © {new Date().getFullYear()} YOX E-commerce. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex flex-col justify-center items-center p-8 bg-white dark:bg-black">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
            <p className="text-muted-foreground">
              Enter your details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long and contain at least one uppercase, lowercase, number, and special character.
              </p>
            </div>

            <Button type="submit" className="w-full h-12 text-base group mt-2" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
              {!isLoading && <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
