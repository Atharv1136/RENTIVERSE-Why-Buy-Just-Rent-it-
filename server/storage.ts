import { storagePromise } from "./storage-init";
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
  InsertReview
} from "../shared/schema";

// Get storage instance (will be resolved during app startup)
export const storage = await storagePromise;

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // OTP methods removed - direct authentication
  
  // Order with items methods
  getOrderWithItems(orderId: string): Promise<any>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderStatus(orderId: string, status: string): Promise<Order | undefined>;
  getOrderPayments(orderId: string): Promise<Payment[]>;

  // Category methods
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Product methods
  getProducts(filters?: { 
    categoryId?: string; 
    search?: string; 
    isActive?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Order methods
  getOrders(filters?: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ orders: Order[]; total: number }>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  addOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;

  // Payment methods
  getPayments(orderId?: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;

  // Notification methods  
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<any[]>;
  createNotification(notification: InsertNotification): Promise<any>;
  markNotificationRead(id: string): Promise<boolean>;

  // Analytics methods
  getDashboardStats(userId?: string): Promise<{
    totalRevenue: number;
    activeRentals: number;
    totalProducts: number;
    totalCustomers: number;
  }>;

  // Reviews methods
  createReview(review: InsertReview): Promise<Review>;
  getProductReviews(productId: string): Promise<Review[]>;
  deleteReview(id: string): Promise<void>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PgSession({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // OTP methods
  async sendRegistrationOtp(email: string, fullName: string): Promise<void> {
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user record
    await db.update(users)
      .set({ 
        emailVerificationOtp: otp,
        otpExpiresAt: otpExpiresAt
      })
      .where(eq(users.email, email));

    // Send OTP email
    await sendOtpEmail(email, otp, fullName);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const user = await db.select()
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.emailVerificationOtp, otp),
          sql`${users.otpExpiresAt} > NOW()`
        )
      )
      .limit(1);

    if (user.length > 0) {
      // Mark user as verified and clear OTP
      await db.update(users)
        .set({
          isEmailVerified: true,
          emailVerificationOtp: null,
          otpExpiresAt: null
        })
        .where(eq(users.id, user[0].id));

      // Send welcome email
      await sendWelcomeEmail(email, user[0].fullName);
      return true;
    }

    return false;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(categoryData).returning();
    return result[0];
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

    const conditions = [];
    if (categoryId) conditions.push(eq(products.categoryId, categoryId));
    if (search) conditions.push(ilike(products.name, `%${search}%`));
    if (isActive !== undefined) conditions.push(eq(products.isActive, isActive));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [productResults, totalResults] = await Promise.all([
      db.select()
        .from(products)
        .where(whereClause)
        .orderBy(desc(products.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(products)
        .where(whereClause)
    ]);

    return {
      products: productResults,
      total: totalResults[0].count as number
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(productData: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(productData).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const result = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  async getProductWithSeller(id: string): Promise<any> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      categoryId: products.categoryId,
      basePrice: products.basePrice,
      availableUnits: products.availableUnits,
      rentalDuration: products.rentalDuration,
      minRentalPeriod: products.minRentalPeriod,
      location: products.location,
      imageUrl: products.imageUrl,
      images: products.images,
      specifications: products.specifications,
      isActive: products.isActive,
      isRentable: products.isRentable,
      createdAt: products.createdAt,
      seller: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        email: users.email
      }
    })
    .from(products)
    .leftJoin(users, eq(products.createdBy, users.id))
    .where(eq(products.id, id))
    .limit(1);

    return result[0];
  }

  // Order methods
  async getOrders(filters: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const { customerId, status, limit = 20, offset = 0 } = filters;

    const conditions = [];
    if (customerId) conditions.push(eq(orders.customerId, customerId));
    if (status) conditions.push(eq(orders.status, status as any));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [orderResults, totalResults] = await Promise.all([
      db.select()
        .from(orders)
        .where(whereClause)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(orders)
        .where(whereClause)
    ]);

    return {
      orders: orderResults,
      total: totalResults[0].count as number
    };
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return result[0];
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const result = await db.insert(orders).values({
      ...orderData,
      orderNumber
    }).returning();
    return result[0];
  }

  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const result = await db.update(orders)
      .set({ 
        ...updates, 
        updatedAt: new Date() 
      })
      .where(eq(orders.id, id))
      .returning();
    return result[0];
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async addOrderItem(orderItemData: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(orderItemData).returning();
    return result[0];
  }

  // Payment methods
  async getPayments(orderId?: string): Promise<Payment[]> {
    const whereClause = orderId ? eq(payments.orderId, orderId) : undefined;
    return await db.select()
      .from(payments)
      .where(whereClause)
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(paymentData: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(paymentData).returning();
    return result[0];
  }

  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const result = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return result[0];
  }

  // Notification methods
  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    const conditions = [eq(notifications.userId, userId)];
    if (unreadOnly) conditions.push(eq(notifications.isRead, false));

    return await db.select()
      .from(notifications)
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const result = await db.insert(notifications).values(notificationData).returning();
    return result[0];
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result.length > 0;
  }

  // Analytics methods
  async getDashboardStats(userId?: string): Promise<{
    totalRevenue: number;
    activeRentals: number;
    totalProducts: number;
    totalCustomers: number;
  }> {
    // Get completed orders for revenue
    const completedOrders = await db.select()
      .from(orders)
      .where(eq(orders.status, 'completed'));
    
    const totalRevenue = completedOrders.reduce((sum, order) => 
      sum + parseFloat(order.total.toString()), 0
    );

    const [activeRentalsResult, productsResult, customersResult] = await Promise.all([
      db.select({ count: count() })
        .from(orders)
        .where(eq(orders.status, 'active')),
      db.select({ count: count() })
        .from(products)
        .where(eq(products.isActive, true)),
      db.select({ count: count() })
        .from(users)
        .where(eq(users.role, 'customer'))
    ]);

    return {
      totalRevenue,
      activeRentals: activeRentalsResult[0].count as number,
      totalProducts: productsResult[0].count as number,
      totalCustomers: customersResult[0].count as number,
    };
  }

  // Reviews methods
  async createReview(reviewData: any): Promise<any> {
    const result = await db.insert(reviews).values(reviewData).returning();
    return result[0];
  }

  async getProductReviews(productId: string): Promise<any[]> {
    return await db.select({
      id: reviews.id,
      userId: reviews.userId,
      productId: reviews.productId,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      userName: users.username,
      userFullName: users.fullName
    })
    .from(reviews)
    .leftJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt));
  }

  async deleteReview(id: string): Promise<void> {
    await db.delete(reviews).where(eq(reviews.id, id));
  }
}

// Storage instance is exported above