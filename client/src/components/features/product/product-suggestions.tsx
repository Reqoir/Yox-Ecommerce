'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Heart, ChevronRight, ArrowRight } from 'lucide-react';
import { productsApi, BackendProduct } from '@/lib/api/products';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useCategories } from '@/hooks/admin/useCategories';
import { useBrands } from '@/hooks/admin/useBrands';
import { Skeleton } from '@/components/ui/skeleton';
import { optimizeCloudinaryUrl } from '@/lib/utils';

interface ProductSuggestionsProps {
  currentProductId: string;
  categoryId: string;
  brandId?: string | null;
  categoryName?: string;
  brandName?: string;
}

interface SuggestionCardProps {
  product: BackendProduct;
  categoryDisplayName?: string;
}

function SuggestionCard({ product, categoryDisplayName }: SuggestionCardProps) {
  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const [isHovered, setIsHovered] = useState(false);

  const variants = product.variants || [];
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0] || null;
  const price = defaultVariant?.price || 0;
  const comparePrice = defaultVariant?.comparePrice || null;
  const discountPct =
    comparePrice && comparePrice > price
      ? Math.round(((comparePrice - price) / comparePrice) * 100)
      : 0;

  // Resolve thumbnail and second image
  const primaryImage = defaultVariant?.images?.[0] || product.thumbnail || '/images/product-1.jpeg';
  const allImages = defaultVariant?.images || [];
  const secondImage =
    allImages.length > 1 && allImages[1] !== primaryImage
      ? allImages[1]
      : product.thumbnail && product.thumbnail !== primaryImage
      ? product.thumbnail
      : null;

  const isFav = isFavourite(product.id, defaultVariant?.color || null);
  const slug = product.slug || product.id;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavourite({
      id: `${product.id}__${defaultVariant?.color || 'default'}`,
      productId: product.id,
      color: defaultVariant?.color || null,
      name: product.name,
      category: categoryDisplayName || product.categoryId || 'Apparel',
      image: primaryImage,
      price,
      comparePrice: comparePrice || undefined,
      inStock: variants.some((v) => (v.stock || 0) > 0),
    });
  };

  return (
    <Link
      href={`/product/${slug}`}
      className="group flex flex-col cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="relative w-full aspect-[3/4] bg-[#f2f2f2] overflow-hidden mb-3">
        {/* Primary image */}
        <img
          src={optimizeCloudinaryUrl(primaryImage)}
          alt={product.name}
          className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
            secondImage ? 'group-hover:opacity-0' : ''
          }`}
        />

        {/* Second image (hover reveal) */}
        {secondImage && (
          <img
            src={optimizeCloudinaryUrl(secondImage)}
            alt={`${product.name} alternate view`}
            className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          />
        )}

        {/* Discount badge */}
        {discountPct > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-black/90 text-white text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm">
            {discountPct}% OFF
          </span>
        )}

        {/* Wishlist */}
        <button
          type="button"
          aria-label={isFav ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={handleWishlist}
          className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-white/85 hover:bg-white flex items-center justify-center transition-all shadow-xs opacity-0 group-hover:opacity-100"
        >
          <Heart
            size={13}
            strokeWidth={2}
            className={isFav ? 'fill-red-500 text-red-500' : 'text-gray-700'}
          />
        </button>
      </div>

      {/* Info */}
      <p className="text-[11px] text-gray-500 mb-0.5 uppercase tracking-wider truncate">
        {product.tag || 'YOX Menswear'}
      </p>
      <h3 className="text-[13px] font-medium text-gray-900 leading-snug line-clamp-2 mb-1.5 group-hover:text-black transition-colors">
        {product.name}
      </h3>
      <div className="flex items-baseline gap-1.5 mt-auto">
        <span className="text-[13px] font-bold text-gray-900">
          ₹{price.toLocaleString('en-IN')}
        </span>
        {comparePrice && comparePrice > price && (
          <span className="text-[11px] text-gray-400 line-through">
            ₹{comparePrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>
    </Link>
  );
}

function SuggestionSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="w-full aspect-[3/4] bg-gray-100 mb-3" />
      <Skeleton className="w-16 h-3 bg-gray-100 mb-1.5" />
      <Skeleton className="w-4/5 h-4 bg-gray-100 mb-1" />
      <Skeleton className="w-24 h-4 bg-gray-100" />
    </div>
  );
}

export function ProductSuggestions({
  currentProductId,
  categoryId,
  brandId,
  categoryName,
  brandName,
}: ProductSuggestionsProps) {
  const { categories: apiCategories } = useCategories();
  const { brands: apiBrands } = useBrands();

  // Resolve human-readable category name and URL-friendly slug
  const matchedCategory = (apiCategories || []).find(
    (c) =>
      c.id?.toLowerCase() === categoryId?.toLowerCase() ||
      c.slug?.toLowerCase() === categoryId?.toLowerCase()
  );
  const resolvedCategoryName = categoryName || matchedCategory?.name;
  const resolvedCategorySlug = matchedCategory?.slug || matchedCategory?.name?.toLowerCase() || categoryId;

  // Resolve human-readable brand name and URL-friendly slug
  const matchedBrand = (apiBrands || []).find(
    (b) =>
      b.id?.toLowerCase() === brandId?.toLowerCase() ||
      b.slug?.toLowerCase() === brandId?.toLowerCase()
  );
  const resolvedBrandName = brandName || matchedBrand?.name;
  const resolvedBrandSlug = matchedBrand?.slug || matchedBrand?.name?.toLowerCase() || brandId;

  // Similar styles (same category, exclude current)
  const { data: similarData, isLoading: loadingSimilar } = useQuery({
    queryKey: ['similar-products', categoryId, currentProductId],
    queryFn: () =>
      productsApi.getSimilarProducts({
        categoryId,
        excludeId: currentProductId,
        limit: 10,
      }),
    enabled: Boolean(categoryId),
    staleTime: 1000 * 60 * 5,
  });

  // More from brand (same brand, exclude current, different from similar)
  const { data: brandData, isLoading: loadingBrand } = useQuery({
    queryKey: ['brand-products', brandId, currentProductId],
    queryFn: () =>
      productsApi.getSimilarProducts({
        brandId: brandId!,
        excludeId: currentProductId,
        limit: 10,
      }),
    enabled: Boolean(brandId),
    staleTime: 1000 * 60 * 5,
  });

  const similarProducts = (similarData?.data || []).slice(0, 6);
  // Brand products — exclude those already shown in similar
  const similarIds = new Set(similarProducts.map((p) => p.id));
  const brandProducts = (brandData?.data || [])
    .filter((p) => !similarIds.has(p.id))
    .slice(0, 6);

  const hasSimilar = loadingSimilar || similarProducts.length > 0;
  const hasBrand = brandId && (loadingBrand || brandProducts.length > 0);

  if (!hasSimilar && !hasBrand) return null;

  const SectionHeader = ({
    label,
    sublabel,
    href,
  }: {
    label: string;
    sublabel: string;
    href: string;
  }) => (
    <div className="flex items-end justify-between mb-6 sm:mb-8">
      <div>
        <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400 mb-1">
          {sublabel}
        </p>
        <h2 className="text-xl sm:text-2xl font-medium text-gray-900 tracking-tight">{label}</h2>
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 hover:text-black transition-colors shrink-0 ml-4 pb-1 border-b border-transparent hover:border-black"
      >
        View All <ArrowRight size={12} />
      </Link>
    </div>
  );

  return (
    <div className="w-full border-t border-gray-100 mt-16 sm:mt-20">
      {/* Similar Styles Section */}
      {hasSimilar && (
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-12">
          <SectionHeader
            label={resolvedCategoryName ? `More in ${resolvedCategoryName}` : 'You May Also Like'}
            sublabel="Similar Styles"
            href={resolvedCategorySlug ? `/shop?category=${encodeURIComponent(resolvedCategorySlug)}` : '/shop'}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
            {loadingSimilar
              ? Array.from({ length: 6 }).map((_, i) => <SuggestionSkeleton key={i} />)
              : similarProducts.map((product) => (
                  <SuggestionCard
                    key={product.id}
                    product={product}
                    categoryDisplayName={resolvedCategoryName}
                  />
                ))}
          </div>
        </section>
      )}

      {/* More from Brand Section */}
      {hasBrand && (
        <section className="w-full border-t border-gray-100">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-16">
            <SectionHeader
              label={resolvedBrandName ? `More from ${resolvedBrandName}` : 'More from This Brand'}
              sublabel="Brand Collection"
              href={resolvedBrandSlug ? `/shop?brand=${encodeURIComponent(resolvedBrandSlug)}` : '/shop'}
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-4 gap-y-8">
              {loadingBrand
                ? Array.from({ length: 6 }).map((_, i) => <SuggestionSkeleton key={i} />)
                : brandProducts.map((product) => (
                    <SuggestionCard
                      key={product.id}
                      product={product}
                      categoryDisplayName={resolvedBrandName}
                    />
                  ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
