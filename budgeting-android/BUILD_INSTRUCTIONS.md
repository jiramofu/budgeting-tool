# Build Instructions - Budget App Android

This document provides detailed instructions for building, signing, and releasing the Budget App for Android.

---

## Prerequisites

### Required Software
- **Android Studio** 2022.3+ (Electric Eel recommended)
- **JDK 17** or higher
- **Android SDK** API 34 (installed via Android Studio)
- **Gradle** 8.0+ (included with Android Studio)
- **Git** for version control
- **GitHub CLI** (optional, for GitHub release creation)

### System Requirements
- **OS**: Windows, macOS, or Linux
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 10GB for Android SDK and build cache
- **Internet**: Required for dependency download

### Skills Assumed
- Familiarity with Android development
- Git command-line basics
- Understanding of signing APKs/AABs

---

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/jiramofu/budgeting-tool.git
cd budgeting-tool/budgeting-android
```

### 2. Open in Android Studio

```bash
# Using Android Studio
# File → Open → Select budgeting-android directory
```

Or open directly:
```bash
cd budgeting-android
studio .
```

### 3. Verify Build Tools

```bash
# In Android Studio
# SDK Manager → Android SDK
# Verify: API 34 (Android 14) is installed
# Verify: Build Tools 34.0.0+ is installed
```

### 4. Sync Gradle

```bash
# Android Studio will prompt to sync Gradle on open
# Or manually:
./gradlew clean
```

---

## Debug Build

### Build Debug APK

```bash
cd budgeting-android

# Build debug APK
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

### Install Debug APK

```bash
# Option 1: Via ADB
adb install app/build/outputs/apk/debug/app-debug.apk

# Option 2: Via Android Studio
# Build → Build Bundle(s)/APK(s) → Build APK(s)
# Then click "Install" in the Build panel

# Option 3: Drag and drop into emulator
```

### Test Debug Build

```bash
# Run tests
./gradlew testDebugUnitTest

# Check lint
./gradlew lintDebug

# Run connected device tests
./gradlew connectedAndroidTest
```

---

## Release Build

### 1. Create Signing Key (First Time Only)

```bash
# Generate keystore
keytool -genkey -v -keystore budgetapp.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias budgetapp

# Follow prompts to set:
# - Key password (ANDROID_KEY_PASSWORD)
# - Store password (ANDROID_STORE_PASSWORD)
# - Certificate details

# Store the keystore file securely
# Location: budgeting-android/budgetapp.jks (or external location)
```

### 2. Configure Signing (Environment Variables)

```bash
# Linux/macOS
export ANDROID_KEY_ALIAS="budgetapp"
export ANDROID_KEY_PASSWORD="your_key_password"
export ANDROID_STORE_PASSWORD="your_store_password"
export ANDROID_KEYSTORE_PATH="/path/to/budgetapp.jks"

# Windows (PowerShell)
$env:ANDROID_KEY_ALIAS="budgetapp"
$env:ANDROID_KEY_PASSWORD="your_key_password"
$env:ANDROID_STORE_PASSWORD="your_store_password"
$env:ANDROID_KEYSTORE_PATH="C:\path\to\budgetapp.jks"

# Windows (Command Prompt)
set ANDROID_KEY_ALIAS=budgetapp
set ANDROID_KEY_PASSWORD=your_key_password
set ANDROID_STORE_PASSWORD=your_store_password
set ANDROID_KEYSTORE_PATH=C:\path\to\budgetapp.jks
```

### 3. Build Release APK

```bash
cd budgeting-android

# Clean build
./gradlew clean

# Build signed APK
./gradlew assembleRelease

# Output: app/build/outputs/apk/release/app-release.apk
```

### 4. Build Release App Bundle (AAB)

```bash
cd budgeting-android

# Build App Bundle (recommended for Google Play)
./gradlew bundleRelease

# Output: app/build/outputs/bundle/release/app-release.aab
```

### 5. Verify APK/AAB

```bash
# Check APK signature
jarsigner -verify -certs -verbose app/build/outputs/apk/release/app-release.apk

# Check file size
ls -lh app/build/outputs/apk/release/app-release.apk
ls -lh app/build/outputs/bundle/release/app-release.aab

# Expected sizes:
# APK: ~8-10 MB
# AAB: ~7-9 MB
```

---

## Google Play Submission

### Prerequisites
- Google Play Developer Account ($25 one-time fee)
- Valid payment method
- Budget App name reserved on Play Store

### Submission Steps

