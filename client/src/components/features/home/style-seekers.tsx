'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { categoryApi } from '@/api/admin/categories';
import { Skeleton } from '@/components/ui/skeleton';

export function StyleSeekers() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        // Filter out inactive categories and subcategories (only show parent categories)
        const mapped = data
          .filter(cat => cat.isActive && !cat.parentCategoryId)
          .map((cat, index) => ({
            id: cat.id,
            slug: cat.slug,
            label: cat.name.toUpperCase(),
            image: cat.image || 'https://placehold.co/400x600?text=No+Image',
            height: index % 2 === 0 ? 'h-[225px] sm:h-[450px]' : 'h-[150px] sm:h-[300px]',
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

  // Triple items list to provide infinite continuous scrolling in both directions
  const scrollItems = categories.length > 0 ? [...categories, ...categories, ...categories] : [];

  // Continuous smooth auto-slide via requestAnimationFrame (pauses when hovered)
  useEffect(() => {
    if (categories.length === 0) return;

    let animationFrameId: number;

    const autoScroll = () => {
      if (scrollContainerRef.current && !isHovered) {
        const container = scrollContainerRef.current;
        container.scrollLeft += 0.8; // Smooth continuous slide speed

        const oneThird = container.scrollWidth / 3;
        // Wrap around seamlessly when reaching 2/3 of total scroll width
        if (container.scrollLeft >= oneThird * 2) {
          container.scrollLeft -= oneThird;
        }
      }
      animationFrameId = requestAnimationFrame(autoScroll);
    };

    animationFrameId = requestAnimationFrame(autoScroll);

    return () => cancelAnimationFrame(animationFrameId);
  }, [categories, isHovered]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -260 : 260;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <section className="w-full mt-4 sm:mt-8 py-6 sm:py-16 bg-white overflow-hidden">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-8 mb-5 md:mb-16">
          <Skeleton className="h-7 w-48 bg-gray-200" />
        </div>
        <div className="flex gap-3 sm:gap-4 px-4 md:px-8 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton
              key={i}
              className={`flex-shrink-0 w-[160px] sm:w-[240px] md:w-[280px] lg:w-[320px] ${
                i % 2 === 0 ? 'h-[280px] sm:h-[450px]' : 'h-[200px] sm:h-[300px]'
              } bg-gray-200 rounded-sm`}
            />
          ))}
        </div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full mt-4 sm:mt-8 py-6 sm:py-16 bg-white overflow-hidden">
      {/* Header Section with SHOP BY CATEGORY Title and Sliding Navigation Arrows */}
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-8 mb-5 md:mb-16 flex items-center justify-between">
        <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide uppercase">
          SHOP BY CATEGORY
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => handleScroll('left')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFECE8] hover:bg-gray-300 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleScroll('right')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#EFECE8] hover:bg-gray-300 flex items-center justify-center text-gray-800 transition-colors cursor-pointer"
            aria-label="Scroll categories right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Auto-sliding and manual scrollable category card track */}
      <div 
        ref={scrollContainerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex overflow-x-auto items-end gap-3 sm:gap-4 px-4 md:px-8 pb-2 sm:pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {scrollItems.map((category, index) => (
          <Link
            key={`${category.id}-${index}`}
            href={`/shop?category=${category.slug}`}
            className={`relative flex-shrink-0 w-[160px] sm:w-[240px] md:w-[280px] lg:w-[320px] ${category.height} group overflow-hidden bg-gray-100 cursor-pointer rounded-sm block`}
          >
            {/* Image */}
            <Image
              src={category.image}
              alt={category.label}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 sm:p-4 flex items-center justify-between z-10">
              <span className="text-white font-bold tracking-wide text-[11px] sm:text-base truncate pr-1">
                {category.label}
              </span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-110 transition-transform shadow-sm shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
