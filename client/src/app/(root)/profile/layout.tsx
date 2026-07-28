'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Package, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const sidebarLinks = [
  { name: 'Personal Info', href: '/profile/personal-info', icon: User },
  { name: 'Addresses', href: '/profile/addresses', icon: MapPin },
  { name: 'Orders', href: '/profile/orders', icon: Package },
  { name: 'Settings', href: '/profile/settings', icon: Settings },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-4">
            <h2 className="text-xl font-bold mb-6 px-4">My Account</h2>
            <nav className="flex flex-col gap-1">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-black text-white dark:bg-white dark:text-black font-medium' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              
              <hr className="my-4 border-gray-200 dark:border-gray-800" />
              
              <button 
                onClick={logout}
                className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors duration-200"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 lg:p-8 min-h-[600px]">
            {children}
          </div>
        </main>
        
      </div>
    </div>
  );
}
