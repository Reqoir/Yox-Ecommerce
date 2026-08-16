'use client';

import React from 'react';
import Link from 'next/link';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { FavouriteCard } from '@/components/features/favourites/favourite-card';
import { EmptyFavourites } from '@/components/features/favourites/empty-favourites';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function FavouritesPage() {
  const { items, clearFavourites } = useFavouritesStore();

  if (!items || items.length === 0) {
    return (
      <main className="w-full bg-white min-h-[70vh] flex items-center justify-center">
        <EmptyFavourites />
      </main>
    );
  }

  return (
    <main className="w-full bg-white min-h-screen pb-16 pt-4 lg:pt-8">
      <div className="w-[95%] lg:w-[95%] max-w-7xl mx-auto">
        
        {/* Header Breadcrumb & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 mb-6 lg:mb-8 gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <Link href="/" className="hover:text-gray-900">Home</Link>
              <span>&gt;</span>
              <span className="text-gray-900 font-semibold">My Favourites</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">
              My Favourites ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h1>
          </div>

          <button
            onClick={() => {
              clearFavourites();
              toast.success('Favourites list cleared');
            }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors self-start sm:self-auto"
          >
            <Trash2 size={14} />
            <span>Clear Favourites</span>
          </button>
        </div>

        {/* Favourites Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-6">
          {items.map((item) => (
            <FavouriteCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </main>
  );
}
