"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { CheckCircle, XCircle } from "lucide-react";

export default function SettingsPage() {
  const { config, setConfig, isConfigured } = useFirebase();
  const [formData, setFormData] = useState({
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(formData);
  };

  const handleClear = () => {
    setConfig(null);
    setFormData({
      apiKey: "",
      authDomain: "",
      databaseURL: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="card" style={{ maxWidth: "600px" }}>
        <div className="flex-between mb-4">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Firebase Configuration</h2>
          {isConfigured ? (
            <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={14} /> Connected
            </div>
          ) : (
            <div className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
              <XCircle size={14} /> Disconnected
            </div>
          )}
        </div>
        
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          Enter your Firebase project configuration to connect the application to your database.
        </p>

        <form onSubmit={handleSave}>
          <div className="input-group">
            <label>Database URL</label>
            <input
              type="text"
              name="databaseURL"
              value={formData.databaseURL}
              onChange={handleChange}
              className="input-field"
              placeholder="https://your-project.firebaseio.com"
              required
            />
          </div>
          
          <div className="input-group">
            <label>API Key</label>
            <input
              type="text"
              name="apiKey"
              value={formData.apiKey}
              onChange={handleChange}
              className="input-field"
              placeholder="AIzaSy..."
            />
          </div>

          <div className="input-group">
            <label>Project ID</label>
            <input
              type="text"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              className="input-field"
              placeholder="your-project-id"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="input-group">
              <label>Auth Domain</label>
              <input
                type="text"
                name="authDomain"
                value={formData.authDomain}
                onChange={handleChange}
                className="input-field"
                placeholder="your-project.firebaseapp.com"
              />
            </div>
            <div className="input-group">
              <label>Storage Bucket</label>
              <input
                type="text"
                name="storageBucket"
                value={formData.storageBucket}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="input-group">
              <label>Messaging Sender ID</label>
              <input
                type="text"
                name="messagingSenderId"
                value={formData.messagingSenderId}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>App ID</label>
              <input
                type="text"
                name="appId"
                value={formData.appId}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          <div className="flex-gap mt-4">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              Save Configuration
            </button>
            <button type="button" onClick={handleClear} className="btn btn-danger">
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
