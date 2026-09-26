# ☀️ Smart Solar Microgrid Energy Trading System

> **SE4040 – Enterprise Application Development**
> FAT Service Pattern · Central C# Web API · MongoDB Atlas · React Web · Native Android (Java) · IIS Hosted

[![.NET](https://img.shields.io/badge/Backend-ASP.NET%20Core%20.NET%2011-blue)](https://dotnet.microsoft.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61DAFB)](https://react.dev/)
[![Android](https://img.shields.io/badge/Mobile-Native%20Android%20Java-3DDC84)](https://developer.android.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248)](https://www.mongodb.com/)
[![IIS](https://img.shields.io/badge/Hosted-IIS%20AspNetCoreModuleV2-lightgrey)](https://iis.net/)

<p align="center">
  <img src="frontend/smart-solar-web/public/solarx-logo.png" alt="SØLΛR-X website logo" width="220" />
</p>
<p align="center"><sub>SMΛRTΞS/ŌL∆R from SØLΛR-X</sub></p>

---

## 🔗 Project Links

| Resource | Link |
|----------|------|
| 💻 **GitHub Repository** | https://github.com/wimalarathna-ARSA/SE4040-SmartSolar-Microgrid.git |
| 🎥 **Demo Video (OneDrive)** | https://1drv.ms/v/c/ffd009c5057ecdb2/IQCfRuxT4GUkSLsJiPHZf5SwAeCiGelkh_hZQOgsbpuDrMg?e=IbNnEV |
| 🖥️ **Backend (IIS Hosted)** | See [Backend – IIS Hosting](#-2-backend--central-fat-web-api-c--aspnet-core) – published build in `IIS/SmartSolarApi/` |

```bash
# Clone the project
git clone https://github.com/wimalarathna-ARSA/SE4040-SmartSolar-Microgrid.git
cd SE4040-SmartSolar-Microgrid
```

---

## 📖 Project Overview

**Smart Solar Microgrid (SØLΛR-X)** is a decentralized solar energy trading and battery-slot reservation platform for Sri Lankan microgrid communities.

Solar **Prosumers** (homeowners who produce + consume energy) can discover nearby solar hubs on a map, book battery drop-off / pick-up slots, track reservations with QR tokens, and view energy history. **Grid Operators** verify QR codes on-site with the Android app to complete energy transfer jobs. **Backoffice Admins** manage users, approve prosumer activations, manage stations and battery slots, monitor all bookings, and view dashboards — via a rich React web portal.

### Why it matters
- Solves local solar energy sharing / storage scheduling without a central utility.
- Enforces real enterprise rules: NIC as primary key, 12-hour reschedule/cancel guards, 7-day booking window, slot capacity control, QR-signed job completion, OTP password reset, role-based access.
- Demonstrates a true **FAT Service Pattern**: 100% of business logic lives in the central C# Web API. React and Android are thin clients.

### Key Highlights
- 🔐 **JWT Auth + RBAC** – 3 roles: `Backoffice`, `GridOperator`, `Prosumer`. NIC-based identity.
- 📧 **OTP Password Reset** – 6-digit Gmail OTP with 5-min expiry (`EmailService.cs`).
- ⚡ **Energy Slot Engine** – 7-day rolling slots, lowest-free-slot auto allocation, `RES-XXXXX` codes, signed QR `SMARTSOLAR-TX|…|sha256`.
- 🗺️ **Maps** – Web: Leaflet. Mobile: OSMDroid offline tiles + Geocoder/Nominatim + Google-Maps navigation intents.
- 📱 **Offline-first Mobile** – SQLite v3, 7 tables, JWT session persistence, 4-tab booking history.
- 📊 **Dashboards** – Backoffice + Operator dashboards, `dashboard-stats`, analytics.

---

## 🏗️ System Architecture

```
                ┌─────────────────────────┐
                │   MongoDB Atlas         │
                │   SmartSolarMicrogrid   │
                │ UserDetails / Stations /│
                │ Slots / Reservations    │
                └────────────▲────────────┘
                             │
              ┌──────────────┴──────────────┐
              │  ASP.NET Core FAT Web API   │
              │  backend/SmartSolarApi      │
              │  Controllers + Services +   │
              │  JWT + CORS + Seeder        │
              │  Published → IIS/SmartSolarApi │
              └──────▲──────────────▲───────┘
                     │              │
        ┌────────────┘              └────────────┐
        │                                        │
┌───────┴────────┐                    ┌──────────┴────────┐
│ React 19 Web   │                    │ Native Android    │
│ Backoffice +   │                    │ Prosumer +        │
│ Operator Portal│                    │ Operator App      │
│ Axios / Leaflet│                    │ OkHttp3 / ZXing / │
│ / Three.js     │                    │ OSMDroid / SQLite │
└────────────────┘                    └───────────────────┘
```

**Pattern:** FAT Service – all validation, guards, QR signing, slot allocation, email, and auth live server-side in `Services/`. Clients only render and call REST.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | C# ASP.NET Core .NET 11, JWT Bearer, BCrypt.Net-Next, MongoDB.Driver 3.11, OpenAPI, SMTP Gmail |
| Database | MongoDB Atlas (`SmartSolarMicrogrid`), SQLite local cache on Android (`DatabaseHelper.java` v3, 7 tables) |
| Web Frontend | React 19 + Vite 6, React Router 7, Axios, Bootstrap 5.3, Tailwind 3.4, Leaflet 1.9, Three.js |
| Mobile | Pure Native Java, OkHttp3, ZXing QR, OSMDroid 6.1.18, SessionManager + SQLite |
| Hosting | **IIS** – `AspNetCoreModuleV2`, InProcess (`IIS/SmartSolarApi/` + `web.config`), `logs/stdout` |

---

## 📂 Directory Structure

```
SE4040-SmartSolar-Microgrid/
├── backend/
│   └── SmartSolarApi/              # Central FAT Web API
│       ├── Controllers/            # Auth, Users, Stations, Reservations, DatabaseTest
│       ├── Services/               # AuthService, UserService, StationService, ReservationService, EmailService
│       ├── Models/                 # User, UserDetails, Station, SolarStationInfo, Reservation, EnergyReservation, EnergyOffer, EnergyBookingSlots, EnergyTransaction
│       ├── DTOs/                   # AuthDtos, UserDtos, StationDtos, ReservationDtos
│       └── Data/                   # MongoDbContext, DbSeeder
├── frontend/
│   └── smart-solar-web/            # React Web Portal
│       ├── src/pages/backoffice/   # BackofficeDashboard, UserManagement, ProsumerManagement, StationManagement, ReservationManagement
│       ├── src/pages/operator/     # OperatorDashboard, BookingsMonitor, StationSlots, QrVerification, EnergyTransferHistory
│       ├── src/components/ + 3d/   # Navbar, Footer, 3D Globe / Constellation / Calculator
│       ├── src/services/api.js     # Axios client
│       └── src/context/AuthContext.jsx
├── android/
│   └── SmartSolarMobile/           # Native Java App
│       └── app/src/main/
│           ├── java/.../api/       # ApiClient (OkHttp3, LAN + emulator URLs)
│           ├── java/.../data/      # DatabaseHelper (SQLite), SessionManager, ThemeManager
│           ├── java/.../ui/auth/   # Splash, Onboarding, Login, Register
│           ├── java/.../ui/prosumer/ # Main, CreateReservation, BookingHistory, BookingDetail, Analytics, StationMap, Profile
│           └── java/.../ui/operator/ # Main, Stations, NodeDetail, BookingDetail, QrScanner, TransactionDetail
├── IIS/
│   ├── SmartSolarApi/              #  IIS published backend (ready to host)
│   │   ├── SmartSolarApi.dll / .exe / .deps.json / .runtimeconfig.json
│   │   ├── web.config              # AspNetCoreModuleV2 handler
│   │   ├── appsettings.json
│   │   └── logs/
│   └── SmartSolarApi_Backup_20260925/
└── README.md
```

---

## ⚙️ 1. Prerequisites

- **.NET SDK** 10.0 or 11.0 RC
- **Node.js** v18+ and npm
- **MongoDB Atlas** – URI in `appsettings.json` (DB: `SmartSolarMicrogrid`)
- **Android Studio** Iguana / Jellyfish+, Android SDK 34
- **IIS** 10+ with ASP.NET Core Hosting Bundle (for IIS hosting)

---

## 🚀 2. Backend – Central FAT Web API (C# ASP.NET Core)

### 2.1 Run with `dotnet` (development)

```bash
cd backend/SmartSolarApi
dotnet run -c Release
# API Base URL: http://localhost:5000
```

What happens on startup (`Program.cs`):
- CORS `AllowAllClients` for React + Android
- JWT auth (`Jwt:Key/Issuer/Audience`, 1440-min expiry)
- Singleton `MongoDbContext` + scoped FAT services
- Auto-migration (`EnsureUserDetailsNicPrimaryKeyAsync`) + `DbSeeder.SeedAsync`

### 2.2 IIS Hosted Backend ✅ (production)

A pre-published, IIS-ready build is included in this repo:

> **`IIS/SmartSolarApi/`** – copy this folder to your IIS site physical path.

Contents: `SmartSolarApi.dll`, `SmartSolarApi.exe`, `SmartSolarApi.deps.json`, `SmartSolarApi.runtimeconfig.json`, `web.config`, `appsettings.json`, `logs/`.

`web.config` (InProcess):
```xml
<aspNetCore processPath="dotnet" arguments=".\SmartSolarApi.dll"
  stdoutLogEnabled="false" stdoutLogFile=".\logs\stdout" hostingModel="inprocess" />
```

**Deploy steps:**
1. Install **ASP.NET Core Hosting Bundle** (.NET 11) on Windows Server / IIS machine.
2. In IIS Manager → Add Website → physical path → `IIS/SmartSolarApi/` → App Pool **No Managed Code**.
3. Ensure `logs/` is writable. Set `ASPNETCORE_ENVIRONMENT` if needed.
4. Browse the site – API serves `api/*`. Point web (`api.js`) and mobile (`ApiClient.java`) base URLs to the IIS host.
5. Backup snapshot kept at `IIS/SmartSolarApi_Backup_20260925/`.

### 2.3 Key API Endpoints

| Controller | Method & Route | Purpose |
|------------|----------------|---------|
| Auth | `POST api/auth/register` | Prosumer registration (NIC = PK) |
| Auth | `POST api/auth/login` | Login all roles → JWT |
| Auth | `POST api/auth/request-password-reset-otp` | 6-digit Gmail OTP |
| Auth | `POST api/auth/verify-password-reset-otp` | Verify OTP (5-min) |
| Auth | `POST api/auth/confirm-password-reset` | Set new password |
| Users | `POST api/users/staff` | Create staff |
| Users | `GET api/users`, `GET api/users/{nic}` | List / detail |
| Users | `GET api/users/pending-prosumers` | Activation queue |
| Users | `PUT api/users/{nic}/profile`, `…/request-deactivation`, `…/activate`, `…/deactivate`, `…/reactivate`, email-update flow | Lifecycle |
| Stations | `POST/GET api/stations`, `GET/PUT/DELETE api/stations/{id}` | Node CRUD |
| Stations | `PUT api/stations/{id}/battery-slots`, `GET api/stations/{id}/slots` | Slot capacity |
| Stations | `GET api/stations/nearby-prosumer/{nic}` | Haversine-sorted nearby hubs |
| Reservations | `POST api/reservations`, `POST api/reservations/backoffice-create` | Create (7-day guard, auto slot) |
| Reservations | `GET api/reservations`, `GET api/reservations/dashboard-stats`, `GET api/reservations/{id}` | Monitor |
| Reservations | `PUT api/reservations/{id}`, `DELETE api/reservations/{id}` | Reschedule / cancel (12-h guard) |
| Reservations | `POST api/reservations/verify-qr?operatorNic=` | Complete job, release slot, audit |

Seeded demo accounts (`DbSeeder.cs`):

| Role | Email | Password | NIC |
|------|-------|----------|-----|
| Backoffice Admin | `admin@smartsolar.com` | `Admin@123` | `198512345678` |
| Grid Operator | `operator@smartsolar.com` | `Operator@123` | `199087654321` |
| Prosumer (Active) | `kamal@solar.lk` | `Kamal@123` | `199512345678` |
| Prosumer (Pending) | `nimal@solar.lk` | `Nimal@123` | `199623456789` |

Seeded hubs: `HUB-COLOMBO-01`, `HUB-KANDY-02`, `HUB-GALLE-03`, `HUB-JAFFNA-04` + 7-day × 6-slot/day booking slots.

---

## 🌐 3. Web Frontend – React Portal

```bash
cd frontend/smart-solar-web
npm install
npm run dev
# → http://localhost:5173
```

- **Backoffice:** `BackofficeDashboard.jsx`, `UserManagement.jsx` (staff CRUD), `ProsumerManagement.jsx` (approve/reject + role×status filters + search), `StationManagement.jsx`, `ReservationManagement.jsx` (approve/reject/reschedule), `BookingsMonitor.jsx`.
- **Operator:** `OperatorDashboard.jsx`, `BookingsMonitor.jsx`, `StationSlots.jsx`, `QrVerification.jsx`, `EnergyTransferHistory.jsx`.
- **Auth:** `Login.jsx` (demo creds + OTP reset), `AuthContext.jsx`, `ProtectedRoute.jsx` (JWT role routing).
- **UX:** Bootstrap 5 + Tailwind, Leaflet `MicrogridMapModal.jsx` + `LocationPickerModal.jsx`, Three.js (`SolarMicrogrid3D`, `FrequenzGlobeFooter3D`, `EnergyYieldCalculator3D`), `NodeScheduleModal.jsx`.
---

## 📱 4. Mobile App – Pure Native Android (Java)

Open `android/SmartSolarMobile` in Android Studio → Run.

- Base URL in `ApiClient.java` (OkHttp3): `http://10.0.2.2:5000/api/` for emulator (change to LAN / IIS host for real device).
- **Auth:** `SplashActivity`, `OnboardingActivity`, `LoginActivity` (role routing → Operator/Prosumer), `RegisterActivity` (NIC required, 5-rule password meter, OSMDroid GPS picker).
- **Prosumer:** `ProsumerMainActivity` (Haversine list), `StationMapActivity` (OSMDroid offline markers), `CreateReservationActivity` (`POST /api/reservations`), `BookingHistoryActivity` (4 tabs + search), `BookingDetailActivity`, `AnalyticsActivity`, `EnergyTransferHistoryActivity`, `ProfileActivity`, `SettingsActivity`.
- **Operator:** `OperatorMainActivity`, `OperatorStationsActivity`, `OperatorNodeDetailActivity`, `OperatorBookingDetailActivity`, `QrScannerActivity` (ZXing) → `POST verify-qr?operatorNic=` → Completed + audit + slot release, `OperatorTransactionDetailActivity`.
- **Local:** `DatabaseHelper.java` (SQLite v3, 7 tables, CONFLICT_REPLACE), `SessionManager.java` (JWT store), `ThemeManager.java`.

---

## 👥 5. Individual Contributions & Rubric Mark Breakdown

### Allocation Summary – Table 20 Individual Contributions

| Member ID | Rubric Items Owned |
|-----------|--------------------|
| IT22166210 | Slot Booking Management + Create Booking + Update Booking + Cancel Booking + Booking History + Current / Pending Bookings |
| IT22207418 | Web Login + User Management + Filter Criteria + Summary Page After Action + Modify Account + Deactivate Account + Web API |
| IT22106292 | Microgrid Node & Battery Slot Management + Mobile Login & Role Routing + Create Account Mobile + Nearby Stations on Map + Google Maps API Integration |
| IT22082510 | Pending Activation View + SQLite Persistence + Mobile API Integration + QR Scanning + Read QR & Complete Job + Pending Reservations Aggregation |

### Detailed Member Breakdown

#### 1. IT22166210 — Slot Booking, Mobile Reservations & History – Table 21 IT22166210

| Deliverable | Evidence (verified) |
|-------------|---------------------|
| Slot Booking Management | `ReservationManagement.jsx` — oversight, filter, approve/reject, reschedule |
| Create Booking Request | `CreateReservationActivity.java` + `POST /api/reservations` — 7-day guard, lowest-free-slot allocation, RES- 6-digit codes |
| Update Request | `PUT /api/reservations/{id}` — 12-hour guard, QR regenerated |
| Cancel Request | `DELETE /api/reservations/{id}` — 12-hour guard (staff path exempt) |
| Booking History | `BookingHistoryActivity.java` (4 tabs + search) & `EnergyTransferHistoryActivity.java` |
| Current / Pending Bookings | `BookingsMonitor.jsx` + `dashboard-stats`; QR payloads signed `SMARTSOLAR-TX\|…\|sha256` in `ReservationService.cs` |

#### 2. IT22207418 — Web Login, User Management, Filters & Summaries – Table 22 IT22207418

| Deliverable | Evidence (verified) |
|-------------|---------------------|
| Web Login & RBAC | `Login.jsx` (quick demo creds + OTP reset), `AuthContext.jsx`, `ProtectedRoute.jsx` (role routing on JWT verify) |
| User Management | `UserManagement.jsx` (staff CRUD); lead author of `UsersController.cs` & `UserService.cs` |
| Filter Criteria | Multi-criteria filters in `ProsumerManagement.jsx` (role × status + search + deactivationRequested) |
| Summary Page After Action | Confirmation/summary views in `StaffProfile.jsx`, `BookingDetailActivity.java`, profile status dialogs |
| Modify Own Account and Deactivate Account | `PUT users/{nic}/profile` + `ProfileActivity.java` editor, `PUT users/{nic}/request-deactivation` approval-model flow |
| Core backend infrastructure | `Program.cs` (CORS/JWT/Mongo), `MongoDbContext.cs` (NIC migration), `DbSeeder.cs`, `EmailService.cs`, OpenAPI docs |

#### 3. IT22106292 — Nodes, Mobile Auth, Registration & Maps – Table 23 IT22106292

| Deliverable | Evidence (verified) |
|-------------|---------------------|
| Microgrid Node Management | Creating/managing solar stations: `StationManagement.jsx`, `SolarStationInfo.cs`, `StationsController.cs`, `StationService.cs` (CRUD + slot auto-generation + deactivation guard) |
| Battery Slot Management | Defining battery storage slots, adjusting available rack capacity, and locking deactivations if active bookings exist. `StationSlots.jsx`, `EnergyBookingSlots.cs` |
| Mobile Login with Role Routing | `LoginActivity.java` → `OperatorMainActivity` / `ProsumerMainActivity` |
| Create Account (Mobile) | `RegisterActivity.java` — NIC required (server is PK authority), 5-rule password meter, OSMDroid GPS picker |
| Nearby Stations on Map | `StationMapActivity.java` (OSMDroid markers + offline cache) + `ProsumerMainActivity` (backend Haversine-sorted list) |
| Map Integration | OSMDroid 6.1.18 offline tiles + Geocoder/Nominatim + `geo:` Google-Maps navigation intents |

#### 4. IT22082510 — Activation, SQLite, QR & Dashboards – Table 24 IT22082510

| Deliverable | Evidence (verified) |
|-------------|---------------------|
| Pending Activation View | `ProsumerManagement.jsx` — approve/reject + status filters |
| SQLite Local Persistence | `DatabaseHelper.java` — v3, 7 tables, CONFLICT_REPLACE ×7, JWT session store |
| Mobile → Web API Integration | `ApiClient.java` (OkHttp3, LAN + emulator URLs) + `SessionManager.java` over SQLite |
| QR Code Scanning | `QrScannerActivity.java` (ZXing ScanContract) + `QrVerification.jsx` (web) |
| Read QR & Update Job as Done | `verifyAndFinalizeJob` → `POST verify-qr?operatorNic=` → Completed + audit + slot release |
| Dashboards & co-authorship | `BackofficeDashboard.jsx`, `OperatorDashboard.jsx`, `BookingsMonitor.jsx`, `AnalyticsActivity.java`; co-author `UsersController.cs` |

---



<p align="center">☀️ <b>Smart Solar Microgrid</b> — SE4040 EAD · <a href="https://github.com/wimalarathna-ARSA/SE4040-SmartSolar-Microgrid.git">GitHub</a> · <a href="https://1drv.ms/v/c/ffd009c5057ecdb2/IQCfRuxT4GUkSLsJiPHZf5SwAeCiGelkh_hZQOgsbpuDrMg?e=IbNnEV">Demo Video</a></p>
