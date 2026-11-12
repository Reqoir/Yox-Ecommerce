"use client";

import React from 'react';
import { ArrowDownUp, SlidersHorizontal } from 'lucide-react';

interface MobileBottomBarProps {
  onSortClick: () => void;
  onFilterClick: () => void;
}

export function MobileBottomBar({ onSortClick, onFilterClick }: MobileBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[max(0px,env(safe-area-inset-bottom))]">
      <button 
        type="button"
        onClick={onSortClick}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 border-r border-gray-200 text-xs font-bold text-gray-900 active:bg-gray-100 hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider"
      >
        <ArrowDownUp size={16} />
        <span>Sort</span>
      </button>
      <button 
        type="button"
        onClick={onFilterClick}
        className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-gray-900 active:bg-gray-100 hover:bg-gray-50 transition-colors cursor-pointer uppercase tracking-wider"
      >
        <SlidersHorizontal size={16} />
        <span>Filter</span>
      </button>
    </div>
  );
}
