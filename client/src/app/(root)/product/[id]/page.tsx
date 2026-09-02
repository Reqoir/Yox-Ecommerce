"use client";

import React, { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, Tag, Loader2, Minus, Plus, ShoppingBag, Droplets, Ruler, Scissors, ChevronDown } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';
import { ProductReviews } from '@/components/features/product/product-reviews';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', resolvedParams.id],
    queryFn: () => productsApi.getProductById(resolvedParams.id),
    retry: 1
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  const handleQuantity = (type: 'inc' | 'dec') => {
    if (type === 'inc') {
      const stock = product?.variants?.[0]?.stock || 10;
      if (quantity < stock) setQuantity(q => q + 1);
    } else {
      if (quantity > 1) setQuantity(q => q - 1);
    }
  };

  // Initialize selected variants and SEO metadata when data loads
  useEffect(() => {
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
        setSelectedColor(defaultVariant.color);
        setSelectedSize(defaultVariant.size);
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
  }, [product]);

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
    : [product.thumbnail, product.thumbnail, product.thumbnail, product.thumbnail];

  const currentPrice = activeVariant?.price || 0;
  const originalPrice = activeVariant?.comparePrice || null;
  const discountPercentage = originalPrice 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : 0;

  const handleAddToBasket = () => {
    if (!activeVariant || !activeVariant.stock || activeVariant.stock <= 0) {
      toast.error("This product variant is out of stock!");
      return;
    }

    const existingItem = cartItems.find(
      (i) => i.variantId === activeVariant.id || i.id === activeVariant.id
    );
    if (existingItem && existingItem.quantity >= activeVariant.stock) {
      toast.error(`You have already added the maximum available stock (${activeVariant.stock}) to your basket.`);
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
      stock: activeVariant.stock,
    });

    toast.success(`Added ${product.name} (${activeVariant.size || 'Standard'}, ${activeVariant.color || 'Default'}) to your cart!`);
  };

  const renderOffers = (className: string) => (
    <div className={`bg-[#EAF5F0] rounded-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
          <Tag size={16} className="text-[#B58546]" />
          Offers & Discounts
        </div>
        <button className="text-xs text-[#B58546] font-semibold hover:underline">
          View all
        </button>
      </div>
      
      <div className="flex overflow-x-auto gap-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex-shrink-0 border border-emerald-100 bg-white rounded flex shadow-sm min-w-[240px]">
          <div className="bg-emerald-500 text-white flex flex-col justify-center px-3 py-2 text-center rounded-l">
            <span className="text-[10px] font-bold uppercase tracking-wider">Best Price</span>
            <span className="font-bold text-sm">₹{Math.floor(currentPrice * 0.8)}</span>
          </div>
          <div className="px-3 py-2 flex flex-col justify-center">
            <span className="text-xs font-bold text-gray-900">MAX400</span>
            <span className="text-[10px] text-gray-500">Extra Rs.400 off on orders ab...</span>
          </div>
        </div>

        <div className="flex-shrink-0 border border-emerald-100 bg-white rounded flex shadow-sm min-w-[180px]">
          <div className="px-3 py-2 flex flex-col justify-center w-full">
            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-0.5">Get it for</span>
            <span className="font-bold text-gray-900 text-sm">₹{Math.floor(currentPrice * 0.9)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="w-full bg-white min-h-screen pb-20 relative">
      <div className="flex flex-col lg:flex-row w-full items-start">
        
        {/* Left Column: 65% Image Grid touching left edge */}
        <div className="w-full lg:w-[65%] flex-shrink-0">
          <div className="grid grid-cols-2 gap-1 lg:gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="w-full aspect-[3/4] bg-[#f2f2f2]">
                <img 
                  src={img} 
                  alt={`${product.name} View ${idx + 1}`}
                  className="w-full h-full object-cover object-top mix-blend-multiply"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: 35% Details & Actions */}
        <div className="w-full lg:w-[35%] lg:sticky lg:top-24 lg:pl-12 lg:pr-16 pt-8 lg:pt-10 px-4">
            
            <h1 className="text-3xl font-medium text-gray-900 mb-3 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-end gap-2 mb-2">
              <span className="text-xl font-bold text-gray-900">Rs. {currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})} INR</span>
              {originalPrice && (
                <>
                  <span className="text-[13px] text-[#D84141] line-through font-medium mb-[2px] ml-1">Rs. {originalPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})} INR</span>
                  <span className="text-[9px] text-[#D84141] border border-[#f0caca] px-1.5 py-0.5 rounded-sm font-semibold mb-[4px] ml-1 uppercase">Sale</span>
                </>
              )}
            </div>
            
            <div className="text-[11px] text-gray-600 mb-6 border-b border-gray-200 pb-5">
              <span className="underline cursor-pointer hover:text-black decoration-gray-400">Shipping</span> calculated at checkout.
            </div>

            {/* Color Selector */}
            {uniqueColors.length > 0 && (
              <div className="mb-6">
                <div className="text-[12px] font-bold text-gray-800 mb-3">
                  Color: <span className="font-extrabold text-gray-900">{selectedColor}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueColors.map((color) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          setSelectedColor(color);
                          const availableSizes = product.variants.filter(v => v.color === color).map(v => v.size);
                          if (selectedSize && !availableSizes.includes(selectedSize)) {
                            setSelectedSize(availableSizes[0] || null);
                          }
                        }}
                        className={`min-w-[48px] px-3 h-[30px] flex items-center justify-center text-[11px] font-bold tracking-wider transition-all border border-black ${
                          isSelected 
                            ? 'bg-black text-white' 
                            : 'bg-transparent text-black hover:bg-gray-100'
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
            <div className="mb-6">
              <div className="text-[12px] font-bold text-gray-800 mb-3">
                Size: <span className="font-extrabold text-gray-900">{selectedSize}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizesForColor.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[48px] h-[30px] flex items-center justify-center text-[11px] font-bold tracking-wider transition-all border border-black ${
                        isSelected 
                          ? 'bg-black text-white' 
                          : 'bg-transparent text-black hover:bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-8">
              <div className="text-[12px] font-bold text-gray-800 mb-3">Quantity</div>
              <div className="flex items-center border border-black rounded-full overflow-hidden w-[110px] h-[34px]">
                <button onClick={() => handleQuantity('dec')} className="flex-1 flex items-center justify-center text-black hover:bg-gray-100 h-full transition-colors"><Minus size={14} strokeWidth={1.5}/></button>
                <span className="flex-1 flex items-center justify-center text-[13px] font-semibold text-black border-l border-r border-gray-200 h-full leading-none">{quantity}</span>
                <button onClick={() => handleQuantity('inc')} className="flex-1 flex items-center justify-center text-black hover:bg-gray-100 h-full transition-colors"><Plus size={14} strokeWidth={1.5}/></button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button 
                onClick={handleAddToBasket}
                disabled={!activeVariant?.stock || activeVariant.stock <= 0}
                className="flex-1 flex items-center justify-center h-[48px] rounded-none bg-black text-white text-[12px] font-bold hover:bg-gray-800 transition-colors tracking-widest uppercase disabled:opacity-50"
              >
                {activeVariant?.stock && activeVariant.stock > 0 ? 'Add To Bag' : 'Out Of Stock'}
              </button>
              <button className="flex-1 flex items-center justify-center h-[48px] rounded-none bg-[#E5DCC5] text-[12px] font-bold text-gray-900 hover:bg-[#d6ccb2] transition-colors tracking-widest uppercase">
                Buy It Now
              </button>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-3 gap-2 mb-8 border-b border-gray-100 pb-10">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700">
                  <Droplets size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[12px] font-bold text-gray-800 leading-tight">Dry clean or cold<br/>hand wash</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700">
                  <Ruler size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[12px] font-bold text-gray-800 leading-tight">Model is 5'9" wearing<br/>size S</span>
              </div>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700">
                  <Scissors size={18} strokeWidth={1.5} />
                </div>
                <span className="text-[12px] font-bold text-gray-800 leading-tight">70% Wool, 30%<br/>Cashmere</span>
              </div>
            </div>

            {/* Accordions */}
            <div className="mb-8 flex flex-col divide-y divide-gray-100">
              {['FABRIC & CARE', 'FIT & SIZING', 'SHIPPING & RETURNS'].map(tab => (
                <div key={tab} className="py-4">
                  <button onClick={() => setOpenAccordion(openAccordion === tab ? null : tab)} className="w-full flex items-center justify-between text-[13px] font-bold text-gray-900 tracking-wider">
                    {tab}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${openAccordion === tab ? 'rotate-180' : ''}`} />
                  </button>
                  {openAccordion === tab && (
                    <div className="mt-4 text-[12px] text-gray-600 leading-relaxed pr-4">
                      {tab === 'FABRIC & CARE' ? 'Crafted from premium fabrics designed for durability and comfort. We recommend cold washing and laying flat to dry.'
                       : tab === 'FIT & SIZING' ? 'True to size. Order your regular size for a relaxed fit, or size down for a slimmer silhouette.'
                       : 'Free shipping on orders above ₹699. 14-day hassle-free return policy.'}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="text-[11px] text-gray-600 leading-relaxed pb-8">
              {product.description || "A classic piece designed for everyday comfort and effortless style. Experience the perfect blend of modern aesthetics and timeless design with YOX."}
            </div>

          </div>
        </div>
      
      {/* Reviews Section at the bottom */}
      <div className="w-full max-w-7xl mx-auto px-4 mt-16">
        <ProductReviews productId={product.id} />
      </div>
    </main>
  );
}
