import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useCart } from '@/context/CartContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ShoppingCart, Package, Star, User, Calendar, MapPin } from 'lucide-react';
import { ProductAvailability } from '@/components/ProductAvailability';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });

  // Fetch product details with seller information
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['/api/products', id],
    enabled: !!id,
  });

  // Fetch product reviews
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ['/api/products', id, 'reviews'],
    enabled: !!id,
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      return await apiRequest(`/api/products/${id}/reviews`, 'POST', reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', id, 'reviews'] });
      setNewReview({ rating: 5, comment: '' });
      toast({ title: "Review added successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add review",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAddToCart = () => {
    if (product && typeof product === 'object' && 'id' in product) {
      addToCart(product as any, 1);
      toast({
        title: "Added to cart",
        description: `${(product as any).name} has been added to your cart.`
      });
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login required",
        description: "Please log in to add a review.",
        variant: "destructive"
      });
      return;
    }
    addReviewMutation.mutate(newReview);
  };

  const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? 'text-yellow-400 fill-current' 
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive && onRatingChange ? () => onRatingChange(star) : undefined}
          />
        ))}
      </div>
    );
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Loading product details...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">Product not found</div>
        </div>
      </div>
    );
  }

  const averageRating = Array.isArray(reviews) && reviews.length 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-renti-teal hover:text-renti-teal/80">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {(product as any)?.imageUrl ? (
              <img
                src={(product as any).imageUrl}
                alt={(product as any).name}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (product as any)?.images?.length > 0 ? (
              <img
                src={(product as any).images[0]}
                alt={(product as any).name}
                className="w-full h-96 object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{(product as any)?.name}</h1>
              <p className="text-lg text-renti-teal font-semibold mt-2">
                ₹{(product as any)?.basePrice}/{(product as any)?.rentalDuration}
              </p>
            </div>

            {/* Product Availability Component */}
            <ProductAvailability 
              productId={id!} 
              productName={(product as any)?.name || "Product"} 
            />

            {/* Seller Information */}
            {(product as any)?.seller && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Seller: {(product as any).seller.fullName || (product as any).seller.username}
                      </p>
                      <div className="flex items-center mt-1">
                        <MapPin className="h-4 w-4 text-gray-500 mr-1" />
                        <p className="text-sm text-gray-600">{(product as any)?.location}</p>
                      </div>
                      <p className="text-xs text-gray-500">{(product as any).seller.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rating and Reviews Summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {renderStars(averageRating)}
                    <span className="text-gray-600">
                      {averageRating.toFixed(1)} ({Array.isArray(reviews) ? reviews.length : 0} reviews)
                    </span>
                  </div>
                  <Badge variant={(product as any)?.isActive ? "default" : "secondary"}>
                    {(product as any)?.isActive ? "Available" : "Unavailable"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="prose max-w-none">
              <p className="text-gray-700">{(product as any)?.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-900">Available Units:</span>
                <p className="text-gray-700">{(product as any)?.availableUnits}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Location:</span>
                <p className="text-gray-700">{(product as any)?.location}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Min Rental:</span>
                <p className="text-gray-700">{(product as any)?.minRentalPeriod} {(product as any)?.rentalDuration}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-900">Posted:</span>
                <p className="text-gray-700">{new Date((product as any)?.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {user?.role === 'customer' && (product as any)?.isActive && (
              <div className="flex space-x-4">
                <Button onClick={handleAddToCart} className="flex-1 bg-renti-teal hover:bg-renti-teal/90">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2" />
                Customer Reviews ({Array.isArray(reviews) ? reviews.length : 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <div className="text-center py-4">Loading reviews...</div>
              ) : Array.isArray(reviews) && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.userFullName || review.userName}</span>
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
              )}

              {/* Add Review Form */}
              {user?.role === 'customer' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                  <form onSubmit={handleAddReview} className="space-y-4">
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <div className="mt-1">
                        {renderStars(newReview.rating, true, (rating) => 
                          setNewReview(prev => ({ ...prev, rating }))
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="comment">Comment</Label>
                      <Textarea
                        id="comment"
                        value={newReview.comment}
                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                        placeholder="Share your experience with this product..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={addReviewMutation.isPending || !newReview.comment.trim()}
                      className="bg-renti-teal hover:bg-renti-teal/90"
                    >
                      {addReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}