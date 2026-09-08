'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { offersApi, Offer } from '@/api/admin/offers';
import { toast } from 'sonner';

// Curated luxury fashion editorial fallback slides if no banners exist in database
const FALLBACK_CAMPAIGNS: Partial<Offer>[] = [
  {
    id: '6a9f04f3de097e23e83541f4',
    title: 'Onam Offer',
    description: 'Festive Season Exclusive: Get Extra 15% Off!',
    code: 'ONAM15',
    offerType: 'CELEBRATION',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    badgeText: 'FESTIVE SALE',
    badgeColor: '#DC2626',
    isLimitedTime: false,
    banner: {
      imageUrl: 'https://res.cloudinary.com/s9pshncg/image/upload/v1788806365/yox_ecommerce_products/ch0jejugozsuzd3fpmoy.png',
      title: 'Onam Offer',
      subtitle: 'Festive Season Exclusive: Get Extra 15% Off!',
      ctaText: 'Explore Offer',
      ctaLink: '/offers/6a9f04f3de097e23e83541f4',
      showOnHome: true,
      position: 'BANNER_STRIP',
    },
  },
  {
    id: 'default-luxe-linen',
    title: 'The Modern Linen Edit',
    description: 'Relaxed tailoring and natural breathable weaves designed for timeless ease.',
    code: 'LINEN20',
    offerType: 'CATEGORY',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    badgeText: 'SEASONAL EDIT',
    isLimitedTime: true,
    banner: {
      imageUrl: '/images/linen-banner.png',
      title: 'The Modern Linen Edit',
      subtitle: 'Relaxed tailoring and natural breathable weaves designed for timeless ease.',
      ctaText: 'Shop Collection',
      ctaLink: '/shop?category=linen',
      showOnHome: true,
      position: 'BANNER_STRIP',
    },
  },
  {
    id: 'default-festive-privilege',
    title: 'Artisanal Festive Curation',
    description: 'Bespoke silhouettes, rich textures, and heritage embroidery tailored for contemporary celebrations.',
    code: 'FESTIVE15',
    offerType: 'CELEBRATION',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    badgeText: 'FESTIVE PRIVILEGE',
    isLimitedTime: true,
    banner: {
      imageUrl: '/images/hero-luxury-1.jpg',
      title: 'Artisanal Festive Curation',
      subtitle: 'Bespoke silhouettes, rich textures, and heritage embroidery tailored for contemporary celebrations.',
      ctaText: 'Explore Collection',
      ctaLink: '/shop',
      showOnHome: true,
      position: 'BANNER_STRIP',
    },
  },
];

const OFFER_CACHE_KEY = 'yox_offer_banners_cache_v2';

