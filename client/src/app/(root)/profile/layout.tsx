'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User, MapPin, Package, Heart, Settings, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { ordersApi } from '@/lib/api/orders';
import { addressApi } from '@/api/addresses';
import { toast } from 'sonner';

const sidebarLinks = [
  { name: 'Personal Info', href: '/profile/personal-info', icon: User, description: 'Manage personal details & phone' },
  { name: 'My Orders', href: '/profile/orders', icon: Package, description: 'Track orders, returns & receipts' },
  { name: 'Saved Addresses', href: '/profile/addresses', icon: MapPin, description: 'Manage shipping & billing locations' },
  { name: 'My Favourites', href: '/favourites', icon: Heart, description: 'View your wishlist items' },
  { name: 'Account Settings', href: '/profile/settings', icon: Settings, description: 'Security & notification preferences' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logoutUser } = useAuthStore();

  const [orderCount, setOrderCount] = useState<number>(0);
  const [addressCount, setAddressCount] = useState<number>(0);

  useEffect(() => {
    if (user) {
      ordersApi.getMyOrders(1, 50).then((res) => setOrderCount(res.total || res.orders.length)).catch(() => {});
      addressApi.getAddresses().then((res) => setAddressCount(res.length)).catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    } finally {
      logoutUser();
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  const getPageTitle = () => {
    if (pathname.includes('/orders')) return 'My Orders';
    if (pathname.includes('/addresses')) return 'Saved Addresses';
    if (pathname.includes('/settings')) return 'Account Settings';
    return 'Personal Information';
  };

  return (
    <div className="w-full bg-[#F7F8F7] min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[95%] lg:w-[75%] max-w-7xl mx-auto space-y-6">
        
        {/* Top Breadcrumb & Banner */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>&gt;</span>
            <Link href="/profile" className="hover:text-gray-900 transition-colors">My Account</Link>
            <span>&gt;</span>
            <span className="text-gray-900 font-bold">{getPageTitle()}</span>
          </div>

          {/* User Profile Header Card */}
          <div className="relative overflow-hidden bg-[#1A2E4C] text-white rounded-2xl p-6 lg:p-8 shadow-md">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/3 -mb-10 w-48 h-48 bg-[#D2925D]/20 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                {/* User Initials Avatar */}
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white flex items-center justify-center font-bold text-2xl lg:text-3xl shadow-inner shrink-0">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl lg:text-2xl font-bold tracking-tight">
                      {user?.fullName || 'YOX Customer'}
                    </h1>
                    <span className="inline-flex items-center gap-1 bg-[#D2925D] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-2xs">
                      <ShieldCheck size={12} /> YOX VIP
                    </span>
                  </div>
                  <p className="text-xs text-blue-100 font-medium">{user?.email || 'customer@yox.com'}</p>
                  {user?.phone && <p className="text-xs text-blue-200/80 mt-0.5">{user.phone}</p>}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-8">
                <Link href="/profile/orders" className="bg-white/10 hover:bg-white/20 transition-all rounded-xl p-3 text-center min-w-[100px] border border-white/10">
                  <span className="text-lg font-bold block">{orderCount}</span>
                  <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">Orders</span>
                </Link>

                <Link href="/profile/addresses" className="bg-white/10 hover:bg-white/20 transition-all rounded-xl p-3 text-center min-w-[100px] border border-white/10">
                  <span className="text-lg font-bold block">{addressCount}</span>
                  <span className="text-[10px] text-blue-200 font-semibold uppercase tracking-wider">Addresses</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Navigation Sidebar */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs">
              <div className="px-4 py-2 border-b border-gray-100 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400">Account Menu</span>
              </div>

              <nav className="flex flex-col gap-1">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#1A2E4C] text-white shadow-sm font-semibold'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#D2925D]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <div className="truncate">
                          <p className="text-xs font-bold leading-tight">{link.name}</p>
                          <p className={`text-[10px] truncate ${isActive ? 'text-blue-200' : 'text-gray-400'}`}>
                            {link.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-gray-500'}`} />
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-gray-100" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-rose-500" />
                    <span>Sign Out Account</span>
                  </div>
                  <ChevronRight size={14} className="text-rose-300" />
                </button>
              </nav>
            </div>
          </aside>

          {/* Dynamic Page Content */}
          <main className="flex-1 w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 shadow-xs min-h-[520px]">
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
