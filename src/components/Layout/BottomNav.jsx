// src/components/Layout/BottomNav.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, ArrowLeftRight, Wallet } from 'lucide-react';
import { isFirebaseConfigured } from '../../firebase/config';

const NAV_ITEMS = [
  { to: '/',             Icon: LayoutDashboard, label: 'Tổng quan' },
  { to: '/portfolio',    Icon: Briefcase,        label: 'Danh mục'  },
  { to: '/transactions', Icon: ArrowLeftRight,   label: 'Giao dịch' },
  { to: '/cash',         Icon: Wallet,           label: 'Tiền mặt'  },
];

export default function BottomNav() {
  const configured = isFirebaseConfigured();

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon-wrap">
            <Icon size={22} strokeWidth={1.8} className="nav-icon" />
          </span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
