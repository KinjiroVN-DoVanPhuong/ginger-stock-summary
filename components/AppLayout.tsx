"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { FirebaseProvider } from "@/lib/firebase";
import { Menu, Activity } from "lucide-react";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <FirebaseProvider>
      <div className="app-layout">
        <div className="mobile-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "1.25rem" }}>
            <Activity size={24} color="var(--primary)" />
            Ginger
          </div>
          <button 
            className="btn" 
            style={{ padding: "0.5rem", background: "transparent", color: "var(--text-primary)" }}
            onClick={() => setIsMobileOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
        
        <Sidebar isOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />
        
        <main className="main-content">
          {children}
        </main>
      </div>
    </FirebaseProvider>
  );
}
