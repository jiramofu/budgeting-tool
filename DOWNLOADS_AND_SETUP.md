# Downloads & Setup Guide - Budget App Android

**Goal**: Get your computer set up to build and test the Budget App Android APK

---

## 📥 **WHAT TO DOWNLOAD**

### **1️⃣ Android Studio** (Required)
**What it is**: IDE for building Android apps  
**Size**: ~900 MB - 2 GB  
**Download**: https://developer.android.com/studio

**Steps**:
1. Click **Download Android Studio**
2. Accept terms and download
3. Run installer
4. Choose installation path (default is fine)
5. Let it install JDK, Android SDK, etc.
6. **Total install time**: 15-30 minutes

**Verify Installation**:
- Launch Android Studio
- You should see the welcome screen
- Click "Next" at any prompts

---

### **2️⃣ Android SDK Components** (via Android Studio)
**What it is**: Development kits for Android  
**Downloaded via**: Android Studio automatically

**Steps**:
1. Open Android Studio
2. Tools → SDK Manager
3. Verify these are installed:
   - ✅ Android API 34
   - ✅ Android SDK Build Tools 34.0.0
   - ✅ Android SDK Platform Tools
4. If missing, click checkbox and "Apply"
5. **Total install time**: 10-15 minutes

---

### **3️⃣ Git** (Optional but Recommended)
**What it is**: Version control to clone the project  
**Size**: ~50 MB  
**Download**: https://git-scm.com/download/win

**Steps**:
1. Download Git for Windows
2. Run installer
3. Accept all defaults
4. **Total install time**: 5 minutes

**Alternative**: Clone via GitHub Desktop instead  
**Download**: https://desktop.github.com

---

## 🔧 **INSTALLATION CHECKLIST**

### **Step 1: Install Android Studio**

```
1. Download from: https://developer.android.com/studio
2. Run installer: Android-Studio-*.exe
3. Click through installation wizard
4. Accept defaults (or customize path)
5. Wait for installation (15-30 min)
6. Launch Android Studio
7. Wait for first-time setup (5-10 min)
```

**After Installation**:
- Android Studio should open
- You'll see "Welcome to Android Studio"
- Close any welcome dialogs

### **Step 2: Install Android SDK**

```
1. In Android Studio: Tools → SDK Manager
2. Check these are installed:
   ✅ Android 14 (API 34)
   ✅ Android SDK Build Tools 34.0.0
   ✅ Android SDK Platform Tools
3. If not installed, select them and click "Apply"
4. Wait for download/installation (5-15 min)
5. Click "OK" when done
```

### **Step 3: Clone the Project**

**Option A: Via Git Command Line**

```bash
# Open Command Prompt or PowerShell
git clone https://github.com/jiramofu/budgeting-tool.git
cd budgeting-tool/budgeting-android
```

**Option B: Via GitHub Desktop**

```
1. Download from: https://desktop.github.com
2. Run installer
3. Sign in with GitHub account (or create one free)
4. Click File → Clone Repository
5. Enter: jiramofu/budgeting-tool
6. Click Clone
7. Navigate to: budgeting-tool/budgeting-android folder
```

**Option C: Download as ZIP**

```
1. Go to: https://github.com/jiramofu/budgeting-tool
2. Click Code → Download ZIP
3. Extract to: C:\Users\YourName\Downloads\budgeting-tool-main
4. Navigate to: budgeting-tool-main/budgeting-android
```

---

## 🚀 **QUICK START AFTER INSTALLATION**

### **Step 1: Open Project in Android Studio**

```
1. Open Android Studio
2. File → Open
3. Navigate to: C:\...\budgeting-tool\budgeting-android
4. Click OK
5. Wait for "Gradle Sync" (you'll see a message at bottom)
   - Should show: "Gradle sync finished successfully"
   - If not: Click "Sync Now" when prompted
6. Wait 2-5 minutes for first sync
```

### **Step 2: Build the APK**

```
1. Top menu: Build → Build Bundle(s)/APK(s) → Build APK(s)
2. Wait for notification: "Build successful"
3. You'll see: "Locate" button
4. Click "Locate" to find the APK file
```

### **Step 3: Test on Device**

```
1. Connect Android phone via USB cable
2. On phone: Settings → Developer Options → USB Debugging (ON)
3. On phone: Accept the USB permission dialog
4. In Android Studio: Run → Select Device
5. Choose your connected phone
6. Click "Run" button (▶️)
7. Wait for app to install and launch
```

---

## ✅ **VERIFICATION CHECKLIST**

After installation, verify everything works:

