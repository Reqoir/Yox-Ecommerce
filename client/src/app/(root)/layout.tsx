/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 */

import { Suspense, type ReactNode } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Navbar } from '@/components/layout/navbar';
import { CategoryNav } from '@/components/layout/category-nav';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';
import { GuestLoginModal } from '@/components/features/auth/guest-login-modal';
import { AuthModal } from '@/components/features/auth/auth-modal';

interface RootLayoutProps {
  children: ReactNode;
}

export const dynamic = 'force-dynamic';

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Suspense fallback={<div className="h-18 bg-white w-full border-b border-gray-200" />}>
        <Navbar />
      </Suspense>
      <Suspense fallback={null}>
        <CategoryNav />
      </Suspense>
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      <GuestLoginModal />
      <AuthModal />
    </div>
  );
}
