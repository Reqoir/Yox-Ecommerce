'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, X, Check, Sparkles, Flame, Tag as TagIcon, ArrowRight, RotateCcw } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { ProductSize, ProductFit, ProductTag } from '@/types/product';

export function FilterSidebar() {
  const {
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    selectedColors,
    selectedTags,
    inStockOnly,
    onSaleOnly,
    filteredProducts,
    allProducts,
    filterFacets,
    isFacetsLoading,
    availableSizes,
    availableFits,
    availableColors,
    availableTags,
    setCategory,
    setSubCategory,
    setPriceRange,
    toggleSize,
    toggleFit,
    toggleColor,
    toggleTag,
    toggleInStock,
    toggleOnSale,
    clearAllFilters,
    activeFilterCount,
  } = useProductFilters();

  // Default all sections collapsed with plus button as requested
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const { categories: apiCategories } = useCategories();
  const parentCategories = useMemo(() => {
    return apiCategories.filter((c) => c.isActive && !c.parentCategoryId);
  }, [apiCategories]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Local price input state
  const defaultMin = filterFacets?.priceRange?.min || 0;
  const defaultMax = filterFacets?.priceRange?.max || 10000;

  const [inputMin, setInputMin] = useState<string>(minPrice > 0 ? String(minPrice) : '');
  const [inputMax, setInputMax] = useState<string>(maxPrice < 10000 ? String(maxPrice) : '');

  useEffect(() => {
    setInputMin(minPrice > 0 ? String(minPrice) : '');
    setInputMax(maxPrice < 10000 ? String(maxPrice) : '');
  }, [minPrice, maxPrice]);

  const handleApplyPriceInputs = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minVal = inputMin ? Math.max(0, Number(inputMin)) : 0;
    const maxVal = inputMax ? Math.max(minVal, Number(inputMax)) : 10000;
    setPriceRange([minVal, maxVal]);
  };

  // Quick price presets
  const pricePresets = [
    { label: 'Under ₹2,000', range: [0, 2000] as [number, number] },
    { label: '₹2,000 - ₹3,500', range: [2000, 3500] as [number, number] },
    { label: '₹3,500 & Above', range: [3500, 10000] as [number, number] },
  ];

  // Helper to color-match swatch
  const getColorHex = (colorName: string): string => {
    const lower = colorName.toLowerCase();
    if (lower.includes('white')) return '#FFFFFF';
    if (lower.includes('black')) return '#18181B';
    if (lower.includes('brown')) return '#5D4037';
    if (lower.includes('beige')) return '#D7CCC8';
    if (lower.includes('yellow')) return '#FBC02D';
    if (lower.includes('red')) return '#D32F2F';
    if (lower.includes('grey') || lower.includes('gray')) return '#9E9E9E';
    if (lower.includes('green') || lower.includes('khaki')) return '#4E5A44';
    if (lower.includes('denim') || lower.includes('blue')) return '#3F51B5';
    if (lower.includes('navy')) return '#1A237E';
    return '#E0E0E0';
  };

  return (
    <aside className="w-full bg-white px-4 lg:px-6 py-6 flex flex-col h-full text-left select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-900">
            Filters
          </h2>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-black text-white text-[10px] font-extrabold">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-medium text-gray-500 hover:text-black tracking-wider uppercase transition-colors cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Applied Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="py-2.5 border-b border-gray-100 flex flex-wrap gap-1.5 shrink-0 max-h-24 overflow-y-auto [scrollbar-width:none]">
          {category && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              <span className="capitalize">{category}</span>
              <button
                type="button"
                onClick={() => setCategory(null)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {subCategory && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              <span className="capitalize">{subCategory}</span>
              <button
                type="button"
                onClick={() => setSubCategory(null)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {(minPrice > 0 || maxPrice < 10000) && (
            <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200">
              <span>₹{minPrice} - ₹{maxPrice >= 10000 ? '10,000+' : maxPrice}</span>
              <button
                type="button"
                onClick={() => setPriceRange([0, 10000])}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedSizes.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 bg-black text-white text-[10px] font-medium px-2 py-0.5 rounded-full"
            >
              <span>Size: {s}</span>
              <button
                type="button"
                onClick={() => toggleSize(s)}
                className="hover:text-rose-300 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {selectedFits.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200"
            >
              <span>{f}</span>
              <button
                type="button"
                onClick={() => toggleFit(f)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {selectedColors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-900 text-[10px] font-medium px-2 py-0.5 rounded-full border border-gray-200"
            >
              <span>{c}</span>
              <button
                type="button"
                onClick={() => toggleColor(c)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {selectedTags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 bg-amber-100 text-amber-950 text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-200"
            >
              <span>{t}</span>
              <button
                type="button"
                onClick={() => toggleTag(t)}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {inStockOnly && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-emerald-200">
              <span>In Stock</span>
              <button
                type="button"
                onClick={toggleInStock}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {onSaleOnly && (
            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-800 text-[10px] font-medium px-2 py-0.5 rounded-full border border-rose-200">
              <span>On Sale</span>
              <button
                type="button"
                onClick={toggleOnSale}
                className="hover:text-rose-500 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Scrollable Filter Categories */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden divide-y divide-gray-100">
        {/* 1. CATEGORY ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('CATEGORY')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Category
            </span>
            {openSections.CATEGORY ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.CATEGORY && (
            <div className="mt-3 space-y-1 text-xs">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`w-full flex items-center justify-between py-1.5 px-2 rounded transition-colors cursor-pointer ${!category
                    ? 'bg-gray-100 font-medium text-black'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                  }`}
              >
                <span>All Apparel</span>
                {!category && <Check size={13} className="text-black" />}
              </button>

              {parentCategories.map((cat) => {
                const isSelected =
                  category?.toLowerCase() === cat.slug.toLowerCase() ||
                  category?.toLowerCase() === cat.name.toLowerCase() ||
                  apiCategories.some(
                    (sub) =>
                      sub.parentCategoryId === cat.id &&
                      (sub.slug?.toLowerCase() === category?.toLowerCase() ||
                        sub.name.toLowerCase() === category?.toLowerCase())
                  );

                // Count products in this parent category (including its subcategories)
                const count = allProducts.filter(
                  (p) =>
                    p.categoryId === cat.id ||
                    p.category?.toLowerCase() === cat.name.toLowerCase() ||
                    p.category?.toLowerCase() === cat.slug.toLowerCase()
                ).length;

                // Child subcategories belonging to this parent category
                const childSubs = apiCategories.filter(
                  (sub) => sub.isActive !== false && sub.parentCategoryId === cat.id
                );

                return (
                  <div key={cat.id || cat.slug} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setCategory(isSelected && !subCategory ? null : cat.slug || cat.name)}
                      className={`w-full flex items-center justify-between py-1.5 px-2 rounded transition-colors cursor-pointer ${isSelected
                          ? 'bg-black text-white font-medium'
                          : 'text-gray-700 hover:text-black hover:bg-gray-50'
                        }`}
                    >
                      <span className="truncate pr-2">{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-white/20 text-white' : 'text-gray-400 bg-gray-100'
                          }`}
                      >
                        {count}
                      </span>
                    </button>

                    {/* Subcategories (shown when parent category is active) */}
                    {isSelected && childSubs.length > 0 && (
                      <div className="ml-2 pl-2.5 border-l-2 border-gray-200 py-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => setCategory(cat.slug || cat.name)}
                          className={`w-full flex items-center justify-between py-1 px-1.5 rounded text-xs transition-colors cursor-pointer ${!subCategory && (category?.toLowerCase() === cat.slug.toLowerCase() || category?.toLowerCase() === cat.name.toLowerCase())
                              ? 'bg-gray-100 font-medium text-black'
                              : 'text-gray-500 hover:text-black hover:bg-gray-50'
                            }`}
                        >
                          <span>All {cat.name}</span>
                          {!subCategory && (category?.toLowerCase() === cat.slug.toLowerCase() || category?.toLowerCase() === cat.name.toLowerCase()) && (
                            <Check size={12} className="text-black" />
                          )}
                        </button>

                        {childSubs.map((sub) => {
                          const isSubSelected =
                            subCategory?.toLowerCase() === sub.slug?.toLowerCase() ||
                            subCategory?.toLowerCase() === sub.name?.toLowerCase() ||
                            category?.toLowerCase() === sub.slug?.toLowerCase() ||
                            category?.toLowerCase() === sub.name?.toLowerCase();

                          const subCount = allProducts.filter(
                            (p) =>
                              p.subCategoryId === sub.id ||
                              p.subCategory?.toLowerCase() === sub.name?.toLowerCase() ||
                              p.subCategory?.toLowerCase() === sub.slug?.toLowerCase()
                          ).length;

                          return (
                            <button
                              key={sub.id || sub.slug}
                              type="button"
                              onClick={() => {
                                if (isSubSelected) {
                                  setCategory(cat.slug || cat.name);
                                } else {
                                  setCategory(sub.slug || sub.name);
                                }
                              }}
                              className={`w-full flex items-center justify-between py-1 px-1.5 rounded text-xs transition-colors cursor-pointer ${isSubSelected
                                  ? 'bg-black text-white font-medium'
                                  : 'text-gray-600 hover:text-black hover:bg-gray-50'
                                }`}
                            >
                              <span className="truncate pr-1.5">{sub.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isSubSelected ? 'bg-white/20 text-white' : 'text-gray-400 bg-gray-100'
                                  }`}
                              >
                                {subCount}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 2. PRICE ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('PRICE')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Price (₹)
            </span>
            {openSections.PRICE ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.PRICE && (
            <div className="mt-3 space-y-2.5">
              {/* Quick Presets */}
              <div className="flex flex-col gap-1">
                {pricePresets.map((preset) => {
                  const isCurrent =
                    minPrice === preset.range[0] && maxPrice === preset.range[1];
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        isCurrent
                          ? setPriceRange([0, 10000])
                          : setPriceRange(preset.range)
                      }
                      className={`w-full text-left text-xs py-1 px-2 rounded transition-colors cursor-pointer ${isCurrent
                          ? 'bg-gray-900 text-white font-medium'
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                        }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Min - Max Inputs */}
              <form onSubmit={handleApplyPriceInputs} className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={inputMin}
                      onChange={(e) => setInputMin(e.target.value)}
                      className="w-full pl-5 pr-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  <span className="text-gray-400 text-xs">-</span>
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">₹</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={inputMax}
                      onChange={(e) => setInputMax(e.target.value)}
                      className="w-full pl-5 pr-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-black"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2 py-1 bg-black text-white text-[10px] font-medium uppercase tracking-wider rounded hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    Go
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* 3. SIZE ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('SIZE')}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                Size
              </span>
              {selectedSizes.length > 0 && (
                <span className="text-[10px] font-medium text-gray-500">
                  ({selectedSizes.length})
                </span>
              )}
            </div>
            {openSections.SIZE ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.SIZE && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {(filterFacets?.sizes || availableSizes.map((s) => ({ value: s, count: 0 }))).map(
                (sizeItem: any) => {
                  const sizeVal = sizeItem.value as ProductSize;
                  const isSelected = selectedSizes.includes(sizeVal);
                  return (
                    <button
                      key={sizeVal}
                      type="button"
                      onClick={() => toggleSize(sizeVal)}
                      className={`relative py-2 px-1 text-xs font-medium rounded border transition-all cursor-pointer ${isSelected
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'border-gray-200 text-gray-800 hover:border-black'
                        }`}
                    >
                      <span>{sizeVal}</span>
                      {sizeItem.count > 0 && (
                        <span
                          className={`block text-[9px] font-normal leading-none mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'
                            }`}
                        >
                          {sizeItem.count}
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* 4. FIT ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('FIT')}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                Fit
              </span>
              {selectedFits.length > 0 && (
                <span className="text-[10px] font-medium text-gray-500">
                  ({selectedFits.length})
                </span>
              )}
            </div>
            {openSections.FIT ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.FIT && (
            <div className="mt-3 space-y-1.5">
              {(filterFacets?.fits || availableFits.map((f) => ({ value: f, count: 0 }))).map(
                (fitItem: any) => {
                  const fitVal = fitItem.value as ProductFit;
                  const isSelected = selectedFits.includes(fitVal);
                  return (
                    <label
                      key={fitVal}
                      onClick={() => toggleFit(fitVal)}
                      className="flex items-center justify-between py-1 px-1 rounded hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${isSelected
                              ? 'bg-black border-black text-white'
                              : 'border-gray-300 group-hover:border-black'
                            }`}
                        >
                          {isSelected && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="text-xs text-gray-800">{fitVal}</span>
                      </div>
                      {fitItem.count > 0 && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {fitItem.count}
                        </span>
                      )}
                    </label>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* 5. COLOR ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('COLOR')}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                Color
              </span>
              {selectedColors.length > 0 && (
                <span className="text-[10px] font-medium text-gray-500">
                  ({selectedColors.length})
                </span>
              )}
            </div>
            {openSections.COLOR ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.COLOR && (
            <div className="mt-3 flex flex-wrap gap-2 max-h-60 overflow-y-auto [scrollbar-width:none]">
              {(filterFacets?.colors || availableColors.map((c) => ({ value: c, count: 0 }))).map(
                (colorItem: any) => {
                  const colorName = colorItem.value;
                  const isSelected = selectedColors.includes(colorName);
                  const swatch = getColorHex(colorName);

                  return (
                    <label
                      key={colorName}
                      onClick={() => toggleColor(colorName)}
                      className={`flex items-center gap-2 py-1.5 px-2.5 border rounded-sm transition-colors cursor-pointer bg-white ${
                        isSelected ? 'border-gray-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div
                        className="w-3.5 h-3.5 shrink-0 border border-gray-200/50"
                        style={{ backgroundColor: swatch }}
                      />
                      <span className="text-xs font-normal text-gray-800 capitalize">
                        {colorName}
                      </span>
                    </label>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* 6. TAGS & COLLECTIONS ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('TAGS')}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
                Collections & Tags
              </span>
              {selectedTags.length > 0 && (
                <span className="text-[10px] font-medium text-gray-500">
                  ({selectedTags.length})
                </span>
              )}
            </div>
            {openSections.TAGS ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.TAGS && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(filterFacets?.tags || availableTags.map((t) => ({ value: t, count: 0 }))).map(
                (tagItem: any) => {
                  const tagVal = tagItem.value as ProductTag;
                  const isSelected = selectedTags.includes(tagVal);
                  return (
                    <button
                      key={tagVal}
                      type="button"
                      onClick={() => toggleTag(tagVal)}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider transition-colors cursor-pointer border ${isSelected
                          ? 'bg-amber-400 text-black border-amber-400 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <Sparkles size={10} />
                      <span>{tagVal}</span>
                      {tagItem.count > 0 && (
                        <span className="text-[9px] opacity-70">({tagItem.count})</span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* 7. AVAILABILITY & DEALS ACCORDION */}
        <div className="py-3.5">
          <button
            type="button"
            className="w-full flex items-center justify-between group hover:opacity-75 transition-opacity cursor-pointer"
            onClick={() => toggleSection('AVAILABILITY')}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              Availability & Deals
            </span>
            {openSections.AVAILABILITY ? (
              <Minus size={14} className="text-gray-400 group-hover:text-black" />
            ) : (
              <Plus size={14} className="text-gray-400 group-hover:text-black" />
            )}
          </button>

          {openSections.AVAILABILITY && (
            <div className="mt-3 space-y-2 text-xs">
              {/* In Stock Toggle */}
              <label
                onClick={toggleInStock}
                className="flex items-center justify-between py-1 px-1 rounded hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${inStockOnly
                        ? 'bg-black border-black text-white'
                        : 'border-gray-300 group-hover:border-black'
                      }`}
                  >
                    {inStockOnly && <Check size={10} strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-gray-800 font-medium">In Stock Only</span>
                </div>
              </label>

              {/* On Sale Toggle */}
              <label
                onClick={toggleOnSale}
                className="flex items-center justify-between py-1 px-1 rounded hover:bg-gray-50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${onSaleOnly
                        ? 'bg-rose-600 border-rose-600 text-white'
                        : 'border-gray-300 group-hover:border-black'
                      }`}
                  >
                    {onSaleOnly && <Check size={10} strokeWidth={3} />}
                  </div>
                  <span className="text-xs text-gray-800 font-medium flex items-center gap-1">
                    <Flame size={12} className="text-rose-600" />
                    <span>Special Deals & Sale</span>
                  </span>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
