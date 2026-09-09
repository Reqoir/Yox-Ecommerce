'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface PaymentProcessingOverlayProps {
  isOpen: boolean;
}

export function PaymentProcessingOverlay({ isOpen }: PaymentProcessingOverlayProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-white/75 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-150">
      <div className="flex flex-col items-center justify-center">
        {/* Sleek Minimalist YOX Brand Spinner */}
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-2 border-[#1A2E4C] border-t-transparent animate-spin" />
        </div>
      </div>
    </div>
  );
}
