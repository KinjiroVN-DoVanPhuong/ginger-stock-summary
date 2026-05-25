// src/components/Settings/SettingsPage.jsx
import React, { useState } from 'react';
import {
  getStoredConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
} from '../../firebase/config';

const FIELDS = [
  { key: 'apiKey',            label: 'API Key',             placeholder: 'AIzaSy...' },
  { key: 'authDomain',        label: 'Auth Domain',         placeholder: 'my-project.firebaseapp.com' },
  { key: 'databaseURL',       label: 'Database URL ✱',      placeholder: 'https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app' },
  { key: 'projectId',         label: 'Project ID ✱',        placeholder: 'my-project' },
  { key: 'storageBucket',     label: 'Storage Bucket',      placeholder: 'my-project.appspot.com' },
  { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789' },
  { key: 'appId',             label: 'App ID',              placeholder: '1:123456789:web:abc...' },
];

export default function SettingsPage() {
  const stored = getStoredConfig();
  const configured = isFirebaseConfigured();

  const [mode, setMode] = useState('json'); // 'json' | 'fields'
  const [jsonText, setJsonText] = useState('');
  const [fields, setFields] = useState(
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: stored?.[f.key] ?? '' }), {})
  );
  const [status, setStatus] = useState(null); // null | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState('');
  const [showGuide, setShowGuide] = useState(!configured);

  function parseJsonConfig(text) {
    // Support both raw JSON object and the firebaseConfig = {...} format
    const cleaned = text
      .replace(/^.*?firebaseConfig\s*=\s*/s, '') // remove variable assignment prefix
      .replace(/;?\s*$/, '')                       // remove trailing semicolon
      .trim();
    return JSON.parse(cleaned);
  }

  function handleSave() {
    setStatus(null);
    try {
      let config;
      if (mode === 'json') {
        if (!jsonText.trim()) {
          setStatus('error');
          setStatusMsg('Vui lòng dán nội dung Firebase config');
          return;
        }
        config = parseJsonConfig(jsonText);
      } else {
        config = { ...fields };
      }

      if (!config.apiKey) throw new Error('Thiếu apiKey');
      if (!config.databaseURL) throw new Error('Thiếu databaseURL');
      if (!config.projectId) throw new Error('Thiếu projectId');

      saveFirebaseConfig(config);
      setStatus('success');
      setStatusMsg('Đã lưu! Đang tải lại ứng dụng...');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setStatus('error');
      setStatusMsg(`Lỗi: ${e.message || 'Config không hợp lệ'}`);
    }
  }

  function handleClear() {
    if (!window.confirm('Xoá cấu hình Firebase và chuyển về chế độ Demo?')) return;
    clearFirebaseConfig();
    window.location.reload();
  }

  function handleFieldChange(key, value) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      {/* Status header */}
      <div className={`settings-status-card ${configured ? 'connected' : 'demo'}`}>
        <div className="settings-status-icon">{configured ? '🟢' : '🔴'}</div>
        <div>
          <div className="settings-status-title">
            {configured ? 'Đã kết nối Firebase' : 'Chưa kết nối Firebase'}
          </div>
          <div className="settings-status-sub">
            {configured
              ? 'Dữ liệu đang đồng bộ theo thời gian thực'
              : 'Đang dùng dữ liệu mẫu (demo mode)'}
          </div>
        </div>
      </div>

      {/* Guide accordion */}
      <div className="card" style={{ marginBottom: 12 }}>
        <button
          className="settings-guide-toggle"
          onClick={() => setShowGuide((v) => !v)}
        >
          <span>📖 Cách lấy Firebase config</span>
          <span>{showGuide ? '▲' : '▼'}</span>
        </button>
        {showGuide && (
          <ol className="settings-guide-steps">
            <li>
              Truy cập{' '}
              <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
                console.firebase.google.com
              </a>{' '}
              và đăng nhập
            </li>
            <li>Tạo project mới (hoặc chọn project có sẵn)</li>
            <li>
              Vào <strong>Project Settings</strong> (⚙️ góc trái) →{' '}
              <strong>General</strong> → cuộn xuống{' '}
              <strong>Your apps</strong> → nhấn <strong>Add app</strong> → chọn{' '}
              <strong>Web (&lt;/&gt;)</strong>
            </li>
            <li>
              Đặt tên app → nhấn <strong>Register app</strong> → copy toàn bộ
              đoạn <code>firebaseConfig = &#123;...&#125;</code>
            </li>
            <li>
              Vào <strong>Build → Realtime Database → Create database</strong> →
              chọn region <strong>asia-southeast1</strong> → chọn{' '}
              <strong>Start in test mode</strong>
            </li>
            <li>Dán config vào ô bên dưới và nhấn Lưu cấu hình</li>
          </ol>
        )}
      </div>

      {/* Mode toggle */}
      <div className="type-toggle" style={{ marginBottom: 14 }}>
        <button
          className={`type-btn buy ${mode === 'json' ? 'active' : ''}`}
          onClick={() => setMode('json')}
          type="button"
        >
          📋 Dán JSON
        </button>
        <button
          className={`type-btn buy ${mode === 'fields' ? 'active' : ''}`}
          onClick={() => setMode('fields')}
          type="button"
        >
          ✏️ Nhập từng trường
        </button>
      </div>

      <div className="card">
        {mode === 'json' ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Dán nội dung Firebase Config
            </label>
            <textarea
              className="form-input settings-textarea"
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  databaseURL: "https://...",\n  projectId: "...",\n  ...\n};`}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              spellCheck={false}
            />
            <div className="text-sm text-muted mt-2">
              Dán nguyên đoạn code từ Firebase Console (bao gồm cả <code>const firebaseConfig = &#123;...&#125;</code>)
            </div>
          </div>
        ) : (
          FIELDS.map((f) => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input
                className="form-input"
                placeholder={f.placeholder}
                value={fields[f.key]}
                onChange={(e) => handleFieldChange(f.key, e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          ))
        )}
      </div>

      {/* Status message */}
      {status && (
        <div
          className="settings-alert"
          style={{
            background: status === 'success' ? 'var(--green-light)' : 'var(--red-light)',
            color: status === 'success' ? 'var(--green)' : 'var(--red)',
          }}
        >
          {status === 'success' ? '✅' : '⚠️'} {statusMsg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary btn-full" onClick={handleSave}>
          💾 Lưu cấu hình & kết nối
        </button>
        {configured && (
          <button className="btn btn-ghost btn-full" onClick={handleClear}>
            🗑 Xoá cấu hình (về Demo mode)
          </button>
        )}
      </div>

      {/* Note */}
      <div className="card mt-3" style={{ background: 'var(--primary-light)', border: '1px solid #bfdbfe' }}>
        <div className="text-sm" style={{ color: 'var(--primary)' }}>
          <strong>🔒 Bảo mật:</strong> Config được lưu trong bộ nhớ trình duyệt (localStorage) và không được gửi đi đâu cả. Mỗi thiết bị cần cài đặt riêng.
        </div>
      </div>
    </div>
  );
}
