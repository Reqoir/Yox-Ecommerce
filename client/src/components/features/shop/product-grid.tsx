import React from 'react';
import { Heart, ChevronDown } from 'lucide-react';
import Link from 'next/link';

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Men Textured Regular Fit Polo T-shirt',
    image: '/images/product-1.jpeg',
    price: 799,
    originalPrice: null,
    bestPrice: 699,
    tag: 'NEW'
  },
  {
    id: 2,
    name: 'URB_N Men Oversized Superman Printed T-shirt',
    image: '/images/product-2.jpeg',
    price: 559,
    originalPrice: 699,
    bestPrice: 489,
    tag: 'ON OFFER'
  },
  {
    id: 3,
    name: 'Men Slim Fit Solid Polo T-shirt',
    image: '/images/product-3.jpeg',
    price: 349,
    originalPrice: 399,
    bestPrice: 305,
    tag: 'ON OFFER'
  },
  {
    id: 4,
    name: 'Men Slim Fit Solid Polo T-shirt',
    image: '/images/product-4.jpeg',
    price: 349,
    originalPrice: 399,
    bestPrice: 305,
    tag: 'ON OFFER'
  },
  {
    id: 5,
    name: 'Men Casual Regular Fit Polo T-shirt',
    image: '/images/product-5.jpeg',
    price: 499,
    originalPrice: 599,
    bestPrice: 420,
    tag: 'NEW'
  },
  {
    id: 6,
    name: 'Men Striped Slim Fit T-shirt',
    image: '/images/product-6.jpeg',
    price: 399,
    originalPrice: 499,
    bestPrice: 350,
    tag: 'ON OFFER'
  }
];

export function ProductGrid() {
  return (
    <div className="w-full pl-6 border-l border-gray-100">
      
      {/* Top Meta Area */}
      <div className="mb-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Link href="/" className="hover:text-gray-900">Home</Link>
          <span>&gt;</span>
          <Link href="/shop" className="hover:text-gray-900">Men</Link>
          <span>&gt;</span>
          <Link href="/shop" className="hover:text-gray-900">Tops</Link>
          <span>&gt;</span>
          <span className="text-gray-800">T-Shirts</span>
        </div>

        {/* Title and Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-bold text-gray-900">T-Shirts for Men</h1>
            <span className="text-xs text-gray-500">- 1173 products available</span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-900 uppercase">Sort By</span>
            <div className="relative">
              <select className="appearance-none border border-gray-300 rounded-[2px] py-2 pl-4 pr-10 text-sm text-gray-800 outline-none focus:border-gray-500 bg-white">
                <option>Relevance</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest Arrivals</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <div key={product.id} className="flex flex-col group cursor-pointer">
            {/* Image Box */}
            <div className="relative w-full aspect-[3/4] bg-gray-100 overflow-hidden mb-3">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Wishlist Button */}
              <button className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm hover:bg-white text-gray-600 hover:text-black transition-colors">
                <Heart size={16} strokeWidth={2} />
              </button>

              {/* Tag */}
              {product.tag && (
                <div className="absolute bottom-3 left-3 bg-white px-3 py-1 text-[10px] font-bold text-gray-900 uppercase shadow-sm">
                  {product.tag}
                </div>
              )}
            </div>

            {/* Product Details */}
            <h3 className="text-sm text-gray-500 mb-1 truncate" title={product.name}>
              {product.name}
            </h3>
            
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
              {product.originalPrice && (
                <span className="text-xs text-gray-400 line-through">₹{product.originalPrice}</span>
              )}
            </div>
            
            <div className="text-xs text-green-600">
              Best price <span className="font-semibold">₹{product.bestPrice}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
