"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const OFFERS = [
  {
    id: 1,
    category: 'Jacket',
    price: '8,500.00',
    oldPrice: '9,300.00',
    title: "Men's Casual Quilted Jacket",
    image: '/images/nav/men/1.jpg',
  },
  {
    id: 2,
    category: 'Jacket',
    price: '7,300.00',
    oldPrice: null,
    title: "Men's Warm Sports Jacket",
    image: '/images/nav/men/3.jpg',
  },
  {
    id: 3,
    category: 'Jacket',
    price: '7,300.00',
    oldPrice: '7,700.00',
    title: "Men's Athletic Stripe Jacket",
    image: '/images/nav/men/5.jpg',
  },
  {
    id: 4,
    category: 'Jacket',
    price: '4,800.00',
    oldPrice: '5,400.00',
    title: "Men's Solid Quilted Jacket",
    image: '/images/nav/men/4.jpg',
  },
  {
    id: 5,
    category: 'Jacket',
    price: '7,200.00',
    oldPrice: '7,700.00',
    title: "Men's Modern Shirt Jacket",
    image: '/images/nav/men/2.jpg',
  },
  {
    id: 6,
    category: 'Jacket',
    price: '7,100.00',
    oldPrice: null,
    title: "Men's Training Sports Jacket",
    image: '/images/categories/jacket.webp',
  },
  {
    id: 7,
    category: 'Jacket',
    price: '3,400.00',
    oldPrice: '3,800.00',
    title: "Overshirt Transition Jacket",
    image: '/images/new-popular/shirts/10.webp',
  },
  {
    id: 8,
    category: 'Jacket',
    price: '5,900.00',
    oldPrice: '6,600.00',
    title: "Men's Outerwear Jacket",
    image: '/images/categories/shirt.jpeg',
  },
];

export function ExclusiveOffers() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 9, mins: 9, secs: 59 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, mins, secs } = prev;
        if (secs > 0) {
          secs--;
        } else {
          secs = 59;
          if (mins > 0) {
            mins--;
          } else {
            mins = 59;
            if (hours > 0) {
              hours--;
            } else {
              hours = 23;
              if (days > 0) {
                days--;
              }
            }
          }
        }
        return { days, hours, mins, secs };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="w-full bg-[#F1EFEA] py-16 border-t border-gray-200">
      <div className="w-[98%] max-w-[1500px] mx-auto px-4 md:px-0">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <h2 className="text-[24px] md:text-[28px] font-medium text-[#40362C]">
            Exclusive Offers In Focus
          </h2>
          
          {/* Countdown Timer */}
          {mounted && (
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
          {OFFERS.map(offer => (
            <Link 
              href="/shop" 
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
                  From Rs. {offer.price} INR
                </span>
                {offer.oldPrice ? (
                   <span className="text-[11px] text-[#B33924] line-through mb-1">
                     Rs. {offer.oldPrice} INR
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
