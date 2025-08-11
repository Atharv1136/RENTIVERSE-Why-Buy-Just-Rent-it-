import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Edit, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard-stats'],
    enabled: activeSection === 'overview'
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders', { status: selectedStatus }],
    enabled: activeSection === 'orders'
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', { search: searchTerm, isActive: true }],
    enabled: activeSection === 'products'
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ productId, imageURL }: { productId: string; imageURL: string }) => {
      return apiRequest('PUT', `/api/products/${productId}/image`, { imageURL });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      toast({ title: "Product image uploaded successfully!" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to upload image", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest('PUT', `/api/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: "Order status updated successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to update order status", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const res = await apiRequest('POST', '/api/products', productData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setIsAddProductOpen(false);
      toast({ title: "Product created successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create product", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const handleUpdateOrderStatus = (orderId: string, status: string) => {
    updateOrderMutation.mutate({ orderId, status });
  };

  const handleCreateProduct = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      brand: formData.get('brand'),
      basePrice: formData.get('basePrice'),
      availableUnits: parseInt(formData.get('availableUnits') as string),
      rentalDuration: formData.get('rentalDuration'),
      minRentalPeriod: parseInt(formData.get('minRentalPeriod') as string),
    };

    createProductMutation.mutate(productData);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-renti-navy mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Overview of your rental business performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-renti-navy">₹{(stats as any)?.totalRevenue || 0}</p>
                <p className="text-sm text-green-600">Total earned</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rentals</p>
                <p className="text-2xl font-bold text-renti-navy">{(stats as any)?.activeRentals || 0}</p>
                <p className="text-sm text-blue-600">Currently active</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-renti-navy">{(stats as any)?.totalProducts || 0}</p>
                <p className="text-sm text-gray-500">In inventory</p>
              </div>
              <div className="w-12 h-12 bg-renti-teal/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-boxes text-renti-teal text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customers</p>
                <p className="text-2xl font-bold text-renti-navy">{(stats as any)?.totalCustomers || 0}</p>
                <p className="text-sm text-green-600">Total registered</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold text-renti-navy">Recent Orders</CardTitle>
          <Button 
            variant="link" 
            onClick={() => setActiveSection('orders')}
            className="text-renti-teal"
          >
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (orders as any)?.orders?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders as any).orders.slice(0, 5).map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>{order.customer?.fullName || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{order.total}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">No recent orders found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-renti-navy">Order Management</h1>
      </div>

      {/* Order Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="quotation">Quotation</SelectItem>
                <SelectItem value="reserved">Reserved</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="picked_up">Picked Up</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button className="bg-renti-teal hover:bg-renti-teal/90">Filter</Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : (orders as any)?.orders?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rental Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(orders as any).orders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customer?.fullName || 'N/A'}</p>
                        <p className="text-sm text-gray-500">{order.customer?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(status) => handleUpdateOrderStatus(order.id, status)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="quotation">Quotation</SelectItem>
                          <SelectItem value="reserved">Reserved</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="picked_up">Picked Up</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="font-medium">₹{order.total}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button variant="outline" size="sm">
                          <i className="fas fa-edit"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">No orders found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-renti-navy">Product Management</h1>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="bg-renti-teal hover:bg-renti-teal/90">
              <i className="fas fa-plus mr-2"></i>Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" placeholder="Enter product name" required />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" name="brand" placeholder="Enter brand name" />
                </div>
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <Select name="categoryId">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: any) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="basePrice">Base Price (₹)</Label>
                  <Input id="basePrice" name="basePrice" type="number" placeholder="0" required />
                </div>
                <div>
                  <Label htmlFor="availableUnits">Available Units</Label>
                  <Input id="availableUnits" name="availableUnits" type="number" placeholder="1" required />
                </div>
                <div>
                  <Label htmlFor="rentalDuration">Rental Duration</Label>
                  <Select name="rentalDuration">
                    <SelectTrigger>
                      <SelectValue placeholder="Select Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="minRentalPeriod">Min Rental Period</Label>
                  <Input id="minRentalPeriod" name="minRentalPeriod" type="number" placeholder="1" required />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Enter product description" />
              </div>
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-renti-teal hover:bg-renti-teal/90"
                  disabled={createProductMutation.isPending}
                >
                  {createProductMutation.isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (products as any)?.products?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(products as any).products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-video bg-gray-200 relative group">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5485760} // 5MB
                    onGetUploadParameters={async () => {
                      const response = await apiRequest('POST', '/api/objects/upload');
                      const data = await response.json();
                      return {
                        method: 'PUT' as const,
                        url: data.uploadURL,
                      };
                    }}
                    onComplete={async (result) => {
                      if (result.successful && result.successful[0]) {
                        const uploadURL = result.successful[0].uploadURL;
                        await apiRequest('PUT', `/api/products/${product.id}/image`, {
                          imageURL: uploadURL
                        });
                        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
                        toast({ title: "Product image updated successfully" });
                      }
                    }}
                    buttonClassName="bg-white/90 hover:bg-white text-gray-800 text-sm px-3 py-1"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {product.imageUrl ? 'Change Image' : 'Add Image'}
                  </ObjectUploader>
                </div>
              </div>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-renti-navy">{product.name}</h3>
                  <Badge variant={product.isActive ? 'default' : 'secondary'}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-xl font-bold text-renti-teal">₹{product.basePrice}</span>
                    <span className="text-gray-500">/{product.rentalDuration}</span>
                  </div>
                  <span className="text-sm text-gray-600">{product.availableUnits} units</span>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1 bg-renti-teal hover:bg-renti-teal/90" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No products found. Create your first product to get started.
        </div>
      )}
    </div>
  );

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'orders', label: 'Orders', icon: 'fas fa-shopping-bag' },
    { id: 'products', label: 'Products', icon: 'fas fa-boxes' },
    { id: 'customers', label: 'Customers', icon: 'fas fa-users' },
    { id: 'reports', label: 'Reports', icon: 'fas fa-chart-bar' },
    { id: 'settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'orders':
        return renderOrders();
      case 'products':
        return renderProducts();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <nav className="space-y-2">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === item.id
                          ? 'text-renti-teal bg-renti-teal/10'
                          : 'text-gray-600 hover:text-renti-teal hover:bg-gray-50'
                      }`}
                    >
                      <i className={item.icon}></i>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
