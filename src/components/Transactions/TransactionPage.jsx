// src/components/Transactions/TransactionPage.jsx
import React, { useState } from 'react';
import { formatVND, formatDate, formatNumber } from '../../utils/formatters';
import { deleteTransaction } from '../../firebase/db';
import TransactionForm from './TransactionForm';

const FILTERS = [
  { key: 'ALL',  label: 'Tất cả' },
  { key: 'BUY',  label: '📈 Mua'  },
  { key: 'SELL', label: '📉 Bán'  },
];

export default function TransactionPage({ transactions, cashBalance, onAddTransaction, onToast }) {
  const [filter, setFilter] = useState('ALL');
  const [showForm, setShowForm] = useState(false);

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  async function handleDelete(tx) {
    if (!window.confirm(`Xoá giao dịch ${tx.type === 'BUY' ? 'mua' : 'bán'} ${tx.symbol}?`)) return;
    try {
      await deleteTransaction(tx.id);
      onToast('✅ Đã xoá giao dịch');
    } catch {
      onToast('❌ Lỗi khi xoá');
    }
  }

  return (
    <div>
      <div className="section-title">
        Lịch sử giao dịch
        <span className="text-muted text-sm">{transactions.length} GD</span>
      </div>

      {/* Filter */}
      <div className="filter-chips">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            className={`chip ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">Chưa có giao dịch nào</div>
          <div className="empty-state-desc">
            Nhấn nút + bên dưới để thêm giao dịch mới
          </div>
        </div>
      ) : (
        <div className="card">
          {filtered.map((tx) => (
            <div key={tx.id} className="tx-item">
              <div className={`tx-icon ${tx.type.toLowerCase()}`}>
                {tx.type === 'BUY' ? '📈' : '📉'}
              </div>
              <div className="tx-body">
                <div className="tx-title">
                  <strong>{tx.symbol}</strong>
                  <span className={`badge ${tx.type.toLowerCase()}`}>
                    {tx.type === 'BUY' ? 'Mua' : 'Bán'}
                  </span>
                </div>
                <div className="tx-meta">
                  {formatNumber(tx.quantity)} cp × {formatVND(tx.price)} · {formatDate(tx.createdAt)}
                </div>
                {tx.note && (
                  <div className="tx-meta" style={{ fontStyle: 'italic' }}>
                    "{tx.note}"
                  </div>
                )}
              </div>
              <div className="tx-amount">
                <div className={`tx-amount-value ${tx.type.toLowerCase()}`}>
                  {tx.type === 'BUY'
                    ? `- ${formatVND(tx.totalCost)}`
                    : `+ ${formatVND(tx.netReceived)}`}
                </div>
                <div className="tx-amount-sub">
                  {tx.type === 'BUY'
                    ? `Phí: ${formatVND(tx.fee)}`
                    : `Thuế: ${formatVND(tx.tax)}`}
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDelete(tx)}
                title="Xoá giao dịch"
              >
                🗑
              </button>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)} title="Thêm giao dịch">
        +
      </button>

      {/* Form Modal */}
      {showForm && (
        <TransactionForm
          onSubmit={onAddTransaction}
          onClose={() => setShowForm(false)}
          cashBalance={cashBalance}
        />
      )}
    </div>
  );
}
