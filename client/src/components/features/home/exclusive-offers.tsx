"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { settingsApi } from '@/api/admin/settings';
import { Loader2 } from 'lucide-react';

export function ExclusiveOffers() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [mounted, setMounted] = useState(false);
  const [offers, setOffers] = useState<any[]>([]);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const fetchOffers = async () => {
      try {
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
      <section className="w-full bg-[#F1EFEA] py-16 border-t border-gray-200 min-h-[400px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4B4239]" />
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
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <h2 className="text-[24px] md:text-[28px] font-medium text-[#40362C]">
            Exclusive Offers In Focus
          </h2>
          
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

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6">
          {offers.map(offer => (
            <Link 
              href={`/product/${offer.slug}`} 
              key={offer.id} 
              className="flex items-center group cursor-pointer transition-transform hover:-translate-y-1"
            >
              <div className="w-[110px] md:w-[130px] shrink-0 relative aspect-[3/4] mix-blend-multiply bg-transparent">
                 <Image 
                   src={offer.image} 
                   fill 
                   className="object-cover object-top" 
                   alt={offer.title} 
                 />
              </div>
              <div className="flex flex-col justify-center pl-4 py-2 flex-1">
                <span className="text-[11px] text-gray-500 mb-1">{offer.category}</span>
                <span className="text-[13px] font-medium text-[#40362C] mb-0.5">
                  From ₹{offer.price}
                </span>
                {offer.oldPrice ? (
                   <span className="text-[11px] text-[#B33924] line-through mb-1">
                     ₹{offer.oldPrice}
                   </span>
                ) : (
                   <span className="text-[11px] text-transparent mb-1 opacity-0 pointer-events-none">
                     -
                   </span>
                )}
                <h3 className="text-[13px] text-[#40362C] font-medium line-clamp-2 mt-1 pr-2">
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
