'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, ArrowRight, Sparkles, Flame, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { offersApi, Offer } from '@/api/admin/offers';
import { toast } from 'sonner';

export function OfferBannerSlider() {
  const [banners, setBanners] = useState<Offer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Time left state for current banner
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await offersApi.getBanners();
        setBanners(data);
      } catch (err) {
        console.error('Failed to fetch offer banners:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Calculate live countdown for active banner
  useEffect(() => {
    if (banners.length === 0) return;
    const currentOffer = banners[currentIndex];
    if (!currentOffer?.endDate || !currentOffer.isLimitedTime) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(currentOffer.endDate).getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [banners, currentIndex]);

  // Autoplay banner carousel
  useEffect(() => {
    if (banners.length <= 1) return;
    const autoPlay = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(autoPlay);
  }, [banners.length]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (isLoading || banners.length === 0) {
    return null; // Don't render banner strip if no active banners configured
  }

  const current = banners[currentIndex];
  const bannerInfo = current.banner;
  const isFlashSale = current.isLimitedTime || current.offerType === 'LIMITED_TIME';

  return (
    <section className="w-full relative py-4 lg:py-6 overflow-hidden">
      <div className="w-[98%] max-w-[1500px] mx-auto">
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-100 bg-gray-950 aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] min-h-[260px] max-h-[460px]">

          {/* Background Image */}
          {bannerInfo?.imageUrl ? (
            <img
              src={bannerInfo.imageUrl}
              alt={bannerInfo.title || current.title}
              className="w-full h-full object-cover object-center transition-all duration-700 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
          )}

          {/* Gradient Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/85 via-black/55 to-transparent flex flex-col justify-center px-6 sm:px-12 md:px-16 text-white z-10">

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
              <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-xs ${current.offerType === 'CELEBRATION'
                ? 'bg-amber-500 text-black'
                : current.offerType === 'LIMITED_TIME'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-blue-600 text-white'
                }`}>
                {current.offerType === 'CELEBRATION' ? (
                  <>
                    <Sparkles size={12} /> {current.badgeText || 'Celebration Sale'}
                  </>
                ) : isFlashSale ? (
                  <>
                    <Flame size={12} /> {current.badgeText || 'Flash Deal'}
                  </>
                ) : (
                  <>
                    <Sparkles size={12} /> {current.badgeText || `${current.offerType} Offer`}
                  </>
                )}
              </span>

              {/* Discount Percentage Pill */}
              <span className="bg-white/20 backdrop-blur-md text-white font-extrabold text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full border border-white/30">
                {current.discountType === 'PERCENTAGE'
                  ? `${current.discountValue}% OFF`
                  : `₹${current.discountValue} FLAT OFF`}
              </span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-none text-white drop-shadow-md max-w-xl">
              {bannerInfo?.title || current.title}
            </h2>

            <p className="text-xs sm:text-base text-gray-200 mt-2 max-w-md line-clamp-2 drop-shadow-sm font-medium">
              {bannerInfo?.subtitle || current.description || 'Exclusive discounts crafted for modern styles. Limited availability.'}
            </p>

            {/* Countdown Clock (If Limited Time) */}
            {timeLeft && (
              <div className="flex items-center gap-2 mt-3 sm:mt-4">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1 mr-1">
                  <Clock size={14} className="text-amber-400 animate-spin" style={{ animationDuration: '4s' }} /> Ends In:
                </span>
                <div className="flex items-center gap-1.5 font-mono text-center">
                  <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded px-2 py-1 min-w-[36px]">
                    <span className="text-xs sm:text-sm font-black">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">d</span>
                  </div>
                  <span className="font-bold text-gray-400">:</span>
                  <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded px-2 py-1 min-w-[36px]">
                    <span className="text-xs sm:text-sm font-black">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">h</span>
                  </div>
                  <span className="font-bold text-gray-400">:</span>
                  <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded px-2 py-1 min-w-[36px]">
                    <span className="text-xs sm:text-sm font-black">{String(timeLeft.mins).padStart(2, '0')}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">m</span>
                  </div>
                  <span className="font-bold text-gray-400">:</span>
                  <div className="bg-black/70 backdrop-blur-md border border-white/20 rounded px-2 py-1 min-w-[36px]">
                    <span className="text-xs sm:text-sm font-black text-rose-400">{String(timeLeft.secs).padStart(2, '0')}</span>
                    <span className="text-[8px] text-gray-400 block uppercase">s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar (Dedicated Offer Page Link) */}
            <div className="flex flex-wrap items-center gap-3 mt-4 sm:mt-5">
              <Link
                href={`/offers/${current.id}`}
                className="inline-flex items-center gap-2 bg-white text-gray-950 hover:bg-gray-100 font-bold text-xs sm:text-sm px-5 py-2.5 rounded-md shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                {bannerInfo?.ctaText || 'Shop Offer'}
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Carousel Arrows (If > 1 Banner) */}
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Previous Banner"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-xs text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Next Banner"
              >
                <ChevronRight size={18} />
              </button>

              {/* Indicator Dots */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${currentIndex === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
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
