import React from 'react';
import { FilterSidebar } from '@/components/features/shop/filter-sidebar';
import { ProductGrid } from '@/components/features/shop/product-grid';

export default function ShopPage() {
  return (
    <main className="w-full bg-white min-h-screen pt-8 pb-16">
      <div className="w-[85%] max-w-7xl mx-auto flex items-start">
        {/* Sidebar Filter Area */}
        <div className="w-56 hidden lg:block flex-shrink-0">
          <FilterSidebar />
        </div>

        {/* Product Grid Area */}
        <div className="w-full flex-1">
          <ProductGrid />
        </div>
      </div>
    </main>
  );
}
