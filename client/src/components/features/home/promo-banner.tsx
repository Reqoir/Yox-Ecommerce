import React from 'react';
import Link from 'next/link';

export function PromoBanner() {
  return (
    <section className="w-[95%] md:w-[85%] lg:w-[95%] mx-auto py-8">
      <Link href="/shop?category=linen" className="block w-full overflow-hidden">
        <img 
          src="/images/linen-banner.png" 
          alt="The New Linen - The perfect balance of easy luxury. Starting at ₹999" 
          className="w-full h-auto object-cover hover:opacity-95 transition-opacity"
        />
      </Link>
    </section>
  );
}
