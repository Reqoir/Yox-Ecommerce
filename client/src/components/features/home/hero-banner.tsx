'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  contentApi,
  HeroBannersConfig,
  HeroBannerSlide,
  DEFAULT_HERO_CONFIG,
} from '@/api/admin/content';

export function HeroBanner() {
  const [config, setConfig] = useState<HeroBannersConfig>(DEFAULT_HERO_CONFIG);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const data = await contentApi.getHeroBanners();
        if (isMounted && data?.slides) {
          setConfig(data);
        }
      } catch (err) {
        console.error('Failed to load hero banner configuration:', err);
      }
    };
    loadBanners();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter only active slides, or fallback to first slide if none are marked active
  const activeSlides = config.slides.filter((s) => s.isActive);
  const slidesToRender: HeroBannerSlide[] =
    activeSlides.length > 0 ? activeSlides : [DEFAULT_HERO_CONFIG.slides[0]];

  // Autoplay carousel timer
  useEffect(() => {
    if (!config.autoPlay || slidesToRender.length <= 1 || isHovered) return;

    const intervalSeconds = (config.autoPlayInterval || 6) * 1000;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slidesToRender.length);
    }, intervalSeconds);

    return () => clearInterval(timer);
  }, [config.autoPlay, config.autoPlayInterval, slidesToRender.length, isHovered]);

  // Ensure currentIndex stays within bounds if slides change
  const current = slidesToRender[currentIndex] || slidesToRender[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slidesToRender.length) % slidesToRender.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slidesToRender.length);
  };

  const isLight = current.theme === 'light';
  const overlayOpacity = (current.overlayOpacity ?? 45) / 100;

  return (
    <section
      className="w-full relative py-2 sm:py-4 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-[98%] max-w-[1500px] mx-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gray-950 aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[300px] sm:min-h-[360px] md:min-h-[440px] max-h-[520px]">
          {/* Background Images with smooth fade transition */}
          {slidesToRender.map((slide, idx) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={slide.imageUrl || '/images/hero-banner.png'}
                alt={slide.title || 'YOX Collection'}
                className="w-full h-full object-cover object-center transform scale-100 transition-transform duration-1000"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/hero-banner.png';
                }}
              />
            </div>
          ))}

          {/* Dynamic Gradient Overlay */}
          <div
            className={`absolute inset-0 z-10 transition-all duration-500 ${
              isLight
                ? 'bg-gradient-to-t sm:bg-gradient-to-r from-white via-white/80 to-transparent'
                : 'bg-gradient-to-t sm:bg-gradient-to-r from-black/90 via-black/60 to-transparent'
            }`}
            style={{ opacity: overlayOpacity }}
          />

          {/* Content Layer */}
          <div
            className={`absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 ${
              current.textAlign === 'center'
                ? 'items-center text-center'
                : current.textAlign === 'right'
                  ? 'items-end text-right'
                  : 'items-start text-left'
            } ${isLight ? 'text-gray-950' : 'text-white'}`}
          >
            {/* Badge / Tag */}
            {current.badgeText && (
              <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs ${
                    isLight
                      ? 'bg-gray-900 text-white'
                      : 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                  }`}
                >
                  <Sparkles size={12} className="text-amber-300" />
                  {current.badgeText}
                </span>
              </div>
            )}

            {/* Headline / Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none drop-shadow-md max-w-2xl">
              {current.title}
            </h1>

            {/* Subtitle / Description */}
            {current.subtitle && (
              <p
                className={`text-xs sm:text-base md:text-lg mt-2.5 sm:mt-3.5 max-w-xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow-sm ${
                  isLight ? 'text-gray-700' : 'text-gray-200'
                }`}
              >
                {current.subtitle}
              </p>
            )}

            {/* Call to Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-5 sm:mt-7">
              {current.buttonText && current.buttonLink && (
                <Link
                  href={current.buttonLink}
                  className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-md shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                    isLight
                      ? 'bg-gray-950 text-white hover:bg-gray-800'
                      : 'bg-white text-gray-950 hover:bg-gray-100'
                  }`}
                >
                  <span>{current.buttonText}</span>
                  <ArrowRight size={15} />
                </Link>
              )}

              {current.secondaryButtonText && current.secondaryButtonLink && (
                <Link
                  href={current.secondaryButtonLink}
                  className={`inline-flex items-center gap-2 font-semibold text-xs sm:text-sm px-5 py-3 rounded-md backdrop-blur-md transition-all border ${
                    isLight
                      ? 'border-gray-400 bg-white/70 text-gray-900 hover:bg-white'
                      : 'border-white/30 bg-black/40 text-white hover:bg-black/60'
                  }`}
                >
                  <span>{current.secondaryButtonText}</span>
                </Link>
              )}
            </div>
          </div>

          {/* Carousel Arrows (Only when > 1 slide) */}
          {slidesToRender.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-xs text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-xs text-white flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                aria-label="Next Slide"
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                {slidesToRender.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      currentIndex === idx
                        ? 'w-7 bg-white shadow-md'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
