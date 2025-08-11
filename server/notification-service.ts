import { IStorage } from "./storage";
import { InsertNotification } from "@shared/schema";

export interface NotificationMetadata {
  productName?: string;
  orderNumber?: string;
  rentalPeriod?: string;
  availabilityDate?: string;
  daysUntilAvailable?: number;
  ownerName?: string;
  renterName?: string;
  [key: string]: any;
}

export class NotificationService {
  constructor(private storage: IStorage) {}

  // Send notification when someone rents a product
  async notifyRentalCreated(
    orderId: string,
    renterId: string,
    ownerId: string,
    productName: string,
    orderNumber: string,
    rentalPeriod: string
  ): Promise<void> {
    const renterUser = await this.storage.getUser(renterId);
    const ownerUser = await this.storage.getUser(ownerId);

    if (!renterUser || !ownerUser) return;

    // Notify the renter
    await this.storage.createNotification({
      userId: renterId,
      title: "🎉 Rental Confirmed!",
      message: `Your rental of "${productName}" has been confirmed. Order #${orderNumber} is now active for ${rentalPeriod}.`,
      type: "rental",
      relatedEntityId: orderId,
      relatedEntityType: "order",
      metadata: JSON.stringify({
        productName,
        orderNumber,
        rentalPeriod,
        ownerName: ownerUser.fullName,
      } as NotificationMetadata),
    });

    // Notify the owner
    await this.storage.createNotification({
      userId: ownerId,
      title: "📦 Your Product is Rented!",
      message: `${renterUser.fullName} has rented your "${productName}". Order #${orderNumber} for ${rentalPeriod}.`,
      type: "rental",
      relatedEntityId: orderId,
      relatedEntityType: "order",
      metadata: JSON.stringify({
        productName,
        orderNumber,
        rentalPeriod,
        renterName: renterUser.fullName,
      } as NotificationMetadata),
    });
  }

  // Send notification when rental status changes
  async notifyRentalStatusChange(
    orderId: string,
    renterId: string,
    ownerId: string,
    productName: string,
    orderNumber: string,
    newStatus: string
  ): Promise<void> {
    const renterUser = await this.storage.getUser(renterId);
    const ownerUser = await this.storage.getUser(ownerId);

    if (!renterUser || !ownerUser) return;

    const statusMessages: Record<string, { renter: string; owner: string; icon: string }> = {
      confirmed: {
        renter: `Your rental of "${productName}" is confirmed and ready for pickup.`,
        owner: `Rental of your "${productName}" has been confirmed by ${renterUser.fullName}.`,
        icon: "✅"
      },
      picked_up: {
        renter: `You have picked up "${productName}". Enjoy your rental!`,
        owner: `${renterUser.fullName} has picked up your "${productName}".`,
        icon: "📋"
      },
      returned: {
        renter: `Thank you for returning "${productName}" on time!`,
        owner: `Your "${productName}" has been returned by ${renterUser.fullName}.`,
        icon: "🔄"
      },
      completed: {
        renter: `Your rental of "${productName}" is now complete. Thank you for renting with us!`,
        owner: `Rental of your "${productName}" has been completed successfully.`,
        icon: "🎯"
      },
      cancelled: {
        renter: `Your rental of "${productName}" has been cancelled.`,
        owner: `Rental of your "${productName}" has been cancelled by ${renterUser.fullName}.`,
        icon: "❌"
      }
    };

    const messages = statusMessages[newStatus];
    if (!messages) return;

    // Notify the renter
    await this.storage.createNotification({
      userId: renterId,
      title: `${messages.icon} Rental Update`,
      message: messages.renter,
      type: "rental",
      relatedEntityId: orderId,
      relatedEntityType: "order",
      metadata: JSON.stringify({
        productName,
        orderNumber,
        status: newStatus,
        ownerName: ownerUser.fullName,
      } as NotificationMetadata),
    });

    // Notify the owner
    await this.storage.createNotification({
      userId: ownerId,
      title: `${messages.icon} Rental Update`,
      message: messages.owner,
      type: "rental",
      relatedEntityId: orderId,
      relatedEntityType: "order",
      metadata: JSON.stringify({
        productName,
        orderNumber,
        status: newStatus,
        renterName: renterUser.fullName,
      } as NotificationMetadata),
    });
  }

