"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { formatVND } from "@/lib/format";
import { BarChart3, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

interface CurrentPrice {
  symbol?: string;
  price: number;
  updated_at: number;
}

export default function PricesPage() {
  const { db, isConfigured } = useFirebase();
  const [prices, setPrices] = useState<Record<string, CurrentPrice>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    const unsub = onValue(ref(db, "current_prices"), (snap) => {
      setPrices(snap.val() || {});
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  const entries = Object.entries(prices)
    .map(([symbol, data]) => ({ symbol, ...data }))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const formatTime = (ts: number) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (!isConfigured) {
    return (
      <div className="animate-in">
        <div className="page-header"><h1 className="page-title">Giá hiện tại</h1></div>
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
        <h1 className="page-title">Giá hiện tại</h1>
        <p className="page-subtitle">Dữ liệu từ bảng current_prices (chỉ đọc)</p>
      </div>

      {entries.length === 0 ? (
        <div className="empty-state">
          <BarChart3 />
          <h3>Chưa có dữ liệu giá</h3>
          <p>Bảng current_prices sẽ được cập nhật bởi ứng dụng bên ngoài</p>
        </div>
      ) : (
        <div className="list-container">
          {entries.map((p) => (
            <div key={p.symbol} className="list-item" style={{ cursor: "default" }}>
              <div className="list-item-content">
                <div className="list-item-title">{p.symbol}</div>
                <div className="list-item-subtitle">
                  <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                  {formatTime(p.updated_at)}
                </div>
              </div>
              <div className="list-item-value" style={{ color: "var(--accent)" }}>
                {formatVND(p.price)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <span className="badge badge-accent">
          <BarChart3 size={12} /> {entries.length} mã chứng khoán
        </span>
      </div>
    </div>
  );
}
