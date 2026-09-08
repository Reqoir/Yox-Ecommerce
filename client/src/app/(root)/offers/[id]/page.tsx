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
  ArrowDownUp,
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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { offersApi, OfferProductItem } from '@/api/admin/offers';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { Pagination } from '@/components/ui/pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { optimizeCloudinaryUrl } from '@/lib/utils';

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
      <main className="w-full bg-[#FAFAFA] min-h-screen pb-24 text-gray-900 antialiased animate-in fade-in duration-300">
        {/* Hero Banner Skeleton — Exact match aspect ratio without overlays or rounded corners */}
        <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto mt-4 sm:mt-6 mb-10 sm:mb-14">
          <div className="relative overflow-hidden bg-gray-200 aspect-[1440/680] min-h-[220px] sm:min-h-[380px] md:min-h-[460px]">
            <Skeleton className="w-full h-full rounded-none bg-gray-200" />
            <Skeleton className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-300/80" />
          </div>
        </section>

        {/* Main Catalog Showcase Skeleton */}
        <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto">
          {/* Controls: Search & Sort Toolbar Skeleton */}
          <div className="flex items-center justify-end gap-3 pb-6 mb-6 border-b border-gray-200">
            <Skeleton className="w-48 sm:w-56 h-9 rounded-lg bg-gray-200" />
            <Skeleton className="w-36 h-9 rounded-lg bg-gray-200" />
          </div>

          {/* Product Grid Skeleton — Exact product card layout */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-6 lg:gap-7">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="flex flex-col relative">
                {/* Image Container Skeleton */}
                <Skeleton className="w-full aspect-[3/4] rounded-[2px] bg-gray-200 mb-3" />
                {/* Text Details Skeleton */}
                <div className="space-y-1.5 px-1">
                  <Skeleton className="w-4/5 h-4 rounded-xs bg-gray-200" />
                  <Skeleton className="w-2/5 h-3.5 rounded-xs bg-gray-200" />
                </div>
              </div>
            ))}
          </div>

          {/* Brand Luxury Guarantees Skeleton */}
          <div className="mt-20 pt-10 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center sm:items-start gap-3.5">
                <Skeleton className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <Skeleton className="w-32 h-4 rounded-xs bg-gray-200" />
                  <Skeleton className="w-44 h-3 rounded-xs bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
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
      {/* Hero Showcase Section — Banner without text overlay and with share button on top right */}
      <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto mt-4 sm:mt-6 mb-10 sm:mb-14">
        <div className="relative overflow-hidden bg-gray-950 aspect-[1440/680] min-h-[220px] sm:min-h-[380px] md:min-h-[460px]">
          {/* Background Hero Image */}
          {offer.banner?.imageUrl ? (
            <picture className="w-full h-full block">
              {offer.banner.mobileImageUrl && (
                <source media="(max-width: 640px)" srcSet={optimizeCloudinaryUrl(offer.banner.mobileImageUrl, 1200)} />
              )}
              <img
                src={optimizeCloudinaryUrl(offer.banner.imageUrl, 2000)}
                alt={offer.banner.title || offer.title}
                className="w-full h-full object-cover object-center"
              />
            </picture>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-tr from-gray-900 via-gray-800 to-black" />
          )}

          {/* Share Button on Banner Top Right */}
          <button
            onClick={handleShare}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-gray-900 bg-white/80 hover:bg-white hover:text-black backdrop-blur-md px-3 py-2 rounded-full border border-white/40 shadow-sm transition-all cursor-pointer"
            title="Share Event"
          >
            {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </section>

      {/* Main Catalog Showcase */}
      <section className="w-[92%] sm:w-[94%] max-w-[1720px] mx-auto">

        {/* Curated Toolbar: Search & Sort */}
        <div className="flex items-center justify-end gap-4 pb-6 mb-6 border-b border-gray-200">

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
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="border-0 focus:ring-0 focus:ring-offset-0 p-0 h-auto bg-transparent hover:bg-transparent shadow-none [&>svg]:hidden">
                <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-gray-900 hover:text-black transition-colors cursor-pointer">
                  <ArrowDownUp size={14} strokeWidth={1.5} />
                  <span>Sort By</span>
                </div>
              </SelectTrigger>
              <SelectContent align="end" className="bg-white border border-gray-200 rounded-none">
                <SelectItem value="featured" className="text-xs capitalize text-gray-800 cursor-pointer rounded-none">
                  Featured Order
                </SelectItem>
                <SelectItem value="price-asc" className="text-xs capitalize text-gray-800 cursor-pointer rounded-none">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-desc" className="text-xs capitalize text-gray-800 cursor-pointer rounded-none">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="discount-desc" className="text-xs capitalize text-gray-800 cursor-pointer rounded-none">
                  Biggest Discount
                </SelectItem>
              </SelectContent>
            </Select>
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
                  className="group flex flex-col relative"
                >
                  <Link href={`/product/${product.slug || product.id}`} className="block">
                    {/* Image Container */}
                    <div className="relative aspect-[3/4] bg-[#F2F2F2] mb-3 overflow-hidden rounded-[2px]">
                      {product.thumbnail ? (
                        <>
                          <img
                            src={optimizeCloudinaryUrl(product.thumbnail)}
                            alt={product.name}
                            className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
                              (product.secondImage || (product.images && product.images.length > 1 && product.images[1] !== product.thumbnail))
                                ? 'group-hover:opacity-0'
                                : ''
                            }`}
                          />
                          {(product.secondImage || (product.images && product.images.length > 1 && product.images[1] !== product.thumbnail)) && (
                            <img
                              src={optimizeCloudinaryUrl(product.secondImage || product.images![1])}
                              alt={`${product.name} alternate view`}
                              className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                            />
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                          No Preview Available
                        </div>
                      )}

                      {/* Badge */}
                      {product.discountPercentage > 0 && (
                        <div className="absolute top-2.5 left-2.5 z-10 bg-white px-2 py-1 text-[10px] font-bold rounded-sm shadow-sm text-rose-600">
                          {product.discountPercentage}% OFF
                        </div>
                      )}

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
                        }}
                        className="absolute top-2.5 right-2.5 p-1.5 text-gray-600 hover:text-red-500 transition-colors z-10 cursor-pointer bg-white/60 hover:bg-white rounded-full backdrop-blur-xs"
                      >
                        <Heart
                          size={15}
                          className={isFav ? 'fill-rose-600 text-rose-600' : 'text-gray-700'}
                        />
                      </button>
                    </div>

                    {/* Product Details (Standard Design & Font) */}
                    <div className="space-y-1.5 px-1">
                      <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 truncate">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] font-medium text-gray-600">
                        <span className="text-gray-900 font-bold">₹{product.discountedPrice.toLocaleString('en-IN')} INR</span>
                        {product.originalPrice > product.discountedPrice && (
                          <span className="line-through text-gray-400">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </div>
                  </Link>
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
