"use client";

import React, { useState, use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Heart, Share2, Tag, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { useCartStore } from '@/store/useCartStore';
import { toast } from 'sonner';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', resolvedParams.id],
    queryFn: () => productsApi.getProductById(resolvedParams.id),
    retry: 1
  });

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);

  // Initialize selected variants when data loads
  useEffect(() => {
    if (product && product.variants && product.variants.length > 0) {
      const defaultVariant = product.variants.find(v => v.isDefault) || product.variants[0];
      setSelectedColor(defaultVariant.color);
      setSelectedSize(defaultVariant.size);
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
      quantity: 1,
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
    <main className="w-full bg-white min-h-screen pb-28 lg:pb-16">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 lg:py-6">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500 mb-4 lg:mb-6">
          <Link href="/shop" className="hover:text-gray-900">Shop</Link>
          <span>&gt;</span>
          <span className="text-gray-800">Product</span>
        </div>

        {/* Title (Desktop) */}
        <h1 className="hidden lg:block text-2xl font-medium text-gray-900 mb-6 tracking-wide">
          {product.name}
        </h1>

        {/* 2-Column Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start">
          
          {/* Left Column: Image Grid */}
          <div className="w-full lg:w-[60%] flex-shrink-0 relative">
            <div className="flex overflow-x-auto md:grid md:grid-cols-2 gap-3 relative snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Desktop Offer Tag */}
              {product.tag && (
                <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur px-3 py-1 text-[11px] font-bold text-gray-800 uppercase shadow-sm hidden md:block">
                  {product.tag}
                </div>
              )}
              
              {images.map((img, idx) => (
                <div key={idx} className="w-[100%] md:w-full flex-shrink-0 snap-center aspect-[3/4] bg-gray-50 relative">
                  
                  {/* Mobile Heart & Offer Tags - Only on first image for mobile swipe */}
                  {idx === 0 && (
                    <>
                      {/* Heart (Mobile & Desktop overlaid) */}
                      <button className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm text-gray-800 hover:text-red-500 transition-colors">
                        <Heart size={20} strokeWidth={2} />
                      </button>
                      
                      {/* Mobile Offer Tag */}
                      {product.tag && (
                        <div className="md:hidden absolute bottom-4 right-4 z-10 bg-white/90 backdrop-blur px-3 py-1 text-[11px] font-bold text-gray-800 uppercase shadow-sm">
                          {product.tag}
                        </div>
                      )}
                      
                      {/* Mobile Pagination Dots */}
                      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                        {images.map((_, dotIdx) => (
                          <div 
                            key={dotIdx} 
                            className={`w-1.5 h-1.5 rounded-full ${dotIdx === 0 ? 'bg-[#D2925D]' : 'bg-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </>
                  )}
                  
                  <img 
                    src={img} 
                    alt={`${product.name} View ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Details & Actions */}
          <div className="w-full lg:w-[40%] lg:sticky lg:top-20">
            
            {/* Mobile Title, Share & Shipping Block */}
            <div className="lg:hidden mb-6 flex items-start justify-between border-b border-gray-100 pb-5">
              <div className="flex-1 pr-4">
                <h1 className="text-lg font-medium text-gray-900 mb-2 leading-tight">
                  {product.name}
                </h1>
                <div className="text-[#D2925D] text-[11px] font-semibold underline underline-offset-4">
                  Free shipping on All orders above INR 699
                </div>
              </div>
              <button className="flex flex-col items-center justify-center pl-4 border-l border-gray-200 text-gray-600 gap-1 mt-1">
                <Share2 size={20} />
                <span className="text-[10px] font-medium text-[#D2925D]">Share</span>
              </button>
            </div>

            {/* Desktop Pricing Section */}
            <div className="hidden lg:block mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold text-gray-900">₹{currentPrice}</span>
                <span className="text-[11px] text-gray-400 font-medium ml-1 uppercase tracking-wider">Inclusive of all taxes</span>
              </div>
              
              {originalPrice && (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="text-gray-400">MRP <span className="line-through">₹{originalPrice}</span></span>
                  {discountPercentage > 0 && (
                    <span className="text-emerald-500">{discountPercentage}% OFF</span>
                  )}
                </div>
              )}
              
              <div className="mt-3 text-[#D2925D] text-xs font-semibold underline underline-offset-4 cursor-pointer hover:text-[#b37a4b] transition-colors">
                Free shipping on All orders above INR 699
              </div>
            </div>

            {/* Desktop Offers & Discounts */}
            {renderOffers("hidden lg:block mb-8")}

            {/* Colors */}
            <div className="mb-6 lg:mb-8">
              <div className="text-[13px] text-gray-800 font-medium mb-3">
                {uniqueColors.length} colors available
              </div>
              <div className="flex flex-wrap gap-3 mb-2">
                {uniqueColors.map((color) => {
                  const isSelected = selectedColor === color;
                  const colorVariant = product.variants.find(v => v.color === color);
                  const colorImg = colorVariant?.images?.[0] || product.thumbnail;
                  
                  return (
                    <button 
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        const sizesForNewColor = product.variants.filter(v => v.color === color).map(v => v.size);
                        if (!sizesForNewColor.includes(selectedSize!)) {
                          setSelectedSize(sizesForNewColor[0]);
                        }
                      }}
                      className={`relative w-14 h-16 border-[1.5px] p-0.5 transition-all ${isSelected ? 'border-gray-900' : 'border-transparent hover:border-gray-300'}`}
                    >
                      <img src={colorImg} alt={color} className="w-full h-full object-cover object-top" />
                    </button>
                  );
                })}
              </div>
              <div className="text-[13px] text-gray-500">
                Color: <span className="text-gray-900 font-bold">{selectedColor}</span>
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-8 border-t border-gray-100 pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-medium text-gray-900">Size:</span>
                <button className="text-[13px] font-semibold text-gray-900 underline hover:text-gray-600 transition-colors">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {availableSizesForColor.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 flex items-center justify-center text-[13px] font-bold border transition-colors ${
                        isSelected 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-300 bg-white text-gray-800 hover:border-gray-900'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile Offers & Discounts */}
            {renderOffers("lg:hidden mb-8")}

            {/* Desktop Actions */}
            <div className="hidden lg:flex flex-col gap-4 mt-8 border-t border-gray-100 pt-6">
              <button 
                onClick={handleAddToBasket}
                disabled={!activeVariant?.stock || activeVariant.stock <= 0}
                className="w-full bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold tracking-wide py-4 transition-colors shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeVariant?.stock && activeVariant.stock > 0 ? 'ADD TO BASKET' : 'OUT OF STOCK'}
              </button>
              
              <div className="flex items-center border border-gray-200">
                <button className="flex-1 flex items-center justify-center gap-2 py-3.5 border-r border-gray-200 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors">
                  <Heart size={16} />
                  Add to Favourites
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold text-gray-800 hover:bg-gray-50 transition-colors">
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 p-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
          <div className="flex flex-col flex-1">
            {originalPrice && (
              <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                MRP <span className="line-through">₹{originalPrice}</span> 
                {discountPercentage > 0 && <span className="text-emerald-500 font-bold ml-1">{discountPercentage}% OFF</span>}
              </div>
            )}
            <div className="flex items-end gap-1">
              <span className="text-xl font-bold text-gray-900 leading-none">₹{currentPrice}</span>
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">Inclusive of all taxes</div>
          </div>
          
          <button 
            onClick={handleAddToBasket}
            disabled={!activeVariant?.stock || activeVariant.stock <= 0}
            className="flex-1 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold tracking-wide py-3.5 px-2 transition-colors shadow-sm text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {activeVariant?.stock && activeVariant.stock > 0 ? 'ADD TO BASKET' : 'OUT OF STOCK'}
          </button>
        </div>
      </div>
    </main>
  );
}
