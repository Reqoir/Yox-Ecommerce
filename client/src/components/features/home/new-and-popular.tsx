"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ChevronDown } from 'lucide-react';

const TABS = ['ALL', 'SHIRTS', 'T-SHIRTS', 'JEANS', 'TROUSERS', 'SHOES'];

const PRODUCTS = [
  {
    id: 1,
    name: 'Regular Fit Linen Blend Checks Shirt',
    price: '1299',
    image: '/images/new-popular/shirts/1.webp',
  },
  {
    id: 2,
    name: 'Cream Regular Fit Stretch Shirt',
    price: '1399',
    image: '/images/new-popular/shirts/2.webp',
  },
  {
    id: 3,
    name: 'Paisley Print Box Fit Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/3.webp',
  },
  {
    id: 4,
    name: 'Cotton Linen Floral Box Fit Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/4.webp',
  },
  {
    id: 5,
    name: 'Regular Fit Abstract Shirt',
    price: '1099',
    image: '/images/new-popular/shirts/5.webp',
  },
  {
    id: 6,
    name: 'Olive Floral Print Casual Shirt',
    price: '1299',
    image: '/images/new-popular/shirts/6.webp',
  },
  {
    id: 7,
    name: 'Classic White Dress Shirt',
    price: '1499',
    image: '/images/new-popular/shirts/7.webp',
  },
  {
    id: 8,
    name: 'Black Regular Fit Casual Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/8.webp',
  },
  {
    id: 9,
    name: 'Purple Floral Box Fit Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/9.webp',
  },
  {
    id: 10,
    name: 'Off-White Relaxed Fit Polo',
    price: '1099',
    image: '/images/new-popular/shirts/10.webp',
  },
  {
    id: 11,
    name: 'Light Blue Classic Collar Shirt',
    price: '1399',
    image: '/images/new-popular/shirts/11.webp',
  },
  {
    id: 12,
    name: 'Navy Blue Textured Casual Shirt',
    price: '1499',
    image: '/images/new-popular/shirts/12.webp',
  },
  {
    id: 13,
    name: 'Burgundy Geometric Print Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/13.webp',
  },
  {
    id: 14,
    name: 'Mustard Yellow Corduroy Shirt',
    price: '1299',
    image: '/images/new-popular/shirts/14.webp',
  },
  {
    id: 15,
    name: 'Charcoal Grey Mandarin Collar Shirt',
    price: '1199',
    image: '/images/new-popular/shirts/15.webp',
  },
];

export function NewAndPopular() {
  const [activeTab, setActiveTab] = useState('SHIRTS');

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
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-[11px] font-bold tracking-widest uppercase transition-colors border border-gray-300 ${
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
          {PRODUCTS.map((product) => (
            <Link href={`/shop/${product.id}`} key={product.id} className="group block">
              <div className="relative aspect-[3/4] w-full bg-[#f6f6f6] mb-3 overflow-hidden">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover object-top"
                />
                <button 
                  className="absolute top-2 right-2 p-1.5 text-gray-600 hover:text-red-500 transition-colors"
                  aria-label="Add to favorites"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent navigating to product page when clicking heart
                    // handle favorite logic
                  }}
                >
                  <Heart size={18} strokeWidth={1.5} />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-1">
                <h3 className="text-[12px] font-medium text-gray-800 line-clamp-1 truncate">
                  {product.name}
                </h3>
                <span className="text-[12px] font-medium text-gray-600">
                  ₹{product.price}
                </span>
              </div>
            </Link>
          ))}
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
