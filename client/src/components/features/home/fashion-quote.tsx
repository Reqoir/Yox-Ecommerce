'use client';

import React, { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface FashionQuoteItem {
  quote: string;
  author: string;
  tagline: string;
}

const FASHION_QUOTES: FashionQuoteItem[] = [
  {
    quote: "Elegance is not about being noticed, it is about being remembered.",
    author: "GIORGIO ARMANI",
    tagline: "THE YŌX ESSENCE",
  },
  {
    quote: "Style is a way to say who you are without having to speak.",
    author: "RACHEL ZOE",
    tagline: "MODERN SILHOUETTES",
  },
  {
    quote: "Fashion fades, only style remains the same. Curated for the modern gentleman.",
    author: "COCO CHANEL",
    tagline: "TIMELESS CRAFTSMANSHIP",
  },
  {
    quote: "Simplicity is the keynote of all true elegance and quiet confidence.",
    author: "YŌX EDITORIAL",
    tagline: "DISTINCTIVE MENSWEAR",
  },
];

export function FashionQuote() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      handleNext();
    }, 6000);
    return () => clearInterval(timer);
  }, [currentIndex]);

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % FASHION_QUOTES.length);
      setIsFading(false);
    }, 300);
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + FASHION_QUOTES.length) % FASHION_QUOTES.length);
      setIsFading(false);
    }, 300);
  };

  const current = FASHION_QUOTES[currentIndex];

  return (
    <section 
      aria-label="Fashion Philosophy"
      className="w-full bg-[#F8F7F4] border-t border-[#EAE6DF] py-8 sm:py-10 px-4 overflow-hidden relative"
    >
      <div className="w-[98%] max-w-[1100px] mx-auto flex flex-col items-center justify-center text-center relative">
        
        {/* Subtle decorative quotation watermark */}
        <div className="flex items-center justify-center gap-2 mb-2 text-[#1A2E4C]/70">
          <span className="h-px w-8 bg-[#E2DCD3]" />
          <span className="text-[10px] tracking-[0.28em] uppercase font-bold text-gray-500">
            {current.tagline}
          </span>
          <span className="h-px w-8 bg-[#E2DCD3]" />
        </div>

        {/* Interactive Quote Container */}
        <div className="relative w-full max-w-[850px] min-h-[70px] sm:min-h-[80px] flex items-center justify-center px-8 sm:px-12">
          
          {/* Previous Button */}
          <button
            onClick={handlePrev}
            aria-label="Previous quote"
            className="absolute left-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1A2E4C] transition-colors rounded-none hover:bg-white/80 hover:shadow-2xs cursor-pointer"
          >
            <ChevronLeft size={18} strokeWidth={1.75} />
          </button>

          {/* Quote Text */}
          <div
            className={`transition-opacity duration-300 transform flex flex-col items-center ${
              isFading ? 'opacity-0 scale-[0.99]' : 'opacity-100 scale-100'
            }`}
          >
            <blockquote className="text-[15px] sm:text-[17px] md:text-[19px] font-light text-gray-800 tracking-normal sm:tracking-wide italic leading-relaxed">
              &ldquo;{current.quote}&rdquo;
            </blockquote>

            <cite className="not-italic text-[10px] sm:text-[11px] font-bold tracking-[0.22em] text-[#1A2E4C] uppercase mt-2 block">
              — {current.author} —
            </cite>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            aria-label="Next quote"
            className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-[#1A2E4C] transition-colors rounded-none hover:bg-white/80 hover:shadow-2xs cursor-pointer"
          >
            <ChevronRight size={18} strokeWidth={1.75} />
          </button>
        </div>

        {/* Minimal dot pagination */}
        <div className="flex items-center gap-1.5 mt-4">
          {FASHION_QUOTES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (idx !== currentIndex) {
                  setIsFading(true);
                  setTimeout(() => {
                    setCurrentIndex(idx);
                    setIsFading(false);
                  }, 300);
                }
              }}
              aria-label={`Go to quote ${idx + 1}`}
              className={`h-1 rounded-none transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? 'w-5 bg-[#1A2E4C]'
                  : 'w-1.5 bg-[#D8D2C7] hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
