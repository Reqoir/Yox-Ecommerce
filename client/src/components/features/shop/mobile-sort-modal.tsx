"use client";

import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface MobileSortModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SORT_OPTIONS = [
  'New Arrivals',
  'Discount',
  'Price - Low to High',
  'Price - High to Low',
  'Relevance',
  'Alphabetical'
];

export function MobileSortModal({ isOpen, onClose }: MobileSortModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <button onClick={onClose} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-base font-bold flex-1 text-center pr-6">Sort</h2>
      </div>

      {/* Options */}
      <div className="flex-1 overflow-y-auto">
        {SORT_OPTIONS.map((option) => {
          const isSelected = option === 'Relevance';
          return (
            <button
              key={option}
              onClick={onClose}
              className={`w-full flex items-center justify-between px-4 py-5 border-b border-gray-50 text-left ${isSelected ? 'bg-white' : option === 'Discount' ? 'bg-gray-50' : 'bg-white'}`}
            >
              <span className={`text-sm ${isSelected ? 'font-bold text-gray-900' : 'text-gray-800'}`}>
                {option}
              </span>
              
              {/* Radio Indicator */}
              <div className="w-5 h-5 rounded-full border border-gray-300 flex items-center justify-center">
                {isSelected && (
                  <div className="w-3 h-3 rounded-full bg-[#D2925D]" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
