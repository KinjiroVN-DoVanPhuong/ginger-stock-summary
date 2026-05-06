"use client";

import { useFirebase } from "@/lib/firebase";
import Link from "next/link";
import { Activity, Database, AlertCircle, TrendingUp } from "lucide-react";

export default function Home() {
  const { isConfigured } = useFirebase();

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Overview of your trading activity and signals.
          </p>
        </div>
      </div>

      {!isConfigured && (
        <div className="card" style={{ borderLeft: "4px solid var(--warning)", background: "rgba(245, 158, 11, 0.05)" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
            <AlertCircle color="var(--warning)" />
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Firebase Not Configured</h3>
              <p style={{ color: "var(--text-secondary)", marginBottom: "1rem", fontSize: "0.875rem" }}>
                You need to connect to your Firebase Realtime Database to use the application.
              </p>
              <Link href="/settings" className="btn btn-primary">
                Configure Firebase
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid-cols-3">
        <div className="card glass-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", background: "rgba(99, 102, 241, 0.1)", borderRadius: "var(--radius-md)" }}>
              <TrendingUp color="var(--primary)" />
            </div>
            <h3 style={{ fontWeight: 600 }}>Transactions</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Manage your manual buy and sell orders.
          </p>
          <Link href="/transactions" className="btn" style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--primary)", width: "100%" }}>
            View Transactions
          </Link>
        </div>

        <div className="card glass-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)" }}>
              <Activity color="var(--success)" />
            </div>
            <h3 style={{ fontWeight: 600 }}>Signal Requests</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Track requests for trading signals.
          </p>
          <Link href="/signal-requests" className="btn" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", width: "100%" }}>
            View Requests
          </Link>
        </div>

        <div className="card glass-panel">
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem" }}>
            <div style={{ padding: "0.75rem", background: "rgba(245, 158, 11, 0.1)", borderRadius: "var(--radius-md)" }}>
              <Database color="var(--warning)" />
            </div>
            <h3 style={{ fontWeight: 600 }}>Trading Signals</h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
            Explore available trading signals.
          </p>
          <Link href="/signals" className="btn" style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--warning)", width: "100%" }}>
            View Signals
          </Link>
        </div>
      </div>
    </div>
  );
}
