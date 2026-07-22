"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { FilterSidebar } from '@/components/features/shop/filter-sidebar';
import { ProductGrid } from '@/components/features/shop/product-grid';
import { MobileBottomBar } from '@/components/features/shop/mobile-bottom-bar';
import { MobileFilterModal } from '@/components/features/shop/mobile-filter-modal';
import { MobileSortModal } from '@/components/features/shop/mobile-sort-modal';
import { useProductFilters } from '@/hooks/useProductFilters';

function ShopContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { setCategory } = useProductFilters();

  const categories = ['Shirts', 'Pants', 'T-Shirts', 'Hoodies', 'Jackets', 'Shorts', 'Accessories'];

  return (
    <main className="w-full bg-white min-h-screen pb-16 lg:pb-16 relative">
      
      {/* Category Text Strip (Desktop Only) */}
      <div className="hidden lg:block w-full border-b border-gray-100 bg-white">
        <div className="w-[85%] max-w-7xl mx-auto flex items-center justify-center gap-10 py-3.5 text-xs font-semibold text-gray-700">
          <button 
            onClick={() => setCategory(null)}
            className="cursor-pointer hover:text-[#1A2E4C] transition-colors"
          >
            All Men&apos;s Wear
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="cursor-pointer hover:text-[#1A2E4C] transition-colors"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[85%] max-w-7xl mx-auto flex items-start pt-0 lg:pt-8">
        {/* Sidebar Filter Area */}
        <div className="w-56 hidden lg:block flex-shrink-0">
          <FilterSidebar />
        </div>

        {/* Product Grid Area */}
        <div className="w-full flex-1">
          <ProductGrid />
        </div>
      </div>

      {/* Mobile Only Components */}
      <MobileBottomBar 
        onSortClick={() => setIsSortOpen(true)}
        onFilterClick={() => setIsFilterOpen(true)}
      />

      <MobileFilterModal 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      <MobileSortModal 
        isOpen={isSortOpen}
        onClose={() => setIsSortOpen(false)}
      />
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="w-full min-h-[60vh] flex items-center justify-center text-sm text-gray-500">
        Loading Men&apos;s Fashion collection...
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