### **Verify Android Studio**
- [ ] Android Studio opens
- [ ] No error messages
- [ ] SDK Manager shows API 34 installed

### **Verify Project Opens**
- [ ] Open C:\...\budgeting-tool\budgeting-android
- [ ] Project loads in Android Studio
- [ ] "Gradle sync finished successfully"
- [ ] No red error icons in file tree

### **Verify Build Works**
- [ ] Build → Build APK(s)
- [ ] See "Build successful" notification
- [ ] APK file exists at: app/build/outputs/apk/release/

### **Verify Device Connection**
- [ ] Phone connected via USB
- [ ] USB Debugging enabled
- [ ] "adb devices" shows phone (if using command line)
- [ ] Android Studio Run menu shows device

---

## 💾 **DOWNLOAD LINKS SUMMARY**

| Item | Link | Size | Time |
|------|------|------|------|
| **Android Studio** | https://developer.android.com/studio | 2 GB | 30 min |
| **Git** (optional) | https://git-scm.com/download/win | 50 MB | 5 min |
| **GitHub Desktop** (optional) | https://desktop.github.com | 120 MB | 5 min |
| **Budget App Code** | https://github.com/jiramofu/budgeting-tool | - | 5 min |

**Total Setup Time**: 45-60 minutes

---

## 🖥️ **SYSTEM REQUIREMENTS**

### **Minimum**
- Windows 10 or later
- 8 GB RAM
- 10 GB disk space
- Internet connection

### **Recommended**
- Windows 11
- 16 GB RAM
- 20 GB disk space
- SSD (faster builds)

---

## 📱 **DEVICE REQUIREMENTS FOR TESTING**

### **Physical Phone**
- Android 8.0 or later
- USB cable (for computer connection)
- USB Debugging enabled in developer options
- At least 100 MB free storage

### **Or: Use Android Emulator** (built into Android Studio)
- No physical phone needed
- Runs on your computer
- Available after Android Studio installation

---

## 🔄 **STEP-BY-STEP WALKTHROUGH**

### **5-Minute Express Setup**

1. **Download Android Studio** (1 min)
   - https://developer.android.com/studio
   - Run installer

2. **Let Android Studio install SDK** (20 min)
   - Follow on-screen prompts
   - Let it finish completely

3. **Clone the Project** (2 min)
   ```bash
   git clone https://github.com/jiramofu/budgeting-tool.git
   ```

4. **Open in Android Studio** (1 min)
   - File → Open → budgeting-tool/budgeting-android
   - Wait for Gradle sync

5. **Build** (2-5 min)
   - Build → Build APK(s)
   - Done!

---

## ❓ **COMMON QUESTIONS**

### **Q: Do I need to pay for anything?**
**A**: No! Android Studio and all tools are free.

### **Q: Can I use a Mac or Linux?**
**A**: Yes! Download Android Studio for your OS instead of Windows version.

### **Q: Do I need to install Git?**
**A**: No, but it makes cloning easier. You can download the ZIP file instead.

### **Q: What if I don't have a real Android phone?**
**A**: Use the Android Emulator that comes with Android Studio. Works great for testing!

### **Q: How much disk space do I need?**
**A**: ~20 GB is safe. Android Studio: 5 GB, SDK: 10 GB, project: <1 GB.

### **Q: How long does the first build take?**
**A**: First build: 5-10 minutes. Subsequent builds: 2-3 minutes.

---

## 🆘 **IF SOMETHING GOES WRONG**

### **Android Studio Won't Install**
- Try reinstalling with admin rights
- Check you have 10+ GB disk space
- Close other large applications

### **Project Won't Open**
- Android Studio → Tools → SDK Manager
- Install API 34 if missing
- File → Invalidate Caches → Restart

### **Build Fails**
- Build → Clean Project
- File → Invalidate Caches → Restart
- Build again

### **Can't Find Device**
- Check USB cable is working
- Enable USB Debugging on phone
- Disconnect and reconnect phone

---

## 📞 **STILL NEED HELP?**

After installation, read:
- `QUICK_BUILD_GUIDE.md` - 5-minute guide
- `BUILD_INSTRUCTIONS.md` - Detailed instructions

Both are in the budgeting-android folder.

---

## ✨ **YOU'RE READY TO START!**

Once you have Android Studio installed, you can:

1. ✅ Clone the project
2. ✅ Build the APK
3. ✅ Test on your phone
4. ✅ Submit to Google Play

**Everything else is ready for you!** 🚀

---

**Next**: Download Android Studio, install it, and follow the Quick Start section above.

