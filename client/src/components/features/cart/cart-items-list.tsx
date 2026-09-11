'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, Heart } from 'lucide-react';
import { useCartStore, CartItem } from '@/store/useCartStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { toast } from 'sonner';

interface CartItemsListProps {
  items: CartItem[];
}

export function CartItemsList({ items }: CartItemsListProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { addFavourite } = useFavouritesStore();

  const handleMoveToFavourites = (item: CartItem) => {
    addFavourite({
      id: `${item.productId}__${item.color || 'default'}`,
      productId: item.productId,
      color: item.color || null,
      name: item.name,
      category: 'Apparel',
      image: item.image,
      price: item.price,
      comparePrice: item.comparePrice,
      inStock: true,
    });
    removeItem(item.id);
    toast.success('Moved item to Favourites');
  };

  return (
    <div className="w-full divide-y divide-gray-100">
      {items.map((item) => {
        const discountPercentage = item.comparePrice
          ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
          : 0;

        return (
          <div key={item.id} className="py-4 sm:py-6 flex gap-3 sm:gap-5 items-start">
            {/* Image */}
            <Link
              href={`/product/${item.productId}`}
              className="w-22 sm:w-28 lg:w-32 flex-shrink-0 aspect-[3/4] bg-gray-50 overflow-hidden rounded-md border border-gray-100 relative group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch gap-2.5">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-xs sm:text-sm font-bold text-gray-900 hover:text-[#1A2E4C] transition-colors line-clamp-1"
                    title={item.name}
                  >
                    {item.name}
                  </Link>
                  
                  {/* Item Price */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm sm:text-base font-bold text-gray-900">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </span>
                    {item.comparePrice && (
                      <div className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                        ₹{(item.comparePrice * item.quantity).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Info */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-gray-500 mb-1.5">
                  <span>Color: <strong className="text-gray-800 font-semibold">{item.color}</strong></span>
                  <span className="text-gray-300">•</span>
                  <span>Size: <strong className="text-gray-800 font-semibold">{item.size}</strong></span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-gray-300">•</span>
                      <span className="text-emerald-700 bg-emerald-50 text-[10px] font-bold px-1.5 py-0.2 rounded-xs">
                        {discountPercentage}% OFF
                      </span>
                    </>
                  )}
                </div>

                {item.stock !== undefined && item.quantity >= item.stock && (
                  <div className="text-[10px] sm:text-[11px] font-semibold text-amber-600 mb-1">
                    ⚠️ Maximum available stock reached ({item.stock})
                  </div>
                )}
              </div>

              {/* Controls & Actions Row */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 flex-wrap sm:flex-nowrap">
                {/* Quantity Buttons */}
                <div className="flex items-center border border-gray-200 rounded-sm bg-white shadow-2xs">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={13} />
                  </button>
                  <span className="px-2 sm:px-3 py-1 text-xs font-bold text-gray-900 min-w-[2rem] text-center border-l border-r border-gray-200">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => {
                      if (item.stock !== undefined && item.quantity >= item.stock) {
                        toast.error(`Cannot add more. Maximum available stock is ${item.stock}.`);
                        return;
                      }
                      updateQuantity(item.id, 1);
                    }}
                    disabled={item.stock !== undefined && item.quantity >= item.stock}
                    className="p-1 sm:p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>

                {/* Save for later & Remove */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => handleMoveToFavourites(item)}
                    className="flex items-center gap-1 text-[11px] font-medium text-gray-600 hover:text-black border border-gray-200 hover:border-gray-400 px-2 sm:px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer bg-white"
                    title="Save to Favourites"
                  >
                    <Heart size={13} className="text-gray-500" />
                    <span className="hidden xs:inline sm:inline">Save</span>
                  </button>

                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.success('Removed item from basket');
                    }}
                    className="flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 hover:bg-red-50/50 px-2 sm:px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer bg-white"
                    title="Remove item"
                    aria-label="Remove item"
                  >
                    <Trash2 size={13} />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
