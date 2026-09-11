'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { TbTruckDelivery, TbCurrentLocation } from 'react-icons/tb';
import { MdOutlineLocationOn, MdHeadphones } from 'react-icons/md';
import { AlertTriangle, Sparkles } from 'lucide-react';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';

export const TOPBAR_COLOR_OPTIONS = [
  { label: 'Sleek Jet Black (Classic)', value: '#000000', hex: '#000000' },
  { label: 'Navy Blue Brand (#1A2E4C)', value: '#1A2E4C', hex: '#1A2E4C' },
  { label: 'Deep Midnight Slate', value: '#0F172A', hex: '#0F172A' },
  { label: 'Emerald Pine (Festive)', value: '#064E3B', hex: '#064E3B' },
  { label: 'Royal Purple (Luxury)', value: '#581C87', hex: '#581C87' },
  { label: 'Crimson Red (Sale Event)', value: '#881337', hex: '#881337' },
  { label: 'Deep Burgundy / Wine', value: '#4A0E17', hex: '#4A0E17' },
  { label: 'Charcoal Minimal', value: '#18181B', hex: '#18181B' },
];

export function resolveTopBarColor(color?: string): string {
  if (!color) return '#000000';
  const trimmed = color.trim();
  
  const legacyMap: Record<string, string> = {
    'bg-black': '#000000',
    'black': '#000000',
    'bg-[#1A2E4C]': '#1A2E4C',
    '#1A2E4C': '#1A2E4C',
    'navy': '#1A2E4C',
    'bg-emerald-900': '#064E3B',
    'bg-purple-900': '#581C87',
    'bg-rose-900': '#881337',
    'bg-slate-900': '#0F172A',
    'bg-zinc-900': '#18181B',
  };

  if (legacyMap[trimmed]) return legacyMap[trimmed];

  if (trimmed.startsWith('bg-[')) {
    const match = trimmed.match(/bg-\[(.*?)\]/);
    if (match && match[1]) return match[1];
  }

  return trimmed;
}

export function TopBar() {
  const { config, fetchSettings } = useStoreSettingsStore();

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const resolvedBg = resolveTopBarColor(config.announcementBgColor);

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
        className="w-full text-white min-h-[28px] sm:h-8 py-1 sm:py-0 flex items-center justify-center transition-colors duration-300 border-b border-white/10"
        style={{ backgroundColor: resolvedBg }}
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
