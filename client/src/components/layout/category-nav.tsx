"use client";

import React, { Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProductFilters } from '@/hooks/useProductFilters';

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
    <div className="hidden lg:flex w-full border-b border-gray-100 bg-white sticky top-0 z-40 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="w-[95%] max-w-7xl mx-auto flex items-center justify-center gap-10 py-3 text-[13px] font-bold text-gray-800">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className="cursor-pointer hover:text-[#D2925D] transition-colors whitespace-nowrap"
          >
            {cat}
          </button>
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
