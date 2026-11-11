'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  Heart,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Mail,
  Smartphone,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const sidebarLinks = [
  { name: 'Personal Info', href: '/profile/personal-info', icon: User, description: 'Manage name, phone & email' },
  { name: 'My Orders', href: '/profile/orders', icon: Package, description: 'Track orders, returns & invoices' },
  { name: 'Saved Addresses', href: '/profile/addresses', icon: MapPin, description: 'Shipping & billing locations' },
  { name: 'My Favourites', href: '/profile/favourites', icon: Heart, description: 'Saved wishlist garments' },
  { name: 'Account Settings', href: '/profile/settings', icon: Settings, description: 'Security & notification preferences' },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logoutUser } = useAuthStore();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/profile');
      router.replace(`/login?callbackUrl=${returnUrl}`);
    }
  }, [mounted, isAuthenticated, pathname, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignored
    } finally {
      logoutUser();
      toast.success('Signed out successfully');
      router.push('/');
    }
  };

  // Prevent rendering protected subcomponents or making unauthenticated API calls
  if (!mounted || !isAuthenticated) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-neutral-50/60 py-20">
        <Loader2 className="w-7 h-7 animate-spin text-gray-800" />
        <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          Verifying session...
        </span>
      </div>
    );
  }

  const isOverviewPage = pathname === '/profile';

  const rawPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);
  const formattedPhone = rawPhone ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}` : null;
  const hasRealEmail = user?.email && !user.email.endsWith('@user.yox.internal') && user.email.includes('@');

  // Format clean display values - prioritize the user's name
  const rawName = (user?.fullName || '').trim();
  const displayName = rawName && rawName.toLowerCase() !== 'customer'
    ? rawName
    : rawName || (hasRealEmail ? user?.email?.split('@')[0] : '') || (formattedPhone ? `User (${formattedPhone})` : 'User');
  const initial = displayName ? displayName.charAt(0).toUpperCase() : 'U';

  return (
    <div className="w-full bg-neutral-50/60 min-h-screen pb-16 pt-4 lg:pt-8 selection:bg-black selection:text-white">
      <div className="w-[98%] max-w-[1400px] mx-auto space-y-6">
        
        {/* User Profile Editorial Header Card */}
        <div className="relative overflow-hidden bg-white text-gray-900 rounded-sm p-6 sm:p-7 shadow-xs border border-gray-200/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Monogram Avatar */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black text-white flex items-center justify-center font-bold text-xl sm:text-2xl tracking-wider shrink-0 border-2 border-[#C09B7A]/50 shadow-xs">
                {initial}
              </div>

              {/* Name & Contact Badges */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                    {displayName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 pt-0.5">
                  {formattedPhone && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-gray-700">
                      <Smartphone size={13} className="text-[#C09B7A]" />
                      <span>{formattedPhone}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-xs font-semibold">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    </span>
                  )}

                  {hasRealEmail && (
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <Mail size={13} className="text-gray-400" />
                      <span>{user?.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Overview Badges */}
            <div className="flex items-center gap-2 self-start sm:self-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
              <Link
                href="/profile/orders"
                className="px-3.5 py-2 text-xs font-semibold bg-gray-50 hover:bg-black hover:text-white text-gray-800 border border-gray-200 rounded-sm transition-all uppercase tracking-wider"
              >
                Track Orders
              </Link>
              <Link
                href="/profile/favourites"
                className="px-3.5 py-2 text-xs font-semibold bg-gray-50 hover:bg-black hover:text-white text-gray-800 border border-gray-200 rounded-sm transition-all uppercase tracking-wider"
              >
                Wishlist
              </Link>
            </div>
          </div>
        </div>

        {/* 2-Column Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Navigation Sidebar (Desktop) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-white border border-gray-200/90 rounded-sm p-3 shadow-xs">
              <div className="px-3.5 py-2 border-b border-gray-100 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Account Navigation</span>
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
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`} />
                        <div className="truncate">
                          <p className="text-xs font-bold uppercase tracking-wider leading-tight">{link.name}</p>
                          <p className={`text-[11px] font-normal truncate mt-0.5 ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
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
                  suppressHydrationWarning
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-600 hover:bg-rose-50 rounded-sm transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </div>
                  <ChevronRight size={14} className="text-rose-300" />
                </button>
              </nav>
            </div>
          </aside>

          {/* Dynamic Page Content */}
          <main className="flex-1 w-full">
            <div className="bg-white border border-gray-200/90 rounded-sm p-4 sm:p-7 lg:p-8 shadow-xs min-h-[520px]">
              {/* Mobile Navigation Dropdown */}
              {!isOverviewPage && (
                <div className="lg:hidden mb-4 sticky top-16 z-30 pt-1 pb-1 -mt-1 bg-white">
                  <button 
                    onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                    className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-sm p-3.5 shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {(() => {
                        const activeLink = sidebarLinks.find(l => l.href === pathname);
                        const Icon = activeLink?.icon || User;
                        return (
                          <>
                            <Icon className="w-4 h-4 text-black" />
                            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">{activeLink?.name || 'Account Menu'}</span>
                          </>
                        );
                      })()}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isMobileNavOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {isMobileNavOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-sm shadow-xl flex flex-col divide-y divide-gray-100 z-40">
                      {sidebarLinks.map(link => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                          <Link 
                            key={link.href} 
                            href={link.href}
                            onClick={() => setIsMobileNavOpen(false)}
                            className={`flex items-center gap-3 p-3.5 transition-colors ${isActive ? 'bg-gray-100 font-bold' : 'hover:bg-gray-50'}`}
                          >
                            <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-black' : 'text-gray-600'}`}>{link.name}</span>
                          </Link>
                        );
                      })}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3.5 text-left transition-colors hover:bg-rose-50 text-rose-600 font-semibold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
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
