"use client";

import React, { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const featuredProducts = [
  {
    id: 1,
    name: 'Relaxed Open Front Jacket',
    price: '4,400.00',
    comparePrice: '4,800.00',
    badge: '8% off',
    badgeColor: 'text-green-600',
    image: '/images/featured/1.jpg',
  },
  {
    id: 2,
    name: 'Belted Double Breasted Coat',
    price: '12,600.00',
    comparePrice: '14,100.00',
    badge: '10% off',
    badgeColor: 'text-green-600',
    image: '/images/featured/2.jpg',
  },
  {
    id: 3,
    name: 'Classic Belted Workwear Coat',
    price: '11,200.00',
    comparePrice: null,
    badge: 'New',
    badgeColor: 'text-gray-800',
    image: '/images/featured/3.jpg',
  },
  {
    id: 4,
    name: 'Soft Knit Turtleneck Sweater',
    price: '3,800.00',
    comparePrice: '4,800.00',
    badge: '20% off',
    badgeColor: 'text-green-600',
    image: '/images/featured/4.jpg',
  },
];

export function FeaturedSection() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
              className="w-8 h-8 rounded-full bg-[#EFECE8] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full bg-[#EFECE8] flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
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
          {featuredProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[260px] md:w-[300px] lg:w-[calc(25%-18px)] snap-start group">
              <Link href={`/shop`} className="block">
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-[#F2F2F2] mb-3 overflow-hidden rounded-[2px]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Badge */}
                  {product.badge && (
                    <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold rounded-sm shadow-sm">
                      <span className={product.badgeColor}>{product.badge}</span>
                    </div>
                  )}

                  {/* Eye Icon */}
                  <div className="absolute bottom-3 right-3 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Eye size={14} />
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 px-1">
                  <h3 className="text-[13px] font-medium text-gray-800">{product.name}</h3>
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
