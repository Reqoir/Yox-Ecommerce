"use client";

import React, { useState } from 'react';
import { Heart, X, RefreshCw, ShoppingBag, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useProductFilters } from '@/hooks/useProductFilters';
import { SORT_OPTIONS_LIST } from '@/constants/products';
import { SortOption } from '@/types/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORY_TABS = [
  'ALL', 'NEW', 'SLIM', 'ROUND NECK', 'LUXE', 'PLAIN', 'OVERSIZED', 'CORE LAB', 'PARTY WEAR', 'PLUS SIZE', 'POLO', 'TECHNICAL', 'GRAPHIC PRINTED'
];

export function ProductGrid() {
  const {
    searchQuery,
    category,
    subCategory,
    sortBy,
    filteredProducts,
    setSearchQuery,
    setCategory,
    setSubCategory,
    setSortBy,
    clearAllFilters,
  } = useProductFilters();

  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <div className="w-full lg:pl-8 pb-16 lg:pb-0">
      
      {/* Top Meta Area (Desktop Only) */}
      <div className="hidden lg:block mb-8">
        
        {/* Title and Sort */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-extrabold text-black uppercase tracking-wide">
            {subCategory 
              ? subCategory 
              : category 
              ? category 
              : searchQuery 
              ? `SEARCH: ${searchQuery}` 
              : "T-SHIRTS"}
          </h1>
          
          <div className="w-[200px]">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="border-gray-200 rounded-none h-10 text-[13px] font-medium text-gray-800 bg-white focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 rounded-none">
                {SORT_OPTIONS_LIST.map((option) => (
                  <SelectItem key={option} value={option} className="text-[13px] text-gray-800 cursor-pointer rounded-none">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-colors border ${
                activeTab === tab
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-800 border-gray-800 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-10 px-1 lg:px-0">
          {filteredProducts.map((product) => (
            <Link href={`/product/${product.id}`} key={product.id} className="flex flex-col group cursor-pointer">
              {/* Image Box */}
              <div className="relative w-full aspect-[3/4] bg-[#f2f2f2] overflow-hidden mb-3">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-top mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Wishlist Button */}
                <button 
                  className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                  aria-label="Add to Wishlist"
                  onClick={(e) => e.preventDefault()}
                >
                  <Heart size={18} strokeWidth={1.5} />
                </button>
              </div>

              {/* Product Details */}
              <div className="flex flex-col gap-1">
                <h3 className="text-[12px] font-medium text-gray-800 line-clamp-1 truncate" title={product.name}>
                  {product.name}
                </h3>
                <span className="text-[12px] font-medium text-gray-900">
                  ₹{product.price}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
          <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">No Apparel Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mb-6">
            We couldn't find any products matching your current search or filter criteria. Try adjusting your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 bg-black text-white text-xs font-semibold py-2.5 px-5 hover:bg-gray-800 transition-colors"
          >
            <RefreshCw size={14} />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
