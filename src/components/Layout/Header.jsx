// src/components/Layout/Header.jsx
import React from 'react';
import { TrendingUp, LogOut } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function Header({ cashBalance, isDemo, onLogout }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">
          <TrendingUp size={18} strokeWidth={2.2} color="white" />
        </div>
        <div>
          <span className="header-logo-text">Ginger Stock</span>
          {isDemo && <span className="demo-chip">DEMO</span>}
        </div>
      </div>
      <div className="header-cash" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span className="header-cash-label">Tiền mặt</span>
          <span className="header-cash-amount">{formatVND(cashBalance)}</span>
        </div>
        <button onClick={onLogout} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 4 }}>
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
