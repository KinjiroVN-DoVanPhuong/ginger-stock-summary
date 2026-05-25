// src/components/common/DemoBanner.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlaskConical, X } from 'lucide-react';

export default function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  if (dismissed) return null;

  return (
    <div className="demo-banner">
      <div className="demo-banner-content">
        <FlaskConical size={20} strokeWidth={1.8} className="demo-banner-icon" style={{ color: 'var(--orange)', flexShrink: 0 }} />
        <div className="demo-banner-text">
          <strong>Chế độ Demo</strong>
          <span>Dữ liệu mẫu — chưa kết nối Firebase</span>
        </div>
      </div>
      <div className="demo-banner-actions">
        <button
          className="demo-banner-btn-setup"
          onClick={() => navigate('/settings')}
        >
          Cài đặt
        </button>
        <button
          className="demo-banner-btn-close"
          onClick={() => setDismissed(true)}
          aria-label="Đóng thông báo"
        >
          <X size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
