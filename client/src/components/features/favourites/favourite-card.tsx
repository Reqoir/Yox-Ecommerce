'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { BsHandbag } from 'react-icons/bs';
import { useFavouritesStore, FavouriteItem } from '@/store/useFavouritesStore';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

interface FavouriteCardProps {
  item: FavouriteItem;
}

export function FavouriteCard({ item }: FavouriteCardProps) {
  const { removeFavourite } = useFavouritesStore();
  const { addItem } = useCartStore();

  const productUrl = `/product/${item.productId || item.id}${
    item.color ? `?color=${encodeURIComponent(item.color)}` : ''
  }`;

  const handleMoveToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.inStock === false) {
      toast.error('This product is currently out of stock');
      return;
    }

    addItem({
      productId: item.productId || item.id,
      name: item.name,
      image: item.image,
      color: item.color || 'Default',
      size: 'Standard',
      price: item.price,
      comparePrice: item.comparePrice || undefined,
      quantity: 1,
    });
    removeFavourite(item.productId || item.id, item.color);
    toast.success('Moved item to Shopping Basket!');
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeFavourite(item.productId || item.id, item.color);
  };

  const discountPercentage = item.comparePrice && item.comparePrice > item.price
    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col bg-white border border-gray-200/80 rounded-md overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Product Image */}
      <div className="aspect-[3/4] overflow-hidden bg-[#f5f5f5] relative">
        <Link href={productUrl} className="block w-full h-full">
          <img
            src={item.image || '/images/product-1.jpeg'}
            alt={item.name}
            className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${
              item.inStock === false ? 'opacity-75 grayscale-[25%]' : ''
            }`}
            onError={(e) => {
              e.currentTarget.src = '/images/product-1.jpeg';
            }}
          />
        </Link>

        {/* Floating Remove Button on Image Top-Right */}
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs text-gray-500 hover:text-red-600 hover:bg-white flex items-center justify-center shadow-xs transition-all active:scale-90 cursor-pointer"
          title="Remove from favourites"
          aria-label="Remove item"
        >
          <Trash2 size={14} strokeWidth={2} />
        </button>

        {/* Sold Out or Tag Badge */}
        {item.inStock === false ? (
          <div className="absolute top-2 left-2 z-10 bg-black/85 backdrop-blur-xs text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-xs shadow-xs">
            SOLD OUT
          </div>
        ) : item.tag ? (
          <div className="absolute top-2 left-2 z-10 bg-white/95 backdrop-blur-xs px-2 py-0.5 text-[9px] font-semibold text-gray-800 uppercase shadow-2xs rounded-xs">
            {item.tag}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="p-2.5 sm:p-3.5 flex-1 flex flex-col justify-between gap-2.5">
        <div>
          {/* Category and Color Row */}
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400 font-medium mb-1 min-w-0">
            <span className="truncate">{item.category || 'Apparel'}</span>
            {item.color && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600 font-semibold truncate">{item.color}</span>
              </>
            )}
          </div>

          {/* Title */}
          <Link
            href={productUrl}
            className="text-xs sm:text-sm font-semibold text-gray-900 hover:text-[#1A2E4C] transition-colors line-clamp-1 mb-1.5 block"
            title={item.name}
          >
            {item.name}
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline flex-wrap gap-1.5">
            <span className={`text-xs sm:text-sm font-bold ${item.inStock === false ? 'text-gray-400' : 'text-gray-900'}`}>
              ₹{item.price.toLocaleString()}
            </span>
            {item.inStock === false ? (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Sold Out
              </span>
            ) : (
              <>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="text-[11px] text-gray-400 line-through">
                    ₹{item.comparePrice.toLocaleString()}
                  </span>
                )}
                {discountPercentage > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-xs">
                    {discountPercentage}% OFF
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Full-width Move to Basket Button */}
        <div className="w-full pt-1">
          <button
            onClick={handleMoveToCart}
            disabled={item.inStock === false}
            className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 px-2 rounded-sm transition-all border ${
              item.inStock === false
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-black hover:text-white text-black border-black active:scale-[0.98] cursor-pointer shadow-2xs'
            }`}
          >
            <BsHandbag size={14} className="shrink-0" />
            <span className="truncate">{item.inStock === false ? 'Out of Stock' : 'Move to Basket'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
