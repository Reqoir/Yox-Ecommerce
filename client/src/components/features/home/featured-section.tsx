"use client";

import React, { useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useProducts } from '@/hooks/admin/useProducts';
import { useQuery } from '@tanstack/react-query';
import { offersApi } from '@/api/admin/offers';
import { calculateBestOffer } from '@/lib/offers';
import { SkeletonProductCard } from '@/components/features/shop/skeleton-product-card';
import { getColorHex } from '@/constants/products';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export function FeaturedSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { products: dbProducts, isLoading } = useProducts();
  const { data: activeOffers = [] } = useQuery({
    queryKey: ['active-offers'],
    queryFn: offersApi.getActive,
  });

  const featuredList = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      // Filter active products
      const active = dbProducts.filter((p: any) => p.isActive !== false);

      // Prioritize products marked isFeatured === true or with tag FEATURED / BESTSELLER
      const featuredOnly = active.filter(
        (p: any) => p.isFeatured || p.tag?.toUpperCase() === 'FEATURED' || p.tag?.toUpperCase() === 'BESTSELLER'
      );

      // If we have featured items, use them; if fewer than 4, append other active products
      const combined = [...featuredOnly];
      active.forEach((p: any) => {
        if (!combined.some((item: any) => item.id === p.id)) {
          combined.push(p);
        }
      });

      return combined.slice(0, 10).map((p: any) => {
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

        let badge = p.tag || null;
        let badgeColor = 'text-gray-800';

        if (offerResult.hasOffer) {
          badge = offerResult.badgeText || `${offerResult.discountPercentage}% off`;
          badgeColor = 'text-rose-600 font-bold';
        } else if (comparePrice && comparePrice > minPrice) {
          const discount = Math.round(((comparePrice - minPrice) / comparePrice) * 100);
          badge = `${discount}% off`;
          badgeColor = 'text-green-600';
        } else if (p.isFeatured) {
          badge = 'Featured';
          badgeColor = 'text-amber-700';
        }

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
          price: finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          comparePrice: strikePrice
            ? strikePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })
            : null,
          badge,
          badgeColor,
          image,
          secondImage,
          href: `/product/${p.slug || p.id}`,
          colors: allColors,
          isOutOfStock,
        };
      });
    }

    return [];
  }, [dbProducts, activeOffers]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!isLoading && featuredList.length === 0) {
    return null;
  }

  return (
    <section className="w-full py-8 sm:py-16 bg-white overflow-hidden">
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 sm:px-0">
        {/* Header: Title on Left, Arrows on Right Side */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide uppercase">
            FEATURED
          </h2>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={scrollLeft}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-none bg-[#EFECE8] hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-none bg-[#EFECE8] hover:bg-gray-300 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Products Scroll Container / Skeleton */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-3 sm:gap-4 md:gap-6 pb-3 sm:pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden animate-in fade-in duration-500"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex-shrink-0 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[calc(25%-18px)] snap-start">
                <SkeletonProductCard />
              </div>
            ))
          ) : featuredList.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[160px] sm:w-[220px] md:w-[280px] lg:w-[calc(25%-18px)] snap-start group">
              <Link href={product.href} className="block">
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-[#F2F2F2] mb-3 overflow-hidden rounded-none">
                  <Image
                    src={product.image || 'https://placehold.co/400x600'}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 260px, (max-width: 1024px) 300px, 25vw"
                    className={`object-cover object-center transition-opacity duration-300 ${
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
                      sizes="(max-width: 768px) 260px, (max-width: 1024px) 300px, 25vw"
                      className={`object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                        product.isOutOfStock ? 'grayscale-[20%]' : ''
                      }`}
                    />
                  )}
                  
                  {/* Badge / Sold Out Badge */}
                  {product.isOutOfStock ? (
                    <div className="absolute top-3 left-3 bg-black text-white px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-none shadow-xs z-10">
                      SOLD OUT
                    </div>
                  ) : product.badge ? (
                    <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold rounded-none shadow-xs z-10">
                      <span className={product.badgeColor || "text-gray-800"}>{product.badge}</span>
                    </div>
                  ) : null}

                  {/* Eye Icon */}
                  <div className="absolute bottom-3 right-3 w-7 h-7 bg-white/80 rounded-none flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xs">
                    <Eye size={14} />
                  </div>
                </div>

                <div className="space-y-1.5 px-1">
                  <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                    <span className={product.isOutOfStock ? 'text-gray-500 font-bold' : ''}>₹{product.price || 0} INR</span>
                    {product.isOutOfStock && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Sold Out
                      </span>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
