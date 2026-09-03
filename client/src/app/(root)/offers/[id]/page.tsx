'use client';

import React, { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Sparkles,
  Flame,
  Tag,
  ArrowLeft,
  Share2,
  Heart,
  SlidersHorizontal,
  ArrowUpDown,
  Search,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Package,
  Layers,
  PartyPopper,
  Loader2,
  ChevronRight,
  Sparkle
} from 'lucide-react';
import { offersApi, OfferProductItem } from '@/api/admin/offers';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { Pagination } from '@/components/ui/pagination';
import { toast } from 'sonner';

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'discount-desc';

export default function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const routeParams = useParams<{ id: string }>();
  const offerId = resolvedParams?.id || routeParams?.id || '';

  const { data, isLoading, error } = useQuery({
    queryKey: ['offer-with-products', offerId],
    queryFn: () => offersApi.getOfferWithProducts(offerId),
    enabled: Boolean(offerId),
  });

  const offer = data?.offer;
  const rawProducts = data?.products || [];

  // Favourites store integration
  const { isFavourite, toggleFavourite } = useFavouritesStore();

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [copiedLink, setCopiedLink] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Live countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);

  useEffect(() => {
    if (!offer?.endDate || !offer.isLimitedTime) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(offer.endDate).getTime();

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
  }, [offer]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let result = [...rawProducts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.discountedPrice - b.discountedPrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.discountedPrice - a.discountedPrice);
        break;
      case 'discount-desc':
        result.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case 'featured':
      default:
        // natural order returned by server
        break;
    }

    return result;
  }, [rawProducts, searchQuery, sortBy]);

  // Reset to page 1 on search or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success('Offer link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center gap-4 bg-[#FAFAFA]">
        <div className="w-12 h-12 rounded-full border-2 border-gray-200 border-t-[#0F172A] animate-spin" />
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Loading Exclusive Event...
        </p>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-white">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
          <Tag size={28} />
        </div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Promotional Event Concluded</h2>
        <p className="text-sm text-gray-500 max-w-md mt-2 mb-6">
          This promotional showcase is no longer active or has reached its capacity. Explore our newest collections in the catalog.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-black transition-all shadow-md"
        >
          <ArrowLeft size={14} /> Return to Shop
        </Link>
      </div>
    );
  }

  const isFlashSale = offer.isLimitedTime || offer.offerType === 'LIMITED_TIME';

  return (
    <main className="w-full bg-[#FAFAFA] min-h-screen pb-24 text-gray-900 antialiased selection:bg-black selection:text-white">
      {/* Top Editorial Breadcrumbs & Actions */}
      <nav aria-label="Breadcrumb" className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-medium text-gray-500 overflow-hidden">
          <Link href="/" className="hover:text-black transition-colors whitespace-nowrap">Home</Link>
          <ChevronRight size={12} className="text-gray-300 shrink-0" />
          <Link href="/shop" className="hover:text-black transition-colors whitespace-nowrap">Shop</Link>
          <ChevronRight size={12} className="text-gray-300 shrink-0" />
          <span className="text-gray-900 font-semibold truncate max-w-[160px] sm:max-w-[280px]">
            {offer.title}
          </span>
        </div>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-600 hover:text-black transition-colors bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-2xs hover:shadow-xs cursor-pointer"
          title="Share Offer"
        >
          {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Share2 size={13} />}
          <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share Event'}</span>
        </button>
      </nav>

      {/* Hero Showcase Section — Ultra-Responsive Adaptive Banner */}
      <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto mb-10 sm:mb-14">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0A0D14] shadow-2xl ring-1 ring-black/10 min-h-[380px] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[540px] 2xl:min-h-[600px] flex flex-col justify-end">

          {/* Background Hero Image */}
          {offer.banner?.imageUrl ? (
            <img
              src={offer.banner.imageUrl}
              alt={offer.banner.title || offer.title}
              className="absolute inset-0 w-full h-full object-cover object-center transform scale-100 hover:scale-105 transition-transform duration-1000 ease-out"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-[#090D16] via-[#151D2A] to-[#0A0E18]" />
          )}

          {/* Cinematic Vignette Overlays for Maximum Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/25 z-1" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent z-1" />

          {/* Hero Content Block */}
          <div className="relative z-10 p-6 sm:p-10 md:p-14 lg:p-16 2xl:p-20 text-white flex flex-col justify-between max-w-4xl">
            <div>
              {/* Event Badges */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <span className={`inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full shadow-lg ${offer.offerType === 'CELEBRATION'
                    ? 'bg-amber-400 text-black'
                    : isFlashSale
                      ? 'bg-rose-600 text-white'
                      : 'bg-white/90 text-black'
                  }`}>
                  {offer.offerType === 'CELEBRATION' ? (
                    <>
                      <PartyPopper size={13} /> {offer.badgeText || 'Celebration Event'}
                    </>
                  ) : isFlashSale ? (
                    <>
                      <Flame size={13} className="animate-bounce" /> {offer.badgeText || 'Flash Archive Deal'}
                    </>
                  ) : (
                    <>
                      <Sparkle size={13} /> {offer.badgeText || `${offer.offerType} Edition`}
                    </>
                  )}
                </span>

                <span className="bg-white/15 backdrop-blur-md text-white font-extrabold text-[11px] sm:text-xs px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
                  {offer.discountType === 'PERCENTAGE' ? `${offer.discountValue}% SAVINGS` : `₹${offer.discountValue} FLAT OFF`}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.08] text-white drop-shadow-md">
                {offer.banner?.title || offer.title}
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base md:text-lg text-gray-200/90 font-light leading-relaxed mt-3 sm:mt-4 max-w-2xl line-clamp-3">
                {offer.banner?.subtitle || offer.description || 'Curated seasonal drops automatically discounted for our members. Instant price privileges applied at checkout.'}
              </p>
            </div>

            {/* Architectural Countdown Clock */}
            {timeLeft && (
              <div className="mt-6 sm:mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-4 sm:gap-6">

                <div className="flex items-center gap-2 sm:gap-2.5 font-mono">
                  {/* Days */}
                  <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 min-w-[50px] sm:min-w-[62px] shadow-lg">
                    <span className="text-lg sm:text-2xl font-black text-white">{String(timeLeft.days).padStart(2, '0')}</span>
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-400 uppercase tracking-widest">Days</span>
                  </div>
                  <span className="text-white/60 font-bold text-lg">:</span>

                  {/* Hours */}
                  <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 min-w-[50px] sm:min-w-[62px] shadow-lg">
                    <span className="text-lg sm:text-2xl font-black text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-400 uppercase tracking-widest">Hours</span>
                  </div>
                  <span className="text-white/60 font-bold text-lg">:</span>

                  {/* Mins */}
                  <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 min-w-[50px] sm:min-w-[62px] shadow-lg">
                    <span className="text-lg sm:text-2xl font-black text-white">{String(timeLeft.mins).padStart(2, '0')}</span>
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-400 uppercase tracking-widest">Mins</span>
                  </div>
                  <span className="text-white/60 font-bold text-lg">:</span>

                  {/* Secs */}
                  <div className="flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2 min-w-[50px] sm:min-w-[62px] shadow-lg">
                    <span className="text-lg sm:text-2xl font-black text-rose-400">{String(timeLeft.secs).padStart(2, '0')}</span>
                    <span className="text-[8px] sm:text-[9px] font-medium text-gray-400 uppercase tracking-widest">Secs</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog Showcase */}
      <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto">

        {/* Curated Toolbar: Header, Search & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-950 flex items-center gap-2.5">
              <span>Curated Eligible Pieces</span>
              <span className="text-xs sm:text-sm font-sans font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Select any piece below to view variants and secure your auto-applied event pricing.
            </p>
          </div>

          {/* Controls: Search & Sort Filter */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[180px] sm:min-w-[220px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search styles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-black transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sort products"
                className="appearance-none bg-white border border-gray-200 text-xs font-semibold text-gray-700 pl-3 pr-8 py-2 rounded-lg cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black transition-colors shadow-2xs"
              >
                <option value="featured">Featured Order</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount-desc">Biggest Discount</option>
              </select>
              <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Grid — Responsive from Mobile 360px up to 4K Ultra-Wide TV */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-200 rounded-2xl bg-white">
            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
              <Package size={26} />
            </div>
            <h3 className="text-base font-bold text-gray-900">No Matching Styles Found</h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery ? `No styles matching "${searchQuery}" in this promotion.` : 'Styles are being refreshed for this offer.'}
            </p>
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-75 transition-opacity"
              >
                Clear Search Filter
              </button>
            ) : (
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#0F172A] text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-black transition-colors"
              >
                Explore All Catalog
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6 lg:gap-7">
            {paginatedProducts.map((product) => {
              const isFav = isFavourite(product.id);

              return (
                <div
                  key={product.id}
                  className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-150/80 hover:border-gray-400 hover:shadow-xl transition-all duration-300 relative"
                >
                  {/* Image Container with 3:4 High-Fashion Ratio */}
                  <div className="relative aspect-[3/4] bg-[#F4F4F4] overflow-hidden">
                    <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full">
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                          No Preview Available
                        </div>
                      )}
                    </Link>

                    {/* Discount Badge */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="bg-[#0F172A] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-sm">
                        {product.discountPercentage}% OFF
                      </span>
                    </div>

                    {/* Wishlist Button */}
                    <button
                      type="button"
                      aria-label="Toggle favourite"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFavourite({
                          id: product.id,
                          productId: product.id,
                          name: product.name,
                          category: 'Apparel',
                          image: product.thumbnail || '/images/product-1.jpeg',
                          price: product.discountedPrice,
                          comparePrice: product.originalPrice,
                          inStock: true,
                        });
                        if (isFav) {
                          toast.info(`Removed ${product.name} from wishlist`);
                        } else {
                          toast.success(`Saved ${product.name} to wishlist`);
                        }
                      }}
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-rose-600 transition-all shadow-xs z-10 cursor-pointer"
                    >
                      <Heart
                        size={15}
                        strokeWidth={2}
                        className={isFav ? 'fill-rose-600 text-rose-600' : 'text-gray-700'}
                      />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1 gap-3">
                    <div>
                      <Link href={`/product/${product.slug || product.id}`}>
                        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-2 leading-snug tracking-tight">
                          {product.name}
                        </h3>
                      </Link>
                    </div>

                    {/* Price and Instant Savings Box */}
                    <div className="pt-2 border-t border-gray-100 flex items-end justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm sm:text-base font-extrabold text-gray-950">
                            ₹{product.discountedPrice.toLocaleString('en-IN')}
                          </span>
                          {product.originalPrice > product.discountedPrice && (
                            <span className="text-[11px] sm:text-xs text-gray-400 line-through font-normal">
                              ₹{product.originalPrice.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 mt-0.5">
                          Save ₹{product.discountAmount.toLocaleString('en-IN')}
                        </p>
                      </div>

                      {/* Quick Navigate Link */}
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors"
                      >
                        View &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProducts.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              itemsPerPageOptions={[12, 24, 48]}
            />
          </div>
        )}
      </section>

      {/* Brand Luxury Guarantees Banner */}
      <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto mt-20 pt-10 border-t border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
          <div className="flex items-center sm:items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">100% Authentic Quality</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Handcrafted premium garments crafted from luxury natural fabrics.</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Automatic Savings</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Discounts automatically deducted at checkout with zero coupon codes needed.</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
              <Truck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Priority Express Dispatch</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Fast doorstep delivery with real-time tracking across India.</p>
            </div>
          </div>

          <div className="flex items-center sm:items-start gap-3.5">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">7-Day Effortless Returns</h4>
              <p className="text-[11px] text-gray-500 mt-0.5">Easy returns and doorstep exchanges if sizing isn't perfect.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
