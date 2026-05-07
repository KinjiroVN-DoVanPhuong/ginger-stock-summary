"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, push, onValue, remove } from "firebase/database";
import { formatVND, formatDate } from "@/lib/format";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  AlertCircle,
  X,
} from "lucide-react";
import Link from "next/link";

interface Transaction {
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
  note: string;
  created_at: number;
}

export default function TransactionsPage() {
  const { db, isConfigured } = useFirebase();
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [showForm, setShowForm] = useState(false);
  const [filterSymbol, setFilterSymbol] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Form state
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(ref(db, "transactions"), (snap) => {
      setTransactions(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleSubmit = async () => {
    if (!db || !symbol || !quantity || !price) return;
    await push(ref(db, "transactions"), {
      symbol: symbol.toUpperCase().trim(),
      type,
      quantity: parseFloat(quantity),
      price: parseFloat(price),
      date,
      note: note.trim(),
      created_at: Date.now(),
    });
    // Reset form
    setSymbol("");
    setQuantity("");
    setPrice("");
    setNote("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (confirm("Xoá giao dịch này?")) {
      await remove(ref(db, `transactions/${id}`));
    }
  };

  const txEntries = Object.entries(transactions)
    .map(([id, tx]) => ({ id, ...tx }))
    .filter((tx) => filterSymbol === "all" || tx.symbol === filterSymbol)
    .sort((a, b) => {
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) return dateCompare;
      return b.created_at - a.created_at;
    });

  const symbols = [...new Set(Object.values(transactions).map((t) => t.symbol))].sort();

  if (!isConfigured) {
    return (
      <div className="animate-in">
        <div className="page-header"><h1 className="page-title">Giao dịch</h1></div>
        <div className="connection-banner">
          <AlertCircle />
          <span>Chưa kết nối Firebase. <Link href="/settings">Cài đặt ngay →</Link></span>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Giao dịch</h1>
        <p className="page-subtitle">Quản lý lệnh mua và bán</p>
      </div>

      {/* Add button */}
      {!showForm && (
        <button
          className="btn btn-primary btn-full"
          onClick={() => setShowForm(true)}
          style={{ marginBottom: 20 }}
        >
          <Plus size={18} /> Thêm giao dịch
        </button>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-card animate-in">
          <div className="card-header">
            <span className="card-title">Giao dịch mới</span>
            <button className="delete-btn" onClick={() => setShowForm(false)}>
              <X />
            </button>
          </div>

          {/* Buy/Sell toggle */}
          <div className="form-group" style={{ marginBottom: 12 }}>
            <div className="type-toggle">
              <button
                className={`type-btn${type === "buy" ? " active-buy" : ""}`}
                onClick={() => setType("buy")}
              >
                ↑ Mua
              </button>
              <button
                className={`type-btn${type === "sell" ? " active-sell" : ""}`}
                onClick={() => setType("sell")}
              >
                ↓ Bán
              </button>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Mã CK</label>
              <input
                className="form-input"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="VD: VNM"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày</label>
              <input
                className="form-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Số lượng</label>
              <input
                className="form-input"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="100"
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Giá (VND)</label>
              <input
                className="form-input"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="50000"
                inputMode="numeric"
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Ghi chú</label>
              <input
                className="form-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tuỳ chọn"
              />
            </div>
          </div>

          <button
            className={`btn btn-full ${type === "buy" ? "btn-success" : "btn-danger"}`}
            onClick={handleSubmit}
            disabled={!symbol || !quantity || !price}
            style={{ marginTop: 16 }}
          >
            {type === "buy" ? "Xác nhận Mua" : "Xác nhận Bán"}
          </button>
        </div>
      )}

      {/* Filter */}
      {symbols.length > 1 && (
        <div className="filter-bar">
          <button
            className={`filter-chip${filterSymbol === "all" ? " active" : ""}`}
            onClick={() => setFilterSymbol("all")}
          >
            Tất cả
          </button>
          {symbols.map((s) => (
            <button
              key={s}
              className={`filter-chip${filterSymbol === s ? " active" : ""}`}
              onClick={() => setFilterSymbol(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Transaction list */}
      {txEntries.length === 0 ? (
        <div className="empty-state">
          <ArrowLeftRight />
          <h3>Chưa có giao dịch</h3>
          <p>Nhấn nút bên trên để thêm giao dịch mới</p>
        </div>
      ) : (
        <div className="list-container">
          {txEntries.map((tx) => (
            <div key={tx.id} className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">
                  <span className={`badge ${tx.type === "buy" ? "badge-buy" : "badge-sell"}`}>
                    {tx.type === "buy" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {tx.type === "buy" ? "Mua" : "Bán"}
                  </span>
                  {tx.symbol}
                </div>
                <div className="list-item-subtitle">
                  {formatDate(tx.date)} · SL: {tx.quantity.toLocaleString("vi-VN")} × {formatVND(tx.price)}
                  {tx.note ? ` · ${tx.note}` : ""}
                </div>
                <div className="list-item-subtitle" style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                  {tx.type === "buy"
                    ? `Phí: ${formatVND(tx.quantity * tx.price * 0.0025)} (0.25%)`
                    : `Phí: ${formatVND(tx.quantity * tx.price * 0.0025)} (0.25%) · Thuế: ${formatVND(tx.quantity * tx.price * 0.001)} (0.1%)`}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="list-item-value">
                  <div style={{ color: tx.type === "buy" ? "var(--danger)" : "var(--success)" }}>
                    {tx.type === "buy" ? "-" : "+"}{formatVND(tx.quantity * tx.price)}
                  </div>
                  <div style={{ fontSize: "0.6875rem", color: "var(--text-tertiary)" }}>
                    Thực: {tx.type === "buy"
                      ? formatVND(tx.quantity * tx.price * 1.0025)
                      : formatVND(tx.quantity * tx.price * (1 - 0.0025 - 0.001))}
                  </div>
                </div>
                <button className="delete-btn" onClick={() => handleDelete(tx.id)}>
                  <Trash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
