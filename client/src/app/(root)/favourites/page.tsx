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
      <main className="w-full bg-white min-h-[70vh] py-8 sm:py-12">
        <div className="w-[98%] max-w-[1500px] mx-auto space-y-6">
          <div className="h-6 w-40 bg-gray-100 animate-pulse rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
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
      </main>
    );
  }

  if (!items || items.length === 0) {
    return (
      <main className="w-full bg-white min-h-[70vh] flex items-center justify-center">
        <EmptyFavourites />
      </main>
    );
  }

  return (
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 lg:mb-8 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-semibold">My Favourites</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              My Favourites ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap self-start sm:self-auto">
            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
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
                className="flex items-center gap-1.5 bg-[#1A2E4C] hover:bg-[#132238] text-white text-xs font-bold py-2 px-3 rounded transition-colors"
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
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors py-1 px-2 rounded"
            >
              <Trash2 size={14} />
              <span>Clear Favourites</span>
            </button>
          </div>
        </div>

        {/* Favourites Grid: Mobile, Tablet, Laptop, TV */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {sortedItems.map((item) => (
            <FavouriteCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
