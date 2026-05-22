# Noviqra Ai - AI Investment Platform

## Overview

Noviqra Ai is a mobile-first investment platform targeting French-speaking African countries. Users can purchase virtual industrial robot products that generate daily earnings, manage deposits/withdrawals via mobile money, build referral teams for commission income, and complete tasks for bonuses. The platform features a full admin panel for managing users, transactions, products, and platform settings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (dark mode default)
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Session Management**: express-session with MemoryStore (development) or connect-pg-simple (production)
- **Authentication**: Session-based auth with bcrypt password hashing
- **API Design**: RESTful JSON API under `/api` prefix

### Data Storage
- **Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command
- **Key Tables**: users, products, userProducts, deposits, withdrawals, withdrawalWallets, paymentChannels, tasks, userTasks, transactions, platformSettings

### Authentication & Authorization
- **User Auth**: Phone number + country + password combination
- **Session Storage**: Server-side sessions with httpOnly cookies
- **Role System**: Regular users, Admins, Super Admins
- **Middleware**: `requireAuth` and `requireAdmin` middleware for route protection

### Key Features
- **Multi-country Support**: 7 African countries with different currencies (XAF, XOF, CDF) and payment methods
- **Product System**: Virtual industrial robot products with daily earnings cycles
- **Referral System**: 3-level commission structure for team building
- **Task System**: Invite-based tasks with bonus rewards
- **Admin Panel**: Full CRUD for users, deposits, withdrawals, products, payment channels, and settings

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # UI components including admin panel
│   ├── pages/           # Route pages (home, invest, tasks, team, account, admin)
│   ├── lib/             # Utilities (auth, queryClient, countries)
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route definitions
│   ├── storage.ts       # Database operations interface
│   ├── db.ts            # Database connection
│   └── seed.ts          # Initial data seeding
├── shared/              # Shared code between client/server
│   └── schema.ts        # Drizzle schema and Zod validators
└── migrations/          # Database migrations
```

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and schema management

### Frontend Libraries
- **Radix UI**: Accessible UI primitives (dialogs, dropdowns, tabs, etc.)
- **TanStack Query**: Server state management and caching
- **Lucide React**: Icon library

### Backend Libraries
- **bcrypt**: Password hashing
- **express-session**: Session management
- **memorystore**: In-memory session store for development

### Build & Development
- **Vite**: Frontend build tool with HMR
- **esbuild**: Backend bundling for production
- **TypeScript**: Type checking across full stack

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption (optional, has fallback)

## Recent Changes (May 2026)
- **CloudPay (Galaxy System API v3.0.4) integration** added for deposits and withdrawals
  - `server/cloudpay.ts`: MD5 signature builder, deposit (`POST /api/transfer`), withdrawal (`POST /api/daifu`), query (`POST /api/query`)
  - Routes: `POST /api/cloudpay/deposit`, `GET /api/cloudpay/deposit/:id/status`, `POST /api/cloudpay/withdraw`
  - Webhooks: `POST /api/webhooks/cloudpay` (deposit callback), `POST /api/webhooks/cloudpay-withdrawal`
  - Virtual channel `id: -5, gateway: "cloudpay"` injected into `/api/payment-channels` when enabled
  - Admin settings: `cloudpayEnabled`, `cloudpayMerchantId`, `cloudpaySecretKey`, `cloudpayDomain`, `cloudpayChannelName`
  - Admin withdrawals panel has a "Send via CloudPay" button for auto-processing pending withdrawals
  - Deposit modal detects CloudPay channel and shows QR code / redirect URL on success
  - Philippine bank codes mapped: GCash→gcash, Maya→PMP, GoTyme→GOT, BPI→bpi, etc.
  - To activate: go to Admin → Settings → CloudPay section, toggle Enable, enter Domain, Merchant ID, and Secret Key

## Recent Changes (February 2026)
- Deposit system now uses dual approach: Soleaspay (automatic) per-country OR manual recharge channels
- Admin can enable Soleaspay globally and select specific countries for automatic payment
- Users from Soleaspay-enabled countries get automatic mobile money flow (no channel selection)
- Users from non-Soleaspay countries see manual recharge channels managed by admin
- Platform setting `soleaspayEnabled` controls global Soleaspay on/off
- Platform setting `soleaspayCountries` stores comma-separated country codes (e.g. "TG,BF,CI")
- Backend enforces Soleaspay for enabled countries (cannot bypass to manual)
- InPay Africa integration still exists in backend but removed from deposit frontend
- InPay webhooks and admin balance check still functional for withdrawals

## Recent Changes (January 2026)
- Completed full frontend implementation with all pages and modals
- Implemented complete backend with all API routes
- Added database seeding for products, tasks, payment channels, and settings
- Created super admin account (Togo +99935673 / password: pagetstudio)
- Removed emoji usage in favor of text country codes

## Admin Credentials
- **Super Admin**: Phone: 99935673, Country: Togo (TG), Password: pagetstudio
- Access the admin panel from Account page when logged in as admin

## Business Rules
- **Signup Bonus**: 50 FCFA
- **Free Daily Product**: 5 FCFA per day
- **Withdrawal Fees**: 0%
- **Minimum Deposit**: 500 FCFA
- **Minimum Withdrawal**: 100 FCFA
- **Withdrawal Hours**: 9h-18h
- **Max Withdrawals/Day**: 2
- **Referral Commissions**: Level 1 (20%), Level 2 (3%), Level 3 (2%)
- **Product Cycle**: 80 days by default

## Supported Countries
- Cameroun (CM) - XAF - Orange Money, MTN
- Burkina Faso (BF) - XOF - Orange Money, Moov Money
- Togo (TG) - XOF - Moov Money, Mixx by Yas
- Benin (BJ) - XOF - Celtis, Moov Money, MTN, Momo
- Cote d'Ivoire (CI) - XOF - Wave, MTN, Orange Money, Moov Money
- Congo Brazzaville (CG) - XAF - MTN
- RDC (CD) - CDF (4:1 conversion) - Airtel Money