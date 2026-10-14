import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  UserCredential,
} from 'firebase/auth';

// Client-side Firebase configuration
// These values are public identifiers used by the Firebase Web SDK.
// They are safe to include in client bundles and MUST be set via VITE_FIREBASE_* in Vercel.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

/**
 * Checks whether valid Firebase client configuration is present in environment variables.
 */
export function isFirebaseAuthConfigured(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) return false;
  if (apiKey.includes('YOUR_') || apiKey.includes('your-') || apiKey.length < 15) return false;

  return true;
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseAuthConfigured()) {
    return null;
  }

  if (!appInstance) {
    appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  if (!authInstance) {
    authInstance = getAuth(appInstance);
    authInstance.useDeviceLanguage();
  }

  return authInstance;
}

/**
 * Initializes a Firebase reCAPTCHA verifier attached to a DOM container element.
 */
export function initRecaptchaVerifier(
  containerId: string,
  callbacks?: {
    onSuccess?: () => void;
    onExpired?: () => void;
  }
): RecaptchaVerifier | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        callbacks?.onSuccess?.();
      },
      'expired-callback': () => {
        callbacks?.onExpired?.();
      },
    });

    return verifier;
  } catch (err) {
    console.warn('[Firebase Auth] Failed to initialize RecaptchaVerifier:', err);
    return null;
  }
}

/**
 * Triggers Firebase Phone Authentication SMS delivery via Web SDK.
 */
export async function sendFirebasePhoneOtp(
  phoneNumber: string,
  verifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured. Please add VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.');
  }

  // Format phone to standard E.164 (e.g., +919876543210)
  const cleaned = phoneNumber.replace(/[\s-]/g, '');
  const formattedPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned.replace(/^0+/, '')}`;

  return await signInWithPhoneNumber(auth, formattedPhone, verifier);
}

/**
 * Confirms the OTP code with Firebase ConfirmationResult.
 */
export async function confirmFirebasePhoneOtp(
  confirmationResult: ConfirmationResult,
  otpCode: string
): Promise<{ userCredential: UserCredential; idToken: string }> {
  const userCredential = await confirmationResult.confirm(otpCode.trim());
  const idToken = await userCredential.user.getIdToken();

  return {
    userCredential,
    idToken,
  };
}
