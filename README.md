# IronTrack – Clothes Ironing Tracker

Offline-first Android app to track clothes given for ironing: categories, entries, return tracking, and payments. Built with React, Vite, TypeScript, Tailwind CSS, Capacitor 7, and SQLite.

## Tech stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind CSS, Lucide React, React Router v7
- **Mobile:** Capacitor 7+, Android
- **Database:** @capacitor-community/sqlite (SQLite on device; no IndexedDB/LocalStorage)
- **Camera:** @capacitor/camera (group + individual photos)

## Project setup and install

```bash
# Install dependencies
npm install

# Optional: copy SQLite WASM for web dev (plugin uses jeep-sqlite on web)
# mkdir -p public/assets && cp node_modules/sql.js/dist/sql-wasm.wasm public/assets/

# Build web assets
npm run build

# Initialize Capacitor (if not already)
npx cap init "IronTrack" "com.irontrack.app" --web-dir dist

# Add Android platform
npx cap add android

# Sync web build to native
npx cap sync
```

## Android SDK required for `cap run android`

The error **"No valid Android SDK root found"** means the Android SDK is not installed or not visible to Capacitor. Fix it before running `npx cap run android`.

### Option A: Install Android Studio (recommended)

1. Download and install [Android Studio](https://developer.android.com/studio).
2. Open Android Studio → **More Actions** or **Configure** → **SDK Manager**.
3. Ensure **Android SDK** is installed and note the **Android SDK Location** (e.g. `C:\Users\<You>\AppData\Local\Android\Sdk`).
4. Set environment variables (Windows):
   - **ANDROID_HOME** = that SDK path (e.g. `C:\Users\<You>\AppData\Local\Android\Sdk`).
   - **ANDROID_SDK_ROOT** = same path (optional but some tools use it).
   - Add to **Path**: `%ANDROID_HOME%\platform-tools` and `%ANDROID_HOME%\tools` (if present).
5. Restart the terminal (or IDE) so the new variables are picked up.

### Option B: Command-line tools only

1. Install [Android command-line tools](https://developer.android.com/studio#command-tools).
2. Set **ANDROID_HOME** (and optionally **ANDROID_SDK_ROOT**) to the folder that contains `platform-tools` and `platforms`.
3. Restart the terminal.

### Verify

```bash
# Windows (PowerShell)
echo $env:ANDROID_HOME

# Should print your SDK path. Then:
npx cap run android
```

If you only want to build an APK without running from the CLI, you can skip `cap run android` and open the `android/` folder in Android Studio, then use **Run** or **Build → Build APK(s)** there (Android Studio will use its own SDK).

## "Waiting for target devices to come online" in Android Studio

This means **no device or emulator is available** for Run. You need either a **physical Android device** or an **Android Virtual Device (AVD)**.

### Option 1: Use an emulator (AVD)

1. In Android Studio: **Tools → Device Manager** (or **View → Tool Windows → Device Manager**).
2. Click **Create Device**.
3. Pick a phone (e.g. **Pixel 6**), click **Next**.
4. Select a **system image** (e.g. **API 34**). If it says "Download" next to it, click to download first, then **Next**.
5. Name the AVD and click **Finish**.
6. In Device Manager, click the **Play** button next to your AVD to start the emulator. Wait until the virtual phone is fully booted.
7. In the toolbar, choose this emulator from the device dropdown (instead of "No devices").
8. Click **Run** again. The app should install and open on the emulator.

### Option 2: Use a physical Android phone

1. On the phone: **Settings → About phone** → tap **Build number** 7 times to enable Developer options.
2. **Settings → Developer options** → turn on **USB debugging**.
3. Connect the phone with a USB cable.
4. On the phone, if prompted **Allow USB debugging?**, tap **Allow**.
5. In Android Studio’s device dropdown (top toolbar), your phone should appear. Select it and click **Run**.

If the phone does not appear, install USB drivers for your device (manufacturer’s site or [Google USB driver](https://developer.android.com/studio/run/win-usb)) and try another cable or USB port.

## Development

- **Web:** `npm run dev`
- **Android:** `npm run build && npx cap sync && npx cap run android` (requires Android SDK; see above)

## Build and installation

### Generate APK and install on your phone

**Step 1 – Build the web app and sync to Android**

```bash
npm run build
npx cap sync
```

**Step 2 – Build the APK**

- **In Android Studio:** Open the `android/` folder → **Build → Build Bundle(s) / APK(s) → Build APK(s)**. When it finishes, click **Locate** in the notification to open the folder, or ignore and go to the path below.
- **From command line:** `cd android` then run `gradlew.bat assembleDebug` (Windows) or `./gradlew assembleDebug` (Mac/Linux).

The debug APK will be at:

`android/app/build/outputs/apk/debug/app-debug.apk`

**Step 3 – Install on your phone**

**Option A – USB (phone connected to PC)**

1. Enable **USB debugging** on the phone (Settings → Developer options).
2. Connect the phone with a USB cable.
3. Run: `cd android && adb install app/build/outputs/apk/debug/app-debug.apk`  
   (Or from project root: `adb install android/app/build/outputs/apk/debug/app-debug.apk`)

**Option B – Copy APK to phone and install**

1. Copy `app-debug.apk` to your phone (USB file transfer, Google Drive, email, etc.).
2. On the phone, open **Settings → Security** (or **Apps**) and allow **Install from unknown sources** (or **Install unknown apps** for the file manager / browser you use).
3. Open the APK file on the phone (Files app or Downloads) and tap it → **Install**.

### Debug APK (short version)

1. `npm run build` then `npx cap sync`
2. Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
   Or CLI: `cd android && ./gradlew assembleDebug` (Mac/Linux) or `gradlew.bat assembleDebug` (Windows)
3. APK path: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release build

1. Configure signing in `android/app/build.gradle` (signingConfigs with your keystore).
2. `npm run build && npx cap sync`
3. **Build → Generate Signed Bundle / APK** in Android Studio, or `./gradlew assembleRelease`.

## Play Store readiness checklist

- [ ] Set unique `appId` in `capacitor.config.ts` (e.g. `com.irontrack.app`)
- [ ] Set `version` and `versionCode` in `android/app/build.gradle`
- [ ] Add adaptive app icon and splash screen (Capacitor resources or Android drawable)
- [ ] Set `minSdkVersion` (e.g. 24) and `targetSdkVersion` (e.g. 34) in `variables.gradle` / `build.gradle`
- [ ] Declare only required permissions in `AndroidManifest.xml` (camera/photos if used)
- [ ] Test on a real device: DB, camera, photos, return flows, offline
- [ ] If using SQLCipher (via @capacitor-community/sqlite): ensure encryption export compliance if required

## Folder structure

```
src/
  components/   # Card, Button, Badge, FAB, PhotoThumbnail, AppLayout
  screens/      # Dashboard, EntryDetail, AddEntry, CategoryManagement
  services/     # database.ts, camera.ts
  hooks/        # useDatabase, useCategories, useEntries, useEntryDetail
  models/       # types
  utils/        # format, constants
```

## License

Private / use as needed.
