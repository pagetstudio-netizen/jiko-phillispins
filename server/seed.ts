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

  // Check if admin already exists
  const existingAdmin = await db.select().from(users).where(eq(users.phone, "99935673"));
  const hashedPassword = await bcrypt.hash("AAbb11##", 10);

  if (existingAdmin.length === 0) {
    // Create super admin
    await db.insert(users).values({
      fullName: "Super Admin",
      phone: "99935673",
      country: "PH",
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
      .set({ password: hashedPassword, isAdmin: true, isSuperAdmin: true, adminPin: "9993", country: "PH" })
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
      name: "Nano AI Robot",
      price: 500,
      dailyEarnings: 50,
      cycleDays: 30,
      totalReturn: 1500,
      sortOrder: 1,
    },
    {
      name: "Smart AI Robot",
      price: 2000,
      dailyEarnings: 200,
      cycleDays: 30,
      totalReturn: 6000,
      sortOrder: 2,
    },
    {
      name: "Pro AI Robot",
      price: 5000,
      dailyEarnings: 500,
      cycleDays: 30,
      totalReturn: 15000,
      sortOrder: 3,
    },
    {
      name: "Elite AI Robot",
      price: 10000,
      dailyEarnings: 1000,
      cycleDays: 30,
      totalReturn: 30000,
      sortOrder: 4,
    },
    {
      name: "Premium AI Robot",
      price: 20000,
      dailyEarnings: 2000,
      cycleDays: 30,
      totalReturn: 60000,
      sortOrder: 5,
    },
    {
      name: "Expert AI Robot",
      price: 50000,
      dailyEarnings: 5000,
      cycleDays: 30,
      totalReturn: 150000,
      sortOrder: 6,
    },
    {
      name: "Master AI Robot",
      price: 100000,
      dailyEarnings: 10000,
      cycleDays: 30,
      totalReturn: 300000,
      sortOrder: 7,
    },
    {
      name: "Ultra AI Robot",
      price: 200000,
      dailyEarnings: 20000,
      cycleDays: 30,
      totalReturn: 600000,
      sortOrder: 8,
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
    { name: "Mission 1 - Referral", description: "Reach 1,000 in total team investment to earn a reward of 100",    requiredInvites: 1000,   reward: 100,  sortOrder: 1 },
    { name: "Mission 2 - Referral", description: "Reach 5,000 in total team investment to earn a reward of 500",    requiredInvites: 5000,   reward: 500,  sortOrder: 2 },
    { name: "Mission 3 - Referral", description: "Reach 20,000 in total team investment to earn a reward of 1,000", requiredInvites: 20000,  reward: 1000, sortOrder: 3 },
    { name: "Mission 4 - Referral", description: "Reach 50,000 in total team investment to earn a reward of 2,000", requiredInvites: 50000,  reward: 2000, sortOrder: 4 },
    { name: "Mission 5 - Referral", description: "Reach 100,000 in total team investment to earn a reward of 5,000",requiredInvites: 100000, reward: 5000, sortOrder: 5 },
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
    { key: "supportLink", value: "https://t.me/noviqraai" },
    { key: "support2Link", value: "https://t.me/noviqraai" },
    { key: "channelLink", value: "https://t.me/noviqraai" },
    { key: "groupLink", value: "https://t.me/+Y9c8J9PO1hg0MGNh" },
    { key: "minDeposit", value: "500" },
    { key: "minWithdrawal", value: "50" },
    { key: "withdrawalFees", value: "0" },
    { key: "withdrawalStartHour", value: "9" },
    { key: "withdrawalEndHour", value: "18" },
    { key: "level1Commission", value: "20" },
    { key: "level2Commission", value: "3" },
    { key: "level3Commission", value: "2" },
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
    { key: "adminCurrency", value: "PHP" },
    { key: "phpToFcfaRate", value: "10" },
  ];

  // Settings that should always be updated to the required value (critical platform config)
  const alwaysUpdateKeys = new Set(["minDeposit", "minWithdrawal", "withdrawalFees", "withdrawalStartHour", "withdrawalEndHour", "level1Commission", "level2Commission", "level3Commission", "groupLink"]);

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
