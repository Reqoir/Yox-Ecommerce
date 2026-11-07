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
      <div className="print:hidden">
        <TopBar />
      </div>
      <div className="print:hidden">
        <Suspense fallback={<div className="h-18 bg-white w-full border-b border-gray-200" />}>
          <Navbar />
        </Suspense>
      </div>
      <div className="print:hidden">
        <Suspense fallback={null}>
          <CategoryNav />
        </Suspense>
      </div>
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <div className="print:hidden">
        <Footer />
      </div>
      <div className="print:hidden">
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
      </div>
      <div className="print:hidden">
        <GuestLoginModal />
      </div>
      <div className="print:hidden">
        <AuthModal />
      </div>
    </div>
  );
}
