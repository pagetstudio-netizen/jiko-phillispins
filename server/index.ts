import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { seed } from "./seed";
import { storage } from "./storage";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { db } from "./db";
import pg from "pg";
import path from "path";

const { Pool } = pg;

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      // Run migrations and seed in the background AFTER the server is already
      // accepting connections, so users never see a blank loading screen.
      runStartupTasks().catch((err) =>
        console.error("Startup tasks error:", err)
      );
    },
  );
})();

async function runStartupTasks() {
  // Run database migrations
  // Uses DIRECT_URL (port 5432) if set, because Supabase pgBouncer (port 6543)
  // doesn't support advisory locks required by Drizzle's migration runner.
  try {
    const migrationsFolder = path.resolve(process.cwd(), "migrations");
    // Only accept real postgresql:// URLs — DATABASE_URL may be an https:// Supabase REST URL
    function isPgUrl(u: string | undefined): u is string {
      return !!u && (u.startsWith("postgresql://") || u.startsWith("postgres://"));
    }
    const directUrl =
      (isPgUrl(process.env.DATABASE_URL) ? process.env.DATABASE_URL : undefined) ||
      (isPgUrl(process.env.DIRECT_URL) ? process.env.DIRECT_URL : undefined) ||
      (isPgUrl(process.env.SUPABASE_DATABASE_URL) ? process.env.SUPABASE_DATABASE_URL : undefined);
    if (!directUrl) throw new Error("No valid PostgreSQL URL configured for migrations");

    const migrationPool = new Pool({
      connectionString: directUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
    });
    const migrationDb = drizzle(migrationPool);
    await migrate(migrationDb, { migrationsFolder });
    await migrationPool.end();
    log("Database migrations applied successfully", "db");
  } catch (err: any) {
    console.error("Migration error (non-fatal):", err?.message || err);
  }

  // Seed database with initial data
  await seed().catch(console.error);

  // Process daily earnings — run once after startup, then every 5 minutes
  const processEarningsInterval = async () => {
    try {
      await storage.processEarnings();
      log("Daily earnings processed successfully", "earnings");
    } catch (error) {
      console.error("Error processing daily earnings:", error);
    }
  };

  setTimeout(processEarningsInterval, 5000);
  setInterval(processEarningsInterval, 5 * 60 * 1000);
}
