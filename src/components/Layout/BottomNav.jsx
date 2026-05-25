// src/components/Layout/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { isFirebaseConfigured } from '../../firebase/config';

const NAV_ITEMS = [
  { to: '/',             icon: '🏠', label: 'Tổng quan' },
  { to: '/portfolio',    icon: '💼', label: 'Danh mục'  },
  { to: '/transactions', icon: '📋', label: 'Giao dịch' },
  { to: '/cash',         icon: '💰', label: 'Tiền mặt'  },
  { to: '/settings',     icon: '⚙️',  label: 'Cài đặt'  },
];

export default function BottomNav() {
  const configured = isFirebaseConfigured();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <span className="nav-icon">{icon}</span>
            {to === '/settings' && !configured && (
              <span className="nav-dot" aria-label="Chưa cài đặt" />
            )}
          </span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
