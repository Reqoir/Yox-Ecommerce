"use client";

import React from 'react';
import { Heart, X, RefreshCw, ShoppingBag, ChevronDown, WifiOff, SlidersHorizontal, ArrowDownUp } from 'lucide-react';
import Link from 'next/link';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { useBrands } from '@/hooks/admin/useBrands';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { toast } from 'sonner';
import { SORT_OPTIONS_LIST, getColorHex } from '@/constants/products';
import { SortOption } from '@/types/product';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { FilterSidebar } from '@/components/features/shop/filter-sidebar';

interface ProductGridProps {
  onOpenFilter?: () => void;
  onOpenSort?: () => void;
}

export function ProductGrid({ onOpenFilter, onOpenSort }: ProductGridProps = {}) {
  const {
    searchQuery,
    category,
    subCategory,
    brand,
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

  const { categories: apiCategories } = useCategories();
  const { brands: apiBrands } = useBrands();
  const { isFavourite, toggleFavourite } = useFavouritesStore();

  const [isSortDropdownOpen, setIsSortDropdownOpen] = React.useState(false);
  const sortDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sortDisplayLabel = React.useMemo(() => {
    switch (sortBy) {
      case 'Newest Arrivals': return 'Date, new to old';
      case 'Price: Low to High': return 'Price, low to high';
      case 'Price: High to Low': return 'Price, high to low';
      case 'Discount': return '% Sale off';
      case 'Relevance': return 'Relevance';
      default: return (sortBy as string) || 'Relevance';
    }
  }, [sortBy]);

  // Show ONLY parent categories (no subcategories) in tabs
  const parentCategories = React.useMemo(() => {
    return (apiCategories || [])
      .filter((c) => c.isActive !== false && !c.parentCategoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [apiCategories]);

  const tabs = React.useMemo(() => {
    if (parentCategories.length > 0) {
      return [
        { label: 'ALL', slug: null },
        ...parentCategories.map((c) => ({
          label: c.name.toUpperCase(),
          slug: c.slug || c.name.toLowerCase(),
          id: c.id,
          name: c.name,
        })),
      ];
    }
    return [{ label: 'ALL', slug: null }];
  }, [parentCategories]);

  // Determine which tab is highlighted
  const activeTab = React.useMemo(() => {
    if (!category && !subCategory) return 'ALL';
    const target = (category || subCategory || '').toLowerCase().trim();

    // 1. Direct match with a parent category (by slug, name, or id)
    const directParent = parentCategories.find(
      (c) =>
        c.slug?.toLowerCase() === target ||
        c.name.toLowerCase() === target ||
        c.id?.toLowerCase() === target
    );
    if (directParent) return directParent.name.toUpperCase();

    // 2. Subcategory match -> resolve to its parent
    const matchedSub = (apiCategories || []).find(
      (c) =>
        c.slug?.toLowerCase() === target ||
        c.name.toLowerCase() === target ||
        c.id?.toLowerCase() === target
    );
    if (matchedSub?.parentCategoryId) {
      const parent = parentCategories.find((p) => p.id === matchedSub.parentCategoryId);
      if (parent) return parent.name.toUpperCase();
    }

    return target.toUpperCase();
  }, [category, subCategory, parentCategories, apiCategories]);

  // Determine current parent category object
  const currentParentCategory = React.useMemo(() => {
    if (!category && !subCategory) return null;
    const target = (category || subCategory || '').toLowerCase().trim();

    // 1. Direct match with a parent category (by slug, name, or id)
    const directParent = parentCategories.find(
      (c) =>
        c.slug?.toLowerCase() === target ||
        c.name.toLowerCase() === target ||
        c.id?.toLowerCase() === target
    );
    if (directParent) return directParent;

    // 2. Subcategory match -> resolve to its parent
    const matchedSub = (apiCategories || []).find(
      (c) =>
        c.slug?.toLowerCase() === target ||
        c.name.toLowerCase() === target ||
        c.id?.toLowerCase() === target
    );
    if (matchedSub?.parentCategoryId) {
      return parentCategories.find((p) => p.id === matchedSub.parentCategoryId) || null;
    }

    return null;
  }, [category, subCategory, parentCategories, apiCategories]);

  // Subcategories belonging to the active parent category
  const activeSubCategories = React.useMemo(() => {
    if (!currentParentCategory) return [];
    return (apiCategories || [])
      .filter((c) => c.isActive !== false && c.parentCategoryId === currentParentCategory.id)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [currentParentCategory, apiCategories]);

  const handleTabClick = (tabItem: { label: string; slug: string | null }) => {
    if (tabItem.label === 'ALL' || activeTab === tabItem.label) {
      setCategory(null);
    } else {
      setCategory(tabItem.slug);
    }
  };

  // Clean display page title
  const pageTitle = React.useMemo(() => {
    if (brand) {
      const matchedBrand = (apiBrands || []).find(
        (b) =>
          b.slug?.toLowerCase() === brand.toLowerCase() ||
          b.name.toLowerCase() === brand.toLowerCase() ||
          b.id.toLowerCase() === brand.toLowerCase()
      );
      return (matchedBrand?.name || brand).toUpperCase();
    }
    if (subCategory) {
      const matchedSub = (apiCategories || []).find(
        (c) =>
          c.slug?.toLowerCase() === subCategory.toLowerCase() ||
          c.name.toLowerCase() === subCategory.toLowerCase() ||
          c.id?.toLowerCase() === subCategory.toLowerCase()
      );
      return (matchedSub?.name || subCategory).toUpperCase();
    }
    if (category) {
      const matchedCat = (apiCategories || []).find(
        (c) =>
          c.slug?.toLowerCase() === category.toLowerCase() ||
          c.name.toLowerCase() === category.toLowerCase() ||
          c.id?.toLowerCase() === category.toLowerCase()
      );
      return (matchedCat?.name || category).toUpperCase();
    }
    if (searchQuery) {
      return `SEARCH: ${searchQuery.toUpperCase()}`;
    }
    return 'ALL PRODUCTS';
  }, [category, subCategory, brand, searchQuery, apiCategories, apiBrands]);

  return (
    <div className="w-full lg:pl-8 pb-16 lg:pb-0">

      {/* Mobile Sticky Filter By & Relevance/Sort Bar (Sticks right below navbar on scroll) */}
      <div className="lg:hidden sticky top-18 z-30 bg-white/95 backdrop-blur-md py-2.5 px-1 border-b border-gray-200 shadow-xs mb-3">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenFilter}
            className="flex items-center justify-center gap-2 border border-gray-300 bg-white py-2 px-3 text-xs font-semibold text-gray-800 active:bg-gray-100 transition-colors shadow-2xs cursor-pointer rounded-xs"
          >
            <SlidersHorizontal size={14} className="text-gray-700" />
            <span>Filter By</span>
          </button>

          {/* Relevance / Sort Dropdown Menu (Anchored below button matching reference screenshot) */}
          <div className="relative" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setIsSortDropdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between border border-gray-300 bg-white py-2 px-3 text-xs font-semibold text-gray-800 active:bg-gray-100 transition-colors shadow-2xs cursor-pointer rounded-xs"
            >
              <span className="truncate">{sortDisplayLabel}</span>
              <ChevronDown size={14} className={`shrink-0 text-gray-500 transition-transform duration-200 ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isSortDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 shadow-xl z-50 py-1.5 animate-in fade-in-50 zoom-in-95 duration-100 rounded-xs">
                {SORT_OPTIONS_LIST.map((option) => {
                  const isSelected = sortBy === option || 
                    (option === 'Date, new to old' && sortBy === 'Newest Arrivals') || 
                    (option === 'Price, low to high' && sortBy === 'Price: Low to High') || 
                    (option === 'Price, high to low' && sortBy === 'Price: High to Low') || 
                    (option === '% Sale off' && sortBy === 'Discount');

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSortBy(option as SortOption);
                        setIsSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors cursor-pointer block ${
                        isSelected ? 'font-bold text-black bg-gray-50' : 'text-gray-700 hover:text-black hover:bg-gray-50 font-normal'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Meta Area (Desktop Only) */}
      <div className="hidden lg:block mb-6 lg:mb-8">

        {/* Title */}
        <h1 className="text-[22px] font-extrabold text-black uppercase tracking-wide mb-6">
          {pageTitle}
        </h1>

        {/* Tabs and Sort */}
        <div className="flex items-center justify-between gap-4">
          {/* Horizontal Tabs - Parent categories only */}
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 flex-1">
            {isLoading ? (
              Array.from({ length: 7 }).map((_, idx) => (
                <Skeleton key={idx} className="h-8 w-24 rounded-none shrink-0" />
              ))
            ) : tabs.map((tabItem) => (
              <button
                key={tabItem.label}
                onClick={() => handleTabClick(tabItem)}
                className={`px-3 py-1.5 text-[10px] tracking-widest uppercase transition-colors border cursor-pointer shrink-0 ${activeTab === tabItem.label
                    ? 'bg-black text-white border-black font-medium'
                    : 'bg-white text-gray-800 border-gray-800 hover:bg-gray-100 font-normal'
                  }`}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          {/* Filters and Sort */}
          <div className="hidden lg:flex items-center gap-6 shrink-0">
            {/* Filter Drawer */}
            <Sheet>
              <SheetTrigger className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-900 hover:text-black transition-colors cursor-pointer">
                <SlidersHorizontal size={14} strokeWidth={1.5} />
                <span>Filters</span>
              </SheetTrigger>
              <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0 border-l border-gray-200">
                <div className="h-full overflow-y-auto">
                  <FilterSidebar />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0 p-0 h-auto bg-transparent hover:bg-transparent shadow-none [&>svg]:hidden">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-900 hover:text-black transition-colors cursor-pointer">
                  <ArrowDownUp size={14} strokeWidth={1.5} />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="bg-white border border-gray-200 rounded-none w-48">
                {SORT_OPTIONS_LIST.map((option) => (
                  <SelectItem key={option} value={option} className="text-xs text-gray-800 cursor-pointer rounded-none">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Contextual Subcategories Pill Bar (Shown when selected category has subcategories) */}
        {activeSubCategories.length > 0 && currentParentCategory && (
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 mr-1 flex items-center gap-1.5">
              <span>{currentParentCategory.name} Types</span>
              <span className="text-gray-300">•</span>
            </span>

            {/* "All [Parent]" pill */}
            <button
              type="button"
              onClick={() => setCategory(currentParentCategory.slug || currentParentCategory.name.toLowerCase())}
              className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${(!subCategory && (category?.toLowerCase() === currentParentCategory.slug?.toLowerCase() || category?.toLowerCase() === currentParentCategory.name.toLowerCase()))
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All {currentParentCategory.name}
            </button>

            {/* Individual Subcategories */}
            {activeSubCategories.map((sub) => {
              const isSubActive =
                subCategory?.toLowerCase() === sub.slug?.toLowerCase() ||
                subCategory?.toLowerCase() === sub.name.toLowerCase() ||
                category?.toLowerCase() === sub.slug?.toLowerCase() ||
                category?.toLowerCase() === sub.name.toLowerCase();

              return (
                <button
                  key={sub.id || sub.slug}
                  type="button"
                  onClick={() => {
                    if (isSubActive) {
                      setCategory(currentParentCategory.slug || currentParentCategory.name.toLowerCase());
                    } else {
                      setCategory(sub.slug || sub.name.toLowerCase());
                    }
                  }}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-full transition-all cursor-pointer ${isSubActive
                      ? 'bg-black text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid, Loading, Error, or Empty State */}
      {isLoading ? (
        /* Amazon / Flipkart Style Shimmer Loading Skeletons */
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-2.5 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-8 lg:gap-y-10 px-0.5 sm:px-1 lg:px-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5 animate-pulse">
              <div className="w-full aspect-[1/1.42] sm:aspect-[3/4] bg-gray-100 rounded-sm" />
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
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-2.5 sm:gap-x-4 lg:gap-x-5 gap-y-6 sm:gap-y-8 lg:gap-y-10 px-0.5 sm:px-1 lg:px-0">
          {filteredProducts.map((product) => {
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
                <div className="relative w-full aspect-[1/1.42] sm:aspect-[3/4] bg-[#f2f2f2] overflow-hidden mb-2.5 sm:mb-3">
                  <img
                    src={product.image}
                    alt={`${product.name}${cardColor ? ` - ${cardColor}` : ''}`}
                    className={`w-full h-full object-cover object-top transition-opacity duration-300 ${product.inStock === false ? 'opacity-80 grayscale-[20%]' : ''
                      } ${product.secondImage && product.secondImage !== product.image ? 'group-hover:opacity-0' : ''
                      }`}
                  />
                  {product.secondImage && product.secondImage !== product.image && (
                    <img
                      src={product.secondImage}
                      alt={`${product.name}${cardColor ? ` - ${cardColor}` : ''} alternate view`}
                      className={`absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${product.inStock === false ? 'grayscale-[20%]' : ''
                        }`}
                    />
                  )}

                  {/* Sold Out or Offer Badge */}
                  {product.inStock === false ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-black/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-xs tracking-widest shadow-xs">
                        SOLD OUT
                      </span>
                    </div>
                  ) : (product.offerBadge || product.offerTitle) ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs tracking-wider max-w-[140px] truncate block">
                        {product.offerBadge || product.offerTitle}
                      </span>
                    </div>
                  ) : null}

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
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[13px] font-bold ${product.inStock === false ? 'text-gray-500' : 'text-gray-900'}`}>
                      ₹{product.price}
                    </span>
                    {product.inStock === false && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Sold Out
                      </span>
                    )}
                    {product.inStock !== false && product.originalPrice && product.originalPrice > product.price && (
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
                  {product.colors && product.colors.length > 1 && (() => {
                    const displayColors = product.currentColor
                      ? [
                        product.colors.find((c: string) => c.toLowerCase() === product.currentColor?.toLowerCase()) || product.currentColor,
                        ...product.colors.filter((c: string) => c.toLowerCase() !== product.currentColor?.toLowerCase())
                      ]
                      : product.colors;

                    return (
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        {displayColors.slice(0, 4).map((c: string) => (
                          <div
                            key={c}
                            title={c}
                            className="w-2 h-2 shadow-xs shrink-0"
                            style={{ backgroundColor: getColorHex(c) }}
                          />
                        ))}
                        {displayColors.length > 4 && (
                          <span className="text-[10px] font-medium text-gray-500 ml-0.5">
                            +{displayColors.length - 4}
                          </span>
                        )}
                      </div>
                    );
                  })()}
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
