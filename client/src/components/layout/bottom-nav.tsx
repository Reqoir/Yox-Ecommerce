"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Heart, User } from 'lucide-react';
import { BsHandbag } from 'react-icons/bs';
import { useCartStore } from '@/store/useCartStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAuthModalStore } from '@/store/useAuthModalStore';

export function BottomNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const isHomePage = pathname === '/';
  const [isVisible, setIsVisible] = useState(!isHomePage);
  const cartCount = useCartStore((state) => state.getItemCount());
  const favouritesCount = useFavouritesStore((state) => state.items.length);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isHomePage) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 60) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check initial scroll position on mount/page change
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomePage]);

  const isShopActive = pathname.startsWith('/shop');
  const isWishlistActive = pathname.startsWith('/profile/favourites') || pathname === '/wishlist' || pathname === '/favourites';
  const isCartActive = pathname === '/cart';
  const isAccountActive = pathname.startsWith('/profile') && !isWishlistActive || pathname === '/login';

  return (
    <nav 
      suppressHydrationWarning
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[max(0px,env(safe-area-inset-bottom))] transition-all duration-300 ease-in-out ${
        isVisible
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : 'translate-y-full opacity-0 pointer-events-none'
      }`}
      aria-label="Mobile Navigation Bar"
    >
      <div className="grid grid-cols-4 h-14 items-center">
        {/* 1. Shop */}
        <Link
          href="/shop"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isShopActive ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'
          }`}
        >
          <LayoutGrid size={19} strokeWidth={isShopActive ? 2.3 : 1.8} />
          <span className="text-[10px] tracking-tight mt-1">Shop</span>
        </Link>

        {/* 2. Wishlist */}
        <Link
          href="/profile/favourites"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isWishlistActive ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Heart 
              size={19} 
              className={isWishlistActive ? 'fill-black text-black' : 'text-gray-600'} 
              strokeWidth={isWishlistActive ? 2.2 : 1.8} 
            />
            {mounted && favouritesCount > 0 && (
              <span 
                suppressHydrationWarning
                className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center"
              >
                {favouritesCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-1">Wishlist</span>
        </Link>

        {/* 3. Cart */}
        <Link
          href="/cart"
          className={`flex flex-col items-center justify-center py-1 transition-colors ${
            isCartActive ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <BsHandbag size={18} strokeWidth={isCartActive ? 0.8 : 0.2} />
            <span 
              suppressHydrationWarning
              className="absolute -top-1.5 -right-2.5 bg-black text-white text-[9px] font-bold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center"
            >
              {mounted ? cartCount : 0}
            </span>
          </div>
          <span className="text-[10px] tracking-tight mt-1">Cart</span>
        </Link>

        {/* 4. Account */}
        {mounted && user ? (
          <Link
            href="/profile/personal-info"
            className={`flex flex-col items-center justify-center py-1 transition-colors ${
              isAccountActive ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'
            }`}
          >
            <User size={19} strokeWidth={isAccountActive ? 2.3 : 1.8} />
            <span className="text-[10px] tracking-tight mt-1">Account</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => useAuthModalStore.getState().openModal('login')}
            className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              isAccountActive ? 'text-black font-semibold' : 'text-gray-600 hover:text-black'
            }`}
          >
            <User size={19} strokeWidth={isAccountActive ? 2.3 : 1.8} />
            <span className="text-[10px] tracking-tight mt-1">Account</span>
          </button>
        )}
      </div>
    </nav>
  );
}
