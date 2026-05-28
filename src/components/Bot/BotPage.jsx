// src/components/Bot/BotPage.jsx
import React, { useState } from 'react';
import { Bot, AlertCircle, Play, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { requestTradingSignal } from '../../firebase/db';
import { formatVND } from '../../utils/formatters';

export default function BotPage({ tradingSignals, signalRequests, onToast, isDemo }) {
  const [selectedReason, setSelectedReason] = useState(null);

  const currentRequest = signalRequests.find(r => r.status === 'request' || r.status === 'running');
  const isRequesting = currentRequest?.status === 'request';
  const hasRunningRequest = !!currentRequest;

  async function handleRequest() {
    if (isDemo) {
      onToast('⚙️ Cần cài đặt Firebase để sử dụng Bot');
      return;
    }
    try {
      await requestTradingSignal();
      onToast('Đã gửi yêu cầu phân tích');
    } catch (e) {
      onToast('Lỗi khi gửi yêu cầu');
    }
  }

  return (
    <div>
      <div className="section-title">
        Bot AI Phân Tích
        <span className="text-muted text-sm">Tín hiệu giao dịch</span>
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--bg-secondary)', // or similar soft background
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Bot size={22} style={{ color: 'var(--primary)' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)', marginBottom: 2 }}>Khuyến nghị AI</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cập nhật tín hiệu mới nhất</div>
          </div>
        </div>
        <button
          className="btn-primary"
          style={{ 
            padding: '8px 14px', 
            borderRadius: '8px',
            fontSize: '13px',
            opacity: hasRunningRequest ? 0.6 : 1,
            whiteSpace: 'nowrap',
            margin: 0,
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            height: 'fit-content'
          }}
          onClick={handleRequest}
          disabled={hasRunningRequest}
        >
          {hasRunningRequest ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              {isRequesting ? 'Đang chờ...' : 'Đang chạy...'}
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" />
              Yêu cầu
            </>
          )}
        </button>
      </div>

      <div className="section-title" style={{ marginTop: 24 }}>
        Kết quả phân tích
        <span className="text-muted text-sm">{tradingSignals.length} tín hiệu</span>
      </div>

      {tradingSignals.length === 0 ? (
        <div className="empty-state">
          <AlertCircle size={48} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div className="empty-state-title">Chưa có tín hiệu nào</div>
          <div className="empty-state-desc">Hãy nhấn Yêu cầu phân tích để Bot bắt đầu làm việc.</div>
        </div>
      ) : (
        <div className="card">
          {tradingSignals.map((signal, index) => {
            const isBuy = true; // Assuming signals are generally buy recommendations, or we can check signal type if it exists
            return (
              <div key={signal.id || index} className="tx-item" style={{ cursor: 'pointer' }} onClick={() => setSelectedReason(signal.reason)}>
                <div className="tx-icon buy">
                  <Bot size={18} strokeWidth={1.8} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="tx-body">
                  <div className="tx-title">
                    <strong>{signal.symbol}</strong>
                    <span className="badge buy">Mua</span>
                  </div>
                  <div className="tx-meta" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span>Ngày: {signal.date}</span>
                    {signal.confidence != null && (
                      <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                        AI: {(Number(signal.confidence) <= 1 ? Number(signal.confidence) * 100 : Number(signal.confidence)).toFixed(1)}%
                      </span>
                    )}
                    {signal.pred_prob != null && (
                      <span style={{ color: 'var(--green)', fontWeight: 500 }}>
                        ML: {(Number(signal.pred_prob) <= 1 ? Number(signal.pred_prob) * 100 : Number(signal.pred_prob)).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="tx-meta" style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                    fontStyle: 'italic',
                    color: 'var(--text-muted)'
                  }}>
                    {signal.reason}
                  </div>
                </div>
                <div className="tx-amount" style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                  <div className="tx-amount-value" style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                    Vào: {formatVND(signal.entry_price)}
                  </div>
                  <div className="tx-amount-sub" style={{ color: 'var(--green)' }}>
                    Chốt: {formatVND(signal.take_profit_price)}
                  </div>
                  <div className="tx-amount-sub" style={{ color: 'var(--red)' }}>
                    Cắt: {formatVND(signal.stop_loss_price)}
                  </div>
                </div>
                <div style={{ paddingLeft: 12, opacity: 0.4 }}>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reason Dialog */}
      {selectedReason && (
        <div className="modal-overlay" onClick={() => setSelectedReason(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Lý do khuyến nghị</div>
            <div style={{ 
              lineHeight: '1.6', 
              fontSize: '15px', 
              color: 'var(--text-secondary)',
              marginBottom: '24px'
            }}>
              {selectedReason}
            </div>
            <button className="btn btn-primary btn-full" onClick={() => setSelectedReason(null)}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
