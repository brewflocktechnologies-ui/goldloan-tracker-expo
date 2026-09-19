# 🧭 Project Structure & Initialisation Guide

This document explains how the **Goldora** repository is laid out, how to initialise it from a clean checkout (backend first, then the app), and how the app boots and wires its layers together at runtime.

For the request/response protocol and CRUD traces, see [CRUD_Flow.md](./CRUD_Flow.md). This document covers *structure* and *startup*.

## 📑 Table of Contents

1. [Stack at a Glance](#1-stack-at-a-glance)
2. [Repository Layout](#2-repository-layout)
3. [Layered Architecture](#3-layered-architecture)
4. [Step-by-Step Initialisation](#4-step-by-step-initialisation)
5. [Runtime Boot Sequence](#5-runtime-boot-sequence)
6. [Routing Map](#6-routing-map)
7. [Data Model](#7-data-model)
8. [Configuration Reference](#8-configuration-reference)
9. [Build & Deploy](#9-build--deploy)
10. [Known Gaps to Resolve Before Production](#10-known-gaps-to-resolve-before-production)

---

## 1. Stack at a Glance

| Layer | Technology |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19 |
| Routing | Expo Router (file-based, `src/app`) |
| Language | TypeScript (strict), path alias `@/*` → `src/*` |
| Client state | Module-level store in `src/services/store.ts` + React context providers |
| Local persistence | `@react-native-async-storage/async-storage` (cache, session, theme, custom API URL) |
| Backend | Google Apps Script web app (`backend/Code.gs`) |
| Database | Google Sheets (one tab per entity) |
| File storage | Google Drive (`GoldLoanApp_Uploads/…`) |
| Targets | Android, iOS, Web (static output) |
| Build / hosting | EAS Build, EAS Deploy (web) |

---

## 2. Repository Layout

```text
Goldloan-mobile-main/
├── app.json                 # Expo config: name, bundle IDs, plugins, EAS project
├── eas.json                 # EAS build profiles: development / preview / production
├── package.json             # Dependencies and npm scripts
├── tsconfig.json            # Strict TS, "@/*" path alias
├── .env                     # Local env vars (git-ignored, EXPO_PUBLIC_*)
│
├── assets/                  # Logo, icons, splash, Android adaptive icons
│
├── backend/
│   └── Code.gs              # Google Apps Script: REST router, Sheets CRUD, Drive
│                            #   uploads, gold-rate scraper, server-side cache
│
├── docs/
│   ├── CRUD_Flow.md         # Protocol + end-to-end CRUD traces
│   └── PROJECT_STRUCTURE.md # This file
│
├── scratch/                 # Throwaway analysis scripts from the original web
│                            #   app port; not used at runtime
│
└── src/
    ├── app/                 # ── ROUTES (Expo Router) ──
    │   ├── _layout.tsx      #   Root: providers + auth redirect + Stack
    │   ├── index.tsx        #   Entry: redirect to /login or /(tabs)
    │   ├── login.tsx        #   Sign-in screen
    │   ├── (tabs)/          #   Main shell (sidebar + tab navigator)
    │   │   ├── _layout.tsx  #     Sidebar/bottom nav, header, sync + profile
    │   │   ├── index.tsx    #     Dashboard: KPIs, live gold rates
    │   │   ├── users.tsx    #     Customers directory
    │   │   ├── bank-accounts.tsx
    │   │   ├── ornaments.tsx#     Gold vault inventory
    │   │   ├── loans.tsx    #     Loan book
    │   │   ├── closure.tsx  #     Loan closure / release
    │   │   └── admin-users.tsx#   Login-account management (SuperAdmin)
    │   ├── customers/       #   new.tsx (modal), [id].tsx (profile)
    │   ├── ornaments/       #   new.tsx (modal)
    │   └── loans/           #   new.tsx (wizard), [id].tsx (detail + payments),
    │                        #   closure.tsx (modal)
    │
    ├── components/          # ── REUSABLE UI ──
    │   ├── DataTable.tsx, MobileCard.tsx     # Desktop table / mobile card lists
    │   ├── StatCard.tsx, Badge.tsx, Skeleton.tsx
    │   ├── GoldRateTicker.tsx                # Live 24K/22K/18K banner
    │   ├── Header.tsx, SidebarTrigger.tsx, ThemeToggleBtn.tsx
    │   ├── ConfirmModal.tsx, ProfileModal.tsx
    │   └── ImagePickerField.tsx, ImageViewModal.tsx   # Photo capture / preview
    │
    ├── config/              # ── CONFIGURATION ──
    │   ├── env.ts           #   Typed EXPO_PUBLIC_* access with defaults
    │   └── api.ts           #   ApiConfig: resolves the backend URL
    │
    ├── constants/
    │   └── theme.ts         #   Light/Dark color palettes
    │
    ├── context/             # ── APP-WIDE PROVIDERS ──
    │   ├── ThemeContext.tsx #   light / dark / system, persisted
    │   ├── ToastContext.tsx #   Toast notifications
    │   ├── AuthContext.tsx  #   Session, login/logout, role flags
    │   └── SidebarContext.tsx#  Sidebar collapse state (tabs shell only)
    │
    ├── services/            # ── DATA LAYER ──
    │   ├── api.ts           #   ApiService: HTTP to Apps Script + caching
    │   ├── cache.ts         #   Memory + AsyncStorage cache with TTLs
    │   └── store.ts         #   In-memory app store, optimistic CRUD, sync
    │
    ├── types/index.ts       # Shared interfaces (User, Loan, Ornament, …)
    └── global.css           # Web font variables
```

---

## 3. Layered Architecture

```text
┌──────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION      src/app/**, src/components/**          │
│    Screens read state via hooks and call store actions.       │
├──────────────────────────────────────────────────────────────┤
│ 2. APP-WIDE CONTEXT  src/context/**                          │
│    Theme · Toast · Auth (session + role) · Sidebar           │
├──────────────────────────────────────────────────────────────┤
│ 3. STATE             src/services/store.ts                   │
│    useAppStore(): users, bankAccounts, ornaments, loans,     │
│    payments, goldRates. Optimistic writes, background sync.  │
├──────────────────────────────────────────────────────────────┤
│ 4. CACHE             src/services/cache.ts                   │
│    RAM map → AsyncStorage (30 min lists, 60 min gold rates). │
├──────────────────────────────────────────────────────────────┤
│ 5. TRANSPORT         src/services/api.ts  ← src/config/api.ts│
│    callGas(): GET/POST with fallback, attaches session token.│
├──────────────────────────────────────────────────────────────┤
│ 6. BACKEND           backend/Code.gs (Google Apps Script)    │
│    doGet/doPost router → Sheets (data) · Drive (files) ·     │
│    CacheService · goodreturns.in scraper (gold rates)        │
└──────────────────────────────────────────────────────────────┘
```

**Dependency rule:** each layer only calls downward. Screens never call `fetch` or `api.ts` for entity writes directly. They go through `useAppStore()`, which owns the optimistic update and the cache write.

---

## 4. Step-by-Step Initialisation

Set up in this order. The app cannot log in until the backend exists.

### Step 1 — Prerequisites

- Node.js (current LTS) and npm
- A Google account (for Sheets, Apps Script and Drive)
- For device testing: the Expo Go app, or an Android emulator / iOS simulator
- For builds: an Expo account with EAS CLI (`npm i -g eas-cli`)

### Step 2 — Get the code and install dependencies

```bash
git clone <repo-url> Goldloan-mobile-main
cd Goldloan-mobile-main
npm install
```

### Step 3 — Create the Google Sheet

1. Create a blank spreadsheet at <https://sheets.new> (e.g. `Gold Loan Database`).
2. Open **Extensions → Apps Script**.

### Step 4 — Install the backend script

1. Replace the editor contents with [`backend/Code.gs`](../backend/Code.gs).
2. The script is container-bound, so `SPREADSHEET_ID` resolves from the active spreadsheet automatically. Only set it manually for a standalone script.

### Step 5 — Create the sheet tabs

Select `setupSheets` in the function dropdown and click **Run**. Grant the permissions when prompted. It creates these tabs with styled headers and a frozen first row:

`Admins` · `Users` · `BankAccounts` · `Ornaments` · `Loans` · `LoanOrnaments` · `Payments` · `Releases`

It also seeds one login row in `Admins`. **Change or remove this seeded account immediately** (see [§10](#10-known-gaps-to-resolve-before-production)).

### Step 6 — Deploy the web app

1. **Deploy → New deployment → Web app**.
2. Execute as **Me**; access **Anyone**. The mobile client cannot perform a Google login.
3. Copy the `/exec` URL.

After every backend edit you must create a **new deployment version**, or the app keeps calling the old code.

### Step 7 — Point the app at the backend

The URL is resolved in this order (`src/config/api.ts`):

1. A URL saved at runtime in AsyncStorage (key `@goldloan_custom_gas_url`)
2. `EXPO_PUBLIC_GAS_API_URL` from `.env`
3. Empty string, which makes the API return "not configured"

Create `.env` in the project root:

```env
EXPO_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
EXPO_PUBLIC_SPREADSHEET_ID=<optional>
```

Restart the dev server after changing `.env`, because Expo inlines `EXPO_PUBLIC_*` at bundle time.

### Step 8 — Run the app

```bash
npm start          # Metro + QR code for Expo Go
npm run android    # Android emulator/device
npm run ios        # iOS simulator (macOS)
npm run web        # Browser
```

### Step 9 — Verify end to end

1. The app opens on `/login`.
2. Sign in with an `Admins` row that has `Status = Active`.
3. The dashboard should load and the gold-rate ticker should show Bangalore 24K/22K/18K rates.
4. Add a customer, then confirm a new row appears in the `Users` tab.
5. If uploads are used, confirm a `GoldLoanApp_Uploads/` folder appears in Drive.

### Step 10 — Type-check before committing

```bash
npx tsc --noEmit
```

---

## 5. Runtime Boot Sequence

What happens between launching the app and seeing the dashboard:

```text
expo-router/entry
  └─ src/app/_layout.tsx  RootLayout
       ├─ ApiConfig.init()            reads saved custom URL from AsyncStorage
       └─ Provider tree (outer → inner)
            SafeAreaProvider
             └ ThemeProvider          loads saved light/dark/system mode
                └ ToastProvider
                   └ AuthProvider     bootstrapAuth():
                      │                 read '@goldloan_auth_session'
                      │                 → setUser + api.setSessionToken(token)
                      │                 → store.syncFromBackend(true)
                      └ RootLayoutInner
                           isLoading?  wait
                           !auth && not /login → router.replace('/login')
                           auth && /login     → router.replace('/(tabs)')

src/app/index.tsx           Redirect → /(tabs) or /login
src/app/(tabs)/_layout.tsx  SidebarProvider + nav shell
  └─ any screen calls useAppStore()
       first mount only:
         hydrateFromCache()   paint from AsyncStorage instantly
                              and kick off a gold-rate refresh
         syncFromBackend()    one getInitialSyncData round trip
                              → fills users, banks, ornaments, loans,
                                payments, goldRates
                              → writes the unified snapshot + per-entity caches
                              (falls back to per-entity calls if the unified
                               call fails; skipped without a session token)
```

Login (`AuthContext.login`) calls `api.login`, stores `{ username, role, token }` in AsyncStorage, sets the token on `ApiService` and runs `syncFromBackend(true)`. A `401` response (`code === 401`) from any non-login action triggers `logout()` through `api.onUnauthorized`.

---

## 6. Routing Map

| Route | File | Presentation |
|---|---|---|
| `/` | `app/index.tsx` | Redirect only |
| `/login` | `app/login.tsx` | Full screen |
| `/(tabs)` | `(tabs)/index.tsx` | Dashboard |
| `/(tabs)/users` | `(tabs)/users.tsx` | Customers list |
| `/(tabs)/bank-accounts` | `(tabs)/bank-accounts.tsx` | Bank accounts |
| `/(tabs)/ornaments` | `(tabs)/ornaments.tsx` | Gold vault |
| `/(tabs)/loans` | `(tabs)/loans.tsx` | Loan book |
| `/(tabs)/closure` | `(tabs)/closure.tsx` | Closure list |
| `/(tabs)/admin-users` | `(tabs)/admin-users.tsx` | Login accounts |
| `/customers/new` | `customers/new.tsx` | Modal |
| `/customers/[id]` | `customers/[id].tsx` | Detail |
| `/ornaments/new` | `ornaments/new.tsx` | Modal |
| `/loans/new` | `loans/new.tsx` | Modal (wizard) |
| `/loans/[id]` | `loans/[id].tsx` | Detail + payments |
| `/loans/closure` | `loans/closure.tsx` | Modal |

Auth gating happens in `RootLayoutInner` (redirects), and role gating is done per screen with `useAuth()` flags (`isSuperAdmin`, `isReadOnly`).

---

## 7. Data Model

Google Sheets is relational by convention: IDs link rows across tabs.

```text
Users 1 ──< BankAccounts
  │  1 ──< Ornaments
  │  1 ──< Loans >── 1 BankAccounts
                │
                ├──< LoanOrnaments >── Ornaments   (pledge mapping)
                ├──< Payments
                └──< Releases

Admins  (login accounts; independent of Users)
```

| Sheet | Primary key | ID format | Notes |
|---|---|---|---|
| Users | `UserId` | `U001` | Customers with KYC fields |
| BankAccounts | `BankAccountId` | `BA001` | `MaxLoanAmount`, `UtilizedLoanAmount` |
| Ornaments | `OrnamentId` | `ORN001` | Status: Available / Pledged / Released |
| Loans | `LoanId` | `L001` | Status: Active / Closed |
| LoanOrnaments | `MappingId` | `MAP001` | Pledge link |
| Payments | `PaymentId` | `PAY001` | Interest / principal / penalty |
| Releases | `ReleaseId` | `REL001` | Delivery proof |
| Admins | `AdminId` | `ADM001` | Role: SuperAdmin / User |

Deletes are **soft**: the status is set to `Deleted` and reads filter those rows out. TypeScript shapes live in [`src/types/index.ts`](../src/types/index.ts).

---

## 8. Configuration Reference

All client variables need the `EXPO_PUBLIC_` prefix (`src/config/env.ts`).

| Variable | Default | Purpose |
|---|---|---|
| `EXPO_PUBLIC_GAS_API_URL` | `""` | Apps Script `/exec` URL |
| `EXPO_PUBLIC_SPREADSHEET_ID` | `""` | Optional reference |
| `EXPO_PUBLIC_APP_NAME` | `Goldora` | Branding |
| `EXPO_PUBLIC_APP_SUBTITLE` | `Bangalore Gold Valuation System` | Branding |
| `EXPO_PUBLIC_LOCATION_BENCHMARK` | `Bangalore` | Rate location label |
| `EXPO_PUBLIC_FALLBACK_24K_RATE` / `22K` / `18K` | `8850` / `8115` / `6640` | ₹ per gram when live rates fail |
| `EXPO_PUBLIC_DEFAULT_INTEREST_RATE` | `1.5` | Loan form default |
| `EXPO_PUBLIC_DEFAULT_LOAN_PERIOD` | `12 Months` | Loan form default |
| `EXPO_PUBLIC_MAX_LTV_PERCENT` | `75` | LTV ceiling |

Persisted client keys in AsyncStorage: `@goldloan_auth_session`, `@goldloan_custom_gas_url`, `@gl_theme_mode`, and cache entries under the cache prefix in `cache.ts`.

**Cache TTLs** (`src/services/cache.ts`): gold rates 60 min, dashboard 30 min, entity lists 30 min, unified sync snapshot 30 min. Any successful write calls `invalidateEntity()`, which also drops the sync snapshot and dashboard keys.

---

## 9. Build & Deploy

| Goal | Command |
|---|---|
| Dev server | `npm start` |
| Android internal APK | `npm run android:build` (`eas build -p android --profile preview`) |
| Dev client build | `eas build --profile development` |
| Store build | `eas build --profile production` (`autoIncrement: true`) |
| Web deploy | `npx expo export --platform web`, then `npm run web:deploy` (`eas deploy`) |

`app.json` sets `web.output: "static"`, the Android package and iOS bundle ID `com.kishanth01.myapp` (change before publishing), and the EAS project ID. Assets referenced by the config live in `assets/`.

---

## 10. Known Gaps to Resolve Before Production

These are structural gaps found while documenting the project. They affect initialisation, so they are listed here.

1. **The committed `Code.gs` does not implement every action the client calls.** The client uses `login`, `logout`, `changePassword`, `getInitialSyncData`, `getPayments`, `getAdminUsers`, `addAdminUser`, `updateAdminUser`, `deleteAdminLoginUser`, `getActiveLoansForClosure` and `deleteOrnamentImage`. None of these are in the committed script, which exposes `authenticateAdmin` instead. Deploy the newer script, or add these handlers, before Step 9 will pass.
2. **The committed backend has no token or role enforcement.** Any caller with the `/exec` URL can invoke any action. Add token validation and role checks server-side. The client-side `isReadOnly` flag only hides UI.
3. **The seeded admin is `admin` / `password123` in plaintext.** Change it at once, and store salted hashes instead.
4. **Drive uploads are shared as "anyone with the link".** They contain KYC and passbook images.
5. **Optimistic writes never roll back.** A rejected server write only logs a warning while the UI keeps the change. Add error handling in `store.ts`.
6. **Closure field mismatch.** The client sends `closureRemarks`, the server reads `remarks`, and the client's ornament status after closure (`Released`) differs from the server's (`Available`).
7. **`CRUD_Flow.md` may still be out of date.** It was written against an earlier backend, so check its description of server-side caching and the API action list against `backend/Code.gs` before relying on it.
