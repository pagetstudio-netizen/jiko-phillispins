import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { registerSchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import ConnectPgSimple from "connect-pg-simple";
import MemoryStore from "memorystore";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { 
  initiatePayment, 
  verifyPayment, 
  isSoleaspaySupported, 
  mapSoleaspayStatus,
  SOLEASPAY_SERVICE_MAP 
} from "./soleaspay";
import * as ashtech from "./ashtechpay";
import * as cloudpay from "./cloudpay";
import * as sendavapay from "./sendavapay";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

async function requireBanker(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user?.isAdmin && !user?.isBanker) {
    return res.status(403).json({ message: "Accès refusé" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Trust proxy: 1 hop = Nginx/Apache devant Node (Plesk standard).
  // Utiliser TRUST_PROXY=2 si double reverse proxy, ou "false" pour désactiver.
  const rawTp = process.env.TRUST_PROXY;
  const trustProxy: any =
    rawTp === "false" ? false :
    rawTp ? (isNaN(Number(rawTp)) ? rawTp : Number(rawTp)) :
    1; // Plesk par défaut = 1 couche Nginx
  app.set("trust proxy", trustProxy);

  // ── SÉCURITÉ : Headers HTTP ──────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // géré côté frontend
      crossOriginEmbedderPolicy: false,
    })
  );

  // ── SÉCURITÉ : Bloquer les bots / agents suspects ────────────────────────
  app.use((req, res, next) => {
    const ua = (req.headers["user-agent"] || "").toLowerCase();
    const blockedAgents = ["supabase-edge", "pgbouncer-bot", "postgrest", "supabase-js"];
    if (blockedAgents.some((b) => ua.includes(b))) {
      return res.status(403).json({ message: "Accès refusé" });
    }
    next();
  });

  // ── SÉCURITÉ : Rate limiter global API ───────────────────────────────────
  const globalApiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false }, // trust proxy géré par Express, pas par rate-limit
    message: { message: "Trop de requêtes, veuillez réessayer dans une minute." },
    skip: (req) => req.path.startsWith("/api/webhooks"),
  });
  app.use("/api", globalApiLimiter);

  // ── SÉCURITÉ : Rate limiter strict pour login/register ───────────────────
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { message: "Trop de tentatives de connexion. Réessayez dans 15 minutes." },
  });

  // ── SÉCURITÉ : Rate limiter pour dépôts/retraits ─────────────────────────
  const transactionLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false },
    message: { message: "Trop de tentatives de transaction. Réessayez dans 5 minutes." },
  });

  // CORS — allow the configured origin to send cookies
  const allowedOrigin = process.env.CORS_ORIGIN || "";
  app.use((req, res, next) => {
    const origin = req.headers.origin as string | undefined;
    if (allowedOrigin && origin && origin === allowedOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    } else if (!allowedOrigin && origin) {
      // No restriction configured — allow same origin (serving frontend from same server)
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Requested-With");
      if (req.method === "OPTIONS") return res.sendStatus(204);
    }
    next();
  });

  // Session store: start immediately with MemoryStore so the server never blocks.
  // Then, in the background, try each PostgreSQL URL until one connects and swap
  // the store transparently. connect-pg-simple works with both port 5432 (direct)
  // and port 6543 (pgBouncer) because it only needs simple SQL — no advisory locks.
  const MemStore = MemoryStore(session);

  function isPostgresUrl(u: string | undefined): u is string {
    return !!u && (u.startsWith("postgresql://") || u.startsWith("postgres://"));
  }

  // Proxy store: delegates to an inner store that can be swapped at any time.
  // This lets us start instantly with MemoryStore, then upgrade to Postgres
  // without re-registering the session middleware.
  class ProxyStore extends session.Store {
    inner: session.Store;
    constructor(initial: session.Store) { super(); this.inner = initial; }
    get(sid: string, cb: (err: any, s?: session.SessionData | null) => void) { this.inner.get(sid, cb); }
    set(sid: string, s: session.SessionData, cb?: (err?: any) => void) { this.inner.set(sid, s, cb); }
    destroy(sid: string, cb?: (err?: any) => void) { this.inner.destroy(sid, cb); }
    touch(sid: string, s: session.SessionData, cb?: (err?: any) => void) {
      if (typeof (this.inner as any).touch === "function") (this.inner as any).touch(sid, s, cb);
      else cb?.();
    }
  }

  const sessionStore = new ProxyStore(new MemStore({ checkPeriod: 86400000 }));

  // Background: try PostgreSQL URLs one by one (5s timeout each), swap when one works.
  (async () => {
    const candidates = [
      process.env.DATABASE_URL,
      process.env.DIRECT_URL,
      process.env.SUPABASE_DATABASE_URL,
    ].filter(isPostgresUrl);

    for (const url of candidates) {
      try {
        const pg2 = (await import("pg")).default;
        const testPool = new pg2.Pool({
          connectionString: url,
          ssl: { rejectUnauthorized: false },
          max: 1,
          connectionTimeoutMillis: 5000,
        });
        const client = await testPool.connect();
        client.release();
        await testPool.end();
        const PgSessionStore = ConnectPgSimple(session);
        const pgStore = new PgSessionStore({
          conString: url,
          tableName: "session",
          createTableIfMissing: true,
          pruneSessionInterval: 60 * 60,
          errorLog: (err: Error) => console.error("[session-store]", err.message),
        });
        sessionStore.inner = pgStore;
        console.log(`[session-store] Upgraded to PostgreSQL: ${url.replace(/:[^:@]+@/, ":***@")}`);
        return;
      } catch (e: any) {
        console.warn(`[session-store] URL failed (${url.replace(/:[^:@]+@/, ":***@")}): ${e.message}`);
      }
    }
    console.warn("[session-store] All PostgreSQL URLs failed — keeping MemoryStore");
  })();

  // Cookie secure : utilise "auto" pour que Express décide selon req.secure
  // (qui respecte X-Forwarded-Proto grâce à trust proxy).
  // → HTTPS via Nginx : cookie marqué Secure automatiquement.
  // → HTTP direct (dev, ou Plesk sans SSL) : cookie envoyé sans Secure.
  // FORCE_SECURE_COOKIE=true/false pour forcer manuellement si besoin.
  const forceSecure = process.env.FORCE_SECURE_COOKIE;
  const secureCookie: boolean | "auto" =
    forceSecure === "true" ? true :
    forceSecure === "false" ? false :
    "auto"; // comportement automatique recommandé

  app.use(
    session({
      store: sessionStore,
      secret: process.env.SESSION_SECRET || "eiffage-secret-key-2024",
      resave: false,
      saveUninitialized: false,
      name: "eiffage_sid",
      cookie: {
        secure: secureCookie,
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "lax",
      },
    })
  );

  // Health / diagnostic endpoint
  app.get("/api/health", async (req, res) => {
    let dbStatus = "unknown";
    let dbError = null;
    let userCount = null;
    try {
      const { db: healthDb } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const result = await healthDb.execute(sql`SELECT COUNT(*) as cnt FROM users`);
      userCount = (result.rows?.[0] as any)?.cnt ?? null;
      dbStatus = "connected";
    } catch (e: any) {
      dbStatus = "error";
      dbError = e?.message || String(e);
    }

    res.json({
      status: "ok",
      env: process.env.NODE_ENV,
      secure: req.secure,
      proto: req.headers["x-forwarded-proto"],
      host: req.headers.host,
      sessionID: req.sessionID || null,
      hasSession: !!req.session?.userId,
      cookieSecure: String(secureCookie),
      dbUrl: process.env.DATABASE_URL ? "set" : "missing",
      directUrl: process.env.DIRECT_URL ? "set" : "missing",
      sessionSecret: process.env.SESSION_SECRET ? "set" : "missing",
      db: { status: dbStatus, userCount, error: dbError },
    });
  });

  // Auth routes
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      console.log("[auth/register] attempt — body keys:", Object.keys(req.body || {}));
      const raw = registerSchema.parse(req.body);
      // Normalize phone: remove spaces, dashes and all non-digit chars (same as login)
      const data = { ...raw, phone: raw.phone.replace(/\D/g, "") };

      if (data.phone.length < 6) {
        return res.status(400).json({ message: "Numéro de téléphone invalide" });
      }
      
      // Check by phone only first to catch cross-country duplicate (global unique constraint)
      const existingByPhone = await storage.getUserByPhoneOnly(data.phone);
      if (existingByPhone) {
        console.log("[auth/register] phone already exists globally:", data.phone);
        return res.status(400).json({ message: "Ce numéro est déjà utilisé" });
      }

      let referredBy: string | undefined;
      if (data.invitationCode && data.invitationCode.trim()) {
        const cleanCode = data.invitationCode.trim().toUpperCase();
        const referrer = await storage.getUserByReferralCode(cleanCode);
        if (!referrer) {
          return res.status(400).json({ message: "Code d'invitation invalide" });
        }
        referredBy = cleanCode;
      }

      const user = await storage.createUser({
        fullName: data.fullName,
        phone: data.phone,
        country: data.country,
        password: data.password,
        referredBy,
      });

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("[auth/register] session save error:", err);
          return res.status(500).json({ message: "Erreur de session — réessayez" });
        }
        console.log("[auth/register] success — userId:", user.id, "sessionID:", req.sessionID);
        res.json({ user: { ...user, password: undefined } });
      });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.warn("[auth/register] validation error:", error.errors[0].message);
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("[auth/register] server error:", error?.message || error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      console.log("[auth/login] attempt — ip:", req.ip, "secure:", req.secure, "proto:", req.headers["x-forwarded-proto"]);
      const rawData = loginSchema.parse(req.body);
      // Normalize phone: strip spaces, dashes, and non-digit chars
      const data = { ...rawData, phone: rawData.phone.replace(/\D/g, ""), password: rawData.password.trim() };
      
      let user = await storage.getUserByPhone(data.phone, data.country);

      // Fallback: if not found by phone+country, try phone only for admin accounts
      if (!user) {
        const byPhoneOnly = await storage.getUserByPhoneOnly(data.phone);
        if (byPhoneOnly?.isAdmin) {
          user = byPhoneOnly;
        }
      }

      if (!user) {
        console.warn("[auth/login] user not found:", data.phone, data.country);
        return res.status(400).json({ message: "Utilisateur non trouvé" });
      }

      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
        console.warn("[auth/login] wrong password for userId:", user.id);
        return res.status(400).json({ message: "Mot de passe incorrect" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Compte suspendu" });
      }

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("[auth/login] session save error:", err);
          return res.status(500).json({ message: "Erreur de session — réessayez" });
        }
        console.log("[auth/login] success — userId:", user!.id, "sessionID:", req.sessionID);
        res.json({ user: { ...user, password: undefined } });
      });
      return;
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        console.warn("[auth/login] validation error:", error.errors[0].message);
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ user: { ...user, password: undefined } });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Veuillez remplir tous les champs" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Le nouveau mot de passe doit contenir au moins 6 caracteres" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: "Mot de passe actuel incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(user.id, { password: hashedPassword });

      res.json({ success: true, message: "Mot de passe modifie avec succes" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const userProductsList = await storage.getUserProducts(req.session.userId!);
      const user = await storage.getUser(req.session.userId!);
      
      const productCounts = new Map<number, number>();
      userProductsList.forEach(up => {
        if (up.isActive) {
          productCounts.set(up.productId, (productCounts.get(up.productId) || 0) + 1);
        }
      });
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const canClaimFree = !user?.lastFreeProductClaim || 
        new Date(user.lastFreeProductClaim) < today;

      const productsWithOwnership = products.map(p => ({
        ...p,
        isOwned: productCounts.has(p.id),
        ownedCount: productCounts.get(p.id) || 0,
        canClaimFree: p.isFree && canClaimFree,
      }));

      res.json(productsWithOwnership);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/purchase", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produit non trouvé" });
      }
      
      if (product.isFree) {
        return res.status(400).json({ message: "Use /claim-free for this product" });
      }

      const userProduct = await storage.purchaseProduct(req.session.userId!, productId);
      res.json(userProduct);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/products/:id/claim-free", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product || !product.isFree) {
        return res.status(400).json({ message: "Produit non valide" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (user.lastFreeProductClaim && new Date(user.lastFreeProductClaim) >= today) {
        return res.status(400).json({ message: "Déjà réclamé aujourd'hui" });
      }

      const newBalance = parseFloat(user.balance) + product.dailyEarnings;
      await storage.updateUser(user.id, { 
        balance: newBalance.toFixed(2),
        lastFreeProductClaim: new Date(),
      });

      await storage.createTransaction({
        userId: user.id,
        type: "free_claim",
        amount: product.dailyEarnings.toString(),
        description: "Bonus produit gratuit",
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get user's purchased products
  app.get("/api/user/products", requireAuth, async (req, res) => {
    try {
      const userProductsList = await storage.getAllUserProducts(req.session.userId!);
      
      const formattedProducts = userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        purchasedAt: up.userProduct.purchaseDate,
        daysRemaining: up.userProduct.daysRemaining,
        totalEarned: up.userProduct.totalEarned,
        status: up.userProduct.isActive ? 'active' : 'completed',
        product: up.product
      }));
      
      res.json(formattedProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Collect earnings for user (manual trigger)
  app.post("/api/user/collect-earnings", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const userProductsList = await storage.getAllUserProducts(userId);
      const now = new Date();
      let totalCollected = 0;
      let productsCollected = 0;

      for (const { userProduct, product } of userProductsList) {
        try {
          if (!userProduct.isActive || userProduct.daysRemaining <= 0) continue;

          const purchaseDate = userProduct.purchaseDate ? new Date(userProduct.purchaseDate) : null;
          if (!purchaseDate) continue;

          const lastEarning = userProduct.lastEarningDate ? new Date(userProduct.lastEarningDate) : purchaseDate;

          const msSincePurchase = now.getTime() - purchaseDate.getTime();
          const daysSincePurchase = Math.floor(msSincePurchase / (24 * 60 * 60 * 1000));

          const msSinceLastEarning = now.getTime() - lastEarning.getTime();
          const cyclesSinceLastEarning = Math.floor(msSinceLastEarning / (24 * 60 * 60 * 1000));

          if (cyclesSinceLastEarning >= 1 && daysSincePurchase >= 1) {
            const cyclesToCredit = Math.min(cyclesSinceLastEarning, userProduct.daysRemaining);
            const earningsPerCycle = product.dailyEarnings;
            const totalEarningsForProduct = earningsPerCycle * cyclesToCredit;

            const newLastEarningDate = new Date(lastEarning.getTime() + (cyclesToCredit * 24 * 60 * 60 * 1000));

            totalCollected += totalEarningsForProduct;
            productsCollected++;

            const newDaysRemaining = userProduct.daysRemaining - cyclesToCredit;
            const updateData: any = {
              lastEarningDate: newLastEarningDate,
              daysRemaining: newDaysRemaining,
              totalEarned: (parseFloat(userProduct.totalEarned || "0") + totalEarningsForProduct).toFixed(2),
            };
            
            if (newDaysRemaining <= 0) {
              updateData.isActive = false;
            }

            await storage.updateUserProduct(userProduct.id, updateData);

            for (let i = 0; i < cyclesToCredit; i++) {
              await storage.createTransaction({
                userId,
                type: "earning",
                amount: earningsPerCycle.toString(),
                description: `Gains ${product.name}`,
              });
            }
          }
        } catch (productError) {
          console.error(`Error processing product ${userProduct.id}:`, productError);
        }
      }

      if (totalCollected > 0) {
        const freshUser = await storage.getUser(userId);
        if (freshUser) {
          const newBalance = parseFloat(freshUser.balance || "0") + totalCollected;
          const newTodayEarnings = parseFloat(freshUser.todayEarnings || "0") + totalCollected;
          const newTotalEarnings = parseFloat(freshUser.totalEarnings || "0") + totalCollected;

          await storage.updateUser(userId, {
            balance: newBalance.toFixed(2),
            todayEarnings: newTodayEarnings.toFixed(2),
            totalEarnings: newTotalEarnings.toFixed(2),
          });
        }
      }

      const updatedUser = await storage.getUser(userId);
      res.json({ 
        success: true, 
        collected: totalCollected,
        productsCollected,
        newBalance: updatedUser?.balance || "0"
      });
    } catch (error: any) {
      console.error("Collect earnings error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Payment Channels
  app.get("/api/payment-channels", requireAuth, async (req, res) => {
    try {
      const [channels, settings] = await Promise.all([
        storage.getPaymentChannels(),
        storage.getSettings(),
      ]);

      const soleaspayEnabled = settings.soleaspayEnabled === "true";
      const soleaspayChannelName = settings.soleaspayChannelName || "Westpay";
      const ashtechpayEnabled = settings.ashtechpayEnabled === "true";
      const ashtechpayChannelName = settings.ashtechpayChannelName || "AshtechPay";

      // Build virtual gateway channels when enabled in settings
      const virtualChannels: any[] = [];
      if (soleaspayEnabled) {
        virtualChannels.push({
          id: -1,
          name: soleaspayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "soleaspay",
        });
      }
      if (ashtechpayEnabled) {
        virtualChannels.push({
          id: -3,
          name: ashtechpayChannelName,
          redirectUrl: "",
          isApi: true,
          isActive: true,
          gateway: "ashtechpay",
        });
      }

      // Manual channels created by admin (no gateway auto-processing)
      const manualChannels = channels.map((ch) => ({ ...ch, gateway: null }));

      res.json([...virtualChannels, ...manualChannels]);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get Soleaspay supported services
  app.get("/api/soleaspay/services", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const soleaspayEnabled = settings.soleaspayEnabled === "true";
      const soleaspayCountries = settings.soleaspayCountries ? settings.soleaspayCountries.split(",").filter(Boolean) : [];
      res.json({ 
        enabled: soleaspayEnabled,
        services: SOLEASPAY_SERVICE_MAP,
        enabledCountries: soleaspayCountries,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Deposits
  app.post("/api/deposits", requireAuth, transactionLimiter, async (req, res) => {
    try {
      const { amount, accountName, accountNumber, paymentMethod, country, paymentChannelId, useSoleaspay, otpCode, screenshotData, senderNumber } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Non authentifie" });
      }

      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "300");
      if (amount < minDeposit) {
        return res.status(400).json({ message: `Dépôt minimum : ${minDeposit.toLocaleString()} FCFA` });
      }

      if (!accountName || !accountNumber || !paymentMethod || !country) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const soleaspayEnabled = settings.soleaspayEnabled === "true";
      const soleaspayCountries = settings.soleaspayCountries ? settings.soleaspayCountries.split(",").filter(Boolean) : [];

      const orderId = `WENDYS-${Date.now()}-${user.id}`;
      
      // Only use Soleaspay when user explicitly chose the Soleaspay channel (Westpay)
      if (useSoleaspay && soleaspayEnabled) {
        if (!isSoleaspaySupported(country, paymentMethod)) {
          return res.status(400).json({
            message: `L'opérateur "${paymentMethod}" n'est pas supporté par ce canal pour le pays "${country}". Veuillez choisir un autre canal.`,
            soleaspay: true,
          });
        }
        try {
          const soleaspayApiKey = settings.soleaspayApiKey || process.env.SOLEASPAY_API_KEY || "";
          const paymentResult = await initiatePayment(
            soleaspayApiKey,
            accountNumber,
            amount,
            country,
            paymentMethod,
            orderId,
            accountName,
            `user${user.id}@eiffage-invest.com`
          );

          if (paymentResult.success && paymentResult.data) {
            const deposit = await storage.createDeposit({
              userId: req.session.userId!,
              amount,
              accountName,
              accountNumber,
              country,
              paymentMethod,
              paymentChannelId: paymentChannelId > 0 ? paymentChannelId : null,
              status: "processing",
              soleaspayReference: paymentResult.data.reference,
              soleaspayOrderId: orderId,
            });

            return res.json({ 
              deposit,
              soleaspay: true,
              reference: paymentResult.data.reference,
              status: paymentResult.status,
              message: paymentResult.message
            });
          } else {
            return res.status(400).json({ 
              message: paymentResult.message || "Soleaspay error",
              soleaspay: true
            });
          }
        } catch (soleaspayError: any) {
          console.error("[soleaspay] Payment error:", soleaspayError);
          return res.status(400).json({ 
            message: soleaspayError.message || "Soleaspay payment error",
            soleaspay: true
          });
        }
      }

      const deposit = await storage.createDeposit({
        userId: req.session.userId!,
        amount,
        accountName,
        accountNumber,
        country,
        paymentMethod,
        paymentChannelId: paymentChannelId > 0 ? paymentChannelId : null,
        status: "pending",
        screenshotData: screenshotData || null,
        senderNumber: senderNumber || null,
      });

      res.json({ deposit, soleaspay: false });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Verify payment status (Soleaspay)
  app.get("/api/deposits/:id/verify", requireAuth, async (req, res) => {
    try {
      const depositId = parseInt(req.params.id);
      const deposit = await storage.getDeposit(depositId);
      
      if (!deposit) {
        return res.status(404).json({ message: "Depot non trouve" });
      }

      if (deposit.userId !== req.session.userId) {
        return res.status(403).json({ message: "Acces refuse" });
      }

      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.json({ status: deposit.status });
      }

      if (deposit.soleaspayReference && deposit.soleaspayOrderId) {
        try {
          const settingsForVerify = await storage.getSettings();
          const soleaspayApiKey = settingsForVerify.soleaspayApiKey || process.env.SOLEASPAY_API_KEY || "";
          const verifyResult = await verifyPayment(soleaspayApiKey, deposit.soleaspayOrderId, deposit.soleaspayReference);
          const newStatus = mapSoleaspayStatus(verifyResult.status);

          if (newStatus !== "pending" && newStatus !== deposit.status) {
            await storage.updateDeposit(depositId, { 
              status: newStatus,
              processedAt: new Date()
            });

            if (newStatus === "approved") {
              const user = await storage.getUser(deposit.userId);
              if (user) {
                const newBalance = parseFloat(user.balance) + deposit.amount;
                await storage.updateUser(deposit.userId, {
                  balance: newBalance.toFixed(2),
                  hasDeposited: true,
                });

                await storage.createTransaction({
                  userId: deposit.userId,
                  type: "deposit",
                  amount: deposit.amount.toString(),
                  description: `Depot Soleaspay #${deposit.id}`,
                });

                await storage.processDepositReferralCommissions(deposit.userId, deposit.amount);
              }
            }
          }

          return res.json({ 
            status: newStatus,
            soleaspay: true,
            soleaspayStatus: verifyResult.status,
            message: verifyResult.message
          });
        } catch (verifyError: any) {
          console.error("[soleaspay] Verify error:", verifyError);
          return res.json({ 
            status: deposit.status,
            soleaspay: true,
            error: "Verification error"
          });
        }
      }

      return res.json({ status: deposit.status });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/deposits/history", requireAuth, async (req, res) => {
    try {
      const deposits = await storage.getUserDeposits(req.session.userId!);
      res.json(deposits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ─── AshtechPay ───────────────────────────────────────────────────

  // Get operators for a country
  app.get("/api/ashtechpay/operators", requireAuth, async (req, res) => {
    try {
      const { country } = req.query;
      const operators = ashtech.ASHTECH_OPERATORS[country as string] || [];
      const currency = ashtech.ASHTECH_CURRENCIES[country as string] || "XOF";
      res.json({ operators, currency });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Initiate AshtechPay payment (called from /pay page)
  app.post("/api/ashtechpay/initiate", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const apiKey = settings.ashtechpayApiKey || "";
      const enabled = settings.ashtechpayEnabled === "true";
      if (!enabled || !apiKey) return res.status(400).json({ message: "AshtechPay non configuré" });

      const { amount, phone, operator, country_code, otp } = req.body;
      if (!amount || !phone || !operator || !country_code) {
        return res.status(400).json({ message: "Champs requis: amount, phone, operator, country_code" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const minDeposit = parseInt(settings.minDeposit || "300");
      if (amount < minDeposit) return res.status(400).json({ message: `Dépôt minimum : ${minDeposit} FCFA` });

      const currency = ashtech.ASHTECH_CURRENCIES[country_code] || "XOF";
      const reference = `JINKO-${user.id}-${Date.now()}`;
      const webhookUrl = `${req.protocol}://${req.get("host")}/api/webhooks/ashtechpay`;

      // Ensure phone has country code prefix
      const DIAL_CODES: Record<string, string> = { PH: "63" };
      const dialCode = DIAL_CODES[country_code] || "";
      let formattedPhone = phone.replace(/\D/g, "");
      if (dialCode && !formattedPhone.startsWith(dialCode)) {
        formattedPhone = dialCode + formattedPhone;
      }

      // Create a pending deposit record
      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: formattedPhone,
        country: country_code,
        paymentMethod: operator,
        status: "processing",
        ashtechpayReference: reference,
      });

      const requestPayload = { amount, currency, phone: formattedPhone, operator, country_code, reference, otp: otp || undefined, notify_url: webhookUrl };
      console.log("[ashtechpay] initiate request:", JSON.stringify(requestPayload));

      const { httpStatus, data } = await ashtech.initiatePayment(apiKey, requestPayload);

      console.log("[ashtechpay] initiate response httpStatus:", httpStatus, "data:", JSON.stringify(data));

      const flow = ashtech.detectFlow(httpStatus, data);

      if (!flow) {
        await storage.updateDeposit(deposit.id, { status: "rejected" });
        const errMsg = data.message || data.error || data.detail || "Paiement refusé par l'opérateur";
        console.error("[ashtechpay] no flow detected, raw response:", JSON.stringify(data));
        return res.status(400).json({ message: errMsg });
      }

      // Save transaction id if available
      const txId = data.transaction_id || data.transactionId || data.id || null;
      if (txId) {
        await storage.updateDeposit(deposit.id, { ashtechpayTransactionId: String(txId) });
      }

      return res.json({
        depositId: deposit.id,
        flow,
        waveUrl: data.wave_url || data.waveUrl || null,
        ussdCode: data.ussd_code || data.ussdCode || null,
        transactionId: txId,
        otpRequired: flow === "otp_sms" || flow === "otp_ussd",
      });
    } catch (e: any) {
      console.error("[ashtechpay] initiate error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // Check deposit status (polling)
  app.get("/api/ashtechpay/deposit/:id/status", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(parseInt(req.params.id));
      if (!deposit || deposit.userId !== req.session.userId) {
        return res.status(404).json({ message: "Dépôt introuvable" });
      }

      if (deposit.status === "approved") return res.json({ status: "approved" });
      if (deposit.status === "rejected") return res.json({ status: "rejected" });

      if (deposit.ashtechpayTransactionId) {
        const settings = await storage.getSettings();
        const apiKey = settings.ashtechpayApiKey || "";
        const txStatus = await ashtech.getTransactionStatus(apiKey, deposit.ashtechpayTransactionId);

        console.log("[ashtechpay] poll txStatus:", JSON.stringify(txStatus));
        const successStatuses = ["success", "completed", "paid", "confirmed"];
        const failedStatuses  = ["failed", "rejected", "cancelled", "expired", "error"];
        const txSt = (txStatus.status || "").toLowerCase();
        if (successStatuses.includes(txSt)) {
          await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });
          const user = await storage.getUser(deposit.userId);
          if (user) {
            const newBalance = parseFloat(user.balance) + deposit.amount;
            await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
            await storage.processDepositReferralCommissions(user.id, deposit.amount);
          }
          return res.json({ status: "approved" });
        } else if (failedStatuses.includes(txSt)) {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
          return res.json({ status: "rejected" });
        }
      }

      res.json({ status: "processing" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // AshtechPay webhook
  app.post("/api/webhooks/ashtechpay", async (req, res) => {
    res.status(200).json({ received: true });
    try {
      const { event, transaction_id, reference, status } = req.body;
      if (!reference) return;

      const deposits = await storage.getDeposits();
      const deposit = deposits.find((d: any) => d.ashtechpayReference === reference);
      if (!deposit) return;
      if (deposit.status === "approved" || deposit.status === "rejected") return;

      if (event === "payment.completed" || status === "completed") {
        await storage.updateDeposit(deposit.id, {
          status: "approved",
          ashtechpayTransactionId: transaction_id,
          processedAt: new Date(),
        });
        const user = await storage.getUser(deposit.userId);
        if (user) {
          const newBalance = parseFloat(user.balance) + deposit.amount;
          await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
          await storage.processDepositReferralCommissions(user.id, deposit.amount);
        }
      } else if (event === "payment.failed" || status === "failed") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }
    } catch (e: any) {
      console.error("[ashtechpay] webhook error:", e);
    }
  });

  // ─── End AshtechPay ───────────────────────────────────────────────

  // ─── CloudPay (Galaxy System API) ─────────────────────────────────

  // Initiate CloudPay deposit
  app.post("/api/cloudpay/deposit", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const merchantId = settings.cloudpayMerchantId || "";
      const secretKey = settings.cloudpaySecretKey || "";
      const domain = settings.cloudpayDomain || "";
      const enabled = settings.cloudpayEnabled === "true";

      if (!enabled || !merchantId || !secretKey || !domain) {
        return res.status(400).json({ message: "CloudPay non configuré" });
      }

      const { amount, paymentMethod, bankCode } = req.body;
      if (!amount) {
        return res.status(400).json({ message: "Champs requis: amount" });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Not authenticated" });

      const minDeposit = parseInt(settings.minDeposit || "300");
      if (amount < minDeposit) {
        return res.status(400).json({ message: `Minimum deposit: ${minDeposit}` });
      }

      const orderId = `CP-${user.id}-${Date.now()}`;
      const host = `${req.protocol}://${req.get("host")}`;
      const callbackUrl = `${host}/api/webhooks/cloudpay`;
      const returnUrl = `${host}/deposit-orders`;

      const resolvedBankCode = bankCode || cloudpay.getBankCode(paymentMethod || "GCash");

      // `amount` arrives in FCFA (already converted by frontend via toFcfa).
      // CloudPay expects PHP, so we divide back by the conversion rate.
      const phpToFcfaRate = parseFloat(settings.phpToFcfaRate || "10");
      const phpAmount = Math.round(amount / phpToFcfaRate);

      // Store FCFA amount in DB so user balance is credited correctly.
      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: merchantId,
        country: user.country || "PH",
        paymentMethod: paymentMethod || "CloudPay",
        status: "processing",
        soleaspayOrderId: orderId,
      });

      const methodMap: Record<string, { payment_type: string; bank_code: string }> = {
        "Maya": { payment_type: "3", bank_code: "PMP" },
        "GCash": { payment_type: "7", bank_code: "gcash" },
      };
      const method = methodMap[paymentMethod] || methodMap["GCash"];

      // Send PHP amount to CloudPay (not FCFA).
      const result = await cloudpay.initiateDeposit(domain, merchantId, secretKey, {
        merchant: merchantId,
        payment_type: method.payment_type,
        amount: phpAmount,
        order_id: orderId,
        bank_code: method.bank_code,
        callback_url: callbackUrl,
        return_url: returnUrl,
      });

      if (result.status !== "1" && result.status !== "success") {
        await storage.updateDeposit(deposit.id, { status: "rejected" });
        console.error("[cloudpay] deposit rejected:", result.message);
        return res.status(400).json({ message: "Payment failed. Please try again or contact support." });
      }

      return res.json({
        depositId: deposit.id,
        orderId,
        redirectUrl: result.redirect_url || null,
        qrcodeUrl: result.qrcode_url || result.gcash_qr_url || result.gcashqr || null,
        bankAccount: result.merchant_bank_card_account || null,
      });
    } catch (e: any) {
      console.error("[cloudpay] deposit error:", e);
      res.status(500).json({ message: "Payment service unavailable. Please try again later." });
    }
  });

  // Poll CloudPay deposit status
  app.get("/api/cloudpay/deposit/:id/status", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(parseInt(req.params.id));
      if (!deposit || deposit.userId !== req.session.userId) {
        return res.status(404).json({ message: "Dépôt introuvable" });
      }

      if (deposit.status === "approved") return res.json({ status: "approved" });
      if (deposit.status === "rejected") return res.json({ status: "rejected" });

      const orderId = deposit.soleaspayOrderId;
      if (orderId) {
        const settings = await storage.getSettings();
        const merchantId = settings.cloudpayMerchantId || "";
        const secretKey = settings.cloudpaySecretKey || "";
        const domain = settings.cloudpayDomain || "";

        const queryResult = await cloudpay.queryTransaction(domain, merchantId, secretKey, orderId);
        const newStatus = cloudpay.mapCloudpayStatus(queryResult.status);

        if (newStatus === "approved") {
          await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });
          const user = await storage.getUser(deposit.userId);
          if (user) {
            const newBalance = parseFloat(user.balance) + deposit.amount;
            await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
            await storage.createTransaction({
              userId: user.id,
              type: "deposit",
              amount: deposit.amount.toString(),
              description: `Dépôt CloudPay #${deposit.id}`,
            });
            await storage.processDepositReferralCommissions(user.id, deposit.amount);
          }
          return res.json({ status: "approved" });
        } else if (newStatus === "rejected") {
          await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
          return res.json({ status: "rejected" });
        }
      }

      res.json({ status: "processing" });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // CloudPay deposit webhook callback
  // CloudPay sends multipart/form-data — use multer to parse it
  const cloudpayWebhookParser = multer().none();
  app.post("/api/webhooks/cloudpay", cloudpayWebhookParser, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const secretKey = settings.cloudpaySecretKey || "";
      const merchantId = settings.cloudpayMerchantId || "";

      const { order_id, amount, status, sign, merchant, message, remark } = req.body;

      console.log("[cloudpay] deposit webhook raw body:", JSON.stringify(req.body));

      if (!order_id || !sign) {
        return res.status(400).send("FAIL");
      }

      // Build params for signature — include all non-empty fields except sign itself
      const params: Record<string, string | number> = {
        merchant: merchant || merchantId,
        order_id,
        amount,
        status,
      };
      if (message !== undefined && message !== "") params.message = message;
      if (remark !== undefined && remark !== "") params.remark = remark;

      const isValid = cloudpay.verifySign(params, secretKey);
      if (!isValid) {
        // Try without optional fields in case they aren't signed
        const paramsMinimal: Record<string, string | number> = {
          merchant: merchant || merchantId,
          order_id,
          amount,
          status,
        };
        const isValidMinimal = cloudpay.verifySign(paramsMinimal, secretKey);
        if (!isValidMinimal) {
          console.error("[cloudpay] webhook invalid signature for order:", order_id);
          return res.status(400).send("FAIL");
        }
      }

      const deposits = await storage.getDeposits();
      const deposit = deposits.find((d: any) => d.soleaspayOrderId === order_id);
      if (!deposit) {
        console.warn("[cloudpay] webhook: deposit not found for order:", order_id);
        return res.send("SUCCESS");
      }

      if (deposit.status === "approved" || deposit.status === "rejected") {
        return res.send("SUCCESS");
      }

      const mappedStatus = cloudpay.mapCloudpayStatus(Number(status));

      if (mappedStatus === "approved") {
        await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });
        const user = await storage.getUser(deposit.userId);
        if (user) {
          const newBalance = parseFloat(user.balance) + deposit.amount;
          await storage.updateUser(user.id, { balance: newBalance.toFixed(2), hasDeposited: true });
          await storage.createTransaction({
            userId: user.id,
            type: "deposit",
            amount: deposit.amount.toString(),
            description: `Dépôt CloudPay #${deposit.id}`,
          });
          await storage.processDepositReferralCommissions(user.id, deposit.amount);
        }
      } else if (mappedStatus === "rejected") {
        await storage.updateDeposit(deposit.id, { status: "rejected", processedAt: new Date() });
      }

      res.send("SUCCESS");
    } catch (e: any) {
      console.error("[cloudpay] webhook error:", e);
      res.send("SUCCESS");
    }
  });

  // CloudPay auto-withdrawal — admin triggers this for any user's withdrawal
  app.post("/api/cloudpay/withdraw", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const merchantId = settings.cloudpayMerchantId || "";
      const secretKey = settings.cloudpaySecretKey || "";
      const domain = settings.cloudpayDomain || "";
      const enabled = settings.cloudpayEnabled === "true";

      if (!enabled || !merchantId || !secretKey || !domain) {
        return res.status(400).json({ message: "CloudPay non configuré" });
      }

      const { withdrawalId } = req.body;
      if (!withdrawalId) {
        return res.status(400).json({ message: "withdrawalId requis" });
      }

      const withdrawal = await storage.getWithdrawal(withdrawalId);
      if (!withdrawal) {
        return res.status(404).json({ message: "Retrait introuvable" });
      }

      const orderId = `CPW-${withdrawal.id}-${Date.now()}`;
      const host = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const callbackUrl = `${host}/api/webhooks/cloudpay-withdrawal`;

      const bankCode = cloudpay.getBankCode(withdrawal.paymentMethod || "GCash");

      // bank_card_remark: for GCash use account number, for Maya use phone number, otherwise "no"
      const payMethod = (withdrawal.paymentMethod || "").toLowerCase();
      let bankCardRemark: string;
      if (payMethod.includes("gcash")) {
        bankCardRemark = withdrawal.accountNumber;
      } else if (payMethod.includes("maya")) {
        bankCardRemark = withdrawal.accountNumber;
      } else {
        bankCardRemark = "no";
      }

      // Convert amount: netAmount is stored in FCFA, CloudPay expects PHP
      const phpToFcfaRate = parseFloat(settings.phpToFcfaRate || "10");
      const phpAmount = Math.round(withdrawal.netAmount / phpToFcfaRate);

      console.log("[cloudpay] initiating withdrawal:", { withdrawalId, bankCode, phpAmount, bankCardRemark });

      const result = await cloudpay.initiateWithdrawal(domain, merchantId, secretKey, {
        merchant: merchantId,
        total_amount: phpAmount,
        callback_url: callbackUrl,
        order_id: orderId,
        bank: bankCode,
        bank_card_name: withdrawal.accountName,
        bank_card_account: withdrawal.accountNumber,
        bank_card_remark: bankCardRemark,
      });

      console.log("[cloudpay] withdrawal result:", JSON.stringify(result));

      if (result.status !== "1" && result.status !== "success") {
        return res.status(400).json({ message: result.message || "Retrait refusé par CloudPay" });
      }

      await storage.updateWithdrawal(withdrawal.id, {
        status: "processing",
        processedAt: new Date(),
        cloudpayOrderId: orderId,
      });

      res.json({ success: true, orderId, message: result.message });
    } catch (e: any) {
      console.error("[cloudpay] withdrawal error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // Reconstruct CloudPay deposit payload with signature (admin only)
  app.get("/api/admin/deposits/:id/cloudpay-payload", requireAdmin, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(parseInt(req.params.id));
      if (!deposit) return res.status(404).json({ message: "Dépôt introuvable" });

      const orderId = deposit.soleaspayOrderId;
      if (!orderId || !orderId.startsWith("CP-")) {
        return res.status(400).json({ message: "Ce dépôt n'est pas un dépôt CloudPay" });
      }

      const settings = await storage.getSettings();
      const merchantId = settings.cloudpayMerchantId || "";
      const secretKey = settings.cloudpaySecretKey || "";
      const domain = settings.cloudpayDomain || "";

      const host = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
      const callbackUrl = `${host}/api/webhooks/cloudpay`;
      const returnUrl = `${host}/deposit-orders`;

      const methodMap: Record<string, { payment_type: string; bank_code: string }> = {
        "Maya": { payment_type: "3", bank_code: "PMP" },
        "GCash": { payment_type: "7", bank_code: "gcash" },
      };
      const method = methodMap[deposit.paymentMethod] || methodMap["GCash"];

      // Deposit amount in DB is stored in FCFA; CloudPay needs PHP
      const phpToFcfaRate = parseFloat(settings.phpToFcfaRate || "10");
      const phpAmount = Math.round(deposit.amount / phpToFcfaRate);

      const payload: Record<string, string | number> = {
        merchant: merchantId,
        payment_type: method.payment_type,
        amount: phpAmount,
        order_id: orderId,
        bank_code: method.bank_code,
        callback_url: callbackUrl,
        return_url: returnUrl,
      };
      payload.sign = cloudpay.buildSign(payload, secretKey);

      res.json({ domain, payload });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // CloudPay balance check (admin only)
  app.get("/api/admin/cloudpay/balance", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const merchantId = settings.cloudpayMerchantId || "";
      const secretKey = settings.cloudpaySecretKey || "";
      const domain = settings.cloudpayDomain || "";
      const enabled = settings.cloudpayEnabled === "true";

      if (!enabled || !merchantId || !secretKey || !domain) {
        return res.status(400).json({ message: "CloudPay non configuré" });
      }

      const result = await cloudpay.queryBalance(domain, merchantId, secretKey);
      res.json(result);
    } catch (e: any) {
      console.error("[cloudpay] balance error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  // CloudPay withdrawal webhook — update withdrawal status in DB
  app.post("/api/webhooks/cloudpay-withdrawal", cloudpayWebhookParser, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      const secretKey = settings.cloudpaySecretKey || "";
      const merchantId = settings.cloudpayMerchantId || "";

      const { order_id, amount, status, sign, merchant, message, remark } = req.body;

      console.log("[cloudpay] withdrawal webhook raw body:", JSON.stringify(req.body));

      if (!order_id || !sign) return res.status(400).send("FAIL");

      const params: Record<string, string | number> = {
        merchant: merchant || merchantId,
        order_id,
        amount,
        status,
      };
      if (message !== undefined && message !== "") params.message = message;
      if (remark !== undefined && remark !== "") params.remark = remark;

      const isValid = cloudpay.verifySign(params, secretKey);
      if (!isValid) {
        // Try without optional fields
        const paramsMinimal: Record<string, string | number> = {
          merchant: merchant || merchantId,
          order_id,
          amount,
          status,
        };
        const isValidMinimal = cloudpay.verifySign(paramsMinimal, secretKey);
        if (!isValidMinimal) {
          console.error("[cloudpay] withdrawal webhook invalid signature:", order_id);
          return res.status(400).send("FAIL");
        }
      }

      // Find the withdrawal by cloudpayOrderId
      const withdrawals = await storage.getWithdrawals();
      const withdrawal = withdrawals.find((w: any) => w.cloudpayOrderId === order_id);
      if (!withdrawal) {
        console.warn("[cloudpay] withdrawal webhook: withdrawal not found for order:", order_id);
        return res.send("SUCCESS");
      }

      if (withdrawal.status === "approved" || withdrawal.status === "rejected") {
        return res.send("SUCCESS");
      }

      const mappedStatus = cloudpay.mapCloudpayStatus(Number(status));
      console.log("[cloudpay] withdrawal webhook status:", status, "→", mappedStatus, "for order:", order_id);

      if (mappedStatus === "approved") {
        await storage.updateWithdrawal(withdrawal.id, {
          status: "approved",
          processedAt: new Date(),
        });
      } else if (mappedStatus === "rejected") {
        // Refund the user's balance on rejection
        const user = await storage.getUser(withdrawal.userId);
        if (user) {
          const refundAmount = withdrawal.netAmount;
          const newBalance = parseFloat(user.balance) + refundAmount;
          await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
          await storage.createTransaction({
            userId: user.id,
            type: "withdrawal_refund",
            amount: refundAmount.toString(),
            description: `Remboursement retrait CloudPay #${withdrawal.id} (refusé)`,
          });
        }
        await storage.updateWithdrawal(withdrawal.id, {
          status: "rejected",
          processedAt: new Date(),
        });
      }

      res.send("SUCCESS");
    } catch (e: any) {
      console.error("[cloudpay] withdrawal webhook error:", e);
      res.send("SUCCESS");
    }
  });

  // ─── End CloudPay ─────────────────────────────────────────────────

  // Withdrawals
  app.post("/api/withdrawals", requireAuth, transactionLimiter, async (req, res) => {
    try {
      const { amount } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const minWithdrawalSettings = await storage.getSettings();
      const minWithdrawal = parseInt(minWithdrawalSettings.minWithdrawal || "1500");
      if (amount < minWithdrawal) {
        return res.status(400).json({ message: `Retrait minimum : ${minWithdrawal.toLocaleString()} FCFA` });
      }

      if (!user.hasActiveProduct) {
        return res.status(400).json({ message: "Achetez d'abord un produit" });
      }

      if (user.isWithdrawalBlocked) {
        return res.status(400).json({ message: "Retraits bloqués sur ce compte" });
      }

      if (user.mustInviteToWithdraw) {
        const stats = await storage.getTeamStats(user.id);
        if (stats.level1Invested < 1) {
          return res.status(400).json({ message: "Invitez quelqu'un qui investit" });
        }
      }

      const balance = parseFloat(user.balance);
      if (amount > balance) {
        return res.status(400).json({ message: "Solde insuffisant" });
      }

      const wallet = await storage.getDefaultWallet(user.id);
      if (!wallet) {
        return res.status(400).json({ message: "Enregistrez un portefeuille de retrait" });
      }

      const settings = await storage.getSettings();
      const todayCount = await storage.getUserWithdrawalCountToday(user.id);
      const maxPerDay = parseInt(settings.maxWithdrawalsPerDay || "1");
      if (todayCount >= maxPerDay) {
        return res.status(400).json({ message: `Maximum ${maxPerDay} retrait${maxPerDay > 1 ? "s" : ""} par jour` });
      }

      const fees = parseFloat(settings.withdrawalFees || "18");
      const feeAmount = Math.round(amount * fees / 100);
      const netAmount = amount - feeAmount;

      // Deduct from balance
      await storage.updateUser(user.id, {
        balance: (balance - amount).toFixed(2),
      });

      const withdrawal = await storage.createWithdrawal({
        userId: user.id,
        amount,
        netAmount,
        fees: feeAmount,
        accountName: wallet.accountName,
        accountNumber: wallet.accountNumber,
        country: wallet.country,
        paymentMethod: wallet.paymentMethod,
        status: "pending",
      });

      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/withdrawals/history", requireAuth, async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.session.userId!);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Wallets
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets(req.session.userId!);
      res.json(wallets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/wallets", requireAuth, async (req, res) => {
    try {
      const { accountName, accountNumber, paymentMethod, country } = req.body;
      const wallet = await storage.createWallet({
        userId: req.session.userId!,
        accountName,
        accountNumber,
        paymentMethod,
        country,
      });
      res.json(wallet);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWallet(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/wallets/:id/default", requireAuth, async (req, res) => {
    try {
      await storage.setDefaultWallet(req.session.userId!, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Team
  app.get("/api/team/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getTeamStats(req.session.userId!);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/team/details", requireAuth, async (req, res) => {
    try {
      const team = await storage.getDetailedTeam(req.session.userId!);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tasks
  app.get("/api/tasks", requireAuth, async (req, res) => {
    try {
      const tasks = await storage.getTasksWithStatus(req.session.userId!);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/tasks/:id/claim", requireAuth, async (req, res) => {
    try {
      await storage.claimTask(req.session.userId!, parseInt(req.params.id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Daily bonus claim (50 FCFA every 24h)
  app.post("/api/claim-daily-bonus", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          const hoursRemaining = Math.ceil(24 - hoursSinceClaim);
          return res.status(400).json({ 
            message: `Vous pouvez reclamer dans ${hoursRemaining}h`,
            canClaim: false,
            nextClaimIn: hoursRemaining
          });
        }
      }

      // Add 5 FCFA to balance
      const newBalance = parseFloat(user.balance) + 5;
      await storage.updateUser(user.id, { 
        balance: newBalance.toString(),
        lastDailyBonusClaim: now
      });

      // Create transaction record
      await storage.createTransaction({
        userId: user.id,
        type: "bonus",
        amount: "5",
        description: "Bonus quotidien"
      });

      res.json({ success: true, message: "Bonus de connexion ajoute!" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/daily-bonus-status", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouve" });
      }

      const now = new Date();
      const lastClaim = user.lastDailyBonusClaim ? new Date(user.lastDailyBonusClaim) : null;
      
      let canClaim = true;
      let hoursRemaining = 0;

      if (lastClaim) {
        const hoursSinceClaim = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
        if (hoursSinceClaim < 24) {
          canClaim = false;
          hoursRemaining = Math.ceil(24 - hoursSinceClaim);
        }
      }

      const allTransactions = await storage.getUserTransactions(req.session.userId!);
      const bonusTransactions = allTransactions.filter(
        (t: any) => t.type === "bonus" && t.description === "Bonus quotidien"
      );
      const totalBonusClaimed = bonusTransactions.reduce(
        (sum: number, t: any) => sum + parseFloat(t.amount || "0"), 0
      );
      const daysPointed = bonusTransactions.length;

      res.json({ canClaim, hoursRemaining, totalBonusClaimed, daysPointed });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getUserTransactions(req.session.userId!);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/links", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        supportLink: settings.supportLink || "https://t.me/EiffageSupport",
        support2Link: settings.support2Link || "https://t.me/EiffageSupport",
        channelLink: settings.channelLink || "https://t.me/EiffageSupport",
        groupLink: settings.groupLink || "https://t.me/EiffageSupport",
        appDownloadLink: settings.appDownloadLink || "",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/settings/withdrawal", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json({
        withdrawalFees: parseFloat(settings.withdrawalFees || "18"),
        withdrawalStartHour: parseInt(settings.withdrawalStartHour || "9"),
        withdrawalEndHour: parseInt(settings.withdrawalEndHour || "17"),
        maxWithdrawalsPerDay: parseInt(settings.maxWithdrawalsPerDay || "1"),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", requireAdmin, async (req, res) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await storage.getStats(startDate, endDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits", requireBanker, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const deposits = await storage.getDeposits(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? deposits : deposits.filter(d => d.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/deposits/soleaspay-stats", requireAdmin, async (req, res) => {
    try {
      const allDeposits = await storage.getDeposits();
      const soleaspayDeposits = allDeposits.filter((d: any) => d.soleaspayReference || d.soleaspayOrderId);

      const approvedSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "approved");
      const totalAll = approvedSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countAll = approvedSoleaspay.length;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const approvedToday = approvedSoleaspay.filter((d: any) => new Date(d.createdAt) >= today);
      const totalToday = approvedToday.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countToday = approvedToday.length;

      const pendingSoleaspay = soleaspayDeposits.filter((d: any) => d.status === "pending" || d.status === "processing");
      const totalPending = pendingSoleaspay.reduce((sum: number, d: any) => sum + Number(d.amount), 0);
      const countPending = pendingSoleaspay.length;

      res.json({
        totalAll,
        countAll,
        totalToday,
        countToday,
        totalPending,
        countPending,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/approve", requireBanker, async (req, res) => {
    try {
      const deposit = await storage.updateDeposit(parseInt(req.params.id), {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      const user = await storage.getUser(deposit.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + deposit.amount;
        await storage.updateUser(user.id, { 
          balance: newBalance.toFixed(2),
          hasDeposited: true,
        });
        
        await storage.createTransaction({
          userId: user.id,
          type: "deposit",
          amount: deposit.amount.toString(),
          description: "Dépôt validé",
        });
      }

      await storage.logAdminAction(req.session.userId!, "approve_deposit", deposit.userId, `Dépôt ${deposit.id} approuvé: ${deposit.amount}F`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/deposits/:id/reject", requireBanker, async (req, res) => {
    try {
      const { ban } = req.body;
      const deposit = await storage.updateDeposit(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      if (ban) {
        await storage.updateUser(deposit.userId, { isBanned: true });
        await storage.logAdminAction(req.session.userId!, "ban_user", deposit.userId, `Utilisateur banni pour fraude`);
      }

      await storage.logAdminAction(req.session.userId!, "reject_deposit", deposit.userId, `Dépôt ${deposit.id} rejeté`);
      res.json(deposit);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/verify-pin", requireAuth, async (req, res) => {
    try {
      const { pin } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Acces refuse" });
      }
      
      // If password is not required for this admin, auto-verify
      if (user.isAdminPasswordRequired === false) {
        return res.json({ success: true });
      }

      if (!user.adminPin) {
        return res.status(400).json({ message: "Code PIN non configure" });
      }
      
      if (user.adminPin !== pin) {
        return res.status(401).json({ message: "Code PIN incorrect" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/withdrawals", requireBanker, async (req, res) => {
    try {
      const status = req.query.status as string || "pending";
      const withdrawals = await storage.getWithdrawals(status === "pending" ? "pending" : undefined);
      const filtered = status === "all" ? withdrawals : withdrawals.filter(w => w.status === status);
      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/approve", requireBanker, async (req, res) => {
    try {
      const withdrawalId = parseInt(req.params.id);
      const existingWithdrawal = await storage.getWithdrawals();
      const withdrawalData = existingWithdrawal.find(w => w.id === withdrawalId);
      
      if (!withdrawalData) {
        return res.status(404).json({ message: "Retrait non trouve" });
      }

      const withdrawal = await storage.updateWithdrawal(withdrawalId, {
        status: "approved",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      await storage.logAdminAction(req.session.userId!, "approve_withdrawal", withdrawalData.userId, `Retrait ${withdrawal.id} approuvé: ${withdrawalData.netAmount}F`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/admin/withdrawals/:id/reject", requireBanker, async (req, res) => {
    try {
      const withdrawal = await storage.updateWithdrawal(parseInt(req.params.id), {
        status: "rejected",
        processedAt: new Date(),
        processedBy: req.session.userId,
      });

      // Refund the user
      const user = await storage.getUser(withdrawal.userId);
      if (user) {
        const newBalance = parseFloat(user.balance) + withdrawal.amount;
        await storage.updateUser(user.id, { balance: newBalance.toFixed(2) });
      }

      await storage.logAdminAction(req.session.userId!, "reject_withdrawal", withdrawal.userId, `Retrait ${withdrawal.id} rejeté et remboursé`);
      res.json(withdrawal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/banker/history", requireBanker, async (req, res) => {
    try {
      const allDeposits = await storage.getDeposits();
      const allWithdrawals = await storage.getWithdrawals();
      const combined = [
        ...allDeposits.map((d: any) => ({ ...d, _type: "deposit" })),
        ...allWithdrawals.map((w: any) => ({ ...w, _type: "withdrawal" })),
      ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(combined);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const search = (req.query.search as string) || "";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      
      const { users: allUsers, total } = await storage.getAllUsers(search, limit, offset);
      const usersWithTeam = await Promise.all(allUsers.map(async (user) => {
        const teamStats = await storage.getTeamStatsSimple(user.id);
        return { ...user, password: undefined, ...teamStats, referrerName: null };
      }));
      res.json({ users: usersWithTeam, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/team", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const team = await storage.getDetailedTeam(userId);
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/users/:id/:action", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const action = req.params.action;
      const { value } = req.body;
      const adminUser = await storage.getUser(req.session.userId!);

      switch (action) {
        case "balance":
          await storage.updateUser(userId, { balance: value.toFixed(2) });
          await storage.logAdminAction(req.session.userId!, "update_balance", userId, `Solde modifié: ${value}F`);
          break;
        case "password":
          await storage.updateUser(userId, { password: value });
          await storage.logAdminAction(req.session.userId!, "reset_password", userId, `Mot de passe réinitialisé`);
          break;
        case "toggle-ban":
          const user1 = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanned: !user1?.isBanned });
          await storage.logAdminAction(req.session.userId!, "toggle_ban", userId, `Statut banni: ${!user1?.isBanned}`);
          break;
        case "toggle-withdrawal":
          const user2 = await storage.getUser(userId);
          await storage.updateUser(userId, { isWithdrawalBlocked: !user2?.isWithdrawalBlocked });
          await storage.logAdminAction(req.session.userId!, "toggle_withdrawal", userId, `Retrait bloqué: ${!user2?.isWithdrawalBlocked}`);
          break;
        case "toggle-promoter":
          const user3 = await storage.getUser(userId);
          await storage.updateUser(userId, { isPromoter: !user3?.isPromoter, promoterSetBy: req.session.userId });
          await storage.logAdminAction(req.session.userId!, "toggle_promoter", userId, `Promoteur: ${!user3?.isPromoter}`);
          break;
        case "toggle-must-invite":
          const user4 = await storage.getUser(userId);
          await storage.updateUser(userId, { mustInviteToWithdraw: !user4?.mustInviteToWithdraw });
          await storage.logAdminAction(req.session.userId!, "toggle_must_invite", userId, `Doit inviter: ${!user4?.mustInviteToWithdraw}`);
          break;
        case "toggle-banker":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const userBanker = await storage.getUser(userId);
          await storage.updateUser(userId, { isBanker: !userBanker?.isBanker });
          await storage.logAdminAction(req.session.userId!, "toggle_banker", userId, `Bankier: ${!userBanker?.isBanker}`);
          break;
        case "toggle-admin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          const user5 = await storage.getUser(userId);
          const newAdminStatus = !user5?.isAdmin;
          await storage.updateUser(userId, { 
            isAdmin: newAdminStatus,
            adminSetBy: req.session.userId,
            adminSetAt: new Date(),
            adminPin: newAdminStatus && value ? value : null,
          });
          await storage.logAdminAction(req.session.userId!, "toggle_admin", userId, `Admin: ${newAdminStatus}`);
          break;
        case "update-admin-pin":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { adminPin: value });
          await storage.logAdminAction(req.session.userId!, "update_admin_pin", userId, `PIN admin mis à jour`);
          break;
        case "toggle-password-required":
          if (!adminUser?.isSuperAdmin) {
            return res.status(403).json({ message: "Action réservée au super admin" });
          }
          await storage.updateUser(userId, { isAdminPasswordRequired: value });
          await storage.logAdminAction(req.session.userId!, "toggle_password_required", userId, `Mot de passe admin requis: ${value}`);
          break;
        case "assign-product":
          await storage.purchaseProduct(userId, value, true);
          await storage.logAdminAction(req.session.userId!, "assign_product", userId, `Produit ${value} attribué`);
          break;
        case "revoke-product":
          await storage.removeUserProduct(userId, value);
          await storage.logAdminAction(req.session.userId!, "revoke_product", userId, `Produit ${value} révoqué`);
          break;
        default:
          return res.status(400).json({ message: "Action invalide" });
      }

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/products/all", requireAdmin, async (req, res) => {
    try {
      const allProducts = await storage.getAllProducts();
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      const { name, price, dailyEarnings, cycleDays, imageUrl, isFree, sortOrder } = req.body;
      if (!name || price === undefined || dailyEarnings === undefined || !cycleDays)
        return res.status(400).json({ message: "Champs requis manquants" });
      const product = await storage.createProduct({
        name,
        price: Number(price),
        dailyEarnings: Number(dailyEarnings),
        cycleDays: Number(cycleDays),
        totalReturn: Number(dailyEarnings) * Number(cycleDays),
        imageUrl: imageUrl || null,
        isFree: isFree ?? false,
        isActive: true,
        sortOrder: sortOrder ?? 0,
      });
      await storage.logAdminAction(req.session.userId!, "create_product", null, `Produit "${product.name}" créé`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      await storage.logAdminAction(req.session.userId!, "delete_product", null, `Produit ${req.params.id} supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/users/:id/products", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userProductsList = await storage.getAllUserProducts(userId);
      res.json(userProductsList.map(up => ({
        id: up.userProduct.id,
        productId: up.userProduct.productId,
        productName: up.product.name,
        productPrice: up.product.price,
        dailyEarnings: up.product.dailyEarnings,
        isActive: up.userProduct.isActive,
        purchaseDate: up.userProduct.purchaseDate,
        daysClaimed: up.product.cycleDays - up.userProduct.daysRemaining,
        totalCycle: up.product.cycleDays,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const product = await storage.updateProduct(parseInt(req.params.id), req.body);
      await storage.logAdminAction(req.session.userId!, "update_product", null, `Produit ${product.id} modifié`);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channels = await storage.getPaymentChannels();
      res.json(channels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/channels", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.createPaymentChannel({
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "create_channel", null, `Canal ${channel.name} créé`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      const channel = await storage.updatePaymentChannel(parseInt(req.params.id), {
        ...req.body,
        modifiedBy: req.session.userId,
      });
      await storage.logAdminAction(req.session.userId!, "update_channel", null, `Canal ${channel.name} modifié`);
      res.json(channel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/channels/:id", requireAdmin, async (req, res) => {
    try {
      await storage.deletePaymentChannel(parseInt(req.params.id));
      await storage.logAdminAction(req.session.userId!, "delete_channel", null, `Canal supprimé`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/settings", requireAdmin, async (req, res) => {
    try {
      const entries = Object.entries(req.body);
      for (const [key, value] of entries) {
        await storage.setSetting(key, value as string, req.session.userId);
      }
      await storage.logAdminAction(req.session.userId!, "update_settings", null, `Paramètres modifiés`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // APK upload route
  const apkDir = path.resolve(process.cwd(), "uploads/apk");
  if (!fs.existsSync(apkDir)) fs.mkdirSync(apkDir, { recursive: true });

  const apkStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, apkDir),
    filename: (_req, _file, cb) => cb(null, `eiffage-app.apk`),
  });
  const apkUpload = multer({
    storage: apkStorage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype === "application/vnd.android.package-archive" || file.originalname.endsWith(".apk")) {
        cb(null, true);
      } else {
        cb(new Error("Only .apk files are allowed"));
      }
    },
  });

  app.use("/uploads/apk", express.static(apkDir));

  app.post("/api/admin/upload-apk", requireAdmin, apkUpload.single("apk"), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const fileUrl = `${baseUrl}/uploads/apk/eiffage-app.apk`;
      await storage.setSetting("appDownloadLink", fileUrl, req.session.userId);
      await storage.logAdminAction(req.session.userId!, "upload_apk", null, `APK uploadé: ${req.file.originalname}`);
      res.json({ success: true, url: fileUrl, filename: req.file.originalname, size: req.file.size });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Reset stats route (Super Admin only)
  app.post("/api/admin/reset-stats", requireAdmin, async (req, res) => {
    try {
      const adminUser = await storage.getUser(req.session.userId!);
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ message: "Action réservée au super admin" });
      }

      await storage.resetStats();
      await storage.logAdminAction(req.session.userId!, "reset_stats", null, "Réinitialisation des statistiques de la plateforme");
      res.json({ success: true, message: "Statistiques réinitialisées" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Gift Codes Routes
  app.get("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const codes = await storage.getAllGiftCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const createGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    amount: z.number().positive("Le montant doit etre positif").or(z.string().transform(Number)),
    maxUses: z.number().int().positive("Le nombre d'utilisations doit etre positif"),
    expiresAt: z.string().refine((val) => !isNaN(Date.parse(val)), "Date d'expiration invalide"),
  });

  app.post("/api/admin/gift-codes", requireAdmin, async (req, res) => {
    try {
      const parseResult = createGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Donnees invalides" });
      }

      const { code, amount, maxUses, expiresAt } = parseResult.data;

      const existingCode = await storage.getGiftCodeByCode(code);
      if (existingCode) {
        return res.status(400).json({ message: "Ce code existe deja" });
      }

      const giftCode = await storage.createGiftCode({
        code,
        amount: amount.toString(),
        maxUses,
        expiresAt: new Date(expiresAt),
        createdBy: req.session.userId!,
      });

      await storage.logAdminAction(req.session.userId!, "create_gift_code", null, `Code cadeau cree: ${code} - ${amount} FCFA`);
      res.json(giftCode);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/admin/gift-codes/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteGiftCode(id);
      await storage.logAdminAction(req.session.userId!, "delete_gift_code", null, `Code cadeau supprimé: #${id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  const claimGiftCodeSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
  });

  app.post("/api/gift-codes/claim", requireAuth, async (req, res) => {
    try {
      const parseResult = claimGiftCodeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: parseResult.error.errors[0]?.message || "Le code est requis" });
      }

      const code = parseResult.data.code.trim().toUpperCase();
      const userId = req.session.userId!;

      const giftCode = await storage.getGiftCodeByCode(code);
      if (!giftCode) {
        return res.status(404).json({ message: "Code invalide" });
      }

      if (!giftCode.isActive) {
        return res.status(400).json({ message: "Ce code n'est plus actif" });
      }

      if (new Date() > new Date(giftCode.expiresAt)) {
        return res.status(400).json({ message: "Ce code a expiré" });
      }

      if (giftCode.currentUses >= giftCode.maxUses) {
        return res.status(400).json({ message: "Ce code a atteint sa limite d'utilisation" });
      }

      const hasClaimed = await storage.hasUserClaimedGiftCode(userId, giftCode.id);
      if (hasClaimed) {
        return res.status(400).json({ message: "Vous avez déjà utilisé ce code" });
      }

      await storage.claimGiftCode(userId, giftCode.id, parseFloat(giftCode.amount));
      
      res.json({ 
        success: true, 
        message: `Félicitations! Vous avez reçu ${parseFloat(giftCode.amount).toLocaleString()} FCFA`,
        amount: parseFloat(giftCode.amount)
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ── Info Articles ──────────────────────────────────────
  app.get("/api/info-articles", requireAuth, async (req, res) => {
    const articles = await storage.getInfoArticles();
    res.json(articles);
  });

  app.get("/api/info-articles/:id", requireAuth, async (req, res) => {
    const article = await storage.getInfoArticle(Number(req.params.id));
    if (!article) return res.status(404).json({ message: "Article introuvable" });
    res.json(article);
  });

  app.post("/api/admin/info-articles", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, coverImage, content, extraImages } = req.body;
      if (!title || !coverImage) return res.status(400).json({ message: "Titre et image de couverture requis" });
      const article = await storage.createInfoArticle({ title, coverImage, content: content || "", extraImages: extraImages || [] });
      res.json(article);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.put("/api/admin/info-articles/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { title, coverImage, content, extraImages } = req.body;
      const article = await storage.updateInfoArticle(Number(req.params.id), { title, coverImage, content, extraImages });
      res.json(article);
    } catch (e: any) { res.status(400).json({ message: e.message }); }
  });

  app.delete("/api/admin/info-articles/:id", requireAuth, requireAdmin, async (req, res) => {
    await storage.deleteInfoArticle(Number(req.params.id));
    res.json({ success: true });
  });

  // ── SendavaPay (Dépôt Auto) ─────────────────────────────
  app.post("/api/sendavapay/deposit", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const settings = await storage.getSettings();
      const enabled = settings.sendavapayEnabled === "true";
      const apiKey = process.env.SENDAVAPAY_API_KEY || "";
      if (!enabled || !apiKey) return res.status(400).json({ message: "SendavaPay non activé" });

      const { amount } = req.body;
      const minDeposit = parseInt(settings.minDeposit || "3000");
      if (!amount || amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit} FCFA` });
      }

      const host = process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : `${req.protocol}://${req.get("host")}`;

      const externalRef = `EIF-${user.id}-${Date.now()}`;
      const redirectUrl = `${host}/deposit-orders`;

      const result = await sendavapay.createPayment(apiKey, {
        amount,
        currency: "XOF",
        description: "Recharge EIFFAGE",
        externalReference: externalRef,
        customerPhone: user.phone,
        customerName: user.fullName,
        redirectUrl,
      });

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: user.phone,
        country: user.country,
        paymentMethod: "SendavaPay",
        status: "pending",
        depositType: "auto",
        sendavapayReference: result.reference,
        soleaspayOrderId: externalRef,
      });

      res.json({ depositId: deposit.id, paymentUrl: result.paymentUrl, reference: result.reference });
    } catch (e: any) {
      console.error("[sendavapay] deposit error:", e);
      res.status(500).json({ message: e.message || "Erreur SendavaPay" });
    }
  });

  app.get("/api/sendavapay/deposit/:id/status", requireAuth, async (req, res) => {
    try {
      const deposit = await storage.getDeposit(Number(req.params.id));
      if (!deposit || deposit.userId !== req.session.userId!) {
        return res.status(404).json({ message: "Dépôt introuvable" });
      }
      if (!deposit.sendavapayReference) return res.json({ status: deposit.status });

      const apiKey = process.env.SENDAVAPAY_API_KEY || "";
      const result = await sendavapay.verifyPayment(apiKey, deposit.sendavapayReference);
      const mappedStatus = sendavapay.mapSendavapayStatus(result.status);

      if (mappedStatus === "approved" && deposit.status === "pending") {
        await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });
        const user = await storage.getUser(deposit.userId);
        if (user) {
          await storage.updateUser(user.id, {
            balance: String(parseFloat(user.balance) + deposit.amount),
            hasDeposited: true,
          });
          await storage.createTransaction({ userId: user.id, type: "deposit", amount: String(deposit.amount), description: `Recharge SendavaPay ${deposit.amount} FCFA` });
          await storage.processDepositReferralCommissions(user.id, deposit.amount);
        }
      }
      res.json({ status: mappedStatus, rawStatus: result.status });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/webhooks/sendavapay", async (req, res) => {
    try {
      const webhookSecret = process.env.SENDAVAPAY_WEBHOOK_SECRET || "";
      const signature = req.headers["x-sendavapay-signature"] as string;
      const event = req.headers["x-sendavapay-event"] as string;

      if (webhookSecret && signature) {
        const valid = sendavapay.verifyWebhookSignature(req.body, signature, webhookSecret);
        if (!valid) {
          console.error("[sendavapay] webhook invalid signature");
          return res.status(401).json({ error: "Invalid signature" });
        }
      }

      const { data } = req.body;
      if (event === "payment.completed" && data?.externalReference) {
        const externalRef = data.externalReference as string;
        const deposits = await storage.getDeposits("pending");
        const deposit = deposits.find(d => d.soleaspayOrderId === externalRef);
        if (deposit && deposit.status === "pending") {
          await storage.updateDeposit(deposit.id, { status: "approved", processedAt: new Date() });
          const user = await storage.getUser(deposit.userId);
          if (user) {
            await storage.updateUser(user.id, {
              balance: String(parseFloat(user.balance) + deposit.amount),
              hasDeposited: true,
            });
            await storage.createTransaction({ userId: user.id, type: "deposit", amount: String(deposit.amount), description: `Recharge SendavaPay ${deposit.amount} FCFA` });
            await storage.processDepositReferralCommissions(user.id, deposit.amount);
          }
        }
      }
      res.json({ received: true });
    } catch (e: any) {
      console.error("[sendavapay] webhook error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // ── Semi-Auto Deposit (Dépôt Manuel Guidé) ─────────────
  app.post("/api/deposits/semi-auto", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(401).json({ message: "Non authentifié" });

      const { amount, senderNumber, destinationNumber, paymentMethod, screenshotData, paymentReceivedMessage } = req.body;
      const settings = await storage.getSettings();
      const minDeposit = parseInt(settings.minDeposit || "3000");
      if (!amount || amount < minDeposit) {
        return res.status(400).json({ message: `Montant minimum: ${minDeposit} FCFA` });
      }
      if (!senderNumber) return res.status(400).json({ message: "Numéro expéditeur requis" });
      if (!destinationNumber) return res.status(400).json({ message: "Numéro destinataire requis" });
      if (!screenshotData) return res.status(400).json({ message: "Capture d'écran requise" });

      const deposit = await storage.createDeposit({
        userId: user.id,
        amount,
        accountName: user.fullName,
        accountNumber: destinationNumber,
        country: user.country,
        paymentMethod: paymentMethod || "Mobile Money",
        status: "pending",
        depositType: "semi_auto",
        senderNumber,
        destinationNumber,
        screenshotData,
        paymentReceivedMessage: paymentReceivedMessage || null,
      });
      res.json(deposit);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Manual Payment Accounts (Comptes de paiement semi-auto) ──
  app.get("/api/manual-payment-accounts", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    const country = req.query.country as string | undefined;
    const accounts = await storage.getManualPaymentAccounts(country || user?.country);
    res.json(accounts);
  });

  app.get("/api/admin/manual-payment-accounts", requireAuth, requireAdmin, async (req, res) => {
    const accounts = await storage.getManualPaymentAccounts();
    res.json(accounts);
  });

  app.post("/api/admin/manual-payment-accounts", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { operatorName, ownerName, phoneNumber, country, logoUrl, isActive } = req.body;
      if (!operatorName || !ownerName || !phoneNumber || !country) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
      const account = await storage.createManualPaymentAccount({ operatorName, ownerName, phoneNumber, country, logoUrl, isActive: isActive ?? true });
      res.json(account);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/admin/manual-payment-accounts/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { operatorName, ownerName, phoneNumber, country, logoUrl, isActive } = req.body;
      const account = await storage.updateManualPaymentAccount(Number(req.params.id), { operatorName, ownerName, phoneNumber, country, logoUrl, isActive });
      res.json(account);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.delete("/api/admin/manual-payment-accounts/:id", requireAuth, requireAdmin, async (req, res) => {
    await storage.deleteManualPaymentAccount(Number(req.params.id));
    res.json({ success: true });
  });

  // ── Countries (public) ─────────────────────────────────────────────────────
  app.get("/api/countries", async (_req, res) => {
    try {
      const list = await storage.getCountries(true);
      res.json(list);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  // ── Countries (admin CRUD) ─────────────────────────────────────────────────
  app.get("/api/admin/countries", requireAuth, requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.getCountries(false));
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/countries", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { code, name, currency, phonePrefix } = req.body;
      if (!code || !name || !currency || !phonePrefix)
        return res.status(400).json({ message: "Tous les champs sont requis" });
      const country = await storage.createCountry({ code: code.toUpperCase(), name, currency, phonePrefix });
      res.json(country);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.put("/api/admin/countries/:code", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { name, currency, phonePrefix, isActive } = req.body;
      const country = await storage.updateCountry(req.params.code, { name, currency, phonePrefix, isActive });
      res.json(country);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/admin/countries/:code", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteCountry(req.params.code);
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/countries/:code/operators", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { operatorName } = req.body;
      if (!operatorName) return res.status(400).json({ message: "Nom de l'opérateur requis" });
      const op = await storage.addOperator(req.params.code, operatorName);
      res.json(op);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.delete("/api/admin/operators/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      await storage.deleteOperator(Number(req.params.id));
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  return httpServer;
}
