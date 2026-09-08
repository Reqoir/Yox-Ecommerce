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
  { name: 'My Favourites', href: '/profile/favourites', icon: Heart, description: 'View your wishlist items' },
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
    if (pathname.includes('/favourites')) return 'My Favourites';
    if (pathname.includes('/personal-info')) return 'Personal Information';
    return 'Account Overview';
  };

  const isOverviewPage = pathname === '/profile';

  return (
    <div className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto space-y-6">
        
        {/* Top Breadcrumb & Banner */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:text-gray-900 transition-colors">Home</Link>
            <span>&gt;</span>
            <Link href="/profile" className="hover:text-gray-900 transition-colors">My Account</Link>
            {!isOverviewPage && (
              <>
                <span>&gt;</span>
                <span className="text-gray-900 font-bold">{getPageTitle()}</span>
              </>
            )}
          </div>

          {/* User Profile Header Card */}
          <div className="relative overflow-hidden bg-white text-gray-900 rounded-sm p-6 lg:p-8 shadow-2xs border border-gray-200/90">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
                      Welcome, {user?.fullName || 'User'}
                    </h1>
                    <span className="inline-flex items-center gap-1 bg-[#D2925D] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-sm tracking-wider shadow-2xs">
                      <ShieldCheck size={12} /> YOX VIP
                    </span>
                  </div>
                  {user?.phone && <p className="text-xs text-gray-500 mt-0.5">{user.phone}</p>}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8">
                <Link href="/profile/orders" className="bg-gray-50 hover:bg-gray-100 transition-all rounded-sm p-3 text-center min-w-[105px] border border-gray-200/80 shadow-2xs">
                  <span className="text-lg font-bold block text-gray-900">{orderCount}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Orders</span>
                </Link>

                <Link href="/profile/addresses" className="bg-gray-50 hover:bg-gray-100 transition-all rounded-sm p-3 text-center min-w-[105px] border border-gray-200/80 shadow-2xs">
                  <span className="text-lg font-bold block text-gray-900">{addressCount}</span>
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Addresses</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Navigation Sidebar (Hidden on mobile if on root overview page) */}
          <aside className={`w-full lg:w-72 shrink-0 ${isOverviewPage ? 'hidden lg:block' : ''}`}>
            <div className="bg-white border border-gray-200/90 rounded-sm p-3 shadow-2xs">
              <div className="px-3.5 py-2 border-b border-gray-100 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Account Menu</span>
              </div>

              <nav className="flex flex-col gap-1">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-sm transition-all duration-150 group ${
                        isActive
                          ? 'bg-black text-white shadow-xs'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <div className="truncate">
                          <p className="text-sm font-medium leading-tight">{link.name}</p>
                          <p className={`text-xs font-normal truncate mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                            {link.description}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-gray-500'}`} />
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-gray-100" />

                <button
                  suppressHydrationWarning
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-sm transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-5 h-5 text-rose-500" />
                    <span>Sign Out Account</span>
                  </div>
                  <ChevronRight size={16} className="text-rose-300" />
                </button>
              </nav>
            </div>
          </aside>

          {/* Dynamic Page Content */}
          <main className="flex-1 w-full">
            <div className="bg-white border border-gray-200/90 rounded-sm p-4 sm:p-6 lg:p-8 shadow-2xs min-h-[520px]">
              {!isOverviewPage && (
                <div className="lg:hidden mb-4 pb-3 border-b border-gray-100">
                  <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-black">
                    <span>← Back to Account Menu</span>
                  </Link>
                </div>
              )}
              {children}
            </div>
          </main>

        </div>
      </div>
    </div>
  );
}
