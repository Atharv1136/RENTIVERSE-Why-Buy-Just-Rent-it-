import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Calendar, Package, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface ProductAvailabilityProps {
  productId: string;
  productName: string;
}

interface AvailabilityInfo {
  isAvailable: boolean;
  availableUnits: number;
  totalUnits: number;
  rentedUnits: number;
  nextAvailableDate?: string;
  daysUntilAvailable?: number;
}

export function ProductAvailability({ productId, productName }: ProductAvailabilityProps) {
  const { toast } = useToast();

  const { data: availability, isLoading } = useQuery<AvailabilityInfo>({
    queryKey: ['/api/products', productId, 'availability'],
  });

  const notifyMutation = useMutation({
    mutationFn: () => 
      fetch(`/api/products/${productId}/notify-availability`, {
        method: 'POST',
        credentials: 'include',
      }).then(res => {
        if (!res.ok) throw new Error('Failed to request notification');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Notification Set!",
        description: "You'll be notified when this product becomes available.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set up availability notification.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 animate-pulse" />
            <span className="text-sm text-muted-foreground">Checking availability...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!availability) {
    return null;
  }

  const getAvailabilityStatus = () => {
    if (availability.isAvailable) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        badge: <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Available</Badge>,
        message: `${availability.availableUnits} of ${availability.totalUnits} units available`
      };
    } else {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-600" />,
        badge: <Badge variant="destructive">Out of Stock</Badge>,
        message: `All ${availability.totalUnits} units are currently rented`
      };
    }
  };

  const status = getAvailabilityStatus();

  return (
    <Card className="w-full border-l-4 border-l-renti-teal">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Availability Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {status.icon}
              <span className="font-medium text-sm">Availability Status</span>
            </div>
            {status.badge}
          </div>

          {/* Availability Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{status.message}</p>
            
            {!availability.isAvailable && availability.daysUntilAvailable !== undefined && (
              <div className="flex items-center space-x-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                <Calendar className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    Expected restock in {availability.daysUntilAvailable} days
                  </p>
                  {availability.nextAvailableDate && (
                    <p className="text-amber-700 dark:text-amber-300 text-xs">
                      Available from: {new Date(availability.nextAvailableDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stock Details */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Total Units</p>
              <p className="font-semibold">{availability.totalUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Currently Rented</p>
              <p className="font-semibold">{availability.rentedUnits}</p>
            </div>
          </div>

          {/* Notification Button */}
          {!availability.isAvailable && (
            <Button
              onClick={() => notifyMutation.mutate()}
              disabled={notifyMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              <Bell className="h-4 w-4 mr-2" />
              {notifyMutation.isPending ? "Setting up..." : "Notify when available"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}