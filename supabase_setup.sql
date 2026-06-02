-- ============================================================
-- NOVIQRA AI - Script de configuration Supabase
-- Colle ce script dans : Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ========================
-- 1. CRÉATION DES TABLES
-- ========================

CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "full_name" text NOT NULL,
  "phone" text NOT NULL UNIQUE,
  "country" text NOT NULL,
  "password" text NOT NULL,
  "referral_code" text NOT NULL UNIQUE,
  "referred_by" text,
  "balance" decimal(15,2) NOT NULL DEFAULT '700',
  "today_earnings" decimal(15,2) NOT NULL DEFAULT '0',
  "total_earnings" decimal(15,2) NOT NULL DEFAULT '0',
  "is_admin" boolean NOT NULL DEFAULT false,
  "is_super_admin" boolean NOT NULL DEFAULT false,
  "is_banned" boolean NOT NULL DEFAULT false,
  "is_withdrawal_blocked" boolean NOT NULL DEFAULT false,
  "is_promoter" boolean NOT NULL DEFAULT false,
  "must_invite_to_withdraw" boolean NOT NULL DEFAULT false,
  "has_deposited" boolean NOT NULL DEFAULT false,
  "has_active_product" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_free_product_claim" timestamp,
  "last_daily_bonus_claim" timestamp,
  "promoter_set_by" integer,
  "admin_set_by" integer,
  "admin_set_at" timestamp,
  "admin_pin" text,
  "is_admin_password_required" boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "withdrawal_wallets" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "account_name" text NOT NULL,
  "account_number" text NOT NULL,
  "payment_method" text NOT NULL,
  "country" text NOT NULL,
  "is_default" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "price" integer NOT NULL,
  "daily_earnings" integer NOT NULL,
  "cycle_days" integer NOT NULL DEFAULT 80,
  "total_return" integer NOT NULL,
  "image_url" text,
  "is_free" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "user_products" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "product_id" integer NOT NULL REFERENCES "products"("id"),
  "purchase_date" timestamp NOT NULL DEFAULT now(),
  "last_earning_date" timestamp,
  "days_remaining" integer NOT NULL,
  "total_earned" decimal(15,2) NOT NULL DEFAULT '0',
  "is_active" boolean NOT NULL DEFAULT true,
  "assigned_by_admin" boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS "deposits" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" integer NOT NULL,
  "account_name" text NOT NULL,
  "account_number" text NOT NULL,
  "country" text NOT NULL,
  "payment_method" text NOT NULL,
  "payment_channel_id" integer,
  "status" text NOT NULL DEFAULT 'pending',
  "soleaspay_reference" text,
  "soleaspay_order_id" text,
  "inpay_order_number" text,
  "inpay_out_trade_no" text,
  "ashtechpay_transaction_id" text,
  "ashtechpay_reference" text,
  "screenshot_data" text,
  "sender_number" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp,
  "processed_by" integer
);

CREATE TABLE IF NOT EXISTS "withdrawals" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "amount" integer NOT NULL,
  "net_amount" integer NOT NULL,
  "fees" integer NOT NULL,
  "account_name" text NOT NULL,
  "account_number" text NOT NULL,
  "country" text NOT NULL,
  "payment_method" text NOT NULL,
  "status" text NOT NULL DEFAULT 'pending',
  "inpay_order_number" text,
  "inpay_out_trade_no" text,
  "cloudpay_order_id" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp,
  "processed_by" integer
);

CREATE TABLE IF NOT EXISTS "payment_channels" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "redirect_url" text NOT NULL,
  "is_api" boolean NOT NULL DEFAULT false,
  "is_active" boolean NOT NULL DEFAULT true,
  "countries" text[] DEFAULT '{}'::text[],
  "created_at" timestamp NOT NULL DEFAULT now(),
  "modified_by" integer,
  "modified_at" timestamp
);

