'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { settingsApi } from '@/api/admin/settings';
import { offersApi, Offer, OfferProductItem } from '@/api/admin/offers';
import {
  Loader2,
  ArrowRight,
  Sparkles,
  Flame,
  ChevronLeft,
  ChevronRight,
  Tag,
  Clock,
  Percent,
  Gift,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizeCloudinaryUrl } from '@/lib/utils';

interface FormattedProduct {
  id: string;
  category: string;
  price: number;
  oldPrice: number | null;
  title: string;
  image: string;
  secondImage: string | null;
  slug: string;
  discountPercentage: number;
  inStock?: boolean;
}

export function ExclusiveOffers() {
  const [mounted, setMounted] = useState(false);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [selectedOfferIndex, setSelectedOfferIndex] = useState(0);
  const [productsMap, setProductsMap] = useState<Record<string, FormattedProduct[]>>({});
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

  // Fallback legacy products if no new offers exist
  const [legacyOffers, setLegacyOffers] = useState<FormattedProduct[]>([]);

  // Fetch all active offers on mount
  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    const fetchAllOffers = async () => {
      try {
        const fetchedActiveOffers = await offersApi.getActive();

        if (!isMounted) return;

        if (fetchedActiveOffers && fetchedActiveOffers.length > 0) {
          setActiveOffers(fetchedActiveOffers);
          setSelectedOfferIndex(0);

          // Fetch products for the first offer immediately
          const firstOffer = fetchedActiveOffers[0];
          try {
            setIsLoadingProducts(true);
            const firstOfferData = await offersApi.getOfferWithProducts(firstOffer.id);
            if (firstOfferData?.products) {
              const formatted = firstOfferData.products.map(formatProductItem);
              if (isMounted) {
                setProductsMap((prev) => ({ ...prev, [firstOffer.id]: formatted }));
              }
            }
          } catch (err) {
            console.error('Failed to load initial offer products:', err);
          } finally {
            if (isMounted) setIsLoadingProducts(false);
          }

          // Preload products for remaining offers in background for instant tab switching
          if (fetchedActiveOffers.length > 1) {
            fetchedActiveOffers.slice(1).forEach(async (offer) => {
              try {
                const data = await offersApi.getOfferWithProducts(offer.id);
                if (data?.products && isMounted) {
                  const formatted = data.products.map(formatProductItem);
                  setProductsMap((prev) => ({ ...prev, [offer.id]: formatted }));
                }
              } catch {
                // Silently ignore prefetch failures
              }
            });
          }
        } else {
          // Fallback to legacy settings if no active offers found
          const config: any = await settingsApi.getSetting('storefront.exclusive_offers');
          if (config && isMounted) {
            if (config.products) {
              setLegacyOffers(config.products);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching active offers for homepage:', err);
      } finally {
        if (isMounted) {
          setIsLoadingOffers(false);
        }
      }
    };

    fetchAllOffers();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatProductItem = (p: OfferProductItem): FormattedProduct => ({
    id: p.id,
    category: 'Exclusive Deal',
    price: p.discountedPrice,
    oldPrice: p.originalPrice > p.discountedPrice ? p.originalPrice : null,
    title: p.name,
    image: p.thumbnail ? optimizeCloudinaryUrl(p.thumbnail) : '/images/product-1.jpeg',
    secondImage: p.secondImage || p.images?.[1] ? optimizeCloudinaryUrl(p.secondImage || p.images?.[1]!) : null,
    slug: p.slug || p.id,
    discountPercentage: p.discountPercentage,
    inStock: p.inStock !== false,
  });

  // Current active offer
  const currentOffer: Offer | null = activeOffers[selectedOfferIndex] || null;

  // Load products if switching to an offer whose products haven't finished caching
  useEffect(() => {
    if (!currentOffer) return;
    if (productsMap[currentOffer.id]) return;

    let isMounted = true;
    const loadOfferProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const data = await offersApi.getOfferWithProducts(currentOffer.id);
        if (data?.products && isMounted) {
          const formatted = data.products.map(formatProductItem);
          setProductsMap((prev) => ({ ...prev, [currentOffer.id]: formatted }));
        }
      } catch (err) {
        console.error('Error loading products for offer:', err);
      } finally {
        if (isMounted) setIsLoadingProducts(false);
      }
    };

    loadOfferProducts();

    return () => {
      isMounted = false;
    };
  }, [currentOffer, productsMap]);

  // Real-time countdown timer for current active offer
  useEffect(() => {
    if (!currentOffer?.endDate) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(currentOffer.endDate).getTime();

    const calculateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        return false;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000),
      });
      return true;
    };

    if (calculateCountdown()) {
      const timer = setInterval(calculateCountdown, 1000);
      return () => clearInterval(timer);
    }
  }, [currentOffer]);

  // Autoplay through multiple offers every 7.5 seconds when not hovered
  useEffect(() => {
    if (activeOffers.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setSelectedOfferIndex((prev) => (prev + 1) % activeOffers.length);
    }, 7500);

    return () => clearInterval(interval);
  }, [activeOffers.length, isHovered]);

  const handlePrevOffer = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedOfferIndex((prev) => (prev - 1 + activeOffers.length) % activeOffers.length);
  };

  const handleNextOffer = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedOfferIndex((prev) => (prev + 1) % activeOffers.length);
  };

  // Products to render for current view
  const currentProducts: FormattedProduct[] = currentOffer
    ? productsMap[currentOffer.id] || []
    : legacyOffers;

  // Format offer discount label
  const discountLabel = currentOffer
    ? currentOffer.discountType === 'PERCENTAGE'
      ? `${currentOffer.discountValue}% OFF`
      : `₹${currentOffer.discountValue} FLAT OFF`
    : null;

  // Skeletons while loading
  if (isLoadingOffers) {
    return (
      <section className="w-full bg-[#F1EFEA] py-12 sm:py-16 border-t border-gray-200 animate-in fade-in duration-300">
        <div className="w-full sm:w-[98%] max-w-[1500px] mx-auto space-y-8">
          <div className="flex items-center justify-between px-4 sm:px-0">
            <Skeleton className="h-7 sm:h-8 w-64 md:w-80 rounded-none bg-gray-200" />
            <Skeleton className="h-6 w-32 rounded-none bg-gray-200" />
          </div>
          <Skeleton className="w-full aspect-[11/4] rounded-none bg-gray-200" />
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 px-4 sm:px-0">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <Skeleton className="w-[110px] aspect-[3/4] rounded-none bg-gray-200" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-4 w-28 bg-gray-200" />
                  <Skeleton className="h-3 w-20 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no offers exist at all, omit section
  if (activeOffers.length === 0 && legacyOffers.length === 0) {
    return null;
  }

  return (
    <section
      className="w-full bg-[#F1EFEA] py-10 sm:py-14 border-t border-gray-200 transition-colors duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="w-full sm:w-[98%] max-w-[1500px] mx-auto space-y-7">

        {/* Top Header: Title, Global Offers Link, and Offer Switcher Tabs */}
        <div className="flex flex-col gap-4 px-4 sm:px-0">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-gray-300/80 pb-4">
            <div>
              <h2 className="text-[22px] md:text-[28px] font-bold text-[#40362C] uppercase tracking-wide">
                Special Offers
              </h2>
            </div>

          </div>

          {/* Interactive Multi-Offer Selector Tabs (Shown when company has 2 or more offers) */}
          {activeOffers.length > 1 && (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 flex-1">
                {activeOffers.map((offer, idx) => {
                  const isSelected = selectedOfferIndex === idx;
                  const offerDiscount =
                    offer.discountType === 'PERCENTAGE'
                      ? `${offer.discountValue}% OFF`
                      : `₹${offer.discountValue} OFF`;

                  return (
                    <button
                      key={offer.id}
                      type="button"
                      onClick={() => setSelectedOfferIndex(idx)}
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 cursor-pointer ${isSelected
                        ? 'bg-[#40362C] text-white shadow-sm ring-1 ring-[#40362C]'
                        : 'bg-white/70 hover:bg-white text-[#574B3E] hover:text-[#40362C] border border-gray-300'
                        }`}
                    >
                      {offer.isLimitedTime || offer.offerType === 'LIMITED_TIME' ? (
                        <Flame size={13} className={isSelected ? 'text-amber-300' : 'text-amber-600'} />
                      ) : (
                        <Tag size={13} className={isSelected ? 'text-amber-300' : 'text-[#7B6E61]'} />
                      )}
                      <span>{offer.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-[#40362C]/10 text-[#40362C]'
                          }`}
                      >
                        {offerDiscount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Prev / Next Controls for Offer Navigation */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono text-gray-500 mr-1">
                  {selectedOfferIndex + 1} / {activeOffers.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrevOffer}
                  className="w-7 h-7 rounded-sm bg-white/80 hover:bg-white border border-gray-300 text-gray-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Previous Offer"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  onClick={handleNextOffer}
                  className="w-7 h-7 rounded-sm bg-white/80 hover:bg-white border border-gray-300 text-gray-700 hover:text-black flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Next Offer"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Promotional Offer Banner Strip */}
        {currentOffer && (
          <div className="w-full relative overflow-hidden bg-gray-900 shadow-sm group rounded-none">
            {currentOffer.banner?.imageUrl ? (
              <div className="relative w-full aspect-[11/4]">
                <Link
                  href={currentOffer.banner.ctaLink || `/offers/${currentOffer.id}`}
                  className="block relative w-full h-full"
                >
                  <picture className="w-full h-full block relative">
                    {currentOffer.banner.mobileImageUrl && (
                      <source
                        media="(max-width: 640px)"
                        srcSet={optimizeCloudinaryUrl(currentOffer.banner.mobileImageUrl, 1200)}
                      />
                    )}
                    <Image
                      src={optimizeCloudinaryUrl(currentOffer.banner.imageUrl, 2000)}
                      alt={currentOffer.banner.title || currentOffer.title}
                      fill
                      quality={95}
                      priority
                      className="object-cover object-center group-hover:scale-[1.015] transition-transform duration-700"
                    />
                  </picture>

                  {/* High contrast overlay badge on banner */}
                  <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-wrap items-center gap-2 pointer-events-none z-10">
                    {discountLabel && (
                      <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-black/80 backdrop-blur-xs text-amber-300 px-2.5 py-1 border border-amber-400/30">
                        {discountLabel}
                      </span>
                    )}
                    {currentOffer.badgeText && (
                      <span className="font-mono text-[10px] sm:text-xs font-semibold uppercase tracking-wider bg-white/90 text-black px-2.5 py-1">
                        {currentOffer.badgeText}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Optional Carousel Arrows overlaid on banner on small screens */}
                {activeOffers.length > 1 && (
                  <div className="sm:hidden absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none z-20">
                    <button
                      type="button"
                      onClick={handlePrevOffer}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                      aria-label="Previous Offer"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextOffer}
                      className="pointer-events-auto w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center border border-white/20 cursor-pointer"
                      aria-label="Next Offer"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Luxury Editorial Card Fallback if Offer doesn't have custom banner image */
              <div className="w-full relative py-10 px-6 sm:px-12 bg-gradient-to-r from-[#241E19] via-[#3B3026] to-[#1E1914] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-amber-300 font-bold bg-white/10 px-2.5 py-0.5 border border-amber-400/20">
                      {currentOffer.badgeText || 'SPECIAL OFFER'}
                    </span>
                    {discountLabel && (
                      <span className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-white/90 bg-white/15 px-2.5 py-0.5">
                        {discountLabel}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide">
                    {currentOffer.title}
                  </h3>
                  {currentOffer.description && (
                    <p className="text-xs sm:text-sm text-gray-300 line-clamp-2 leading-relaxed">
                      {currentOffer.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/offers/${currentOffer.id}`}
                    className="inline-flex items-center gap-2 bg-white text-[#241E19] hover:bg-neutral-200 font-bold text-xs uppercase px-5 py-2.5 tracking-wider transition-colors cursor-pointer"
                  >
                    <span>Explore Offer</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Offer Subheader Details & Countdown Timer Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1 px-4 sm:px-0">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] md:text-[22px] font-bold text-[#40362C] uppercase tracking-wide">
                {currentOffer?.title || 'Featured Deal Selections'}
              </h3>
              {discountLabel && (
                <span className="text-xs font-bold text-white bg-[#40362C] px-2 py-0.5 rounded-xs">
                  {discountLabel}
                </span>
              )}
            </div>

            {currentOffer && (
              <Link
                href={`/offers/${currentOffer.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#40362C] hover:text-[#1A2E4C] border-b border-[#40362C] pb-0.5 mt-2 transition-colors cursor-pointer"
              >
                <span>View Complete Collection ({currentProducts.length} Items)</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {/* Countdown Timer Block (If offer has an active endDate) */}
          {mounted && timeLeft && (
            <div className="flex items-center gap-2 md:gap-3 text-[18px] md:text-[22px] font-bold text-[#4B4239]">
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-xs">
                <span className="text-[16px] md:text-[20px] leading-none">{timeLeft.days}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Days</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-xs">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Hours</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-xs">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Mins</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-xs">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.secs).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Offers Products Grid: 2 per row on mobile, 4 on desktop */}
        {isLoadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-12 gap-x-3 sm:gap-x-6 px-4 sm:px-0">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center">
                <Skeleton className="w-full sm:w-[110px] md:w-[130px] aspect-[3/4] rounded-none bg-gray-200" />
                <div className="pt-2 sm:pt-0 sm:pl-4 space-y-2 flex-1">
                  <Skeleton className="h-3 w-16 bg-gray-200" />
                  <Skeleton className="h-4 w-24 bg-gray-200" />
                  <Skeleton className="h-3 w-28 bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : currentProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-12 gap-x-3 sm:gap-x-6 px-4 sm:px-0">
            {currentProducts.slice(0, 4).map((item) => (
              <Link
                href={`/product/${item.slug}`}
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center group cursor-pointer transition-transform hover:-translate-y-1"
              >
                <div className="w-full sm:w-[110px] md:w-[130px] shrink-0 relative aspect-[3/4] bg-white overflow-hidden border border-gray-200/60">
                  <Image
                    src={item.image}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 110px, 130px"
                    className={`object-cover object-top transition-opacity duration-300 ${item.secondImage && item.secondImage !== item.image ? 'group-hover:opacity-0' : ''
                      }`}
                    alt={item.title}
                  />
                  {item.secondImage && item.secondImage !== item.image && (
                    <Image
                      src={item.secondImage}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 110px, 130px"
                      className="object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                      alt={`${item.title} alternate view`}
                    />
                  )}

                  {/* Sold Out or Discount percentage tag on product thumbnail */}
                  {item.inStock === false ? (
                    <span className="absolute top-1 left-1 bg-black text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-none z-10">
                      SOLD OUT
                    </span>
                  ) : item.discountPercentage > 0 ? (
                    <span className="absolute top-1 left-1 bg-[#B33924] text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-none">
                      -{item.discountPercentage}%
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-col justify-center pt-2.5 sm:pt-0 sm:pl-4 sm:py-2 flex-1">
                  <span className="text-[10px] sm:text-[11px] text-gray-500 mb-0.5 sm:mb-1">{item.category}</span>
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className={`text-[12px] sm:text-[13px] font-bold ${item.inStock === false ? 'text-gray-500' : 'text-[#40362C]'}`}>
                      From ₹{item.price.toLocaleString('en-IN')}
                    </span>
                    {item.inStock === false && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        Sold Out
                      </span>
                    )}
                  </div>
                  {item.inStock !== false && item.oldPrice ? (
                    <span className="text-[10px] sm:text-[11px] text-[#B33924] line-through mb-0.5 sm:mb-1">
                      ₹{item.oldPrice.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-[10px] sm:text-[11px] text-transparent mb-0.5 sm:mb-1 opacity-0 pointer-events-none">
                      -
                    </span>
                  )}
                  <h4 className="text-[12px] sm:text-[13px] text-[#40362C] font-medium line-clamp-2 mt-0.5 sm:mt-1 sm:pr-2">
                    {item.title}
                  </h4>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-white/50 border border-dashed border-gray-300 rounded-sm mx-4 sm:mx-0">
            <p className="text-xs text-gray-500">
              Explore eligible items for this offer by viewing the complete collection.
            </p>
            {currentOffer && (
              <Link
                href={`/offers/${currentOffer.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#40362C] underline mt-2"
              >
                <span>Browse Offer Products</span>
                <ArrowRight size={12} />
              </Link>
            )}
          </div>
        )}

      </div>
    </section>
  );
}

