"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { CheckCircle, XCircle, Wifi, WifiOff, Trash2 } from "lucide-react";

const FIELDS = [
  { key: "databaseURL", label: "Database URL", placeholder: "https://xxx.firebaseio.com" },
  { key: "apiKey", label: "API Key", placeholder: "AIza..." },
  { key: "authDomain", label: "Auth Domain", placeholder: "xxx.firebaseapp.com" },
  { key: "projectId", label: "Project ID", placeholder: "my-project" },
  { key: "storageBucket", label: "Storage Bucket", placeholder: "xxx.appspot.com" },
  { key: "messagingSenderId", label: "Messaging Sender ID", placeholder: "123456789" },
  { key: "appId", label: "App ID", placeholder: "1:123:web:abc" },
] as const;

type ConfigKey = (typeof FIELDS)[number]["key"];

export default function SettingsPage() {
  const { config, setConfig, clearConfig, isConfigured, db, connectionError } = useFirebase();
  const [form, setForm] = useState<Record<ConfigKey, string>>({
    databaseURL: "", apiKey: "", authDomain: "",
    projectId: "", storageBucket: "", messagingSenderId: "", appId: "",
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    if (config) {
      const updated: Record<string, string> = {};
      FIELDS.forEach((f) => { updated[f.key] = (config as unknown as Record<string, string>)[f.key] || ""; });
      setForm(updated as Record<ConfigKey, string>);
    }
  }, [config]);

  const handleSave = () => {
    setConfig(form as never);
    setTestResult(null);
  };

  const handleTest = async () => {
    if (!db) return;
    setTesting(true);
    setTestResult(null);
    try {
      await get(ref(db, ".info/connected"));
      setTestResult("success");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
  };

  const handleClear = () => {
    if (confirm("Xoá cấu hình Firebase?")) {
      clearConfig();
      const reset: Record<string, string> = {};
      FIELDS.forEach((f) => { reset[f.key] = ""; });
      setForm(reset as Record<ConfigKey, string>);
      setTestResult(null);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Cài đặt</h1>
        <p className="page-subtitle">Kết nối Firebase Realtime Database</p>
      </div>

      {/* Status */}
      <div className={`settings-status ${isConfigured ? "connected" : "disconnected"}`}>
        {isConfigured ? <><Wifi /><span>Đã kết nối Firebase</span></> : <><WifiOff /><span>Chưa kết nối</span></>}
      </div>

      {connectionError && (
        <div className="connection-banner" style={{ background: "var(--danger-bg)", color: "var(--danger-text)", marginBottom: 16 }}>
          <XCircle size={18} />
          <span>{connectionError}</span>
        </div>
      )}

      {/* Config form */}
      <div className="form-card">
        <div className="card-header">
          <span className="card-title">Firebase Config</span>
        </div>

        {FIELDS.map((field) => (
          <div className="form-group" key={field.key} style={{ marginBottom: 12 }}>
            <label className="form-label">{field.label}</label>
            <input
              className="form-input"
              value={form[field.key]}
              onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
              placeholder={field.placeholder}
            />
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={!form.databaseURL}>
            Lưu cấu hình
          </button>
          {isConfigured && (
            <button className="btn btn-outline" onClick={handleTest} disabled={testing}>
              {testing ? "Đang test..." : "Test"}
            </button>
          )}
        </div>

        {testResult === "success" && (
          <div className="settings-status connected" style={{ marginTop: 12, marginBottom: 0 }}>
            <CheckCircle size={16} /> Kết nối thành công!
          </div>
        )}
        {testResult === "error" && (
          <div className="settings-status disconnected" style={{ marginTop: 12, marginBottom: 0 }}>
            <XCircle size={16} /> Kết nối thất bại. Kiểm tra lại cấu hình.
          </div>
        )}
      </div>

      {/* Clear */}
      {isConfigured && (
        <button className="btn btn-outline btn-full" onClick={handleClear} style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
          <Trash2 size={16} /> Xoá cấu hình
        </button>
      )}
    </div>
  );
}