  // Calculate product availability and send notifications
  async notifyProductAvailability(
    productId: string,
    interestedUserId?: string
  ): Promise<void> {
    const product = await this.storage.getProduct(productId);
    if (!product) return;

    // Get active orders for this product
    const activeOrders = await this.storage.getOrders({
      customerId: undefined,
      status: "active",
      limit: 100,
      offset: 0
    });

    // Filter orders that contain this product
    let rentedQuantity = 0;
    let earliestReturnDate: Date | null = null;

    for (const order of activeOrders.orders) {
      const orderItems = await this.storage.getOrderItems(order.id);
      const productItem = orderItems.find(item => item.productId === productId);
      
      if (productItem) {
        rentedQuantity += productItem.quantity;
        
        // Track the earliest return date
        if (!earliestReturnDate || order.endDate < earliestReturnDate) {
          earliestReturnDate = order.endDate;
        }
      }
    }

    const availableUnits = product.availableUnits - rentedQuantity;
    const isAvailable = availableUnits > 0;

    // If product is not available and we have an interested user
    if (!isAvailable && interestedUserId && earliestReturnDate) {
      const daysUntilAvailable = Math.ceil(
        (earliestReturnDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      await this.storage.createNotification({
        userId: interestedUserId,
        title: "📅 Product Availability Update",
        message: `"${product.name}" is currently not available. It will be restocked in approximately ${daysUntilAvailable} days.`,
        type: "availability",
        relatedEntityId: productId,
        relatedEntityType: "product",
        metadata: JSON.stringify({
          productName: product.name,
          daysUntilAvailable,
          availabilityDate: earliestReturnDate.toDateString(),
          currentlyRented: rentedQuantity,
          totalUnits: product.availableUnits,
        } as NotificationMetadata),
      });
    }

    // If product becomes available, notify waiting users (this would require a waiting list feature)
    if (isAvailable && availableUnits === 1) {
      // Product just became available
      await this.notifyProductBackInStock(productId, product.name);
    }
  }

  // Notify when product is back in stock
  private async notifyProductBackInStock(productId: string, productName: string): Promise<void> {
    // Get users who might be interested (this could be enhanced with a wishlist/waitlist feature)
    // For now, we'll just notify recent users who viewed the product
    
    const product = await this.storage.getProduct(productId);
    if (!product) return;

    // This is a simplified notification - in a real system, you'd maintain a waitlist
    console.log(`Product "${productName}" is back in stock!`);
  }

  // Send reminder notifications
  async sendRentalReminders(): Promise<void> {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Get active orders ending tomorrow
    const activeOrders = await this.storage.getOrders({
      customerId: undefined,
      status: "active",
      limit: 100,
      offset: 0
    });

    for (const order of activeOrders.orders) {
      const endDate = new Date(order.endDate);
      
      // Check if rental ends tomorrow
      if (endDate.toDateString() === tomorrow.toDateString()) {
        const renter = await this.storage.getUser(order.customerId);
        if (!renter) continue;

        const orderItems = await this.storage.getOrderItems(order.id);
        const productNames = [];
        
        for (const item of orderItems) {
          const product = await this.storage.getProduct(item.productId);
          if (product) {
            productNames.push(product.name);
          }
        }

        await this.storage.createNotification({
          userId: order.customerId,
          title: "⏰ Rental Return Reminder",
          message: `Your rental of ${productNames.join(", ")} ends tomorrow. Please prepare for return.`,
          type: "warning",
          relatedEntityId: order.id,
          relatedEntityType: "order",
          metadata: JSON.stringify({
            orderNumber: order.orderNumber,
            endDate: endDate.toDateString(),
            productNames,
          } as NotificationMetadata),
        });
      }
    }
  }

  // Get product availability info
  async getProductAvailabilityInfo(productId: string): Promise<{
    isAvailable: boolean;
    availableUnits: number;
    totalUnits: number;
    rentedUnits: number;
    nextAvailableDate?: Date;
    daysUntilAvailable?: number;
  }> {
    const product = await this.storage.getProduct(productId);
    if (!product) {
      return {
        isAvailable: false,
        availableUnits: 0,
        totalUnits: 0,
        rentedUnits: 0,
      };
    }

    // Get active orders for this product
    const activeOrders = await this.storage.getOrders({
      customerId: undefined,
      status: "active",
      limit: 100,
      offset: 0
    });

    let rentedUnits = 0;
    let earliestReturnDate: Date | null = null;

    for (const order of activeOrders.orders) {
      const orderItems = await this.storage.getOrderItems(order.id);
      const productItem = orderItems.find(item => item.productId === productId);
      
      if (productItem) {
        rentedUnits += productItem.quantity;
        
        if (!earliestReturnDate || order.endDate < earliestReturnDate) {
          earliestReturnDate = order.endDate;
        }
      }
    }

    const availableUnits = product.availableUnits - rentedUnits;
    const isAvailable = availableUnits > 0;

    const result = {
      isAvailable,
      availableUnits: Math.max(0, availableUnits),
      totalUnits: product.availableUnits,
      rentedUnits,
    };

    if (!isAvailable && earliestReturnDate) {
      const daysUntilAvailable = Math.ceil(
        (earliestReturnDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      
      return {
        ...result,
        nextAvailableDate: earliestReturnDate,
        daysUntilAvailable: Math.max(0, daysUntilAvailable),
      };
    }

    return result;
  }
}