"use client";

import React, { useState, use, useEffect } from 'react';
import { notFound, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useCartStore } from '@/store/useCartStore';
import { useFavouritesStore } from '@/store/useFavouritesStore';
import { toast } from 'sonner';
import { ProductReviews } from '@/components/features/product/product-reviews';
import { ProductImagePreviewModal } from '@/components/features/product/product-image-preview-modal';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const colorFromUrl = searchParams.get('color');
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', resolvedParams.id],
    queryFn: () => productsApi.getProductById(resolvedParams.id),
    retry: 1
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  
  // Image preview modal & mobile expansion states
  const [previewImageIndex, setPreviewImageIndex] = useState<number | null>(null);
  const [isMobileImagesExpanded, setIsMobileImagesExpanded] = useState<boolean>(false);

  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const { isFavourite, toggleFavourite } = useFavouritesStore();
  const isFav = product ? isFavourite(product.id, selectedColor) : false;

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
      <div className="w-full min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-[#1A2E4C]" size={40} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6 text-sm">We couldn't find the product you're looking for.</p>
        <Link href="/shop" className="bg-[#1A2E4C] text-white text-sm px-6 py-2.5 rounded font-bold hover:bg-[#132238] transition-colors">
          Back to Shop
        </Link>
      </div>
    );
  }

  // Derive unique colors
  const uniqueColors = Array.from(new Set(product.variants.map(v => v.color)));
  
  // Get active variant
  const activeVariant = product.variants.find(v => v.color === selectedColor && v.size === selectedSize) 
    || product.variants.find(v => v.color === selectedColor) 
    || product.variants[0];

  // Available sizes for selected color
  const availableSizesForColor = product.variants
    .filter(v => v.color === selectedColor)
    .map(v => v.size);

  const images = activeVariant?.images && activeVariant.images.length > 0
    ? activeVariant.images
    : product.thumbnail 
      ? [product.thumbnail] 
      : ['/images/product-1.jpeg'];

  const currentPrice = activeVariant?.price || 0;
  const originalPrice = activeVariant?.comparePrice || null;
  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : 0;

  // Stock status logic
  const variantStock = activeVariant?.stock !== undefined ? activeVariant.stock : 10;
  const isOutOfStock = variantStock <= 0;
  const isLowStock = variantStock > 0 && variantStock <= 5;

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
    if (isFav) {
      toast.info(`Removed ${product.name}${currentColor ? ` (${currentColor})` : ''} from wishlist`);
    } else {
      toast.success(`Added ${product.name}${currentColor ? ` (${currentColor})` : ''} to wishlist`);
    }
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
      toast.error(`You have already added the maximum available stock (${variantStock}) to your basket.`);
      return;
    }

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: `${product.name} - ${activeVariant.color}`,
      image: images[0] || product.thumbnail,
      color: activeVariant.color || 'Default',
      size: activeVariant.size || 'Standard',
      price: activeVariant.price,
      comparePrice: activeVariant.comparePrice || undefined,
      quantity: quantity,
      stock: variantStock,
    });

    toast.success(`Added ${product.name} (${activeVariant.size || 'Standard'}, ${activeVariant.color || 'Default'}) to your cart!`);
  };

  const handleBuyNow = () => {
    if (isOutOfStock || !activeVariant) {
      toast.error("This product variant is currently out of stock!");
      return;
    }

    handleAddToBasket();
    router.push('/checkout');
  };

  const renderOffers = () => (
    <div className="bg-[#F8FAF9] border border-[#E0ECE5] rounded-lg p-3.5 sm:p-4 my-6 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-xs sm:text-sm">
          <Tag size={15} className="text-[#B58546]" />
          Available Offers & Discounts
        </div>
        <span className="text-[11px] text-[#B58546] font-semibold">
          2 Offers Applied
        </span>
      </div>
      
      <div className="flex overflow-x-auto gap-2.5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex-shrink-0 border border-emerald-200 bg-white rounded-md flex overflow-hidden shadow-xs min-w-[210px] sm:min-w-[230px]">
          <div className="bg-emerald-600 text-white flex flex-col justify-center px-2.5 py-1.5 text-center">
            <span className="text-[9px] font-bold uppercase tracking-wider">Best Price</span>
            <span className="font-bold text-xs sm:text-sm">₹{Math.floor(currentPrice * 0.8)}</span>
          </div>
          <div className="px-2.5 py-1.5 flex flex-col justify-center">
            <span className="text-[11px] font-bold text-gray-900">YOXFIRST</span>
            <span className="text-[10px] text-gray-500">20% instant discount</span>
          </div>
        </div>

        <div className="flex-shrink-0 border border-emerald-200 bg-white rounded-md flex overflow-hidden shadow-xs min-w-[170px] sm:min-w-[190px]">
          <div className="px-3 py-1.5 flex flex-col justify-center w-full">
            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Prepaid Offer</span>
            <span className="font-bold text-gray-900 text-xs sm:text-sm">₹{Math.floor(currentPrice * 0.9)}</span>
            <span className="text-[9px] text-emerald-600 font-semibold">Extra 10% on UPI/Cards</span>
          </div>
        </div>
      </div>
    </div>
  );

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
                  <img 
                    src={img} 
                    alt={`${product.name} View ${idx + 1}`}
                    className="w-full h-full object-cover object-top mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Subtle click to preview overlay hint */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-black/75 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
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
            
            {/* Tag Badge if available */}
            {product.tag && (
              <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-black bg-gray-100 px-2 py-0.5 rounded-xs mb-2">
                {product.tag}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2.5 tracking-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="flex flex-wrap items-baseline gap-2 mb-2">
              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                Rs. {currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
              </span>
              {originalPrice && (
                <>
                  <span className="text-[13px] sm:text-sm text-[#D84141] line-through font-medium">
                    Rs. {originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                  </span>
                  <span className="text-[10px] text-[#D84141] bg-[#FDF0F0] border border-[#f0caca] px-1.5 py-0.5 rounded font-bold uppercase">
                    {discountPercentage}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Stock / Low Stock Alert (Only shown when out of stock or low stock) */}
            {(isOutOfStock || isLowStock) && (
              <div className="mb-4">
                {isOutOfStock ? (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>Currently Out of Stock</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded animate-pulse">
                    <Flame size={14} className="text-amber-600 shrink-0" />
                    <span>Hurry, only {variantStock} left in stock!</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="text-[11px] text-gray-600 mb-5 border-b border-gray-200 pb-4">
              <span className="underline cursor-pointer hover:text-black decoration-gray-400">Shipping</span> calculated at checkout. Free shipping on orders over Rs. 699.
            </div>

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <div className="text-[12px] font-bold text-gray-800 mb-2.5">
                  Color: <span className="font-extrabold text-gray-900">{selectedColor || 'Select'}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColor === color;
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
                        className={`min-w-[48px] px-3.5 h-[34px] flex items-center justify-center text-[11px] font-bold tracking-wider transition-all border rounded-xs cursor-pointer ${
                          isSelected 
                            ? 'bg-black text-white border-black shadow-xs' 
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                      >
                        {color}
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
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[48px] h-[34px] px-3 flex items-center justify-center text-[11px] font-bold tracking-wider transition-all border rounded-xs cursor-pointer ${
                          isSelected 
                            ? 'bg-black text-white border-black shadow-xs' 
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
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
              <div className="flex items-center border border-gray-300 rounded-full overflow-hidden w-[114px] h-[36px] bg-white">
                <button 
                  type="button"
                  onClick={() => handleQuantity('dec')} 
                  disabled={isOutOfStock || quantity <= 1}
                  className="flex-1 flex items-center justify-center text-black hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed h-full transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  <Minus size={13} strokeWidth={2}/>
                </button>
                <span className="flex-1 flex items-center justify-center text-[13px] font-bold text-black border-l border-r border-gray-200 h-full leading-none select-none">
                  {quantity}
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
              {/* Row 1: Add to Bag + Wishlist (Aligned on mobile & responsive) */}
              <div className="flex items-center gap-2.5 sm:hidden">
                <button 
                  type="button"
                  onClick={handleAddToBasket}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-black text-white text-[12px] font-bold hover:bg-gray-800 active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-xs"
                >
                  {isOutOfStock ? 'Out Of Stock' : 'Add To Bag'}
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-xs"
                  title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : "text-black"} />
                </button>
              </div>

              {/* Mobile Buy Now (Full width) */}
              <button 
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="sm:hidden w-full flex items-center justify-center h-[48px] bg-[#E5DCC5] text-[12px] font-bold text-gray-900 hover:bg-[#d8cbb0] active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-xs"
              >
                Buy It Now
              </button>

              {/* Desktop Action Buttons Row (>= sm screens) */}
              <div className="hidden sm:flex items-center gap-3">
                <button 
                  type="button"
                  onClick={handleAddToBasket}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-black text-white text-[12px] font-bold hover:bg-gray-800 active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-xs"
                >
                  {isOutOfStock ? 'Out Of Stock' : 'Add To Bag'}
                </button>
                <button 
                  type="button"
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 flex items-center justify-center h-[48px] bg-[#E5DCC5] text-[12px] font-bold text-gray-900 hover:bg-[#d8cbb0] active:scale-[0.99] transition-all tracking-widest uppercase disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs rounded-xs"
                >
                  Buy It Now
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="w-12 h-[48px] flex items-center justify-center border border-gray-300 hover:border-black hover:bg-gray-50 active:scale-[0.96] transition-all cursor-pointer shrink-0 rounded-xs"
                  title={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                  aria-label={isFav ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  <Heart size={20} className={isFav ? "fill-red-500 text-red-500" : "text-black"} />
                </button>
              </div>
            </div>

            {/* Offers card */}
            {renderOffers()}

            {/* Feature Highlights */}
            <div className="grid grid-cols-3 gap-2 py-6 border-t border-b border-gray-100 my-6">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                  <Droplets size={16} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  Dry clean or<br/>cold wash
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                  <Ruler size={16} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  Standard fit<br/>true to size
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700">
                  <Scissors size={16} strokeWidth={1.5} />
                </div>
                <span className="text-[11px] font-semibold text-gray-800 leading-tight">
                  Premium fabric<br/>breathable weave
                </span>
              </div>
            </div>

            {/* Accordions */}
            <div className="mb-6 flex flex-col divide-y divide-gray-100">
              {['FABRIC & CARE', 'FIT & SIZING', 'SHIPPING & RETURNS'].map(tab => (
                <div key={tab} className="py-3.5">
                  <button 
                    type="button"
                    onClick={() => setOpenAccordion(openAccordion === tab ? null : tab)} 
                    className="w-full flex items-center justify-between text-[12px] sm:text-[13px] font-bold text-gray-900 tracking-wider cursor-pointer"
                  >
                    {tab}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${openAccordion === tab ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordion === tab && (
                    <div className="mt-3 text-[12px] text-gray-600 leading-relaxed pr-4">
                      {tab === 'FABRIC & CARE' ? 'Crafted from premium fabrics designed for durability and comfort. We recommend cold washing and laying flat to dry.'
                       : tab === 'FIT & SIZING' ? 'True to size. Order your regular size for a relaxed fit, or size down for a slimmer silhouette.'
                       : 'Free shipping on orders above ₹699. 14-day hassle-free return policy.'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="text-[11px] sm:text-[12px] text-gray-600 leading-relaxed pb-6">
              {product.description || "A classic piece designed for everyday comfort and effortless style. Experience the perfect blend of modern aesthetics and timeless design with YOX."}
            </div>

          </div>
        </div>
      
      {/* Customer Reviews Section */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-12 sm:mt-16">
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
