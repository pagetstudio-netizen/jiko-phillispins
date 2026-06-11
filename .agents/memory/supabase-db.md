---
name: Supabase database usage
description: This app uses Supabase (not Replit's built-in PostgreSQL) as its database via DATABASE_URL.
---

## Rule
The app connects to **Supabase** via `DATABASE_URL` env var. The Replit `executeSql` tool connects to a *different*, internal Replit database — it is useless for this project.

**Why:** The user confirmed Supabase is the database backend. The `javascript_database` integration shown in the Replit config is not used by the app.

**How to apply:**
- For any database operation (read, write, reset, seed): use `npx tsx server/<script>.ts` — scripts inherit `DATABASE_URL` and hit Supabase.
- Never use `executeSql` tool for this project — it connects to the wrong DB and always returns empty results.
- The seed script (`server/seed.ts`) and any custom scripts built like it are the correct way to interact with the real data.
