"use client";

import { BottomNav } from "./BottomNav";
import { FirebaseProvider } from "@/lib/firebase";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseProvider>
      <div className="app-container">
        <main className="page-content">{children}</main>
        <BottomNav />
      </div>
    </FirebaseProvider>
  );
}
