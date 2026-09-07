"use client";

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProductFilters } from '@/hooks/useProductFilters';
import { ChevronDown } from 'lucide-react';
import { MegaMenuMen } from './mega-menu-men';
import { categoryApi } from '@/api/admin/categories';

interface NavCategory {
  id?: string;
  name: string;
  slug: string;
}

const DEFAULT_NAV_CATEGORIES: NavCategory[] = [
  { name: 'T-SHIRT', slug: 't-shirt' },
  { name: 'JACKET', slug: 'jacket' },
  { name: 'ACCESSORIES', slug: 'accessories' },
  { name: 'PANTS', slug: 'pants' },
  { name: 'SHIRTS', slug: 'shirts' },
];

function CategoryNavContent() {
  const { setCategory } = useProductFilters();
  const router = useRouter();
  const pathname = usePathname();

  const [categories, setCategories] = useState<NavCategory[]>(DEFAULT_NAV_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        if (data && data.length > 0) {
          // Filter out inactive categories and subcategories (show ONLY main parent categories)
          const mapped = data
            .filter(cat => cat.isActive && !cat.parentCategoryId)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map(cat => ({ id: cat.id, name: cat.name.toUpperCase(), slug: cat.slug }));
          if (mapped.length > 0) {
            setCategories(mapped);
          }
        }
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

  const activeCategoryObj = categories.find(c => c.slug === hoveredCat);

  return (
    <div 
      className="hidden lg:flex w-full border-b border-gray-100 bg-white sticky top-20 z-30 shadow-[0_2px_4px_rgba(0,0,0,0.02)] relative"
      onMouseLeave={() => setHoveredCat(null)}
    >
      <div className="w-[95%] max-w-7xl mx-auto flex items-center justify-center gap-7 lg:gap-9 text-[12px] font-medium text-gray-700 uppercase tracking-wider">
        {categories.map((cat) => (
          <div 
            key={cat.slug} 
            className="flex items-center h-full"
            onMouseEnter={() => setHoveredCat(cat.slug)}
          >
            <button
              onClick={() => handleCategoryClick(cat.slug)}
              className="flex items-center gap-1 cursor-pointer hover:text-black transition-colors whitespace-nowrap py-3.5 font-medium uppercase tracking-wider text-[12px]"
            >
              {cat.name.toUpperCase()}
              <ChevronDown size={13} className={`transition-transform duration-200 ${hoveredCat === cat.slug ? 'rotate-180 text-black' : 'text-gray-400'}`} />
            </button>
          </div>
        ))}
      </div>

      {/* Centered Mega Menu Dropdown always positioned strictly in the center */}
      {hoveredCat && activeCategoryObj && (
        <div 
          className="absolute top-full left-1/2 -translate-x-1/2 w-[90vw] max-w-[1250px] z-50 pt-1"
          onMouseEnter={() => setHoveredCat(hoveredCat)}
          onMouseLeave={() => setHoveredCat(null)}
        >
          <MegaMenuMen 
            categoryId={activeCategoryObj.id} 
            categorySlug={activeCategoryObj.slug} 
            categoryName={activeCategoryObj.name} 
          />
        </div>
      )}
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
