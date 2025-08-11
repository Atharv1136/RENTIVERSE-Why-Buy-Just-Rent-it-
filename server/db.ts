import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set!");
  console.error("📝 Please set up your database connection:");
  console.error("   1. Create a .env file in the project root");
  console.error("   2. Add DATABASE_URL=your_database_connection_string");
  console.error("   3. For local development, you can use:");
  console.error("      - Local PostgreSQL: postgresql://user:password@localhost:5432/dbname");
  console.error("      - Neon DB (recommended): Get connection string from https://neon.tech");
  console.error("   4. Copy the example from .env.example");
  throw new Error(
    "DATABASE_URL must be set. Please check .env.example for setup instructions.",
  );
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });
