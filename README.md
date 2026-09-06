# 1Fi Marketplace

A new **“1Fi Marketplace”** section for the 1Fi app’s **Shop** page: browse smartphones and buy them on **EMI plans backed by mutual funds**. The mobile app is built with **React Native (Expo)** and pulls every piece of data — products, variants, pricing, images, EMI plans — from a **Node/Express + PostgreSQL** backend over REST. Nothing in the UI is hard‑coded.

The app shell mirrors the real 1Fi app — a **5‑tab bottom bar** (Home · Shop · EMI Dues · Limit · Profile), the **violet brand palette**, **Poppins** type, rounded cards and the violet→deep‑violet gradient hero. Home / EMI Dues / Limit / Profile are lightweight on‑brand stubs (out of scope per the brief); everything under **Shop → 1Fi Marketplace** is fully built. The product screen follows the app’s “Pay using 1Fi” reference layout.

Built for the **1Fi SDE‑1 assignment**.

| | |
|---|---|
| **Android build (APK)** | https://expo.dev/accounts/f7_rebel/projects/onefi-marketplace/builds/8622d277-0b32-42e3-86c5-268fe509412a |
| **Web application** | https://mutual-fund-emi-marketplace.vercel.app/ |
| **API base URL** | https://onefi-marketplace-api-aditya.onrender.com |
| **Demo video** | _add your Drive/YouTube link here (anyone‑with‑link)_ |
| **Try instantly** | `npx expo start` in `mobile/`, then press **a** (Android) or scan the QR with **Expo Go** |

---

## Table of contents

