"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

interface ProductImagePreviewModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  productName: string;
  onClose: () => void;
}

export function ProductImagePreviewModal({
  isOpen,
  images,
  initialIndex = 0,
  productName,
  onClose,
}: ProductImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  // Sync initialIndex when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsZoomed(false);
    }
  }, [isOpen, initialIndex]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsZoomed(false);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailScrollRef.current) {
      const activeThumb = thumbnailScrollRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [currentIndex]);

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none transition-all duration-300"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold truncate max-w-[220px] sm:max-w-md text-gray-200">
            {productName}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            Photo {currentIndex + 1} of {images.length}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Zoom toggle button */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            aria-label={isZoomed ? "Zoom out" : "Zoom in"}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title={isZoomed ? "Zoom out" : "Zoom in"}
          >
            {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Area with Touch Swipe & Zoom */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden px-2 sm:px-16"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={(e) => {
          // If clicking backdrop directly, close modal
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Previous Navigation Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous image"
            className="absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-sm"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Display Image */}
        <div
          className={`relative max-w-full max-h-[72vh] sm:max-h-[78vh] flex items-center justify-center transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out overflow-auto' : 'cursor-zoom-in'
          }`}
          onClick={() => setIsZoomed(!isZoomed)}
        >
          <img
            src={images[currentIndex]}
            alt={`${productName} - Preview ${currentIndex + 1}`}
            className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain drop-shadow-2xl rounded-sm"
          />
        </div>

        {/* Next Navigation Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3 rounded-full bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-sm"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip & Indicator */}
      <div className="w-full px-4 py-3 sm:py-4 bg-gradient-to-t from-black/90 to-transparent z-10 flex flex-col items-center gap-2">
        {images.length > 1 && (
          <div
            ref={thumbnailScrollRef}
            className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {images.map((img, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    setIsZoomed(false);
                    setCurrentIndex(idx);
                  }}
                  className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded overflow-hidden flex-shrink-0 transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'border-white scale-105 shadow-md shadow-white/20 opacity-100'
                      : 'border-transparent opacity-50 hover:opacity-80'
                  }`}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
