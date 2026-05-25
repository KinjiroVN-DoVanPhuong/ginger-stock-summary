// src/components/Transactions/TransactionForm.jsx
import React, { useState, useMemo } from 'react';
import { calcBuy, calcSell } from '../../utils/calculator';
import { formatVND, formatNumber } from '../../utils/formatters';

export default function TransactionForm({ onSubmit, onClose, cashBalance }) {
  const [type, setType] = useState('BUY');
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const qty = parseInt(quantity.replace(/\D/g, ''), 10) || 0;
  const prc = parseInt(price.replace(/\D/g, ''), 10) || 0;

  const calc = useMemo(() => {
    if (!qty || !prc) return null;
    return type === 'BUY' ? calcBuy(qty, prc) : calcSell(qty, prc);
  }, [type, qty, prc]);

  function handleNumberInput(setter) {
    return (e) => {
      const raw = e.target.value.replace(/\D/g, '');
      setter(raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '');
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!symbol.trim()) return setError('Vui lòng nhập mã cổ phiếu');
    if (!qty || qty <= 0) return setError('Số lượng không hợp lệ');
    if (!prc || prc <= 0) return setError('Giá không hợp lệ');

    if (type === 'BUY') {
      if (calc.totalCost > cashBalance) {
        return setError(`Không đủ tiền mặt. Cần ${formatVND(calc.totalCost)}, hiện có ${formatVND(cashBalance)}`);
      }
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        symbol: symbol.trim().toUpperCase(),
        quantity: qty,
        price: prc,
        ...(type === 'BUY'
          ? { grossAmount: calc.grossAmount, fee: calc.fee, totalCost: calc.totalCost }
          : { grossAmount: calc.grossAmount, fee: calc.fee, tax: calc.tax, netReceived: calc.netReceived }
        ),
        note: note.trim(),
      });
      onClose();
    } catch (err) {
      setError('Lỗi khi lưu giao dịch. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-title">Thêm giao dịch mới</div>

        {/* Type Toggle */}
        <div className="type-toggle">
          <button
            className={`type-btn buy ${type === 'BUY' ? 'active' : ''}`}
            onClick={() => setType('BUY')}
            type="button"
          >
            📈 Mua
          </button>
          <button
            className={`type-btn sell ${type === 'SELL' ? 'active' : ''}`}
            onClick={() => setType('SELL')}
            type="button"
          >
            📉 Bán
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Mã cổ phiếu</label>
            <input
              className="form-input uppercase"
              placeholder="VD: VNM, HPG, VIC..."
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              maxLength={10}
              autoComplete="off"
              autoCapitalize="characters"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Số lượng (CP)</label>
              <input
                className="form-input"
                placeholder="100"
                value={quantity}
                onChange={handleNumberInput(setQuantity)}
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Giá (VND/CP)</label>
              <input
                className="form-input"
                placeholder="50.000"
                value={price}
                onChange={handleNumberInput(setPrice)}
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Fee Summary */}
          {calc && (
            <div className="fee-box">
              <div className="fee-row">
                <span>Giá trị GD</span>
                <span>{formatVND(calc.grossAmount)}</span>
              </div>
              <div className="fee-row">
                <span>Phí ({type === 'BUY' ? '0.25%' : '0.25%'})</span>
                <span>- {formatVND(calc.fee)}</span>
              </div>
              {type === 'SELL' && (
                <div className="fee-row">
                  <span>Thuế bán (0.1%)</span>
                  <span>- {formatVND(calc.tax)}</span>
                </div>
              )}
              <div className={`fee-row total`}>
                <span>{type === 'BUY' ? 'Tổng tiền cần' : 'Tiền nhận về'}</span>
                <span className={`fee-value ${type === 'BUY' ? 'buy' : 'sell'}`}>
                  {formatVND(type === 'BUY' ? calc.totalCost : calc.netReceived)}
                </span>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Ghi chú (tuỳ chọn)</label>
            <input
              className="form-input"
              placeholder="Lý do giao dịch..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {error && (
            <div style={{
              background: 'var(--red-light)',
              color: 'var(--red)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Huỷ
            </button>
            <button
              type="submit"
              className={`btn ${type === 'BUY' ? 'btn-primary' : 'btn-danger'}`}
              disabled={loading}
            >
              {loading ? '...' : type === 'BUY' ? '📈 Mua' : '📉 Bán'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
