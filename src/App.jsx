// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import BottomNav from './components/Layout/BottomNav';
import DemoBanner from './components/common/DemoBanner';
import DashboardPage from './components/Dashboard/DashboardPage';
import PortfolioPage from './components/Portfolio/PortfolioPage';
import TransactionPage from './components/Transactions/TransactionPage';
import CashPage from './components/Cash/CashPage';
import SettingsPage from './components/Settings/SettingsPage';
import {
  subscribeTransactions,
  addTransaction,
  subscribeCash,
  setCashBalance,
  getCashBalance,
  subscribeCashHistory,
  addCashEntry,
} from './firebase/db';
import { isFirebaseConfigured } from './firebase/config';
import { calcBuy, calcSell } from './utils/calculator';
import {
  SAMPLE_TRANSACTIONS,
  SAMPLE_CASH_BALANCE,
  SAMPLE_CASH_HISTORY,
} from './utils/sampleData';

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <div className="toast-container">
      <div className="toast">{message}</div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const configured = isFirebaseConfigured();

  const [transactions, setTransactions]   = useState(configured ? [] : SAMPLE_TRANSACTIONS);
  const [cashBalance, setCashBalanceState] = useState(configured ? 0 : SAMPLE_CASH_BALANCE);
  const [cashHistory, setCashHistory]     = useState(configured ? [] : SAMPLE_CASH_HISTORY);
  const [toast, setToast]                 = useState(null);
  const [loading, setLoading]             = useState(configured);

  function showToast(msg) { setToast(msg); }

  // Only subscribe to Firebase when configured
  useEffect(() => {
    if (!configured) return;

    const unsubTx   = subscribeTransactions((data) => {
      setTransactions(data);
      setLoading(false);
    });
    const unsubCash    = subscribeCash((bal) => setCashBalanceState(bal));
    const unsubHistory = subscribeCashHistory((data) => setCashHistory(data));

    return () => { unsubTx(); unsubCash(); unsubHistory(); };
  }, [configured]);

  // ─── Handlers (only run when Firebase is configured) ───────────────────────
  const handleAddTransaction = useCallback(async (txData) => {
    if (!configured) {
      showToast('⚙️ Cần cài đặt Firebase trước khi giao dịch');
      return;
    }
    const currentCash = await getCashBalance();

    if (txData.type === 'BUY') {
      if (txData.totalCost > currentCash) throw new Error('Không đủ tiền mặt');
      await addTransaction(txData);
      await setCashBalance(currentCash - txData.totalCost);
      showToast(`✅ Đã mua ${txData.quantity} CP ${txData.symbol}`);
    } else {
      await addTransaction(txData);
      await setCashBalance(currentCash + txData.netReceived);
      showToast(`✅ Đã bán ${txData.quantity} CP ${txData.symbol}`);
    }
  }, [configured]);

  const handleAddCash = useCallback(async (amount, type, note) => {
    if (!configured) {
      showToast('⚙️ Cần cài đặt Firebase trước khi thêm tiền');
      return;
    }
    const currentCash = await getCashBalance();
    const newBalance = type === 'IN' ? currentCash + amount : currentCash - amount;
    await setCashBalance(newBalance);
    await addCashEntry({ amount, type, note });
  }, [configured]);

  // ─── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', flexDirection: 'column', gap: '16px',
      }}>
        <div style={{
          width: 52, height: 52, background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
        }}>📈</div>
        <div className="spinner" />
        <div style={{ fontSize: 14, color: 'var(--text-muted)' }}>Đang kết nối Firebase...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      <Header cashBalance={cashBalance} isDemo={!configured} />

      <main className="page-content">
        {!configured && <DemoBanner />}
        <Routes>
          <Route path="/"
            element={<DashboardPage transactions={transactions} cashBalance={cashBalance} />}
          />
          <Route path="/portfolio"
            element={<PortfolioPage transactions={transactions} />}
          />
          <Route path="/transactions"
            element={
              <TransactionPage
                transactions={transactions}
                cashBalance={cashBalance}
                onAddTransaction={handleAddTransaction}
                onToast={showToast}
                isDemo={!configured}
              />
            }
          />
          <Route path="/cash"
            element={
              <CashPage
                cashBalance={cashBalance}
                cashHistory={cashHistory}
                onAddCash={handleAddCash}
                onToast={showToast}
                isDemo={!configured}
              />
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      <BottomNav />
    </BrowserRouter>
  );
}
