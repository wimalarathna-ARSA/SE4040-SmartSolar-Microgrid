# Smart Solar Microgrid Energy Trading System
> **Course**: SE4040 - Enterprise Application Development  
> **Architecture Pattern**: FAT Service Pattern (100% Business Logic in Central C# Web API)  
> **Database**: MongoDB NoSQL (with SQLite Local Mobile Cache)  
> **Platforms**: C# ASP.NET Core (.NET 11.0), React 18 + Bootstrap 5 Web, Pure Native Android (Java)  

---

## 1. Quick Start Guide

### Prerequisites
- **.NET SDK**: 10.0 or 11.0 RC
- **Node.js**: v18+ and npm
- **MongoDB Atlas Cluster**: Configured via URI `mongodb+srv://admin:IUlI3zdAOM94uj0X@cluster0.1jec4sq.mongodb.net/?appName=Cluster0` in `appsettings.json` (Database: `SmartSolarMicrogrid`)
- **Android Studio**: Iguana / Jellyfish or later with Android SDK 34

---

### Step 1: Running the C# Backend Web API
```bash
cd backend/SmartSolarApi
dotnet run -c Release
```
- API Base URL: `http://localhost:5000`
- Swagger UI Documentation: `http://localhost:5000/swagger`
- Automated Seeding: On first startup, `DbSeeder.cs` provisions test accounts and Sri Lankan microgrid stations.

**Pre-seeded Test Credentials**:
- **Backoffice Admin**: `admin@smartsolar.com` / `Admin@123` (NIC: `198512345678`)
- **Grid Operator**: `operator@smartsolar.com` / `Operator@123` (NIC: `199087654321`)
- **Active Prosumer**: `kamal@solar.lk` / `Kamal@123` (NIC: `199512345678`)
- **Pending Prosumer**: `nimal@solar.lk` / `Nimal@123` (NIC: `199623456789`)

---

### Step 2: Running the React Web Client
```bash
cd frontend/smart-solar-web
npm install
npm run dev
```
- Access at: `http://localhost:5173`
- Pre-configured with demo quick-login buttons for instant testing.

---

### Step 3: Running the Pure Native Android App
1. Open Android Studio.
2. Select **Open an Existing Project** and navigate to `android/SmartSolarMobile`.
3. Allow Gradle to sync dependencies.
4. Launch an Android Emulator (API 24 to 34).
5. The app connects to the central API via `http://10.0.2.2:5000/api/`.

---

## 2. Directory Structure
```
d:\EAD\
├── backend/
│   └── SmartSolarApi/          # Central C# ASP.NET Core FAT Web API
│       ├── Controllers/        # REST Endpoints
│       ├── Services/           # Business Rule Implementation
│       ├── Models/             # MongoDB Entity Definitions
│       ├── DTOs/               # Data Transfer Objects
│       └── Data/               # MongoDbContext & DbSeeder
├── frontend/
│   └── smart-solar-web/        # React 18 + Bootstrap 5 Administrative Web Portal
│       ├── src/pages/backoffice/
│       ├── src/pages/operator/
│       └── src/services/api.js
├── android/
│   └── SmartSolarMobile/       # Pure Native Java Android Client
│       └── app/src/main/
│           ├── java/.../data/  # SQLite DatabaseHelper & SessionManager
│           ├── java/.../ui/    # Prosumer & Operator Activities
│           └── res/layout/     # XML Activity & Component Layouts
└── documentation/
    └── PROJECT_REPORT.md       # Comprehensive Project Architecture & Specification
```