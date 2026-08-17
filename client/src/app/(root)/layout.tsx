/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { CategoryNav } from '@/components/layout/category-nav';
import { Footer } from '@/components/layout/footer';

interface RootLayoutProps {
  children: ReactNode;
}

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={
        <div className="w-full h-16 bg-[#F7F8F7] border-b flex items-center justify-between px-4 lg:w-[95%] mx-auto" />
      }>
        <Navbar />
      </Suspense>
      <CategoryNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
