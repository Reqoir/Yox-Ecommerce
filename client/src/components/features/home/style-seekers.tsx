'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import { categoryApi, Category } from '@/api/admin/categories';

export function StyleSeekers() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        // Filter out inactive categories and map to UI format
        const mapped = data
          .filter(cat => cat.isActive)
          .map((cat, index) => ({
            id: cat.id,
            slug: cat.slug,
            label: cat.name.toUpperCase(),
            image: cat.image || 'https://placehold.co/400x600?text=No+Image',
            height: index % 2 === 0 ? 'h-[450px]' : 'h-[300px]',
          }));
        
        setCategories(mapped);
      } catch (error) {
        console.error('Failed to fetch categories', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  // Duplicate for infinite scroll animation (if we have categories)
  const scrollItems = categories.length > 0 ? [...categories, ...categories] : [];

  if (isLoading) {
    return (
      <section className="w-full mt-8 py-16 bg-white overflow-hidden flex justify-center min-h-[500px] items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full mt-8 py-16 bg-white overflow-hidden">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">
          Loved by Style Seekers
        </span>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 leading-snug">
          Trusted by thousands for quality and style. Discover why customers love <br />
          our timeless designs and service.
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Explore Collection
        </Link>
      </div>

      {/* Image Grid Marquee */}
      <div className="flex w-max animate-scroll items-end gap-4 px-2">
        {scrollItems.map((category, index) => (
          <Link
            key={`${category.id}-${index}`}
            href={`/shop?category=${category.slug}`}
            className={`relative flex-shrink-0 w-[240px] md:w-[280px] lg:w-[320px] ${category.height} group overflow-hidden bg-gray-100 cursor-pointer rounded-sm block`}
          >
            {/* Image */}
            <Image
              src={category.image}
              alt={category.label}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <span className="text-white font-bold tracking-wide text-sm">
                {category.label}
              </span>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-110 transition-transform">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

