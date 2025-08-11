import {
  UserModel,
  CategoryModel,
  ProductModel,
  OrderModel,
  OrderItemModel,
  PaymentModel,
  NotificationModel
} from "./database";
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
  InsertNotification
} from "@shared/schema";
import session from "express-session";
import MongoStore from "connect-mongo";

const MONGODB_URL = "mongodb+srv://atharvbhosale00:Atharv%401136@cluster0.pr04amj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

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
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrderWithItems(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;

  // Order items methods
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: string): Promise<(OrderItem & { product: Product })[]>;

  // Payment methods
  createPayment(payment: InsertPayment): Promise<Payment>;
  getOrderPayments(orderId: string): Promise<Payment[]>;

  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, unreadOnly?: boolean): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<boolean>;

  // Analytics methods
  getDashboardStats(userId?: string): Promise<{
    totalRevenue: number;
    activeRentals: number;
    totalProducts: number;
    totalCustomers: number;
  }>;

  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = MongoStore.create({
      mongoUrl: MONGODB_URL,
      ttl: 14 * 24 * 60 * 60, // 14 days
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
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

    let query = db.select().from(products);
    let countQuery = db.select({ count: count() }).from(products);

    const conditions = [];
    if (isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive));
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }
    if (search) {
      conditions.push(ilike(products.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const [productsResult, totalResult] = await Promise.all([
      query.orderBy(desc(products.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);

    return {
      products: productsResult,
      total: totalResult[0].count as number
    };
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Order methods
  async getOrders(filters: {
    customerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ orders: Order[]; total: number }> {
    const { customerId, status, limit = 20, offset = 0 } = filters;

    let query = db.select().from(orders);
    let countQuery = db.select({ count: count() }).from(orders);

    const conditions = [];
    if (customerId) {
      conditions.push(eq(orders.customerId, customerId));
    }
    if (status) {
      conditions.push(eq(orders.status, status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
      countQuery = countQuery.where(and(...conditions));
    }

    const [ordersResult, totalResult] = await Promise.all([
      query.orderBy(desc(orders.createdAt)).limit(limit).offset(offset),
      countQuery
    ]);

    return {
      orders: ordersResult,
      total: totalResult[0].count as number
    };
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const orderNumber = `RT-${Date.now().toString().slice(-6)}`;
    const [newOrder] = await db
      .insert(orders)
      .values({ ...order, orderNumber })
      .returning();
    return newOrder;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [order] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return order || undefined;
  }

  async getOrderWithItems(id: string): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(id);
    return { ...order, orderItems: items };
  }

  // Order items methods
  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db
      .insert(orderItems)
      .values(orderItem)
      .returning();
    return newOrderItem;
  }

  async getOrderItems(orderId: string): Promise<(OrderItem & { product: Product })[]> {
    return await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        totalPrice: orderItems.totalPrice,
        product: products
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
  }

  // Payment methods
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getOrderPayments(orderId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.orderId, orderId))
      .orderBy(desc(payments.createdAt));
  }

  // Notification methods
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, unreadOnly = false): Promise<Notification[]> {
    let query = db.select().from(notifications);
    
    if (unreadOnly) {
      query = query.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    } else {
      query = query.where(eq(notifications.userId, userId));
    }

    return await query.orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics methods
  async getDashboardStats(userId?: string): Promise<{
    totalRevenue: number;
    activeRentals: number;
    totalProducts: number;
    totalCustomers: number;
  }> {
    // Get completed orders revenue
    const completedOrders = await db
      .select({ total: orders.total })
      .from(orders)
      .where(eq(orders.status, 'completed'));
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.total), 0);

    const activeRentalsResult = await db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'active'));

    const productsResult = await db
      .select({ count: count() })
      .from(products)
      .where(eq(products.isActive, true));

    const customersResult = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'customer'));

    return {
      totalRevenue,
      activeRentals: activeRentalsResult[0].count as number,
      totalProducts: productsResult[0].count as number,
      totalCustomers: customersResult[0].count as number,
    };
  }
}

export const storage = new DatabaseStorage();
