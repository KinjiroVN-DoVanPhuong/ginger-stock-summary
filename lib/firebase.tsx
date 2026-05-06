"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
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
  app: FirebaseApp | null;
  db: Database | null;
  config: FirebaseConfig | null;
  setConfig: (config: FirebaseConfig | null) => void;
  isConfigured: boolean;
}

const FirebaseContext = createContext<FirebaseContextType>({
  app: null,
  db: null,
  config: null,
  setConfig: () => {},
  isConfigured: false,
});

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<FirebaseConfig | null>(null);
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [db, setDb] = useState<Database | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load config from localStorage on mount
    const savedConfig = localStorage.getItem("firebaseConfig");
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfigState(parsed);
      } catch (e) {
        console.error("Failed to parse firebase config", e);
      }
    }
  }, []);

  useEffect(() => {
    if (config) {
      try {
        // Initialize Firebase
        const apps = getApps();
        let newApp: FirebaseApp;
        if (!apps.length) {
          newApp = initializeApp(config);
        } else {
          // If already initialized with different config, this might fail,
          // but usually in a SPA it's fine or we just use the existing one.
          newApp = initializeApp(config, "stock-app-" + Date.now());
        }
        setApp(newApp);
        setDb(getDatabase(newApp));
        setIsConfigured(true);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
        setIsConfigured(false);
      }
    } else {
      setApp(null);
      setDb(null);
      setIsConfigured(false);
    }
  }, [config]);

  const setConfig = (newConfig: FirebaseConfig | null) => {
    setConfigState(newConfig);
    if (newConfig) {
      localStorage.setItem("firebaseConfig", JSON.stringify(newConfig));
    } else {
      localStorage.removeItem("firebaseConfig");
    }
  };

  return (
    <FirebaseContext.Provider value={{ app, db, config, setConfig, isConfigured }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);
