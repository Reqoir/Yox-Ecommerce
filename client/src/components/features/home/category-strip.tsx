import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const CATEGORIES = [
  { name: 'Shirts', img: '/images/product-1.jpeg' },
  { name: 'Pants', img: '/images/product-3.jpeg' },
  { name: 'T-Shirts', img: '/images/product-2.jpeg' },
  { name: 'Accessories', img: '/images/product-5.jpeg' },
  { name: 'Hoodies', img: '/images/product-6.jpeg' },
];

export function CategoryStrip() {
  return (
    <div className="w-full bg-white border-b">
      <div className="w-full lg:w-[75%] px-4 lg:px-0 mx-auto flex overflow-x-auto lg:flex-wrap items-center justify-start lg:justify-center gap-8 lg:gap-12 py-6 lg:py-8 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((category) => (
          <Link 
            href={`/shop?category=${category.name.toLowerCase()}`} 
            key={category.name}
            className="flex flex-col items-center gap-2 group flex-shrink-0 snap-center"
          >
            <div className="w-20 h-20 overflow-hidden">
              <img 
                src={category.img} 
                alt={category.name} 
                className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-300"
              />
            </div>
            <span className="text-sm font-semibold text-gray-800">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
