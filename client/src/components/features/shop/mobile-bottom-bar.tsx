"use client";

import React from 'react';
import { ArrowDownUp, SlidersHorizontal } from 'lucide-react';

interface MobileBottomBarProps {
  onSortClick: () => void;
  onFilterClick: () => void;
}

export function MobileBottomBar({ onSortClick, onFilterClick }: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex lg:hidden">
      <button 
        onClick={onSortClick}
        className="flex-1 flex items-center justify-center gap-2 py-4 border-r border-gray-200 text-sm font-bold text-gray-900 active:bg-gray-50"
      >
        <ArrowDownUp size={18} />
        SORT
      </button>
      <button 
        onClick={onFilterClick}
        className="flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold text-gray-900 active:bg-gray-50"
      >
        <SlidersHorizontal size={18} />
        FILTER
      </button>
    </div>
  );
}
