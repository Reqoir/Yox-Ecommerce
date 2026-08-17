import React from 'react';
import Link from 'next/link';

export function HeroBanner() {
  return (
    <div className="w-full relative mt-4">
      <Link href="/shop" className="block w-[98%] max-w-[1500px] mx-auto overflow-hidden">
        <img 
          src="/images/Screenshot 2026-08-17 at 11.07.33 PM.png" 
          alt="Yox Collection" 
          className="w-full h-auto object-cover"
        />
      </Link>
    </div>
  );
}
