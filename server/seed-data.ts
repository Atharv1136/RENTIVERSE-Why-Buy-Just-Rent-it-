import { storage } from "./storage";

export async function seedDatabase() {
  try {
    // Check if categories already exist
    const existingCategories = await storage.getCategories();
    if (existingCategories.length > 0) {
      console.log("📦 Database already has sample data");
      return;
    }

    console.log("🌱 Seeding database with sample data...");

    // Create categories
    const electronicsCategory = await storage.createCategory({
      name: "Electronics",
      description: "Electronic equipment and gadgets"
    });

    const furnitureCategory = await storage.createCategory({
      name: "Furniture", 
      description: "Furniture and home decor items"
    });

    const sportsCategory = await storage.createCategory({
      name: "Sports Equipment",
      description: "Sports and fitness equipment"
    });

    // Create sample products
    await storage.createProduct({
      name: "MacBook Pro 16\"",
      description: "High-performance laptop for professionals and creatives",
      categoryId: electronicsCategory.id,
      brand: "Apple",
      isRentable: true,
      availableUnits: 5,
      basePrice: "50.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 30,
      images: [],
      specifications: { 
        ram: "16GB", 
        storage: "512GB SSD",
        processor: "M3 Pro",
        display: "16-inch Liquid Retina XDR"
      },
      isActive: true
    });

    await storage.createProduct({
      name: "iPhone 15 Pro",
      description: "Latest iPhone with advanced camera system",
      categoryId: electronicsCategory.id,
      brand: "Apple",
      isRentable: true,
      availableUnits: 8,
      basePrice: "25.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 14,
      images: [],
      specifications: {
        storage: "128GB",
        camera: "48MP Pro camera system",
        display: "6.1-inch Super Retina XDR"
      },
      isActive: true
    });

    await storage.createProduct({
      name: "Ergonomic Office Chair",
      description: "Comfortable office chair with lumbar support",
      categoryId: furnitureCategory.id,
      brand: "Herman Miller",
      isRentable: true,
      availableUnits: 10,
      basePrice: "25.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 90,
      images: [],
      specifications: {
        material: "Mesh and fabric",
        adjustable: true,
        warranty: "12 years"
      },
      isActive: true
    });

    await storage.createProduct({
      name: "Standing Desk",
      description: "Height-adjustable standing desk for healthy work",
      categoryId: furnitureCategory.id,
      brand: "UPLIFT",
      isRentable: true,
      availableUnits: 6,
      basePrice: "35.00",
      rentalDuration: "daily",
      minRentalPeriod: 7,
      maxRentalPeriod: 180,
      images: [],
      specifications: {
        size: "60\" x 30\"",
        heightRange: "25.3\" - 50.9\"",
        weight: "120 lbs"
      },
      isActive: true
    });

    await storage.createProduct({
      name: "Road Bike",
      description: "Lightweight carbon fiber road bike for cycling enthusiasts",
      categoryId: sportsCategory.id,
      brand: "Trek",
      isRentable: true,
      availableUnits: 4,
      basePrice: "40.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 30,
      images: [],
      specifications: {
        frame: "Carbon fiber",
        gears: "22-speed",
        weight: "18 lbs",
        size: "Medium (54cm)"
      },
      isActive: true
    });

    await storage.createProduct({
      name: "Professional Camera Kit",
      description: "Complete DSLR camera kit with lenses and accessories",
      categoryId: electronicsCategory.id,
      brand: "Canon",
      isRentable: true,
      availableUnits: 3,
      basePrice: "75.00",
      rentalDuration: "daily",
      minRentalPeriod: 1,
      maxRentalPeriod: 14,
      images: [],
      specifications: {
        model: "Canon EOS R5",
        lenses: "24-70mm f/2.8, 70-200mm f/2.8",
        accessories: "Tripod, Flash, Extra batteries"
      },
      isActive: true
    });

    console.log("✅ Sample data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
}