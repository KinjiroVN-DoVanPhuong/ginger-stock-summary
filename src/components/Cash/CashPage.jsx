// src/components/Cash/CashPage.jsx
import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Wallet, X } from 'lucide-react';
import { formatVND, formatDate } from '../../utils/formatters';

export default function CashPage({ cashBalance, cashHistory, onAddCash, onToast, isDemo }) {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [actionType, setActionType] = useState('IN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleNumberInput(e) {
    const raw = e.target.value.replace(/\D/g, '');
    setAmount(raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isDemo) { onToast('⚙️ Cần cài đặt Firebase trước'); return; }
    const numAmount = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    if (!numAmount || numAmount <= 0) return setError('Vui lòng nhập số tiền hợp lệ');
    if (actionType === 'OUT' && numAmount > cashBalance) {
      return setError(`Số dư không đủ. Hiện có: ${formatVND(cashBalance)}`);
    }

    setLoading(true);
    try {
      await onAddCash(numAmount, actionType, note.trim());
      setAmount('');
      setNote('');
      setShowForm(false);
      onToast(`${actionType === 'IN' ? 'Đã nạp' : 'Đã rút'} ${formatVND(numAmount)}`);
    } catch {
      setError('Lỗi khi lưu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Balance Hero */}
      <div className="hero-card" style={{ marginBottom: '12px' }}>
        <div className="hero-label">Số dư tiền mặt</div>
        <div className="hero-value">{formatVND(cashBalance)}</div>
        <div className="hero-sub">Cập nhật theo thời gian thực</div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <button
          className="btn btn-success"
          onClick={() => { setActionType('IN'); setShowForm(true); setError(''); }}
        >
          <ArrowDownCircle size={16} strokeWidth={2} />
          Nạp tiền
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => { setActionType('OUT'); setShowForm(true); setError(''); }}
        >
          <ArrowUpCircle size={16} strokeWidth={2} />
          Rút tiền
        </button>
      </div>

      {/* History */}
      <div className="section-title">
        Lịch sử
        <span className="text-muted text-sm">{cashHistory.length} lần</span>
      </div>

      {cashHistory.length === 0 ? (
        <div className="empty-state">
          <Wallet size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div className="empty-state-title">Chưa có lịch sử</div>
          <div className="empty-state-desc">Nạp tiền để bắt đầu đầu tư</div>
        </div>
      ) : (
        <div className="card">
          {cashHistory.map((entry) => {
            const isIn = entry.type === 'IN';
            return (
              <div key={entry.id} className="tx-item">
                <div className="tx-icon cash">
                  {isIn
                    ? <ArrowDownCircle size={18} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
                    : <ArrowUpCircle size={18} strokeWidth={1.8} style={{ color: 'var(--red)' }} />
                  }
                </div>
                <div className="tx-body">
                  <div className="tx-title">
                    {isIn ? 'Nạp tiền' : 'Rút tiền'}
                    <span className={`badge ${isIn ? 'cash-in' : 'cash-out'}`}>
                      {isIn ? 'Nạp' : 'Rút'}
                    </span>
                  </div>
                  <div className="tx-meta">{formatDate(entry.createdAt)}</div>
                  {entry.note && (
                    <div className="tx-meta" style={{ fontStyle: 'italic' }}>"{entry.note}"</div>
                  )}
                </div>
                <div className="tx-amount">
                  <div className={`tx-amount-value ${isIn ? 'sell' : 'buy'}`}>
                    {isIn ? '+' : '-'} {formatVND(entry.amount)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cash Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal-sheet">
            <div className="modal-handle" />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div className="modal-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                {actionType === 'IN'
                  ? <ArrowDownCircle size={20} strokeWidth={1.8} style={{ color: 'var(--green)' }} />
                  : <ArrowUpCircle size={20} strokeWidth={1.8} style={{ color: 'var(--red)' }} />
                }
                {actionType === 'IN' ? 'Nạp tiền mặt' : 'Rút tiền mặt'}
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                <X size={20} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Số tiền (VND)</label>
                <input
                  className="form-input"
                  placeholder="VD: 10.000.000"
                  value={amount}
                  onChange={handleNumberInput}
                  inputMode="numeric"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú (tuỳ chọn)</label>
                <input
                  className="form-input"
                  placeholder="VD: Chuyển khoản từ ngân hàng..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && (
                <div style={{
                  background: 'var(--red-light)', color: 'var(--red)',
                  padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  fontSize: '13px', fontWeight: 500, marginBottom: '14px',
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Huỷ</button>
                <button
                  type="submit"
                  className={`btn ${actionType === 'IN' ? 'btn-success' : 'btn-danger'}`}
                  disabled={loading}
                >
                  {loading ? '...' : actionType === 'IN' ? 'Nạp' : 'Rút'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
