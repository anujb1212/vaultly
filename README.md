# Vaultly

A full-stack payments and banking platform built with **Next.js 15**, **React 19**, **Prisma**, and **Turborepo**. Users can sign up, link bank accounts, send money, manage security settings (2FA, transaction PIN), and more — all with a polished, dark-mode-friendly UI.

> This is a monorepo managed with [Turborepo](https://turbo.build/repo). The user-facing app lives in `apps/user-app`, supported by a webhook service, a mock payment gateway, and shared packages.

---

## Architecture Overview

```
vaultly/
├── apps/
│   ├── user-app/             # Next.js 15 app — the main user interface
│   ├── bank-webhook/         # Express service — listens for bank transaction confirmations
│   ├── mock-payment-gateway/ # Express + BullMQ — simulates a payment gateway
│   └── merchant-app/         # Merchant-facing app (not in active development)
├── packages/
│   ├── db/                   # Prisma schema (PostgreSQL) — split across model files
│   ├── ui/                   # Shared React components
│   ├── store/                # Zustand store shared across apps
│   ├── eslint-config/        # Shared ESLint configuration
│   └── typescript-config/    # Shared TypeScript configuration
├── docker/                   # Dockerfiles for each service
└── package.json              # Turborepo root — manages workspaces
```

### Key Features

| Feature               | Details |
|----------------------|---------|
| **Authentication**   | Credentials (email/password) + Google OAuth via NextAuth v4 |
| **Two-Factor Auth**  | Email-based OTP, toggleable from Security Center |
| **Transaction PIN**  | Required for transfers, set/change from Security Center |
| **P2P Transfers**    | Send money to other Vaultly users by phone number |
| **Bank Integration** | Link external bank accounts, deposit/withdraw (mock) |
| **Payment Gateway**  | Mock gateway with BullMQ-backed async processing |
| **Security Center**  | Dashboard for 2FA, PIN, email verification, session management |
| **Email Notifications** | Transactional emails via Resend (OTP codes, verification) |

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS, Motion (Framer Motion), Lucide icons
- **Backend**: Next.js API routes, Express (webhook + gateway)
- **Database**: PostgreSQL + Prisma ORM
- **Queue / Cache**: Redis + BullMQ
- **Auth**: NextAuth v4 (Credentials + Google OAuth)
- **Monorepo**: Turborepo, npm workspaces
- **Language**: TypeScript throughout

---

## Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm** >= 10
- **PostgreSQL** — local or cloud (e.g., [Neon](https://neon.tech))
- **Redis** — local or cloud (e.g., [Upstash](https://upstash.com))

### 1. Clone

```bash
git clone https://github.com/anujb1212/vaultly.git
cd vaultly
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL

```bash
docker run -e POSTGRES_PASSWORD=mysecretpassword -d -p 5432:5432 postgres
```

Or use a cloud provider like [Neon](https://neon.tech).

### 4. Configure environment variables

Each app/service has a `.env.example` file. Copy them to `.env` and fill in the values:

```bash
# Copy all example env files
cp apps/user-app/.env.example apps/user-app/.env
cp apps/bank-webhook/.env.example apps/bank-webhook/.env
cp packages/db/.env.example packages/db/.env
```

**Key variables to configure:**

| Variable | Where | Description |
|----------|-------|-------------|
| `DATABASE_URL` | `packages/db/.env` | PostgreSQL connection string |
| `REDIS_URL` | `apps/user-app/.env` | Redis connection string (for OTP cache & BullMQ) |
| `NEXTAUTH_SECRET` | `apps/user-app/.env` | NextAuth secret — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `apps/user-app/.env` | App URL (default: `http://localhost:3001`) |
| `RESEND_API_KEY` | `apps/user-app/.env` | Resend API key (optional — OTPs fall back to console if unverified) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `apps/user-app/.env` | Google OAuth credentials (optional) |

### 5. Run database migrations & seed

```bash
cd packages/db
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ../..
```

### 6. Start the dev server

```bash
npm run dev
```

This starts Turborepo in dev mode. The user app runs on **[http://localhost:3001](http://localhost:3001)**.

### 7. Login

Use the seeded test account:

```
Phone    : 1111111111
Password : alice
```

---

## Running Individual Services

The webhook and payment gateway can be started independently (useful for testing the full flow):

```bash
# Bank webhook (port 3003)
cd apps/bank-webhook
npm run dev

# Mock payment gateway (port 3002)
cd apps/mock-payment-gateway
npm run dev
```

### Docker

Production Dockerfiles are in `docker/`:

```bash
docker build -f docker/Dockerfile.user -t vaultly-user .
docker build -f docker/Dockerfile.bank-webhook -t vaultly-webhook .
docker build -f docker/Dockerfile.gateway -t vaultly-gateway .
```

---

## Project Structure

### `apps/user-app/`

The main Next.js application. Key directories:

| Path | Description |
|------|-------------|
| `app/(auth)/` | Sign-in, sign-up pages |
| `app/(dashboard)/` | Dashboard layout — transfers, payments, settings |
| `app/api/` | Next.js API routes (auth, webhooks, proxies) |
| `app/lib/` | Server actions (auth, payments, security) |
| `app/lib/actions/` | All server actions (2FA, OTP, PIN, transfers) |
| `app/lib/redis/` | Redis helpers for OTP caching |
| `app/components/` | Shared UI components |

### `packages/db/`

Prisma schema split across multiple model files in `prisma/models/`:

```
prisma/
├── schema.prisma           # Generator & datasource config
└── models/
    ├── user.prisma         # Users, merchants
    ├── auth.prisma         # OTPs, sessions
    ├── wallet.prisma       # Wallet balances
    ├── ledger.prisma       # Transactions, on-ramp transfers
    ├── security.prisma     # 2FA, audit logs
    ├── audit.prisma        # Audit trail
    └── enums.prisma        # Shared enums
```

### `apps/bank-webhook/`

Express server that listens for bank transaction confirmations via HTTP. Processes deposits and withdrawals.

### `apps/mock-payment-gateway/`

Simulates a payment gateway using BullMQ for job queuing. Handles transaction processing asynchronously.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode (Turborepo) |
| `npm run build` | Build all apps for production |
| `npm run lint` | Lint all workspaces |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run format` | Format all files with Prettier |

---

## Contributing

1. **Branch off `main`**: `git checkout -b feat/your-feature`
2. **Make changes** — keep PRs focused on a single concern
3. **Run typecheck**: `cd apps/user-app && npx tsc --noEmit`
4. **Run build**: `npm run build` (from root)
5. **Open a PR** against `main`

> **Note**: Only `user-app`, `bank-webhook`, and `mock-payment-gateway` are in active development. The `merchant-app` is still under development.
