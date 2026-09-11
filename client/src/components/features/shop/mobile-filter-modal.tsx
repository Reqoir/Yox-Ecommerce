import React, { useState, useMemo } from 'react';
import { X, Check, Sparkles, Flame } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { useCategories } from '@/hooks/admin/useCategories';
import { ProductSize, ProductFit, ProductTag } from '@/types/product';

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
    selectedColors,
    selectedTags,
    inStockOnly,
    onSaleOnly,
    filteredProducts,
    filterFacets,
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

  const { categories: apiCategories } = useCategories();
  const parentCategories = useMemo(() => {
    return (apiCategories || [])
      .filter((c) => c.isActive !== false && !c.parentCategoryId)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [apiCategories]);

  const [activeTab, setActiveTab] = useState<
    'Category' | 'Price' | 'Size' | 'Fit' | 'Color' | 'Tags' | 'Availability'
  >('Category');

  const [localMin, setLocalMin] = useState<string>(minPrice > 0 ? String(minPrice) : '');
  const [localMax, setLocalMax] = useState<string>(maxPrice < 10000 ? String(maxPrice) : '');

  React.useEffect(() => {
    setLocalMin(minPrice > 0 ? String(minPrice) : '');
    setLocalMax(maxPrice < 10000 ? String(maxPrice) : '');
  }, [minPrice, maxPrice]);

  if (!isOpen) return null;

  const handleApplyPrice = () => {
    const minVal = localMin ? Math.max(0, Number(localMin)) : 0;
    const maxVal = localMax ? Math.max(minVal, Number(localMax)) : 10000;
    setPriceRange([minVal, maxVal]);
  };

  const tabs = [
    { id: 'Category', label: 'Category', badge: category ? '1' : null },
    { id: 'Price', label: 'Price', badge: minPrice > 0 || maxPrice < 10000 ? '1' : null },
    { id: 'Size', label: 'Size', badge: selectedSizes.length > 0 ? String(selectedSizes.length) : null },
    { id: 'Fit', label: 'Fit', badge: selectedFits.length > 0 ? String(selectedFits.length) : null },
    { id: 'Color', label: 'Color', badge: selectedColors.length > 0 ? String(selectedColors.length) : null },
    { id: 'Tags', label: 'Tags', badge: selectedTags.length > 0 ? String(selectedTags.length) : null },
    { id: 'Availability', label: 'Deals', badge: inStockOnly || onSaleOnly ? '1' : null },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={onClose}
          className="p-2 -ml-2 bg-gray-100 rounded-none text-gray-700 hover:bg-gray-200 cursor-pointer"
        >
          <X size={18} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-wider text-gray-900">
          Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
        </h2>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-gray-900 hover:text-black tracking-wider uppercase cursor-pointer"
          >
            Clear
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Main Body: Left Tabs + Right Tab Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side Menu */}
        <div className="w-28 bg-gray-50 border-r border-gray-200 flex flex-col overflow-y-auto">
          {tabs.map((tab) => {
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-3 text-xs text-left font-bold border-l-2 transition-colors flex items-center justify-between cursor-pointer ${isCurrent
                    ? 'bg-white border-black text-black'
                    : 'border-transparent text-gray-500 hover:bg-gray-100'
                  }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-4 h-4 rounded-none bg-black text-white text-[9px] flex items-center justify-center font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side Content */}
        <div className="flex-1 p-4 overflow-y-auto bg-white">
          {/* CATEGORY TAB */}
          {activeTab === 'Category' && (
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setCategory(null)}
                className={`w-full flex items-center justify-between p-3 rounded-none text-xs transition-colors cursor-pointer ${!category
                    ? 'bg-black text-white font-bold'
                    : 'text-gray-800 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                <span>All Apparel</span>
                {!category && <Check size={16} />}
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

                const childSubs = apiCategories.filter(
                  (sub) => sub.isActive !== false && sub.parentCategoryId === cat.id
                );

                return (
                  <div key={cat.id || cat.slug} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => setCategory(isSelected && !subCategory ? null : cat.slug || cat.name)}
                      className={`w-full flex items-center justify-between p-3 rounded-none text-xs transition-colors cursor-pointer border ${isSelected
                          ? 'bg-black text-white font-bold border-black'
                          : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                      <span>{cat.name}</span>
                      {isSelected && <Check size={16} />}
                    </button>

                    {/* Subcategories (shown when parent category is active) */}
                    {isSelected && childSubs.length > 0 && (
                      <div className="ml-3 pl-3 border-l-2 border-gray-200 py-1 space-y-1">
                        <button
                          type="button"
                          onClick={() => setCategory(cat.slug || cat.name)}
                          className={`w-full flex items-center justify-between p-2 rounded-none text-xs transition-colors cursor-pointer ${!subCategory && (category?.toLowerCase() === cat.slug.toLowerCase() || category?.toLowerCase() === cat.name.toLowerCase())
                              ? 'bg-gray-100 font-bold text-black'
                              : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                          <span>All {cat.name}</span>
                          {!subCategory && (category?.toLowerCase() === cat.slug.toLowerCase() || category?.toLowerCase() === cat.name.toLowerCase()) && (
                            <Check size={14} className="text-black" />
                          )}
                        </button>

                        {childSubs.map((sub) => {
                          const isSubSelected =
                            subCategory?.toLowerCase() === sub.slug?.toLowerCase() ||
                            subCategory?.toLowerCase() === sub.name?.toLowerCase() ||
                            category?.toLowerCase() === sub.slug?.toLowerCase() ||
                            category?.toLowerCase() === sub.name?.toLowerCase();

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
                              className={`w-full flex items-center justify-between p-2 rounded-none text-xs transition-colors cursor-pointer ${isSubSelected
                                  ? 'bg-black text-white font-bold'
                                  : 'text-gray-600 hover:bg-gray-50 border border-gray-100'
                                }`}
                            >
                              <span>{sub.name}</span>
                              {isSubSelected && <Check size={14} />}
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

          {/* PRICE TAB */}
          {activeTab === 'Price' && (
            <div className="space-y-4 pt-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-900 block">
                  Custom Price Range (₹)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={localMin}
                    onChange={(e) => setLocalMin(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-gray-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={localMax}
                    onChange={(e) => setLocalMax(e.target.value)}
                    className="w-full px-3 py-2 text-xs text-gray-900 bg-white placeholder:text-gray-400 border border-gray-300 rounded-none focus:outline-none focus:border-black focus:ring-1 focus:ring-black font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPrice}
                  className="w-full py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none"
                >
                  Set Price Range
                </button>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Quick Presets
                </span>
                {[
                  { label: 'Under ₹2,000', range: [0, 2000] as [number, number] },
                  { label: '₹2,000 - ₹3,500', range: [2000, 3500] as [number, number] },
                  { label: '₹3,500 & Above', range: [3500, 10000] as [number, number] },
                ].map((preset) => {
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
                      className={`w-full text-left text-xs py-2 px-3 rounded-none border transition-colors ${isCurrent
                          ? 'bg-black text-white font-bold border-black'
                          : 'border-gray-200 text-gray-800'
                        }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SIZE TAB */}
          {activeTab === 'Size' && (
            <div className="grid grid-cols-2 gap-2">
              {(filterFacets?.sizes || availableSizes.map((s) => ({ value: s, count: 0 }))).map(
                (sizeItem: any) => {
                  const sizeVal = sizeItem.value as ProductSize;
                  const isSelected = selectedSizes.includes(sizeVal);
                  return (
                    <button
                      key={sizeVal}
                      type="button"
                      onClick={() => toggleSize(sizeVal)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-none border transition-all cursor-pointer flex items-center justify-between ${isSelected
                          ? 'bg-black text-white border-black'
                          : 'border-gray-200 text-gray-800 hover:border-black'
                        }`}
                    >
                      <span>{sizeVal}</span>
                      {sizeItem.count > 0 && (
                        <span
                          className={`text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-400'
                            }`}
                        >
                          ({sizeItem.count})
                        </span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* FIT TAB */}
          {activeTab === 'Fit' && (
            <div className="space-y-2">
              {(filterFacets?.fits || availableFits.map((f) => ({ value: f, count: 0 }))).map(
                (fitItem: any) => {
                  const fitVal = fitItem.value as ProductFit;
                  const isSelected = selectedFits.includes(fitVal);
                  return (
                    <button
                      key={fitVal}
                      type="button"
                      onClick={() => toggleFit(fitVal)}
                      className={`w-full flex items-center justify-between p-3 rounded-none text-xs border transition-colors ${isSelected
                          ? 'bg-black text-white border-black font-bold'
                          : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                      <span>{fitVal}</span>
                      <div className="flex items-center gap-1.5">
                        {fitItem.count > 0 && (
                          <span className="text-[10px] opacity-70">({fitItem.count})</span>
                        )}
                        {isSelected && <Check size={16} />}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* COLOR TAB */}
          {activeTab === 'Color' && (
            <div className="space-y-2">
              {(filterFacets?.colors || availableColors.map((c) => ({ value: c, count: 0 }))).map(
                (colorItem: any) => {
                  const colorName = colorItem.value;
                  const isSelected = selectedColors.includes(colorName);
                  return (
                    <button
                      key={colorName}
                      type="button"
                      onClick={() => toggleColor(colorName)}
                      className={`w-full flex items-center justify-between p-3 rounded-none text-xs border transition-colors ${isSelected
                          ? 'bg-black text-white border-black font-bold'
                          : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                        }`}
                    >
                      <span className="capitalize">{colorName}</span>
                      <div className="flex items-center gap-1.5">
                        {colorItem.count > 0 && (
                          <span className="text-[10px] opacity-70">({colorItem.count})</span>
                        )}
                        {isSelected && <Check size={16} />}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* TAGS TAB */}
          {activeTab === 'Tags' && (
            <div className="flex flex-wrap gap-2">
              {(filterFacets?.tags || availableTags.map((t) => ({ value: t, count: 0 }))).map(
                (tagItem: any) => {
                  const tagVal = tagItem.value as ProductTag;
                  const isSelected = selectedTags.includes(tagVal);
                  return (
                    <button
                      key={tagVal}
                      type="button"
                      onClick={() => toggleTag(tagVal)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-none text-xs font-bold border transition-colors ${isSelected
                          ? 'bg-amber-400 text-black border-amber-400 font-extrabold shadow-xs'
                          : 'border-gray-200 text-gray-800'
                        }`}
                    >
                      <Sparkles size={12} />
                      <span>{tagVal}</span>
                      {tagItem.count > 0 && (
                        <span className="text-[10px] opacity-70">({tagItem.count})</span>
                      )}
                    </button>
                  );
                }
              )}
            </div>
          )}

          {/* AVAILABILITY TAB */}
          {activeTab === 'Availability' && (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={toggleInStock}
                className={`w-full flex items-center justify-between p-3 rounded-none text-xs border transition-colors ${inStockOnly
                    ? 'bg-black text-white border-black font-bold'
                    : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <span>In Stock Only</span>
                {inStockOnly && <Check size={16} />}
              </button>

              <button
                type="button"
                onClick={toggleOnSale}
                className={`w-full flex items-center justify-between p-3 rounded-none text-xs border transition-colors ${onSaleOnly
                    ? 'bg-rose-600 text-white border-rose-600 font-bold'
                    : 'border-gray-200 text-gray-800 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <Flame size={14} className={onSaleOnly ? 'text-white' : 'text-rose-600'} />
                  <span>On Sale & Special Offers</span>
                </div>
                {onSaleOnly && <Check size={16} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex items-center gap-3">
        <button
          type="button"
          onClick={clearAllFilters}
          className="flex-1 py-3 border border-gray-300 text-xs font-bold uppercase tracking-wider text-gray-700 rounded-none hover:bg-gray-50 cursor-pointer"
        >
          Reset All
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-none hover:bg-gray-900 cursor-pointer shadow-md"
        >
          View {filteredProducts.length} Items
        </button>
      </div>
    </div>
  );
}
