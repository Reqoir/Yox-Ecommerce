import React from 'react';
import Link from 'next/link';

const ARRIVALS = [
  { id: 1, image: '/images/product-1.jpeg' },
  { id: 2, image: '/images/product-2.jpeg' },
  { id: 3, image: '/images/product-3.jpeg' },
  { id: 4, image: '/images/product-4.jpeg' },
  { id: 5, image: '/images/product-6.jpeg' }, // Using product 6 as the 5th image (T-Shirt)
];

export function NewArrivals() {
  return (
    <section className="w-[75%] mx-auto py-16">
      <h2 className="text-2xl font-bold tracking-wide text-[#1A2E4C] mb-8">New Arrivals</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ARRIVALS.map((item) => (
          <Link href={`/product/${item.id}`} key={item.id} className="block group">
            <div className="aspect-[3/4] overflow-hidden bg-gray-100">
              <img 
                src={item.image} 
                alt={`New Arrival ${item.id}`} 
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
