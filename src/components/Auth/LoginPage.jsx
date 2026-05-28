// src/components/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { Lock, User, Users } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'phuongdv' && password === '1234567890') {
      onLogin('admin');
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
    }
  };

  const handleGuestLogin = () => {
    onLogin('guest');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '100dvh', padding: 24, background: 'var(--bg-main)'
    }}>
      
      <div style={{
        width: 64, height: 64, borderRadius: 16,
        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24, color: 'white', boxShadow: '0 8px 16px rgba(37,99,235,0.2)'
      }}>
        <Lock size={32} />
      </div>
      
      <h2 style={{ margin: '0 0 8px 0', color: 'var(--text-main)', fontSize: 24 }}>Đăng nhập</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 32, fontSize: 14 }}>Hệ thống quản lý và phân tích giao dịch</p>

      <div className="card" style={{ width: '100%', maxWidth: 360, padding: 24 }}>
        <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.1)', color: 'var(--red)', borderRadius: 8, fontSize: 13, textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: 42 }}
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: 42 }}
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            Đăng nhập Admin
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ padding: '0 12px', fontSize: 12, color: 'var(--text-muted)' }}>HOẶC</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <button 
          onClick={handleGuestLogin}
          className="btn btn-ghost btn-full"
        >
          <Users size={18} />
          Đăng nhập dành cho Khách
        </button>
      </div>
    </div>
  );
}
