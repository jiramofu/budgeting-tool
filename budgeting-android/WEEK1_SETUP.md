# Week 1: Foundation & Auth - Android Project Setup

**Status**: Initial project scaffold complete ✅
**Date**: May 29, 2026
**Focus**: Build foundation for Jetpack Compose app with MVVM architecture

## Completed Tasks ✅

### 1. Project Structure & Gradle Configuration
- [x] Created `build.gradle.kts` (project-level) with plugin configurations
- [x] Created `settings.gradle.kts` with Maven repositories (Google, Maven Central, JitPack)
- [x] Created `app/build.gradle.kts` with all core dependencies:
  - Jetpack Compose 1.5.4 (Material 3)
  - Retrofit 2 + OkHttp for networking
  - Room 2.5.2 for local database
  - DataStore 1.0.0 for encrypted settings
  - Hilt 2.47 for dependency injection
  - Coroutines + Flow for async/state management
  - Timber for logging
  - MPAndroidChart for charts

### 2. Android Manifest
- [x] Created `AndroidManifest.xml` with:
  - INTERNET and ACCESS_NETWORK_STATE permissions
  - Application class (HiltAndroidApp)
  - MainActivity as launcher activity

### 3. Design System (Material Design 3)
- [x] Created `Color.kt` with:
  - Light mode colors (from web: blue, amber, emerald, red, slate)
  - Dark mode colors (adjusted for Material 3 dark theme)
  - Status colors (success green, warning amber, danger red, info blue)
  - Neutral/slate colors for backgrounds and borders
  
- [x] Created `Theme.kt` with:
  - Material 3 light/dark color schemes
  - Theme composition function with status bar color management
  - Dark theme system preference detection

- [x] Created `Type.kt` with:
  - Material 3 typography scale
  - Inter font family (with system fallback)
  - All text styles (display, headline, title, body, label)

### 4. Application Class
- [x] Created `BudgetApp.kt`:
  - Hilt-enabled Application class
  - Timber logging initialization
  - Debug tree for development logging

### 5. Dependency Injection (Hilt)
- [x] Created `NetworkModule.kt` with:
  - DataStore provision (encrypted preferences)
  - Json serializer (kotlinx.serialization)
  - OkHttpClient with auth interceptor and logging
  - Retrofit instance configuration
  - API service provision (AuthApi, BudgetApi, TransactionApi)
  - Base URL configuration (emulator vs. production)

### 6. Network Infrastructure
- [x] Created `AuthInterceptor.kt`:
  - Automatic JWT token injection from DataStore
  - 401 response handling (token clearing)
  - Token storage/retrieval logic
  - Error logging via Timber

### 7. API Service Definitions
- [x] Created `AuthApi.kt`:
  - Login request/response DTOs
  - Signup request/response DTOs
  - User response model
  - Login and signup endpoints

- [x] Created `BudgetApi.kt`:
  - Budget response DTOs
  - Category response models
  - Create/update budget request models
  - Endpoints: get budgets, get current, get categories, CRUD operations

- [x] Created `TransactionApi.kt`:
  - Transaction response DTOs
  - Create/update transaction request models
  - Endpoints: list, filter by date/category, CRUD operations

### 8. Documentation
- [x] Created `README.md`:
  - Project structure overview
  - Tech stack summary
  - Setup instructions
  - Architecture explanation
  - Development timeline
  - Testing guidelines

## Project Structure

