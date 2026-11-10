"use client";

import React, { useState, use, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Heart, 
  Tag, 
  Loader2, 
  Minus, 
  Plus, 
  ShoppingBag, 
  Droplets, 
  Ruler, 
  Scissors, 
  ChevronDown, 
  Flame, 
  Maximize2,
  Sparkles,
  Clock,
  Copy,
  Check,
  Share2,
  Sun,
  ShieldCheck,
  Wind
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, BackendProduct } from '@/lib/api/products';
import { offersApi } from '@/api/admin/offers';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { useStoreSettingsStore } from '@/store/useStoreSettingsStore';
import { useCategories } from '@/hooks/admin/useCategories';
import { toast } from 'sonner';
import { ProductReviews } from '@/components/features/product/product-reviews';
import { ProductSuggestions } from '@/components/features/product/product-suggestions';
import { ProductImagePreviewModal } from '@/components/features/product/product-image-preview-modal';

interface ProductSpec {
  care: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; title: string; subtitle: string };
  fit: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; title: string; subtitle: string };
  material: { icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; title: string; subtitle: string };
  accordionCareTitle: string;
  accordionCareText: string;
  accordionFitTitle: string;
  accordionFitText: string;
}

function getProductSpecifications(
  product: BackendProduct,
  categoryName?: string,
  subCategoryName?: string
): ProductSpec {
  const cat = (categoryName || '').toLowerCase();
  const sub = (subCategoryName || '').toLowerCase();
  const name = (product.name || '').toLowerCase();

  // 1. Eyewear / Sunglasses
  if (sub.includes('eyewear') || name.includes('sunglass') || name.includes('glasses')) {
    return {
      care: { icon: Sparkles, title: 'Wipe clean', subtitle: 'Microfiber cloth' },
      fit: { icon: Sun, title: '100% UV400', subtitle: 'Polarized lenses' },
      material: { icon: ShieldCheck, title: 'Acetate frame', subtitle: 'German hinges' },
      accordionCareTitle: 'MATERIAL & CARE',
      accordionCareText: 'Hand-polished cellulose acetate frame with scratch-resistant lenses. Includes protective case and microfiber cloth. Clean lenses with lukewarm water and a microfiber cloth.',
      accordionFitTitle: 'FIT & DIMENSIONS',
      accordionFitText: 'Unisex standard fit. Wire-core temples can be slightly adjusted by an optical specialist for a customized fit.',
    };
  }

  // 2. Belts
  if (sub.includes('belt') || name.includes('belt')) {
    return {
      care: { icon: Sparkles, title: 'Wipe clean', subtitle: 'Dry soft cloth' },
      fit: { icon: Ruler, title: 'Adjustable fit', subtitle: 'True to waist size' },
      material: { icon: ShieldCheck, title: 'Full-grain leather', subtitle: 'Solid metal buckle' },
      accordionCareTitle: 'MATERIAL & CARE',
      accordionCareText: '100% genuine full-grain leather with hand-finished edges and solid metal buckle. Keep away from water. Clean with a dry cloth and condition with leather cream.',
      accordionFitTitle: 'SIZING GUIDE',
      accordionFitText: 'Order your exact trouser waist size for a center-hole fit. 5 pin holes provide easy micro-adjustments.',
    };
  }

  // 3. Wallets, Cardholders, Bags
  if (sub.includes('wallet') || sub.includes('bag') || name.includes('wallet') || name.includes('cardholder') || name.includes('backpack') || name.includes('bag') || name.includes('tote')) {
    const isWallet = sub.includes('wallet') || name.includes('wallet') || name.includes('cardholder');
    return {
      care: { icon: Sparkles, title: 'Wipe clean', subtitle: 'Condition as needed' },
      fit: { icon: Ruler, title: isWallet ? 'Slim profile' : 'Standard capacity', subtitle: isWallet ? 'Fits cards & cash' : 'Everyday carry' },
      material: { icon: ShieldCheck, title: isWallet ? 'RFID protected' : 'Durable build', subtitle: isWallet ? 'Reinforced edges' : 'Heavy-duty hardware' },
      accordionCareTitle: 'MATERIAL & CARE',
      accordionCareText: 'Genuine leather and heavy-duty hardware. Wipe with a dry, clean cloth to remove surface dirt. Do not machine wash or soak.',
      accordionFitTitle: isWallet ? 'SPECIFICATIONS & CAPACITY' : 'DIMENSIONS & STORAGE',
      accordionFitText: isWallet
        ? 'Designed to hold credit cards, folded currency, and ID cards neatly without adding pocket bulk.'
        : 'Spacious main compartment designed for everyday essentials and tech accessories.',
    };
  }

  // 4. Other Accessories (Caps, Hats, Socks, Jewelry, etc.)
  if (cat.includes('accessori') || name.includes('cap') || name.includes('hat') || name.includes('socks') || name.includes('beanie')) {
    return {
      care: { icon: Sparkles, title: 'Spot clean', subtitle: 'Air dry in shade' },
      fit: { icon: Ruler, title: 'Standard size', subtitle: 'Unisex fit' },
      material: { icon: ShieldCheck, title: 'Durable finish', subtitle: 'Reinforced build' },
      accordionCareTitle: 'MATERIAL & CARE',
      accordionCareText: 'Constructed from durable, quality materials designed for everyday use. Spot clean with mild detergent and air dry in shade.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'Standard one-size fits most.',
    };
  }

  // 5. Jackets & Outerwear
  if (cat.includes('jacket') || name.includes('jacket') || name.includes('coat') || name.includes('blazer') || name.includes('bomber') || name.includes('parka') || name.includes('puffer')) {
    return {
      care: { icon: Droplets, title: 'Specialist clean', subtitle: 'Do not tumble dry' },
      fit: { icon: Ruler, title: product.fit || 'Layering fit', subtitle: 'True to size' },
      material: { icon: Wind, title: 'Wind resistant', subtitle: 'Durable shell' },
      accordionCareTitle: 'FABRIC & CARE',
      accordionCareText: 'Dry clean or specialist outerwear clean only. Do not machine wash, tumble dry, or bleach. Store on a contoured suit hanger to preserve shape.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'Engineered with ease of movement for layering over shirts and knitwear. Select your regular size for an authentic outerwear silhouette.',
    };
  }

  // 6. Pants & Trousers & Jeans
  if (cat.includes('pant') || sub.includes('chino') || sub.includes('cargo') || sub.includes('jeans') || sub.includes('tailored') || name.includes('pant') || name.includes('jeans') || name.includes('trouser') || name.includes('chino') || name.includes('cargo')) {
    const isDenim = sub.includes('jeans') || name.includes('jeans') || name.includes('denim');
    return {
      care: { icon: Droplets, title: isDenim ? 'Wash inside out' : 'Machine wash cold', subtitle: isDenim ? 'Cold gentle cycle' : 'Tumble dry low' },
      fit: { icon: Ruler, title: product.fit || (isDenim ? 'Straight fit' : 'Tailored fit'), subtitle: 'True to waist size' },
      material: { icon: Scissors, title: isDenim ? 'Durable denim' : 'Cotton twill blend', subtitle: isDenim ? 'Pure indigo dye' : 'Wrinkle resistant' },
      accordionCareTitle: 'FABRIC & CARE',
      accordionCareText: isDenim
        ? '100% cotton denim. Machine wash cold inside out with dark colors. Line dry in shade to preserve denim character and avoid fading.'
        : 'Durable cotton blend with slight stretch for mobility. Machine wash cold with like colors. Warm iron if required.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'Fits true to waist size. Designed with standard inseam length and ergonomic waist construction.',
    };
  }

  // 7. Shirts (Casual, Linen, Oxford)
  if ((cat.includes('shirt') && !cat.includes('t-shirt')) || sub.includes('oxford') || sub.includes('linen') || sub.includes('casual') || name.includes('oxford') || name.includes('linen')) {
    const isLinen = sub.includes('linen') || name.includes('linen');
    return {
      care: { icon: Droplets, title: isLinen ? 'Hand or cold wash' : 'Machine wash cold', subtitle: isLinen ? 'Air dry in shade' : 'Warm iron on reverse' },
      fit: { icon: Ruler, title: product.fit || (isLinen ? 'Relaxed fit' : 'Regular fit'), subtitle: 'True to size' },
      material: { icon: Scissors, title: isLinen ? '100% Pure linen' : '100% Combed cotton', subtitle: isLinen ? 'Naturally cooling' : 'Structured collar' },
      accordionCareTitle: 'FABRIC & CARE',
      accordionCareText: isLinen
        ? '100% natural European linen. Wash in cold water on gentle cycle. Hang dry while damp and steam or press lightly for effortless texture.'
        : '100% combed long-staple cotton. Machine wash cold at 30°C. Hang dry and iron while slightly damp for a sharp, clean finish.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'Tailored through the shoulders with standard chest ease. Order your regular size for an elegant fit.',
    };
  }

  // 8. T-Shirts & Tops
  if (cat.includes('t-shirt') || name.includes('t-shirt') || name.includes('tee') || name.includes('polo')) {
    return {
      care: { icon: Droplets, title: 'Machine wash cold', subtitle: 'Gentle cycle' },
      fit: { icon: Ruler, title: product.fit || 'Regular fit', subtitle: 'True to size' },
      material: { icon: Scissors, title: '100% Combed cotton', subtitle: 'Pre-shrunk fabric' },
      accordionCareTitle: 'FABRIC & CARE',
      accordionCareText: '100% pre-shrunk combed cotton jersey. Machine wash cold with like colors. Do not bleach. Tumble dry on low or line dry.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'True to size. Choose your standard size for a clean classic fit, or size up one size for a modern relaxed fit.',
    };
  }

  // 9. Hoodies & Sweatshirts
  if (cat.includes('hoodie') || name.includes('hoodie') || name.includes('sweatshirt') || name.includes('sweater')) {
    return {
      care: { icon: Droplets, title: 'Cold wash inside out', subtitle: 'Flat dry' },
      fit: { icon: Ruler, title: product.fit || 'Relaxed fit', subtitle: 'True to size' },
      material: { icon: Scissors, title: 'Heavyweight fleece', subtitle: 'Brushed interior' },
      accordionCareTitle: 'FABRIC & CARE',
      accordionCareText: 'Heavyweight cotton-blend fleece with soft brushed interior. Machine wash cold inside out. Flat dry to maintain shape and prevent shrinkage.',
      accordionFitTitle: 'FIT & SIZING',
      accordionFitText: 'Cut in a relaxed, comfortable silhouette with dropped shoulders and ribbed cuffs. True to size.',
    };
  }

  // 10. Fallback / General Apparel
  return {
    care: { icon: Droplets, title: 'Machine wash cold', subtitle: 'Gentle cycle' },
    fit: { icon: Ruler, title: product.fit || 'Standard fit', subtitle: 'True to size' },
    material: { icon: Scissors, title: 'Quality fabric', subtitle: 'Reinforced seams' },
    accordionCareTitle: 'FABRIC & CARE',
    accordionCareText: 'Machine wash cold with like colors. Do not bleach. Line dry in shade to preserve fabric integrity and color longevity.',
    accordionFitTitle: 'FIT & SIZING',
    accordionFitText: 'Fits true to standard retail sizing. Order your regular size.',
  };
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const routeParams = useParams<{ id: string }>();
  const rawId = resolvedParams?.id || routeParams?.id || '';
  const productId = decodeURIComponent(rawId);

  const router = useRouter();
  const searchParams = useSearchParams();
  const colorFromUrl = searchParams.get('color');
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getProductById(productId),
    enabled: Boolean(productId),
    retry: 1
  });

  const { data: bestOfferData } = useQuery({
    queryKey: ['best-offer', productId],
    queryFn: () => offersApi.getBestOfferForProduct(productId),
    enabled: Boolean(productId),
  });

  const [copiedOfferCode, setCopiedOfferCode] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // Image preview modal & mobile expansion states
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [isMobileImagesExpanded, setIsMobileImagesExpanded] = useState<boolean>(false);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const setDirectBuyItem = useCheckoutStore((state) => state.setDirectBuyItem);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { config } = useStoreSettingsStore();
  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const isFav = product ? isFavourite(product.id, selectedColor) : false;

  const { categories: apiCategories = [] } = useCategories();
  const [isCopiedShare, setIsCopiedShare] = useState(false);

  const handleShare = async () => {
    if (!product) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} on YOX`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopiedShare(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setIsCopiedShare(false), 2000);
      } catch {
        toast.error('Failed to copy link');
      }
    }
  };

  // Initialize selected variants and SEO metadata when data loads
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        if (colorFromUrl) {
          const matchedVariant = product.variants.find(
            (v) => v.color && v.color.trim().toLowerCase() === colorFromUrl.trim().toLowerCase()
          );
          if (matchedVariant) {
            setSelectedColor(matchedVariant.color);
            setSelectedSize(matchedVariant.size || null);
          } else {
            const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
            setSelectedColor(defaultVariant.color);
            setSelectedSize(defaultVariant.size || null);
          }
        } else {
          const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
          setSelectedColor(defaultVariant.color);
          setSelectedSize(defaultVariant.size || null);
        }
      }

      // Update Document Title & SEO meta dynamically
      if (typeof document !== 'undefined') {
        const title = product.seoTitle || `${product.name} | YOX Apparel`;
        document.title = title;

        const metaDesc = document.querySelector('meta[name="description"]');
        const description = product.seoDescription || product.shortDescription || product.description || `Shop ${product.name} online at YOX.`;
        if (metaDesc) {
          metaDesc.setAttribute('content', description);
        } else {
          const meta = document.createElement('meta');
          meta.name = 'description';
          meta.content = description;
          document.head.appendChild(meta);
        }
      }
    }
  }, [product, colorFromUrl]);

  if (isLoading) {
    return (
      <main className="w-full bg-white min-h-screen pb-20 relative animate-in fade-in duration-300">
        <div className="flex flex-col lg:flex-row w-full items-start">
          {/* Left Column: 65% Image Grid Skeleton */}
          <div className="w-full lg:w-[65%] flex-shrink-0">
            <div className="grid grid-cols-2 gap-1 lg:gap-2">
              <Skeleton className="w-full aspect-[3/4] rounded-none bg-gray-100" />
              <Skeleton className="w-full aspect-[3/4] rounded-none bg-gray-100" />
              <Skeleton className="w-full aspect-[3/4] rounded-none bg-gray-100" />
              <Skeleton className="w-full aspect-[3/4] rounded-none bg-gray-100" />
            </div>
          </div>

          {/* Right Column: 35% Details & Actions Skeleton */}
          <div className="w-full lg:w-[35%] lg:pl-10 lg:pr-14 pt-6 lg:pt-8 px-4 sm:px-6">
            {/* Tag Skeleton */}
            <Skeleton className="w-16 h-4 rounded-none mb-3 bg-gray-100" />

            {/* Title Skeleton */}
            <Skeleton className="w-4/5 h-8 sm:h-9 rounded-none mb-3 bg-gray-100" />

            {/* Price Skeleton */}
            <div className="flex items-baseline gap-2 mb-4">
              <Skeleton className="w-40 h-7 rounded-none bg-gray-100" />
              <Skeleton className="w-20 h-5 rounded-none bg-gray-100" />
            </div>

            {/* Shipping Info Skeleton */}
            <Skeleton className="w-3/4 h-4 rounded-none mb-5 bg-gray-100" />
            <div className="border-b border-gray-100 pb-2 mb-5" />

            {/* Color Selector Skeleton */}
            <div className="mb-5">
              <Skeleton className="w-24 h-4 mb-2.5 rounded-none bg-gray-100" />
              <div className="flex gap-2.5">
                <Skeleton className="w-14 aspect-[3/4] rounded-none bg-gray-100" />
                <Skeleton className="w-14 aspect-[3/4] rounded-none bg-gray-100" />
                <Skeleton className="w-14 aspect-[3/4] rounded-none bg-gray-100" />
              </div>
            </div>

            {/* Size Selector Skeleton */}
            <div className="mb-5">
              <Skeleton className="w-20 h-4 mb-2.5 rounded-none bg-gray-100" />
              <div className="flex gap-2">
                <Skeleton className="w-12 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-12 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-12 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-12 h-9 rounded-none bg-gray-100" />
              </div>
            </div>

            {/* Quantity Selector Skeleton */}
            <div className="mb-6">
              <Skeleton className="w-16 h-4 mb-2.5 rounded-none bg-gray-100" />
              <Skeleton className="w-[114px] h-[36px] rounded-none bg-gray-100" />
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3">
                <Skeleton className="flex-1 h-[48px] rounded-none bg-gray-100" />
                <Skeleton className="flex-1 h-[48px] rounded-none bg-gray-100" />
                <Skeleton className="w-12 h-[48px] rounded-none bg-gray-100 shrink-0" />
              </div>
            </div>

            {/* Offer Card Skeleton */}
            <Skeleton className="w-full h-24 rounded-none mb-6 bg-gray-100" />

            {/* Feature Highlights Skeleton */}
            <div className="grid grid-cols-3 gap-2 py-6 border-t border-b border-gray-100 my-6">
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-16 h-3 rounded-none bg-gray-100" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-16 h-3 rounded-none bg-gray-100" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="w-9 h-9 rounded-none bg-gray-100" />
                <Skeleton className="w-16 h-3 rounded-none bg-gray-100" />
              </div>
            </div>

            {/* Accordion Skeletons */}
            <div className="mb-6 flex flex-col divide-y divide-gray-100">
              <div className="py-3.5 flex justify-between items-center">
                <Skeleton className="w-32 h-4 rounded-none bg-gray-100" />
                <Skeleton className="w-4 h-4 rounded-none bg-gray-100" />
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <Skeleton className="w-28 h-4 rounded-none bg-gray-100" />
                <Skeleton className="w-4 h-4 rounded-none bg-gray-100" />
              </div>
              <div className="py-3.5 flex justify-between items-center">
                <Skeleton className="w-40 h-4 rounded-none bg-gray-100" />
                <Skeleton className="w-4 h-4 rounded-none bg-gray-100" />
              </div>
            </div>

            {/* Description Skeleton */}
            <div className="space-y-2 pb-6">
              <Skeleton className="w-full h-3 rounded-none bg-gray-100" />
              <Skeleton className="w-5/6 h-3 rounded-none bg-gray-100" />
              <Skeleton className="w-2/3 h-3 rounded-none bg-gray-100" />
            </div>
          </div>
        </div>

        {/* Bottom Reviews Skeleton */}
        <div className="w-full max-w-7xl mx-auto px-4 mt-12 sm:mt-16">
          <Skeleton className="w-44 h-7 mb-6 rounded-none bg-gray-100" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="w-full h-36 rounded-none bg-gray-100" />
            <Skeleton className="w-full h-36 rounded-none bg-gray-100" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6 text-sm">We couldn't find the product you're looking for.</p>
        <Link href="/shop" className="bg-[#1A2E4C] text-white text-sm px-6 py-2.5 rounded-none font-bold hover:bg-[#132238] transition-colors">
          Back to Shop
        </Link>
      </div>
    );
  }

  // Resolve product specifications (category-aware features and care specs)
  const currentCategory = (apiCategories || []).find(
    (c) => c.id === product.categoryId || c.slug?.toLowerCase() === product.categoryId?.toLowerCase()
  );
  const currentSubCategory = (apiCategories || []).find(
    (c) => c.id === product.subCategoryId || c.slug?.toLowerCase() === product.subCategoryId?.toLowerCase()
  );
  const productSpecs = getProductSpecifications(
    product,
    currentCategory?.name || currentCategory?.slug,
    currentSubCategory?.name || currentSubCategory?.slug
  );

  // Derive unique colors safely
  const variants = product.variants && Array.isArray(product.variants) ? product.variants : [];
  const uniqueColors = Array.from(
    new Set(variants.map(v => v.color).filter((c): c is string => Boolean(c && c.trim())))
  );
  
  // Get active variant (prioritizing default or in-stock variants if multiple matches exist)
  const activeVariant = 
    variants.find(v => v.color === selectedColor && v.size === selectedSize && v.isDefault)
    || variants.find(v => v.color === selectedColor && v.size === selectedSize && (v.stock || 0) > 0)
    || variants.find(v => v.color === selectedColor && v.size === selectedSize) 
    || variants.find(v => v.color === selectedColor && (v.stock || 0) > 0)
    || variants.find(v => v.color === selectedColor) 
    || variants[0] || null;

  // Available sizes for selected color (deduplicated to avoid duplicate React keys)
  const availableSizesForColor = Array.from(
    new Set(
      variants
        .filter(v => v.color === selectedColor)
        .map(v => v.size)
        .filter((s): s is string => Boolean(s && s.trim()))
    )
  );

  const images = activeVariant?.images && activeVariant.images.length > 0
    ? activeVariant.images
    : product.thumbnail 
      ? [product.thumbnail] 
      : ['/images/product-1.jpeg'];

  const currentPrice = activeVariant?.price || 0;
  const originalPrice = activeVariant?.comparePrice || null;

  // Auto-applied best offer calculation
  const bestOffer = bestOfferData?.bestOffer || null;
  let finalPrice = currentPrice;
  let baseStrikePrice: number | null = originalPrice && originalPrice > currentPrice ? originalPrice : null;
  let offerSavings = 0;
  let finalDiscountPct = baseStrikePrice && baseStrikePrice > currentPrice 
    ? Math.round(((baseStrikePrice - currentPrice) / baseStrikePrice) * 100) 
    : 0;

  if (bestOffer && currentPrice > 0) {
    if (bestOffer.discountType === 'PERCENTAGE') {
      offerSavings = Math.round((currentPrice * bestOffer.discountValue) / 100);
      if (bestOffer.maxDiscountAmount && offerSavings > bestOffer.maxDiscountAmount) {
        offerSavings = bestOffer.maxDiscountAmount;
      }
    } else {
      offerSavings = Math.min(currentPrice, bestOffer.discountValue);
    }
    finalPrice = Math.max(0, currentPrice - offerSavings);
    
    // When product has compare amount, cross that amount!
    // If not compare amount, then only cross the price amount!
    if (originalPrice && originalPrice > finalPrice) {
      baseStrikePrice = originalPrice;
    } else {
      baseStrikePrice = currentPrice;
    }

    finalDiscountPct = baseStrikePrice > finalPrice
      ? Math.round(((baseStrikePrice - finalPrice) / baseStrikePrice) * 100)
      : Math.round((offerSavings / currentPrice) * 100);
  }
  // Stock status logic
  const variantStock = activeVariant?.stock !== undefined ? activeVariant.stock : 10;
  const isOutOfStock = variantStock <= 0;
  const isLowStock = variantStock > 0 && variantStock <= 5;
  const isAllOutOfStock = variants.length > 0 && variants.every((v: any) => (v.stock === undefined ? 0 : v.stock) <= 0);

  const handleToggleWishlist = () => {
    if (!product) return;
    const currentColor = selectedColor || activeVariant?.color || product.variants?.[0]?.color || null;
    toggleFavourite({
      id: `${product.id}__${currentColor || 'default'}`,
      productId: product.id,
      color: currentColor,
      name: product.name,
      category: typeof product.categoryId === 'string' ? product.categoryId : 'Apparel',
      image: images[0] || product.thumbnail || '/images/product-1.jpeg',
      price: currentPrice,
      comparePrice: originalPrice || undefined,
      inStock: !isOutOfStock,
    });

  };

  const handleQuantity = (type: 'inc' | 'dec') => {
    if (isOutOfStock) return;
    if (type === 'inc') {
      if (quantity < variantStock) {
        setQuantity(q => q + 1);
      } else {
        toast.warning(`Maximum available stock is ${variantStock}`);
      }
    } else {
      if (quantity > 1) setQuantity(q => q - 1);
    }
  };

  const handleAddToBasket = () => {
    if (isOutOfStock || !activeVariant) {
      toast.error("This product variant is currently out of stock!");
      return;
    }

    const existingItem = cartItems.find(
      (i) => i.variantId === activeVariant.id || i.id === activeVariant.id
    );
    if (existingItem && existingItem.quantity >= variantStock) {
      toast.warning(`Maximum available stock reached for this item (${variantStock})`);
      return;
    }

    addItem({
      id: activeVariant.id,
      variantId: activeVariant.id,
      productId: product.id,
      name: product.name,
      image: images[0] || product.thumbnail,
      color: activeVariant.color || 'Default',
      size: activeVariant.size || 'Standard',
      price: finalPrice,
      comparePrice: baseStrikePrice && baseStrikePrice > finalPrice ? baseStrikePrice : undefined,
      quantity: quantity,
      stock: variantStock,
    });

    toast.success(`Added ${product.name} (${activeVariant.size || 'Standard'}, ${activeVariant.color || 'Default'}) to your cart!`);
  };

  const handleBuyNow = () => {
    if (config.maintenanceMode) {
      toast.error(config.maintenanceNotice || 'Store maintenance is currently active. Checkout is temporarily paused.');
      return;
    }

    if (isOutOfStock || !activeVariant) {
      toast.error("This product variant is currently out of stock!");
      return;
    }

    // Set ONLY this specific product variant for direct checkout
    setDirectBuyItem({
      id: activeVariant.id,
      variantId: activeVariant.id,
      productId: product.id,
      name: product.name,
      image: images[0] || product.thumbnail,
      color: activeVariant.color || 'Default',
      size: activeVariant.size || 'Standard',
      price: finalPrice,
      comparePrice: baseStrikePrice && baseStrikePrice > finalPrice ? baseStrikePrice : undefined,
      quantity: quantity,
      stock: variantStock,
    });

    if (!isAuthenticated) {
      toast.info("Please log in to complete your purchase");
      router.push('/login?callbackUrl=' + encodeURIComponent('/checkout?buyNow=1'));
      return;
    }

    router.push('/checkout?buyNow=1');
  };

  const renderOffers = () => {
    if (isOutOfStock || !bestOffer || offerSavings <= 0) return null;

    return (
      <div className="border border-gray-200 bg-[#FAFAFA] rounded-none p-4 my-5 transition-all">
        {/* Header row: Minimal tag & discount badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Tag size={13} className="text-gray-900 shrink-0" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-900">
              Special Offer Applied
            </span>
          </div>
          <span className="text-[10px] font-bold text-[#D84141] bg-[#FDF0F0] border border-[#f0caca] px-2 py-0.5 rounded-none uppercase tracking-wider">
            {finalDiscountPct}% OFF
          </span>
        </div>

        {/* Details row: Title + Saving + Deal Price */}
        <div className="flex items-baseline justify-between gap-3 pt-1 pb-2">
          <div>
            <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 leading-snug">
              {bestOffer.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              You save <strong className="font-bold text-gray-900">₹{offerSavings.toLocaleString('en-IN')}</strong> instantly on this piece.
            </p>
            {bestOffer.isLimitedTime && (
              <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-1.5">
                <Clock size={12} className="text-gray-500" />
                <span>Limited-time promotional deal</span>
              </p>
            )}
          </div>

          <div className="shrink-0 text-right pl-3 border-l border-gray-200">
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">
              Deal Price
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-900">
              ₹{finalPrice.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Footer info note */}
        <div className="mt-2.5 pt-2.5 border-t border-gray-200/70 flex items-center gap-1.5 text-[11px] text-gray-500">
          <Check size={12} className="text-gray-700 shrink-0" />
          <span>Discount is automatically applied at checkout</span>
        </div>
      </div>
    );
  };

  return (
    <main className="w-full bg-white min-h-screen pb-20 relative">
      <div className="flex flex-col lg:flex-row w-full items-start">
        
        {/* Left Column: 65% Image Grid */}
        <div className="w-full lg:w-[65%] flex-shrink-0">
          <div className="grid grid-cols-2 gap-1 lg:gap-2">
            {images.map((img, idx) => {
              // On mobile (< lg): only show first 4 images unless expanded
              const isHiddenOnMobile = !isMobileImagesExpanded && idx >= 4;
              const isFourthImageOnMobile = !isMobileImagesExpanded && idx === 3 && images.length > 4;

              return (
                <div 
                  key={idx} 
                  onClick={() => setPreviewImageIndex(idx)}
                  className={`w-full aspect-[3/4] bg-[#f7f7f7] relative group cursor-pointer overflow-hidden ${
                    isHiddenOnMobile ? 'hidden lg:block' : 'block'
                  }`}
                >
                  {/* Sold Out badge on primary image */}
                  {idx === 0 && isOutOfStock && (
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-black/90 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-none shadow-md backdrop-blur-xs">
                        SOLD OUT
                      </span>
                    </div>
                  )}

                  <img 
                    src={img} 
                    alt={`${product.name} View ${idx + 1}`}
                    className="w-full h-full object-cover object-top mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Subtle click to preview overlay hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-black/75 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-none flex items-center gap-1 backdrop-blur-xs">
                      <Maximize2 size={12} /> Preview
                    </span>
                  </div>

                  {/* On Mobile: Overlay badge on 4th image if more images exist */}
                  {isFourthImageOnMobile && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsMobileImagesExpanded(true);
                      }}
                      className="lg:hidden absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white cursor-pointer transition-colors hover:bg-black/60"
                    >
                      <span className="text-xl font-bold tracking-tight">+{images.length - 4}</span>
                      <span className="text-[11px] uppercase tracking-wider font-semibold">More Photos</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: 35% Details & Actions */}
        <div className="w-full lg:w-[35%] lg:sticky lg:top-24 lg:pl-10 lg:pr-14 pt-6 lg:pt-8 px-4 sm:px-6">
            
            {/* Tag Badge / Sold Out Badge & Top Share Button */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                {isOutOfStock ? (
                  <span className="inline-block text-[10px] font-black uppercase tracking-widest text-white bg-zinc-900 px-2.5 py-1 rounded-none">
                    SOLD OUT
                  </span>
                ) : product.tag ? (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-black bg-gray-100 px-2 py-0.5 rounded-none">
                    {product.tag}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={handleShare}
                className="text-gray-500 hover:text-black transition-colors p-1 flex items-center gap-1.5 cursor-pointer"
                title="Share product"
                aria-label="Share product"
              >
                {isCopiedShare ? (
                  <span className="text-emerald-600 text-[11px] font-semibold flex items-center gap-1">
                    <Check size={14} strokeWidth={2.5} /> Copied
                  </span>
                ) : (
                  <span className="text-gray-600 hover:text-black text-[11px] font-medium flex items-center gap-1">
                    <Share2 size={14} strokeWidth={1.75} /> Share
                  </span>
                )}
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2.5 tracking-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className={`text-xl sm:text-2xl font-bold ${isOutOfStock ? 'text-gray-500' : 'text-gray-900'}`}>
                Rs. {finalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
              </span>
              {!isOutOfStock && baseStrikePrice && baseStrikePrice > finalPrice && (
                <>
                  <span className="text-[13px] sm:text-sm text-[#D84141] line-through font-medium">
                    Rs. {baseStrikePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                  </span>
                  <span className="text-[10px] text-[#D84141] bg-[#FDF0F0] border border-[#f0caca] px-1.5 py-0.5 rounded-none font-bold uppercase">
                    {finalDiscountPct}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock status indicator */}
            {isOutOfStock ? (
              <div className="mb-4 p-3 bg-neutral-50 border border-neutral-200 rounded-none flex items-center gap-2.5 text-xs text-neutral-700">
                <span className="w-2 h-2 rounded-none bg-neutral-400 shrink-0" />
                <span>
                  {isAllOutOfStock
                    ? 'This product is currently sold out in all sizes and colors.'
                    : `The selected size (${selectedSize || 'this variant'}) is currently sold out.`}
                </span>
              </div>
            ) : isLowStock ? (
              <div className="mb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-none animate-pulse">
                  <Flame size={14} className="text-amber-600 shrink-0" />
                  <span>Hurry, only {variantStock} left in stock!</span>
                </div>
              </div>
            ) : null}
            
            <div className="text-[11px] text-gray-600 mb-5 border-b border-gray-200 pb-4">
              <span className="underline cursor-pointer hover:text-black decoration-gray-400">Shipping</span> calculated at checkout. Free shipping on orders over {config.currencySymbol}{config.freeShippingThreshold}.
            </div>

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <div className="text-[12px] font-bold text-gray-800 mb-2.5">
                  Color: <span className="font-extrabold text-gray-900">{selectedColor || 'Select'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColor === color;
                    const colorVariant = variants.find(
                      (v) => v.color === color && v.images && v.images.length > 0
                    ) || variants.find((v) => v.color === color);
                    const colorImg = (colorVariant?.images && colorVariant.images.length > 0)
                      ? colorVariant.images[0]
                      : product.thumbnail || '/images/product-1.jpeg';

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          const availableSizes = product.variants.filter(v => v.color === color).map(v => v.size);
                          if (selectedSize && !availableSizes.includes(selectedSize)) {
                            setSelectedSize(availableSizes[0] || null);
                          }
                        }}
                        title={color}
                        aria-label={`Select color ${color}`}
                        className={`w-14 aspect-[3/4] relative rounded-none overflow-hidden transition-all cursor-pointer bg-[#f7f7f7] ${
                          isSelected 
                            ? 'border border-black shadow-xs' 
                            : 'border border-gray-200 hover:border-gray-500 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img 
                          src={colorImg} 
                          alt={color} 
                          className="w-full h-full object-cover object-top mix-blend-multiply"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {availableSizesForColor.length > 0 && (
              <div className="mb-5">
                <div className="text-[12px] font-bold text-gray-800 mb-2.5">
                  Size: <span className="font-extrabold text-gray-900">{selectedSize || 'Select'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSizesForColor.map((size) => {
                    const isSelected = selectedSize === size;
                    const sizeVariant = variants.find(v => v.color === selectedColor && v.size === size);
                    const isSizeSoldOut = sizeVariant ? (sizeVariant.stock === undefined ? 0 : sizeVariant.stock) <= 0 : false;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-[34px] px-3 flex items-center justify-center text-[11px] font-bold tracking-wider transition-all border rounded-none cursor-pointer ${
                          isSelected 
                            ? 'bg-black text-white border-black shadow-xs' 
                            : isSizeSoldOut
                            ? 'bg-gray-50 text-gray-400 border-gray-200 line-through hover:border-gray-400'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                        title={isSizeSoldOut ? `${size} (Sold Out)` : size}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <div className="text-[12px] font-bold text-gray-800 mb-2.5">Quantity</div>
              <div className="flex items-center border border-gray-300 rounded-none overflow-hidden w-[114px] h-[36px] bg-white">
                <button 
                  type="button"
                  onClick={() => handleQuantity('dec')} 
                  disabled={isOutOfStock || quantity <= 1}
                  className="flex-1 flex items-center justify-center text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed h-full transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} strokeWidth={2}/>
                </button>
                <span className="flex-1 flex items-center justify-center text-xs font-bold text-gray-900 h-full select-none">
                  {isOutOfStock ? 0 : quantity}
                </span>
                <button 
                  type="button"
                  onClick={() => handleQuantity('inc')} 
                  disabled={isOutOfStock || quantity >= variantStock}
                  className="flex-1 flex items-center justify-center text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed h-full transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus size={13} strokeWidth={2}/>
                </button>
              </div>
            </div>

            {/* Action Buttons (Mobile & Desktop Responsive Layout) */}
            <div className="flex flex-col gap-2.5 sm:gap-3 mb-8">
              {/* Row 1: Add to Bag + Wishlist + Share (Aligned on mobile & responsive) */}
              <div className="flex items-center gap-2 sm:hidden">
                <button 
                  type="button"
                  onClick={handleAddToBasket}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-black text-white text-[12px] font-bold hover:bg-gray-800 active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-none"
                >
                  {isOutOfStock ? 'Out Of Stock' : 'Add To Bag'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-none"
                  title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : "text-black"} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-none"
                  title="Share product"
                  aria-label="Share product"
                >
                  {isCopiedShare ? (
                    <Check size={18} className="text-emerald-600" />
                  ) : (
                    <Share2 size={18} className="text-black" />
                  )}
                </button>
              </div>

              {/* Mobile Buy Now (Full width) */}
              <button 
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="sm:hidden w-full flex items-center justify-center h-[48px] bg-[#E5DCC5] text-[12px] font-bold text-gray-900 hover:bg-[#d8cbb0] active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-none"
              >
                {isOutOfStock ? 'Sold Out' : config.maintenanceMode ? 'Paused (Maintenance)' : 'Buy It Now'}
              </button>

              {/* Desktop Action Buttons Row (>= sm screens) */}
              <div className="hidden sm:flex items-center gap-2.5">
                <button 
                  type="button"
                  onClick={handleAddToBasket}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-black text-white text-[12px] font-bold hover:bg-gray-800 active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-none"
                >
                  {isOutOfStock ? 'Out Of Stock' : 'Add To Bag'}
                </button>
                <button 
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-[#E5DCC5] text-[12px] font-bold text-gray-900 hover:bg-[#d8cbb0] active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-none"
                >
                  {isOutOfStock ? 'Sold Out' : config.maintenanceMode ? 'Paused (Maintenance)' : 'Buy It Now'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-none"
                  title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : "text-black"} />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-none"
                  title="Share product"
                  aria-label="Share product"
                >
                  {isCopiedShare ? (
                    <Check size={18} className="text-emerald-600" />
                  ) : (
                    <Share2 size={18} className="text-black" />
                  )}
                </button>
              </div>
            </div>

            {/* Offers card */}
            {renderOffers()}

            {/* Feature Highlights (Grounded, category-appropriate retail specifications) */}
            {productSpecs && (
              <div className="grid grid-cols-3 gap-2 py-6 border-t border-b border-gray-100 my-6">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                    <productSpecs.care.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                    {productSpecs.care.title}<br/>{productSpecs.care.subtitle}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                    <productSpecs.fit.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                    {productSpecs.fit.title}<br/>{productSpecs.fit.subtitle}
                  </span>
                </div>
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-9 h-9 rounded-none bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                    <productSpecs.material.icon size={16} strokeWidth={1.5} />
                  </div>
                  <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                    {productSpecs.material.title}<br/>{productSpecs.material.subtitle}
                  </span>
                </div>
              </div>
            )}

            {/* Accordions */}
            {productSpecs && (
              <div className="mb-6 flex flex-col divide-y divide-gray-100">
                {[
                  { id: 'CARE', title: productSpecs.accordionCareTitle, content: productSpecs.accordionCareText },
                  { id: 'FIT', title: productSpecs.accordionFitTitle, content: productSpecs.accordionFitText },
                  { 
                    id: 'SHIPPING', 
                    title: 'SHIPPING & RETURNS', 
                    content: `Free shipping on orders above ${config.currencySymbol}${config.freeShippingThreshold}. ${config.returnWindowDays}-day hassle-free return policy.` 
                  }
                ].map(tab => (
                  <div key={tab.id} className="py-3.5">
                    <button 
                      type="button"
                      onClick={() => setOpenAccordion(openAccordion === tab.id ? null : tab.id)} 
                      className="w-full flex items-center justify-between text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-wider cursor-pointer"
                    >
                      {tab.title}
                      <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${openAccordion === tab.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openAccordion === tab.id && (
                      <div className="mt-3 text-[12px] text-gray-600 leading-relaxed pr-4">
                        {tab.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="text-[11px] sm:text-[12px] text-gray-600 leading-relaxed pb-6">
              {product.description || "A classic piece designed for everyday comfort and effortless style. Experience the perfect blend of modern aesthetics and timeless design with YOX."}
            </div>

          </div>
        </div>
      
      {/* Product Suggestions: Similar Styles + More from Brand */}
      <ProductSuggestions
        currentProductId={product.id}
        categoryId={product.categoryId}
        brandId={product.brandId}
      />

      {/* Customer Reviews Section */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 sm:mt-12 mb-16 sm:mb-20">
        <ProductReviews productId={product.id} />
      </div>

      {/* Image Preview Lightbox Modal */}
      <ProductImagePreviewModal
        isOpen={previewImageIndex !== null}
        images={images}
        initialIndex={previewImageIndex ?? 0}
        productName={product.name}
        onClose={() => setPreviewImageIndex(null)}
      />
    </main>
  );
}
