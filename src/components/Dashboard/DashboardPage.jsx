// src/components/Dashboard/DashboardPage.jsx
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, BarChart2, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import { calcPortfolio, calcRealizedPnL } from '../../utils/calculator';

export default function DashboardPage({ transactions, cashBalance }) {
  const portfolio = useMemo(() => calcPortfolio(transactions), [transactions]);
  const realizedPnL = useMemo(() => calcRealizedPnL(transactions), [transactions]);

  const stockValue = useMemo(() =>
    Object.values(portfolio).reduce((sum, s) => sum + s.totalCost, 0),
    [portfolio]
  );

  const totalAssets = cashBalance + stockValue;

  const totalInvested = useMemo(() =>
    transactions.filter((t) => t.type === 'BUY').reduce((sum, t) => sum + t.totalCost, 0),
    [transactions]
  );

  const totalSellReceived = useMemo(() =>
    transactions.filter((t) => t.type === 'SELL').reduce((sum, t) => sum + t.netReceived, 0),
    [transactions]
  );

  const stockCount = Object.keys(portfolio).length;
  const pnlPositive = realizedPnL >= 0;

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
          <div className="stat-label-row">
            <span className="stat-label">Giá trị CP</span>
            <BarChart2 size={14} strokeWidth={1.8} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="stat-value blue">{formatVND(stockValue)}</div>
          <div className="stat-sub">Giá vốn</div>
        </div>

        <div className="stat-card">
          <div className="stat-label-row">
            <span className="stat-label">Lãi/Lỗ thực hiện</span>
            {pnlPositive
              ? <TrendingUp size={14} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
              : <TrendingDown size={14} strokeWidth={1.8} style={{ color: 'var(--red)' }} />
            }
          </div>
          <div className={`stat-value ${pnlPositive ? 'green' : 'red'}`}>
            {pnlPositive ? '+' : ''}{formatVND(realizedPnL)}
          </div>
          <div className="stat-sub">Sau phí & thuế</div>
        </div>

        <div className="stat-card">
          <div className="stat-label-row">
            <span className="stat-label">Tổng đã mua</span>
            <ArrowDownRight size={14} strokeWidth={1.8} style={{ color: 'var(--red)' }} />
          </div>
          <div className="stat-value">{formatVND(totalInvested)}</div>
          <div className="stat-sub">Bao gồm phí</div>
        </div>

        <div className="stat-card">
          <div className="stat-label-row">
            <span className="stat-label">Tổng đã nhận</span>
            <ArrowUpRight size={14} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
          </div>
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
              <div className="stock-avatar">{symbol.slice(0, 3)}</div>
              <div className="stock-body">
                <div className="stock-symbol">{symbol}</div>
                <div className="stock-detail">Giá vốn TB: {formatVND(data.avgCost)}/cp</div>
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
          <BarChart2 size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div className="empty-state-title">Chưa có giao dịch nào</div>
          <div className="empty-state-desc">Thêm tiền mặt và bắt đầu giao dịch để xem tổng quan</div>
        </div>
      )}
    </div>
  );
}