1. **Create Play Store Listing**
   - Go to [Google Play Console](https://play.console.google.com)
   - Create new app
   - Fill in app details

2. **Upload APK/AAB**
   - Select release/production track
   - Upload app-release.aab
   - Set version code to 1

3. **Add App Information**
   - App name: "Budget App"
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Category: Finance
   - Content rating questionnaire

4. **Add Screenshots**
   - 4-8 phone screenshots (required)
   - 7-20 characters max
   - Show key features: auth, dashboard, budgets, analytics

5. **Pricing & Distribution**
   - Select countries
   - Set as free app
   - Content rating

6. **Review & Release**
   - Review all information
   - Accept Play Store policies
   - Submit for review (1-3 days)
   - Release to production (after approval)

### Beta Testing (Recommended)

Before full release, run beta testing:

1. **Create Beta Track**
   - Upload to Internal/Alpha/Beta track
   - Add internal testing email

2. **Generate Link**
   - Copy testing link
   - Share with testers

3. **Collect Feedback**
   - Test on real devices
   - Check crash reports
   - Fix critical issues

4. **Promote to Production**
   - After 1-2 weeks of beta testing
   - Address feedback
   - Promote to production track

---

## CI/CD with GitHub Actions

### Setup GitHub Secrets

1. Go to Repository Settings
2. Select Secrets and Variables → Actions
3. Add secrets:
   - `ANDROID_KEY_ALIAS`: budgetapp
   - `ANDROID_KEY_PASSWORD`: your_password
   - `ANDROID_STORE_PASSWORD`: your_password
   - `ANDROID_KEYSTORE_PATH`: path/to/budgetapp.jks
   - `PLAY_STORE_CREDENTIALS`: JSON from Google Play

### Create Release Tag

```bash
# Tag for automatic CI/CD build
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions workflow will:
# 1. Build APK and AAB
# 2. Run tests
# 3. Create GitHub release
# 4. Upload artifacts
```

### Monitor Build

1. Go to GitHub repository
2. Select Actions tab
3. Watch "Android Release Build" workflow
4. Check build logs if needed

---

## Advanced Configuration

### Custom Build Variants

```bash
# Build with custom environment
./gradlew assembleRelease \
  -PAPI_BASE_URL="https://api.budget-app.com"
```

### Proguard Configuration

Edit `app/proguard-rules.pro` to customize:
- Classes to keep
- Optimization passes (default: 5)
- Code obfuscation rules

### Version Management

Update version in `app/build.gradle.kts`:

```kotlin
defaultConfig {
    versionCode = 2  // Increment for each release
    versionName = "1.0.1"  // Semantic versioning
}
```

---

## Troubleshooting

### Build Fails

```bash
# Clean and rebuild
./gradlew clean
./gradlew assembleRelease

# Check Java version
java -version  # Should be 17+

# Check Gradle version
./gradlew --version
```

### Signing Issues

```bash
# Verify keystore
keytool -list -v -keystore budgetapp.jks

# Test signing
jarsigner -verify app/build/outputs/apk/release/app-release.apk

# Common error: "Keystore was tampered with"
# → Use correct keystore password
```

### Gradle Cache Issues

```bash
# Clear Gradle cache
./gradlew clean
rm -rf .gradle
./gradlew clean build
```

### Memory Issues

```bash
# Increase heap size
export GRADLE_OPTS="-Xmx4096m"
./gradlew assembleRelease
```

### Test Failures

```bash
# Run specific test
./gradlew testDebugUnitTest --tests com.budgetapp.AuthViewModelTest

# Run with verbose output
./gradlew testDebugUnitTest -i
```

---

## Release Checklist

Before each release:

- [ ] Update version in build.gradle.kts
- [ ] Update CHANGELOG.md
- [ ] Update RELEASE_NOTES.md
- [ ] Run all tests: `./gradlew testDebugUnitTest`
- [ ] Run lint checks: `./gradlew lint`
- [ ] Build release APK/AAB
- [ ] Verify signing: `jarsigner -verify ...`
- [ ] Test APK on device/emulator
- [ ] Create git tag: `git tag v1.0.x`
- [ ] Push to GitHub: `git push origin v1.0.x`
- [ ] Create GitHub release
- [ ] Upload to Google Play
- [ ] Monitor crashes/feedback

---

## Performance Optimization

### APK Size Reduction

```bash
# Current: ~8-10 MB (optimized)

# Analyze size
./gradlew analyzeReleaseBundle

# Review build/outputs/bundle_report/
```

### Build Time Optimization

```bash
# Parallel gradle tasks
export GRADLE_OPTS="-Dorg.gradle.parallel=true"

# Daemon mode
./gradlew --daemon

# Incremental compilation
./gradlew --build-cache
```

---

## Security Best Practices

### Keystore Management

- ✅ Store keystore file securely (not in repo)
- ✅ Use strong passwords (12+ characters)
- ✅ Back up keystore in secure location
- ✅ Never commit keystore to git
- ✅ Use GitHub Secrets for CI/CD

### Code Security

- ✅ ProGuard enabled for release
- ✅ No hardcoded secrets
- ✅ API keys in environment variables
- ✅ HTTPS for all API calls

### Release Security

- ✅ Sign APK/AAB with release keystore
- ✅ Enable code obfuscation
- ✅ Shrink unused resources
- ✅ Test on real devices
- ✅ Monitor crash reports

---

## Additional Resources

- [Android Developers - Build Your App](https://developer.android.com/studio/build)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [Signing Apps Guide](https://developer.android.com/studio/publish/app-signing)
- [ProGuard Manual](https://www.guardsquare.com/manual/home)
- [Gradle Documentation](https://docs.gradle.org/)

---

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review GitHub Issues
3. Contact: support@budgetapp.com

---

**Last Updated**: May 29, 2026
**Version**: 1.0.0
**Status**: Production Ready

