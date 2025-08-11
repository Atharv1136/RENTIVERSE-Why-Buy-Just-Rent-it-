import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Order } from "@shared/schema";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order & { orderItems: any[] };
}

export default function PaymentModal({ isOpen, onClose, order }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPaymentMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("POST", "/api/create-order-payment", { orderId });
      return await res.json();
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (paymentData: any) => {
      const res = await apiRequest("POST", "/api/verify-payment", paymentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      toast({
        title: "Payment Successful!",
        description: "Your rental has been confirmed. We'll notify you about pickup details.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Load Razorpay script
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        throw new Error("Failed to load payment gateway");
      }

      // Create payment order
      const paymentData = await createPaymentMutation.mutateAsync(order.id);

      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: "Rentiverse",
        description: `Payment for Order ${order.orderNumber}`,
        order_id: paymentData.razorpayOrderId,
        handler: async (response: any) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order.id
            });
          } catch (error) {
            console.error("Payment verification failed:", error);
          }
        },
        prefill: {
          name: "Customer",
          email: "",
          contact: ""
        },
        theme: {
          color: "#3B82F6"
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      toast({
        title: "Payment Error",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Order Number:</span>
                <span className="font-medium">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rental Period:</span>
                <span className="font-medium">
                  {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₹{order.subtotal}</span>
              </div>
              {order.tax && parseFloat(order.tax) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax:</span>
                  <span className="font-medium">₹{order.tax}</span>
                </div>
              )}
              {order.securityDeposit && parseFloat(order.securityDeposit) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Security Deposit:</span>
                  <span className="font-medium">₹{order.securityDeposit}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Amount:</span>
                <span>₹{order.total}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <strong>Accepted Payment Methods:</strong>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center gap-1 p-2 bg-muted rounded">
                  <Smartphone className="h-4 w-4" />
                  <span>UPI</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-muted rounded">
                  <CreditCard className="h-4 w-4" />
                  <span>Cards</span>
                </div>
                <div className="flex flex-col items-center gap-1 p-2 bg-muted rounded">
                  <Banknote className="h-4 w-4" />
                  <span>Net Banking</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePayment} 
              className="w-full" 
              size="lg"
              disabled={isProcessing || createPaymentMutation.isPending || verifyPaymentMutation.isPending}
            >
              {isProcessing || createPaymentMutation.isPending || verifyPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ₹{order.total}
                </>
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Your payment is secured by Razorpay. We never store your card details.
            </p>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}