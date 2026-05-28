// src/firebase/config.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// ─── Firebase initialization ──────────────────────────────────────────────────
// Initialise exclusively from environment variables

let db = null;

function tryInit(config) {
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    db = getDatabase(app);
  } catch (e) {
    console.warn('[Firebase] Init failed:', e.message);
    db = null;
  }
}

const envConfig = import.meta.env.VITE_FIREBASE_API_KEY ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
} : null;

if (envConfig) {
  tryInit(envConfig);
}

export { db };
export const isFirebaseConfigured = () => db !== null;