1. [What’s implemented](#whats-implemented)
2. [Tech stack](#tech-stack)
3. [Architecture](#architecture)
4. [Repository structure](#repository-structure)
5. [Quick start (local)](#quick-start-local)
6. [Running on Android](#running-on-android)
7. [Environment variables](#environment-variables)
8. [Scripts](#scripts)
9. [Database schema](#database-schema)
10. [Seed data](#seed-data)
11. [API reference](#api-reference)
12. [App screens & navigation](#app-screens--navigation)
13. [How the EMI numbers are calculated](#how-the-emi-numbers-are-calculated)
14. [Deployment](#deployment)
15. [Assignment checklist](#assignment-checklist)
16. [Notes & assumptions](#notes--assumptions)

---

## What’s implemented

Per the assignment email, the **Shop** page has three options:

| Tab | State |
|---|---|
| **1Fi Marketplace** | **Fully built** — product grid, product detail, variant picker, EMI plans, checkout CTA |
| Top Brands | Intentionally left blank (empty‑state screen) |
| Nearby Stores | Intentionally left blank (empty‑state screen) |

The app is a **5‑tab bottom‑bar** shell (`src/app/(tabs)/`): **Home**, **Shop**, **EMI Dues**, **Limit**, **Profile**. Home shows the violet gradient “limit available” hero with a *Shop now* CTA; EMI Dues / Limit are on‑brand stubs. **Profile** is a working **sign‑in** screen. Everything below is under **Shop**.

**Sign in with Google (optional).** The Profile tab offers *Continue with Google* (`expo-auth-session`, works on web and native). The server verifies the Google ID token, upserts a `users` row, and returns a 30‑day session JWT that the app stores and sends as `Authorization: Bearer`. Signing in is never required — you can browse and buy anonymously — but once you’re signed in, orders are linked to your account, the checkout shows *“Paying as …”*, order history is scoped to you, and the Profile shows your Google name/photo. Until Google OAuth client IDs are configured, a clearly‑labelled **developer sign‑in** stands in so the flow is fully testable.

The 1Fi Marketplace flow:

* **Shop screen** — segmented Marketplace / Top Brands / Nearby Stores control, a 2‑column product grid with pull‑to‑refresh, each card showing image, brand, tagline, colour swatches, variant count and starting price. Header has a live **bucket** button with an item‑count badge; a “Your orders ›” link opens order history.
* **Product screen** (`/products/:slug`, its own deep‑linkable URL) — laid out like the app’s **“Pay using 1Fi”** reference: header, product image with per‑variant thumbnails, rating, price with MRP + discount, a **SELECT YOUR VARIANT** list of full‑width radio rows (label · sub‑line · price), a selectable list of **EMI plans** (monthly amount, tenure, interest %, down payment, total payable, cashback, backing mutual fund, a “Recommended” plan), an “About” section, and a **sticky “Proceed with selected plan”** bar that adds the chosen variant + plan to the bucket and opens it (or, if it’s already there, jumps straight to the bucket).
* **Bucket / cart** (`/cart`) — line items (image, variant, plan, a **quantity stepper**, per‑line monthly & total, remove), an **order summary** (total monthly EMI, due‑today down payment, cashback, total payable over tenure), a repayment‑schedule note with the first‑instalment date, and **“Proceed to payment”**. The bucket **persists across app restarts** via `AsyncStorage`.
* **Payment** (`/checkout/:reference`) — a **dummy payment gateway** (“1Fi Pay”, test mode) for the due‑today amount: Card / UPI / Netbanking, a test‑card quick‑fill, and a Success/Failure override for demos. A declined charge is retryable; the bucket is cleared and the order confirmed only when the charge succeeds. All money is recomputed and the outcome decided **server‑side** (`POST /api/payments/:ref/confirm`).
* **Order confirmation** (`/order/:reference`) — reference code, status, totals, first‑EMI date, and the ordered items.
* **Order history** (`/orders`) — every placed order, newest first, tappable through to its confirmation screen. Backed by real rows in the database. Scoped to the signed‑in user when authenticated.
* **Profile / account** (`/profile`) — *Continue with Google* + a developer sign‑in when signed out; avatar, name, email, “Your orders” and sign‑out when signed in. Session persists across app restarts (`AsyncStorage`) and is re‑validated against `GET /api/auth/me` on launch.
* Loading, empty and error states throughout; 404 handled for unknown product slugs and order references.

## Tech stack

| Layer | Choice |
|---|---|
| Mobile app | **React Native 0.86** via **Expo SDK 57**, **Expo Router** (file‑based `(tabs)` group + stack, typed routes), **TypeScript** |
| UI | React Native `StyleSheet` + design tokens (`mobile/src/theme.ts`), `expo-image`, `expo-linear-gradient`, `@expo/vector-icons` (Ionicons) |
| Typography | **Poppins** via `@expo-google-fonts/poppins`; `<AppText>` maps `fontWeight` → the matching Poppins family app‑wide |
| Client state | React Context + `useReducer` cart & auth stores, persisted with `@react-native-async-storage/async-storage` |
| Auth | **Google sign-in** via `expo-auth-session` (web + native) → server verifies the ID token (`google-auth-library`) and issues a session **JWT** (`jsonwebtoken`); optional, with a dev mock fallback |
| Backend | **Node.js**, **Express 4** (ES modules) |
| ORM | **Prisma 5** |
| Database | **PostgreSQL 16** |
| Local DB | Docker Compose (or any local Postgres) |
| Deploy | App → **EAS Build** (Android APK) · API + DB → **Render** |

## Architecture

```
┌─────────────────────────┐      HTTP / JSON        ┌────────────────────┐    Prisma    ┌──────────────┐
│  Expo / React Native    │ ─────────────────────▶  │   Express API      │ ──────────▶  │  PostgreSQL   │
│  app  (mobile/)         │  GET /api/products      │   (server/, :4000) │    SQL       │  products     │
│                         │  GET /api/products/:id  │                    │              │  variants     │
│  expo-router  ◀───────── │        products, plans  │                    │  ◀────────── │  emi_plans    │
└─────────────────────────┘                         └────────────────────┘    rows      └──────────────┘
```

* `mobile/src/api.ts` resolves the API base URL in this order: `EXPO_PUBLIC_API_BASE` → the dev machine’s LAN IP on `:4000` (so a **physical Android phone** on the same Wi‑Fi as Metro reaches the local backend automatically) → `http://localhost:4000`.
* All money is stored as **integer paise** in the DB; the API returns both the raw paise and a pre‑formatted `₹` string, so the app never does currency math.
* The backend is UI‑agnostic — the same API served the earlier web prototype and now the mobile app.

## Repository structure

```
1fi-marketplace/
├── docker-compose.yml          # local PostgreSQL
├── render.yaml                 # backend + managed Postgres on Render
├── package.json                # root scripts (setup, dev, seed…)
├── scripts/dev.js              # runs API + Expo together, zero deps
├── server/
│   ├── prisma/
│   │   ├── schema.prisma       # data model (users, products, variants, emi_plans, orders, order_items, payments)
│   │   ├── migrations/         # SQL migrations (init, add_orders, add_payments, add_users)
│   │   └── seed.js             # 4 products, 9 variants, 54 EMI plans
│   └── src/
│       ├── index.js            # Express app, CORS, health, attachUser, errors
│       ├── prisma.js           # shared PrismaClient
│       ├── routes/auth.js      # /api/auth endpoints (Google + dev mock → session JWT)
│       ├── routes/products.js  # /api/products endpoints
│       ├── routes/orders.js    # /api/orders endpoints (server-side re-pricing, per-user)
│       ├── routes/payments.js  # /api/payments endpoints (dummy gateway simulation)
│       ├── lib/auth.js         # JWT sign/verify, Google ID-token verify, auth middleware
│       ├── lib/reference.js    # short human codes (1FI-…, PAY-…)
│       └── lib/serialize.js    # DB row → API shape (paise + ₹ strings)
└── mobile/
    ├── app.json                # Expo config (Android package in.onefi.marketplace)
    ├── eas.json                # EAS build profiles
    ├── .env.example            # EXPO_PUBLIC_API_BASE, EXPO_PUBLIC_GOOGLE_*_CLIENT_ID
    └── src/
        ├── app/                # expo-router routes
        │   ├── _layout.tsx              # root Stack + SafeAreaProvider + AuthProvider + CartProvider + Poppins loader
        │   ├── index.tsx                # redirects to /home
        │   ├── (tabs)/                  # bottom-tab shell
        │   │   ├── _layout.tsx          # 5-tab bar (Home · Shop · EMI Dues · Limit · Profile)
        │   │   ├── home.tsx  emi-dues.tsx  limit.tsx   # on-brand stubs
        │   │   ├── profile.tsx          # Google / dev sign-in · signed-in account view
        │   │   └── shop.tsx             # Shop page (Marketplace / Top Brands / Nearby Stores)
        │   ├── products/[slug].tsx      # product detail ("Pay using 1Fi" layout)
        │   ├── cart.tsx                 # the bucket + proceed to payment
        │   ├── checkout/[reference].tsx # dummy payment gateway ("1Fi Pay", test mode)
        │   ├── orders.tsx               # order history
        │   └── order/[reference].tsx    # order confirmation / detail
        ├── components/         # ProductCard, VariantSelector (radio rows), EmiPlanCard, PriceBlock,
        │                       #   Segmented, AppHeader (+ bucket badge), EmptyState, CartLineItem,
        │                       #   QuantityStepper, OrderSummaryCard, GradientHero, StubScreen, AppText
        ├── auth.tsx            # AuthProvider / useAuth — Google (expo-auth-session) + mock, token persistence
        ├── cart.tsx            # CartProvider / useCart — reducer store, AsyncStorage persistence
        ├── api.ts              # typed API client + base-URL resolution + bearer token
        ├── format.ts           # client-side ₹ + date formatting (cart totals)
        ├── types.ts            # API response types
        └── theme.ts            # violet palette, spacing, radius, shadow, Poppins weight map
```

## Quick start (local)

**Prerequisites:** Node ≥ 18, npm, either Docker _or_ a local PostgreSQL, and for device testing the **Expo Go** app (Android/iOS) or an **Android emulator**.

### 1. Database

```bash
cd 1fi-marketplace
docker compose up -d          # PostgreSQL on localhost:5432
```

<details><summary>Using an existing local PostgreSQL instead</summary>

```bash
createdb onefi_marketplace
psql -d onefi_marketplace -c "CREATE ROLE onefi LOGIN PASSWORD 'onefi'; ALTER ROLE onefi CREATEDB; GRANT ALL ON SCHEMA public TO onefi;"
```
Then keep the default `DATABASE_URL` in `server/.env`.
</details>

### 2. Env files

```bash
cp server/.env.example server/.env
cp mobile/.env.example  mobile/.env      # optional — blank works for local dev
```

### 3. Install, migrate, seed

```bash
npm run install:all                 # installs server/ and mobile/ deps
npm --prefix server run setup       # prisma generate + migrate deploy + seed
```

### 4. Run the API + the app

```bash
npm run dev                         # API on :4000  +  Expo dev server
```

In the Expo output press **a** for an Android emulator, **i** for iOS simulator, **w** for web, or scan the QR code with **Expo Go** on your phone.

<details><summary>Run them separately</summary>

```bash
npm run dev:api       # http://localhost:4000
npm run dev:mobile    # expo start
```
</details>

## Running on Android

| Method | Steps |
|---|---|
| **Emulator** | Start an Android Virtual Device in Android Studio, then `npm run dev:mobile` → press **a**. |
| **Physical device (Expo Go)** | Install Expo Go, ensure the phone is on the **same Wi‑Fi** as your computer, run `npm run dev:mobile`, scan the QR. `mobile/src/api.ts` auto‑targets your machine’s LAN IP on `:4000`, so no config is needed as long as the backend is running. |
| **Standalone APK** | `cd mobile && npx eas build -p android --profile preview` (needs an Expo account). The `preview`/`production` profiles bake in `EXPO_PUBLIC_API_BASE` from `eas.json` — point it at your deployed API first. |

## Environment variables

### `server/.env`

| Var | Example | Purpose |
|---|---|---|
| `DATABASE_URL` | `postgresql://onefi:onefi@localhost:5432/onefi_marketplace?schema=public` | Prisma connection string |
| `PORT` | `4000` | API port |
| `CORS_ORIGIN` | `http://localhost:8081,http://localhost:19006` | Allowed origins for the Expo web dev server. Native builds send no `Origin` header and are always allowed; use `*` in production. |
| `JWT_SECRET` | `a-long-random-string` | Signs session JWTs. **Set a real secret in production.** |
| `JWT_TTL` | `30d` | Session token lifetime |
| `GOOGLE_CLIENT_IDS` | `123-abc.apps.googleusercontent.com,456-def…` | Comma‑separated Google OAuth client IDs accepted as the ID‑token `aud` (Web + Android + iOS). Blank → Google verification off (dev mock still works). |
| `ALLOW_MOCK_AUTH` | `true` | Enables `POST /api/auth/mock`, the dev stand‑in for Google. Always ignored when `NODE_ENV=production`. |

### `mobile/.env`

| Var | Example | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_BASE` | _(empty in dev)_ / `https://onefi-marketplace-api.onrender.com` | API origin for standalone builds. Empty in dev → LAN‑IP / localhost fallback. |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `123-abc.apps.googleusercontent.com` | Google **Web** client ID — used by the web build and the Expo Go / dev‑client flow. Also list it in `server/.env` `GOOGLE_CLIENT_IDS`. |
| `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` | `123-xyz.apps.googleusercontent.com` | Google **Android** client ID (needs package `in.onefi.marketplace` + signing SHA‑1). |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `123-ios.apps.googleusercontent.com` | Google **iOS** client ID (needs bundle id `in.onefi.marketplace`). |

Leave every `EXPO_PUBLIC_GOOGLE_*` blank to run without Google — the Profile tab then offers a **developer sign‑in** (`POST /api/auth/mock`) so the whole flow is testable offline.

### Setting up real Google sign-in

1. **Google Cloud Console → APIs & Services → Credentials** → *Create credentials → OAuth client ID*. Configure the **OAuth consent screen** first (External, add your email as a test user).
2. Create a **Web application** client:
   * *Authorized JavaScript origins*: `http://localhost:8082` (and your deployed web origin).
   * *Authorized redirect URIs*: `http://localhost:8082` (and the deployed origin). `expo-auth-session` redirects back to the page origin on web.
   * Copy the client ID into **`mobile/.env` → `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** *and* **`server/.env` → `GOOGLE_CLIENT_IDS`**.
3. *(Android)* Create an **Android** client — package name `in.onefi.marketplace`, SHA‑1 from your signing key (`eas credentials` or `keytool`). Put the ID in `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` and append it to `server/.env` `GOOGLE_CLIENT_IDS` (comma‑separated). Native Google sign‑in needs a **dev/production build** (not Expo Go).
4. *(iOS)* Create an **iOS** client — bundle id `in.onefi.marketplace` — into `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `GOOGLE_CLIENT_IDS`.
5. Restart Metro (`npx expo start --clear`) and the API so the new env is picked up. Set a strong `JWT_SECRET` and (for prod) `ALLOW_MOCK_AUTH=false`.

## Scripts

Run from the repo root:

| Script | What it does |
|---|---|
| `npm run install:all` | `npm install` in `server/` and `mobile/` |
| `npm run db:up` / `db:down` | Start / stop the Docker Postgres |
| `npm --prefix server run setup` | `prisma generate` + `migrate deploy` + `seed` |
| `npm run seed` | Re‑seed the database |
| `npm run dev` | Run API + Expo together |
| `npm run dev:api` / `dev:mobile` | Run one side only |
| `npm --prefix server run db:reset` | Drop, re‑migrate and re‑seed (destructive) |

## Database schema

Three tables, one‑to‑many down the chain: **Product → Variant → EmiPlan**.
Source of truth: [`server/prisma/schema.prisma`](server/prisma/schema.prisma) · SQL: [`server/prisma/migrations/**/migration.sql`](server/prisma/migrations).

### `products`

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `slug` | text | **unique** — used in the route `/products/:slug` |
| `name` | text | e.g. `Apple iPhone 17 Pro` |
| `brand` | text | e.g. `Apple` |
| `category` | text | default `Smartphones` |
| `tagline` | text | one‑line copy under the title |
| `description` | text | long description |
| `heroImage` | text | image URL |
| `rating` | float | default `4.5` |
| `ratingCount` | int | default `0` |
| `createdAt` / `updatedAt` | timestamp | |

### `variants`

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `productId` | text | **FK → products.id**, `ON DELETE CASCADE` |
| `sku` | text | **unique** |
| `label` | text | e.g. `256 GB · Silver` |
| `colorName` / `colorHex` | text | swatch shown in the UI |
| `storage` | text | e.g. `256 GB` |
| `imageUrl` | text | variant image |
| `mrpPaise` | int | MRP in paise |
| `pricePaise` | int | selling price in paise |
| `inStock` | bool | default `true` |
| `isDefault` | bool | variant selected on first load |

Index: `(productId)`.

### `emi_plans`

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `variantId` | text | **FK → variants.id**, `ON DELETE CASCADE` |
| `title` | text | e.g. `No Cost EMI` |
| `provider` | text | default `1Fi` |
| `fundName` | text | mutual fund backing the plan |
| `tenureMonths` | int | 3 / 6 / 9 / 12 / 18 / 24 |
| `interestRate` | float | annual reducing rate %, `0` for no‑cost |
| `monthlyPaise` | int | monthly instalment |
| `downPaymentPaise` | int | default `0` |
| `cashbackPaise` | int | default `0` |
| `cashbackNote` | text? | shown only when cashback > 0 |
| `totalPayablePaise` | int | `downPayment + monthly × tenure − cashback` |
| `isRecommended` | bool | highlighted in the UI |
| `sortOrder` | int | display order |

Index: `(variantId)`.

### `users`

A signed‑in customer. Sign‑in is **optional** — orders can still be placed anonymously — but once a user authenticates their orders link here and the Profile tab shows their name / photo.

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `googleId` | text? | **unique** — Google `sub` claim; null for dev‑mock users |
| `email` | text | **unique** |
| `name` | text | display name |
| `picture` | text? | avatar URL from Google |
| `provider` | text | `google` \| `mock` |
| `createdAt` `updatedAt` | timestamp | |

### `orders`

Created when the customer taps **Proceed to payment** in the bucket.

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `reference` | text | **unique** — short human code, e.g. `1FI-8K2P4Q` |
| `status` | text | `PENDING_PAYMENT` \| `CONFIRMED` \| `PLACED` \| `CANCELLED` (default `PENDING_PAYMENT`) |
| `userId` | text? | **FK → users.id** (`ON DELETE SET NULL`) — set when a signed‑in user placed it |
| `customerName` | text? | optional; defaults to the signed‑in user's name |
| `itemCount` | int | sum of line quantities |
| `monthlyPaise` | int | total monthly instalment across lines |
| `downPaymentPaise` | int | total due today |
| `cashbackPaise` | int | total cashback |
| `totalPayablePaise` | int | grand total over the tenure, net of cashback |
| `firstEmiOn` | timestamp | `createdAt + 1 month` |
| `createdAt` | timestamp | |

Indexes: `(createdAt)`, `(userId)`.

### `order_items`

Each line **snapshots** the product / variant / plan at purchase time, so order history stays correct even if the catalogue changes later.

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `orderId` | text | **FK → orders.id**, `ON DELETE CASCADE` |
| `productId` `productSlug` `productName` `brand` | text | product snapshot |
| `variantId` `variantLabel` `imageUrl` | text | variant snapshot |
| `emiPlanId` `planTitle` `fundName` | text | plan snapshot |
| `tenureMonths` | int | plan snapshot |
| `interestRate` | float | plan snapshot |
| `quantity` | int | 1–10 |
| `unitPricePaise` | int | variant price at purchase |
| `monthlyPaise` `downPaymentPaise` `cashbackPaise` `totalPayablePaise` | int | per‑line totals (× quantity) |

Index: `(orderId)`.

### `payments`

One row per order, created alongside it, for the **“due today”** amount. The gateway (`DummyPay`) is **simulated** in `server/src/routes/payments.js` — no real money moves. A successful payment flips the order to `CONFIRMED`; a failed one can be retried in place.

| Column | Type | Notes |
|---|---|---|
| `id` | text (cuid) | PK |
| `reference` | text | **unique** — e.g. `PAY-8K2P4Q` |
| `orderId` | text | **FK → orders.id** (unique, `ON DELETE CASCADE`) |
| `gateway` | text | `DummyPay` |
| `method` | text | `CARD` \| `UPI` \| `NETBANKING` |
| `amountPaise` | int | equals the order's `downPaymentPaise` |
| `status` | text | `CREATED` \| `PROCESSING` \| `SUCCESS` \| `FAILED` (default `CREATED`) |
| `instrumentHint` | text? | masked instrument, e.g. `•••• 4242`, `name@upi`, `HDFC Bank` |
| `failureReason` | text? | set when `status = FAILED` |
| `attempts` | int | confirm attempts so far |
| `paidAt` | timestamp? | set when `status = SUCCESS` |
| `createdAt` `updatedAt` | timestamp | |

Index: `(orderId)`.

## Seed data

`server/prisma/seed.js` inserts **4 products**, each with **2–3 variants**, each variant with a **6‑plan EMI ladder** (54 EMI plans total):

| Product | Slug | Variants |
|---|---|---|
| Apple iPhone 17 Pro | `apple-iphone-17-pro` | 256 GB Silver, 256 GB Deep Blue, 512 GB Black Titanium |
| Samsung Galaxy S24 Ultra | `samsung-galaxy-s24-ultra` | 256 GB Titanium Black, 512 GB Titanium Gray |
| Google Pixel 9 Pro | `google-pixel-9-pro` | 128 GB Obsidian, 256 GB Porcelain |
| OnePlus 13 | `oneplus-13` | 256 GB Midnight Ocean, 512 GB Arctic Dawn |

## API reference

Base URL: `http://localhost:4000` (dev) · JSON everywhere.

Requests may carry `Authorization: Bearer <token>` (from the auth endpoints below). It is **optional everywhere** — when present, `POST /api/orders` links the order to that user and `GET /api/orders` returns only that user's orders.

### `GET /api/health`

```json
{ "status": "ok", "db": "up", "time": "2026-09-03T12:49:30.876Z" }
```

### `GET /api/auth/config`

Which sign‑in methods this server supports: `{ "google": false, "mock": true }`.

### `POST /api/auth/google`

Body `{ "idToken": "<Google ID token>" }`. The server verifies it against `GOOGLE_CLIENT_IDS`, upserts a `users` row (matched on `googleId`), and returns a session:

```jsonc
{
  "token": "<JWT, 30d>",
  "user": { "id": "cmt…", "email": "you@gmail.com", "name": "You", "picture": "https://…", "provider": "google" }
}
```

`401` if the token can't be verified · `501` if `GOOGLE_CLIENT_IDS` is empty.

### `POST /api/auth/mock`  *(dev only)*

Body `{ "email": "you@example.com", "name": "You" }`. Same `{ token, user }` shape, `provider: "mock"`. Enabled only when `ALLOW_MOCK_AUTH=true` **and** `NODE_ENV !== "production"` (otherwise `404`). The Profile tab uses this when no Google client ID is set.

### `GET /api/auth/me`

`Authorization: Bearer` required. Returns `{ "user": {…} }` re‑read from the DB; `401` if the token is missing / expired / revoked.

### `GET /api/products`

List all products with a lightweight variant summary (no EMI plans).
Optional query params: `?brand=Apple`, `?q=iphone`.

```jsonc
{
  "count": 4,
  "products": [
    {
      "id": "cmtli…",
      "slug": "apple-iphone-17-pro",
      "name": "Apple iPhone 17 Pro",
      "brand": "Apple",
      "category": "Smartphones",
      "tagline": "Titanium. A19 Pro chip. …",
      "heroImage": "https://images.unsplash.com/photo-1592750475338-…",
      "rating": 4.8,
      "ratingCount": 2143,
      "startingPrice": { "paise": 12990000, "rupees": 129900, "display": "₹1,29,900" },
      "variantCount": 3,
      "url": "/products/apple-iphone-17-pro",
      "variants": [
        {
          "id": "cmtli…",
          "sku": "apple-iphone-17-pro-256gb-silver",
          "label": "256 GB · Silver",
          "color": { "name": "Silver", "hex": "#E3E4E5" },
          "storage": "256 GB",
          "image": "https://images.unsplash.com/photo-1592750475338-…",
          "inStock": true,
          "isDefault": true,
          "mrp":   { "paise": 13490000, "rupees": 134900, "display": "₹1,34,900" },
          "price": { "paise": 12990000, "rupees": 129900, "display": "₹1,29,900" },
          "discount": { "paise": 500000, "rupees": 5000, "display": "₹5,000", "percent": 4 }
        }
      ]
    }
  ]
}
```

### `GET /api/products/:id`

Full product by **slug or id**, including every variant **and its EMI plans**. `404` if not found.

```jsonc
{
  "product": {
    "id": "cmtli…",
    "slug": "google-pixel-9-pro",
    "name": "Google Pixel 9 Pro",
    "brand": "Google",
    "tagline": "Google Tensor G4. Gemini built in. …",
    "description": "Pixel 9 Pro pairs the Google Tensor G4 chip with …",
    "heroImage": "https://images.unsplash.com/photo-1598327105666-…",
    "rating": 4.6,
    "ratingCount": 934,
    "startingPrice": { "paise": 9999900, "rupees": 99999, "display": "₹99,999" },
    "variantCount": 2,
    "url": "/products/google-pixel-9-pro",
    "variants": [
      {
        "id": "cmtli…",
        "sku": "google-pixel-9-pro-128gb-obsidian",
        "label": "128 GB · Obsidian",
        "color": { "name": "Obsidian", "hex": "#1C1C1E" },
        "storage": "128 GB",
        "image": "https://images.unsplash.com/photo-1598327105666-…",
        "inStock": true,
        "isDefault": true,
        "mrp":   { "paise": 10999900, "rupees": 109999, "display": "₹1,09,999" },
        "price": { "paise": 9999900,  "rupees": 99999,  "display": "₹99,999" },
        "discount": { "paise": 1000000, "rupees": 10000, "display": "₹10,000", "percent": 9 },
        "emiPlans": [
          {
            "id": "cmtli…",
            "title": "No Cost EMI",
            "provider": "1Fi",
            "fundName": "1Fi Liquid Direct — Growth",
            "tenureMonths": 6,
            "interestRate": 0,
            "interestLabel": "0% (No Cost)",
            "monthly":      { "paise": 1666650, "rupees": 16666.5, "display": "₹16,667" },
            "downPayment":  { "paise": 0, "rupees": 0, "display": "₹0" },
            "cashback":     { "paise": 150000, "rupees": 1500, "display": "₹1,500", "note": "Instant ₹1,500 cashback as 1Fi units" },
            "totalPayable": { "paise": 9849900, "rupees": 98499, "display": "₹98,499" },
            "isRecommended": true
          }
        ]
      }
    ]
  }
}
```

### `GET /api/products/:id/emi-plans`

EMI plans for a product, grouped by variant. Optional `?variant=<sku|variantId>`.

```jsonc
{
  "product": { "id": "cmtli…", "slug": "google-pixel-9-pro", "name": "Google Pixel 9 Pro" },
  "variants": [
    {
      "id": "cmtli…",
      "sku": "google-pixel-9-pro-128gb-obsidian",
      "label": "128 GB · Obsidian",
      "price": { "paise": 9999900, "rupees": 99999, "display": "₹99,999" },
      "emiPlans": [ /* same shape as above */ ]
    }
  ]
}
```

### `POST /api/orders`

Place an order from the bucket. The server **re‑reads every variant and EMI plan from the DB and recomputes all money** — client‑supplied prices are ignored — then writes the order, its snapshotted line items, and a `CREATED` **payment** row (for the down‑payment amount) in one call. The order starts as `PENDING_PAYMENT`; the client then drives it to `CONFIRMED` via the payment endpoints below.

Request:

```jsonc
{
  "customerName": "optional",
  "method": "CARD",           // optional: CARD | UPI | NETBANKING — sets payment.method
  "items": [
    { "variantId": "cmt…", "emiPlanId": "cmt…", "quantity": 2 }
  ]
}
```

`201` response:

```jsonc
{
  "order": {
    "reference": "1FI-QH6CHB",
    "status": "PENDING_PAYMENT",
    "payment": {
      "reference": "PAY-7T2K9M",
      "method": "CARD",
      "status": "CREATED",
      "amount": { "paise": 0, "display": "₹0" }
    },
    "itemCount": 2,
    "monthly":      { "paise": 2166634, "rupees": 21666.34, "display": "₹21,666" },
    "downPayment":  { "paise": 0, "display": "₹0" },
    "cashback":     { "paise": 300000, "display": "₹3,000" },
    "totalPayable": { "paise": 12699804, "display": "₹1,26,998" },
    "firstEmiOn":   "2026-10-03T…",
    "createdAt":    "2026-09-03T…",
    "items": [
      {
        "product": { "slug": "oneplus-13", "name": "OnePlus 13", "brand": "OnePlus", "url": "/products/oneplus-13" },
        "variant": { "label": "256 GB · Midnight Ocean", "image": "https://…" },
        "plan": { "title": "No Cost EMI", "fundName": "1Fi Liquid Direct — Growth", "tenureMonths": 6, "interestLabel": "0% (No Cost)" },
        "quantity": 2,
        "unitPrice":  { "display": "₹64,999" },
        "monthly":    { "display": "₹21,666" },
        "totalPayable": { "display": "₹1,26,998" }
      }
    ]
  }
}
```

Validation: `400` empty/oversized `items` or bad quantity; `422` plan/variant mismatch; `409` out of stock.

### `GET /api/orders`

`{ "count": n, "orders": [ /* newest first, same shape as above */ ] }`. Orders still `PENDING_PAYMENT` are hidden unless `?includePending=1`. With an `Authorization: Bearer` header → only that user's orders; without one → only orders that have no user attached.

### `GET /api/orders/:ref`

By reference (case‑insensitive) or id. `404` if not found.

### `GET /api/payments/:ref`

Look up a payment by **payment reference**, payment id, or **order reference**. Returns `{ "payment": {…}, "order": {…} }`. `404` if not found.

### `POST /api/payments/:ref/confirm`

The dummy gateway. Simulates the charge and, on success, flips the order to `CONFIRMED`.

```jsonc
{
  "method": "CARD",                         // CARD | UPI | NETBANKING
  "card": { "number": "4242 4242 4242 4242", "name": "…", "expiry": "12/34", "cvv": "123" },
  "upiId": "name@bank",                      // when method = UPI
  "bank": "HDFC Bank",                       // when method = NETBANKING
  "simulate": "success"                      // optional: "success" | "failure" — overrides the outcome
}
```

Outcome (when `simulate` is omitted):

| Method | Succeeds | Declines |
|---|---|---|
| `CARD` | any 16‑digit number… | …except test cards `4000 0000 0000 0002` (declined), `…9995` (insufficient funds), `…0069` (expired) |
| `UPI` | any valid‑looking VPA | a VPA containing `fail`, e.g. `fail@upi` |
| `NETBANKING` | always | — |

Responses: `200 { payment, order }` on success; `402 { error, payment, order }` on a gateway decline (retryable); `400 { error }` for an invalid instrument; `404` unknown reference.

### Errors

| Status | Body |
|---|---|
| `404` | `{ "error": "Product not found", "slug": "…" }` / `{ "error": "Order not found", "reference": "…" }` / `{ "error": "Payment not found", "reference": "…" }` |
| `400` / `409` / `422` | `{ "error": "…" }` (order / instrument validation) |
| `402` | `{ "error": "…", "payment": {…}, "order": {…} }` (gateway decline — retryable) |
| `500` | `{ "error": "…" }` |

## App screens & navigation

`expo-router` file‑based routing (`mobile/src/app/`), `typedRoutes` enabled:

| Route | Screen | Notes |
|---|---|---|
| `/` | — | Redirects to `/home` |
| `/home` `/emi-dues` `/limit` | Tab stubs | On‑brand placeholders (out of scope per the brief) |
| `/profile` | Profile / auth | Signed out → **Continue with Google** + a dev sign‑in; signed in → avatar, name, email, "Your orders", sign out. `GET /api/auth/me`, `POST /api/auth/google` \| `/mock` |
| `/shop` | Shop | 3‑tab segmented control; `?tab=top-brands` / `?tab=nearby-stores` show the blank sections |
| `/products/[slug]` | Product detail | Unique, deep‑linkable URL per product; `GET /api/products/:slug` |
| `/cart` | Bucket | Line items + quantities + order summary; `POST /api/orders` creates a `PENDING_PAYMENT` order, then routes to checkout |
| `/checkout/[reference]` | Payment (`1Fi Pay`, test mode) | Card / UPI / Netbanking, test‑card quick‑fill, a Success/Failure override; `POST /api/payments/:ref/confirm`. Bucket clears only on a successful charge |
| `/orders` | Order history | `GET /api/orders` |
| `/order/[reference]` | Order confirmation / detail | `GET /api/orders/:ref` — shows the `Paid via …` line once the payment succeeds |

Deep links resolve via the `onefi://` scheme (`app.json`), e.g. `onefi://products/oneplus-13` or `onefi://order/1FI-QH6CHB`.

## How the EMI numbers are calculated

`server/prisma/seed.js` computes every instalment from the variant price so the stored data is internally consistent:

* **No‑cost plans (`interestRate = 0`):** `monthly = round(principal / months)`.
* **Interest‑bearing plans:** standard reducing‑balance EMI
  `monthly = P·r·(1+r)ⁿ / ((1+r)ⁿ − 1)`, where `r = annualRate / 12 / 100`, `n = tenureMonths`, `P = price − downPayment`.
* `totalPayable = downPayment + monthly × tenure − cashback`.

The “backed by mutual funds” angle: each plan names the 1Fi fund the principal is parked in (`fundName`), which is what funds the low / no‑cost interest.

## Deployment

### Backend + database → Render

The repo includes [`render.yaml`](render.yaml) (Blueprint):

1. Push this repo to GitHub.
2. Render → **New → Blueprint** → pick the repo. It creates a **free PostgreSQL** instance and a **web service** from `server/` that runs
   `npm install && npx prisma generate && npx prisma migrate deploy && node prisma/seed.js`, then `npm start`.
3. Note the service URL, e.g. `https://onefi-marketplace-api.onrender.com`.

### App → EAS Build (Android)

1. `cd mobile && npm i -g eas-cli && eas login`
2. Set the deployed API URL in `eas.json` (`preview` / `production` → `EXPO_PUBLIC_API_BASE`).
3. `eas build -p android --profile preview` → download the APK, or `--profile production` for an `.aab` to submit to Play.

> During review you can skip EAS entirely: run the backend locally (or on Render) and open the app in **Expo Go**.

## Assignment checklist

| Requirement (email + PDF) | Where |
|---|---|
| New **1Fi Marketplace** section on the **Shop** page | `mobile/src/app/(tabs)/shop.tsx` |
| Shop page has **Top Brands / Nearby Stores / 1Fi Marketplace**; first two left blank | `shop.tsx` + `EmptyState` |
| Consistency: layout, **typography**, spacing, **components**, **navigation** | violet tokens + Poppins in `theme.ts`; 5‑tab bottom bar `(tabs)/_layout.tsx`; gradient hero, pill segmented control, radio rows — matched to the app screenshots |
| Dynamic product page: name, variant, MRP, price, image | `mobile/src/app/products/[slug].tsx` |
| EMI plans: monthly, tenure, interest %, cashback | `mobile/src/components/EmiPlanCard.tsx`, `emi_plans` table |
| Plans are selectable | radio‑style `EmiPlanCard` |
| Button to proceed with the selected plan | sticky CTA in `products/[slug].tsx` → adds to the bucket |
| **Bucket / cart to place the order** *(extra)* | `mobile/src/app/cart.tsx`, `mobile/src/cart.tsx` (persisted store) |
| **Order placement + history** *(extra)* | `POST/GET /api/orders`, `orders` + `order_items` tables, `orders.tsx` / `order/[reference].tsx` |
| **Dummy payment gateway** *(extra)* | `server/src/routes/payments.js`, `payments` table, `mobile/src/app/checkout/[reference].tsx` — Card/UPI/Netbanking, simulated success/decline, order confirmed server‑side |
| **Google sign-in** *(extra)* | `server/src/routes/auth.js` + `lib/auth.js` (ID‑token verify → session JWT), `users` table, `mobile/src/auth.tsx` (`expo-auth-session`), Profile tab. Optional — orders link to the user when signed in; dev mock stands in until OAuth client IDs are set |
| Data from a backend API + DB, nothing hard‑coded | Express + Prisma + PostgreSQL |
| Unique URL per product | `/products/[slug]` (expo‑router, `onefi://` scheme) |
| ≥ 3 products, each with ≥ 2 variants | 4 products, 2–3 variants each (`seed.js`) |
| APIs `/api/products`, `/api/products/:id` | `server/src/routes/products.js` |
| SQL/NoSQL DB + schema | PostgreSQL, `schema.prisma` + SQL migrations |
| Responsive, user‑friendly UI | RN fl: 2‑col grid, safe‑area aware, pull‑to‑refresh, loading/empty/error states |
| README: setup, endpoints + examples, stack, schema | this file |
| Deployed demo | Render (API) + EAS/Expo Go (app) — links at top |
| Schema + seed in the repo | `server/prisma/` |

## Notes & assumptions

* **Design consistency.** The palette (violet `#6C2BD9` primary, `#F6F5FA` surface), **Poppins** type, rounded cards, the violet gradient hero, the pill segmented control, the 5‑tab bottom bar and the “Pay using 1Fi” product layout are matched to the provided 1Fi app screenshots. Without the app’s private component library the exact metrics are approximate — all of it is driven from `mobile/src/theme.ts`, so swapping in the real tokens/font aligns it precisely.
* An earlier **web prototype** of the same flow (React + Vite) lived in `web/` and was removed once the app direction was confirmed; the Express API it used is unchanged and now serves the mobile app. Recoverable from the first git commit if needed.
* Product images are hosted on Unsplash and referenced by URL to keep the repo light.
* Prices, funds and cashback values are **illustrative sample data**, not real 1Fi offers.
* Money is stored and computed in integer **paise** to avoid floating‑point rounding.
