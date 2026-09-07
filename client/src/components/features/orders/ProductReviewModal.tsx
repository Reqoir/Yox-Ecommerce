'use client';

import React, { useState } from 'react';
import { Star, X, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { reviewsApi, ReviewData } from '@/lib/api/reviews';
import { toast } from 'sonner';

interface ProductReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    productId: string;
    productName: string;
    imageUrl?: string;
    sku?: string;
    size?: string;
    color?: string;
  } | null;
  onReviewSubmitted: (productId: string, newReview: any) => void;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor — Very Dissatisfied',
  2: 'Fair — Below Expectations',
  3: 'Good — Met Expectations',
  4: 'Very Good — Highly Recommended',
  5: 'Excellent — Outstanding Quality!',
};

export function ProductReviewModal({
  isOpen,
  onClose,
  product,
  onReviewSubmitted,
}: ProductReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || rating < 1) {
      toast.error('Please select a star rating between 1 and 5');
      return;
    }

    if (!title.trim()) {
      toast.error('Please provide a short headline for your review');
      return;
    }

    if (!comment.trim() || comment.trim().length < 5) {
      toast.error('Please write a brief comment describing your experience (at least 5 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await reviewsApi.createReview(product.productId, {
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });

      toast.success('Thank you! Your product review has been submitted successfully.');
      onReviewSubmitted(product.productId, res?.data || { rating, title, comment });
      
      // Reset form & close
      setTitle('');
      setComment('');
      setRating(5);
      onClose();
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      const msg = error?.response?.data?.message || error?.message || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Star size={18} className="fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Rate & Review Product</h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">Share your genuine verified purchase feedback</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 dark:hover:bg-neutral-700 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Product Snapshot */}
        <div className="px-6 py-3.5 bg-gray-50/80 dark:bg-neutral-800/50 border-b border-gray-100 dark:border-neutral-800 flex items-center gap-3.5">
          <img
            src={product.imageUrl || '/images/product-1.jpeg'}
            alt={product.productName}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/product-1.jpeg';
            }}
            className="w-12 h-14 object-cover rounded-lg bg-white border border-gray-200 dark:border-neutral-700 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
              {product.productName}
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {product.sku && <span>SKU: {product.sku}</span>}
              {product.size && <span>• Size: {product.size}</span>}
              {product.color && <span>• Color: {product.color}</span>}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Star Rating Selection */}
          <div className="space-y-2 text-center py-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Overall Rating
            </label>
            <div className="flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1.5 text-gray-300 dark:text-neutral-700 hover:scale-115 transition-transform cursor-pointer focus:outline-none"
                  aria-label={`Rate ${star} star`}
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      star <= activeRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300 dark:text-neutral-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 h-4">
              {RATING_LABELS[activeRating] || ''}
            </p>
          </div>

          {/* Headline Title */}
          <div className="space-y-1.5">
            <label htmlFor="review-title" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Headline / Summary <span className="text-rose-500">*</span>
            </label>
            <input
              id="review-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Premium fabric, perfect fit!"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] dark:focus:ring-white transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Detailed Review / Comment */}
          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Detailed Review <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="review-comment"
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share what you liked about this product, the quality, material, fit, and overall comfort..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A2E4C] dark:focus:ring-white transition-all placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A2E4C] hover:bg-[#132238] dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Submitting Review...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
