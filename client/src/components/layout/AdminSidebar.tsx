'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Tag, Settings, LogOut, Shield, Users } from 'lucide-react';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/user', icon: Users },
  { name: 'Products', href: '/admin/product', icon: Package },
  { name: 'Brands', href: '/admin/brand', icon: Tag },
  { name: 'Roles', href: '/admin/role', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const logoutUser = useAuthStore((state) => state.logoutUser);

  const handleLogout = async () => {
    try {
      await authApi.logout();
      logoutUser();
      toast.success('Logged out successfully');
      router.push('/admin-login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col transition-all">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold tracking-tight text-primary">YOX Admin</h2>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/admin');
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary text-primary-foreground shadow-sm' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <button 
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
