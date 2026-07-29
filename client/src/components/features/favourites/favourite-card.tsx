'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, X } from 'lucide-react';
import { useFavouritesStore, FavouriteItem } from '@/store/useFavouritesStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

interface FavouriteCardProps {
  item: FavouriteItem;
}

export function FavouriteCard({ item }: FavouriteCardProps) {
  const { removeFavourite } = useFavouritesStore();
  const { addItem } = useCartStore();

  const handleMoveToCart = () => {
    addItem({
      productId: item.id,
      name: item.name,
      image: item.image,
      color: 'Default',
      size: 'L',
      price: item.price,
      comparePrice: item.comparePrice,
      quantity: 1,
    });
    removeFavourite(item.id);
    toast.success('Moved item to Shopping Basket!');
  };

  const discountPercentage = item.comparePrice
    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
        <Link href={`/product/${item.id}`} className="block w-full h-full">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Tag */}
        {item.tag && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-gray-800 uppercase shadow-sm">
            {item.tag}
          </div>
        )}

        {/* Remove Heart Trigger */}
        <button
          onClick={() => {
            removeFavourite(item.id);
            toast.success('Removed from Favourites');
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 hover:bg-white hover:scale-110 transition-all shadow-sm"
          aria-label="Remove from favourites"
        >
          <Heart size={16} fill="currentColor" />
        </button>
      </div>

      {/* Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            {item.category}
          </span>
          <Link
            href={`/product/${item.id}`}
            className="text-xs font-semibold text-gray-800 hover:text-[#1A2E4C] transition-colors line-clamp-1 mb-2"
          >
            {item.name}
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-sm font-bold text-gray-900">₹{item.price}</span>
            {item.comparePrice && (
              <span className="text-xs text-gray-400 line-through">₹{item.comparePrice}</span>
            )}
            {discountPercentage > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 ml-auto">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Move to Cart Action */}
        <button
          onClick={handleMoveToCart}
          className="w-full flex items-center justify-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold py-2.5 px-4 rounded transition-colors"
        >
          <ShoppingBag size={14} />
          <span>Move to Basket</span>
        </button>
      </div>
    </div>
  );
}
