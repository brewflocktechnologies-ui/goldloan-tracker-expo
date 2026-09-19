<p align="center">
  <img src="./assets/Logo.png" alt="Goldora Logo" width="100" height="100" style="border-radius: 20%;" />
</p>

<h1 align="center">🪙 Goldora</h1>

<p align="center">
  <strong>Serverless Gold Loan Origination & Vault Management for Android, iOS and Web</strong>
</p>

<p align="center">
  <a href="https://expo.dev"><img src="https://img.shields.io/badge/Expo-SDK_57-black?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" /></a>
  <a href="https://reactnative.dev"><img src="https://img.shields.io/badge/React_Native-0.86-20232a?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://workspace.google.com/"><img src="https://img.shields.io/badge/Backend-Google_Sheets_%2B_Drive-34A853?style=for-the-badge&logo=googlesheets&logoColor=white" alt="Google Sheets" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License: MIT" /></a>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How it works</a> •
  <a href="#-setup">Setup</a> •
  <a href="#-project-structure">Structure</a> •
  <a href="#-security-notes">Security</a> •
  <a href="#-documentation">Docs</a>
</p>

---

## 🌟 About

**Goldora** is a gold-loan management app for pawn brokers and small lenders. There is no database server to run. A **Google Apps Script** web app (`backend/Code.gs`) acts as the API, **Google Sheets** stores the data, and **Google Drive** stores photos.

You sign in with an admin account stored in the sheet, then manage customers, their bank accounts, gold ornaments, loans, repayments and loan closure.

---

## 📱 Features

- **🔐 Sign-in and roles**
  - Username and password login against the `Admins` sheet, with an 8-hour session token.
  - **SuperAdmin** can create, edit and delete. **User** is read-only, except for changing their own password.
  - SuperAdmins manage login accounts in the **Admins** tab. Every user can change their own password from the profile menu.
  - Passwords are stored as SHA-256 hashes, and login is limited to 5 attempts per 15 minutes per username.
- **📊 Dashboard**
  - Live Bangalore **24K / 22K / 18K** gold rates, scraped from goodreturns.in and refreshed on demand.
  - KPIs: active loan amount, pledged grams, bank limits available, vault buying value, and recent repayments.
- **👥 Customers**
  - Directory with search by name, ID, customer code, mobile, email or Aadhaar.
  - KYC fields (Aadhaar, PAN), customer photo, and a profile page with linked banks, loans and ornaments.
- **🏦 Bank Accounts**
  - Accounts per customer with a **maximum loan limit** and live utilisation, so a loan cannot exceed the available limit.
  - Passbook photo upload.
- **💎 Gold Vault (Ornaments)**
  - Gross, stone and metal/net weight, purity, hallmark number, and multiple photos.
  - Buying cost vs market value, with appreciation shown.
  - Status flow: `Available` → `Pledged` → `Released`.
- **💰 Loans**
  - Create a loan by choosing the borrower, the bank account and the ornaments to pledge.
  - Simple or compound interest, processing fee (0.5% in the New Loan wizard), document charge and insurance.
  - Edit an active loan, including swapping pledged ornaments.
  - Record repayments as **Interest**, **Principal** or **Part Payment**, with method and reference.
- **🔒 Loan Closure**
  - Close a loan with remarks. Its pledged ornaments are released back to the vault.
- **🎨 App experience**
  - Light, dark or system theme, a responsive sidebar layout, toast notifications, and skeleton loaders.
  - Works on Android, iOS and the web.

---

## 🧭 How it works

```text
Screens ──► useAppStore (in-memory) ──► AsyncStorage cache ──► ApiService ──► Apps Script ──► Sheets / Drive
```

- **Store:** screens read from an in-memory store. Changes appear in the UI immediately, then the request is sent to the backend in the background.
- **Caching:** two layers on the phone: memory, then `AsyncStorage` (about 30 minutes for lists, 60 minutes for gold rates). The backend also caches the scraped gold rates for 30 minutes.
- **Offline:** cached data is shown if the network fails. Writes need a connection.
- **Sync:** one `getInitialSyncData` call loads users, banks, ornaments, loans, payments and gold rates. It runs after login and on pull-to-refresh.

See [docs/CRUD_Flow.md](./docs/CRUD_Flow.md) for the full protocol.

---

## 🚀 Setup

Set up the backend first. The app cannot log in without it.

### 1. Install

