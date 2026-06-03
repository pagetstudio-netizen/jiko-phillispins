import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function isPostgresUrl(url: string | undefined): url is string {
  return !!url && (url.startsWith("postgresql://") || url.startsWith("postgres://"));
}

// Priority: SUPABASE_DATABASE_URL > DIRECT_URL > DATABASE_URL (Replit built-in)
const databaseUrl =
  (isPostgresUrl(process.env.SUPABASE_DATABASE_URL) ? process.env.SUPABASE_DATABASE_URL : undefined) ||
  (isPostgresUrl(process.env.DIRECT_URL) ? process.env.DIRECT_URL : undefined) ||
  (isPostgresUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined);

if (!databaseUrl) {
  throw new Error(
    "No valid PostgreSQL connection string found. " +
    "Set DATABASE_URL to a postgresql:// URL."
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
