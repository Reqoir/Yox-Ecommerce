"use client";

import React, { Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProductFilters } from '@/hooks/useProductFilters';
import { ChevronDown } from 'lucide-react';
import { MegaMenuMen } from './mega-menu-men';

function CategoryNavContent() {
  const { setCategory } = useProductFilters();
  const router = useRouter();
  const pathname = usePathname();

  const categories = ['Women', 'Men', 'Kids', 'Footwear', 'Sleepwear', 'GenZ Store', 'Accessories'];

  const handleCategoryClick = (cat: string | null) => {
    // If not on shop page, push to shop with query param
    if (pathname !== '/shop') {
      if (cat) {
        router.push(`/shop?category=${cat.toLowerCase()}`);
      } else {
        router.push('/shop');
      }
    } else {
      // If already on shop page, just use the filter hook to avoid full reload
      setCategory(cat);
    }
  };

  return (
    <div className="hidden lg:flex w-full border-b border-gray-100 bg-white sticky top-20 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="w-[95%] max-w-7xl mx-auto flex items-center justify-center gap-10 py-3 text-[13px] font-bold text-gray-800">
        {categories.map((cat) => (
          <div key={cat} className="flex items-center group">
            <button
              onClick={() => handleCategoryClick(cat)}
              className="flex items-center gap-1 cursor-pointer hover:text-[#D2925D] transition-colors whitespace-nowrap py-2"
            >
              {cat}
              <ChevronDown size={14} className="text-gray-500" />
            </button>
            {/* Mega Menu Dropdown */}
            <div className="absolute top-full left-0 right-0 hidden group-hover:block hover:block">
              <MegaMenuMen />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoryNav() {
  return (
    <Suspense fallback={<div className="hidden lg:block w-full h-11 border-b border-gray-100 bg-white" />}>
      <CategoryNavContent />
    </Suspense>
  );
}
