// src/components/Layout/Header.jsx
import React from 'react';
import { TrendingUp, LogOut } from 'lucide-react';
import { formatVND } from '../../utils/formatters';

export default function Header({ cashBalance, isDemo, userRole, onLogout }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {userRole !== 'guest' && (
          <div className="header-cash">
            <span className="header-cash-label">Tiền mặt</span>
            <span className="header-cash-amount">{formatVND(cashBalance)}</span>
          </div>
        )}
        <button 
          onClick={onLogout} 
          title="Đăng xuất"
          style={{ 
            background: 'var(--surface-2)', 
            border: '1px solid var(--border)', 
            borderRadius: '8px',
            color: 'var(--text-secondary)', 
            cursor: 'pointer', 
            display: 'flex', 
            padding: '6px',
            transition: 'all 0.2s'
          }}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
