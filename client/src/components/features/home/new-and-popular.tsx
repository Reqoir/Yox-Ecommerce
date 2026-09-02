"use client";

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ChevronDown } from 'lucide-react';
import { useProducts } from '@/hooks/admin/useProducts';
import { useCategories } from '@/hooks/admin/useCategories';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { MOCK_PRODUCTS } from '@/constants/products';

const DEFAULT_TABS = ['ALL', 'SHIRTS', 'T-SHIRTS', 'JEANS', 'TROUSERS', 'SHOES'];

export function NewAndPopular() {
  const [activeTab, setActiveTab] = useState('ALL');
  const { products: dbProducts, isLoading: isProductsLoading } = useProducts();
  const { categories: dbCategories } = useCategories();
  const { isFavourite, toggleFavourite } = useFavouritesStore();

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
      .filter((c) => c.isActive !== false)
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
      const active = dbProducts.filter((p) => p.isActive !== false);

      const mapped = active.map((p) => {
        const catName = p.categoryId ? categoryMap.get(p.categoryId) || p.categoryId : 'Apparel';
        const variants = p.variants || [];
        const firstVariant = variants.find((v) => v.isDefault) || variants[0];
        const validPrices = variants
          .map((v) => v.price)
          .filter((pr) => typeof pr === 'number' && pr > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : firstVariant?.price || 999;
        const comparePrice = firstVariant?.comparePrice || null;
        const image =
          firstVariant?.images?.[0] ||
          p.thumbnail ||
          variants.flatMap((v) => v.images || [])[0] ||
          '/images/product-1.jpeg';

        return {
          id: p.id,
          name: p.name,
          category: catName,
          price: minPrice,
          comparePrice,
          image,
          href: `/product/${p.id}`,
        };
      });

      if (activeTab === 'ALL') {
        return mapped.slice(0, 15);
      }

      // Filter by category name or product name matching activeTab
      const tabUpper = activeTab.toUpperCase();
      const filtered = mapped.filter((p) => {
        const catUpper = p.category.toUpperCase();
        const nameUpper = p.name.toUpperCase();
        return (
          catUpper === tabUpper ||
          catUpper.includes(tabUpper) ||
          tabUpper.includes(catUpper) ||
          nameUpper.includes(tabUpper.replace(/S$/, '')) // e.g., 'SHIRT' matches 'SHIRTS'
        );
      });

      return filtered.length > 0 ? filtered.slice(0, 15) : mapped.slice(0, 15);
    }

    // Fallback to MOCK_PRODUCTS if database is empty
    if (activeTab === 'ALL') {
      return MOCK_PRODUCTS.slice(0, 15).map((p) => ({
        id: String(p.id),
        name: p.name,
        category: p.category,
        price: p.price,
        comparePrice: p.originalPrice || null,
        image: p.image || '/images/product-1.jpeg',
        href: `/product/${p.id}`,
      }));
    }

    const tabUpper = activeTab.toUpperCase();
    const mockFiltered = MOCK_PRODUCTS.filter((p) => {
      const catUpper = p.category.toUpperCase();
      return (
        catUpper === tabUpper ||
        catUpper.includes(tabUpper) ||
        p.name.toUpperCase().includes(tabUpper.replace(/S$/, ''))
      );
    });

    const results = mockFiltered.length > 0 ? mockFiltered : MOCK_PRODUCTS;
    return results.slice(0, 15).map((p) => ({
      id: String(p.id),
      name: p.name,
      category: p.category,
      price: p.price,
      comparePrice: p.originalPrice || null,
      image: p.image || '/images/product-1.jpeg',
      href: `/product/${p.id}`,
    }));
  }, [dbProducts, activeTab, categoryMap]);

  return (
    <section className="w-full py-16 bg-white overflow-hidden">
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-10">
          <h2 className="text-[20px] font-bold text-gray-900 tracking-wide uppercase mb-6">
            NEW AND POPULAR
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {tabs.map((tab) => (
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

        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {filteredProducts.map((product) => {
            const isFav = isFavourite(product.id);

            return (
              <Link href={product.href} key={product.id} className="group block">
                <div className="relative aspect-[3/4] w-full bg-[#f6f6f6] mb-3 overflow-hidden rounded-[2px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  <button 
                    type="button"
                    className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors z-10 cursor-pointer bg-white/60 hover:bg-white rounded-full backdrop-blur-xs"
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
                        inStock: true,
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
                  <span className="text-[12px] font-medium text-gray-600">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

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
