// src/components/Settings/SettingsPage.jsx
import React, { useState } from 'react';
import {
  Wifi, WifiOff, BookOpen, ChevronDown, ChevronUp,
  Save, Trash2, Lock, ClipboardPaste, AlignJustify,
} from 'lucide-react';
import {
  getStoredConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  isFirebaseConfigured,
} from '../../firebase/config';

const REGIONS = [
  { value: 'asia-southeast1', label: 'Asia (Singapore) — khuyến nghị' },
  { value: 'us-central1',     label: 'US Central'                      },
  { value: 'europe-west1',    label: 'Europe West'                     },
];

function buildDatabaseURL(projectId, region) {
  if (!projectId) return '';
  if (region === 'us-central1') {
    return `https://${projectId}-default-rtdb.firebaseio.com`;
  }
  return `https://${projectId}-default-rtdb.${region}.firebasedatabase.app`;
}

const FIELDS = [
  { key: 'apiKey',            label: 'API Key',             placeholder: 'AIzaSy...',                required: true  },
  { key: 'authDomain',        label: 'Auth Domain',         placeholder: 'my-project.firebaseapp.com', required: false },
  { key: 'projectId',         label: 'Project ID',          placeholder: 'my-project',                required: true  },
  { key: 'storageBucket',     label: 'Storage Bucket',      placeholder: 'my-project.appspot.com',    required: false },
  { key: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789',                 required: false },
  { key: 'appId',             label: 'App ID',              placeholder: '1:123456789:web:abc...',    required: false },
];

export default function SettingsPage() {
  const stored    = getStoredConfig();
  const configured = isFirebaseConfigured();

  const [mode, setMode]         = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [region, setRegion]     = useState('asia-southeast1');
  const [fields, setFields]     = useState(
    FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: stored?.[f.key] ?? '' }), {
      databaseURL: stored?.databaseURL ?? '',
    })
  );
  const [status, setStatus]       = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [showGuide, setShowGuide] = useState(!configured);

  // Auto-build databaseURL when projectId changes (fields mode)
  function handleFieldChange(key, value) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'projectId') {
        // Only auto-fill if databaseURL is empty or was previously auto-generated
        const currentAuto = buildDatabaseURL(prev.projectId, region);
        if (!prev.databaseURL || prev.databaseURL === currentAuto) {
          next.databaseURL = buildDatabaseURL(value, region);
        }
      }
      return next;
    });
  }

  function handleRegionChange(newRegion) {
    setRegion(newRegion);
    setFields((prev) => ({
      ...prev,
      databaseURL: buildDatabaseURL(prev.projectId, newRegion),
    }));
  }

  function parseJsonConfig(text) {
    const cleaned = text
      .replace(/^[\s\S]*?firebaseConfig\s*=\s*/m, '')
      .replace(/;?\s*$/, '')
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
        // Auto-build databaseURL if missing
        if (!config.databaseURL && config.projectId) {
          config.databaseURL = buildDatabaseURL(config.projectId, region);
        }
      } else {
        config = { ...fields };
        if (!config.databaseURL && config.projectId) {
          config.databaseURL = buildDatabaseURL(config.projectId, region);
        }
      }

      if (!config.apiKey)      throw new Error('Thiếu API Key');
      if (!config.projectId)   throw new Error('Thiếu Project ID');
      if (!config.databaseURL) throw new Error('Không tạo được Database URL — hãy chọn region hoặc nhập thủ công');

      saveFirebaseConfig(config);
      setStatus('success');
      setStatusMsg('Đã lưu! Đang tải lại ứng dụng...');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      setStatus('error');
      setStatusMsg(e.message || 'Config không hợp lệ');
    }
  }

  function handleClear() {
    if (!window.confirm('Xoá cấu hình Firebase và chuyển về chế độ Demo?')) return;
    clearFirebaseConfig();
    window.location.reload();
  }

  return (
    <div>
      {/* Connection status */}
      <div className={`settings-status-card ${configured ? 'connected' : 'demo'}`}>
        <div className="settings-status-icon">
          {configured
            ? <Wifi size={22} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
            : <WifiOff size={22} strokeWidth={1.8} style={{ color: 'var(--red)' }} />
          }
        </div>
        <div>
          <div className="settings-status-title">
            {configured ? 'Đã kết nối Firebase' : 'Chưa kết nối Firebase'}
          </div>
          <div className="settings-status-sub">
            {configured ? 'Dữ liệu đồng bộ theo thời gian thực' : 'Đang dùng dữ liệu mẫu (demo mode)'}
          </div>
        </div>
      </div>

      {/* Guide */}
      <div className="card" style={{ marginBottom: 12 }}>
        <button className="settings-guide-toggle" onClick={() => setShowGuide((v) => !v)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} strokeWidth={1.8} />
            Cách lấy Firebase config
          </span>
          {showGuide
            ? <ChevronUp size={16} strokeWidth={2} />
            : <ChevronDown size={16} strokeWidth={2} />
          }
        </button>
        {showGuide && (
          <ol className="settings-guide-steps">
            <li>
              Truy cập{' '}
              <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">
                console.firebase.google.com
              </a>{' '}
              và đăng nhập tài khoản Google
            </li>
            <li>Tạo project mới (hoặc chọn project có sẵn)</li>
            <li>
              Vào <strong>Project Settings</strong> (⚙️ góc trái) → <strong>General</strong> → cuộn xuống <strong>Your apps</strong> → nhấn <strong>Add app</strong> → chọn <strong>Web</strong>
            </li>
            <li>
              Đặt tên app → <strong>Register app</strong> → copy toàn bộ đoạn <code>firebaseConfig = &#123;...&#125;</code>
            </li>
            <li>
              Vào <strong>Build → Realtime Database → Create database</strong> → chọn region <strong>asia-southeast1</strong> → chọn <strong>Start in test mode</strong>
            </li>
            <li>
              Dán config bên dưới → chọn đúng region → nhấn <strong>Lưu cấu hình</strong>
            </li>
          </ol>
        )}
      </div>

      {/* Region selector */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Region của Realtime Database</label>
          <select
            className="form-input"
            value={region}
            onChange={(e) => handleRegionChange(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="type-toggle" style={{ marginBottom: 14 }}>
        <button
          className={`type-btn buy ${mode === 'json' ? 'active' : ''}`}
          onClick={() => setMode('json')}
          type="button"
        >
          <ClipboardPaste size={15} strokeWidth={2} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          Dán JSON
        </button>
        <button
          className={`type-btn buy ${mode === 'fields' ? 'active' : ''}`}
          onClick={() => setMode('fields')}
          type="button"
        >
          <AlignJustify size={15} strokeWidth={2} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
          Nhập từng trường
        </button>
      </div>

      <div className="card">
        {mode === 'json' ? (
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Dán nội dung Firebase Config</label>
            <textarea
              className="form-input settings-textarea"
              placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "...",\n  projectId: "...",\n  ...\n};`}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              spellCheck={false}
            />
            <div className="text-sm text-muted mt-2">
              Nếu config không có <code>databaseURL</code>, app sẽ tự tạo từ Project ID + region đã chọn.
            </div>
          </div>
        ) : (
          <>
            {FIELDS.map((f) => (
              <div className="form-group" key={f.key}>
                <label className="form-label">
                  {f.label} {f.required && <span style={{ color: 'var(--red)' }}>✱</span>}
                </label>
                <input
                  className="form-input"
                  placeholder={f.placeholder}
                  value={fields[f.key] ?? ''}
                  onChange={(e) => handleFieldChange(f.key, e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            ))}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                Database URL <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(tự động tạo)</span>
              </label>
              <input
                className="form-input"
                placeholder="Tự động điền khi nhập Project ID"
                value={fields.databaseURL ?? ''}
                onChange={(e) => setFields((p) => ({ ...p, databaseURL: e.target.value }))}
                autoComplete="off"
                spellCheck={false}
                style={{ color: fields.databaseURL ? 'var(--text-primary)' : 'var(--text-muted)' }}
              />
            </div>
          </>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className="settings-alert" style={{
          background: status === 'success' ? 'var(--green-light)' : 'var(--red-light)',
          color: status === 'success' ? 'var(--green)' : 'var(--red)',
        }}>
          {statusMsg}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
        <button className="btn btn-primary btn-full" onClick={handleSave}>
          <Save size={16} strokeWidth={2} />
          Lưu cấu hình & kết nối
        </button>
        {configured && (
          <button className="btn btn-ghost btn-full" onClick={handleClear}>
            <Trash2 size={16} strokeWidth={1.8} />
            Xoá cấu hình (về Demo mode)
          </button>
        )}
      </div>

      {/* Security note */}
      <div className="card mt-3" style={{ background: 'var(--primary-light)', border: '1px solid #bfdbfe' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Lock size={14} strokeWidth={2} style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }} />
          <div className="text-sm" style={{ color: 'var(--primary)' }}>
            Config được lưu trong localStorage trên thiết bị này và không gửi đi đâu. Mỗi thiết bị cần cài đặt riêng.
          </div>
        </div>
      </div>
    </div>
  );
}
