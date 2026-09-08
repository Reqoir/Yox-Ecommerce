'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { offersApi, Offer } from '@/api/admin/offers';
import {
  Clock,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react';

type OfferFilterType = 'ALL' | 'LIMITED_TIME' | 'CELEBRATION' | 'CATEGORY' | 'PRODUCT';

export default function OffersPage() {
  const [selectedFilter, setSelectedFilter] = useState<OfferFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [isSpotlightHovered, setIsSpotlightHovered] = useState(false);

  const { data: activeOffers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ['active-offers'],
    queryFn: offersApi.getActive,
  });

  // Filter & Search Offers
  const filteredOffers = useMemo(() => {
    return activeOffers.filter((offer) => {
      // Category filter
      if (selectedFilter === 'LIMITED_TIME' && !offer.isLimitedTime && offer.offerType !== 'LIMITED_TIME') {
        return false;
      }
      if (selectedFilter === 'CELEBRATION' && offer.offerType !== 'CELEBRATION') {
        return false;
      }
      if (selectedFilter === 'CATEGORY' && offer.offerType !== 'CATEGORY') {
        return false;
      }
      if (selectedFilter === 'PRODUCT' && offer.offerType !== 'PRODUCT') {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = offer.title?.toLowerCase().includes(query);
        const matchDesc = offer.description?.toLowerCase().includes(query);
        const matchCode = offer.code?.toLowerCase().includes(query);
        const matchBadge = offer.badgeText?.toLowerCase().includes(query);
        return matchTitle || matchDesc || matchCode || matchBadge;
      }

      return true;
    });
  }, [activeOffers, selectedFilter, searchQuery]);

  // Spotlight carousel offers (offers with banners or top active offers)
  const spotlightOffers = useMemo(() => {
    const withBanners = activeOffers.filter((o) => o.banner?.imageUrl || o.banner?.showOnHome);
    return withBanners.length > 0 ? withBanners : activeOffers.slice(0, 3);
  }, [activeOffers]);

  // Autoplay spotlight carousel
  useEffect(() => {
    if (spotlightOffers.length <= 1 || isSpotlightHovered) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % spotlightOffers.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [spotlightOffers.length, isSpotlightHovered]);

  const currentSpotlight = spotlightOffers[spotlightIndex] || spotlightOffers[0];

  const handlePrevSpotlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpotlightIndex((prev) => (prev - 1 + spotlightOffers.length) % spotlightOffers.length);
  };

  const handleNextSpotlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSpotlightIndex((prev) => (prev + 1) % spotlightOffers.length);
  };

  return (
    <main className="w-full bg-[#FCFBFA] min-h-screen pb-24 text-gray-900">
      
      {/* Editorial Header Section */}
      <section className="w-full bg-white border-b border-gray-200/80 pt-6 sm:pt-12 pb-6 sm:pb-10">
        <div className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-4 md:px-8">
          
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-3 sm:mb-4">
            <ol className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-widest text-gray-500">
              <li>
                <Link href="/" className="hover:text-black transition-colors">
                  Home
                </Link>
              </li>
              <li>/</li>
              <li className="text-gray-900 font-semibold">Offers</li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6">
            <div>
              <span className="font-mono text-[10px] sm:text-xs tracking-[0.25em] text-gray-500 uppercase block mb-1 sm:mb-2">
                Curated Privileges & Drops
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-gray-900 uppercase">
                Promotions & Offers
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 max-w-md leading-relaxed font-normal">
              Explore our current promotional campaigns, festive privileges, and curated seasonal discounts applicable across handcrafted garments and contemporary collections.
            </p>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-4 md:px-8 pt-6 sm:pt-10">
        
        {/* Spotlight Hero Banner - Fully Responsive across Mobile, Tablet, Laptop, and TV */}
        {currentSpotlight && (
          <div className="mb-10 sm:mb-14">
            <div
              className="relative w-full rounded-sm overflow-hidden bg-gray-950 shadow-sm border border-gray-200 aspect-[4/5] sm:aspect-[16/8] lg:aspect-[21/9] xl:aspect-[24/9] min-h-[420px] sm:min-h-[380px] max-h-[560px] 2xl:max-h-[620px] group transition-all"
              onMouseEnter={() => setIsSpotlightHovered(true)}
              onMouseLeave={() => setIsSpotlightHovered(false)}
            >
              {/* Background Imagery */}
              <img
                src={currentSpotlight.banner?.imageUrl || '/images/linen-banner.png'}
                alt={currentSpotlight.title}
                className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/linen-banner.png';
                }}
              />

              {/* High-Contrast Gradient Backdrop for Flawless Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/75 to-black/20 sm:bg-gradient-to-r sm:from-black/95 sm:via-black/75 sm:to-transparent flex flex-col justify-end sm:justify-center p-5 sm:p-8 md:p-10 lg:p-14 text-white z-10">
                
                {/* Badges Bar */}
                <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                  <span className="font-mono text-[10px] sm:text-xs font-medium tracking-[0.18em] uppercase text-white/90 bg-white/15 backdrop-blur-md px-2.5 py-1 border border-white/20">
                    {currentSpotlight.badgeText || (currentSpotlight.offerType === 'CELEBRATION' ? 'FESTIVE SPECIAL' : `${currentSpotlight.offerType} PROMOTION`)}
                  </span>

                  <span className="font-mono text-[10px] sm:text-xs font-semibold tracking-wider text-amber-300 bg-black/60 backdrop-blur-md px-2.5 py-1 border border-amber-400/30">
                    {currentSpotlight.discountType === 'PERCENTAGE'
                      ? `${currentSpotlight.discountValue}% OFF`
                      : `FLAT ₹${currentSpotlight.discountValue} OFF`}
                  </span>

                  {currentSpotlight.minOrderValue && currentSpotlight.minOrderValue > 0 && (
                    <span className="hidden sm:inline-block font-mono text-[10px] sm:text-xs text-white/70 px-2 py-1">
                      Min. Order ₹{currentSpotlight.minOrderValue}
                    </span>
                  )}
                </div>

                {/* Campaign Headline */}
                <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl 2xl:text-6xl font-serif font-light tracking-tight uppercase text-white max-w-2xl leading-[1.12] drop-shadow-md">
                  {currentSpotlight.banner?.title || currentSpotlight.title}
                </h2>

                {/* Campaign Description - Clear, Bright, and Legible */}
                <p className="text-xs sm:text-sm md:text-base text-gray-100 font-normal leading-relaxed drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-2 sm:mt-2.5 max-w-xl line-clamp-2">
                  {currentSpotlight.banner?.subtitle ||
                    currentSpotlight.description ||
                    'Curated seasonal discounts across handcrafted and contemporary apparel.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 mt-4 sm:mt-6">
                  <Link
                    href={`/offers/${currentSpotlight.id}`}
                    className="inline-flex items-center gap-2 bg-white text-black hover:bg-neutral-200 font-semibold text-xs sm:text-sm tracking-wider uppercase px-5 sm:px-7 py-2.5 sm:py-3 transition-all cursor-pointer"
                  >
                    <span>View Campaign Products</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Slider Controls (If multiple spotlight offers exist) */}
              {spotlightOffers.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevSpotlight}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                    aria-label="Previous Campaign"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextSpotlight}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center border border-white/20 transition-all cursor-pointer"
                    aria-label="Next Campaign"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Indicator lines */}
                  <div className="absolute bottom-3 left-6 sm:left-10 z-20 flex items-center gap-1.5">
                    {spotlightOffers.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSpotlightIndex(idx)}
                        className={`h-[2px] transition-all cursor-pointer ${
                          spotlightIndex === idx ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Campaign slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 mb-6 sm:mb-8 border-b border-gray-200">
          
          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 [scrollbar-width:none]">
            {[
              { id: 'ALL', label: 'All Promotions' },
              { id: 'LIMITED_TIME', label: 'Limited Run' },
              { id: 'CELEBRATION', label: 'Festive & Special' },
              { id: 'CATEGORY', label: 'Category Deals' },
              { id: 'PRODUCT', label: 'Item Specific' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id as OfferFilterType)}
                className={`px-3.5 sm:px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-gray-900 text-white font-medium shadow-xs'
                    : 'bg-white text-gray-600 hover:text-black border border-gray-200 hover:border-gray-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 pl-9 pr-3 py-2 text-xs focus:outline-hidden focus:border-gray-900 transition-colors font-mono tracking-wide"
            />
          </div>
        </div>

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-4 animate-pulse flex flex-col gap-3">
                <div className="w-full aspect-[16/10] bg-gray-100 rounded-xs" />
                <div className="h-4 w-28 bg-gray-100" />
                <div className="h-6 w-48 bg-gray-100" />
                <div className="h-3 w-full bg-gray-100" />
                <div className="h-9 w-full bg-gray-100 mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Offers Grid - Optimized for Mobile, Tablet, Laptop, and TV */}
        {!isLoading && filteredOffers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredOffers.map((offer) => {
              const discountText =
                offer.discountType === 'PERCENTAGE'
                  ? `${offer.discountValue}% OFF`
                  : `FLAT ₹${offer.discountValue} OFF`;

              const bannerImage =
                offer.banner?.imageUrl ||
                '/images/product-1.jpeg';

              return (
                <div
                  key={offer.id}
                  className="bg-white border border-gray-200 hover:border-gray-900 transition-all duration-300 flex flex-col group overflow-hidden shadow-2xs hover:shadow-md"
                >
                  {/* Card Visual Header */}
                  <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                    <img
                      src={bannerImage}
                      alt={offer.title}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/product-1.jpeg';
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

                    {/* Badge top left */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                      <span className="font-mono text-[10px] font-medium tracking-wider uppercase px-2 py-0.5 bg-black/70 text-white backdrop-blur-xs border border-white/20">
                        {offer.badgeText || offer.offerType}
                      </span>
                    </div>

                    {/* Discount Pill bottom left */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="font-mono text-xs font-bold tracking-wider px-2.5 py-1 bg-amber-400 text-gray-950 shadow-xs">
                        {discountText}
                      </span>
                    </div>

                    {/* Direct link arrow top right */}
                    <Link
                      href={`/offers/${offer.id}`}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-900 flex items-center justify-center transition-transform hover:scale-110 shadow-xs z-10"
                      aria-label="View offer details"
                    >
                      <ArrowUpRight size={15} />
                    </Link>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight leading-snug uppercase line-clamp-1 group-hover:text-gray-600 transition-colors">
                        {offer.title}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {offer.description || 'Special privilege applicable to selected collections.'}
                      </p>

                      {/* Criteria summary */}
                      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100 font-mono text-[11px] text-gray-500">
                        {offer.minOrderValue && offer.minOrderValue > 0 && (
                          <span>Min Spend: ₹{offer.minOrderValue}</span>
                        )}
                        {offer.maxDiscountAmount && offer.maxDiscountAmount > 0 && (
                          <span>• Max: ₹{offer.maxDiscountAmount}</span>
                        )}
                        {offer.endDate && (
                          <span>• Ends {new Date(offer.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-4 sm:mt-5 pt-3 border-t border-gray-100 flex flex-col gap-2">
                      <Link
                        href={`/offers/${offer.id}`}
                        className="w-full bg-gray-900 hover:bg-black text-white text-xs font-semibold tracking-wider uppercase py-2.5 px-4 text-center transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        <span>View Applicable Products</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOffers.length === 0 && (
          <div className="bg-white border border-gray-200 py-16 px-6 text-center max-w-lg mx-auto my-12">
            <span className="font-mono text-xs tracking-widest text-gray-400 uppercase block mb-2">
              No Offers Found
            </span>
            <h3 className="text-xl font-serif text-gray-900 uppercase mb-2">
              No Matching Promotions Currently
            </h3>
            <p className="text-xs text-gray-500 mb-6 leading-relaxed">
              We update our seasonal edits frequently. Explore our latest arrivals and staple catalog in the main collection.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-mono uppercase tracking-wider px-4 py-2 border border-gray-300 hover:border-black transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
              <Link
                href="/shop"
                className="bg-black text-white text-xs font-semibold tracking-wider uppercase px-5 py-2 hover:bg-neutral-800 transition-colors"
              >
                Browse Shop
              </Link>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
