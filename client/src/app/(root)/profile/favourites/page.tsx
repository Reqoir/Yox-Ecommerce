'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useCartStore } from '@/store/useCartStore';
import { FavouriteCard } from '@/components/features/favourites/favourite-card';
import { EmptyFavourites } from '@/components/features/favourites/empty-favourites';
import { Trash2, ShoppingBag, ArrowUpDown } from 'lucide-react';
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
        <div className="h-6 w-40 bg-gray-100 animate-pulse rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="border border-gray-100 rounded overflow-hidden space-y-3 p-3 animate-pulse bg-white"
            >
              <div className="aspect-[3/4] bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-4 w-1/3 bg-gray-100 rounded" />
              <div className="h-9 w-full bg-gray-100 rounded" />
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
    <div className="flex-1 space-y-6">
      
      {/* Header Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
            My Favourites
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap self-start sm:self-auto">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-full border border-gray-200">
            <ArrowUpDown size={13} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-xs bg-transparent border-0 text-gray-700 font-medium focus:outline-none cursor-pointer"
            >
              <option value="default">Recently Added</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          {/* Add All In Stock Button */}
          {inStockCount > 0 && (
            <button
              onClick={handleAddAllToCart}
              className="flex items-center gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold py-2 px-4 rounded-full transition-colors shadow-sm"
            >
              <ShoppingBag size={13} />
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
            className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors py-2 px-3 rounded-full font-medium border border-transparent hover:border-rose-100"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Favourites Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedItems.map((item) => (
          <FavouriteCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
