'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import {
  contentApi,
  HeroBannersConfig,
  HeroBannerSlide,
  DEFAULT_HERO_CONFIG,
} from '@/api/admin/content';

const HERO_CACHE_KEY = 'yox_hero_banners_cache_v2';

export function HeroBanner() {
  const [config, setConfig] = useState<HeroBannersConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(HERO_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed?.slides) && parsed.slides.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return DEFAULT_HERO_CONFIG;
  });
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadBanners = async () => {
      try {
        const data = await contentApi.getHeroBanners();
        if (isMounted && data?.slides && data.slides.length > 0) {
          setConfig(data);
          try {
            localStorage.setItem(HERO_CACHE_KEY, JSON.stringify(data));
          } catch {}
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

  // Build extended slides array (append duplicate of 1st slide at end for infinite loop)
  const displaySlides =
    slidesToRender.length > 1
      ? [...slidesToRender, { ...slidesToRender[0], id: `${slidesToRender[0].id}-clone` }]
      : slidesToRender;

  // Autoplay sliding carousel timer (always right-to-left)
  useEffect(() => {
    if (slidesToRender.length <= 1) return;

    const intervalSeconds = (config.autoPlayInterval || 4) * 1000;
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev + 1);
    }, intervalSeconds);

    return () => clearInterval(timer);
  }, [config.autoPlayInterval, slidesToRender.length]);

  // Handle transition end for seamless instant wrap (clone -> index 0)
  const handleTransitionEnd = () => {
    if (currentIndex >= slidesToRender.length) {
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTransitioning(true);
    if (currentIndex === 0) {
      setIsTransitioning(false);
      setCurrentIndex(slidesToRender.length - 1);
    } else {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const activeIndex = currentIndex % slidesToRender.length;
  const current = slidesToRender[activeIndex] || slidesToRender[0];

  return (
    <section
      className="w-full relative z-0 isolate py-0 sm:py-4 bg-white flex justify-center items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full sm:w-[98%] max-w-[1500px] mx-auto px-0">
        <div className="relative overflow-hidden rounded-none bg-gray-950 w-full h-[calc(100svh-114px)] min-h-[calc(100svh-114px)] sm:h-auto sm:aspect-[1440/680] sm:min-h-[400px] md:min-h-[500px]">
          {/* Sliding Track Container */}
          <div
            className={`flex w-full h-full ${
              isTransitioning ? 'transition-transform duration-1000 ease-in-out' : ''
            }`}
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            onTransitionEnd={handleTransitionEnd}
          >
            {displaySlides.map((slide, idx) => {
              const linkHref = slide.buttonLink || (slide.categorySlug ? `/shop?category=${slide.categorySlug}` : '/shop');
              const slideIsLight = slide.theme === 'light';
              const slideOverlayOpacity = (slide.overlayOpacity ?? 45) / 100;

              return (
                <div key={`${slide.id}-${idx}`} className="relative w-full h-full shrink-0 overflow-hidden">
                  <Link href={linkHref} className="block w-full h-full cursor-pointer relative">
                    <picture className="w-full h-full block">
                      {slide.mobileImageUrl && (
                        <source media="(max-width: 640px)" srcSet={slide.mobileImageUrl} />
                      )}
                      <img
                        src={slide.imageUrl || DEFAULT_HERO_CONFIG.slides[0]?.imageUrl}
                        alt={slide.title || 'YOX Collection'}
                        className="w-full h-full object-cover object-top sm:object-center"
                        onError={(e) => {
                          if (DEFAULT_HERO_CONFIG.slides[0]?.imageUrl) {
                            (e.target as HTMLImageElement).src = DEFAULT_HERO_CONFIG.slides[0].imageUrl;
                          }
                        }}
                      />
                    </picture>

                    {/* Render Text Overlay per slide inside track if enabled */}
                    {slide.showTextOverlay && (
                      <>
                        <div
                          className={`absolute inset-0 z-10 pointer-events-none ${
                            slideIsLight
                              ? 'bg-gradient-to-t sm:bg-gradient-to-r from-white via-white/80 to-transparent'
                              : 'bg-gradient-to-t sm:bg-gradient-to-r from-black/90 via-black/60 to-transparent'
                          }`}
                          style={{ opacity: slideOverlayOpacity }}
                        />

                        <div
                          className={`absolute inset-0 z-20 flex flex-col justify-center px-5 py-6 sm:px-12 md:px-16 pointer-events-none ${
                            slide.textAlign === 'center'
                              ? 'items-center text-center'
                              : slide.textAlign === 'right'
                              ? 'items-end text-right'
                              : 'items-start text-left'
                          } ${slideIsLight ? 'text-gray-950' : 'text-white'}`}
                        >
                          {slide.badgeText && (
                            <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-none shadow-xs ${
                                  slideIsLight
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                                }`}
                              >
                                <Sparkles size={11} className="text-amber-300" />
                                {slide.badgeText}
                              </span>
                            </div>
                          )}

                          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-none drop-shadow-md max-w-2xl">
                            {slide.title}
                          </h1>

                          {slide.subtitle && (
                            <p
                              className={`text-xs sm:text-base md:text-lg mt-2 sm:mt-3.5 max-w-xl font-normal leading-snug line-clamp-2 sm:line-clamp-3 drop-shadow-sm ${
                                slideIsLight ? 'text-gray-700' : 'text-gray-200'
                              }`}
                            >
                              {slide.subtitle}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </Link>

                  {/* Centered "Shop Now" Button: links directly to /shop (separate from slide image link) */}
                  <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2.5 sm:gap-3 pl-5 pr-1.5 sm:pl-7 sm:pr-2.5 py-1.5 sm:py-2.5 rounded-none bg-white/95 hover:bg-white text-gray-950 shadow-[0_10px_35px_rgba(0,0,0,0.28)] backdrop-blur-md border border-white/80 transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
                    >
                      <span className="text-[11px] sm:text-xs md:text-[13px] font-extrabold tracking-[0.2em] uppercase text-gray-950">
                        Shop Now
                      </span>
                      <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-none bg-black text-white flex items-center justify-center transition-all duration-300 group-hover:bg-neutral-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shadow-xs shrink-0">
                        <ArrowUpRight size={13} strokeWidth={2.5} />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Arrows (Desktop Only - Hidden on Mobile) */}
          {slidesToRender.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-none bg-black/40 hover:bg-black/75 backdrop-blur-xs text-white items-center justify-center transition-all cursor-pointer hover:scale-105"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={handleNext}
                className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-none bg-black/40 hover:bg-black/75 backdrop-blur-xs text-white items-center justify-center transition-all cursor-pointer hover:scale-105"
                aria-label="Next Slide"
              >
                <ChevronRight size={20} />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
                {slidesToRender.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsTransitioning(true);
                      setCurrentIndex(idx);
                    }}
                    className={`h-2 rounded-none transition-all cursor-pointer ${
                      activeIndex === idx ? 'w-7 bg-white shadow-md' : 'w-2 bg-white/40 hover:bg-white/70'
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
