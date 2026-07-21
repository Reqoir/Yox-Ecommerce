"use client";

import React from 'react';
import { X, ChevronRight } from 'lucide-react';

interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FILTER_CATEGORIES = [
  'Price', 'Size', 'Promotions', 'Color', 'Discount', 'Design', 
  'Gender', 'Sleeve Length', 'Fit', 'Fabric'
];

export function MobileFilterModal({ isOpen, onClose }: MobileFilterModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button 
          onClick={onClose} 
          className="p-2 -ml-2 bg-gray-50 rounded-full"
        >
          <X size={20} />
        </button>
        <h2 className="text-base font-bold flex-1 text-center">Filter</h2>
        <button className="text-sm font-medium text-[#D2925D]">Clear All</button>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto">
        {FILTER_CATEGORIES.map((category) => (
          <button
            key={category}
            className="w-full flex items-center justify-between px-6 py-5 border-b border-gray-50 text-left bg-white active:bg-gray-50"
          >
            <span className="text-sm text-gray-800">
              {category}
            </span>
            <ChevronRight size={20} className="text-gray-900" />
          </button>
        ))}
      </div>
    </div>
  );
}
