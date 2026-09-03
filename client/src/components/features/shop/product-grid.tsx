"use client";

import React, { useState } from 'react';
import { Heart, X, RefreshCw, ShoppingBag, ChevronDown, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { toast } from 'sonner';
import { SORT_OPTIONS_LIST } from '@/constants/products';
import { SortOption } from '@/types/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductGrid() {
  const {
    searchQuery,
    category,
    subCategory,
    sortBy,
    filteredProducts,
    isLoading,
    isError,
    refetch,
    setSearchQuery,
    setCategory,
    setSubCategory,
    setSortBy,
    clearAllFilters,
  } = useProductFilters();

  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const [activeTab, setActiveTab] = useState('ALL');

  // Generate dynamic tabs based on the currently filtered products
  const dynamicTabs = React.useMemo(() => {
    const tabs = new Set<string>();
    filteredProducts.forEach(p => {
      if (p.subCategory) tabs.add(p.subCategory.toUpperCase());
      else if (p.category) tabs.add(p.category.toUpperCase());
      else if (p.tag) tabs.add(p.tag.toUpperCase());
    });
    // Add some common defaults if they exist in the products, otherwise just unique subcategories
    return ['ALL', ...Array.from(tabs).slice(0, 15)]; // Limit to a reasonable number of tabs
  }, [filteredProducts]);

  // Apply the active tab filter locally on top of the URL filters
  const finalProducts = React.useMemo(() => {
    if (activeTab === 'ALL') return filteredProducts;
    return filteredProducts.filter(p => 
      p.subCategory?.toUpperCase() === activeTab || 
      p.category?.toUpperCase() === activeTab ||
      p.tag?.toUpperCase() === activeTab
    );
  }, [filteredProducts, activeTab]);

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
              : "ALL PRODUCTS"}
          </h1>
          
          <div className="w-[200px]">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="border-gray-200 rounded-none h-10 text-[13px] font-medium text-gray-800 bg-white focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 transition-colors cursor-pointer">
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
          {dynamicTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-colors border cursor-pointer ${
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

      {/* Grid, Loading, Error, or Empty State */}
      {isLoading ? (
        /* Amazon / Flipkart Style Shimmer Loading Skeletons */
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-10 px-1 lg:px-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5 animate-pulse">
              <div className="w-full aspect-[3/4] bg-gray-100 rounded-sm" />
              <div className="h-3.5 bg-gray-100 rounded-xs w-3/4" />
              <div className="h-2.5 bg-gray-100 rounded-xs w-1/3" />
              <div className="h-3.5 bg-gray-100 rounded-xs w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Amazon / Flipkart Style Connection Offline State */
        <div className="w-full py-16 px-4 flex flex-col items-center justify-center text-center bg-gray-50/70 rounded-xl border border-gray-200 max-w-md mx-auto my-8">
          <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 shadow-xs">
            <WifiOff size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1.5">Connection Problem</h3>
          <p className="text-xs text-gray-500 max-w-xs mb-5 leading-relaxed">
            We couldn&apos;t load the product catalog. Please check your internet connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold py-2.5 px-6 rounded-xs hover:bg-gray-800 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      ) : finalProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-4 gap-y-10 px-1 lg:px-0">
          {finalProducts.map((product) => {
            const prodIdStr = String(product.productId || product.id);
            const cardColor = product.currentColor || null;
            const isFav = isFavourite(prodIdStr, cardColor);

            return (
              <Link 
                href={product.href || `/product/${product.productId || product.id}${cardColor ? `?color=${encodeURIComponent(cardColor)}` : ''}`} 
                key={product.colorCardId || `${prodIdStr}_${cardColor || 'default'}`} 
                className="flex flex-col group cursor-pointer"
              >
                {/* Image Box */}
                <div className="relative w-full aspect-[3/4] bg-[#f2f2f2] overflow-hidden mb-3">
                  <img 
                    src={product.image} 
                    alt={`${product.name}${cardColor ? ` - ${cardColor}` : ''}`} 
                    className="w-full h-full object-cover object-top mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Offer Badge if available */}
                  {product.offerBadge && (
                    <div className="absolute top-2 left-2 z-10 flex flex-col gap-0.5">
                      <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider">
                        {product.offerBadge}
                      </span>
                      {product.offerTitle && (
                        <span className="bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-xs max-w-[120px] truncate">
                          {product.offerTitle}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Wishlist Button */}
                  <button 
                    className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors z-10"
                    aria-label={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavourite({
                        id: `${prodIdStr}__${cardColor || 'default'}`,
                        productId: prodIdStr,
                        color: cardColor,
                        name: product.name,
                        category: product.category,
                        image: product.image,
                        price: product.price,
                        comparePrice: product.originalPrice || undefined,
                        inStock: product.inStock !== false,
                      });
                      if (isFav) {
                        toast.info(`Removed ${product.name}${cardColor ? ` (${cardColor})` : ''} from wishlist`);
                      } else {
                        toast.success(`Added ${product.name}${cardColor ? ` (${cardColor})` : ''} to wishlist`);
                      }
                    }}
                  >
                    <Heart 
                      size={18} 
                      strokeWidth={1.5} 
                      className={isFav ? "fill-red-500 text-red-500 transition-colors" : "text-gray-600 hover:text-red-500 transition-colors"} 
                    />
                  </button>
                </div>

                {/* Product Details */}
                <div className="flex flex-col gap-1">
                  <h3 className="text-[12px] font-medium text-gray-800 line-clamp-1 truncate" title={product.name}>
                    {product.name}
                  </h3>
                  {product.currentColor && (
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      {product.currentColor}
                    </span>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13px] font-bold text-gray-900">
                      ₹{product.price}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <>
                        <span className="text-[11px] text-gray-400 line-through">
                          ₹{product.originalPrice}
                        </span>
                        {product.offerSavings && (
                          <span className="text-[10px] font-bold text-emerald-700">
                            Save ₹{product.offerSavings}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
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
