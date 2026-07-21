"use client";

import React, { useState } from 'react';
import { Plus, Minus, ChevronRight } from 'lucide-react';

const FILTER_CATEGORIES = [
  'Size', 'Promotions', 'Color', 'Discount', 'Design', 'Gender', 
  'Sleeve Length', 'Fit', 'Fabric', 'Type', 'Style', 'Brand', 'Pack Size'
];

export function FilterSidebar() {
  const [expandedSection, setExpandedSection] = useState<string | null>('Price');

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="w-full bg-white pr-6 sticky top-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Filters</h2>
        <button className="text-sm font-medium text-[#D2925D] hover:underline">Clear all</button>
      </div>

      <div className="py-2">
        {/* Price Section (Custom) */}
        <div className="py-4 border-b border-gray-100">
          <button 
            className="w-full flex items-center justify-between group"
            onClick={() => toggleSection('Price')}
          >
            <span className="text-sm font-bold text-gray-900">Price</span>
            {expandedSection === 'Price' ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          
          {expandedSection === 'Price' && (
            <div className="mt-4 pt-2">
              {/* Fake Slider */}
              <div className="relative w-full h-1 bg-gray-200 rounded my-4">
                <div className="absolute top-0 left-0 h-full bg-[#D2925D] w-full rounded"></div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#D2925D] shadow cursor-pointer"></div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#D2925D] shadow cursor-pointer"></div>
              </div>
              
              {/* Min/Max Inputs */}
              <div className="flex items-end justify-between gap-2 mt-6">
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Minimum</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input 
                      type="text" 
                      defaultValue="174" 
                      className="w-full border border-gray-300 rounded-[2px] py-1.5 pl-6 pr-2 text-sm text-gray-800 outline-none focus:border-[#D2925D]"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-gray-600 mb-1">Maximum</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <input 
                      type="text" 
                      defaultValue="1438" 
                      className="w-full border border-gray-300 rounded-[2px] py-1.5 pl-6 pr-2 text-sm text-gray-800 outline-none focus:border-[#D2925D]"
                    />
                  </div>
                </div>
                <button className="h-[34px] w-[34px] flex items-center justify-center border border-gray-300 rounded-[2px] text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Accordions */}
        {FILTER_CATEGORIES.map((category) => (
          <div key={category} className="py-4 border-b border-gray-100">
            <button 
              className="w-full flex items-center justify-between group"
              onClick={() => toggleSection(category)}
            >
              <span className="text-sm font-bold text-gray-900">{category}</span>
              {expandedSection === category ? <Minus size={16} className="text-gray-800" /> : <Plus size={16} className="text-gray-800" />}
            </button>
            {expandedSection === category && (
              <div className="mt-4 text-sm text-gray-500">
                Filter options for {category} will go here.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
