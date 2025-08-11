import {
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  Notification,
  Review,
  InsertUser,
  InsertCategory,
  InsertProduct,
  InsertOrder,
  InsertOrderItem,
  InsertPayment,
  InsertNotification,
  InsertReview,
} from "@shared/schema";
import session from "express-session";
import MemoryStore from "memorystore";
import { generateOtp, sendOtpEmail, sendWelcomeEmail } from "./email-service";
import { nanoid } from "nanoid";
import { IStorage } from "./storage";

const MemSessionStore = MemoryStore(session);

export class MemoryStorage implements IStorage {
  sessionStore: any;
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();
  private orderItems: Map<string, OrderItem> = new Map();
  private payments: Map<string, Payment> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private reviews: Map<string, Review> = new Map();

  constructor() {
    this.sessionStore = new MemSessionStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create sample data for development
    this.initSampleData();
  }

  private initSampleData() {
    // Add sample categories
    const electronicsId = nanoid();
    const furnitureId = nanoid();
    
    this.categories.set(electronicsId, {
      id: electronicsId,
      name: "Electronics",
      description: "Electronic equipment and gadgets",
      createdAt: new Date()
    });
    
    this.categories.set(furnitureId, {
      id: furnitureId,
      name: "Furniture",
      description: "Furniture and home decor items",
      createdAt: new Date()
    });

    // Add sample products
    const laptopId = nanoid();
    this.products.set(laptopId, {
      id: laptopId,
      name: "MacBook Pro 16\"",
      description: "High-performance laptop for professionals",
      categoryId: electronicsId,
      brand: "Apple",
      isRentable: true,
      availableUnits: 5,
      basePrice: "50.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 30,
      images: [],
      specifications: { ram: "16GB", storage: "512GB SSD" },
      isActive: true,
      createdAt: new Date()
    });

    const chairId = nanoid();
    this.products.set(chairId, {
      id: chairId,
      name: "Ergonomic Office Chair",
      description: "Comfortable office chair with lumbar support",
      categoryId: furnitureId,
      brand: "Herman Miller",
      isRentable: true,
      availableUnits: 10,
      basePrice: "25.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 90,
      images: [],
      specifications: { material: "Mesh", adjustable: true },
      isActive: true,
      createdAt: new Date()
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = nanoid();
    const user: User = {
      id,
      username: userData.username,
      email: userData.email,
      password: userData.password,
      fullName: userData.fullName,
      phone: userData.phone || null,
      role: userData.role || "customer",
      isEmailVerified: userData.isEmailVerified || false,
      emailVerificationOtp: userData.emailVerificationOtp || null,
      otpExpiresAt: userData.otpExpiresAt || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // OTP methods removed - direct authentication without email verification

  // Order with items methods
  async getOrderWithItems(orderId: string): Promise<any> {
    const order = this.orders.get(orderId);
    if (!order) return null;
    
    const orderItemsList = Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
    return { ...order, items: orderItemsList };
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const id = generateId();
    const newOrderItem = { id, ...orderItem };
    this.orderItems.set(id, newOrderItem);
    return newOrderItem;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(orderId);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status: status as any };
    this.orders.set(orderId, updatedOrder);
    return updatedOrder;
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.orderId === orderId);
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = nanoid();
    const category: Category = {
      id,
      ...categoryData,
      createdAt: new Date()
    };
    this.categories.set(id, category);
    return category;
  }

  // Product methods
  async getProducts(filters: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ products: Product[]; total: number }> {
    const { categoryId, search, isActive = true, limit = 20, offset = 0 } = filters;

    let products = Array.from(this.products.values());

    // Apply filters
    if (categoryId) {
      products = products.filter(p => p.categoryId === categoryId);
    }
    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (isActive !== undefined) {
      products = products.filter(p => p.isActive === isActive);
    }

    // Sort by creation date (newest first)
    products.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = products.length;
    const paginatedProducts = products.slice(offset, offset + limit);

    return { products: paginatedProducts, total };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const id = nanoid();
    const product: Product = {
      id,
      ...productData,
      createdAt: new Date()
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct = { ...product, ...updates };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Order methods
  async getOrders(filters: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const { customerId, status, limit = 20, offset = 0 } = filters;

    let orders = Array.from(this.orders.values());

    // Apply filters
    if (customerId) {
      orders = orders.filter(o => o.customerId === customerId);
    }
    if (status) {
      orders = orders.filter(o => o.status === status);
    }

    // Sort by creation date (newest first)
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = orders.length;
    const paginatedOrders = orders.slice(offset, offset + limit);

    return { orders: paginatedOrders, total };
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const id = nanoid();
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const order: Order = {
      id,
      orderNumber,
      ...orderData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async addOrderItem(orderItemData: InsertOrderItem): Promise<OrderItem> {
    const id = nanoid();
    const orderItem: OrderItem = {
      id,
      ...orderItemData
    };
    this.orderItems.set(id, orderItem);
    return orderItem;
  }

  // Payment methods
  async getPayments(orderId?: string): Promise<Payment[]> {
    let payments = Array.from(this.payments.values());
    if (orderId) {
      payments = payments.filter(p => p.orderId === orderId);
    }
    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const id = nanoid();
    const payment: Payment = {
      id,
      ...paymentData,
      createdAt: new Date()
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const payment = this.payments.get(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...updates };
    this.payments.set(id, updatedPayment);
    return updatedPayment;
  }

  // Notification methods
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values()).filter(n => n.userId === userId);
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }
    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = nanoid();
    const notification: Notification = {
      id,
      ...notificationData,
      createdAt: new Date()
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    this.notifications.set(id, { ...notification, isRead: true });
    return true;
  }

  // Analytics methods
  async getDashboardStats(userId?: string): Promise<{
    totalRevenue: number;
    activeRentals: number;
    totalProducts: number;
    totalCustomers: number;
  }> {
    const completedOrders = Array.from(this.orders.values()).filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);

    const activeRentals = Array.from(this.orders.values()).filter(o => o.status === 'active').length;
    const totalProducts = Array.from(this.products.values()).filter(p => p.isActive).length;
    const totalCustomers = Array.from(this.users.values()).filter(u => u.role === 'customer').length;

    return {
      totalRevenue,
      activeRentals,
      totalProducts,
      totalCustomers,
    };
  }

  // Reviews methods
  async createReview(reviewData: InsertReview): Promise<Review> {
    const id = nanoid();
    const review: Review = {
      id,
      ...reviewData,
      createdAt: new Date()
    };
    this.reviews.set(id, review);
    return review;
  }

  async getProductReviews(productId: string): Promise<Review[]> {
    return Array.from(this.reviews.values())
      .filter(r => r.productId === productId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteReview(id: string): Promise<void> {
    this.reviews.delete(id);
  }

  // Admin methods
  async getAllUsers(filters?: {
    role?: string;
    isBanned?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    let userList = Array.from(this.users.values());
    
    if (filters?.role) {
      userList = userList.filter(u => u.role === filters.role);
    }
    
    if (filters?.isBanned !== undefined) {
      userList = userList.filter(u => u.isBanned === filters.isBanned);
    }
    
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      userList = userList.filter(u => 
        u.fullName.toLowerCase().includes(searchTerm) ||
        u.email.toLowerCase().includes(searchTerm) ||
        u.username.toLowerCase().includes(searchTerm)
      );
    }
    
    const total = userList.length;
    
    if (filters?.offset) {
      userList = userList.slice(filters.offset);
    }
    
    if (filters?.limit) {
      userList = userList.slice(0, filters.limit);
    }
    
    return { users: userList, total };
  }

  async banUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isBanned: true };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async unbanUser(userId: string): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, isBanned: false };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    recentUsers: User[];
    recentOrders: Order[];
  }> {
    const totalUsers = this.users.size;
    const totalProducts = this.products.size;
    const totalOrders = this.orders.size;
    
    const completedOrders = Array.from(this.orders.values()).filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0);
    
    const recentUsers = Array.from(this.users.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    
    const recentOrders = Array.from(this.orders.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);
    
    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentUsers,
      recentOrders
    };
  }

  async getAllOrdersAdmin(filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }> {
    let orderList = Array.from(this.orders.values());
    
    if (filters?.status) {
      orderList = orderList.filter(o => o.status === filters.status);
    }
    
    const total = orderList.length;
    
    if (filters?.offset) {
      orderList = orderList.slice(filters.offset);
    }
    
    if (filters?.limit) {
      orderList = orderList.slice(0, filters.limit);
    }
    
    return { orders: orderList, total };
  }

  async getAllProductsAdmin(filters?: {
    categoryId?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    let productList = Array.from(this.products.values());
    
    if (filters?.categoryId) {
      productList = productList.filter(p => p.categoryId === filters.categoryId);
    }
    
    if (filters?.createdBy) {
      productList = productList.filter(p => p.createdBy === filters.createdBy);
    }
    
    const total = productList.length;
    
    if (filters?.offset) {
      productList = productList.slice(filters.offset);
    }
    
    if (filters?.limit) {
      productList = productList.slice(0, filters.limit);
    }
    
    return { products: productList, total };
  }
}
