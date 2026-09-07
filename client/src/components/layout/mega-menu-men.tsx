'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/admin/useProducts';
import { optimizeCloudinaryUrl } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MegaMenuProps {
  categorySlug: string;
  categoryName: string;
}

export function MegaMenuMen({ categorySlug, categoryName }: MegaMenuProps) {
  const { products, isLoading } = useProducts();

  const categoryProducts = useMemo(() => {
    if (!products || products.length === 0) return [];
    
    // Filter active products
    const active = products.filter((p: any) => p.isActive !== false);

    // Try matching category slug or category name
    const q = categoryName.toLowerCase();
    const matched = active.filter((p: any) => {
      const catName = typeof p.categoryId === 'string' ? p.categoryId.toLowerCase() : '';
      const tag = p.tag ? p.tag.toLowerCase() : '';
      const name = p.name ? p.name.toLowerCase() : '';
      return (
        catName.includes(q) ||
        q.includes(catName) ||
        tag.includes(q) ||
        name.includes(q)
      );
    });

    // If matching products found, return max 5; otherwise fallback to top 5 active products
    const list = matched.length > 0 ? matched : active;
    return list.slice(0, 5);
  }, [products, categorySlug, categoryName]);

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-[0_12px_24px_rgba(0,0,0,0.08)] cursor-default py-5 z-50 animate-in fade-in-50 duration-150">
      <div className="max-w-[1400px] w-[95%] mx-auto px-4">
        
        {/* Dropdown Header Row */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
              {categoryName} COLLECTION
            </span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-full">
              {categoryProducts.length} STYLES
            </span>
          </div>

          <Link 
            href={`/shop?category=${categorySlug}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-black transition-colors"
          >
            <span>View All {categoryName}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Max 5 Product Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <Skeleton className="w-full aspect-[3/4] rounded-sm bg-gray-100" />
                <Skeleton className="w-3/4 h-3.5 rounded-xs bg-gray-200" />
                <Skeleton className="w-1/2 h-3.5 rounded-xs bg-gray-200" />
              </div>
            ))}
          </div>
        ) : categoryProducts.length > 0 ? (
          <div className="grid grid-cols-5 gap-4">
            {categoryProducts.map((product: any) => {
              const variants = product.variants || [];
              const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0];
              const price = defaultVariant?.price || product.price || 999;
              const comparePrice = defaultVariant?.comparePrice || null;
              const image = product.thumbnail 
                ? optimizeCloudinaryUrl(product.thumbnail) 
                : (defaultVariant?.images?.[0] ? optimizeCloudinaryUrl(defaultVariant.images[0]) : '/images/product-1.jpeg');

              return (
                <Link
                  key={product.id}
                  href={`/product/${product.slug || product.id}`}
                  className="group flex flex-col bg-white rounded-sm overflow-hidden p-1.5 hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-200 shadow-2xs"
                >
                  <div className="relative aspect-[3/4] bg-[#f7f7f7] rounded-sm overflow-hidden mb-2">
                    <img
                      src={image}
                      alt={product.name}
                      className="w-full h-full object-cover object-top mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.tag && (
                      <span className="absolute top-1.5 left-1.5 text-[9px] font-black uppercase tracking-wider bg-black text-white px-1.5 py-0.5 rounded-xs">
                        {product.tag}
                      </span>
                    )}
                  </div>
                  <h4 className="text-[11px] font-semibold text-gray-800 line-clamp-1 truncate group-hover:text-black transition-colors" title={product.name}>
                    {product.name}
                  </h4>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[12px] font-bold text-gray-900">
                      ₹{price.toLocaleString('en-IN')}
                    </span>
                    {comparePrice && comparePrice > price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{comparePrice.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-500">
            No products available for {categoryName} currently.
          </div>
        )}

      </div>
    </div>
  );
}
