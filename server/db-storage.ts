import { db } from "./db";
import {
  User,
  Category,
  Product,
  Order,
  OrderItem,
  Payment,
  Notification,
  InsertUser,
  InsertCategory,
  InsertProduct,
  InsertOrder,
  InsertOrderItem,
  InsertPayment,
  InsertNotification,
  users,
  categories,
  products,
  orders,
  orderItems,
  payments,
  notifications
} from "@shared/schema";
import { eq, desc, count, ilike, and, sql } from "drizzle-orm";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { generateOtp, sendOtpEmail, sendWelcomeEmail } from "./email-service";
import { pool } from "./db";
import { IStorage } from "./storage";

const PgSession = ConnectPgSimple(session);

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

  // OTP methods removed - direct authentication without email verification

  // Order with items methods
  async getOrderWithItems(orderId: string): Promise<any> {
    const order = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (order.length === 0) return null;
    
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    return { ...order[0], items };
  }

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const result = await db.insert(orderItems).values(orderItem).returning();
    return result[0];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status: status as any }).where(eq(orders.id, orderId)).returning();
    return result[0];
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.orderId, orderId));
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
}