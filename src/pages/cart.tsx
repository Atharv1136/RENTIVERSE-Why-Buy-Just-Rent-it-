import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/use-auth';
import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Trash2, Plus, Minus, ShoppingCart, Calendar, Package } from 'lucide-react';
import { Link } from 'wouter';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CartPage() {
  const { user } = useAuth();
  const { items, removeFromCart, updateQuantity, updateRentalDuration, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to proceed with checkout",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checkout",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order first
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (Math.max(...items.map(item => item.rentalDurationDays)) * 24 * 60 * 60 * 1000));
      
      const orderResponse = await apiRequest('POST', '/api/orders', {
        customerId: user.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        subtotal: getTotalPrice().toString(),
        total: getTotalPrice().toString(),
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          dailyRate: item.basePrice,
          totalPrice: (Number(item.basePrice || 0) * item.quantity * item.rentalDurationDays).toString()
        }))
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const order = await orderResponse.json();

      // Create Razorpay order
      const paymentResponse = await apiRequest('POST', '/api/payments/create-order', {
        amount: Math.round(getTotalPrice() * 100), // Convert to paise
        orderId: order.id
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const razorpayOrder = await paymentResponse.json();

      // Initialize Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Rentiverse',
        description: 'Rental Payment',
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verificationResponse = await apiRequest('POST', '/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order.id
            });

            const result = await verificationResponse.json();
            
            if (result.status === 'success') {
              clearCart();
              toast({
                title: "Payment successful!",
                description: "Your order has been confirmed. You will receive a confirmation email shortly."
              });
              // Redirect to orders page or success page
            } else {
              toast({
                title: "Payment verification failed",
                description: "Please contact support if money was deducted",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Payment verification error",
              description: "Please contact support",
              variant: "destructive"
            });
          }
        },
        prefill: {
          name: user.fullName || user.username,
          email: user.email || '',
        },
        theme: {
          color: '#0891b2' // renti-teal color
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-4xl mx-auto py-8 px-4">
          <Card>
            <CardContent className="py-8 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Please log in</h2>
              <p className="text-gray-600 mb-4">You need to be logged in to view your cart</p>
              <Link href="/login">
                <Button>Go to Login</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Start adding some products to your cart</p>
              <Link href="/customer-dashboard">
                <Button className="bg-renti-teal hover:bg-renti-teal/90">
                  Browse Products
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{item.description}</p>
                        <div className="flex items-center space-x-4">
                          <Badge variant="secondary">Rental Item</Badge>
                          <span className="text-sm text-gray-500">₹{item.basePrice}/day</span>
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.quantity >= item.availableUnits}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Rental Duration */}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <Input
                            type="number"
                            min="1"
                            value={item.rentalDurationDays}
                            onChange={(e) => updateRentalDuration(item.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-sm"
                          />
                          <span className="text-xs text-gray-500">days</span>
                        </div>

                        {/* Remove Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ₹{(Number(item.basePrice || 0) * item.quantity * item.rentalDurationDays).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.name} (×{item.quantity})</span>
                        <span>₹{(Number(item.basePrice || 0) * item.quantity * item.rentalDurationDays).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{getTotalPrice().toFixed(2)}</span>
                  </div>

                  <Button 
                    className="w-full bg-renti-teal hover:bg-renti-teal/90" 
                    onClick={handleCheckout}
                    disabled={isProcessing || items.length === 0}
                  >
                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                  </Button>

                  <div className="text-xs text-gray-500 text-center">
                    Secure payment powered by Razorpay
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
