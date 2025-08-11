import { z } from "zod";
import { pgTable, text, boolean, integer, timestamp, decimal, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { nanoid } from "nanoid";

// Enums
export const userRoleEnum = pgEnum("user_role", ["customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "quotation", "reserved", "confirmed", "picked_up", 
  "active", "returned", "completed", "cancelled"
]);
export const rentalDurationEnum = pgEnum("rental_duration", [
  "hourly", "daily", "weekly", "monthly", "yearly"
]);

export type UserRole = "customer" | "admin";
export type OrderStatus = "quotation" | "reserved" | "confirmed" | "picked_up" | "active" | "returned" | "completed" | "cancelled";
export type RentalDuration = "hourly" | "daily" | "weekly" | "monthly" | "yearly";

// Tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  isEmailVerified: boolean("is_email_verified").notNull().default(false),
  emailVerificationOtp: text("email_verification_otp"),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  name: text("name").notNull(),
  description: text("description"),
  categoryId: text("category_id").references(() => categories.id),
  brand: text("brand"),
  isRentable: boolean("is_rentable").notNull().default(true),
  availableUnits: integer("available_units").notNull().default(1),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  rentalDuration: rentalDurationEnum("rental_duration").notNull().default("daily"),
  minRentalPeriod: integer("min_rental_period").notNull().default(1),
  maxRentalPeriod: integer("max_rental_period"),
  location: text("location"), // Add location field for user products
  imageUrl: text("image_url"), // Add single image URL for uploads
  images: json("images").$type<string[]>().notNull().default([]),
  specifications: json("specifications").$type<Record<string, any>>().notNull().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: text("created_by").references(() => users.id), // Track who created the product
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id").notNull().references(() => users.id),
  status: orderStatusEnum("status").notNull().default("quotation"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderId: text("order_id").notNull().references(() => orders.id),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  orderId: text("order_id").notNull().references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  status: text("status").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviews = pgTable("reviews", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id").notNull().references(() => users.id),
  productId: text("product_id").notNull().references(() => products.id),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Drizzle schemas
export const insertUserSchema = createInsertSchema(users);
export const insertCategorySchema = createInsertSchema(categories);
export const insertProductSchema = createInsertSchema(products);
export const insertOrderSchema = createInsertSchema(orders);
export const insertOrderItemSchema = createInsertSchema(orderItems);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertNotificationSchema = createInsertSchema(notifications);

export const selectUserSchema = createSelectSchema(users);
export const selectCategorySchema = createSelectSchema(categories);
export const selectProductSchema = createSelectSchema(products);
export const selectOrderSchema = createSelectSchema(orders);
export const selectOrderItemSchema = createSelectSchema(orderItems);
export const selectPaymentSchema = createSelectSchema(payments);
export const selectNotificationSchema = createSelectSchema(notifications);
export const selectReviewSchema = createSelectSchema(reviews);

// Registration with OTP schema
export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1).max(100),
  phone: z.string().optional(),
});

// Inferred types
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Review = typeof reviews.$inferSelect;

export type InsertUser = typeof users.$inferInsert;
export type InsertCategory = typeof categories.$inferInsert;
export type InsertProduct = typeof products.$inferInsert;
export type InsertOrder = typeof orders.$inferInsert;
export type InsertOrderItem = typeof orderItems.$inferInsert;
export type InsertPayment = typeof payments.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;
export type InsertReview = typeof reviews.$inferInsert;

export type RegisterUser = z.infer<typeof registerSchema>;
