import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/navigation";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useCart } from "@/context/CartContext";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Separator } from "@/components/ui/separator";
import { PDFQuotationGenerator } from "@/components/PDFQuotation";
import { Package, Plus, Upload, ShoppingCart, Eye, Download, FileText, User, Calendar, MapPin, Trash2, Minus, CheckCircle } from "lucide-react";
import { getProductImage } from "@/utils/product-images";
import { Link } from "wouter";
import { Footer } from "@/components/Footer";

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addToCart, getItemCount, items: cartItems, clearCart } = useCart();
  const [activeSection, setActiveSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productImageURL, setProductImageURL] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', searchTerm, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all' && selectedCategory !== '') {
        params.append('categoryId', selectedCategory);
      }
      params.append('isActive', 'true');
      
      return fetch(`/api/products?${params.toString()}`).then(res => res.json());
    },
    enabled: activeSection === 'products'
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/orders'],
    enabled: activeSection === 'rentals'
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard-stats'],
    enabled: activeSection === 'overview',
    refetchInterval: 30000, // Refresh every 30 seconds for real-time updates
    refetchOnWindowFocus: true,
    staleTime: 0 // Always refetch when component mounts
  });

  const createProductMutation = useMutation({
    mutationFn: async (productData: any) => {
      const response = await apiRequest('POST', '/api/products', productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard-stats'] });
      setIsAddProductOpen(false);
      toast({ title: "Product created successfully!" });
    },
    onError: (error: any) => {
      console.error('Product creation error:', error);
      toast({ 
        title: "Error creating product", 
        description: error.message || "Please check all required fields",
        variant: "destructive"
      });
    }
  });

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      categoryId: formData.get('categoryId'),
      basePrice: Number(formData.get('basePrice')),
      availableUnits: Number(formData.get('availableUnits')),
      rentalDuration: formData.get('rentalDuration'),
      minRentalPeriod: Number(formData.get('minRentalPeriod')),
      location: formData.get('location'),
      imageUrl: productImageURL, // Add uploaded image URL
      isActive: true
    };
    
    createProductMutation.mutate(productData);
  };

  const handleViewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setIsOrderDetailOpen(true);
  };

  const handleDownloadPDF = (order: any) => {
    const orderDetails = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: user?.fullName || user?.username || 'Customer',
      customerEmail: user?.email || 'customer@example.com',
      items: order.items || [
        {
          id: order.id,
          productName: order.productName || 'Product',
          quantity: 1,
          price: parseFloat(order.total) || 0,
          duration: order.rentalDuration || 'daily'
        }
      ],
      total: parseFloat(order.total) || 0,
      startDate: order.startDate,
      endDate: order.endDate,
      createdAt: order.createdAt,
      status: order.status
    };
    
    PDFQuotationGenerator.downloadQuotation(orderDetails);
  };

  const handleViewPDF = (order: any) => {
    const orderDetails = {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: user?.fullName || user?.username || 'Customer',
      customerEmail: user?.email || 'customer@example.com',
      items: order.items || [
        {
          id: order.id,
          productName: order.productName || 'Product',
          quantity: 1,
          price: parseFloat(order.total) || 0,
          duration: order.rentalDuration || 'daily'
        }
      ],
      total: parseFloat(order.total) || 0,
      startDate: order.startDate,
      endDate: order.endDate,
      createdAt: order.createdAt,
      status: order.status
    };
    
    PDFQuotationGenerator.viewQuotation(orderDetails);
  };

  const handleViewProductDetails = (product: any) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

  // Mock data for product details
  const generateMockProductData = (product: any) => {
    // Generate product-specific images based on product name and category
    const getProductImages = (productName: string, categoryName: string) => {
      const name = productName.toLowerCase();
      const category = categoryName?.toLowerCase() || '';
      
      // Camera equipment
      if (name.includes('camera') || name.includes('lens') || name.includes('photography')) {
        return [
          'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400&q=80',
          'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&q=80',
          'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
          'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80'
        ];
      }
      
      // Laptop/Computer equipment
      if (name.includes('laptop') || name.includes('computer') || name.includes('macbook')) {
        return [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80',
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80'
        ];
      }
      
      // Car/Vehicle rentals
      if (name.includes('car') || name.includes('vehicle') || name.includes('auto')) {
        return [
          'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80',
          'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=80',
          'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80',
          'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?w=400&q=80'
        ];
      }
      
      // Tools/Equipment
      if (name.includes('drill') || name.includes('tool') || name.includes('equipment')) {
        return [
          'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400&q=80',
          'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=80',
          'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400&q=80',
          'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80'
        ];
      }
      
      // Musical instruments
      if (name.includes('guitar') || name.includes('piano') || name.includes('music') || name.includes('instrument')) {
        return [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
          'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400&q=80',
          'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&q=80',
          'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&q=80'
        ];
      }
      
      // Gaming equipment
      if (name.includes('gaming') || name.includes('console') || name.includes('xbox') || name.includes('playstation')) {
        return [
          'https://images.unsplash.com/photo-1486401899868-0e435edeabfa?w=400&q=80',
          'https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&q=80',
          'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400&q=80',
          'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=400&q=80'
        ];
      }
      
      // Furniture
      if (name.includes('chair') || name.includes('table') || name.includes('furniture') || name.includes('desk')) {
        return [
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&q=80',
          'https://images.unsplash.com/photo-1549497538-303791108f95?w=400&q=80',
          'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&q=80',
          'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&q=80'
        ];
      }
      
      // Electronics
      if (category.includes('electronic') || name.includes('speaker') || name.includes('headphone')) {
        return [
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&q=80',
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&q=80',
          'https://images.unsplash.com/photo-1545127398-14699f92334b?w=400&q=80'
        ];
      }
      
      // Default fallback images for unmatched products
      return [
        'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400&q=80',
        'https://images.unsplash.com/photo-1522444195799-478538b28823?w=400&q=80',
        'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&q=80',
        'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=400&q=80'
      ];
    };

    const mockImages = getProductImages(product.name, product.categoryName);

    const mockReviews = [
      { id: 1, user: 'Raj Patel', rating: 5, comment: 'Excellent quality and fast delivery!', date: '2024-01-15' },
      { id: 2, user: 'Priya Sharma', rating: 4, comment: 'Good product, value for money.', date: '2024-01-10' },
      { id: 3, user: 'Amit Kumar', rating: 5, comment: 'Highly recommended! Will rent again.', date: '2024-01-05' },
      { id: 4, user: 'Sneha Reddy', rating: 4, comment: 'Nice product, prompt service.', date: '2023-12-28' }
    ];

    const owners = ['TechRent Solutions', 'Premium Rentals', 'QuickRent Services', 'Elite Equipment'];
    
    return {
      ...product,
      images: mockImages,
      reviews: mockReviews,
      owner: owners[Math.floor(Math.random() * owners.length)],
      pricing: {
        daily: Math.floor(product.basePrice || 100),
        weekly: Math.floor((product.basePrice || 100) * 6),
        monthly: Math.floor((product.basePrice || 100) * 25)
      }
    };
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-renti-navy mb-2">
          Welcome back, {user?.fullName}!
        </h1>
        <p className="text-gray-600">Here's an overview of your rental activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Rentals</p>
                <p className="text-2xl font-bold text-renti-navy">{(stats as any)?.activeRentals || 0}</p>
              </div>
              <div className="w-12 h-12 bg-renti-teal/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-calendar-check text-renti-teal text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-renti-navy">{(stats as any)?.totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-renti-amber/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-shopping-cart text-renti-amber text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-renti-navy">₹{(stats as any)?.totalSpent || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-rupee-sign text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-renti-navy">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (orders as any)?.orders?.length ? (
            <div className="space-y-4">
              {(orders as any).orders.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">₹{order.total}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No orders found. Start browsing products to create your first rental order.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-renti-navy">Browse Products</h1>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="bg-renti-teal hover:bg-renti-teal/90">
              <Plus className="w-4 h-4 mr-2" />
              Add My Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProduct} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" name="name" placeholder="Enter product name" required />
                </div>
                <div>
                  <Label htmlFor="categoryId">Category</Label>
                  <select name="categoryId" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select Category</option>
                    {(categories as any)?.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="basePrice">Base Price (₹)</Label>
                  <Input id="basePrice" name="basePrice" type="number" placeholder="100" required />
                </div>
                <div>
                  <Label htmlFor="availableUnits">Available Units</Label>
                  <Input id="availableUnits" name="availableUnits" type="number" placeholder="1" required />
                </div>
                <div>
                  <Label htmlFor="minRentalPeriod">Min Rental Period</Label>
                  <Input id="minRentalPeriod" name="minRentalPeriod" type="number" placeholder="1" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="rentalDuration">Rental Duration</Label>
                  <select name="rentalDuration" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select Duration</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="Enter your location" required />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Describe your product" rows={3} />
              </div>
              
              {/* Image Upload Section */}
              <div>
                <Label>Product Image</Label>
                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={5242880} // 5MB
                  onGetUploadParameters={async () => {
                    const response = await apiRequest('/api/objects/upload', {
                      method: 'POST'
                    });
                    return {
                      method: 'PUT' as const,
                      url: response.uploadURL
                    };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      setProductImageURL(uploadURL);
                      toast({ title: "Image uploaded successfully!" });
                    }
                  }}
                  buttonClassName="w-full border-2 border-dashed border-gray-300 hover:border-renti-teal p-4 rounded-lg"
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Package className="h-8 w-8 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload product image</span>
                    {productImageURL && (
                      <span className="text-xs text-green-600">✓ Image uploaded</span>
                    )}
                  </div>
                </ObjectUploader>
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

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {(categories as any)?.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      {productsLoading ? (
        <div className="text-center py-8">Loading products...</div>
      ) : (products as any)?.products?.length ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(products as any).products.map((product: any) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200 relative">
                <img 
                  src={product.imageUrl || getProductImage(product.name)} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getProductImage(product.name);
                  }}
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-renti-navy mb-2">{product.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Owned by {product.ownerName || 'Product Owner'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-renti-teal">₹{product.basePrice}</span>
                    <span className="text-gray-500">/{product.rentalDuration}</span>
                  </div>
                  <Badge variant={product.availableUnits > 0 ? 'default' : 'secondary'}>
                    {product.availableUnits > 0 ? 'Available' : 'Out of Stock'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full hover:bg-renti-teal hover:text-white transition-all duration-300"
                    onClick={() => handleViewProductDetails(product)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button 
                    className="w-full bg-renti-teal hover:bg-renti-teal/90"
                    disabled={product.availableUnits === 0}
                    onClick={() => {
                      addToCart(product);
                      toast({
                        title: "Added to cart!",
                        description: `${product.name} has been added to your cart`
                      });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No products found. Try adjusting your search criteria.
        </div>
      )}
    </div>
  );

  const renderRentals = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-renti-navy">My Rentals</h1>

      {/* Cart Items (Pending Rentals) */}
      {cartItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-renti-teal">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Cart Items (Pending Rentals) - {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold text-renti-navy">{item.name}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                    <span className="text-sm text-gray-500">Duration: {item.rentalDurationDays} day{item.rentalDurationDays !== 1 ? 's' : ''}</span>
                    <span className="font-bold text-renti-teal">₹{Number(item.basePrice || 0) * item.quantity * item.rentalDurationDays}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Pending</Badge>
                  <Link href="/cart">
                    <Button size="sm" variant="outline">
                      Go to Cart
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">
                Total: ₹{cartItems.reduce((sum, item) => sum + (Number(item.basePrice || 0) * item.quantity * item.rentalDurationDays), 0)}
              </div>
              <Link href="/cart">
                <Button className="bg-renti-teal hover:bg-renti-teal/90">
                  Proceed to Checkout
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirmed Rental Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmed Rental Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="text-center py-8">Loading orders...</div>
          ) : (orders as any)?.orders?.length ? (
            <div className="space-y-4">
              {(orders as any).orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold text-renti-navy">Order #{order.orderNumber}</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(order.startDate).toLocaleDateString()} - {new Date(order.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Created: {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                        {order.status}
                      </Badge>
                      <p className="text-lg font-bold text-renti-navy mt-1">₹{order.total}</p>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewOrderDetails(order)}
                        className="flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewPDF(order)}
                          className="flex items-center text-xs"
                          title="View PDF"
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDownloadPDF(order)}
                          className="flex items-center text-xs"
                          title="Download PDF"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No confirmed rental orders yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help text when both cart and orders are empty */}
      {cartItems.length === 0 && (!(orders as any)?.orders?.length) && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Rentals Yet</h3>
            <p className="text-gray-500 mb-4">
              Browse our product catalog and add items to your cart to start renting!
            </p>
            <Button 
              onClick={() => setActiveSection('products')}
              className="bg-renti-teal hover:bg-renti-teal/90"
            >
              Browse Products
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-renti-navy">Profile Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input value={user?.fullName || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <Input value={user?.username || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input value={user?.email || ''} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <Input value={user?.phone || ''} readOnly />
            </div>
          </div>
          <Button className="bg-renti-teal hover:bg-renti-teal/90">
            Edit Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: 'fas fa-tachometer-alt' },
    { id: 'products', label: 'Browse Products', icon: 'fas fa-boxes' },
    { id: 'rentals', label: 'My Rentals', icon: 'fas fa-calendar-alt' },
    { id: 'profile', label: 'Profile', icon: 'fas fa-user' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return renderOverview();
      case 'products':
        return renderProducts();
      case 'rentals':
        return renderRentals();
      case 'profile':
        return renderProfile();
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

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailOpen} onOpenChange={setIsOrderDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Order Number</Label>
                  <p className="text-sm">{selectedOrder.orderNumber}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge variant={selectedOrder.status === 'completed' ? 'default' : 'secondary'}>
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Start Date</Label>
                  <p className="text-sm">{new Date(selectedOrder.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="font-semibold">End Date</Label>
                  <p className="text-sm">{new Date(selectedOrder.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div>
                <Label className="font-semibold">Order Total</Label>
                <p className="text-2xl font-bold text-renti-teal">₹{selectedOrder.total}</p>
              </div>

              <div>
                <Label className="font-semibold">Created</Label>
                <p className="text-sm">{new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
              </div>

              <div className="flex space-x-4">
                <Button 
                  onClick={() => handleViewPDF(selectedOrder)}
                  className="flex items-center bg-renti-teal hover:bg-renti-teal/90"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Quotation PDF
                </Button>
                <Button 
                  onClick={() => handleDownloadPDF(selectedOrder)}
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Product Details Modal */}
      <Dialog open={isProductDetailOpen} onOpenChange={setIsProductDetailOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-renti-navy">Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid lg:grid-cols-2 gap-8 overflow-y-auto max-h-[75vh]">
              {/* Left Column - Images */}
              <div className="space-y-4">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                  <img 
                    src={selectedProduct.imageUrl || getProductImage(selectedProduct.name)} 
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getProductImage(selectedProduct.name);
                    }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {generateMockProductData(selectedProduct).images.slice(1).map((image: string, index: number) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity cursor-pointer">
                      <img 
                        src={image} 
                        alt={`${selectedProduct.name} ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6">
                {/* Product Name & Owner */}
                <div className="animate-in slide-in-from-right-4 duration-500">
                  <h2 className="text-3xl font-bold text-renti-navy mb-2">{selectedProduct.name}</h2>
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4 text-renti-teal" />
                    <span>Owned by <strong className="text-renti-navy">{selectedProduct.ownerName || 'Product Owner'}</strong></span>
                  </div>
                </div>

                {/* Pricing Tiers */}
                <div className="animate-in slide-in-from-right-4 duration-700">
                  <h3 className="text-lg font-semibold text-renti-navy mb-4">Rental Pricing</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-2 hover:border-renti-teal transition-colors cursor-pointer group">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Per Day</div>
                        <div className="text-2xl font-bold text-renti-teal group-hover:scale-110 transition-transform">
                          ₹{selectedProduct.basePrice}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-2 hover:border-renti-teal transition-colors cursor-pointer group">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Per Week</div>
                        <div className="text-2xl font-bold text-renti-teal group-hover:scale-110 transition-transform">
                          ₹{Math.round(selectedProduct.basePrice * 7 * 0.86)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Save 14%</div>
                      </CardContent>
                    </Card>
                    <Card className="border-2 hover:border-renti-teal transition-colors cursor-pointer group">
                      <CardContent className="p-4 text-center">
                        <div className="text-sm text-gray-600 mb-1">Per Month</div>
                        <div className="text-2xl font-bold text-renti-teal group-hover:scale-110 transition-transform">
                          ₹{Math.round(selectedProduct.basePrice * 30 * 0.83)}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Save 17%</div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Product Details */}
                <div className="animate-in slide-in-from-right-4 duration-900">
                  <h3 className="text-lg font-semibold text-renti-navy mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <span className="text-sm text-gray-600">Location:</span>
                      <p className="font-medium">{selectedProduct.location}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Available Units:</span>
                      <p className="font-medium">{selectedProduct.availableUnits}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Min Rental:</span>
                      <p className="font-medium">{selectedProduct.minRentalPeriod} day(s)</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Category:</span>
                      <p className="font-medium">{selectedProduct.categoryName}</p>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div className="animate-in slide-in-from-right-4 duration-1100">
                  <h3 className="text-lg font-semibold text-renti-navy mb-4">Customer Reviews</h3>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {generateMockProductData(selectedProduct).reviews.map((review: any) => (
                      <Card key={review.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-medium text-renti-navy">{review.user}</h4>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <i 
                                    key={i} 
                                    className={`fas fa-star text-xs ${
                                      i < review.rating ? 'text-renti-amber' : 'text-gray-300'
                                    }`}
                                  ></i>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4 border-t animate-in slide-in-from-bottom-4 duration-1300">
                  <Button 
                    className="flex-1 bg-renti-teal hover:bg-renti-teal/90 transform hover:scale-105 transition-all duration-300"
                    disabled={selectedProduct.availableUnits === 0}
                    onClick={() => {
                      addToCart({
                        id: selectedProduct.id,
                        name: selectedProduct.name,
                        basePrice: selectedProduct.basePrice,
                        rentalDuration: selectedProduct.rentalDuration,
                        imageUrl: selectedProduct.imageUrl,
                        quantity: 1
                      });
                      setIsProductDetailOpen(false);
                      toast({ title: "Added to cart!" });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button 
                    variant="outline" 
                    className="px-6 hover:bg-renti-navy hover:text-white transition-all duration-300"
                    onClick={() => setIsProductDetailOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}
