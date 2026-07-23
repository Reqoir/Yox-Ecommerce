"use client";

import React from 'react';
import { Heart, ChevronDown, X, RefreshCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useProductFilters } from '@/hooks/useProductFilters';
import { SORT_OPTIONS_LIST } from '@/constants/products';
import { SortOption, ProductSize, ProductFit, ProductTag } from '@/types/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductGrid() {
  const {
    searchQuery,
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedTags,
    sortBy,
    filteredProducts,
    setSearchQuery,
    setCategory,
    setSubCategory,
    setPriceRange,
    toggleSize,
    toggleFit,
    toggleColor,
    toggleTag,
    setSortBy,
    clearAllFilters,
    activeFilterCount,
  } = useProductFilters();

  return (
    <div className="w-full lg:pl-6 lg:border-l border-gray-100 pb-16 lg:pb-0">
      
      {/* Top Meta Area (Desktop Only) */}
      <div className="hidden lg:block mb-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>&gt;</span>
          <Link href="/shop" className="hover:text-gray-900">Men&apos;s Fashion</Link>
          {category && (
            <>
              <span>&gt;</span>
              <span className="text-gray-800 capitalize">{category}</span>
            </>
          )}
          {subCategory && (
            <>
              <span>&gt;</span>
              <span className="text-gray-800 capitalize">{subCategory}</span>
            </>
          )}
          {searchQuery && (
            <>
              <span>&gt;</span>
              <span className="text-gray-800">Search: &quot;{searchQuery}&quot;</span>
            </>
          )}
        </div>

        {/* Title and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold text-gray-900 capitalize">
              {subCategory 
                ? `Men's ${subCategory}` 
                : category 
                ? `Men's ${category}` 
                : searchQuery 
                ? `Search Results for "${searchQuery}"` 
                : "Men's Apparel"}
            </h1>
            <span className="text-xs text-gray-500">
              - {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} available
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">Sort By</span>
            <div className="w-[180px]">
              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                <SelectTrigger className="border-gray-300 rounded-[2px] h-9 text-xs font-semibold text-gray-800 bg-white focus:ring-0 focus:ring-offset-0 focus:border-[#1A2E4C]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200">
                  {SORT_OPTIONS_LIST.map((option) => (
                    <SelectItem key={option} value={option} className="text-xs font-medium text-gray-900 cursor-pointer data-[highlighted]:bg-gray-100 data-[highlighted]:text-gray-900 transition-colors">
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Meta Area */}
      <div className="lg:hidden w-full bg-gray-50/80 py-2 px-4 mb-3 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[13px] text-gray-600 font-medium">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
        </span>
        {activeFilterCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-[#D2925D] font-bold">
            Reset Filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Active Filters Chips Bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-5 px-2 lg:px-0">
          <span className="text-xs font-bold text-gray-500 mr-1">Active:</span>

          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Search: &quot;{searchQuery}&quot;
              <button onClick={() => setSearchQuery('')} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200 capitalize">
              Category: {category}
              <button onClick={() => setCategory(null)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          )}

          {subCategory && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200 capitalize">
              SubCategory: {subCategory}
              <button onClick={() => setSubCategory(null)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          )}

          {(minPrice > 0 || maxPrice < 10000) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Price: ₹{minPrice} - ₹{maxPrice}
              <button onClick={() => setPriceRange([0, 10000])} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          )}

          {selectedSizes.map((size) => (
            <span key={size} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Size: {size}
              <button onClick={() => toggleSize(size as ProductSize)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          ))}

          {selectedFits.map((fit) => (
            <span key={fit} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Fit: {fit}
              <button onClick={() => toggleFit(fit as ProductFit)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          ))}

          {selectedColors.map((color) => (
            <span key={color} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Color: {color}
              <button onClick={() => toggleColor(color)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          ))}

          {selectedTags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full border border-gray-200">
              Tag: {tag}
              <button onClick={() => toggleTag(tag as ProductTag)} className="hover:text-black">
                <X size={13} />
              </button>
            </span>
          ))}

          <button 
            onClick={clearAllFilters}
            className="text-xs text-[#D2925D] hover:underline font-semibold ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Grid or Empty State */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6 px-1 lg:px-0">
          {filteredProducts.map((product) => (
            <Link href={`/product/${product.id}`} key={product.id} className="flex flex-col group cursor-pointer border border-transparent hover:border-gray-200 p-2 rounded transition-all">
              {/* Image Box */}
              <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-3 rounded-[2px]">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Wishlist Button */}
                <button 
                  className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white text-gray-600 hover:text-red-500 transition-colors"
                  aria-label="Add to Wishlist"
                  onClick={(e) => e.preventDefault()} // Prevent routing when clicking wishlist
                >
                  <Heart size={16} strokeWidth={2} />
                </button>

                {/* Tag */}
                {product.tag && (
                  <div className={`absolute bottom-3 left-3 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide shadow-sm rounded-[1px] ${
                    product.tag === 'NEW' ? 'bg-[#1A2E4C] text-white' :
                    product.tag === 'ON OFFER' ? 'bg-[#D2925D] text-white' :
                    'bg-black text-white'
                  }`}>
                    {product.tag}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="px-1">
                <p className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">
                  {product.subCategory || product.category} {product.fit ? `• ${product.fit}` : ''}
                </p>
                <h3 className="text-xs lg:text-sm font-medium text-gray-800 mb-1 line-clamp-1 group-hover:text-[#1A2E4C] transition-colors" title={product.name}>
                  {product.name}
                </h3>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm lg:text-base font-bold text-gray-900">₹{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-[10px] lg:text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
                  )}
                </div>
                
                <div className="text-[10px] lg:text-xs text-emerald-600 font-medium">
                  Best price <span className="font-semibold">₹{product.bestPrice}</span>
                </div>
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
          <h3 className="text-base font-bold text-gray-900 mb-1">No Men&apos;s Apparel Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mb-6">
            We couldn&apos;t find any products matching your current search or filter criteria. Try adjusting your filters.
          </p>
          <button
            onClick={clearAllFilters}
            className="inline-flex items-center gap-2 bg-[#1A2E4C] text-white text-xs font-semibold py-2.5 px-5 rounded hover:bg-[#233f68] transition-colors"
          >
            <RefreshCw size={14} />
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
}
