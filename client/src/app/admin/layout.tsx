'use client';

import { ReactNode, useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { RealtimeNotificationsProvider } from '@/components/providers/RealtimeNotificationsProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Prevent document/window-level scrolling so fixed layout headers never get shifted or pushed off-screen
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overflow = originalBodyOverflow;
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <AdminGuard>
      {/* Real-time SSE notification listener */}
      <RealtimeNotificationsProvider />
      <div className="fixed inset-0 flex overflow-hidden bg-muted/20">
        <AdminSidebar />
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
          <AdminHeader />
          <main className="flex-1 overflow-y-auto">
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
