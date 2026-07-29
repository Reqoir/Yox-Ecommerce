import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export function EmptyCart() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-6">
        <ShoppingBag size={36} strokeWidth={1.5} />
      </div>
      
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Your Shopping Basket is Empty</h2>
      <p className="text-gray-500 text-sm max-w-md mb-8">
        Looks like you haven&apos;t added any items to your basket yet. Explore our latest Men&apos;s fashion collection and find your style.
      </p>

      <Link
        href="/shop"
        className="inline-flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold text-sm py-3.5 px-8 rounded transition-colors shadow-sm"
      >
        <span>Explore Collection</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
