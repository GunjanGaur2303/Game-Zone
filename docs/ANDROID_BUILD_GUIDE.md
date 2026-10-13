# GameEarn Pro — Android APK / AAB Build & Packaging Guide

This guide details how to bundle **GameEarn Pro** into a production-ready Android APK (for direct sideloading or internal QA) and Android App Bundle (.AAB, for Google Play Store distribution).

---

## Architecture Selection: Capacitor vs. Trusted Web Activity (TWA)

You can package GameEarn Pro using two robust production paths:

| Architecture | Best For | Prerequisites | Output |
| :--- | :--- | :--- | :--- |
| **Capacitor (Recommended)** | Full offline game assets, native Android haptics, push notifications via FCM, local secure storage | Node.js, Android Studio / Gradle | APK & AAB |
| **Bubblewrap (TWA)** | Zero bundle bloat, always updated from Cloud Run web endpoint, Chrome Custom Tabs performance | Bubblewrap CLI, JDK 17, Web App Manifest | APK & AAB |

---

## Method 1: Building with Capacitor (Step-by-Step)

### Step 1: Install Capacitor Dependencies
Inside the project root:
```bash
npm install @capacitor/core @capacitor/android @capacitor/app @capacitor/haptics @capacitor/preferences
npm install -D @capacitor/cli
```

### Step 2: Initialize Capacitor Configuration
Run the Capacitor initializer:
```bash
npx cap init "GameEarn Pro" "com.gameearn.pro" --web-dir="dist"
```

This creates `capacitor.config.ts`:
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gameearn.pro',
  appName: 'GameEarn Pro',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false, // Disallow insecure HTTP in production
  },
  android: {
    buildOptions: {
      keystorePath: 'release-key.jks',
      keystoreAlias: 'gameearn',
    },
  },
};

export default config;
```

### Step 3: Build Web Assets & Sync to Android
```bash
npm run build
npx cap add android
npx cap sync android
```

### Step 4: Configure Android Manifest Permissions
Open `android/app/src/main/AndroidManifest.xml` and verify required permissions:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Internet & Network State for API requests -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Haptic feedback for game buttons & victory vibrations -->
    <uses-permission android:name="android.permission.VIBRATE" />

    <!-- Optional: Firebase Cloud Messaging for daily streak alerts -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="GameEarn Pro"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="false">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Step 5: Generate Production Keystore
Generate a secure Java KeyStore:
```bash
keytool -genkey -v -keystore release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias gameearn
```
*(Store `release-key.jks` and your password securely. Never commit them to Git).*

### Step 6: Build Signed Release APK & AAB
Navigate to the Android directory and run Gradle:
```bash
cd android

# To generate debug APK:
./gradlew assembleDebug

# To generate signed Release APK (sideloading/testing):
./gradlew assembleRelease

# To generate production Android App Bundle (for Google Play Store):
./gradlew bundleRelease
```
The output files will be located at:
- **APK**: `android/app/build/outputs/apk/release/app-release-unsigned.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Method 2: Building with Bubblewrap (TWA)

If hosting the backend on Google Cloud Run with an official HTTPS domain:
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest https://your-domain.com/manifest.json
bubblewrap build
```

---

## Local Testing on Android Device via ADB

1. Enable **Developer Options** and **USB Debugging** on your Android phone.
2. Connect your device via USB.
3. Install the APK:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```
