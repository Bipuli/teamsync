import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.ts";

const { Pool } = pg;

export const isDbConfigured = !!process.env.DATABASE_URL;

let dbInstance: any = null;
let poolInstance: any = null;

if (isDbConfigured) {
  try {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 15000,
      ssl: {
        rejectUnauthorized: false, // Essential for serverless environments like Neon
      },
    });
    
    poolInstance.on("error", (err: any) => {
      console.error("Unexpected error on idle SQL pool client:", err);
    });

    dbInstance = drizzle(poolInstance, { schema });
    console.log("PostgreSQL (Neon) client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL connection:", err);
  }
} else {
  console.log("No DATABASE_URL found. Falling back to local JSON database.");
}

export const db = dbInstance;
export const pool = poolInstance;
