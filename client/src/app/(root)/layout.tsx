/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Navbar } from '@/components/layout/navbar';
import { CategoryNav } from '@/components/layout/category-nav';
import { Footer } from '@/components/layout/footer';
import { BottomNav } from '@/components/layout/bottom-nav';

interface RootLayoutProps {
  children: ReactNode;
}

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Suspense fallback={
        <div className="w-full h-20 bg-[#162b55] border-b border-white/10 flex items-center justify-between px-4 lg:w-[95%] mx-auto" />
      }>
        <Navbar />
      </Suspense>
      <CategoryNav />
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
