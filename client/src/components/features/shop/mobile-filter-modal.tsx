'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Search, Check, X } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { useBrands } from '@/hooks/admin/useBrands';
import { ProductSize, ProductFit } from '@/types/product';
import { getColorHex } from '@/constants/products';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab =
  | 'Size'
  | 'Price'
  | 'Brand'
  | 'Color'
  | 'Discount Range'
  | 'Category'
  | 'Fit'
  | 'Availability';

const STANDARD_SIZES: ProductSize[] = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  'XXL',
  '3XL',
  '4XL',
  '5XL',
  '6XL',
  '7XL',
  '31',
  '32',
];

const formatSizeLabel = (label: string): string => {
  if (label.length <= 1) return label.toUpperCase();
  if (!isNaN(Number(label))) return label;
  const upper = label.toUpperCase();
  if (upper.endsWith('XL')) {
    const prefix = upper.slice(0, -2);
    if (!prefix) return 'Xl';
    if (prefix === 'X') return 'Xxl';
    return `${prefix.toLowerCase()}xl`;
  }
  if (upper === 'XS') return 'Xs';
  return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
};

const DISCOUNT_RANGES = [
  { label: '10% and above', min: 10 },
  { label: '20% and above', min: 20 },
  { label: '30% and above', min: 30 },
  { label: '40% and above', min: 40 },
  { label: '50% and above', min: 50 },
  { label: '60% and above', min: 60 },
  { label: '70% and above', min: 70 },
];

const PRICE_PRESETS: { label: string; range: [number, number] }[] = [
  { label: 'Under ₹1,000', range: [0, 1000] },
  { label: '₹1,000 - ₹2,000', range: [1000, 2000] },
  { label: '₹2,000 - ₹3,500', range: [2000, 3500] },
  { label: '₹3,500 - ₹5,000', range: [3500, 5000] },
  { label: '₹5,000 & Above', range: [5000, 10000] },
];

