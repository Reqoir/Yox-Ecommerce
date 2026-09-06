import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminHeader } from '@/components/layout/AdminHeader';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { RealtimeNotificationsProvider } from '@/components/providers/RealtimeNotificationsProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
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
