"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ChevronDown } from 'lucide-react';
import { useProducts } from '@/hooks/admin/useProducts';
import { useCategories } from '@/hooks/admin/useCategories';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/api/admin/offers';
import { calculateBestOffer } from '@/lib/offers';
import { getColorHex } from '@/constants/products';
import { optimizeCloudinaryUrl } from '@/lib/utils';

const DEFAULT_TABS = ['ALL', 'SHIRTS', 'PANTS', 'T-SHIRT', 'JACKET', 'ACCESSORIES'];

export function NewAndPopular() {
  const [activeTab, setActiveTab] = useState('ALL');
  const {
    products: dbProducts,
    isLoading: isProductsLoading,
    isError: isProductsError,
    refetch: refetchProducts,
  } = useProducts();
  const { categories: dbCategories } = useCategories();
  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const { data: activeOffers = [] } = useQuery({
    queryKey: ['active-offers'],
    queryFn: offersApi.getActive,
  });

  // Create Category ID to Name mapping
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    (dbCategories || []).forEach((c) => {
      map.set(c.id, c.name);
      if (c.slug) map.set(c.slug, c.name);
    });
    return map;
  }, [dbCategories]);

  // Derive dynamic tabs from database categories or fallback to default tabs
  const tabs = useMemo(() => {
    const activeCats = (dbCategories || [])
      .filter((c) => c.isActive !== false && !c.parentCategoryId)
      .map((c) => c.name.toUpperCase());

    if (activeCats.length > 0) {
      // Ensure 'ALL' is first, then unique categories
      const combined = ['ALL', ...Array.from(new Set(activeCats))];
      return combined;
    }

    return DEFAULT_TABS;
  }, [dbCategories]);

  // Filter products based on activeTab
  const filteredProducts = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      const active = dbProducts.filter((p: any) => p.isActive !== false);

      const mapped = active.map((p: any) => {
        const catName = p.categoryId ? categoryMap.get(p.categoryId) || p.categoryId : 'Apparel';
        const variants = p.variants || [];
        const firstVariant = variants.find((v: any) => v.isDefault) || variants[0];
        const validPrices = variants
          .map((v: any) => v.price)
          .filter((pr: any) => typeof pr === 'number' && pr > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : firstVariant?.price || 999;
        const comparePrice = firstVariant?.comparePrice || null;

        // Auto-applied offer calculation
        const offerResult = calculateBestOffer(p, minPrice, activeOffers, comparePrice);
        const finalPrice = offerResult.hasOffer ? offerResult.discountedPrice : minPrice;
        const strikePrice = offerResult.hasOffer 
          ? offerResult.originalPrice 
          : (comparePrice && comparePrice > minPrice ? comparePrice : null);

        const variantImages = (firstVariant?.images || []).filter(Boolean);
        const allVariantImages = variants.flatMap((v: any) => v.images || []).filter(Boolean);
        const allImages = Array.from(
          new Set([
            ...variantImages,
            ...(p.thumbnail ? [p.thumbnail] : []),
            ...allVariantImages,
          ])
        );
        const image = allImages[0] ? optimizeCloudinaryUrl(allImages[0]) : '/images/product-1.jpeg';
        const secondImage = allImages[1] ? optimizeCloudinaryUrl(allImages[1]) : null;

        const allColors = Array.from(new Set(variants.map((v: any) => v.color).filter(Boolean))) as string[];
        if (firstVariant?.color && allColors.includes(firstVariant.color)) {
          allColors.sort((a, b) => a === firstVariant.color ? -1 : b === firstVariant.color ? 1 : 0);
        }

        const isOutOfStock = variants.length === 0 || variants.every((v: any) => (v.stock === undefined ? 0 : v.stock) <= 0);

        return {
          id: p.id,
          name: p.name,
          category: catName,
          categoryId: p.categoryId,
          subCategoryId: p.subCategoryId,
          price: finalPrice,
          comparePrice: strikePrice,
          offerBadge: offerResult.hasOffer ? offerResult.badgeText : null,
          offerSavings: offerResult.hasOffer ? offerResult.savings : null,
          image,
          secondImage,
          href: `/product/${p.slug || p.id}`,
          colors: allColors,
          isOutOfStock,
        };
      });

      if (activeTab === 'ALL') {
        return mapped.slice(0, 15);
      }

      const tabUpper = activeTab.toUpperCase();

      // Find matching category and child subcategories
      const currentCat = (dbCategories || []).find(
        (c) => c.name.toUpperCase() === tabUpper || c.slug?.toUpperCase() === tabUpper
      );

      const targetCategoryIds = new Set<string>();
      if (currentCat) {
        targetCategoryIds.add(currentCat.id);
        (dbCategories || [])
          .filter((c) => c.parentCategoryId === currentCat.id)
          .forEach((child) => targetCategoryIds.add(child.id));
      }

      const filtered = mapped.filter((p: any) => {
        // 1. Direct or child category ID match
        if (targetCategoryIds.size > 0) {
          if (p.categoryId && targetCategoryIds.has(p.categoryId)) return true;
          if (p.subCategoryId && targetCategoryIds.has(p.subCategoryId)) return true;
        }

        // 2. Name / category string fallback match
        const catUpper = (p.category || '').toUpperCase();
        const nameUpper = (p.name || '').toUpperCase();
        return (
          catUpper === tabUpper ||
          catUpper.includes(tabUpper) ||
          tabUpper.includes(catUpper) ||
          nameUpper.includes(tabUpper.replace(/S$/, ''))
        );
      });

      // Do NOT fallback to all products when a category is empty
      return filtered.slice(0, 15);
    }

    return [];
  }, [dbProducts, activeTab, categoryMap, dbCategories, activeOffers]);

  return (
    <section className="w-full pt-12 sm:pt-16 pb-6 sm:pb-8 bg-white overflow-hidden">
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-[20px] font-bold text-gray-900 tracking-wide uppercase mb-6">
            NEW AND POPULAR
          </h2>
          
          {/* Tabs / Skeletons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {isProductsLoading ? (
               Array.from({ length: 6 }).map((_, idx) => (
                 <div key={idx} className="h-8 w-20 bg-gray-100 animate-pulse border border-transparent" />
               ))
            ) : tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors border border-gray-300 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 hover:text-black hover:border-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid / Loading / Error / Empty */}
        {isProductsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2.5 animate-pulse">
                <div className="aspect-[3/4] w-full bg-gray-100 rounded-none" />
                <div className="h-3.5 bg-gray-100 rounded-none w-3/4" />
                <div className="h-3 bg-gray-100 rounded-none w-1/3" />
              </div>
            ))}
          </div>
        ) : isProductsError ? (
          <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50/50 rounded-none border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 mb-3">Unable to connect to live collection.</p>
            <button
              onClick={() => refetchProducts()}
              className="px-4 py-1.5 bg-black text-white text-xs font-semibold rounded-none hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {filteredProducts.map((product: any) => {
              const isFav = isFavourite(product.id);

            return (
              <Link href={product.href} key={product.id} className="group block">
                <div className="relative aspect-[3/4] w-full bg-[#f6f6f6] mb-3 overflow-hidden rounded-none">
                  {/* Sold Out or Offer Badge */}
                  {product.isOutOfStock ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-black/90 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-none tracking-widest shadow-xs">
                        SOLD OUT
                      </span>
                    </div>
                  ) : product.offerBadge ? (
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-none shadow-xs tracking-wider">
                        {product.offerBadge}
                      </span>
                    </div>
                  ) : null}

                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className={`object-cover object-top transition-opacity duration-300 ${
                      product.isOutOfStock ? 'opacity-80 grayscale-[20%]' : ''
                    } ${
                      product.secondImage && product.secondImage !== product.image ? 'group-hover:opacity-0' : ''
                    }`}
                  />
                  {product.secondImage && product.secondImage !== product.image && (
                    <Image
                      src={product.secondImage}
                      alt={`${product.name} alternate view`}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className={`object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                        product.isOutOfStock ? 'grayscale-[20%]' : ''
                      }`}
                    />
                  )}
                  <button 
                    type="button"
                    className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors z-10 cursor-pointer bg-white/60 hover:bg-white rounded-none backdrop-blur-xs"
                    aria-label="Add to favorites"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavourite({
                        id: product.id,
                        productId: product.id,
                        name: product.name,
                        category: product.category,
                        image: product.image,
                        price: product.price,
                        comparePrice: product.comparePrice || undefined,
                        inStock: !product.isOutOfStock,
                      });
                    }}
                  >
                    <Heart 
                      size={18} 
                      strokeWidth={1.5} 
                      className={isFav ? "fill-red-500 text-red-500" : "text-gray-700"}
                    />
                  </button>
                </div>
                <div className="flex flex-col gap-1 px-1">
                  <h3 className="text-[12px] font-medium text-gray-800 line-clamp-1 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-[12px] font-bold ${product.isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                    {product.isOutOfStock && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Sold Out
                      </span>
                    )}
                    {!product.isOutOfStock && product.comparePrice && product.comparePrice > product.price && (
                      <>
                        <span className="text-[10px] text-gray-400 line-through">
                          ₹{product.comparePrice.toLocaleString('en-IN')}
                        </span>
                        {product.offerSavings && (
                          <span className="text-[9px] font-bold text-emerald-700">
                            Save ₹{product.offerSavings}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  {product.colors && product.colors.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5 mb-0.5">
                      {product.colors.slice(0, 4).map((c: string) => (
                        <div 
                          key={c}
                          title={c}
                          className="w-2 h-2 shadow-xs shrink-0"
                          style={{ backgroundColor: getColorHex(c) }}
                        />
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-[9px] font-medium text-gray-500 ml-0.5">
                          +{product.colors.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-gray-400">
          No products available in this category.
        </div>
      )}

        {/* View More Button */}
        <div className="flex justify-center mt-12">
          <Link
            href="/shop"
            className="flex flex-col items-center gap-1 text-[11px] font-bold tracking-widest uppercase text-gray-500 hover:text-black transition-colors group"
          >
            <span>View More</span>
            <ChevronDown size={18} className="text-gray-400 group-hover:text-black transition-colors group-hover:translate-y-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
