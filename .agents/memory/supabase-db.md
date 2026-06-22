---
name: Supabase database usage
description: App uses Supabase (not Replit's built-in DB) via SUPABASE_DATABASE_URL env var.
---

## Rule
The app connects to **Supabase** via the `SUPABASE_DATABASE_URL` shared env var (takes priority over DIRECT_URL and DATABASE_URL in both `server/db.ts` and `drizzle.config.ts`). The Replit `executeSql` tool connects to a *different* internal Replit database — it is useless for this project.

**Why:** The user confirmed Supabase is the database backend. The `javascript_database` integration shown in the Replit config is not used by the app.

**How to apply:**
- For any database operation or migration: use `SUPABASE_DATABASE_URL="..." npm run db:push` or `tsx server/seed.ts` — scripts must inherit the Supabase URL.
- Never use `executeSql` tool for this project — it connects to the wrong DB and returns empty results.
- The seed script runs automatically at server start and creates products, tasks, settings, and the legacy super admin (phone: 99935673, country CM).
- Current Supabase project: region `us-west-2`, project ref `ujmyxnafllbakhamsymw`. pgBouncer port 6543, direct port 5432.
- Primary admin for current deployment: phone `0161630556`, country `BJ` (Bénin), is_super_admin=true.
