# BudgetApp - Native Android (Jetpack Compose)

A native Android implementation of the budgeting application using Jetpack Compose and Material Design 3.

## Project Structure

```
budgeting-android/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── kotlin/com/budgetapp/
│   │   │   │   ├── presentation/
│   │   │   │   │   ├── ui/
│   │   │   │   │   │   ├── screens/         # Screen composables
│   │   │   │   │   │   ├── components/      # Reusable components
│   │   │   │   │   │   └── theme/           # Material 3 theme
│   │   │   │   │   └── viewmodel/           # ViewModels
│   │   │   │   ├── domain/
│   │   │   │   │   ├── models/              # Data classes
│   │   │   │   │   └── repositories/        # Repository interfaces
│   │   │   │   ├── data/
│   │   │   │   │   ├── remote/              # Retrofit services
│   │   │   │   │   ├── local/               # Room & DataStore
│   │   │   │   │   └── repositories/        # Implementations
│   │   │   │   ├── di/                      # Hilt modules
│   │   │   │   └── BudgetApp.kt
│   │   │   └── AndroidManifest.xml
│   │   └── test/
│   │       └── java/com/budgetapp/          # Unit tests
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

## Tech Stack

- **Language**: Kotlin 1.9.10
- **UI Framework**: Jetpack Compose with Material Design 3
- **HTTP Client**: Retrofit 2 + OkHttp
- **JSON**: kotlinx.serialization
- **State Management**: MVVM + Coroutines + Flow
- **Local Storage**: Room + DataStore
- **Dependency Injection**: Hilt
- **Async**: Coroutines
- **Charts**: MPAndroidChart

## Setup Instructions

### Prerequisites
- Android Studio 2023.1+
- JDK 17+
- Android SDK 24+ (API level 24)

### Build & Run

1. **Install dependencies**:
   ```bash
   ./gradlew build
   ```

2. **Run on emulator**:
   ```bash
   ./gradlew installDebug
   ./gradlew app:run
   ```

3. **Build release APK**:
   ```bash
   ./gradlew assembleRelease
   ```

## Architecture

### MVVM + Repository Pattern

- **ViewModel**: Manages UI state and lifecycle-aware coroutines
- **Repository**: Abstracts data sources (remote API + local cache)
- **DataStore**: Persists user settings (theme, currency, language)
- **Room**: Caches transactions, budgets, categories for offline access

### Offline-First Strategy

1. Fetch from backend API
2. Cache in Room database
3. If network fails, serve from cache
4. Sync changes when back online

### Navigation

- **Bottom App Bar**: 5 tabs (Dashboard, Budgets, Transactions, Analytics, Settings)
- **Modal Screens**: Add/Edit operations overlay tabs
- **Deep Linking**: Jetpack Navigation Compose handles routing

## API Configuration

**Base URL**: `http://10.0.2.2:3001/api` (Android emulator)
**Real Device**: Configure in `AppModule` (Hilt)

### Authentication

- JWT Bearer tokens stored in encrypted DataStore
- OkHttp interceptor auto-injects tokens on all requests
- 401 responses trigger logout and navigation to login

## Development Timeline

### Week 1: Foundation & Auth
- [ ] Project setup & Gradle config
- [ ] Design system (Material 3 theme)
- [ ] Login/signup screens
- [ ] Auth API integration
- [ ] JWT token storage

### Week 2: Dashboard & Budgets
- [ ] Dashboard screen
- [ ] Budget list & CRUD
- [ ] Transaction list & CRUD
- [ ] Backend sync

### Week 3: Analytics & Reports
- [ ] Analytics screen (charts)
- [ ] Spending trends
- [ ] Category breakdown
- [ ] Reports

### Week 4: Settings & Polish
- [ ] Settings screen
- [ ] Theme toggle (light/dark)
- [ ] Currency selection
- [ ] Performance optimization

## Testing

### Unit Tests
```bash
./gradlew test
```

### Integration Tests
```bash
./gradlew connectedAndroidTest
```

### Manual Testing Checklist
- [ ] Login/signup flow
- [ ] Dashboard loads data
- [ ] Create budget
- [ ] Add transaction
- [ ] Switch theme (light/dark)
- [ ] Change currency
- [ ] Offline mode works

## Resources

- [Jetpack Compose Docs](https://developer.android.com/jetpack/compose)
- [Material Design 3](https://m3.material.io/)
- [MVVM Architecture](https://developer.android.com/jetpack/guide)
- [Hilt Documentation](https://dagger.dev/hilt/)

## Support

For questions or issues, refer to the main project documentation in the parent `budgeting-tool` directory.
