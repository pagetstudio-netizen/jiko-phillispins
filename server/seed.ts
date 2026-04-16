import { db } from "./db";
import { users, products, tasks, platformSettings } from "@shared/schema";
import bcrypt from "bcrypt";
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
      country: "BJ",
      password: hashedPassword,
      referralCode: "ADMIN1",
      balance: "0",
      isAdmin: true,
      isSuperAdmin: true,
      adminPin: "9993",
    });
    console.log("Super admin created: 99935673 / AAbb11## / PIN: 9993");
  } else {
    // Always sync admin password, flags and PIN
    await db.update(users)
      .set({ password: hashedPassword, isAdmin: true, isSuperAdmin: true, adminPin: "9993" })
      .where(eq(users.phone, "99935673"));
    console.log("Super admin password synced.");
  }

  // Check if products exist - update all products to match VIP structure
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
      name: "Mini Solar Panel",
      price: 3000,
      dailyEarnings: 500,
      cycleDays: 120,
      totalReturn: 60000,
      sortOrder: 1,
    },
    {
      name: "Basic Solar Kit",
      price: 8000,
      dailyEarnings: 1000,
      cycleDays: 120,
      totalReturn: 120000,
      sortOrder: 2,
    },
    {
      name: "Solar Panel 100W",
      price: 15000,
      dailyEarnings: 1600,
      cycleDays: 120,
      totalReturn: 192000,
      sortOrder: 3,
    },
    {
      name: "Solar Panel 200W",
      price: 25000,
      dailyEarnings: 2400,
      cycleDays: 120,
      totalReturn: 288000,
      sortOrder: 4,
    },
    {
      name: "Home Solar System",
      price: 50000,
      dailyEarnings: 5000,
      cycleDays: 120,
      totalReturn: 600000,
      sortOrder: 5,
    },
    {
      name: "Mini Solar Plant",
      price: 120000,
      dailyEarnings: 13000,
      cycleDays: 120,
      totalReturn: 1560000,
      sortOrder: 6,
    },
    {
      name: "Advanced Solar Station",
      price: 350000,
      dailyEarnings: 25000,
      cycleDays: 120,
      totalReturn: 3000000,
      sortOrder: 7,
    },
    {
      name: "Industrial Solar Plant",
      price: 550000,
      dailyEarnings: 57000,
      cycleDays: 120,
      totalReturn: 6840000,
      sortOrder: 8,
    },
  ];

  // Update existing products by matching price, or insert new ones
  // Hide old products that don't match any new product by setting them inactive
  const usedIds = new Set<number>();

  for (const productData of requiredProducts) {
    let existing = existingProducts.find(p => p.name === productData.name);
    if (!existing) {
      existing = existingProducts.find(p => p.price === productData.price && !usedIds.has(p.id));
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

  // Check if tasks exist
  const existingTasks = await db.select().from(tasks);
  const requiredTasks = [
    { name: "Bronze Referrer", description: "Invite 3 people to invest", requiredInvites: 3, reward: 35, sortOrder: 1 },
    { name: "Silver Referrer", description: "Invite 5 people to invest", requiredInvites: 5, reward: 75, sortOrder: 2 },
    { name: "Gold Referrer", description: "Invite 10 people to invest", requiredInvites: 10, reward: 250, sortOrder: 3 },
    { name: "Platinum Referrer", description: "Invite 30 people to invest", requiredInvites: 30, reward: 650, sortOrder: 4 },
    { name: "Diamond Referrer", description: "Invite 100 people to invest", requiredInvites: 100, reward: 1500, sortOrder: 5 },
    { name: "Elite Referrer", description: "Invite 300 people to invest", requiredInvites: 300, reward: 5000, sortOrder: 6 },
  ];

  for (const taskData of requiredTasks) {
    const existing = existingTasks.find(t => t.name === taskData.name);
    if (!existing) {
      await db.insert(tasks).values(taskData);
      console.log(`Task added: ${taskData.name}`);
    } else {
      if (existing.reward !== taskData.reward || existing.requiredInvites !== taskData.requiredInvites || existing.description !== taskData.description) {
        await db.update(tasks).set({
          reward: taskData.reward,
          requiredInvites: taskData.requiredInvites,
          description: taskData.description,
          sortOrder: taskData.sortOrder,
        }).where(eq(tasks.id, existing.id));
        console.log(`Task updated: ${taskData.name}`);
      }
    }
  }
  console.log("Tasks check complete (existing values preserved)");


  // Check if settings exist
  const existingSettings = await db.select().from(platformSettings);
  const requiredSettings = [
    { key: "supportLink", value: "https://t.me/Jinkosolarr" },
    { key: "support2Link", value: "https://t.me/Jinkosolarr" },
    { key: "channelLink", value: "https://t.me/Jinkosolarr" },
    { key: "groupLink", value: "https://t.me/+R9SFSGneBkg3NTFh" },
    { key: "minDeposit", value: "3000" },
    { key: "minWithdrawal", value: "1200" },
    { key: "withdrawalFees", value: "17" },
    { key: "withdrawalStartHour", value: "8" },
    { key: "withdrawalEndHour", value: "17" },
    { key: "level1Commission", value: "27" },
    { key: "level2Commission", value: "2" },
    { key: "level3Commission", value: "1" },
    { key: "soleaspayEnabled", value: "false" },
    { key: "soleaspayApiKey", value: "" },
    { key: "soleaspayCountries", value: "" },
    { key: "soleaspayChannelName", value: "Westpay" },
    { key: "ashtechpayEnabled", value: "false" },
    { key: "ashtechpayApiKey", value: "" },
    { key: "ashtechpayChannelName", value: "AshtechPay" },
    { key: "adminCurrency", value: "PHP" },
    { key: "phpToFcfaRate", value: "10" },
  ];

  // Settings that should always be updated to the required value (critical platform config)
  const alwaysUpdateKeys = new Set(["minDeposit", "minWithdrawal", "groupLink"]);

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