```bash
git clone <repo-url>
cd Goldloan-mobile-main
npm install
```

### 2. Create the backend

1. Create a blank Google Sheet at [sheets.new](https://sheets.new).
2. Open **Extensions → Apps Script** and replace the starter code with [`backend/Code.gs`](./backend/Code.gs).
3. Choose the `setupSheets` function and click **Run**. Approve the permissions when asked. This creates the tabs `Admins`, `Users`, `BankAccounts`, `Ornaments`, `Loans`, `LoanOrnaments`, `Payments` and `Releases`, and adds one starting login: **`admin` / `password123`**.
4. **Deploy → New deployment → Web app.** Set *Execute as* to **Me** and *Who has access* to **Anyone**. Copy the URL that ends in `/exec`.

> **Change the `admin` password straight after your first login** (profile menu → change password).
>
> **Upgrading an existing sheet that has plaintext passwords?** Run `migrateAdminPasswordsToHashed` once from the Apps Script editor, or nobody can sign in. After any later change to `Code.gs`, create a **new deployment version** so the app uses the new code.

### 3. Point the app at the backend

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_GAS_API_URL=https://script.google.com/macros/s/<DEPLOYMENT_ID>/exec
```

Restart the dev server after editing `.env`. Optional branding, rate and loan defaults are listed in [`src/config/env.ts`](./src/config/env.ts).

### 4. Run

```bash
npm start            # Expo dev server + QR code (Expo Go)
npm run android      # Android
npm run ios          # iOS (macOS)
npm run web          # Browser
```

Testing on a phone over mobile data: `npx expo start --tunnel`.

### 5. Build and deploy

```bash
npm run android:build   # EAS preview build (internal APK)
npm run web:deploy      # EAS web deploy (after: npx expo export --platform web)
```

Before publishing, change the app identifiers (`com.kishanth01.myapp`) in [`app.json`](./app.json).

---

## 📁 Project structure

```text
Goldloan-mobile-main/
├── backend/Code.gs        # Google Apps Script: API, auth, Sheets CRUD, Drive, gold-rate scraper
├── docs/                  # CRUD_Flow.md, PROJECT_STRUCTURE.md
├── assets/                # Logo, icons, splash
├── scratch/               # Old analysis scripts, not used by the app
└── src/
    ├── app/               # Expo Router screens
    │   ├── _layout.tsx    #   providers, login redirect, stack
    │   ├── login.tsx
    │   ├── (tabs)/        #   index (dashboard), users, bank-accounts, ornaments,
    │   │                  #   loans, closure, admin-users, _layout (sidebar shell)
    │   ├── customers/     #   new.tsx, [id].tsx
    │   ├── ornaments/     #   new.tsx
    │   └── loans/         #   new.tsx, [id].tsx, closure.tsx
    ├── components/        # DataTable, MobileCard, StatCard, GoldRateTicker, modals, image pickers
    ├── config/            # env.ts (EXPO_PUBLIC_* values), api.ts (backend URL)
    ├── constants/         # theme.ts (light and dark palettes)
    ├── context/           # Auth, Theme, Toast, Sidebar providers
    ├── services/          # api.ts (HTTP), cache.ts, store.ts (app state)
    └── types/             # Shared TypeScript types
```

A file-by-file breakdown and the boot sequence are in [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md).

---

## 🔐 Security notes

This app holds customer identity and financial data. Before using it with real records:

- **Change the seeded `admin` / `password123` login.**
- **Uploaded photos are shared "domain with link".** That works for Google Workspace accounts. On a personal `@gmail.com` account the photos may not display in the app. Check this with a test upload before relying on it.
- The backend requires a session token for everything except login, ping and gold rates. Roles are enforced on the server, not just in the app.
- Passwords are hashed with unsalted SHA-256. That is better than plain text, but consider a stronger scheme for production.
- Customer data, including Aadhaar and PAN, is cached unencrypted on the device by `AsyncStorage`.
- The `/exec` URL is publicly reachable. Keep it private.

---

## 📚 Documentation

- [docs/PROJECT_STRUCTURE.md](./docs/PROJECT_STRUCTURE.md): layout, initialisation steps, boot sequence, routes, data model.
- [docs/CRUD_Flow.md](./docs/CRUD_Flow.md): request protocol, caching, optimistic updates and CRUD traces.

---

## 📄 License

MIT. See [LICENSE](./LICENSE).
