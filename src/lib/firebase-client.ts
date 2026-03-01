import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const emulator = process.env.NEXT_PUBLIC_USE_EMULATORS === "true";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-falsify",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

export const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

if (typeof window !== "undefined" && emulator) {
  try {
    connectFirestoreEmulator(db, "localhost", 8080);
  } catch {}
  try {
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
  } catch {}
  try {
    connectStorageEmulator(storage, "localhost", 9199);
  } catch {}
}

export const emulatorMode = emulator;

export async function loadAnalytics() {
  if (typeof window === "undefined") return null;
  try {
    const { getConsent } = await import("./consent");
    const consent = getConsent();
    if (!consent || consent.analytics !== true) return null;
  } catch {}
  if (emulator) return null;
  if (!firebaseConfig.measurementId) return null;
  const { isSupported, getAnalytics } = await import("firebase/analytics");
  const supported = await isSupported();
  if (!supported) return null;
  return getAnalytics(app);
}