export function MobileFilterModal({ isOpen, onClose }: MobileFilterModalProps) {
  const {
    category,
    subCategory,
    brand,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    inStockOnly,
    onSaleOnly,
    allProducts,
    filteredProducts,
    filterFacets,
    availableSizes,
    availableFits,
    availableColors,
    setCategory,
    setBrand,
    setPriceRange,
    toggleSize,
    toggleFit,
    toggleColor,
    toggleInStock,
    toggleOnSale,
    clearAllFilters,
    activeFilterCount,
  } = useProductFilters();

  const { categories: apiCategories } = useCategories();
  const { brands: apiBrands } = useBrands();

  const [activeTab, setActiveTab] = useState<FilterTab>('Size');
  const [searchQuery, setSearchQuery] = useState('');

  // Custom price input state
  const [localMin, setLocalMin] = useState<string>(minPrice > 0 ? String(minPrice) : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice < 10000 ? String(maxPrice) : '');

  // Reset local search query when changing tabs
  useEffect(() => {
    setSearchQuery('');
  }, [activeTab]);

  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    setLocalMin(minPrice > 0 ? String(minPrice) : '');
    setLocalMax(maxPrice < 10000 ? String(maxPrice) : '');
  }, [minPrice, maxPrice]);

  // Pre-calculate counts for each filter option based on current catalog
  const facetCounts = useMemo(() => {
    const sizeMap: Record<string, number> = {};
    const colorMap: Record<string, number> = {};
    const brandMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const fitMap: Record<string, number> = {};
    const discountMap: Record<number, number> = { 10: 0, 20: 0, 30: 0, 40: 0, 50: 0, 60: 0, 70: 0 };
    const priceMap: Record<string, number> = {};

    let inStockCount = 0;
    let onSaleCount = 0;

    (allProducts || []).forEach((p: any) => {
      // Stock & Sale
      if (p.inStock !== false && (p.variants?.some((v: any) => v.inventory > 0) || p.inventory > 0)) {
        inStockCount++;
      }
      const hasDiscount = (p.originalPrice && p.originalPrice > p.price) || p.offerDiscountPct > 0;
      if (hasDiscount) onSaleCount++;

      // Discount percentages
      const discountPct = p.originalPrice && p.originalPrice > p.price
        ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        : (p.offerDiscountPct || 0);

      [10, 20, 30, 40, 50, 60, 70].forEach((threshold) => {
        if (discountPct >= threshold) {
          discountMap[threshold] = (discountMap[threshold] || 0) + 1;
        }
      });

      // Price Presets
      PRICE_PRESETS.forEach((preset) => {
        if (p.price >= preset.range[0] && p.price <= preset.range[1]) {
          priceMap[preset.label] = (priceMap[preset.label] || 0) + 1;
        }
      });

      // Category
      if (p.categoryId) {
        categoryMap[p.categoryId] = (categoryMap[p.categoryId] || 0) + 1;
      }
      if (p.category) {
        const cLower = p.category.toLowerCase();
        categoryMap[cLower] = (categoryMap[cLower] || 0) + 1;
      }

      // Brand
      if (p.brandId) {
        brandMap[p.brandId] = (brandMap[p.brandId] || 0) + 1;
      }
      if (p.brand) {
        brandMap[p.brand.toLowerCase()] = (brandMap[p.brand.toLowerCase()] || 0) + 1;
      }

      // Fit
      if (p.fit) {
        fitMap[p.fit] = (fitMap[p.fit] || 0) + 1;
      }

      // Sizes & Colors from variants
      (p.variants || []).forEach((v: any) => {
        if (v.color) {
          const c = v.color.toLowerCase();
          colorMap[c] = (colorMap[c] || 0) + 1;
        }
        (v.sizes || []).forEach((s: any) => {
          const sz = (typeof s === 'string' ? s : s.size || s.name || '').toUpperCase();
          if (sz) {
            sizeMap[sz] = (sizeMap[sz] || 0) + 1;
          }
        });
      });
    });

    return {
      sizeMap,
      colorMap,
      brandMap,
      categoryMap,
      fitMap,
      discountMap,
      priceMap,
      inStockCount,
      onSaleCount,
    };
  }, [allProducts]);

  if (!isOpen) return null;

  // Filter Categories on the Left Column
  const filterCategories: { id: FilterTab; label: string; count?: number }[] = [
    { id: 'Size', label: 'Size', count: selectedSizes.length },
    { id: 'Price', label: 'Price', count: minPrice > 0 || maxPrice < 10000 ? 1 : 0 },
    { id: 'Brand', label: 'Brand', count: brand ? 1 : 0 },
    { id: 'Color', label: 'Color', count: selectedColors.length },
    { id: 'Discount Range', label: 'Discount Range', count: onSaleOnly ? 1 : 0 },
    { id: 'Category', label: 'Category', count: category ? 1 : 0 },
    { id: 'Fit', label: 'Fit', count: selectedFits.length },
    { id: 'Availability', label: 'Availability', count: inStockOnly ? 1 : 0 },
  ];

  // List of Sizes
  const sizeList: { label: ProductSize; count: number }[] = (() => {
    const dynamicSizes = filterFacets?.sizes?.map((s: any) => ({
      label: s.value as ProductSize,
      count: s.count || facetCounts.sizeMap[s.value.toUpperCase()] || 0,
    })) || [];

    const existingValues = new Set(dynamicSizes.map((s: any) => s.label.toUpperCase()));
    const all = [...dynamicSizes];

    STANDARD_SIZES.forEach((std) => {
      if (!existingValues.has(std.toUpperCase())) {
        all.push({
          label: std,
          count: facetCounts.sizeMap[std.toUpperCase()] || 0,
        });
      }
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return all.filter((s) => s.label.toLowerCase().includes(q));
    }
    return all;
  })();

  // List of Brands
  const brandList = (() => {
    const list = (apiBrands || []).map((b) => ({
      id: b.id,
      name: b.name,
      count: facetCounts.brandMap[b.id] || facetCounts.brandMap[b.name.toLowerCase()] || 0,
    }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter((b) => b.name.toLowerCase().includes(q));
    }
    return list;
  })();

  // List of Colors
  const colorList = (() => {
    const list = (availableColors || []).map((colorName) => ({
      name: colorName,
      count: facetCounts.colorMap[colorName.toLowerCase()] || 0,
    }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  })();

  // List of Categories
  const categoryList = (() => {
    const list = (apiCategories || [])
      .filter((c) => c.isActive !== false && !c.parentCategoryId)
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug || cat.name,
        count:
          facetCounts.categoryMap[cat.id] ||
          facetCounts.categoryMap[cat.name.toLowerCase()] ||
          0,
      }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter((c) => c.name.toLowerCase().includes(q));
    }
    return list;
  })();

  // List of Fits
  const fitList = (() => {
    const list = (availableFits || []).map((fitVal) => ({
      name: fitVal,
      count: facetCounts.fitMap[fitVal] || 0,
    }));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter((f) => f.name.toLowerCase().includes(q));
    }
    return list;
  })();

  const handleApplyPrice = () => {
    const minVal = localMin ? Math.max(0, Number(localMin)) : 0;
    const maxVal = localMax ? Math.max(minVal, Number(localMax)) : 10000;
    setPriceRange([minVal, maxVal]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200">
      {/* ─── Top Header (Matches Screenshot: FILTERS) ────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white shrink-0">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800">
          FILTERS
        </h2>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* ─── Two-Column Split Screen (Matches Screenshot) ────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Categories List */}
        <div className="w-[36%] max-w-[145px] bg-[#f5f5f6] border-r border-gray-200 flex flex-col overflow-y-auto no-scrollbar shrink-0">
          {filterCategories.map((cat) => {
            const isActive = activeTab === cat.id;
            const hasApplied = (cat.count || 0) > 0;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={`w-full py-4 px-4 text-xs sm:text-[13px] text-left transition-colors cursor-pointer flex items-center justify-between relative ${
                  isActive
                    ? 'bg-white font-bold text-gray-900 -mr-px border-r border-white z-10'
                    : 'text-gray-700 font-medium hover:bg-gray-200/50'
                }`}
              >
                <span className="truncate">{cat.label}</span>
                {hasApplied && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff3f6c] shrink-0 ml-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Filter Options */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {/* Search Box in Right Pane (Visible for searchable tabs) */}
          {['Size', 'Brand', 'Color', 'Category', 'Fit'].includes(activeTab) && (
            <div className="p-3 border-b border-gray-100 shrink-0">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search by ${activeTab}`}
                  className="w-full bg-[#f5f5f6] border border-gray-200 rounded-sm py-2 pl-9 pr-3 text-xs text-gray-900 placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* 1. SIZE TAB */}
            {activeTab === 'Size' && (
              <div>
                {sizeList.map((item) => {
                  const isChecked = selectedSizes.includes(item.label);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleSize(item.label)}
                      className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      {/* Check Icon (Matches Screenshot) */}
                      <div
                        className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                          isChecked ? 'text-[#ff3f6c]' : 'text-gray-300'
                        }`}
                      >
                        <Check size={16} strokeWidth={isChecked ? 2.5 : 1.75} />
                      </div>

                      {/* Label */}
                      <span className="text-xs sm:text-sm text-gray-800 font-medium">
                        {formatSizeLabel(item.label)}
                      </span>

                      {/* Product Count on the Right */}
                      <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                        {item.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 2. PRICE TAB */}
            {activeTab === 'Price' && (
              <div className="p-4 space-y-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Price Ranges
                  </span>
                  <div className="space-y-1">
                    {PRICE_PRESETS.map((preset) => {
                      const isSelected =
                        minPrice === preset.range[0] && maxPrice === preset.range[1];
                      const count = facetCounts.priceMap[preset.label] || 0;

                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setPriceRange([0, 10000]);
                            } else {
                              setPriceRange(preset.range);
                            }
                          }}
                          className="w-full flex items-center py-3 px-1 border-b border-gray-100 text-left cursor-pointer"
                        >
                          <div
                            className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                              isSelected ? 'text-[#ff3f6c]' : 'text-gray-300'
                            }`}
                          >
                            <Check size={16} strokeWidth={isSelected ? 2.5 : 1.75} />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-800 font-medium">
                            {preset.label}
                          </span>
                          <span className="text-xs text-gray-400 font-normal ml-auto">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                    Custom Range (₹)
                  </span>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={localMin}
                      onChange={(e) => setLocalMin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-none outline-none focus:border-black"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={localMax}
                      onChange={(e) => setLocalMax(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-none outline-none focus:border-black"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyPrice}
                    className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer hover:bg-neutral-800"
                  >
                    Apply Price Range
                  </button>
                </div>
              </div>
            )}

            {/* 3. BRAND TAB */}
            {activeTab === 'Brand' && (
              <div>
                {brandList.length > 0 ? (
                  brandList.map((b) => {
                    const isChecked = brand?.toLowerCase() === b.name.toLowerCase();
                    return (
                      <button
                        key={b.id || b.name}
                        type="button"
                        onClick={() => setBrand(isChecked ? null : b.name)}
                        className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                      >
                        <div
                          className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                            isChecked ? 'text-[#ff3f6c]' : 'text-gray-300'
                          }`}
                        >
                          <Check size={16} strokeWidth={isChecked ? 2.5 : 1.75} />
                        </div>
                        <span className="text-xs sm:text-sm text-gray-800 font-medium">
                          {b.name}
                        </span>
                        <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                          {b.count}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">
                    No brands match your search.
                  </div>
                )}
              </div>
            )}

            {/* 4. COLOR TAB */}
            {activeTab === 'Color' && (
              <div>
                {colorList.map((c) => {
                  const isChecked = selectedColors.includes(c.name);
                  const colorHex = getColorHex(c.name);

                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => toggleColor(c.name)}
                      className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      <div
                        className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                          isChecked ? 'text-[#ff3f6c]' : 'text-gray-300'
                        }`}
                      >
                        <Check size={16} strokeWidth={isChecked ? 2.5 : 1.75} />
                      </div>

                      {/* Color Preview Swatch */}
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-gray-300 mr-2 shrink-0 shadow-2xs"
                        style={{ backgroundColor: colorHex }}
                      />

                      <span className="text-xs sm:text-sm text-gray-800 font-medium capitalize">
                        {c.name}
                      </span>
                      <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 5. DISCOUNT RANGE TAB */}
            {activeTab === 'Discount Range' && (
              <div>
                {DISCOUNT_RANGES.map((d) => {
                  const isSelected = onSaleOnly;
                  const count = facetCounts.discountMap[d.min] || 0;

                  return (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => toggleOnSale()}
                      className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      <div
                        className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                          isSelected ? 'text-[#ff3f6c]' : 'text-gray-300'
                        }`}
                      >
                        <Check size={16} strokeWidth={isSelected ? 2.5 : 1.75} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-800 font-medium">
                        {d.label}
                      </span>
                      <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 6. CATEGORY TAB */}
            {activeTab === 'Category' && (
              <div>
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                >
                  <div
                    className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                      !category ? 'text-[#ff3f6c]' : 'text-gray-300'
                    }`}
                  >
                    <Check size={16} strokeWidth={!category ? 2.5 : 1.75} />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-800 font-bold">
                    All Categories
                  </span>
                  <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                    {allProducts.length}
                  </span>
                </button>

                {categoryList.map((cat) => {
                  const isChecked =
                    category?.toLowerCase() === cat.slug?.toLowerCase() ||
                    category?.toLowerCase() === cat.name.toLowerCase();

                  return (
                    <button
                      key={cat.id || cat.slug}
                      type="button"
                      onClick={() => setCategory(isChecked ? null : cat.slug || cat.name)}
                      className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      <div
                        className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                          isChecked ? 'text-[#ff3f6c]' : 'text-gray-300'
                        }`}
                      >
                        <Check size={16} strokeWidth={isChecked ? 2.5 : 1.75} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-800 font-medium">
                        {cat.name}
                      </span>
                      <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 7. FIT TAB */}
            {activeTab === 'Fit' && (
              <div>
                {fitList.map((f) => {
                  const isChecked = selectedFits.includes(f.name as ProductFit);
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => toggleFit(f.name as ProductFit)}
                      className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                    >
                      <div
                        className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                          isChecked ? 'text-[#ff3f6c]' : 'text-gray-300'
                        }`}
                      >
                        <Check size={16} strokeWidth={isChecked ? 2.5 : 1.75} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-800 font-medium">
                        {f.name}
                      </span>
                      <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* 8. AVAILABILITY TAB */}
            {activeTab === 'Availability' && (
              <div>
                <button
                  type="button"
                  onClick={toggleInStock}
                  className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                >
                  <div
                    className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                      inStockOnly ? 'text-[#ff3f6c]' : 'text-gray-300'
                    }`}
                  >
                    <Check size={16} strokeWidth={inStockOnly ? 2.5 : 1.75} />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-800 font-medium">
                    In Stock Only
                  </span>
                  <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                    {facetCounts.inStockCount}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={toggleOnSale}
                  className="w-full flex items-center py-3.5 px-4 border-b border-gray-100 hover:bg-gray-50/80 active:bg-gray-100 transition-colors text-left cursor-pointer"
                >
                  <div
                    className={`mr-3.5 shrink-0 flex items-center justify-center transition-colors ${
                      onSaleOnly ? 'text-[#ff3f6c]' : 'text-gray-300'
                    }`}
                  >
                    <Check size={16} strokeWidth={onSaleOnly ? 2.5 : 1.75} />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-800 font-medium">
                    On Sale & Special Offers
                  </span>
                  <span className="text-xs text-gray-400 font-normal ml-auto shrink-0">
                    {facetCounts.onSaleCount}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Sticky Action Bar (Matches Screenshot: CLOSE | APPLY) ──── */}
      <div className="border-t border-gray-200 bg-white grid grid-cols-2 pb-[max(0px,env(safe-area-inset-bottom))] shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-200 cursor-pointer text-center"
        >
          CLOSE
        </button>
        <button
          type="button"
          onClick={onClose}
          className="py-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#ff3f6c] hover:bg-rose-50/40 active:bg-rose-50 transition-colors cursor-pointer text-center"
        >
          APPLY
        </button>
      </div>
    </div>
  );
}
