"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Plus, Minus, RotateCcw, ZoomIn } from 'lucide-react';

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
  const [targetZoom, setTargetZoom] = useState<number>(2.5);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  // Sync initialIndex when modal opens & reset zoom states
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setIsLocked(false);
      setIsHovered(false);
      setMousePos({ x: 50, y: 50 });
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
    setIsLocked(false);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setIsLocked(false);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation & zoom shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setTargetZoom((prev) => Math.min(4.5, Math.round((prev + 0.5) * 10) / 10));
      } else if (e.key === '-') {
        setTargetZoom((prev) => Math.max(1.5, Math.round((prev - 0.5) * 10) / 10));
      } else if (e.key === '0') {
        setIsLocked(false);
        setTargetZoom(2.5);
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

  // Non-passive wheel zoom inside modal
  useEffect(() => {
    const el = imageContainerRef.current;
    if (!el || !isOpen) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const step = e.deltaY < 0 ? 0.25 : -0.25;
      setTargetZoom((prev) => {
        const next = Math.round((prev + step) * 100) / 100;
        return Math.min(4.5, Math.max(1.5, next));
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [isOpen]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });
  }, []);

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

  // The active zoom scale: zooms when hovering OR when locked
  const isZooming = isHovered || isLocked;
  const currentScale = isZooming ? targetZoom : 1;

  if (!isOpen || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-md select-none transition-all duration-300"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 text-white z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex flex-col">
          <span className="text-xs sm:text-sm font-semibold truncate max-w-[170px] sm:max-w-md text-gray-200">
            {productName}
          </span>
          <span className="text-[11px] text-gray-400 font-medium">
            Photo {currentIndex + 1} of {images.length}
          </span>
        </div>

        {/* Manual Zoom Level Adjustment Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-none border border-white/15 shadow-md">
            <button
              onClick={() => setTargetZoom((prev) => Math.max(1.5, Math.round((prev - 0.5) * 10) / 10))}
              disabled={targetZoom <= 1.5}
              aria-label="Decrease zoom"
              className="p-1 rounded-none hover:bg-white/20 disabled:opacity-25 disabled:hover:bg-transparent text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <Minus size={14} />
            </button>

            <input
              type="range"
              min="1.5"
              max="4.5"
              step="0.25"
              value={targetZoom}
              onChange={(e) => setTargetZoom(parseFloat(e.target.value))}
              className="w-16 sm:w-28 h-1 bg-white/30 rounded-none appearance-none cursor-pointer accent-white"
              title="Adjust hover zoom level"
            />

            <button
              onClick={() => setTargetZoom((prev) => Math.min(4.5, Math.round((prev + 0.5) * 10) / 10))}
              disabled={targetZoom >= 4.5}
              aria-label="Increase zoom"
              className="p-1 rounded-none hover:bg-white/20 disabled:opacity-25 disabled:hover:bg-transparent text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <Plus size={14} />
            </button>

            <span className="text-[11px] font-bold font-mono min-w-[32px] text-center text-white/95 select-none pl-0.5">
              {targetZoom.toFixed(1)}x
            </span>

            {targetZoom !== 2.5 && (
              <button
                onClick={() => setTargetZoom(2.5)}
                className="p-1 rounded-none hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer ml-0.5"
                title="Reset zoom to 2.5x default"
              >
                <RotateCcw size={12} />
              </button>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close preview"
            className="p-2 rounded-none bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Image Area: Hover & Pan Zoom */}
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
            className="absolute left-2 sm:left-6 z-20 p-2.5 sm:p-3 rounded-none bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-sm"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* Display Image with Hover Magnifier + Cursor Follow */}
        <div
          ref={imageContainerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setIsHovered(false);
            if (!isLocked) setMousePos({ x: 50, y: 50 });
          }}
          onClick={(e) => {
            e.stopPropagation();
            setIsLocked((prev) => !prev);
          }}
          className={`relative max-w-full max-h-[72vh] sm:max-h-[78vh] flex items-center justify-center overflow-hidden ${
            isLocked ? 'cursor-zoom-out' : 'cursor-crosshair sm:cursor-zoom-in'
          }`}
        >
          <img
            src={images[currentIndex]}
            alt={`${productName} - Preview ${currentIndex + 1}`}
            className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain drop-shadow-2xl rounded-none pointer-events-none select-none"
            style={{
              transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
              transform: `scale(${currentScale})`,
              transition: isZooming
                ? 'transform-origin 0.04s ease-out, transform 0.18s ease-out'
                : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform-origin 0.3s ease',
              willChange: isZooming ? 'transform, transform-origin' : 'auto',
            }}
          />

          {/* Floating Instruction Hint at bottom of image */}
          <div className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 text-white/90 backdrop-blur-xs px-3 py-1 rounded-none text-[11px] items-center gap-1.5 pointer-events-none shadow-md border border-white/10">
            <ZoomIn size={12} className="text-amber-300" />
            <span>
              {isLocked ? 'Zoom locked • Click to unlock' : `Hover to zoom (${targetZoom.toFixed(1)}x) • Scroll wheel to adjust`}
            </span>
          </div>
        </div>

        {/* Next Navigation Button */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next image"
            className="absolute right-2 sm:right-6 z-20 p-2.5 sm:p-3 rounded-none bg-black/50 hover:bg-black/80 text-white border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-lg backdrop-blur-sm"
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
                    setIsLocked(false);
                    setCurrentIndex(idx);
                  }}
                  className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-none overflow-hidden flex-shrink-0 transition-all cursor-pointer border-2 ${
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
