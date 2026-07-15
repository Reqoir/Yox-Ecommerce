import { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/20">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* We can add a top header here later if needed */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
