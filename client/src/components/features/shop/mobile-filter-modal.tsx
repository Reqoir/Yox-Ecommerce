"use client";

import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { ALL_CATEGORIES, SUBCATEGORIES_MAP, ALL_COLORS, ALL_SIZES } from '@/constants/products';
import { ProductSize, ProductFit } from '@/types/product';
import { Slider } from '@/components/ui/slider';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileFilterModal({ isOpen, onClose }: MobileFilterModalProps) {
  const {
    category,
    subCategory,
    minPrice,
    maxPrice,
    selectedSizes,
    selectedFits,
    availableSizes,
    availableFits,
    setCategory,
    setSubCategory,
    setPriceRange,
    toggleSize,
    toggleFit,
    clearAllFilters,
    activeFilterCount,
  } = useProductFilters();

  const { categories: apiCategories } = useCategories();

  const [activeTab, setActiveTab] = useState<'Category' | 'Price' | 'Size' | 'Fit'>('Category');
  const [localPrice, setLocalPrice] = useState<[number, number]>([minPrice, maxPrice]);

  React.useEffect(() => {
    setLocalPrice([minPrice, maxPrice]);
  }, [minPrice, maxPrice]);

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

  // Dynamic sizes list
  const displaySizes = useMemo(() => {
    if (availableSizes && availableSizes.length > 0) {
      return availableSizes;
    }
    return ALL_SIZES;
  }, [availableSizes]);

  if (!isOpen) return null;

  const handlePriceSliderChange = (value: number | readonly number[]) => {
    if (Array.isArray(value) && value.length >= 2) {
      const range: [number, number] = [value[0], value[1]];
      setLocalPrice(range);
      setPriceRange(range);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white">
        <button 
          onClick={onClose} 
          className="p-2 -ml-2 bg-gray-100 rounded-full text-gray-700"
        >
          <X size={18} />
        </button>
        <h2 className="text-sm font-bold text-gray-900">
          Filter Men&apos;s Wear {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </h2>
        {activeFilterCount > 0 ? (
          <button 
            onClick={clearAllFilters}
            className="text-xs font-bold text-[#D2925D]"
          >
            Clear All
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Main Body: Left Tabs + Right Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Menu */}
        <div className="w-28 bg-gray-50 border-r border-gray-100 flex flex-col">
          {(['Category', 'Price', 'Size', 'Fit'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-3 text-xs text-left font-semibold border-l-2 transition-colors ${
                activeTab === tab 
                  ? 'bg-white border-[#1A2E4C] text-[#1A2E4C]' 
                  : 'border-transparent text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Right Side Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-white">
          {activeTab === 'Category' && (
            <div className="space-y-2">
              <button
                onClick={() => setCategory(null)}
                className={`w-full flex items-center justify-between p-3 rounded text-xs ${!category ? 'bg-gray-100 font-bold text-[#1A2E4C]' : 'text-gray-700'}`}
              >
                <span>All Men&apos;s Apparel</span>
                {!category && <Check size={16} />}
              </button>

              {displayCategoryTree.map((item) => {
                const isSelected = category?.toLowerCase() === item.name.toLowerCase();
                return (
                  <div key={item.name} className="space-y-1">
                    <button
                      onClick={() => setCategory(isSelected ? null : item.name)}
                      className={`w-full flex items-center justify-between p-3 rounded text-xs transition-colors ${
                        isSelected ? 'bg-[#1A2E4C] text-white font-semibold' : 'text-gray-800 hover:bg-gray-50 border border-gray-100'
                      }`}
                    >
                      <span>{item.name}</span>
                      {isSelected && <Check size={16} />}
                    </button>

                    {isSelected && item.subCategories.length > 0 && (
                      <div className="pl-3 space-y-1.5 pt-1">
                        {item.subCategories.map((sub) => {
                          const isSubSelected = subCategory?.toLowerCase() === sub.toLowerCase();
                          return (
                            <button
                              key={sub}
                              onClick={() => setSubCategory(isSubSelected ? null : sub)}
                              className={`w-full text-left text-xs py-2 px-3 rounded border ${
                                isSubSelected ? 'bg-gray-100 font-bold border-[#1A2E4C] text-[#1A2E4C]' : 'border-gray-100 text-gray-700'
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

          {activeTab === 'Price' && (
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-800 mb-4">Price Range: ₹{localPrice[0]} - ₹{localPrice[1]}</p>
              <Slider
                value={localPrice}
                min={0}
                max={10000}
                step={100}
                onValueChange={handlePriceSliderChange}
              />
            </div>
          )}

          {activeTab === 'Size' && (
            <div className="grid grid-cols-2 gap-2">
              {displaySizes.map((size) => {
                const isSelected = selectedSizes.includes(size as ProductSize);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size as ProductSize)}
                    className={`py-2 text-xs font-semibold rounded border transition-colors ${
                      isSelected ? 'bg-[#1A2E4C] text-white border-[#1A2E4C]' : 'border-gray-200 text-gray-800'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'Fit' && (
            <div className="space-y-2">
              {availableFits.length > 0 ? (
                availableFits.map((fit) => {
                  const isSelected = selectedFits.includes(fit as ProductFit);
                  return (
                    <button
                      key={fit}
                      onClick={() => toggleFit(fit as ProductFit)}
                      className={`w-full flex items-center justify-between p-3 rounded text-xs border ${
                        isSelected ? 'bg-[#1A2E4C] text-white border-[#1A2E4C] font-semibold' : 'border-gray-100 text-gray-800'
                      }`}
                    >
                      <span>{fit}</span>
                      {isSelected && <Check size={16} />}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No fit options available for current products.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-white flex items-center gap-3">
        <button
          onClick={clearAllFilters}
          className="flex-1 py-3 border border-gray-300 text-xs font-bold text-gray-700 rounded"
        >
          Reset All
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-3 bg-[#1A2E4C] text-white text-xs font-bold rounded"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
}
