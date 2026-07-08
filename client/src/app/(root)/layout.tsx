/**
 * @file app/(root)/layout.tsx
 * @description Common layout shell for all public/authenticated pages.
 * Add navigation, sidebar, or footer here when the respective modules are implemented.
 */

import type { ReactNode } from 'react';

interface RootLayoutProps {
  children: ReactNode;
}

export default function CommonLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Add <Header /> component when implemented */}
      <main className="flex-1">{children}</main>
      {/* TODO: Add <Footer /> component when implemented */}
    </div>
  );
}
