"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare, X, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { reviewsApi } from '@/lib/api/reviews';

interface ProductReviewsProps {
  productId: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Poor • Disappointed',
  2: 'Fair • Could be better',
  3: 'Average • Meets expectations',
  4: 'Very Good • Highly satisfied',
  5: 'Excellent • Absolutely loved it!',
};

export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => reviewsApi.getProductReviews(productId, { limit: 10 }),
  });

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.createReview(productId, { rating, title, comment }),
    onSuccess: () => {
      toast.success('Your review has been submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      setIsOpen(false);
      setTitle('');
      setComment('');
      setRating(5);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to submit review';
      toast.error(message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      toast.error('Please select a star rating');
      return;
    }
    submitReview.mutate();
  };

  const activeRating = hoverRating || rating;
  const reviews = reviewsData?.data?.data || [];
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / totalReviews).toFixed(1)
    : '5.0';

  const renderStars = (count: number, size = 15) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={size} 
        className={i < count ? "text-[#B58546] fill-[#B58546]" : "text-gray-200 fill-gray-100"} 
      />
    ));
  };

  return (
    <div className="mt-12 sm:mt-16 border-t border-gray-200 pt-10">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">
              Customer Reviews
            </h2>
            {totalReviews > 0 && (
              <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {totalReviews}
              </span>
            )}
          </div>
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex gap-0.5">{renderStars(Math.round(Number(avgRating)), 14)}</div>
              <span className="text-xs font-bold text-gray-900">{avgRating} out of 5</span>
              <span className="text-xs text-gray-400">• Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center justify-center border border-black bg-white hover:bg-black text-black hover:text-white px-6 h-10 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer shadow-xs active:scale-[0.98]"
        >
          Write a Review
        </button>
      </div>

      {/* Reviews Content */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
          <Loader2 className="animate-spin text-gray-900" size={24} />
          <span className="text-xs tracking-wider uppercase font-medium">Loading reviews...</span>
        </div>
      ) : reviews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review: any) => (
            <div key={review._id} className="p-5 border border-gray-100 bg-[#FAFAFA] rounded-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex gap-0.5">
                    {renderStars(review.rating, 13)}
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                
                {review.title && (
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5 leading-snug">
                    {review.title}
                  </h3>
                )}
                
                <p className="text-gray-600 text-xs leading-relaxed">
                  {review.comment || "Great product, truly satisfied with the quality."}
                </p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200/60">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {(review.user?.fullName || 'A')[0]}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-800">
                    {review.user?.fullName || 'Verified Customer'}
                  </span>
                  <span className="text-[9px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded font-semibold uppercase">
                    Verified Buyer
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-14 border border-dashed border-gray-200 bg-[#FAFAFA] rounded-xs flex flex-col items-center justify-center text-center px-4">
          <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 mb-3 shadow-xs">
            <MessageSquare size={20} />
          </div>
          <h3 className="text-gray-900 font-bold text-sm uppercase tracking-wider mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-xs max-w-sm mb-5">
            Be the first to share your thoughts and help others make the right choice.
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="border border-black bg-black text-white hover:bg-gray-800 px-5 h-9 text-xs font-bold tracking-widest uppercase transition-all cursor-pointer"
          >
            Leave a Review
          </button>
        </div>
      )}

      {/* Redesigned Modal matching the Luxury & Minimalist Product Detail Aesthetic */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-lg bg-white border border-gray-900/10 shadow-2xl p-6 sm:p-8 animate-in zoom-in-95 duration-200 rounded-none sm:rounded-xs">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B58546] flex items-center gap-1 mb-1">
                  <Sparkles size={12} /> YOX Experience
                </span>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 uppercase">
                  Write a Review
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Share your honest feedback to help our community.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              
              {/* Star Rating Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-900 mb-2">
                  Overall Rating <span className="text-red-500">*</span>
                </label>
                
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 cursor-pointer">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 focus:outline-none transition-transform hover:scale-115 active:scale-95 cursor-pointer"
                        aria-label={`Rate ${star} out of 5 stars`}
                      >
                        <Star 
                          size={28} 
                          className={`transition-colors duration-150 ${
                            star <= activeRating 
                              ? "text-[#B58546] fill-[#B58546]" 
                              : "text-gray-200 hover:text-[#e0c69d]"
                          }`} 
                        />
                      </button>
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-xs">
                    {RATING_LABELS[activeRating]}
                  </span>
                </div>
              </div>

              {/* Title / Headline Input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-900 mb-1.5">
                  Review Headline
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                  placeholder="e.g. Exceptional fit, soft fabric, and perfect cut"
                  maxLength={100}
                />
              </div>

              {/* Comment / Body Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-900">
                    Your Review
                  </label>
                  <span className="text-[10px] text-gray-400">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full p-3.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-none focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 resize-none"
                  placeholder="What did you like or dislike about the fit, sizing, fabric, or feel?"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={submitReview.isPending}
                  className="flex-1 h-11 border border-gray-300 hover:border-black text-gray-800 hover:text-black text-[11px] font-bold tracking-widest uppercase transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button 
                  type="submit" 
                  disabled={submitReview.isPending}
                  className="flex-1 h-11 bg-black hover:bg-gray-800 active:scale-[0.99] text-white text-[11px] font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitReview.isPending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
