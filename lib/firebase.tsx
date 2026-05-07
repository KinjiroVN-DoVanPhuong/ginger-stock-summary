"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { initializeApp, getApps, FirebaseApp, deleteApp } from "firebase/app";
import { getDatabase, Database } from "firebase/database";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface FirebaseContextType {
  db: Database | null;
  app: FirebaseApp | null;
  config: FirebaseConfig | null;
  setConfig: (config: FirebaseConfig) => void;
  clearConfig: () => void;
  isConfigured: boolean;
  connectionError: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  db: null,
  app: null,
  config: null,
  setConfig: () => {},
  clearConfig: () => {},
  isConfigured: false,
  connectionError: null,
});

const STORAGE_KEY = "ginger_firebase_config";

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<FirebaseConfig | null>(null);
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FirebaseConfig;
        if (parsed.databaseURL) {
          setConfigState(parsed);
        }
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Initialize Firebase when config changes
  useEffect(() => {
    if (!config || !config.databaseURL) {
      setApp(null);
      setDb(null);
      return;
    }

    try {
      // Clean up existing apps
      const existingApps = getApps();
      existingApps.forEach((a) => {
        try { deleteApp(a); } catch { /* ignore */ }
      });

      const firebaseApp = initializeApp(config);
      const database = getDatabase(firebaseApp);
      setApp(firebaseApp);
      setDb(database);
      setConnectionError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to initialize Firebase";
      setConnectionError(message);
      setApp(null);
      setDb(null);
    }
  }, [config]);

  const setConfig = (newConfig: FirebaseConfig) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    setConfigState(newConfig);
  };

  const clearConfig = () => {
    localStorage.removeItem(STORAGE_KEY);
    setConfigState(null);
    if (app) {
      try { deleteApp(app); } catch { /* ignore */ }
    }
    setApp(null);
    setDb(null);
    setConnectionError(null);
  };

  return (
    <FirebaseContext.Provider
      value={{
        db,
        app,
        config,
        setConfig,
        clearConfig,
        isConfigured: !!db,
        connectionError,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  return useContext(FirebaseContext);
}
