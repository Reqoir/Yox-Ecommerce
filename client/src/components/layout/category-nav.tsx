"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProductFilters } from '@/hooks/useProductFilters';
import { ChevronDown } from 'lucide-react';
import { MegaMenuMen } from './mega-menu-men';
import { categoryApi } from '@/api/admin/categories';

function CategoryNavContent() {
  const { setCategory } = useProductFilters();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<{name: string, slug: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        const mapped = data
          .filter(cat => cat.isActive)
          .map(cat => ({ name: cat.name, slug: cat.slug }));
        setCategories(mapped);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleCategoryClick = (slug: string | null) => {
    if (slug) {
      router.push(`/shop?category=${slug}`);
    } else {
      router.push('/shop');
    }
  };

  if (pathname !== '/') {
    return null;
  }

  if (isLoading || categories.length === 0) {
    return (
      <div className="hidden lg:block w-full h-[45px] border-b border-gray-100 bg-white sticky top-20 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)]" />
    );
  }

  return (
    <div className="hidden lg:flex w-full border-b border-gray-100 bg-white sticky top-20 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
      <div className="w-[95%] max-w-7xl mx-auto flex items-center justify-center gap-10 py-3 text-[13px] font-bold text-gray-800">
        {categories.map((cat) => (
          <div key={cat.slug} className="flex items-center group">
            <button
              onClick={() => handleCategoryClick(cat.slug)}
              className="flex items-center gap-1 cursor-pointer hover:text-[#D2925D] transition-colors whitespace-nowrap py-2"
            >
              {cat.name}
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
    <Suspense fallback={<div className="hidden lg:block w-full h-[45px] border-b border-gray-100 bg-white sticky top-20 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)]" />}>
      <CategoryNavContent />
    </Suspense>
  );
}
