'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  MapPin,
  Package,
  RotateCcw,
  Heart,
  ShoppingBag,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { authApi } from '@/api/auth';
import { toast } from 'sonner';

export default function ProfileOverviewPage() {
  const router = useRouter();
  const { logoutUser } = useAuthStore();

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

  const accountItems = [
    { label: 'PERSONAL INFORMATION', href: '/profile/personal-info', icon: User },
    { label: 'SAVED ADDRESSES', href: '/profile/addresses', icon: MapPin },
  ];

  const shoppingItems = [
    { label: 'ORDERS', href: '/profile/orders', icon: Package },
    { label: 'REFUNDS', href: '/profile/orders', icon: RotateCcw },
    { label: 'MY FAVOURITES', href: '/profile/favourites', icon: Heart },
    { label: 'EXPLORE SHOP CATALOG', href: '/shop', icon: ShoppingBag },
    { label: 'RATE & REVIEW', href: '/profile/orders', icon: Star },
  ];

  const communityItems = [
    { label: 'EXCLUSIVE OFFERS & DROPS', href: '/offers', icon: Sparkles },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-7 animate-in fade-in duration-300 py-2">
      {/* ACCOUNT SECTION */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2.5">
          ACCOUNT
        </h3>
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100 overflow-hidden shadow-2xs">
          {accountItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-gray-800 shrink-0 stroke-[1.75]" />
                  <span className="text-xs font-semibold text-gray-800 tracking-wider uppercase">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* SHOPPING SECTION */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2.5">
          SHOPPING
        </h3>
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100 overflow-hidden shadow-2xs">
          {shoppingItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-gray-800 shrink-0 stroke-[1.75]" />
                  <span className="text-xs font-semibold text-gray-800 tracking-wider uppercase">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* COMMUNITY SECTION */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-2.5">
          COMMUNITY
        </h3>
        <div className="bg-white border border-gray-200 rounded-sm divide-y divide-gray-100 overflow-hidden shadow-2xs">
          {communityItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-4 bg-white hover:bg-gray-50/80 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-5 h-5 text-gray-800 shrink-0 stroke-[1.75]" />
                  <span className="text-xs font-semibold text-gray-800 tracking-wider uppercase">
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* FOOTER LINKS */}
      <div className="flex items-center justify-center gap-6 sm:gap-10 pt-6 pb-2 text-xs font-semibold tracking-widest text-gray-800 uppercase border-t border-gray-100">
        <Link href="/contact" className="hover:underline">
          HELP
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/profile/settings" className="hover:underline">
          SETTINGS
        </Link>
        <span className="text-gray-300">|</span>
        <button onClick={handleLogout} className="hover:underline cursor-pointer">
          LOGOUT
        </button>
      </div>
    </div>
  );
}