CREATE TABLE IF NOT EXISTS "referral_commissions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "from_user_id" integer NOT NULL REFERENCES "users"("id"),
  "level" integer NOT NULL,
  "amount" decimal(15,2) NOT NULL,
  "product_id" integer REFERENCES "products"("id"),
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "tasks" (
  "id" serial PRIMARY KEY,
  "name" text NOT NULL,
  "description" text NOT NULL,
  "required_invites" integer NOT NULL,
  "reward" integer NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_active" boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "user_tasks" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "task_id" integer NOT NULL REFERENCES "tasks"("id"),
  "completed_at" timestamp NOT NULL DEFAULT now(),
  "reward_claimed" boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "amount" decimal(15,2) NOT NULL,
  "description" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "platform_settings" (
  "id" serial PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "value" text NOT NULL,
  "modified_by" integer,
  "modified_at" timestamp
);

CREATE TABLE IF NOT EXISTS "admin_audit_log" (
  "id" serial PRIMARY KEY,
  "admin_id" integer NOT NULL REFERENCES "users"("id"),
  "action" text NOT NULL,
  "target_user_id" integer,
  "details" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "gift_codes" (
  "id" serial PRIMARY KEY,
  "code" text NOT NULL UNIQUE,
  "amount" decimal(15,2) NOT NULL,
  "max_uses" integer NOT NULL,
  "current_uses" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp NOT NULL,
  "created_by" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "is_active" boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "gift_code_claims" (
  "id" serial PRIMARY KEY,
  "gift_code_id" integer NOT NULL REFERENCES "gift_codes"("id"),
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "claimed_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "info_articles" (
  "id" serial PRIMARY KEY,
  "title" text NOT NULL,
  "cover_image" text NOT NULL,
  "content" text NOT NULL DEFAULT '',
  "extra_images" text[] DEFAULT '{}'::text[],
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE
) WITH (OIDS=FALSE);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- ========================
-- 2. COMPTE SUPER ADMIN
-- Téléphone : 99935673
-- Mot de passe : AAbb11##
-- PIN : 9993
-- ========================

INSERT INTO "users" (
  "full_name", "phone", "country", "password", "referral_code",
  "balance", "is_admin", "is_super_admin", "admin_pin"
) VALUES (
  'Super Admin',
  '99935673',
  'PH',
  '$2b$10$6wXC8DpvyHn.AT5pDsMAneqz19LThgO4uu.35e63lfrYkVq2SqHLi',
  'ADMIN1',
  '0',
  true,
  true,
  '9993'
) ON CONFLICT ("phone") DO UPDATE SET
  "password" = '$2b$10$6wXC8DpvyHn.AT5pDsMAneqz19LThgO4uu.35e63lfrYkVq2SqHLi',
  "is_admin" = true,
  "is_super_admin" = true,
  "admin_pin" = '9993',
  "country" = 'PH';

-- ========================
-- 3. PRODUITS AI ROBOTS
-- ========================

INSERT INTO "products" ("name", "price", "daily_earnings", "cycle_days", "total_return", "is_free", "is_active", "sort_order") VALUES
  ('Free Bonus',      0,      5,     1,  5,      true,  true, 0),
  ('Nano AI Robot',   500,    50,    30, 1500,   false, true, 1),
  ('Smart AI Robot',  2000,   200,   30, 6000,   false, true, 2),
  ('Pro AI Robot',    5000,   500,   30, 15000,  false, true, 3),
  ('Elite AI Robot',  10000,  1000,  30, 30000,  false, true, 4),
  ('Premium AI Robot',20000,  2000,  30, 60000,  false, true, 5),
  ('Expert AI Robot', 50000,  5000,  30, 150000, false, true, 6),
  ('Master AI Robot', 100000, 10000, 30, 300000, false, true, 7),
  ('Ultra AI Robot',  200000, 20000, 30, 600000, false, true, 8)
ON CONFLICT DO NOTHING;

-- ========================
-- 4. MISSIONS (TASKS)
-- ========================

INSERT INTO "tasks" ("name", "description", "required_invites", "reward", "sort_order", "is_active") VALUES
  ('Mission 1 - Referral', 'Reach 1,000 in total team investment to earn a reward of 100',    1000,   100,  1, true),
  ('Mission 2 - Referral', 'Reach 5,000 in total team investment to earn a reward of 500',    5000,   500,  2, true),
  ('Mission 3 - Referral', 'Reach 20,000 in total team investment to earn a reward of 1,000', 20000,  1000, 3, true),
  ('Mission 4 - Referral', 'Reach 50,000 in total team investment to earn a reward of 2,000', 50000,  2000, 4, true),
  ('Mission 5 - Referral', 'Reach 100,000 in total team investment to earn a reward of 5,000',100000, 5000, 5, true)
ON CONFLICT DO NOTHING;

-- ========================
-- 5. PARAMÈTRES PLATEFORME
-- ========================

INSERT INTO "platform_settings" ("key", "value") VALUES
  ('supportLink',         'https://t.me/noviqraai'),
  ('support2Link',        'https://t.me/noviqraai'),
  ('channelLink',         'https://t.me/noviqraai'),
  ('groupLink',           'https://t.me/+R9SFSGneBkg3NTFh'),
  ('appDownloadLink',     ''),
  ('minDeposit',          '500'),
  ('minWithdrawal',       '100'),
  ('withdrawalFees',      '0'),
  ('withdrawalStartHour', '9'),
  ('withdrawalEndHour',   '18'),
  ('level1Commission',    '20'),
  ('level2Commission',    '3'),
  ('level3Commission',    '2'),
  ('soleaspayEnabled',    'false'),
  ('soleaspayApiKey',     ''),
  ('soleaspayCountries',  ''),
  ('soleaspayChannelName','Westpay'),
  ('ashtechpayEnabled',   'false'),
  ('ashtechpayApiKey',    ''),
  ('ashtechpayChannelName','AshtechPay'),
  ('cloudpayEnabled',     'false'),
  ('cloudpayMerchantId',  ''),
  ('cloudpaySecretKey',   ''),
  ('cloudpayDomain',      ''),
  ('cloudpayChannelName', 'CloudPay'),
  ('adminCurrency',       'PHP'),
  ('phpToFcfaRate',       '10')
ON CONFLICT ("key") DO NOTHING;

-- ========================
-- TERMINÉ !
-- Admin : 99935673 / AAbb11## / PIN: 9993
-- ========================
