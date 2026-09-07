'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { settingsApi } from '@/api/admin/settings';
import { offersApi, Offer } from '@/api/admin/offers';
import { Loader2, ArrowRight, Sparkles, Flame } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizeCloudinaryUrl } from '@/lib/utils';

export function ExclusiveOffers() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOffer, setActiveOffer] = useState<Offer | null>(null);

  useEffect(() => {
    setMounted(true);
    const fetchOffers = async () => {
      try {
        // First try to get active offers from new offers module
        const activeOffers = await offersApi.getActive();
        const flashOrPromo = activeOffers.find((o) => o.isLimitedTime || o.offerType === 'LIMITED_TIME') || activeOffers[0];

        if (flashOrPromo) {
          setActiveOffer(flashOrPromo);
          if (flashOrPromo.endDate) {
            setEndDate(new Date(flashOrPromo.endDate));
          }
          const offerWithProds = await offersApi.getOfferWithProducts(flashOrPromo.id);
          if (offerWithProds.products && offerWithProds.products.length > 0) {
            setOffers(
              offerWithProds.products.map((p) => ({
                id: p.id,
                category: 'Exclusive Deal',
                price: p.discountedPrice,
                oldPrice: p.originalPrice > p.discountedPrice ? p.originalPrice : null,
                title: p.name,
                image: p.thumbnail ? optimizeCloudinaryUrl(p.thumbnail) : '/images/product-1.jpeg',
                secondImage: (p.secondImage || p.images?.[1])
                  ? optimizeCloudinaryUrl(p.secondImage || p.images?.[1])
                  : null,
                slug: p.slug || p.id,
                discountPercentage: p.discountPercentage,
              }))
            );
            setIsLoading(false);
            return;
          }
        }

        // Fallback to legacy settings
        const config: any = await settingsApi.getSetting('storefront.exclusive_offers');
        if (config) {
          if (config.endDate) {
            setEndDate(new Date(config.endDate));
          }
          if (config.products) {
            setOffers(config.products);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOffers();
  }, []);

  useEffect(() => {
    if (!endDate) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        setEndDate(null); // hide timer if passed
        return false;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((distance % (1000 * 60)) / 1000)
      });
      return true;
    };

    // Run immediately once
    if (calculateTime()) {
      const timer = setInterval(calculateTime, 1000);
      return () => clearInterval(timer);
    }
  }, [endDate]);

  if (isLoading) {
    return (
      <section className="w-full bg-[#F1EFEA] py-16 border-t border-gray-200 animate-in fade-in duration-300">
        <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">
          {/* Header Section Skeleton */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 sm:mb-10 gap-4 sm:gap-6">
            <div>
              <Skeleton className="h-8 w-64 md:w-80 rounded bg-gray-300/60 mb-2" />
              <Skeleton className="h-4 w-48 rounded bg-gray-300/60" />
            </div>

            {/* Countdown Timer Skeleton */}
            <div className="flex items-center gap-2 md:gap-3">
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
              <span className="text-gray-400 font-bold">:</span>
              <Skeleton className="w-12 h-12 md:w-16 md:h-16 rounded-[2px] bg-gray-300/60" />
            </div>
          </div>

          {/* Offers Horizontal Cards Grid Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-12 gap-x-3 sm:gap-x-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center">
                <Skeleton className="w-full sm:w-[110px] md:w-[130px] shrink-0 aspect-[3/4] rounded-none bg-gray-300/60" />
                <div className="flex flex-col justify-center pt-2.5 sm:pt-0 sm:pl-4 sm:py-2 flex-1 gap-1.5 sm:gap-2">
                  <Skeleton className="h-3 w-16 sm:w-20 rounded bg-gray-300/60" />
                  <Skeleton className="h-4 w-20 sm:w-24 rounded bg-gray-300/60" />
                  <Skeleton className="h-3 w-14 sm:w-16 rounded bg-gray-300/60" />
                  <Skeleton className="h-4 w-28 sm:w-32 rounded bg-gray-300/60 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no offers configured, don't show the section
  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-[#F1EFEA] py-16 border-t border-gray-200">
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 sm:mb-10 gap-4 sm:gap-6">
          <div className="text-left">
            <h2 className="text-[22px] sm:text-[24px] md:text-[28px] font-medium text-[#40362C]">
              {activeOffer?.title || 'Exclusive Offers In Focus'}
            </h2>
            {activeOffer && (
              <Link
                href={`/offers/${activeOffer.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#40362C] hover:text-[#1A2E4C] border-b border-[#40362C] pb-0.5 mt-1"
              >
                View Complete Offer Collection <ArrowRight size={13} />
              </Link>
            )}
          </div>

          {/* Countdown Timer */}
          {mounted && endDate && (
            <div className="flex items-center gap-2 md:gap-3 text-[18px] md:text-[22px] font-bold text-[#4B4239]">
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-sm">
                <span className="text-[16px] md:text-[20px] leading-none">{timeLeft.days}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Days</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-sm">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.hours).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Hours</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-sm">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.mins).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Mins</span>
              </div>
              <span className="mb-2">:</span>
              <div className="flex flex-col items-center justify-center bg-[#4B4239] text-white w-12 h-12 md:w-16 md:h-16 rounded-[2px] shadow-sm">
                <span className="text-[16px] md:text-[20px] leading-none">{String(timeLeft.secs).padStart(2, '0')}</span>
                <span className="text-[9px] md:text-[11px] font-medium mt-1 tracking-wide">Sec</span>
              </div>
            </div>
          )}
        </div>

        {/* Offers Grid: 2 in a row on mobile, maximum 4 products */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-y-8 sm:gap-y-12 gap-x-3 sm:gap-x-6">
          {offers.slice(0, 4).map(offer => (
            <Link
              href={`/product/${offer.slug}`}
              key={offer.id}
              className="flex flex-col sm:flex-row sm:items-center group cursor-pointer transition-transform hover:-translate-y-1"
            >
              <div className="w-full sm:w-[110px] md:w-[130px] shrink-0 relative aspect-[3/4] bg-transparent overflow-hidden">
                <Image
                  src={offer.image}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 110px, 130px"
                  className={`object-cover object-top transition-opacity duration-300 ${offer.secondImage && offer.secondImage !== offer.image ? 'group-hover:opacity-0' : ''
                    }`}
                  alt={offer.title}
                />
                {offer.secondImage && offer.secondImage !== offer.image && (
                  <Image
                    src={offer.secondImage}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 110px, 130px"
                    className="object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    alt={`${offer.title} alternate view`}
                  />
                )}
              </div>
              <div className="flex flex-col justify-center pt-2.5 sm:pt-0 sm:pl-4 sm:py-2 flex-1">
                <span className="text-[10px] sm:text-[11px] text-gray-500 mb-0.5 sm:mb-1">{offer.category}</span>
                <span className="text-[12px] sm:text-[13px] font-medium text-[#40362C] mb-0.5">
                  From ₹{offer.price}
                </span>
                {offer.oldPrice ? (
                  <span className="text-[10px] sm:text-[11px] text-[#B33924] line-through mb-0.5 sm:mb-1">
                    ₹{offer.oldPrice}
                  </span>
                ) : (
                  <span className="text-[10px] sm:text-[11px] text-transparent mb-0.5 sm:mb-1 opacity-0 pointer-events-none">
                    -
                  </span>
                )}
                <h3 className="text-[12px] sm:text-[13px] text-[#40362C] font-medium line-clamp-2 mt-0.5 sm:mt-1 sm:pr-2">
                  {offer.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
