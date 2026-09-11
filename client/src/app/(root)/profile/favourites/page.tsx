'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useCartStore } from '@/store/useCartStore';
import { FavouriteCard } from '@/components/features/favourites/favourite-card';
import { EmptyFavourites } from '@/components/features/favourites/empty-favourites';
import { Trash2, ArrowUpDown } from 'lucide-react';
import { BsHandbag } from 'react-icons/bs';
import { toast } from 'sonner';

type SortOption = 'default' | 'price-low' | 'price-high';

export default function FavouritesPage() {
  const { items, clearFavourites, fetchWishlist, isLoading, isInitialized } = useFavouritesStore();
  const { addItem } = useCartStore();

  const [sortBy, setSortBy] = useState<SortOption>('default');

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const sortedItems = useMemo(() => {
    if (!items) return [];
    const list = [...items];
    if (sortBy === 'price-low') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [items, sortBy]);

  const inStockCount = useMemo(() => {
    return items?.filter((i) => i.inStock !== false).length || 0;
  }, [items]);

  const handleAddAllToCart = () => {
    const availableItems = items.filter((i) => i.inStock !== false);
    if (availableItems.length === 0) {
      toast.error('No items in your wishlist are currently in stock.');
      return;
    }

    availableItems.forEach((item) => {
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
    });

    toast.success(`Added ${availableItems.length} item(s) to your shopping basket!`);
  };

  if (isLoading && !isInitialized) {
    return (
      <div className="flex-1 space-y-6">
        <div className="h-6 w-40 bg-gray-100 animate-pulse rounded-sm" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col bg-white border border-gray-100 rounded-sm overflow-hidden animate-pulse"
            >
              <div className="aspect-[3/4] bg-gray-100 w-full" />
              <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="h-3 w-16 bg-gray-100 rounded-xs" />
                    <div className="h-3 w-12 bg-gray-100 rounded-xs" />
                  </div>
                  <div className="h-3.5 w-3/4 bg-gray-100 rounded-xs mb-3" />
                  <div className="flex items-baseline gap-2 mb-3">
                    <div className="h-4 w-1/3 bg-gray-100 rounded-xs" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-auto pt-2">
                  <div className="flex-1 h-9 bg-gray-100 rounded-sm" />
                  <div className="h-9 w-9 bg-gray-100 rounded-sm shrink-0" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <EmptyFavourites />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-5 pb-8">
      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            My Favourites
          </h1>
          <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100/80 px-2.5 py-1.5 rounded-sm border border-gray-200 transition-colors">
            <ArrowUpDown size={12} className="text-gray-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-transparent border-0 text-gray-800 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="default">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Add All In Stock Button */}
            {inStockCount > 0 && (
              <button
                onClick={handleAddAllToCart}
                className="flex items-center gap-1.5 bg-black hover:bg-gray-900 text-white text-xs font-medium py-1.5 px-3 rounded-sm transition-all active:scale-[0.98] shadow-2xs cursor-pointer"
              >
                <BsHandbag size={13} />
                <span>Add All In-Stock ({inStockCount})</span>
              </button>
            )}

            {/* Clear Favourites Action */}
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to clear your favourites?')) {
                  await clearFavourites();
                  toast.success('Favourites list cleared');
                }
              }}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors py-1.5 px-2.5 rounded-sm font-medium border border-transparent hover:border-rose-100 cursor-pointer"
              title="Clear all favourites"
            >
              <Trash2 size={13} />
              <span className="hidden xs:inline sm:inline">Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Favourites Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {sortedItems.map((item) => (
          <FavouriteCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
