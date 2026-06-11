import { db } from "./db";
import { users, products, tasks, platformSettings } from "@shared/schema";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";

export async function seed() {
  console.log("Seeding database...");

  // Create session table for connect-pg-simple (if not exists)
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "sid" varchar NOT NULL COLLATE "default",
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL,
      CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
    ) WITH (OIDS=FALSE)
  `);
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
  `);

  // Apply any missing column migrations
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banker BOOLEAN NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_invite_to_withdraw BOOLEAN NOT NULL DEFAULT false`);
  await db.execute(sql`ALTER TABLE platform_settings ADD COLUMN IF NOT EXISTS updated_by INTEGER`);
  await db.execute(sql`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS deposit_type TEXT NOT NULL DEFAULT 'manual'`);
  await db.execute(sql`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS sendavapay_reference TEXT`);
  await db.execute(sql`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS payment_received_message TEXT`);
  await db.execute(sql`ALTER TABLE deposits ADD COLUMN IF NOT EXISTS destination_number TEXT`);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS manual_payment_accounts (
      id SERIAL PRIMARY KEY,
      operator_name TEXT NOT NULL,
      owner_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      country TEXT NOT NULL,
      logo_url TEXT,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Countries and operators tables
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS countries (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      currency TEXT NOT NULL,
      phone_prefix TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS country_operators (
      id SERIAL PRIMARY KEY,
      country_code TEXT NOT NULL,
      operator_name TEXT NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT true
    )
  `);

  // Seed initial countries if empty
  const existingCountries = await db.execute(sql`SELECT COUNT(*) as cnt FROM countries`);
  if (parseInt((existingCountries.rows[0] as any).cnt) === 0) {
    const initialCountries = [
      { code: "CM", name: "Cameroun",           currency: "XAF", phonePrefix: "237" },
      { code: "BF", name: "Burkina Faso",        currency: "XOF", phonePrefix: "226" },
      { code: "TG", name: "Togo",                currency: "XOF", phonePrefix: "228" },
      { code: "BJ", name: "Benin",               currency: "XOF", phonePrefix: "229" },
      { code: "CI", name: "Cote d'Ivoire",       currency: "XOF", phonePrefix: "225" },
      { code: "CG", name: "Congo Brazzaville",   currency: "XAF", phonePrefix: "242" },
      { code: "CD", name: "RDC",                 currency: "CDF", phonePrefix: "243" },
    ];
    const initialOperators: { code: string; op: string }[] = [
      { code: "CM", op: "Orange Money" }, { code: "CM", op: "MTN Mobile Money" },
      { code: "BF", op: "Orange Money" }, { code: "BF", op: "Moov Money" },
      { code: "TG", op: "Moov Money" },   { code: "TG", op: "Mixx by Yas" },
      { code: "BJ", op: "MTN Mobile Money" }, { code: "BJ", op: "Moov Money" }, { code: "BJ", op: "Celtis" },
      { code: "CI", op: "Wave" }, { code: "CI", op: "MTN Mobile Money" }, { code: "CI", op: "Orange Money" }, { code: "CI", op: "Moov Money" },
      { code: "CG", op: "MTN Mobile Money" },
      { code: "CD", op: "Airtel Money" },
    ];
    for (const c of initialCountries) {
      await db.execute(sql`INSERT INTO countries (code, name, currency, phone_prefix) VALUES (${c.code}, ${c.name}, ${c.currency}, ${c.phonePrefix}) ON CONFLICT (code) DO NOTHING`);
    }
    for (const o of initialOperators) {
      await db.execute(sql`INSERT INTO country_operators (country_code, operator_name) VALUES (${o.code}, ${o.op})`);
    }
    console.log("Countries and operators seeded.");
  }

  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.phone, "99935673"));
  const hashedPassword = await bcrypt.hash("pagetstudio", 10);

  if (existingAdmin.length === 0) {
    // Create super admin
    await db.insert(users).values({
      fullName: "Super Admin",
      phone: "99935673",
      country: "CM",
      password: hashedPassword,
      referralCode: "ADMIN1",
      balance: "0",
      isAdmin: true,
      isSuperAdmin: true,
      adminPin: "9993",
    });
    console.log("Super admin created: 99935673 / AAbb11## / PIN: 9993");
  } else {
    // Always sync admin password, flags, PIN and country
    await db.update(users)
      .set({ password: hashedPassword, isAdmin: true, isSuperAdmin: true, adminPin: "9993", country: "CM" })
      .where(eq(users.phone, "99935673"));
    console.log("Super admin password synced.");
  }

  // Check if products exist - update all products to match robot structure
  const existingProducts = await db.select().from(products);
  const requiredProducts = [
    {
      name: "Free Bonus",
      price: 0,
      dailyEarnings: 5,
      cycleDays: 1,
      totalReturn: 5,
      isFree: true,
      sortOrder: 0,
    },
    {
      name: "Rouleau Compacteur",
      price: 3000,
      dailyEarnings: 400,
      cycleDays: 80,
      totalReturn: 32000,
      sortOrder: 1,
    },
    {
      name: "Chargeuse-Pelleteuse",
      price: 7000,
      dailyEarnings: 1000,
      cycleDays: 80,
      totalReturn: 80000,
      sortOrder: 2,
    },
    {
      name: "Pelleteuse Hydraulique",
      price: 12000,
      dailyEarnings: 1600,
      cycleDays: 80,
      totalReturn: 128000,
      sortOrder: 3,
    },
    {
      name: "Camion Bétonnière",
      price: 20000,
      dailyEarnings: 3500,
      cycleDays: 80,
      totalReturn: 280000,
      sortOrder: 4,
    },
    {
      name: "Camion Benne",
      price: 35000,
      dailyEarnings: 5000,
      cycleDays: 80,
      totalReturn: 400000,
      sortOrder: 5,
    },
    {
      name: "Grue à Tour",
      price: 50000,
      dailyEarnings: 8000,
      cycleDays: 80,
      totalReturn: 640000,
      sortOrder: 6,
    },
    {
      name: "Bulldozer",
      price: 75000,
      dailyEarnings: 12000,
      cycleDays: 80,
      totalReturn: 960000,
      sortOrder: 7,
    },
    {
      name: "Finisseur de Chaussée",
      price: 100000,
      dailyEarnings: 18000,
      cycleDays: 80,
      totalReturn: 1440000,
      sortOrder: 8,
    },
    {
      name: "Foreuse",
      price: 200000,
      dailyEarnings: 40000,
      cycleDays: 80,
      totalReturn: 3200000,
      sortOrder: 9,
    },
    {
      name: "Tunnelier",
      price: 400000,
      dailyEarnings: 100000,
      cycleDays: 80,
      totalReturn: 8000000,
      sortOrder: 10,
    },
  ];

  // Update existing products by matching name, price, or sortOrder (to preserve IDs)
  // Hide old products that don't match any new product by setting them inactive
  const usedIds = new Set<number>();

  for (const productData of requiredProducts) {
    let existing = existingProducts.find(p => p.name === productData.name);
    if (!existing) {
      existing = existingProducts.find(p => p.price === productData.price && !usedIds.has(p.id));
    }
    if (!existing && productData.sortOrder !== undefined) {
      existing = existingProducts.find(p => p.sortOrder === productData.sortOrder && !usedIds.has(p.id));
    }
    if (existing) {
      usedIds.add(existing.id);
      await db.update(products).set({
        name: productData.name,
        price: productData.price,
        dailyEarnings: productData.dailyEarnings,
        cycleDays: productData.cycleDays,
        totalReturn: productData.totalReturn,
        sortOrder: productData.sortOrder,
        isFree: productData.isFree || false,
        isActive: true,
      }).where(eq(products.id, existing.id));
      console.log(`Product updated: ${productData.name}`);
    } else {
      await db.insert(products).values(productData);
      console.log(`Product added: ${productData.name}`);
    }
  }

  // Deactivate old products not in the new list
  for (const existing of existingProducts) {
    if (!usedIds.has(existing.id)) {
      await db.update(products).set({ isActive: false, sortOrder: 99 }).where(eq(products.id, existing.id));
      console.log(`Product deactivated: ${existing.name}`);
    }
  }
  console.log("Products updated to VIP structure");

  // Check if tasks exist - update to 5 referral bonus missions (PHP rewards)
  const existingTasks = await db.select().from(tasks);
  const requiredTasks = [
    { name: "Mission 1 - Parrainage", description: "Invitez 3 personnes qui ont effectué un dépôt et acheté un produit pour gagner 300 FCFA",     requiredInvites: 3,   reward: 300,   sortOrder: 1 },
    { name: "Mission 2 - Parrainage", description: "Invitez 10 personnes qui ont effectué un dépôt et acheté un produit pour gagner 1 000 FCFA",   requiredInvites: 10,  reward: 1000,  sortOrder: 2 },
    { name: "Mission 3 - Parrainage", description: "Invitez 20 personnes qui ont effectué un dépôt et acheté un produit pour gagner 3 500 FCFA",   requiredInvites: 20,  reward: 3500,  sortOrder: 3 },
    { name: "Mission 4 - Parrainage", description: "Invitez 70 personnes qui ont effectué un dépôt et acheté un produit pour gagner 10 000 FCFA",  requiredInvites: 70,  reward: 10000, sortOrder: 4 },
    { name: "Mission 5 - Parrainage", description: "Invitez 150 personnes qui ont effectué un dépôt et acheté un produit pour gagner 20 000 FCFA", requiredInvites: 150, reward: 20000, sortOrder: 5 },
    { name: "Mission 6 - Parrainage", description: "Invitez 500 personnes qui ont effectué un dépôt et acheté un produit pour gagner 45 000 FCFA", requiredInvites: 500, reward: 45000, sortOrder: 6 },
  ];

  const usedTaskIds = new Set<number>();
  for (const taskData of requiredTasks) {
    let existing = existingTasks.find(t => t.name === taskData.name);
    if (!existing) {
      existing = existingTasks.find(t => t.sortOrder === taskData.sortOrder && !usedTaskIds.has(t.id));
    }
    if (existing) {
      usedTaskIds.add(existing.id);
      await db.update(tasks).set({
        name: taskData.name,
        reward: taskData.reward,
        requiredInvites: taskData.requiredInvites,
        description: taskData.description,
        sortOrder: taskData.sortOrder,
      }).where(eq(tasks.id, existing.id));
      console.log(`Task updated: ${taskData.name}`);
    } else {
      await db.insert(tasks).values(taskData);
      console.log(`Task added: ${taskData.name}`);
    }
  }
  // Remove tasks that no longer exist in required list
  for (const existing of existingTasks) {
    if (!usedTaskIds.has(existing.id)) {
      await db.delete(tasks).where(eq(tasks.id, existing.id));
      console.log(`Task removed: ${existing.name}`);
    }
  }
  console.log("Tasks updated to 5 referral bonus missions");


  // Check if settings exist
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://wa.me/qr/IXZNRQDK7IFJH1" },
    { key: "support2Link", value: "https://t.me/EIFFAGE_service" },
    { key: "channelLink", value: "https://t.me/EIFFAGE_canzl" },
    { key: "groupLink", value: "https://whatsapp.com/channel/0029VbDH4mGElagq0ISJ7e1N" },
    { key: "signupBonus", value: "500" },
    { key: "minDeposit", value: "3000" },
    { key: "minWithdrawal", value: "1500" },
    { key: "withdrawalFees", value: "18" },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "maxWithdrawalsPerDay", value: "1" },
    { key: "level1Commission", value: "18" },
    { key: "level2Commission", value: "2" },
    { key: "level3Commission", value: "1" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayApiKey", value: "" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "Westpay" },
    { key: "ashtechpayEnabled", value: "false" },
    { key: "ashtechpayApiKey", value: "" },
    { key: "ashtechpayChannelName", value: "AshtechPay" },
    { key: "cloudpayEnabled", value: "false" },
    { key: "cloudpayMerchantId", value: "" },
    { key: "cloudpaySecretKey", value: "" },
    { key: "cloudpayDomain", value: "" },
    { key: "cloudpayChannelName", value: "CloudPay" },
    { key: "sendavapayEnabled", value: "false" },
    { key: "sendavapayApiKey", value: "" },
    { key: "sendavapayWebhookSecret", value: "" },
    { key: "adminCurrency", value: "FCFA" },
    { key: "phpToFcfaRate", value: "1" },
  ];

  // Settings that should always be updated to the required value (critical platform config)
  const alwaysUpdateKeys = new Set(["signupBonus", "minDeposit", "minWithdrawal", "withdrawalFees", "withdrawalStartHour", "withdrawalEndHour", "maxWithdrawalsPerDay", "level1Commission", "level2Commission", "level3Commission", "supportLink", "support2Link", "channelLink", "groupLink", "adminCurrency", "phpToFcfaRate"]);

  for (const settingData of requiredSettings) {
    const existing = existingSettings.find(s => s.key === settingData.key);
    if (!existing) {
      await db.insert(platformSettings).values(settingData);
      console.log(`Setting added: ${settingData.key}`);
    } else if (alwaysUpdateKeys.has(settingData.key) && existing.value !== settingData.value) {
      await db.update(platformSettings).set({ value: settingData.value }).where(eq(platformSettings.key, settingData.key));
      console.log(`Setting updated: ${settingData.key} = ${settingData.value}`);
    } else {
      console.log(`Setting preserved: ${settingData.key} = ${existing.value}`);
    }
  }
  console.log("Settings check complete (existing values preserved)");

  console.log("Database seeding complete!");
}
