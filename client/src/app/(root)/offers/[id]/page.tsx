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
  ChevronRight,
  Sparkle,
  ShoppingBag,
  Eye
} from 'lucide-react';
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
    enabled: Boolean(offerId && offerId.trim()),
    retry: false,
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
      toast.success('Campaign link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (isLoading) {
    return (
      <main className="w-full bg-[#FCFBFA] min-h-screen pb-24 text-gray-900 antialiased animate-in fade-in duration-300">
        {/* Header Skeleton */}
        <div className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-4 flex items-center justify-between border-b border-gray-200/70">
          <Skeleton className="w-40 sm:w-56 h-4 rounded-xs bg-gray-200" />
          <Skeleton className="w-20 h-6 rounded-full bg-gray-200" />
        </div>

        {/* Banner Skeleton */}
        <section className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 my-6">
          <Skeleton className="w-48 h-6 rounded-md bg-gray-200 mb-4" />
          <Skeleton className="w-full aspect-[16/10] sm:aspect-[18/8] lg:aspect-[24/9] rounded-2xl bg-gray-200" />
        </section>

        {/* Product Grid Skeleton */}
        <section className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 mt-10">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200/80">
                <Skeleton className="w-full aspect-[3/4] rounded-none bg-gray-100" />
                <div className="p-3 sm:p-4 flex flex-col gap-2">
                  <Skeleton className="w-4/5 h-4 rounded-xs bg-gray-200" />
                  <Skeleton className="w-1/2 h-3 rounded-xs bg-gray-200 mb-2" />
                  <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                    <Skeleton className="w-20 h-5 rounded-xs bg-gray-200" />
                    <Skeleton className="w-12 h-4 rounded-xs bg-gray-200" />
                  </div>
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
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center bg-[#FCFBFA]">
        <div className="w-16 h-16 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-4 text-gray-400 shadow-xs">
          <Tag size={26} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 uppercase tracking-tight">
          Promotional Campaign Concluded
        </h2>
        <p className="text-sm text-gray-500 max-w-md mt-2 mb-6 leading-relaxed">
          This limited drop or seasonal offer is no longer active. Discover our current promotions and latest menswear arrivals.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/offers"
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition-all shadow-sm cursor-pointer"
          >
            Browse All Offers
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-white text-gray-800 border border-gray-200 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-50 transition-all shadow-2xs"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    );
  }

  const discountSummary = offer.discountType === 'PERCENTAGE'
    ? `${offer.discountValue}% OFF`
    : `₹${offer.discountValue} FLAT OFF`;

  return (
    <main className="w-full bg-[#FCFBFA] min-h-screen pb-24 text-gray-900 antialiased selection:bg-black selection:text-white">
      {/* Top Breadcrumbs Strip */}
      <div className="w-full bg-white border-b border-gray-200/80">
        <div className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 text-[10px] sm:text-xs font-mono uppercase tracking-wider text-gray-500">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 truncate">
            <Link href="/" className="hover:text-black transition-colors whitespace-nowrap">Home</Link>
            <span>/</span>
            <Link href="/offers" className="hover:text-black transition-colors whitespace-nowrap">Offers</Link>
            <span>/</span>
            <span className="text-gray-900 font-bold truncate max-w-[160px] sm:max-w-[320px]">
              {offer.title}
            </span>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/offers"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 hover:text-black transition-colors px-2.5 py-1 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={12} />
              <span>All Offers</span>
            </Link>

            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-700 hover:text-black transition-colors bg-white px-2.5 py-1 rounded-full border border-gray-200 shadow-2xs hover:shadow-xs cursor-pointer"
              title="Share Campaign Link"
            >
              {copiedLink ? <Check size={12} className="text-emerald-600" /> : <Share2 size={12} />}
              <span>{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-[98%] max-w-[1500px] 2xl:max-w-[1700px] 3xl:max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        
        {/* Small Clean Campaign Heading & Privilege Pill (Minimalist, modern, branded) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 sm:mb-5 pb-3 border-b border-gray-200/60">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-serif font-black tracking-tight text-gray-950 uppercase leading-none">
              {offer.title}
            </h1>

            <span className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 border border-amber-500/30">
              {discountSummary} • AUTO-APPLIED
            </span>

            {offer.badgeText && (
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gray-900 text-white shadow-2xs">
                {offer.badgeText}
              </span>
            )}
          </div>

          {/* Optional countdown timer indicator */}
          {timeLeft && (
            <div className="inline-flex items-center gap-1.5 font-mono text-[10.5px] sm:text-[11px] font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200/80 shrink-0">
              <Clock size={12} className="animate-pulse" />
              <span>Ends in {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}{timeLeft.hours}h {timeLeft.mins}m {timeLeft.secs}s</span>
            </div>
          )}
        </div>

        {/* Campaign Hero Banner — Direct, clean, and fully responsive across Mobile, Tablet, Laptop, TV */}
        {offer.banner?.imageUrl && (
          <div className="relative w-full rounded-2xl overflow-hidden bg-gray-950 border border-gray-200/80 shadow-md aspect-[16/10] sm:aspect-[18/8] lg:aspect-[24/9] xl:aspect-[26/9] max-h-[500px] mb-8 sm:mb-10 group">
            <img
              src={offer.banner.imageUrl}
              alt={offer.banner.title || offer.title}
              className="w-full h-full object-cover object-top sm:object-center transition-transform duration-700 ease-out group-hover:scale-[1.01]"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/linen-banner.png';
              }}
            />
          </div>
        )}

        {/* Curated Products Catalog Showcase */}
        <section>
          {/* Catalog Toolbar: Heading, Search & Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 mb-5 border-b border-gray-200">
            <div>
              <h2 className="text-base sm:text-xl font-serif font-bold text-gray-950 flex items-center gap-2">
                <span>Curated Eligible Pieces</span>
                <span className="text-[11px] sm:text-xs font-sans font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                Prices shown reflect automatic event discount. Simply select your size and add to bag.
              </p>
            </div>

            {/* Controls: Search & Sort */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Search Input */}
              <div className="relative flex-1 sm:flex-initial min-w-[150px] sm:min-w-[210px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search styles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 sm:py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-black transition-colors shadow-2xs font-medium"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  aria-label="Sort products"
                  className="appearance-none bg-white border border-gray-200 text-xs font-semibold text-gray-800 pl-3 pr-7 py-1.5 sm:py-2 rounded-xl cursor-pointer hover:border-gray-300 focus:outline-none focus:border-black transition-colors shadow-2xs"
                >
                  <option value="featured">Featured Order</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="discount-desc">Highest Savings %</option>
                </select>
                <ArrowUpDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Product Grid — Mobile 2-in-a-row to 4K Ultra-Wide */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-2xl bg-white my-6">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Package size={22} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900">No Matching Styles Found</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-5">
                {searchQuery ? `No styles matching "${searchQuery}" in this promotion.` : 'Styles are currently being curated for this offer.'}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs font-bold text-black border-b border-black pb-0.5 hover:opacity-75 transition-opacity cursor-pointer"
                >
                  Clear Search Filter
                </button>
              ) : (
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold px-5 py-2.5 rounded-full hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Explore Full Catalog
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-5 lg:gap-6">
                {paginatedProducts.map((product) => {
                  const isFav = isFavourite(product.id);

                  // Find second image for smooth hover preview
                  const secondImg = (product.secondImage && product.secondImage !== product.thumbnail)
                    ? product.secondImage
                    : (product.images?.find((img) => img && img !== product.thumbnail) || null);

                  return (
                    <div
                      key={product.id}
                      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:border-gray-400 hover:shadow-xl transition-all duration-300 relative"
                    >
                      {/* Image Container with 3:4 High-Fashion Portrait Ratio */}
                      <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
                        <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full relative">
                          {product.thumbnail ? (
                            <>
                              {/* Primary Image */}
                              <img
                                src={optimizeCloudinaryUrl(product.thumbnail)}
                                alt={product.name}
                                className={`w-full h-full object-cover object-top transition-all duration-500 ease-out ${
                                  secondImg ? 'group-hover:opacity-0 group-hover:scale-105' : 'group-hover:scale-105'
                                }`}
                              />

                              {/* Second Image on Hover (Alternate Angle / Back View / Detail View) */}
                              {secondImg && (
                                <img
                                  src={optimizeCloudinaryUrl(secondImg)}
                                  alt={`${product.name} alternate view`}
                                  className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 ease-out pointer-events-none"
                                />
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">
                              No Preview Available
                            </div>
                          )}
                        </Link>

                        {/* Luxury Discount Pill Badge */}
                        <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 z-10">
                          <span className="bg-black/90 backdrop-blur-xs text-white text-[9px] sm:text-[10.5px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
                            {product.discountPercentage}% OFF
                          </span>
                        </div>

                        {/* Floating Wishlist Heart */}
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
                          className="absolute top-2 sm:top-2.5 right-2 sm:right-2.5 w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-white/85 hover:bg-white backdrop-blur-xs flex items-center justify-center text-gray-700 hover:text-rose-600 transition-all shadow-xs z-10 cursor-pointer"
                        >
                          <Heart
                            size={14}
                            strokeWidth={2}
                            className={isFav ? 'fill-rose-600 text-rose-600' : 'text-gray-700'}
                          />
                        </button>
                      </div>

                      {/* Product Details Block */}
                      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          <span className="text-[9.5px] sm:text-[10.5px] font-mono uppercase tracking-widest text-gray-400 block mb-0.5">
                            YOX Menswear
                          </span>
                          <Link href={`/product/${product.slug || product.id}`}>
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-black line-clamp-2 leading-snug tracking-tight">
                              {product.name}
                            </h3>
                          </Link>
                        </div>

                        {/* Price and Instant Savings Box */}
                        <div className="pt-2 border-t border-gray-100 flex items-end justify-between gap-1.5">
                          <div>
                            <div className="flex items-baseline gap-1.5 sm:gap-2">
                              <span className="text-sm sm:text-base font-extrabold text-gray-950">
                                ₹{product.discountedPrice.toLocaleString('en-IN')}
                              </span>
                              {product.originalPrice > product.discountedPrice && (
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through font-normal">
                                  ₹{product.originalPrice.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            <p className="text-[9.5px] sm:text-[11px] font-bold text-emerald-700 mt-0.5">
                              Save ₹{product.discountAmount.toLocaleString('en-IN')}
                            </p>
                          </div>

                          {/* Quick CTA */}
                          <Link
                            href={`/product/${product.slug || product.id}`}
                            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors shrink-0"
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
        <section className="mt-14 sm:mt-20 pt-8 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-left">
            <div className="flex items-start gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">100% Authentic Quality</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Handcrafted garments crafted from premium natural weaves.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Automatic Savings</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Discounts automatically applied at checkout with zero promo codes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <Truck size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">Express Dispatch</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Priority packing and live tracked doorstep delivery across India.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/70 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-800 shrink-0">
                <RotateCcw size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">7-Day Easy Returns</h4>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  Complimentary doorstep reverse pickups and quick sizing exchanges.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
