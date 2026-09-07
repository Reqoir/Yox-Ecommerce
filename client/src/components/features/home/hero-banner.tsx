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
  const [isTransitioning, setIsTransitioning] = useState<boolean>(true);
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
      className="w-full relative mt-0 py-0 sm:py-4 overflow-hidden flex justify-center items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full sm:w-[98%] max-w-[1500px] mx-auto">
        <div className="relative overflow-hidden shadow-none sm:shadow-lg border-0 sm:border sm:border-gray-100 bg-gray-950 h-auto aspect-auto sm:aspect-[1440/680] sm:min-h-[400px] md:min-h-[500px]">
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
                        src={slide.imageUrl || '/images/hero-banner.png'}
                        alt={slide.title || 'YOX Collection'}
                        className="w-full h-auto sm:h-full object-contain sm:object-cover object-center"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/hero-banner.png';
                        }}
                      />
                    </picture>

                    {/* Render Text Overlay per slide inside track */}
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
                          className={`absolute inset-0 z-20 flex flex-col justify-center px-6 sm:px-12 md:px-16 pointer-events-none ${
                            slide.textAlign === 'center'
                              ? 'items-center text-center'
                              : slide.textAlign === 'right'
                              ? 'items-end text-right'
                              : 'items-start text-left'
                          } ${slideIsLight ? 'text-gray-950' : 'text-white'}`}
                        >
                          {slide.badgeText && (
                            <div className="flex items-center gap-1.5 mb-2.5 sm:mb-3">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xs ${
                                  slideIsLight
                                    ? 'bg-gray-900 text-white'
                                    : 'bg-white/20 backdrop-blur-md text-white border border-white/30'
                                }`}
                              >
                                <Sparkles size={12} className="text-amber-300" />
                                {slide.badgeText}
                              </span>
                            </div>
                          )}

                          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none drop-shadow-md max-w-2xl">
                            {slide.title}
                          </h1>

                          {slide.subtitle && (
                            <p
                              className={`text-xs sm:text-base md:text-lg mt-2.5 sm:mt-3.5 max-w-xl font-normal leading-relaxed line-clamp-2 sm:line-clamp-3 drop-shadow-sm ${
                                slideIsLight ? 'text-gray-700' : 'text-gray-200'
                              }`}
                            >
                              {slide.subtitle}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 mt-5 sm:mt-7 pointer-events-auto">
                            {slide.buttonText && slide.buttonLink && (
                              <span
                                className={`inline-flex items-center gap-2 font-bold text-xs sm:text-sm px-6 py-3 rounded-md shadow-lg transition-all ${
                                  slideIsLight
                                    ? 'bg-gray-950 text-white'
                                    : 'bg-white text-gray-950'
                                }`}
                              >
                                <span>{slide.buttonText}</span>
                                <ArrowRight size={15} />
                              </span>
                            )}

                            {slide.secondaryButtonText && slide.secondaryButtonLink && (
                              <span
                                className={`inline-flex items-center gap-2 font-semibold text-xs sm:text-sm px-5 py-3 rounded-md backdrop-blur-md border ${
                                  slideIsLight
                                    ? 'border-gray-400 bg-white/70 text-gray-900'
                                    : 'border-white/30 bg-black/40 text-white'
                                }`}
                              >
                                <span>{slide.secondaryButtonText}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </Link>
                </div>
              );
            })}
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
                    onClick={() => {
                      setIsTransitioning(true);
                      setCurrentIndex(idx);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
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
