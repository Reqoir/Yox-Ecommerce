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
      <div className={`w-full ${config.announcementBgColor || 'bg-black'} text-white h-10 flex items-center justify-center transition-colors duration-300 border-b border-white/10`}>
        <div className="w-[98%] max-w-[1500px] px-4 md:px-0 mx-auto flex items-center justify-between text-[11px] sm:text-xs">
          
          {/* Left: Free Shipping Badge */}
          <div className="hidden sm:flex items-center gap-2 text-white/90">
            <TbTruckDelivery className="text-base text-emerald-400" />
            <span>
              Free Shipping on orders above{' '}
              <strong className="text-white font-bold">
                {config.currencySymbol}{config.freeShippingThreshold}
              </strong>
            </span>
          </div>

          {/* Center: Live Dynamic Announcement Banner */}
          <div className="flex-1 text-center truncate px-2">
            {config.announcementEnabled ? (
              config.announcementLink ? (
                <Link
                  href={config.announcementLink}
                  className="inline-flex items-center gap-1.5 font-medium hover:underline text-amber-300 transition-colors"
                >
                  <Sparkles size={12} className="text-amber-300 shrink-0" />
                  <span className="truncate">{config.announcementText}</span>
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-300">
                  <Sparkles size={12} className="text-amber-300 shrink-0" />
                  <span className="truncate">{config.announcementText}</span>
                </span>
              )
            ) : (
              <span className="text-white/80 font-medium truncate">
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
