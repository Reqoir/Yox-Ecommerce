/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 * Add navigation, sidebar, or footer here when the respective modules are implemented.
 */

import type { ReactNode } from 'react';

import { TopBar } from '@/components/layout/top-bar';
import { Navbar } from '@/components/layout/navbar';

interface RootLayoutProps {
  children: ReactNode;
}

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* TODO: Add <Footer /> component when implemented */}
    </div>
  );
}
