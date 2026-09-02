"use client";

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';

const FILTER_CATEGORIES = [
  'DELIVERY TIME',
  'SIZE',
  'COLOR',
  'PATTERN',
  'FIT',
  'MATERIAL',
  'COLLAR',
  'SLEEVES',
  'PRICE'
];

export function FilterSidebar() {
  const { clearAllFilters } = useProductFilters();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="w-full bg-white pr-4 lg:pr-8 flex flex-col h-full sticky top-20 max-h-[calc(100vh-6rem)]">
      
      <div className="pb-4">
        <h2 className="text-[12px] font-extrabold text-black uppercase tracking-wider">Filters</h2>
      </div>

      <div className="flex-1 overflow-y-auto [scrollbar-width:none]">
        <div className="flex flex-col">
          {FILTER_CATEGORIES.map((cat) => (
            <div key={cat} className="border-b border-gray-200 py-4">
              <button 
                className="w-full flex items-center justify-between group hover:opacity-70 transition-opacity cursor-pointer"
                onClick={() => toggleSection(cat)}
              >
                <span className="text-[11px] font-semibold text-black tracking-wide uppercase">{cat}</span>
                {expandedSection === cat ? (
                  <Minus size={16} className="text-gray-400" strokeWidth={1.5} />
                ) : (
                  <Plus size={16} className="text-gray-400" strokeWidth={1.5} />
                )}
              </button>
              
              {/* Dummy content for expanded state */}
              {expandedSection === cat && (
                <div className="mt-4 text-xs text-gray-500 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-black">
                    <input type="checkbox" className="rounded-sm border-gray-300" />
                    <span>Option 1</span>
                  </label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer hover:text-black">
                    <input type="checkbox" className="rounded-sm border-gray-300" />
                    <span>Option 2</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="pt-6 pb-2 flex items-center gap-2">
        <button 
          onClick={clearAllFilters}
          className="flex-1 bg-white text-black border border-black text-[11px] font-bold py-3 uppercase tracking-widest hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Clear
        </button>
        <button 
          className="flex-1 bg-black text-white border border-black text-[11px] font-bold py-3 uppercase tracking-widest hover:bg-gray-900 transition-colors cursor-pointer"
        >
          Apply (1692)
        </button>
      </div>
      
    </div>
  );
}
