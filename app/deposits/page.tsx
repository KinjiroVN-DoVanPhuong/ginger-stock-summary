"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, push, onValue, remove } from "firebase/database";
import { formatVND, formatDate } from "@/lib/format";
import { Plus, Trash2, Wallet, AlertCircle, X } from "lucide-react";
import Link from "next/link";

interface Deposit {
  amount: number;
  date: string;
  note: string;
  created_at: number;
}

export default function DepositsPage() {
  const { db, isConfigured } = useFirebase();
  const [deposits, setDeposits] = useState<Record<string, Deposit>>({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(ref(db, "deposits"), (snap) => {
      setDeposits(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const handleSubmit = async () => {
    if (!db || !amount) return;
    await push(ref(db, "deposits"), {
      amount: parseFloat(amount),
      date,
      note: note.trim(),
      created_at: Date.now(),
    });
    setAmount("");
    setNote("");
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (confirm("Xoá khoản nạp này?")) {
      await remove(ref(db, `deposits/${id}`));
    }
  };

  const entries = Object.entries(deposits)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => {
      const dc = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dc !== 0) return dc;
      return b.created_at - a.created_at;
    });

  const totalDeposits = entries.reduce((s, d) => s + d.amount, 0);

  if (!isConfigured) {
    return (
      <div className="animate-in">
        <div className="page-header"><h1 className="page-title">Nạp tiền</h1></div>
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
        <h1 className="page-title">Nạp tiền</h1>
        <p className="page-subtitle">Quản lý tiền nạp vào tài khoản</p>
      </div>

      <div className="total-bar">
        <span className="total-bar-label">Tổng đã nạp</span>
        <span className="total-bar-value">{formatVND(totalDeposits)}</span>
      </div>

      {!showForm && (
        <button className="btn btn-primary btn-full" onClick={() => setShowForm(true)} style={{ marginBottom: 20 }}>
          <Plus size={18} /> Nạp thêm tiền
        </button>
      )}

      {showForm && (
        <div className="form-card animate-in">
          <div className="card-header">
            <span className="card-title">Nạp tiền mới</span>
            <button className="delete-btn" onClick={() => setShowForm(false)}><X /></button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Số tiền (VND)</label>
              <input className="form-input" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="10000000" inputMode="numeric" />
            </div>
            <div className="form-group">
              <label className="form-label">Ngày</label>
              <input className="form-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="form-group full-width">
              <label className="form-label">Ghi chú</label>
              <input className="form-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Nạp qua VCB" />
            </div>
          </div>
          <button className="btn btn-primary btn-full" onClick={handleSubmit} disabled={!amount} style={{ marginTop: 16 }}>
            Xác nhận nạp tiền
          </button>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="empty-state">
          <Wallet />
          <h3>Chưa có khoản nạp nào</h3>
          <p>Nhấn nút bên trên để nạp tiền</p>
        </div>
      ) : (
        <div className="list-container">
          {entries.map((d) => (
            <div key={d.id} className="list-item">
              <div className="list-item-content">
                <div className="list-item-title">
                  <Wallet size={16} style={{ color: "var(--accent)" }} />
                  {formatVND(d.amount)}
                </div>
                <div className="list-item-subtitle">
                  {formatDate(d.date)}{d.note ? ` · ${d.note}` : ""}
                </div>
              </div>
              <button className="delete-btn" onClick={() => handleDelete(d.id)}><Trash2 /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
