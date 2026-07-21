import React from 'react';
import { FilterSidebar } from '@/components/features/shop/filter-sidebar';
import { ProductGrid } from '@/components/features/shop/product-grid';

export default function ShopPage() {
  return (
    <main className="w-full bg-white min-h-screen pb-16">
      {/* Category Text Strip */}
      <div className="w-full border-b border-gray-100 bg-white">
        <div className="w-[85%] max-w-7xl mx-auto flex items-center justify-center gap-12 py-4 text-sm font-medium text-gray-700">
          <span className="cursor-pointer hover:text-black">Shirts</span>
          <span className="cursor-pointer hover:text-black">Pants</span>
          <span className="cursor-pointer hover:text-black">T-Shirts</span>
          <span className="cursor-pointer hover:text-black">Accessories</span>
          <span className="cursor-pointer hover:text-black">Hoodies</span>
        </div>
      </div>

      <div className="w-[85%] max-w-7xl mx-auto flex items-start pt-8">
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
