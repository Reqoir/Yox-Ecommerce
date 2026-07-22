/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 */

import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Navbar } from '@/components/layout/navbar';

interface RootLayoutProps {
  children: ReactNode;
}

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Suspense fallback={
        <div className="w-full h-16 bg-[#F7F8F7] border-b flex items-center justify-between px-4 lg:w-[75%] mx-auto" />
      }>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
    </div>
  );
}
