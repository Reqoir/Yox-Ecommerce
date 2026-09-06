import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminGuard } from '@/components/auth/AdminGuard';
import { RealtimeNotificationsProvider } from '@/components/providers/RealtimeNotificationsProvider';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      {/* Real-time SSE notification listener — plays chime + shows Swal on new events */}
      <RealtimeNotificationsProvider />
      <div className="fixed inset-0 flex overflow-hidden bg-muted/20">
        <AdminSidebar />
        <main className="flex-1 min-w-0 h-full overflow-y-auto">
          {/* We can add a top header here later if needed */}
          <div className="p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
