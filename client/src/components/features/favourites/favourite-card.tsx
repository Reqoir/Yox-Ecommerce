'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, Trash2, X } from 'lucide-react';
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
    toast.info(`Removed ${item.name}${item.color ? ` (${item.color})` : ''} from wishlist`);
  };

  const discountPercentage = item.comparePrice && item.comparePrice > item.price
    ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col bg-white border border-gray-100 rounded overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      <div className="aspect-[3/4] overflow-hidden bg-[#f2f2f2] relative">
        <Link href={productUrl} className="block w-full h-full">
          <img
            src={item.image || '/images/product-1.jpeg'}
            alt={item.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = '/images/product-1.jpeg';
            }}
          />
        </Link>

        {/* Tag */}
        {item.tag && (
          <div className="absolute top-2.5 left-2.5 z-10 bg-white/90 backdrop-blur px-2.5 py-0.5 text-[10px] font-bold text-gray-800 uppercase shadow-sm">
            {item.tag}
          </div>
        )}

        {/* Out of Stock Notice */}
        {item.inStock === false && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-sm">
            Out of Stock
          </div>
        )}

        {/* Top-Right Clear Remove Button */}
        <button
          onClick={handleRemove}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-gray-500 hover:text-red-600 hover:bg-white transition-all shadow-sm"
          aria-label="Remove from wishlist"
          title="Remove from wishlist"
        >
          <X size={15} />
        </button>
      </div>

      {/* Details */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block truncate">
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
            <span className="text-sm font-bold text-gray-900">₹{item.price.toLocaleString()}</span>
            {item.comparePrice && item.comparePrice > item.price && (
              <span className="text-xs text-gray-400 line-through">₹{item.comparePrice.toLocaleString()}</span>
            )}
            {discountPercentage > 0 && (
              <span className="text-[11px] font-bold text-emerald-600 ml-auto">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Move to Basket & Remove Row */}
        <div className="flex items-center gap-1.5 mt-auto pt-2">
          <button
            onClick={handleMoveToCart}
            disabled={item.inStock === false}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold py-2.5 px-3 rounded transition-colors ${
              item.inStock === false
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#1A2E4C] hover:bg-[#132238] text-white active:scale-[0.99]'
            }`}
          >
            <ShoppingBag size={14} className="shrink-0" />
            <span className="truncate">{item.inStock === false ? 'Out of Stock' : 'Move to Basket'}</span>
          </button>

          <button
            onClick={handleRemove}
            className="h-9 w-9 flex items-center justify-center rounded border border-gray-200 text-gray-400 hover:text-red-600 hover:border-gray-300 transition-colors shrink-0"
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
