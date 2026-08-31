'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { categoryApi, Category } from '@/api/admin/categories';

export function CategoryStrip() {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryApi.getAll();
        // Filter out inactive categories and map to UI format
        const mapped = data
          .filter(cat => cat.isActive)
          .map((cat) => ({
            name: cat.name,
            slug: cat.slug,
            img: cat.image || 'https://placehold.co/200x200?text=No+Image',
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

  if (isLoading || categories.length === 0) {
    return (
      <div className="w-full bg-white border-b min-h-[128px] flex items-center justify-center">
        {isLoading && <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
      </div>
    );
  }

  return (
    <div className="w-full bg-white border-b">
      <div className="w-full lg:w-[98%] lg:max-w-[1500px] px-4 lg:px-0 mx-auto flex overflow-x-auto lg:flex-wrap items-center justify-start lg:justify-center gap-8 lg:gap-12 py-6 lg:py-8 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <Link 
            href={`/shop?category=${category.slug}`} 
            key={category.slug}
            className="flex flex-col items-center gap-2 group flex-shrink-0 snap-center"
          >
            <div className="w-20 h-20 overflow-hidden rounded-full border border-gray-100 shadow-sm group-hover:border-[#1A2E4C] transition-colors">
              <img 
                src={category.img} 
                alt={category.name} 
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-xs font-bold text-gray-800 tracking-wide group-hover:text-[#1A2E4C] transition-colors">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
