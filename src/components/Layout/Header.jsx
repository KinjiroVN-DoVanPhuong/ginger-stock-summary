// src/components/Layout/Header.jsx
import React from 'react';
import { formatVND } from '../../utils/formatters';

export default function Header({ cashBalance, isDemo }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">📈</div>
        <div>
          <span className="header-logo-text">Ginger Stock</span>
          {isDemo && <span className="demo-chip">DEMO</span>}
        </div>
      </div>
      <div className="header-cash">
        <span className="header-cash-label">Tiền mặt</span>
        <span className="header-cash-amount">{formatVND(cashBalance)}</span>
      </div>
    </header>
  );
}
