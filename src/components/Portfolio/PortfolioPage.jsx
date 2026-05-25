// src/components/Portfolio/PortfolioPage.jsx
import React, { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { formatVND, formatNumber } from '../../utils/formatters';
import { calcPortfolio } from '../../utils/calculator';

export default function PortfolioPage({ transactions }) {
  const portfolio = useMemo(() => calcPortfolio(transactions), [transactions]);
  const entries = Object.entries(portfolio);
  const totalValue = entries.reduce((sum, [, v]) => sum + v.totalCost, 0);

  if (entries.length === 0) {
    return (
      <div>
        <div className="section-title">Danh mục cổ phiếu</div>
        <div className="empty-state">
          <Briefcase size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div className="empty-state-title">Danh mục trống</div>
          <div className="empty-state-desc">Thêm giao dịch mua để xem danh mục của bạn</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="hero-card" style={{ marginBottom: '12px' }}>
        <div className="hero-label">Tổng giá trị danh mục</div>
        <div className="hero-value">{formatVND(totalValue)}</div>
        <div className="hero-sub">{entries.length} mã cổ phiếu đang nắm giữ</div>
      </div>

      <div className="card">
        <div className="section-title">
          Danh sách cổ phiếu
          <span className="text-muted text-sm">{entries.length} mã</span>
        </div>
        {entries.map(([symbol, data]) => {
          const pct = totalValue > 0 ? (data.totalCost / totalValue) * 100 : 0;
          return (
            <div key={symbol} className="stock-item">
              <div className="stock-avatar">{symbol.slice(0, 3)}</div>
              <div className="stock-body">
                <div className="stock-symbol">{symbol}</div>
                <div className="stock-detail">Giá vốn TB: {formatVND(data.avgCost)}/cp</div>
                <div style={{ marginTop: 4 }}>
                  <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--primary), #7c3aed)',
                      borderRadius: 2, transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                    {pct.toFixed(1)}% danh mục
                  </span>
                </div>
              </div>
              <div className="stock-values">
                <div className="stock-qty">{formatNumber(data.quantity)} cp</div>
                <div className="stock-avg">{formatVND(data.totalCost)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
