"use client";

import React from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { useProductFilters } from '@/hooks/useProductFilters';
import { SORT_OPTIONS_LIST } from '@/constants/products';
import { SortOption } from '@/types/product';

interface MobileSortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileSortModal({ isOpen, onClose }: MobileSortModalProps) {
  const { sortBy, setSortBy } = useProductFilters();

  if (!isOpen) return null;

  const handleSelectSort = (option: SortOption) => {
    setSortBy(option);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-700">
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-sm font-bold text-gray-900 flex-1 text-center pr-6">Sort Products</h2>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto">
        {SORT_OPTIONS_LIST.map((option) => {
          const isSelected = sortBy === option;
          return (
            <button
              key={option}
              onClick={() => handleSelectSort(option as SortOption)}
              className={`w-full flex items-center justify-between px-5 py-4 border-b border-gray-50 text-left transition-colors ${
                isSelected ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <span className={`text-xs ${isSelected ? 'font-bold text-[#1A2E4C]' : 'text-gray-800'}`}>
                {option}
              </span>
              
              <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-[#1A2E4C]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
