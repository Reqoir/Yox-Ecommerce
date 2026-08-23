'use client';

import React, { useEffect, useState } from 'react';
import { reviewsApi } from '@/lib/api/reviews';
import { Loader2, MessageSquare, Star, CheckCircle, XCircle, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const data = await reviewsApi.getAllReviews({ 
        page, 
        limit: 20, 
        status: statusFilter === 'ALL' ? undefined : statusFilter 
      });
      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter, page]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
      await reviewsApi.updateReviewStatus(id, newStatus);
      toast.dismiss(loadingToast);
      toast.success(`Review ${newStatus.toLowerCase()} successfully!`);
      // Update locally
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (error: any) {
      toast.dismiss();
      toast.error(error?.response?.data?.message || 'Failed to update review status.');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5 text-[#D2925D]">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? 'fill-current text-[#D2925D]' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-10">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reviews Moderation</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and moderate customer product reviews</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
            <button
              key={filter}
              onClick={() => { setStatusFilter(filter as any); setPage(1); }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === filter
                  ? 'bg-white text-[#1A2E4C] shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {filter}
            </button>
          ))}
          <button 
            onClick={fetchReviews}
            className="p-1.5 text-gray-400 hover:text-[#1A2E4C] transition-colors ml-2"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-[500px]">
            <Loader2 className="w-8 h-8 text-[#1A2E4C] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No reviews found</h3>
            <p className="text-gray-500 max-w-sm">
              There are no {statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} reviews to show at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={review.product?.images?.[0]?.url || '/images/product-1.jpeg'} 
                          alt="Product" 
                          className="w-10 h-10 object-cover rounded-md bg-gray-100 border border-gray-200 shrink-0" 
                        />
                        <div className="max-w-[150px]">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {review.product?.name || 'Unknown Product'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-semibold text-gray-900">{review.user?.firstName} {review.user?.lastName}</p>
                        <p className="text-gray-500 text-xs">{review.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[300px]">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs font-bold text-gray-900 truncate">{review.title || 'No Title'}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {review.comment || 'No comment provided.'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        review.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        review.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {review.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {review.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        {review.status !== 'REJECTED' && (
                          <button
                            onClick={() => handleUpdateStatus(review.id, 'REJECTED')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded border border-gray-200 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
