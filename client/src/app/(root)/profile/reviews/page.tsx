'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { reviewsApi } from '@/lib/api/reviews';
import { Loader2, MessageSquare, Star, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await reviewsApi.getMyReviews({ page, limit: 10 });
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to load your reviews:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch your reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 text-[#D2925D]">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? 'fill-current text-[#D2925D]' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-500">Loading your reviews...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">My Reviews</h1>
          <p className="text-xs text-gray-500 mt-1">Products you have rated and reviewed</p>
        </div>
        <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-lg mx-auto my-8 shadow-sm">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Reviews Yet</h3>
          <p className="text-xs text-gray-500 mb-6 max-w-xs mx-auto">
            You haven't left any product reviews. Share your thoughts on your recent purchases!
          </p>
          <Link
            href="/profile/orders"
            className="inline-flex items-center gap-2 bg-[#1A2E4C] hover:bg-[#132238] text-white font-bold text-xs px-6 py-3 rounded transition-all shadow"
          >
            <span>Review Past Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs relative group"
            >
              <div className="flex gap-4">
                <Link href={`/shop/${review.product?.slug || review.product?.id || review.productId}`} className="shrink-0">
                  <div className="relative w-20 h-24 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={review.product?.images?.[0]?.url || '/images/product-1.jpeg'}
                      alt={review.product?.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </Link>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link href={`/shop/${review.product?.slug || review.product?.id || review.productId}`} className="hover:underline">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{review.product?.name || 'Unknown Product'}</h3>
                      </Link>
                      <div className="mt-1">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                      review.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                      review.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {review.status}
                    </span>
                  </div>
                  
                  <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <h4 className="text-xs font-bold text-gray-900 mb-1">{review.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
