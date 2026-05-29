import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Only accept real PostgreSQL connection strings (postgresql:// or postgres://)
// DATABASE_URL on some hosts is set to the Supabase REST API URL (https://...)
// which is NOT a valid pg connection string and will crash the app.
function isPostgresUrl(url: string | undefined): url is string {
  return !!url && (url.startsWith("postgresql://") || url.startsWith("postgres://"));
}

// Priority: DIRECT_URL (port 5432) > SUPABASE_DATABASE_URL > DATABASE_URL
// Skip any URL that is not a valid PostgreSQL connection string.
const databaseUrl =
  (isPostgresUrl(process.env.DIRECT_URL) ? process.env.DIRECT_URL : undefined) ||
  (isPostgresUrl(process.env.SUPABASE_DATABASE_URL) ? process.env.SUPABASE_DATABASE_URL : undefined) ||
  (isPostgresUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined);

if (!databaseUrl) {
  throw new Error(
    "No valid PostgreSQL connection string found. " +
    "Set DIRECT_URL or SUPABASE_DATABASE_URL to a postgresql:// URL."
  );
}

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });
