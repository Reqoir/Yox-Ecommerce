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
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="aspect-[3/4] overflow-hidden bg-[#f2f2f2] relative">
        <Link href={productUrl} className="block w-full h-full">
          <img
            src={item.image || '/images/product-1.jpeg'}
            alt={item.name}
            className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${
              item.inStock === false ? 'opacity-80 grayscale-[20%]' : ''
            }`}
            onError={(e) => {
              e.currentTarget.src = '/images/product-1.jpeg';
            }}
          />
        </Link>

        {/* Sold Out or Tag */}
        {item.inStock === false ? (
          <div className="absolute top-2.5 left-2.5 z-10 bg-black text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-xs shadow-xs">
            SOLD OUT
          </div>
        ) : item.tag ? (
          <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-medium text-gray-800 uppercase shadow-sm rounded-sm">
            {item.tag}
          </div>
        ) : null}
      </div>

      {/* Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider block truncate">
              {item.category || 'Apparel'}
            </span>
            {item.color && (
              <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider shrink-0">
                {item.color}
              </span>
            )}
          </div>

          <Link
            href={productUrl}
            className="text-xs font-semibold text-gray-800 hover:text-[#1A2E4C] transition-colors line-clamp-1 mb-2 block"
          >
            {item.name}
          </Link>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-sm font-semibold ${item.inStock === false ? 'text-gray-500' : 'text-gray-900'}`}>
              ₹{item.price.toLocaleString()}
            </span>
            {item.inStock === false ? (
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Sold Out
              </span>
            ) : (
              <>
                {item.comparePrice && item.comparePrice > item.price && (
                  <span className="text-xs text-gray-400 line-through">₹{item.comparePrice.toLocaleString()}</span>
                )}
                {discountPercentage > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-600 ml-auto">
                    {discountPercentage}% OFF
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Move to Basket & Remove Row */}
        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <button
            onClick={handleMoveToCart}
            disabled={item.inStock === false}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-medium py-2.5 px-3 rounded-sm transition-colors border ${
              item.inStock === false
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 text-black border-black active:scale-[0.99] cursor-pointer'
            }`}
          >
            <BsHandbag size={16} className="shrink-0" />
            <span className="truncate">{item.inStock === false ? 'Out of Stock' : 'Move to Basket'}</span>
          </button>

          <button
            onClick={handleRemove}
            className="h-9 w-9 flex items-center justify-center rounded-sm border border-gray-200 text-gray-400 hover:text-red-600 hover:border-gray-300 transition-colors shrink-0 cursor-pointer"
            title="Remove from wishlist"
            aria-label="Remove item"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