export function OfferBannerSlider() {
  const [banners, setBanners] = useState<Offer[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(OFFER_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [FALLBACK_CAMPAIGNS[0] as Offer];
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Time left state for current banner
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number; secs: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchBanners = async () => {
      try {
        const data = await offersApi.getBanners();
        if (isMounted) {
          if (data && data.length > 0) {
            setBanners(data);
            try {
              localStorage.setItem(OFFER_CACHE_KEY, JSON.stringify(data));
            } catch {}
          } else {
            const active = await offersApi.getActive();
            const offersWithBanner = active.filter((o) => o.banner?.imageUrl || o.banner?.showOnHome);
            if (offersWithBanner.length > 0) {
              setBanners(offersWithBanner);
              try {
                localStorage.setItem(OFFER_CACHE_KEY, JSON.stringify(offersWithBanner));
              } catch {}
            } else if (active.length > 0) {
              const formatted: Offer[] = active.map((o, idx) => ({
                ...o,
                banner: o.banner || {
                  imageUrl: FALLBACK_CAMPAIGNS[idx % FALLBACK_CAMPAIGNS.length]?.banner?.imageUrl || '/images/linen-banner.png',
                  title: o.title,
                  subtitle: o.description || `${o.discountValue}${o.discountType === 'PERCENTAGE' ? '%' : ' FLAT'} off your selected garments`,
                  ctaText: 'Explore Offer',
                  ctaLink: `/offers/${o.id}`,
                  showOnHome: true,
                  position: 'BANNER_STRIP',
                },
              }));
              setBanners(formatted);
              try {
                localStorage.setItem(OFFER_CACHE_KEY, JSON.stringify(formatted));
              } catch {}
            } else {
              setBanners(FALLBACK_CAMPAIGNS as Offer[]);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load offer banners:', err);
        if (isMounted) {
          setBanners(FALLBACK_CAMPAIGNS as Offer[]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBanners();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live countdown timer calculation
  useEffect(() => {
    if (banners.length === 0) return;
    const currentOffer = banners[currentIndex];

    let targetDate: number;
    if (currentOffer?.endDate) {
      targetDate = new Date(currentOffer.endDate).getTime();
    } else {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).getTime();
      targetDate = endOfDay;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ hours: 0, mins: 0, secs: 0 });
        return;
      }

      const totalHours = Math.floor(distance / (1000 * 60 * 60));
      const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours: totalHours, mins, secs });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [banners, currentIndex]);

  // Autoplay carousel
  useEffect(() => {
    if (banners.length <= 1 || isHovered) return;
    const autoPlay = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 7000);
    return () => clearInterval(autoPlay);
  }, [banners.length, isHovered]);

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Code ${code} copied`, {
      description: 'Applied automatically during checkout.',
    });
    setTimeout(() => setCopiedCode(null), 2400);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (isLoading && banners.length === 0) {
    return (
      <section className="w-full bg-white">
        <div className="w-full mx-auto">
          <div className="w-full aspect-[1440/680] bg-gray-100 animate-pulse" />
        </div>
      </section>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const current = banners[currentIndex] || banners[0];
  const bannerInfo = current.banner;
  const couponCode = current.code || (current.id && current.id.length < 12 ? current.id : null);
  const targetLink =
    bannerInfo?.ctaLink ||
    (current.id.startsWith('default-')
      ? '/shop'
      : `/offers/${current.id}`);

  const offerTypeLabel =
    current.badgeText ||
    (current.offerType === 'CELEBRATION'
      ? 'FESTIVE SPECIAL'
      : current.offerType === 'LIMITED_TIME'
        ? 'LIMITED RUN'
        : `${current.offerType} PRIVILEGE`);

  const discountFormatted =
    current.discountType === 'PERCENTAGE'
      ? `${current.discountValue}% OFF`
      : `FLAT ₹${current.discountValue} OFF`;

  return (
    <section className="w-full bg-white border-t border-b border-gray-100 overflow-hidden mb-6 sm:mb-10">
      <div className="w-full mx-auto">

        {/* Campaign Hero Showcase Banner */}
        <div
          className="relative w-full aspect-[1440/680] overflow-hidden bg-gray-950 group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Background Fashion Imagery */}
          {bannerInfo?.imageUrl ? (
            <img
              src={bannerInfo.imageUrl}
              alt={bannerInfo.title || current.title}
              className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full min-h-[380px] sm:min-h-[420px] bg-gradient-to-r from-gray-900 via-neutral-900 to-black" />
          )}

          {/* High-Contrast Editorial Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/20 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/75 sm:to-transparent flex flex-col justify-end sm:justify-center p-6 sm:p-8 md:p-10 lg:p-12 text-white z-10">

            {/* Clean Monospace Tagline Bar */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <span className="font-mono text-[10px] sm:text-xs font-medium tracking-[0.18em] uppercase text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 border border-white/20">
                {offerTypeLabel}
              </span>

              <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-amber-300 bg-black/60 backdrop-blur-md px-2.5 py-1 border border-amber-400/30">
                {discountFormatted}
              </span>

              {current.minOrderValue && current.minOrderValue > 0 && (
                <span className="hidden md:inline-block font-mono text-[10px] sm:text-xs text-white/70 px-2 py-1">
                  Orders over ₹{current.minOrderValue}
                </span>
              )}
            </div>

            {/* Campaign Headline */}
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-tight text-white uppercase max-w-2xl leading-tight drop-shadow-md font-serif">
              {bannerInfo?.title || current.title}
            </h3>

            {/* Campaign Subtitle / Description - Clearly visible with high contrast */}
            <p className="text-sm sm:text-base text-gray-100 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-2 sm:mt-2.5 max-w-xl line-clamp-2 leading-relaxed">
              {bannerInfo?.subtitle ||
                current.description ||
                'Impeccable silhouettes, handcrafted textures, and modern essentials tailored for elevated wardrobes.'}
            </p>

            {/* Timer & Coupon Code Bar */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-5 mt-4 sm:mt-6 pt-3 border-t border-white/15 max-w-xl">
              {/* Minimalist Countdown */}
              {timeLeft && (
                <div className="flex items-center gap-2 text-white">
                  <Clock size={13} className="text-gray-400" />
                  <span className="font-mono text-[11px] sm:text-xs tracking-widest text-gray-300 uppercase">
                    Ends in{' '}
                    <strong className="text-white font-semibold">
                      {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.mins).padStart(2, '0')}m : {String(timeLeft.secs).padStart(2, '0')}s
                    </strong>
                  </span>
                </div>
              )}

              {/* Minimalist Coupon Copy Action */}
              {couponCode && (
                <button
                  type="button"
                  onClick={(e) => handleCopyCode(e, couponCode)}
                  className={`inline-flex items-center gap-2 px-3 py-1 text-xs font-mono tracking-wider transition-all cursor-pointer border ${copiedCode === couponCode
                      ? 'bg-white text-black border-white'
                      : 'bg-black/50 hover:bg-black/80 text-white border-white/30'
                    }`}
                  title="Copy promo code"
                >
                  <span>CODE: <strong className="tracking-widest">{couponCode}</strong></span>
                  {copiedCode === couponCode ? (
                    <span className="inline-flex items-center gap-1 font-sans text-[11px] font-bold text-emerald-600">
                      <Check size={12} /> COPIED
                    </span>
                  ) : (
                    <Copy size={12} className="text-gray-400 hover:text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Primary Action Button */}
            <div className="flex items-center gap-3 mt-5 sm:mt-7">
              <Link
                href={targetLink}
                className="inline-flex items-center gap-2.5 bg-white text-black hover:bg-neutral-200 font-semibold text-xs sm:text-sm tracking-wider uppercase px-6 sm:px-8 py-3 rounded-none transition-all cursor-pointer"
              >
                <span>{bannerInfo?.ctaText || 'Shop Offer'}</span>
                <ArrowRight size={15} />
              </Link>

              <Link
                href="/offers"
                className="inline-flex items-center gap-2 text-white/90 hover:text-white border border-white/30 hover:border-white text-xs sm:text-sm tracking-wider uppercase px-5 sm:px-6 py-3 transition-colors cursor-pointer"
              >
                <span>All Offers</span>
              </Link>
            </div>
          </div>

          {/* Carousel Arrows on Mobile / Hover */}
          {banners.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                aria-label="Previous Slide"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="sm:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                aria-label="Next Slide"
              >
                <ChevronRight size={16} />
              </button>

              {/* Minimal Line Indicators */}
              <div className="absolute bottom-3 left-6 sm:left-14 lg:left-16 z-20 flex items-center gap-1.5">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-[2px] transition-all cursor-pointer ${currentIndex === idx ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
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
