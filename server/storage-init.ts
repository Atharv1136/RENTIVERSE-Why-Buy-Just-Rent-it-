import { MemoryStorage } from "./mem-storage";
import { DatabaseStorage } from "./db-storage";
import type { IStorage } from "./storage";

// Initialize storage based on environment
export async function initializeStorage(): Promise<IStorage> {
  console.log("🔍 Checking DATABASE_URL:", process.env.DATABASE_URL ? "Found" : "Not found");

  try {
    // Check if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      const storage = new DatabaseStorage();
      console.log("✅ Using Supabase PostgreSQL database");
      return storage;
    } else {
      throw new Error("No DATABASE_URL found");
    }
  } catch (error: any) {
    console.log("❌ Database connection error:", error?.message || error);
    console.log("📝 Falling back to in-memory storage for development");
    console.log("   To use PostgreSQL:");
    console.log("   1. Set DATABASE_URL environment variable");
    console.log("   2. Run: npm run db:push");
    return new MemoryStorage();
  }
}

// Export a promise that resolves to the storage instance
export const storagePromise = initializeStorage();
