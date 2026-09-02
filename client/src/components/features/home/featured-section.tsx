"use client";

import React, { useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useProducts } from '@/hooks/admin/useProducts';
import { MOCK_PRODUCTS } from '@/constants/products';

export function FeaturedSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { products: dbProducts, isLoading } = useProducts();

  const featuredList = useMemo(() => {
    if (dbProducts && dbProducts.length > 0) {
      // Filter active products
      const active = dbProducts.filter((p) => p.isActive !== false);

      // Prioritize products marked isFeatured === true or with tag FEATURED / BESTSELLER
      const featuredOnly = active.filter(
        (p) => p.isFeatured || p.tag?.toUpperCase() === 'FEATURED' || p.tag?.toUpperCase() === 'BESTSELLER'
      );

      // If we have featured items, use them; if fewer than 4, append other active products
      const combined = [...featuredOnly];
      active.forEach((p) => {
        if (!combined.some((item) => item.id === p.id)) {
          combined.push(p);
        }
      });

      return combined.slice(0, 10).map((p) => {
        const variants = p.variants || [];
        const firstVariant = variants.find((v) => v.isDefault) || variants[0];
        const validPrices = variants
          .map((v) => v.price)
          .filter((pr) => typeof pr === 'number' && pr > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : firstVariant?.price || 999;
        const comparePrice = firstVariant?.comparePrice || null;

        let badge = p.tag || null;
        let badgeColor = 'text-gray-800';

        if (comparePrice && comparePrice > minPrice) {
          const discount = Math.round(((comparePrice - minPrice) / comparePrice) * 100);
          badge = `${discount}% off`;
          badgeColor = 'text-green-600';
        } else if (p.isFeatured) {
          badge = 'Featured';
          badgeColor = 'text-amber-700';
        }

        const image =
          firstVariant?.images?.[0] ||
          p.thumbnail ||
          variants.flatMap((v) => v.images || [])[0] ||
          '/images/product-1.jpeg';

        return {
          id: p.id,
          name: p.name,
          price: minPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          comparePrice: comparePrice
            ? comparePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })
            : null,
          badge,
          badgeColor,
          image,
          href: `/product/${p.id}`,
        };
      });
    }

    // Fallback to mock products if no database products
    return MOCK_PRODUCTS.slice(0, 8).map((p) => {
      const discount =
        p.originalPrice && p.originalPrice > p.price
          ? `${Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}% off`
          : p.tag || null;

      return {
        id: String(p.id),
        name: p.name,
        price: p.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        comparePrice: p.originalPrice
          ? p.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })
          : null,
        badge: discount,
        badgeColor: p.originalPrice ? 'text-green-600' : 'text-gray-800',
        image: p.image || '/images/product-1.jpeg',
        href: `/product/${p.id}`,
      };
    });
  }, [dbProducts]);

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

  return (
    <section className="w-full py-16 bg-white overflow-hidden">
      <div className="w-[98%] mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Featured
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full bg-[#EFECE8] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full bg-[#EFECE8] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Products Scroll Container */}
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 md:gap-6 pb-4 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {featuredList.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[260px] md:w-[300px] lg:w-[calc(25%-18px)] snap-start group">
              <Link href={product.href} className="block">
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-[#F2F2F2] mb-3 overflow-hidden rounded-[2px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 260px, (max-width: 1024px) 300px, 25vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold rounded-sm shadow-sm">
                      <span className={product.badgeColor}>{product.badge}</span>
                    </div>
                  )}

                  {/* Eye Icon */}
                  <div className="absolute bottom-3 right-3 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-xs">
                    <Eye size={14} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 px-1">
                  <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                    <span>From Rs. {product.price} INR</span>
                    {product.comparePrice && (
                      <span className="text-[#C15849] line-through">Rs. {product.comparePrice} INR</span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
