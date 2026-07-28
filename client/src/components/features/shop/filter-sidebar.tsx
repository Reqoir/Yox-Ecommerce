"use client";

import React, { useState, useMemo } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { ALL_CATEGORIES, SUBCATEGORIES_MAP, ALL_COLORS, ALL_SIZES, getColorHex } from '@/constants/products';
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
    clearAllFilters,
    activeFilterCount,
  } = useProductFilters();

  const { categories: apiCategories } = useCategories();

  const [expandedSection, setExpandedSection] = useState<string | null>('Price');
  const [localPrice, setLocalPrice] = useState<[number, number]>([minPrice, maxPrice]);

  React.useEffect(() => {
    setLocalPrice([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handlePriceSliderChange = (value: number | readonly number[]) => {
    if (Array.isArray(value) && value.length >= 2) {
      const range: [number, number] = [value[0], value[1]];
      setLocalPrice(range);
      setPriceRange(range);
    }
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(0, parseInt(e.target.value) || 0);
    const range: [number, number] = [val, localPrice[1]];
    setLocalPrice(range);
    setPriceRange(range);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(10000, parseInt(e.target.value) || 10000);
    const range: [number, number] = [localPrice[0], val];
    setLocalPrice(range);
    setPriceRange(range);
  };

  // Build category & subcategory tree dynamically from API (if available), or static dataset
  const displayCategoryTree = useMemo(() => {
    if (apiCategories && apiCategories.length > 0) {
      const parents = apiCategories.filter(c => !c.parentCategoryId);
      return parents.map(parent => {
        const subs = apiCategories.filter(c => c.parentCategoryId === parent.id);
        return {
          name: parent.name,
          subCategories: subs.map(s => s.name)
        };
      });
    }
    // Static fallback
    return ALL_CATEGORIES.map(cat => ({
      name: cat,
      subCategories: SUBCATEGORIES_MAP[cat] || []
    }));
  }, [apiCategories]);

  // List of sizes to render: dynamic sizes present in catalog or ALL_SIZES fallback
  const displaySizes = useMemo(() => {
    if (availableSizes && availableSizes.length > 0) {
      return availableSizes;
    }
    return ALL_SIZES;
  }, [availableSizes]);

  return (
    <div className="w-full bg-white pr-6 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto [scrollbar-width:thin]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h2>
          {activeFilterCount > 0 && (
            <span className="bg-[#1A2E4C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        
        {activeFilterCount > 0 && (
          <button 
            onClick={clearAllFilters}
            className="text-xs font-semibold text-[#D2925D] hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="py-2 space-y-1">
        
        {/* Price Section */}
        <div className="py-4 border-b border-gray-100">
          <button 
            className="w-full flex items-center justify-between group"
            onClick={() => toggleSection('Price')}
          >
            <span className="text-sm font-bold text-gray-900">Price Range</span>
            {expandedSection === 'Price' ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          
          {expandedSection === 'Price' && (
            <div className="mt-4 pt-2 px-1">
              <Slider 
                value={localPrice} 
                min={0} 
                max={10000} 
                step={100} 
                onValueChange={handlePriceSliderChange}
                className="my-4"
              />
              
              <div className="flex items-end justify-between gap-2 mt-6">
                <div className="flex-1">
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">Min Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                    <input 
                      type="number" 
                      value={localPrice[0]} 
                      onChange={handleMinInputChange}
                      className="w-full border border-gray-300 rounded-[2px] py-1.5 pl-6 pr-2 text-xs text-gray-800 outline-none focus:border-[#1A2E4C]"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-gray-500 mb-1 font-medium">Max Price</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                    <input 
                      type="number" 
                      value={localPrice[1]} 
                      onChange={handleMaxInputChange}
                      className="w-full border border-gray-300 rounded-[2px] py-1.5 pl-6 pr-2 text-xs text-gray-800 outline-none focus:border-[#1A2E4C]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories & Subcategories Section */}
        <div className="py-4 border-b border-gray-100">
          <button 
            className="w-full flex items-center justify-between group"
            onClick={() => toggleSection('Categories')}
          >
            <span className="text-sm font-bold text-gray-900">Categories</span>
            {expandedSection === 'Categories' ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          
          {expandedSection === 'Categories' && (
            <div className="mt-3 space-y-2">
              <button
                onClick={() => setCategory(null)}
                className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded ${!category ? 'bg-gray-100 font-bold text-[#1A2E4C]' : 'text-gray-600 hover:text-black'}`}
              >
                <span>All Men&apos;s Apparel</span>
                {!category && <Check size={14} />}
              </button>
              {displayCategoryTree.map((item) => {
                const isSelected = category?.toLowerCase() === item.name.toLowerCase();
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => setCategory(isSelected ? null : item.name)}
                      className={`w-full flex items-center justify-between text-xs py-1.5 px-2 rounded transition-colors ${isSelected ? 'bg-[#1A2E4C] text-white font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <span>{item.name}</span>
                      {isSelected && <Check size={14} />}
                    </button>

                    {/* Subcategories list when parent category is selected */}
                    {isSelected && item.subCategories.length > 0 && (
                      <div className="pl-4 space-y-1 pt-1 border-l-2 border-gray-100 ml-2">
                        {item.subCategories.map((sub) => {
                          const isSubSelected = subCategory?.toLowerCase() === sub.toLowerCase();
                          return (
                            <button
                              key={sub}
                              onClick={() => setSubCategory(isSubSelected ? null : sub)}
                              className={`w-full text-left text-[11px] py-1 px-2 rounded transition-colors ${
                                isSubSelected ? 'font-bold text-[#1A2E4C] bg-gray-100' : 'text-gray-600 hover:text-black'
                              }`}
                            >
                              • {sub}
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

        {/* Dynamic Sizes Section */}
        <div className="py-4 border-b border-gray-100">
          <button 
            className="w-full flex items-center justify-between group"
            onClick={() => toggleSection('Size')}
          >
            <span className="text-sm font-bold text-gray-900">Sizes</span>
            {expandedSection === 'Size' ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          
          {expandedSection === 'Size' && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {displaySizes.map((size) => {
                const isSelected = selectedSizes.includes(size as ProductSize);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size as ProductSize)}
                    className={`py-1.5 text-xs font-semibold rounded border transition-all ${
                      isSelected 
                        ? 'bg-[#1A2E4C] text-white border-[#1A2E4C]' 
                        : 'border-gray-300 text-gray-700 hover:border-gray-900'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Fits Section */}
        {availableFits.length > 0 && (
          <div className="py-4 border-b border-gray-100">
            <button 
              className="w-full flex items-center justify-between group"
              onClick={() => toggleSection('Fit')}
            >
              <span className="text-sm font-bold text-gray-900">Fit</span>
              {expandedSection === 'Fit' ? <Minus size={16} /> : <Plus size={16} />}
            </button>
            
            {expandedSection === 'Fit' && (
              <div className="mt-3 space-y-2">
                {availableFits.map((fit) => {
                  const isSelected = selectedFits.includes(fit as ProductFit);
                  return (
                    <label key={fit} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-black">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleFit(fit as ProductFit)}
                        className="rounded border-gray-300 text-[#1A2E4C] focus:ring-0"
                      />
                      <span>{fit}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Colors Section (Backend/Catalog Colors Only) */}
        {availableColors.length > 0 && (
          <div className="py-4 border-b border-gray-100">
            <button 
              className="w-full flex items-center justify-between group"
              onClick={() => toggleSection('Colors')}
            >
              <span className="text-sm font-bold text-gray-900">Colors ({availableColors.length})</span>
              {expandedSection === 'Colors' ? <Minus size={16} /> : <Plus size={16} />}
            </button>
            
            {expandedSection === 'Colors' && (
              <div className="mt-3 flex flex-wrap gap-2">
                {availableColors.map((colorName) => {
                  const isSelected = selectedColors.includes(colorName);
                  const hex = getColorHex(colorName);
                  return (
                    <button
                      key={colorName}
                      title={colorName}
                      onClick={() => toggleColor(colorName)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'bg-[#1A2E4C] text-white border-[#1A2E4C] shadow-sm' 
                          : 'border-gray-200 text-gray-700 hover:border-gray-400 bg-white'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: hex }} 
                      />
                      <span>{colorName}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Tags Section */}
        {availableTags.length > 0 && (
          <div className="py-4 border-b border-gray-100">
            <button 
              className="w-full flex items-center justify-between group"
              onClick={() => toggleSection('Offers')}
            >
              <span className="text-sm font-bold text-gray-900">Promotions & Tags</span>
              {expandedSection === 'Offers' ? <Minus size={16} /> : <Plus size={16} />}
            </button>
            
            {expandedSection === 'Offers' && (
              <div className="mt-3 space-y-2">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <label key={tag} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:text-black">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleTag(tag)}
                        className="rounded border-gray-300 text-[#1A2E4C] focus:ring-0"
                      />
                      <span className="font-semibold text-gray-800">{tag}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
