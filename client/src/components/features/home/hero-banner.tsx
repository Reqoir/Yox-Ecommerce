import React from 'react';
import Link from 'next/link';

export function HeroBanner() {
  return (
    <div className="w-full relative mt-4">
      <Link href="/shop" className="block w-[95%] md:w-[85%] lg:w-[95%] mx-auto overflow-hidden">
        <img 
          src="/images/hero-banner.png" 
          alt="Men's Autumn Collection From £17.99" 
          className="w-full h-auto object-cover"
        />
      </Link>
    </div>
  );
}
