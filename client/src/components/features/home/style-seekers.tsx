import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';

const categories = [
  {
    id: 'casuals',
    label: 'CASUALS',
    image: '/images/categories/hoodies.webp',
    height: 'h-[450px]',
  },
  {
    id: 'jacket',
    label: 'JACKET',
    image: '/images/categories/jacket.webp',
    height: 'h-[300px]',
  },
  {
    id: 'shirts',
    label: 'SHIRTS',
    image: '/images/categories/shirt.jpeg',
    height: 'h-[450px]',
  },
  {
    id: 't-shirts',
    label: 'T-SHIRTS',
    image: '/images/categories/tshirt.webp',
    height: 'h-[300px]',
  },
  {
    id: 'pants',
    label: 'PANTS',
    image: '/images/categories/pants.webp',
    height: 'h-[450px]',
  },
  {
    id: 'accessories',
    label: 'ACCESSORIES',
    image: '/images/categories/accessories.webp',
    height: 'h-[300px]',
  },
];

export function StyleSeekers() {
  const scrollItems = [...categories, ...categories]; // Duplicate for infinite scroll

  return (
    <section className="w-full mt-8 py-16 bg-white overflow-hidden">
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Header Section */}
      <div className="flex flex-col items-center text-center mb-12 px-4 md:px-8 max-w-7xl mx-auto">
        <span className="text-xs font-bold tracking-widest text-gray-500 uppercase mb-4">
          Loved by Style Seekers
        </span>
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-8 leading-snug">
          Trusted by thousands for quality and style. Discover why customers love <br />
          our timeless designs and service.
        </h2>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center px-6 py-2.5 border border-gray-300 rounded-full text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Explore Collection
        </Link>
      </div>

      {/* Image Grid Marquee */}
      <div className="flex w-max animate-scroll items-end gap-4 px-2">
        {scrollItems.map((category, index) => (
          <div
            key={`${category.id}-${index}`}
            className={`relative flex-shrink-0 w-[240px] md:w-[280px] lg:w-[320px] ${category.height} group overflow-hidden bg-gray-100 cursor-pointer rounded-sm`}
          >
            {/* Image */}
            <Image
              src={category.image}
              alt={category.label}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80" />

            {/* Bottom Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between z-10">
              <span className="text-white font-bold tracking-wide text-sm">
                {category.label}
              </span>
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-900 hover:scale-110 transition-transform">
                <ArrowUpRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
