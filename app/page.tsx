"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { formatVND, formatPercent } from "@/lib/format";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Banknote,
  PieChart,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface Transaction {
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
}

interface Deposit {
  amount: number;
}

interface CurrentPrice {
  price: number;
  updated_at: number;
}

interface PortfolioItem {
  symbol: string;
  quantity: number;
  avgCost: number;
  totalCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPercent: number;
}

export default function DashboardPage() {
  const { db, isConfigured } = useFirebase();
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [deposits, setDeposits] = useState<Record<string, Deposit>>({});
  const [prices, setPrices] = useState<Record<string, CurrentPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let loaded = 0;
    const checkDone = () => { loaded++; if (loaded >= 3) setLoading(false); };

    const unsubTx = onValue(ref(db, "transactions"), (snap) => {
      setTransactions(snap.val() || {});
      checkDone();
    });
    const unsubDep = onValue(ref(db, "deposits"), (snap) => {
      setDeposits(snap.val() || {});
      checkDone();
    });
    const unsubPrices = onValue(ref(db, "current_prices"), (snap) => {
      setPrices(snap.val() || {});
      checkDone();
    });

    return () => { unsubTx(); unsubDep(); unsubPrices(); };
  }, [db]);

  // Fee constants
  const BUY_FEE_RATE = 0.0025;   // 0.25%
  const SELL_FEE_RATE = 0.0025;  // 0.25%
  const SELL_TAX_RATE = 0.001;   // 0.1%

  // Calculations
  const totalDeposits = Object.values(deposits).reduce((s, d) => s + (d.amount || 0), 0);
  const txList = Object.values(transactions);

  // Buy: pay value + fee (0.25%)
  const totalBoughtWithFee = txList
    .filter((t) => t.type === "buy")
    .reduce((s, t) => s + t.quantity * t.price * (1 + BUY_FEE_RATE), 0);
  // Sell: receive value - fee (0.25%) - tax (0.1%)
  const totalSoldAfterFee = txList
    .filter((t) => t.type === "sell")
    .reduce((s, t) => s + t.quantity * t.price * (1 - SELL_FEE_RATE - SELL_TAX_RATE), 0);

  const cash = totalDeposits - totalBoughtWithFee + totalSoldAfterFee;

  // Build portfolio
  const holdingsMap: Record<string, { qty: number; cost: number }> = {};
  txList.forEach((t) => {
    if (!holdingsMap[t.symbol]) holdingsMap[t.symbol] = { qty: 0, cost: 0 };
    if (t.type === "buy") {
      holdingsMap[t.symbol].qty += t.quantity;
      holdingsMap[t.symbol].cost += t.quantity * t.price;
    } else {
      holdingsMap[t.symbol].qty -= t.quantity;
      // proportionally reduce cost
      const prev = holdingsMap[t.symbol];
      if (prev.qty + t.quantity > 0) {
        const avgCost = prev.cost / (prev.qty + t.quantity);
        prev.cost -= avgCost * t.quantity;
      }
    }
  });

  const portfolio: PortfolioItem[] = Object.entries(holdingsMap)
    .filter(([, v]) => v.qty > 0)
    .map(([symbol, v]) => {
      const currentPrice = prices[symbol]?.price || 0;
      const avgCost = v.qty > 0 ? v.cost / v.qty : 0;
      const marketValue = v.qty * currentPrice;
      const pnl = marketValue - v.cost;
      const pnlPercent = v.cost > 0 ? (pnl / v.cost) * 100 : 0;
      return { symbol, quantity: v.qty, avgCost, totalCost: v.cost, currentPrice, marketValue, pnl, pnlPercent };
    })
    .sort((a, b) => b.marketValue - a.marketValue);

  const stockValue = portfolio.reduce((s, p) => s + p.marketValue, 0);
  const totalAssets = cash + stockValue;
  const totalPnl = totalAssets - totalDeposits;
  const pnlPercent = totalDeposits > 0 ? (totalPnl / totalDeposits) * 100 : 0;

  if (!isConfigured) {
    return (
      <div className="animate-in">
        <div className="page-header">
          <h1 className="page-title">Tổng quan</h1>
        </div>
        <div className="connection-banner">
          <AlertCircle />
          <span>
            Chưa kết nối Firebase.{" "}
            <Link href="/settings">Cài đặt ngay →</Link>
          </span>
        </div>
        <div className="empty-state">
          <Wallet />
          <h3>Chào mừng đến Quản Lý Đầu Tư</h3>
          <p>Kết nối Firebase để bắt đầu theo dõi danh mục đầu tư của bạn</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Tổng quan</h1>
        <p className="page-subtitle">Danh mục đầu tư của bạn</p>
      </div>

      {/* Summary cards */}
      <div className="summary-grid">
        <div className="summary-card accent full-width">
          <div className="summary-label">
            <PieChart /> Tổng tài sản
          </div>
          <div className="summary-value">{formatVND(totalAssets)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            <Banknote /> Tiền mặt
          </div>
          <div className="summary-value">{formatVND(cash)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            <BarChart3 /> Giá trị CK
          </div>
          <div className="summary-value">{formatVND(stockValue)}</div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            {totalPnl >= 0 ? <TrendingUp /> : <TrendingDown />} Lãi/Lỗ
          </div>
          <div className={`summary-value ${totalPnl >= 0 ? "positive" : "negative"}`}>
            {formatVND(totalPnl)}
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-label">
            <TrendingUp /> Hiệu suất
          </div>
          <div className={`summary-value ${pnlPercent >= 0 ? "positive" : "negative"}`}>
            {formatPercent(pnlPercent)}
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <div className="section">
        <div className="section-header">
          <h2 className="section-title">Danh mục nắm giữ</h2>
          <span className="badge badge-accent">{portfolio.length} mã</span>
        </div>

        {portfolio.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <BarChart3 />
              <h3>Chưa có danh mục</h3>
              <p>Thêm giao dịch mua để bắt đầu</p>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "12px 16px" }}>
            {portfolio.map((p) => (
              <div key={p.symbol} className="portfolio-item">
                <div>
                  <div className="portfolio-symbol">{p.symbol}</div>
                  <div className="portfolio-detail">
                    SL: {p.quantity.toLocaleString("vi-VN")} · TB: {formatVND(p.avgCost)}
                  </div>
                </div>
                <div className="portfolio-value">
                  <div className="portfolio-price">{formatVND(p.marketValue)}</div>
                  <div
                    className="portfolio-pnl"
                    style={{ color: p.pnl >= 0 ? "var(--success)" : "var(--danger)" }}
                  >
                    {p.pnl >= 0 ? "+" : ""}{formatVND(p.pnl)} ({formatPercent(p.pnlPercent)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
