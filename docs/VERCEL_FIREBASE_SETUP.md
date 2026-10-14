# Vercel Deployment & Firebase Phone Authentication Setup

## Root Cause Analysis: "Unexpected token 'T', ... is not valid JSON"

When deploying a Vite frontend to Vercel, Vercel by default only builds the static assets in `dist/`. When the frontend performed:
```ts
fetch('/api/auth/send-otp', ...)
```
1. Vercel had no serverless function route configured for `/api/*`.
2. As a result, Vercel returned a default 404 text page beginning with **"The page could not be found..."** (or HTML).
3. The client-side code called `await res.json()` directly on that text response without inspecting the response `Content-Type` header or `res.ok`.
4. The JavaScript JSON parser encountered the initial letter **'T'** from *"The page..."* and threw:
   `SyntaxError: Unexpected token 'T', "The page co"... is not valid JSON`.

---

## What Was Fixed in the Codebase

1. **Vercel Serverless API Route (`api/index.ts` & `vercel.json`)**:
   - Added `api/index.ts` exporting the Express app as a Vercel Serverless Function.
   - Configured `vercel.json` rewrites so all `/api/*` traffic automatically routes to the serverless function on Vercel.
   - Added fallback 404 and error middlewares on Express that guarantee **`Content-Type: application/json`** and valid JSON responses even for unknown endpoints.

2. **Safe Client-Side Response Handling (`src/utils/api.ts`)**:
   - Updated `request<T>()` to check `res.headers.get('content-type')`.
   - If a non-JSON response (e.g. 404 HTML or Vercel gateway error) is ever returned, it strips HTML tags, formats a clean diagnostic message, and prevents cryptic JSON parsing crashes.

3. **Firebase Web SDK Phone Authentication (`src/utils/firebase.ts` & `AuthModal.tsx`)**:
   - Integrated the modern Firebase Web SDK (`firebase/auth`).
   - Implemented `RecaptchaVerifier` with invisible reCAPTCHA container.
   - Implemented `sendFirebasePhoneOtp` and `confirmFirebasePhoneOtp` to deliver real SMS OTP codes to user phones.
   - Connected verified credentials to `/api/auth/firebase-login` to credit the **100 Welcome Bonus points**, attach referral codes, and initialize the wallet transaction ledger.
   - Maintained automatic fallback to backend Sandbox OTP if Firebase environment variables are not yet populated.

4. **Production Anti-Cheat & Strict OTP Enforcement**:
   - In production (`process.env.NODE_ENV === 'production'`), mock OTP bypasses (`123456`) are strictly disabled.
   - Sandbox OTP codes are only returned in development / sandbox mode.

---

## Firebase Console Setup (One-Time)

To enable live SMS delivery on your Vercel deployment:

1. **Go to Firebase Console**:
   Visit [https://console.firebase.google.com](https://console.firebase.google.com) and open your project (or create one).

2. **Enable Phone Authentication**:
   - Navigate to **Authentication** -> **Sign-in method**.
   - Click on **Phone** under Native providers.
   - Toggle **Enable** to ON and click **Save**.

3. **Add Authorized Domains**:
   - In **Authentication** -> **Settings** -> **Authorized domains**.
   - Click **Add domain**.
   - Add your Vercel app domain (e.g., `your-app.vercel.app`).
   - (Note: `localhost` is already included by default).

4. **(Optional) Add Test Phone Numbers**:
   - In **Authentication** -> **Sign-in method** -> **Phone** -> **Phone numbers for testing**.
   - You can add numbers such as `+91 98765 43210` with test code `123456`.
   - This lets developers test the live Firebase flow without consuming your daily SMS quota.

5. **Get Your Firebase Web App Config**:
   - Go to **Project Settings** (gear icon) -> **General**.
   - Under **Your apps**, select or create a **Web App (`</>`)**.
   - Copy the configuration keys:
     - `apiKey`
     - `authDomain`
     - `projectId`
     - `storageBucket`
     - `messagingSenderId`
     - `appId`

---

## Vercel Environment Variables Setup

In your [Vercel Dashboard](https://vercel.com):
1. Open your **GameEarn Pro** project.
2. Go to **Settings** -> **Environment Variables**.
3. Add the following client-side variables (these are public identifiers for the Web SDK and must start with `VITE_`):

| Variable Name | Example Value | Description |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `gameearn-pro.firebaseapp.com` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `gameearn-pro` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `gameearn-pro.appspot.com` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | Cloud Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `1:123456789012:web:...` | Firebase Web App ID |

4. Trigger a **Redeploy** on Vercel (Deployments -> Redeploy) for the new environment variables to take effect.