```
budgeting-android/
├── app/
│   ├── src/main/
│   │   ├── kotlin/com/budgetapp/
│   │   │   ├── di/NetworkModule.kt
│   │   │   ├── data/
│   │   │   │   ├── remote/
│   │   │   │   │   ├── api/
│   │   │   │   │   │   ├── AuthApi.kt
│   │   │   │   │   │   ├── BudgetApi.kt
│   │   │   │   │   │   └── TransactionApi.kt
│   │   │   │   │   └── interceptor/AuthInterceptor.kt
│   │   │   │   ├── local/        [To be created]
│   │   │   │   └── repositories/ [To be created]
│   │   │   ├── presentation/
│   │   │   │   ├── ui/theme/
│   │   │   │   │   ├── Color.kt
│   │   │   │   │   ├── Theme.kt
│   │   │   │   │   └── Type.kt
│   │   │   │   ├── screens/      [To be created - Week 1]
│   │   │   │   └── viewmodel/    [To be created - Week 1]
│   │   │   ├── domain/
│   │   │   │   ├── models/       [To be created]
│   │   │   │   └── repositories/ [To be created]
│   │   │   └── BudgetApp.kt
│   │   └── AndroidManifest.xml
│   └── build.gradle.kts
├── build.gradle.kts
├── settings.gradle.kts
├── README.md
└── WEEK1_SETUP.md
```

## Technical Highlights

### Authentication Flow (Planned)
1. User enters email/password on LoginScreen
2. AuthApi.login() called via Retrofit
3. Backend returns JWT token + user data
4. Token stored in encrypted DataStore
5. AuthInterceptor auto-injects token in all requests
6. 401 response triggers logout

### Material Design 3 Color Mapping
- Web Primary (#2563eb) → Compose Primary (#2563eb light, #60a5fa dark)
- Web Secondary (Amber #f59e0b) → Compose Secondary (#f59e0b light, #fbbf24 dark)
- Web Tertiary (Emerald #16a34a) → Compose Tertiary (#16a34a light, #4ade80 dark)
- Status colors match web design (success, warning, danger, info)

### Dependency Injection
- Hilt manages all singletons: OkHttpClient, Retrofit, APIs, DataStore
- AuthInterceptor injected into OkHttpClient
- All APIs provided as singletons from Retrofit instance

## Next Steps (Week 1)

### Immediate (This session)
- [ ] Create Room database schema (transactions, budgets, categories, users)
- [ ] Create domain models (Transaction, Budget, Category, UserSettings)
- [ ] Create repository implementations (offline-first pattern)
- [ ] Build AuthViewModel (login/signup logic)
- [ ] Build LoginScreen composable

### This Week (Parallel)
- [ ] DashboardScreen with budget summary and metrics
- [ ] Complete authentication flow end-to-end
- [ ] Test login with real backend
- [ ] Settings storage for theme/currency persistence

## Build & Run (When Ready)

```bash
cd budgeting-android

# Build the project
./gradlew build

# Install debug APK on emulator
./gradlew installDebug

# Run the app (if emulator is running)
adb shell am start -n com.budgetapp.debug/com.budgetapp.MainActivity
```

## API Configuration

**Emulator**: `http://10.0.2.2:3001/api/` (Android bridge to localhost)
**Real Device**: Update base URL in `NetworkModule.getApiBaseUrl()`

## Testing Checklist

Before moving to Week 2:
- [ ] Project builds without errors
- [ ] Can launch app on emulator
- [ ] Material 3 theme applies correctly (light/dark)
- [ ] Gradle dependency tree is clean
- [ ] Hilt generates code without errors

## Notes

- All API DTOs use `@Serializable` for kotlinx.serialization
- Decimal fields use Double for currency amounts
- Dates use ISO 8601 format strings (transactionDate)
- CategoryId is Int (matches backend schema)
- All DateTime fields are UTC strings (created_at)

## Dependencies Summary

| Purpose | Library | Version |
|---------|---------|---------|
| UI | Jetpack Compose | 1.5.4 |
| Design | Material 3 | 1.1.2 |
| HTTP | Retrofit | 2.9.0 |
| Serialization | kotlinx-serialization | 1.5.1 |
| Local DB | Room | 2.5.2 |
| Settings | DataStore | 1.0.0 |
| DI | Hilt | 2.47 |
| Async | Coroutines | 1.7.3 |
| Logging | Timber | 5.0.1 |
| Charts | MPAndroidChart | v3.1.0 |

---

**Status**: Ready for Week 1 core features (Auth, Dashboard)
**Next Session**: Build LoginScreen, AuthViewModel, DashboardScreen
