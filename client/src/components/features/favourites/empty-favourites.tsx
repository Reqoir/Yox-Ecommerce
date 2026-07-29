import React from 'react';
import Link from 'next/link';
import { Heart, ArrowRight } from 'lucide-react';

export function EmptyFavourites() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mb-6">
        <Heart size={36} strokeWidth={1.5} />
      </div>
      
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Your Favourites List is Empty</h2>
      <p className="text-gray-500 text-sm max-w-md mb-8">
        Save items you love by tapping the heart icon on any product card. Review them anytime and move them to your basket.
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
