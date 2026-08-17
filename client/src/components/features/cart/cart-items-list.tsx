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
      id: item.productId,
      name: item.name,
      category: 'Men',
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
          <div key={item.id} className="py-6 flex gap-4 lg:gap-6 items-start">
            {/* Image */}
            <Link
              href={`/product/${item.productId}`}
              className="w-28 lg:w-36 flex-shrink-0 aspect-[3/4] bg-gray-50 overflow-hidden rounded relative group"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
              />
            </Link>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between min-h-[8rem]">
              <div>
                <div className="flex justify-between items-start gap-2 mb-1">
                  <Link
                    href={`/product/${item.productId}`}
                    className="text-sm font-bold text-gray-900 hover:text-[#1A2E4C] transition-colors line-clamp-1"
                  >
                    {item.name}
                  </Link>
                  
                  {/* Item Price */}
                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-bold text-gray-900">₹{item.price * item.quantity}</span>
                    {item.comparePrice && (
                      <div className="text-[11px] text-gray-400 line-through">
                        ₹{item.comparePrice * item.quantity}
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  <span>Color: <strong className="text-gray-800">{item.color}</strong></span>
                  <span>•</span>
                  <span>Size: <strong className="text-gray-800">{item.size}</strong></span>
                  {discountPercentage > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold">{discountPercentage}% OFF</span>
                    </>
                  )}
                </div>
                {item.stock !== undefined && item.quantity >= item.stock && (
                  <div className="text-[11px] font-semibold text-amber-600 mb-2">
                    ⚠️ Maximum available stock reached ({item.stock})
                  </div>
                )}
              </div>

              {/* Controls & Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                {/* Quantity Buttons */}
                <div className="flex items-center border border-gray-200 rounded bg-white">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-gray-900 min-w-[2.5rem] text-center border-l border-r border-gray-200">
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
                    className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Save for later & Remove */}
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-wider uppercase">
                  <button
                    onClick={() => handleMoveToFavourites(item)}
                    className="hidden sm:flex items-center gap-1.5 text-black border border-gray-300 px-3 py-2 hover:border-black transition-colors"
                  >
                    <Heart size={14} strokeWidth={2} />
                    <span>Move to Favourites</span>
                  </button>

                  <button
                    onClick={() => {
                      removeItem(item.id);
                      toast.success('Removed item from basket');
                    }}
                    className="flex items-center gap-1.5 text-black border border-gray-300 px-3 py-2 hover:border-black hover:text-red-600 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={14} strokeWidth={2} />
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
