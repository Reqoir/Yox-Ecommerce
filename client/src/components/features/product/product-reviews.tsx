import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { reviewsApi } from '@/lib/api/reviews';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ProductReviewsProps {
  productId: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
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
    submitReview.mutate();
  };

  const renderStars = (count: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={16} 
        className={i < count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"} 
      />
    ));
  };

  return (
    <div className="mt-12 border-t border-gray-100 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-[#1A2E4C] text-[#1A2E4C] hover:bg-[#1A2E4C] hover:text-white transition-colors">
              Write a Review
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Write a Review</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                <div className="flex gap-1 cursor-pointer">
                  {Array(5).fill(0).map((_, i) => (
                    <Star 
                      key={i} 
                      size={24} 
                      onClick={() => setRating(i + 1)}
                      className={i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 hover:text-yellow-200"} 
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1A2E4C] focus:ring-1 focus:ring-[#1A2E4C] outline-none"
                  placeholder="Summarize your experience"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment (Optional)</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1A2E4C] focus:ring-1 focus:ring-[#1A2E4C] outline-none"
                  placeholder="What did you like or dislike?"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-[#1A2E4C] hover:bg-[#132238] text-white"
                disabled={submitReview.isPending}
              >
                {submitReview.isPending ? 'Submitting...' : 'Submit Review'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-gray-500 text-sm">Loading reviews...</div>
      ) : reviewsData?.data?.data?.length > 0 ? (
        <div className="space-y-6">
          {reviewsData.data.data.map((review: any) => (
            <div key={review._id} className="pb-6 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {renderStars(review.rating)}
                </div>
                {review.title && <span className="font-bold text-gray-900 ml-2 text-sm">{review.title}</span>}
              </div>
              <p className="text-gray-600 text-sm mb-2">{review.comment}</p>
              <div className="text-xs text-gray-400">
                By {review.user?.fullName || 'Anonymous'} on {new Date(review.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 bg-gray-50 rounded-lg flex flex-col items-center justify-center text-center">
          <MessageSquare className="text-gray-300 mb-3" size={32} />
          <h3 className="text-gray-900 font-medium mb-1">No reviews yet</h3>
          <p className="text-gray-500 text-sm">Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
}
