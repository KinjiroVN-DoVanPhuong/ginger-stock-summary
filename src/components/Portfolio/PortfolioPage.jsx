// src/components/Portfolio/PortfolioPage.jsx
import React, { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { formatVND, formatNumber } from '../../utils/formatters';
import { calcPortfolio } from '../../utils/calculator';

export default function PortfolioPage({ transactions, currentPrices = {} }) {
  const portfolio = useMemo(() => calcPortfolio(transactions), [transactions]);
  const entries = Object.entries(portfolio);
  
  const totalCost = entries.reduce((sum, [, v]) => sum + v.totalCost, 0);
  const currentTotalValue = entries.reduce((sum, [symbol, v]) => {
    const currentPrice = currentPrices[symbol];
    if (currentPrice) {
      return sum + (currentPrice * v.quantity);
    }
    return sum + v.totalCost;
  }, 0);

  const totalPL = currentTotalValue - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

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
        <div className="hero-value">{formatVND(currentTotalValue)}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
          <div className="hero-sub" style={{ margin: 0 }}>{entries.length} mã cổ phiếu đang nắm giữ</div>
          {totalCost > 0 && (
            <div style={{ 
              fontSize: 13, 
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: 12,
              background: totalPL >= 0 ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
              color: totalPL >= 0 ? '#4ade80' : '#fca5a5'
            }}>
              {totalPL > 0 ? '+' : ''}{formatVND(totalPL)} ({totalPL > 0 ? '+' : ''}{totalPLPct.toFixed(2)}%)
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          Danh sách cổ phiếu
          <span className="text-muted text-sm">{entries.length} mã</span>
        </div>
        {entries.map(([symbol, data]) => {
          const pct = totalCost > 0 ? (data.totalCost / totalCost) * 100 : 0;
          const currentPrice = currentPrices[symbol];
          const currentStockValue = currentPrice ? currentPrice * data.quantity : data.totalCost;
          const pl = currentPrice ? currentStockValue - data.totalCost : 0;
          const plPct = currentPrice ? (pl / data.totalCost) * 100 : 0;

          return (
            <div key={symbol} className="stock-item">
              <div className="stock-avatar">{symbol.slice(0, 3)}</div>
              <div className="stock-body">
                <div className="stock-symbol">{symbol}</div>
                <div className="stock-detail">Giá vốn TB: {formatVND(data.avgCost)}/cp</div>
                {currentPrice && (
                  <div className="stock-detail" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    Giá hiện tại: {formatVND(currentPrice)}/cp
                  </div>
                )}
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
                <div className="stock-avg">{formatVND(currentStockValue)}</div>
                {currentPrice && (
                  <div style={{ 
                    fontSize: 12, 
                    fontWeight: 700,
                    marginTop: 4,
                    color: pl >= 0 ? 'var(--green)' : 'var(--red)'
                  }}>
                    {pl > 0 ? '+' : ''}{formatVND(pl)}<br/>
                    ({pl > 0 ? '+' : ''}{plPct.toFixed(2)}%)
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
