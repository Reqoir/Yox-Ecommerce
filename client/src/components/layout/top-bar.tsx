'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { TbTruckDelivery, TbCurrentLocation } from 'react-icons/tb';
import { MdOutlineLocationOn, MdHeadphones } from 'react-icons/md';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export function TopBar() {
  const { config, fetchSettings } = useStoreSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Resolve background color class or style
  const getBannerBg = (color?: string) => {
    if (!color) {
      return { className: '', style: { backgroundColor: '#000000' } };
    }
    const COLOR_MAP: Record<string, string> = {
      'bg-black': '#000000',
      'black': '#000000',
      'bg-[#1A2E4C]': '#000000',
      '#1A2E4C': '#000000',
      'navy': '#000000',
      'bg-emerald-900': '#064e3b',
      'bg-purple-900': '#581c87',
      'bg-rose-900': '#881337',
    };
    if (COLOR_MAP[color]) {
      return { className: '', style: { backgroundColor: COLOR_MAP[color] } };
    }
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return { className: '', style: { backgroundColor: color } };
    }
    if (color.startsWith('bg-[')) {
      const match = color.match(/bg-\[(.*?)\]/);
      if (match && match[1]) {
        return { className: '', style: { backgroundColor: match[1] } };
      }
    }
    return { className: color, style: {} };
  };

  const bannerBg = getBannerBg(config.announcementBgColor);

  return (
    <>
      {/* Maintenance Mode Emergency Alert Banner */}
      {config.maintenanceMode && (
        <div className="w-full bg-amber-500 text-amber-950 px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 border-b border-amber-600 shadow-xs z-50">
          <AlertTriangle size={14} className="shrink-0 animate-pulse" />
          <span>{config.maintenanceNotice || 'Notice: Store maintenance is currently underway. Online order fulfillment may experience brief delays.'}</span>
        </div>
      )}

      {/* Main Announcement & Store Features Bar */}
      <div 
        className={`w-full text-white min-h-[34px] sm:h-10 py-1.5 sm:py-0 flex items-center justify-center transition-colors duration-300 border-b border-white/10 ${bannerBg.className}`}
        style={bannerBg.style}
      >
        <div className="w-[98%] max-w-[1500px] px-3 sm:px-4 md:px-0 mx-auto flex items-center justify-between text-[11px] sm:text-xs">

          {/* Left: Free Shipping Badge */}
          <div className="hidden sm:flex items-center gap-2 text-white/90 shrink-0">
            <TbTruckDelivery className="text-base text-emerald-400" />
            <span>
              Free Shipping on orders above{' '}
              <strong className="text-white font-bold">
                {config.currencySymbol}{config.freeShippingThreshold}
              </strong>
            </span>
          </div>

          {/* Center: Live Dynamic Announcement Banner */}
          <div className="flex-1 text-center px-1 sm:px-3 flex items-center justify-center">
            {config.announcementEnabled ? (
              config.announcementLink ? (
                <Link
                  href={config.announcementLink}
                  className="inline-flex items-center justify-center text-center font-medium hover:underline text-amber-300 transition-colors text-[10.5px] sm:text-[11px] md:text-xs leading-snug sm:leading-normal"
                >
                  <span>{config.announcementText}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center text-center font-medium text-amber-300 text-[10.5px] sm:text-[11px] md:text-xs leading-snug sm:leading-normal">
                  <span>{config.announcementText}</span>
                </span>
              )
            ) : (
              <span className="text-white/80 font-medium text-[10.5px] sm:text-[11px] md:text-xs leading-snug sm:leading-normal">
                Welcome to {config.storeName} — {config.tagline}
              </span>
            )}
          </div>

          {/* Right: Support Contact */}
          <div className="hidden md:flex items-center gap-4 text-white/80 shrink-0">
            {config.supportPhone && (
              <a
                href={`tel:${config.supportPhone}`}
                className="flex items-center gap-1 hover:text-white transition-colors"
                title="Customer Care"
              >
                <MdHeadphones className="text-sm text-primary-foreground" />
                <span>{config.supportPhone}</span>
              </a>
            )}
            <div className="flex items-center gap-1 hover:text-white cursor-pointer">
              <TbCurrentLocation className="text-sm" />
              <span>India</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
