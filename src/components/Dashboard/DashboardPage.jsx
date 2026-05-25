// src/components/Dashboard/DashboardPage.jsx
import React, { useMemo } from 'react';
import { formatVND, formatPercent } from '../../utils/formatters';
import { calcPortfolio, calcRealizedPnL } from '../../utils/calculator';

export default function DashboardPage({ transactions, cashBalance }) {
  const portfolio = useMemo(() => calcPortfolio(transactions), [transactions]);
  const realizedPnL = useMemo(() => calcRealizedPnL(transactions), [transactions]);

  const stockValue = useMemo(() =>
    Object.values(portfolio).reduce((sum, s) => sum + s.totalCost, 0),
    [portfolio]
  );

  const totalAssets = cashBalance + stockValue;
  const totalInvested = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'BUY')
      .reduce((sum, t) => sum + t.totalCost, 0);
  }, [transactions]);

  const totalSellReceived = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'SELL')
      .reduce((sum, t) => sum + t.netReceived, 0);
  }, [transactions]);

  const stockCount = Object.keys(portfolio).length;

  return (
    <div>
      {/* Hero */}
      <div className="hero-card">
        <div className="hero-label">Tổng tài sản</div>
        <div className="hero-value">{formatVND(totalAssets)}</div>
        <div className="hero-sub">
          Tiền mặt: {formatVND(cashBalance)} · {stockCount} mã CK
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Giá trị CP</div>
          <div className="stat-value blue">{formatVND(stockValue)}</div>
          <div className="stat-sub">Giá vốn</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Lãi/Lỗ thực hiện</div>
          <div className={`stat-value ${realizedPnL >= 0 ? 'green' : 'red'}`}>
            {realizedPnL >= 0 ? '+' : ''}{formatVND(realizedPnL)}
          </div>
          <div className="stat-sub">Sau phí & thuế</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng đã mua</div>
          <div className="stat-value">{formatVND(totalInvested)}</div>
          <div className="stat-sub">Bao gồm phí</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng đã nhận</div>
          <div className="stat-value green">{formatVND(totalSellReceived)}</div>
          <div className="stat-sub">Sau phí & thuế</div>
        </div>
      </div>

      {/* Portfolio Summary */}
      {stockCount > 0 && (
        <div className="card">
          <div className="section-title">Đang nắm giữ</div>
          {Object.entries(portfolio).map(([symbol, data]) => (
            <div key={symbol} className="stock-item">
              <div className="stock-avatar">
                {symbol.slice(0, 3)}
              </div>
              <div className="stock-body">
                <div className="stock-symbol">{symbol}</div>
                <div className="stock-detail">
                  Giá vốn TB: {formatVND(data.avgCost)}/cp
                </div>
              </div>
              <div className="stock-values">
                <div className="stock-qty">{data.quantity.toLocaleString('vi-VN')} cp</div>
                <div className="stock-avg">{formatVND(data.totalCost)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {transactions.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">Chưa có giao dịch nào</div>
          <div className="empty-state-desc">
            Thêm tiền mặt và bắt đầu giao dịch để xem tổng quan
          </div>
        </div>
      )}
    </div>
  );
}
