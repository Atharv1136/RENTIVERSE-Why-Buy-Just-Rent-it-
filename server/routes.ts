import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertCategorySchema, insertOrderSchema, insertOrderItemSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import Razorpay from "razorpay";
import { NotificationService } from "./notification-service";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Initialize services
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  
  const notificationService = new NotificationService(storage);

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const { 
        categoryId, 
        search, 
        page = "1", 
        limit = "20",
        isActive = "true"
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const result = await storage.getProducts({
        categoryId: categoryId as string,
        search: search as string,
        isActive: isActive === "true",
        limit: parseInt(limit as string),
        offset
      });

      res.json({
        ...result,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product reviews endpoints
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const reviews = await storage.getProductReviews(req.params.id);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/reviews", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const reviewData = {
        userId: req.user!.id,
        productId: req.params.id,
        rating: parseInt(req.body.rating),
        comment: req.body.comment
      };

      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Object storage upload endpoints
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/product-images", async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.imageURL,
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      console.log('Received product data:', req.body);
      
      // Create a more flexible product schema for user-created products
      const userProductData = {
        name: req.body.name,
        description: req.body.description || "",
        categoryId: req.body.categoryId,
        basePrice: req.body.basePrice.toString(), // Convert to string for decimal
        availableUnits: parseInt(req.body.availableUnits),
        rentalDuration: req.body.rentalDuration,
        minRentalPeriod: parseInt(req.body.minRentalPeriod),
        location: req.body.location || "",
        isActive: true,
        createdBy: req.user!.id,
        isRentable: true,
        images: [],
        specifications: {}
      };

      console.log('Processed product data:', userProductData);
      const product = await storage.createProduct(userProductData);
      res.status(201).json(product);
    } catch (error: any) {
      console.error('Product creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const { images, ...otherUpdates } = req.body;
      const updates = {
        ...otherUpdates,
        images: Array.isArray(images) ? images : []
      };
      const product = await storage.updateProduct(req.params.id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const success = await storage.deleteProduct(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { 
        status, 
        page = "1", 
        limit = "20" 
      } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filters: any = {
        status: status as string,
        limit: parseInt(limit as string),
        offset
      };

      // If customer, only show their orders
      if (req.user?.role === 'customer') {
        filters.customerId = req.user.id;
      }

      const result = await storage.getOrders(filters);

      res.json({
        ...result,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const order = await storage.getOrderWithItems(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if customer can access this order
      if (req.user?.role === 'customer' && order.customerId !== req.user.id) {
        return res.sendStatus(403);
      }

      res.json(order);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const orderSchema = insertOrderSchema.omit({ orderNumber: true }).extend({
        startDate: z.string().transform(str => new Date(str)),
        endDate: z.string().transform(str => new Date(str)),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number(),
          dailyRate: z.string().or(z.number()),
          totalPrice: z.string().or(z.number())
        }))
      });

      const { items, ...orderData } = orderSchema.parse(req.body);
      
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      // Set customer ID for customer users
      if (req.user?.role === 'customer') {
        orderData.customerId = req.user.id;
      }

      const order = await storage.createOrder({
        ...orderData,
        orderNumber
      });

      // Create order items
      for (const item of items) {
        await storage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.dailyRate.toString(),
          totalPrice: item.totalPrice.toString()
        });
      }

      // Send notifications for rental creation
      try {
        for (const item of items) {
          const product = await storage.getProduct(item.productId);
          if (product) {
            const rentalPeriod = `${new Date(orderData.startDate).toDateString()} - ${new Date(orderData.endDate).toDateString()}`;
            
            // Note: For now, we'll assume the owner is an admin user
            // In a real system, products would have an ownerId field
            const adminUsersResult = await storage.getAllUsers({ role: 'admin' });
            const ownerId = adminUsersResult.users.length > 0 ? adminUsersResult.users[0].id : orderData.customerId;
            
            await notificationService.notifyRentalCreated(
              order.id,
              orderData.customerId,
              ownerId,
              product.name,
              orderNumber,
              rentalPeriod
            );
          }
        }
      } catch (notificationError) {
        console.error("Failed to send rental notifications:", notificationError);
      }

      const orderWithItems = await storage.getOrderWithItems(order.id);
      res.status(201).json(orderWithItems);
    } catch (error: any) {
      console.error('Order creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const oldOrder = await storage.getOrderWithItems(req.params.id);
      
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Send notifications for status changes
      if (oldOrder && oldOrder.status !== status) {
        try {
          const orderItems = await storage.getOrderItems(order.id);
          for (const item of orderItems) {
            const product = await storage.getProduct(item.productId);
            if (product) {
              const adminUsersResult = await storage.getAllUsers({ role: 'admin' });
              const ownerId = adminUsersResult.users.length > 0 ? adminUsersResult.users[0].id : order.customerId;
              
              await notificationService.notifyRentalStatusChange(
                order.id,
                order.customerId,
                ownerId,
                product.name,
                order.orderNumber,
                status
              );
            }
          }
        } catch (notificationError) {
          console.error("Failed to send status change notifications:", notificationError);
        }
      }

      res.json(order);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard-stats", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      if (req.user?.role === 'customer') {
        // Get customer-specific stats
        const stats = await storage.getCustomerDashboardStats(req.user.id);
        res.json(stats);
      } else {
        // Default to general stats for admin/other roles
        const stats = await storage.getDashboardStats();
        res.json(stats);
      }
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { unreadOnly = "false" } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user!.id, 
        unreadOnly === "true"
      );
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const success = await storage.markNotificationRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.sendStatus(204);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product availability endpoint
  app.get("/api/products/:id/availability", async (req, res) => {
    try {
      const availabilityInfo = await notificationService.getProductAvailabilityInfo(req.params.id);
      res.json(availabilityInfo);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check product availability and notify interested user
  app.post("/api/products/:id/notify-availability", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      await notificationService.notifyProductAvailability(req.params.id, req.user!.id);
      res.json({ message: "You will be notified when this product becomes available" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes for cart checkout
  app.post("/api/payments/create-order", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { amount, orderId } = req.body;

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount, // amount in paise
        currency: "INR",
        receipt: `order_rcptid_${orderId}`,
      });

      res.json(razorpayOrder);
    } catch (error: any) {
      console.error('Razorpay order creation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/payments/verify", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const crypto = require('crypto');
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest("hex");

      if (razorpay_signature === expectedSign) {
        // Payment verified successfully
        await storage.updateOrder(orderId, { 
          status: "confirmed" as any,
        });

        // Create payment record
        const order = await storage.getOrder(orderId);
        if (order) {
          await storage.createPayment({
            orderId,
            amount: order.total,
            paymentMethod: "razorpay",
            transactionId: razorpay_payment_id,
            status: "completed",
            paidAt: new Date()
          });
        }

        res.json({ status: "success" });
      } else {
        res.status(400).json({ message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes - Razorpay integration (existing)
  app.post("/api/create-order-payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { orderId } = z.object({ orderId: z.string() }).parse(req.body);
      
      // Get order details
      const order = await storage.getOrderWithItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Check if customer can access this order
      if (req.user?.role === 'customer' && order.customerId !== req.user.id) {
        return res.sendStatus(403);
      }

      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(parseFloat(order.total) * 100), // Convert to paisa
        currency: "INR",
        receipt: order.orderNumber,
        notes: {
          orderId: order.id,
          customerName: req.user?.fullName || "",
        }
      });

      res.json({
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderDetails: order
      });

    } catch (error: any) {
      console.error("Payment creation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { 
        razorpayOrderId, 
        razorpayPaymentId, 
        razorpaySignature,
        orderId 
      } = z.object({
        razorpayOrderId: z.string(),
        razorpayPaymentId: z.string(),
        razorpaySignature: z.string(),
        orderId: z.string()
      }).parse(req.body);

      // Verify signature
      const crypto = await import('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (expectedSignature !== razorpaySignature) {
        return res.status(400).json({ message: "Invalid payment signature" });
      }

      // Get order details
      const order = await storage.getOrderWithItems(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create payment record
      const paymentData = {
        orderId: orderId,
        amount: order.total,
        paymentMethod: "razorpay",
        transactionId: razorpayPaymentId,
        status: "completed",
        paidAt: new Date()
      };

      const payment = await storage.createPayment(paymentData);

      // Update order status to confirmed
      await storage.updateOrderStatus(orderId, "confirmed");

      res.json({ 
        success: true, 
        payment, 
        message: "Payment verified successfully" 
      });

    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get payments for an order
  app.get("/api/orders/:orderId/payments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const payments = await storage.getOrderPayments(req.params.orderId);
      
      // Check if customer can access this order's payments
      if (req.user?.role === 'customer') {
        const order = await storage.getOrderWithItems(req.params.orderId);
        if (!order || order.customerId !== req.user.id) {
          return res.sendStatus(403);
        }
      }

      res.json(payments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Profile management endpoints
  app.put('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    try {
      const userId = req.user!.id;
      const { fullName, email, phone, address } = req.body;
      
      const updatedUser = await storage.updateUser(userId, {
        fullName,
        email,
        phone: phone || null,

      });
      
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/change-password', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password  
      const crypto = await import('crypto');
      const isCurrentPasswordValid = await new Promise<boolean>((resolve) => {
        crypto.scrypt(currentPassword, user.password.slice(0, 32), 32, (err, derivedKey) => {
          if (err) resolve(false);
          else resolve(user.password === user.password.slice(0, 32) + derivedKey.toString('hex'));
        });
      });
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      // Hash new password and update
      const bcrypt = await import('bcrypt');
      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      await storage.updateUser(userId, { password: newPasswordHash });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete('/api/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    try {
      const userId = req.user!.id;
      
      // Note: In a real app, you might want to soft delete or archive user data
      // For now, we'll just return success as we don't have a delete user method
      res.json({ message: "Account deletion requested" });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Product image upload endpoints
  app.post('/api/products/upload-image', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      // For now, return a placeholder upload URL
      const uploadURL = `/uploads/${req.user!.id}/${Date.now()}.jpg`;
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting product image upload URL:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.put('/api/products/:productId/image', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { productId } = req.params;
      const { imageURL } = req.body;
      
      if (!imageURL) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      // For now, just return the image URL as the path
      const imagePath = `/uploads/${req.user!.id}/${Date.now()}.jpg`;

      // Update product with image path
      const updatedProduct = await storage.updateProduct(productId, {
        imageUrl: imagePath
      });

      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({
        imagePath: imagePath,
        product: updatedProduct
      });
    } catch (error) {
      console.error("Error setting product image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve uploaded images (placeholder implementation)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    res.status(404).json({ error: "File not found" });
  });

  // Password reset endpoints
  app.post('/api/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // In a real app, you would:
      // 1. Check if user exists with this email
      // 2. Generate a secure reset token
      // 3. Store the token with expiration
      // 4. Send email with reset link
      
      // For demo purposes, we'll just return success
      res.json({ message: "Password reset link sent to email" });
    } catch (error) {
      console.error("Error sending password reset:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/validate-reset-token', async (req, res) => {
    try {
      const { token } = req.body;
      
      if (!token) {
        return res.status(400).json({ error: "Token is required" });
      }
      
      // In a real app, validate the token against stored tokens with expiration
      // For demo purposes, we'll accept any non-empty token
      res.json({ valid: true });
    } catch (error) {
      console.error("Error validating reset token:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ error: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" });
      }
      
      // In a real app, you would:
      // 1. Validate the token
      // 2. Find the user associated with the token
      // 3. Update their password
      // 4. Invalidate the token
      
      // For demo purposes, we'll just return success
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Reviews endpoints
  app.get('/api/products/:productId/reviews', async (req, res) => {
    try {
      const { productId } = req.params;
      const reviews = await storage.getProductReviews(productId);
      res.json(reviews);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/products/:productId/reviews', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { productId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user!.id;

      if (!rating || !comment) {
        return res.status(400).json({ error: "Rating and comment are required" });
      }

      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1 and 5" });
      }

      const review = await storage.createReview({
        userId,
        productId,
        rating: parseInt(rating),
        comment
      });

      res.status(201).json(review);
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Object storage routes for product images
  app.post('/api/objects/upload', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error creating upload URL:", error);
      res.status(500).json({ error: "Failed to create upload URL" });
    }
  });

  app.put('/api/products/:productId/image', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { productId } = req.params;
      const { imageURL } = req.body;

      if (!imageURL) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      const { ObjectStorageService } = await import('./objectStorage');
      const objectStorageService = new ObjectStorageService();
      const imagePath = objectStorageService.normalizeObjectEntityPath(imageURL);

      // Update product with image path
      const updatedProduct = await storage.updateProduct(productId, {
        images: [imagePath]
      });

      res.json({ imagePath, product: updatedProduct });
    } catch (error) {
      console.error("Error updating product image:", error);
      res.status(500).json({ error: "Failed to update product image" });
    }
  });

  // Razorpay payment endpoints
  app.post('/api/payments/create-order', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { amount, orderId } = req.body;
      
      if (!amount || !orderId) {
        return res.status(400).json({ error: "Amount and orderId are required" });
      }

      if (!process.env.VITE_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        return res.status(500).json({ error: "Razorpay configuration missing" });
      }

      const razorpay = new Razorpay({
        key_id: process.env.VITE_RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!
      });

      const options = {
        amount: amount, // amount in paise
        currency: 'INR',
        receipt: `order_${orderId}`,
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post('/api/payments/verify', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
      
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!);
      hmac.update(razorpay_order_id + '|' + razorpay_payment_id);
      const generated_signature = hmac.digest('hex');

      if (generated_signature === razorpay_signature) {
        // Payment is verified, update order status
        await storage.updateOrder(orderId, { status: 'confirmed' });
        res.json({ status: 'success' });
      } else {
        res.status(400).json({ status: 'failure', error: 'Invalid signature' });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin routes - User Management
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const { search, role, isBanned, page = "1", limit = "50" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filters: any = {};
      if (role) filters.role = role as string;
      if (isBanned !== undefined) filters.isBanned = isBanned === 'true';
      if (search) filters.search = search as string;
      filters.limit = parseInt(limit as string);
      filters.offset = offset;

      const result = await storage.getAllUsers(filters);
      res.json({
        ...result,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:userId/ban", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.banUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User banned successfully", user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:userId/unban", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const user = await storage.unbanUser(req.params.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User unbanned successfully", user });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/orders", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const { status, page = "1", limit = "50" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filters: any = {};
      if (status) filters.status = status as string;
      filters.limit = parseInt(limit as string);
      filters.offset = offset;

      const result = await storage.getAllOrdersAdmin(filters);
      res.json({
        ...result,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/products", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== 'admin') {
      return res.sendStatus(401);
    }

    try {
      const { categoryId, createdBy, page = "1", limit = "50" } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      
      const filters: any = {};
      if (categoryId) filters.categoryId = categoryId as string;
      if (createdBy) filters.createdBy = createdBy as string;
      filters.limit = parseInt(limit as string);
      filters.offset = offset;

      const result = await storage.getAllProductsAdmin(filters);
      res.json({
        ...result,
        page: parseInt(page as string),
        totalPages: Math.ceil(result.total / parseInt(limit as string))
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
