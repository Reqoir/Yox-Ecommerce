"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { FilterSidebar } from '@/components/features/shop/filter-sidebar';
import { ProductGrid } from '@/components/features/shop/product-grid';
import { MobileFilterModal } from '@/components/features/shop/mobile-filter-modal';
import { MobileSortModal } from '@/components/features/shop/mobile-sort-modal';
import { useProductFilters } from '@/hooks/useProductFilters';
import { ShopSkeleton } from '@/components/features/shop/shop-skeleton';

function ShopContent() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { setCategory } = useProductFilters();

  const categories = ['Shirts', 'Pants', 'T-Shirts', 'Hoodies', 'Jackets', 'Shorts', 'Accessories'];

  return (
    <main className="w-full bg-white min-h-screen pb-16 lg:pb-16 relative">

      <div className="w-[98%] max-w-[1500px] mx-auto flex items-start pt-0 lg:pt-8">
        {/* Product Grid Area - Now Full Width on Desktop */}
        <div className="w-full">
          <ProductGrid 
            onOpenFilter={() => setIsFilterOpen(true)}
            onOpenSort={() => setIsSortOpen(true)}
          />
        </div>
      </div>

      {/* Mobile Modals (Triggered from inline Filter & Sort buttons) */}
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
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent />
    </Suspense>
  );
}
