'use client';

import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { reviewsApi } from '@/lib/api/reviews';
import {
  Loader2,
  MessageSquare,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  ExternalLink,
  User,
  Package,
  Clock,
  ThumbsUp,
  Ban,
  X,
  Calendar,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

interface ReviewProduct {
  id?: string;
  name?: string;
  thumbnail?: string;
  slug?: string;
}

interface ReviewUser {
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
}

interface ReviewItem {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt?: string;
  product?: ReviewProduct;
  user?: ReviewUser;
}

interface ReviewCounts {
  all: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<ReviewCounts>({ all: 0, pending: 0, approved: 0, rejected: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await reviewsApi.getAllReviews({
        page,
        limit: 15,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: activeSearch.trim() || undefined,
      });

      setReviews(res.reviews || []);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
      if (res.counts) {
        setCounts(res.counts);
      }
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, activeSearch]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    try {
      setIsActionLoading(id);
      await reviewsApi.updateReviewStatus(id, newStatus);
      toast.success(`Review status changed to ${newStatus.toLowerCase()}!`);

      // Update state locally
      setReviews((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      if (selectedReview?.id === id) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null));
      }

      // Refresh counts in background
      fetchReviews();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to update review status.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleDeleteReview = async (review: ReviewItem) => {
    const result = await Swal.fire({
      title: 'Delete Review?',
      text: `Are you sure you want to permanently delete this review for "${review.product?.name || 'this product'}"? This will also update the product rating.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      setIsActionLoading(review.id);
      await reviewsApi.deleteReview(review.id);
      toast.success('Review deleted successfully!');
      
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      if (selectedReview?.id === review.id) {
        setSelectedReview(null);
      }

      fetchReviews();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to delete review.');
    } finally {
      setIsActionLoading(null);
    }
  };

  const renderStars = (rating: number, size = 13) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            className={star <= rating ? 'fill-[#D2925D] text-[#D2925D]' : 'text-gray-200 fill-gray-100'}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-[1300px] mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            Reviews Moderation
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full">
              {totalCount} Total
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage, inspect, and moderate customer product reviews and ratings.
          </p>
        </div>

        <button
          onClick={fetchReviews}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-foreground bg-card border border-border hover:bg-muted shadow-sm transition-all self-start md:self-auto disabled:opacity-60"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin text-[#1A2E4C]' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Reviews */}
        <div
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`cursor-pointer bg-card p-4 rounded-xl border transition-all ${
            statusFilter === 'ALL'
              ? 'border-[#1A2E4C] ring-2 ring-[#1A2E4C]/10 shadow-sm'
              : 'border-border hover:border-border hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">All Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
              <MessageSquare size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-foreground">{counts.all}</span>
            <span className="text-xs text-muted-foreground font-medium">customer reviews</span>
          </div>
        </div>

        {/* Pending Moderation */}
        <div
          onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
          className={`cursor-pointer bg-card p-4 rounded-xl border transition-all ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm'
              : 'border-border hover:border-amber-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Pending</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700">{counts.pending}</span>
            {counts.pending > 0 && (
              <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 animate-pulse">
                Needs Review
              </span>
            )}
          </div>
        </div>

        {/* Approved Reviews */}
        <div
          onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          className={`cursor-pointer bg-card p-4 rounded-xl border transition-all ${
            statusFilter === 'APPROVED'
              ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
              : 'border-border hover:border-emerald-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Approved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ThumbsUp size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">{counts.approved}</span>
            <span className="text-xs text-muted-foreground font-medium">live on store</span>
          </div>
        </div>

        {/* Rejected Reviews */}
        <div
          onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          className={`cursor-pointer bg-card p-4 rounded-xl border transition-all ${
            statusFilter === 'REJECTED'
              ? 'border-rose-500 ring-2 ring-rose-500/10 shadow-sm'
              : 'border-border hover:border-rose-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Ban size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{counts.rejected}</span>
            <span className="text-xs text-muted-foreground font-medium">hidden from store</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-muted/80 p-1 rounded-lg overflow-x-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((tab) => {
            const count =
              tab === 'ALL'
                ? counts.all
                : tab === 'PENDING'
                ? counts.pending
                : tab === 'APPROVED'
                ? counts.approved
                : counts.rejected;

            const isActive = statusFilter === tab;

            return (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive
                    ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/50'
                }`}
              >
                <span>{tab}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                    isActive
                      ? tab === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : tab === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : tab === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-muted-foreground/20 text-foreground'
                      : 'bg-muted-foreground/20/60 text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Search by product, customer, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A2E4C]/20 focus:border-[#1A2E4C] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main Reviews Table Container */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden min-h-[460px]">
        {isLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Rating & Review</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-muted-foreground/20 shrink-0" />
                        <div className="space-y-1.5 w-full">
                          <div className="h-3 w-32 bg-muted-foreground/20 rounded-md" />
                          <div className="h-2 w-20 bg-muted-foreground/20 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-muted-foreground/20 shrink-0" />
                        <div className="space-y-1.5 w-full">
                          <div className="h-3 w-24 bg-muted-foreground/20 rounded-md" />
                          <div className="h-2 w-32 bg-muted-foreground/20 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top max-w-[320px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-24 bg-muted-foreground/20 rounded-md" />
                          <div className="h-2 w-16 bg-muted-foreground/20 rounded-md" />
                        </div>
                        <div className="h-3 w-40 bg-muted-foreground/20 rounded-md" />
                        <div className="space-y-1.5">
                          <div className="h-2 w-full bg-muted-foreground/20 rounded-md" />
                          <div className="h-2 w-3/4 bg-muted-foreground/20 rounded-md" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-top">
                      <div className="h-5 w-20 bg-muted-foreground/20 rounded-full" />
                    </td>
                    <td className="px-5 py-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-7 w-7 bg-muted-foreground/20 rounded-md" />
                        <div className="h-7 w-7 bg-muted-foreground/20 rounded-md" />
                        <div className="h-7 w-7 bg-muted-foreground/20 rounded-md" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[460px] text-center p-8">
            <div className="w-16 h-16 bg-muted/30 border border-border rounded-2xl flex items-center justify-center mb-4 text-muted-foreground shadow-inner">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No reviews found</h3>
            <p className="text-muted-foreground text-xs max-w-sm mb-4">
              {activeSearch
                ? `No reviews match your search query "${activeSearch}".`
                : `There are no ${statusFilter !== 'ALL' ? statusFilter.toLowerCase() : ''} reviews to show at this time.`}
            </p>
            {(activeSearch || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#1A2E4C] bg-blue-50/60 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Rating & Review</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {reviews.map((review) => {
                  const isBusy = isActionLoading === review.id;
                  const prodImg = review.product?.thumbnail;
                  const prodName = review.product?.name || 'Unknown Product';
                  const userName = review.user?.fullName || 'Verified Customer';
                  const userInitial = (userName[0] || 'U').toUpperCase();

                  return (
                    <tr
                      key={review.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Product Column */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                            {prodImg ? (
                              <img
                                src={prodImg}
                                alt={prodName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback on broken image link
                                  (e.target as HTMLElement).style.display = 'none';
                                  (e.currentTarget.parentElement as HTMLElement).innerHTML =
                                    '<div class="text-muted-foreground flex items-center justify-center w-full h-full"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></div>';
                                }}
                              />
                            ) : (
                              <Package size={20} className="text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[190px]">
                            <p
                              className="font-bold text-foreground text-xs truncate leading-snug hover:text-primary dark:hover:text-primary/80 transition-colors"
                              title={prodName}
                            >
                              {prodName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate">
                              ID: {review.productId?.slice(-8) || 'N/A'}
                            </p>
                            {review.product?.slug && (
                              <a
                                href={`/product/${review.product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1 font-medium"
                              >
                                View product <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer Column */}
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#1A2E4C] to-[#2A4365] text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
                            {review.user?.profileImage ? (
                              <img
                                src={review.user.profileImage}
                                alt={userName}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              userInitial
                            )}
                          </div>
                          <div className="min-w-0 max-w-[170px]">
                            <p className="text-xs font-bold text-foreground truncate">
                              {userName}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate" title={review.user?.email}>
                              {review.user?.email || 'No email provided'}
                            </p>
                            {review.user?.phone && (
                              <p className="text-[10px] text-muted-foreground truncate">
                                {review.user.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Review & Rating Column */}
                      <td className="px-5 py-4 align-top max-w-[320px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <span className="text-[11px] font-extrabold text-foreground">
                              {review.rating}.0
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              • {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {review.title && (
                            <p className="text-xs font-bold text-foreground truncate">
                              {review.title}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {review.comment || (
                              <span className="italic text-muted-foreground">No review text provided.</span>
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Status Badge Column */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        {review.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            APPROVED
                          </span>
                        ) : review.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900 shadow-2xs animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions Column */}
                      <td className="px-5 py-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect / View Details Button */}
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="p-1.5 text-muted-foreground hover:text-primary dark:hover:text-primary/80 transition-colors hover:bg-muted rounded-lg transition-colors"
                            title="View Full Details"
                          >
                            <Eye size={16} />
                          </button>

                          {/* Approve Action */}
                          {review.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'APPROVED')}
                              disabled={isBusy}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve Review"
                            >
                              {isBusy ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <CheckCircle2 size={16} />
                              )}
                            </button>
                          )}

                          {/* Reject Action */}
                          {review.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateStatus(review.id, 'REJECTED')}
                              disabled={isBusy}
                              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Reject Review"
                            >
                              {isBusy ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <XCircle size={16} />
                              )}
                            </button>
                          )}

                          {/* Delete Action */}
                          <button
                            onClick={() => handleDeleteReview(review)}
                            disabled={isBusy}
                            className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete Review Permanently"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-muted/20 border-t border-border text-xs">
            <span className="text-muted-foreground font-medium">
              Showing page <strong className="text-foreground">{page}</strong> of{' '}
              <strong className="text-foreground">{totalPages}</strong> ({totalCount} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="px-3 py-1.5 rounded-lg border border-border bg-background font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
                className="px-3 py-1.5 rounded-lg border border-border bg-background font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-2xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Details Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-border relative max-h-[90vh] overflow-y-auto text-foreground">
            {/* Close Button */}
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A2E4C] flex items-center justify-center">
                <MessageSquare size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Review Details</h3>
                <p className="text-xs text-muted-foreground">
                  Submitted on {formatDate(selectedReview.createdAt)}
                </p>
              </div>
            </div>

            {/* Product Card Inside Modal */}
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border flex items-center gap-3.5 mb-4">
              <div className="w-12 h-12 rounded-lg bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                {selectedReview.product?.thumbnail ? (
                  <img
                    src={selectedReview.product.thumbnail}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package size={22} className="text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Target Product
                </span>
                <p className="text-xs font-bold text-foreground truncate">
                  {selectedReview.product?.name || 'Unknown Product'}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  ID: {selectedReview.productId}
                </p>
              </div>
              {selectedReview.product?.slug && (
                <a
                  href={`/product/${selectedReview.product.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 bg-background border border-blue-200 rounded-md hover:bg-blue-50 transition-colors shrink-0 flex items-center gap-1"
                >
                  View <ExternalLink size={11} />
                </a>
              )}
            </div>

            {/* User Info Card */}
            <div className="p-3.5 bg-muted/30 rounded-xl border border-border flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#1A2E4C] text-white flex items-center justify-center font-bold text-sm shrink-0">
                {(selectedReview.user?.fullName?.[0] || 'U').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Reviewer Info
                </span>
                <p className="text-xs font-bold text-foreground truncate">
                  {selectedReview.user?.fullName || 'Verified Customer'}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Mail size={11} /> {selectedReview.user?.email || 'No email'}
                  </span>
                  {selectedReview.user?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={11} /> {selectedReview.user.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating & Review Content */}
            <div className="space-y-3 p-4 bg-card rounded-xl border border-border mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating, 16)}
                  <span className="text-sm font-extrabold text-foreground">
                    {selectedReview.rating}.0 / 5.0
                  </span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    selectedReview.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                      : selectedReview.status === 'REJECTED'
                      ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                  }`}
                >
                  {selectedReview.status}
                </span>
              </div>

              {selectedReview.title && (
                <p className="text-sm font-bold text-foreground border-b border-border pb-2">
                  {selectedReview.title}
                </p>
              )}

              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                {selectedReview.comment || (
                  <span className="italic text-muted-foreground">No review commentary provided.</span>
                )}
              </p>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border">
              <button
                onClick={() => handleDeleteReview(selectedReview)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
                <span>Delete Review</span>
              </button>

              <div className="flex items-center gap-2">
                {selectedReview.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview.id, 'APPROVED')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve</span>
                  </button>
                )}
                {selectedReview.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReview.id, 'REJECTED')}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted-foreground/20 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
