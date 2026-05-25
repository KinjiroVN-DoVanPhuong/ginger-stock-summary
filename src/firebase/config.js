// src/firebase/config.js
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const STORAGE_KEY = 'ginger_firebase_config';

// ─── Stored config helpers ────────────────────────────────────────────────────

export function getStoredConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const cfg = JSON.parse(raw);
    // Require the minimum fields
    if (!cfg.apiKey || !cfg.databaseURL || !cfg.projectId) return null;
    return cfg;
  } catch {
    return null;
  }
}

export function saveFirebaseConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearFirebaseConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Firebase initialization ──────────────────────────────────────────────────
// Attempt to initialise from localStorage. Falls back to env vars if present.

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

const stored = getStoredConfig();

if (stored) {
  tryInit(stored);
} else if (import.meta.env.VITE_FIREBASE_API_KEY) {
  // Fallback to env vars (for Vercel deploys with env vars set)
  tryInit({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

export { db };
export const isFirebaseConfigured = () => db !== null;
