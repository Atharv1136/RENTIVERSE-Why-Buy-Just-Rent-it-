import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";
import { Package, Calendar, MapPin } from "lucide-react";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch user orders for rental history
  const { data: userOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: !!user,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: {
      fullName: string;
      email: string;
      phone?: string;
    }) => {
      return await apiRequest('PUT', '/api/profile', profileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      setIsEditDialogOpen(false);
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update profile", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      return await apiRequest('PUT', '/api/change-password', passwordData);
    },
    onSuccess: () => {
      setIsPasswordDialogOpen(false);
      toast({ title: "Password changed successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to change password", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/profile');
    },
    onSuccess: () => {
      logoutMutation.mutate();
      toast({ title: "Account deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to delete account", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleUpdateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    updateProfileMutation.mutate({
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string || undefined,
    });
  };

  const handleChangePassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Password mismatch", 
        description: "New password and confirmation don't match",
        variant: "destructive" 
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: formData.get('currentPassword') as string,
      newPassword,
      confirmPassword,
    });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-renti-navy mb-2">My Profile</h1>
            <p className="text-gray-600">Manage your account settings and preferences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="rentals">My Rentals</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Update your personal information and contact details
                    </p>
                  </div>
                  <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">Edit Profile</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input 
                            id="fullName" 
                            name="fullName" 
                            defaultValue={user.fullName} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            defaultValue={user.email} 
                            required 
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone (Optional)</Label>
                          <Input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            defaultValue={user.phone || ''} 
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-renti-teal hover:bg-renti-teal/90"
                            disabled={updateProfileMutation.isPending}
                          >
                            {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-6 mb-6">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="text-lg bg-renti-teal text-white">
                        {user.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold text-renti-navy">{user.fullName}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <Badge variant="secondary" className="mt-1">
                        {user.role === 'admin' ? 'Administrator' : 'Customer'}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Username</Label>
                      <p className="mt-1 text-sm text-gray-900">{user.username}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Member Since</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <p className="mt-1 text-sm text-gray-900">{user.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Role</Label>
                      <p className="mt-1 text-sm text-gray-900">{user.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="rentals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    My Rental History
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    View your rental history and product details
                  </p>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : userOrders?.orders?.length > 0 ? (
                    <div className="space-y-4">
                      {userOrders.orders.map((order: any) => (
                        <Card key={order.id} className="border-l-4 border-l-renti-teal">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-renti-navy">
                                  Order #{order.orderNumber}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge variant={
                                order.status === 'completed' ? 'default' :
                                order.status === 'active' ? 'secondary' :
                                'outline'
                              }>
                                {order.status}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}</span>
                            </div>

                            {/* Product Images for Rented Items */}
                            {order.items && order.items.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm">Rented Products:</h5>
                                <div className="flex flex-wrap gap-3">
                                  {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 min-w-0">
                                      <div className="w-12 h-12 bg-gradient-to-br from-renti-teal to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Package className="h-6 w-6 text-white" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm text-renti-navy truncate">
                                          {item.productName || `Product ${idx + 1}`}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity} • ₹{item.totalPrice}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <Separator className="my-3" />
                            
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-renti-navy">
                                Total: ₹{order.total}
                              </span>
                              {order.status === 'active' && (
                                <Button size="sm" className="bg-renti-teal hover:bg-renti-teal/90">
                                  View Details
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">No rental history</h3>
                      <p className="text-gray-600 mb-4">You haven't rented any products yet.</p>
                      <Button onClick={() => setLocation('/customer-dashboard')} className="bg-renti-teal hover:bg-renti-teal/90">
                        Browse Products
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Password & Security</CardTitle>
                    <p className="text-sm text-gray-600">
                      Manage your password and account security settings
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Password</h4>
                        <p className="text-sm text-gray-600">Last changed: Never</p>
                      </div>
                      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Change Password</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                              <Label htmlFor="currentPassword">Current Password</Label>
                              <Input 
                                id="currentPassword" 
                                name="currentPassword" 
                                type="password" 
                                required 
                              />
                            </div>
                            <div>
                              <Label htmlFor="newPassword">New Password</Label>
                              <Input 
                                id="newPassword" 
                                name="newPassword" 
                                type="password" 
                                required 
                              />
                            </div>
                            <div>
                              <Label htmlFor="confirmPassword">Confirm Password</Label>
                              <Input 
                                id="confirmPassword" 
                                name="confirmPassword" 
                                type="password" 
                                required 
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsPasswordDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button 
                                type="submit" 
                                className="bg-renti-teal hover:bg-renti-teal/90"
                                disabled={changePasswordMutation.isPending}
                              >
                                {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                      <div>
                        <h4 className="font-medium text-red-900">Delete Account</h4>
                        <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                      </div>
                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove your data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteAccountMutation.mutate()}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteAccountMutation.isPending}
                            >
                              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}