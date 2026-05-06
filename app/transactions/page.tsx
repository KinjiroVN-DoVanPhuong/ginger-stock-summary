"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, push, onValue, remove, set } from "firebase/database";
import { Plus, Trash2, TrendingDown, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  symbol: string;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  date: string;
}

export default function TransactionsPage() {
  const { db, isConfigured } = useFirebase();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    symbol: "",
    type: "buy",
    price: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!db || !isConfigured) {
      setLoading(false);
      return;
    }

    const txRef = ref(db, "transactions");
    const unsubscribe = onValue(txRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const txList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by date descending
        txList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(txList);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, isConfigured]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      const txRef = ref(db, "transactions");
      await push(txRef, {
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        price: parseFloat(formData.price),
        quantity: parseFloat(formData.quantity),
        date: formData.date,
        createdAt: Date.now(),
      });
      setFormData({
        symbol: "",
        type: "buy",
        price: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error adding transaction", error);
      alert("Failed to add transaction");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (confirm("Are you sure you want to delete this transaction?")) {
      try {
        await remove(ref(db, `transactions/${id}`));
      } catch (error) {
        console.error("Error deleting transaction", error);
      }
    }
  };

  const calculatePerformance = () => {
    // Basic performance calculation: Total cost of buys vs Total revenue of sells
    // Note: A real app would calculate current value based on live prices
    let totalInvested = 0;
    let totalRealized = 0;

    transactions.forEach((tx) => {
      const amount = tx.price * tx.quantity;
      if (tx.type === "buy") totalInvested += amount;
      if (tx.type === "sell") totalRealized += amount;
    });

    return { totalInvested, totalRealized, net: totalRealized - totalInvested };
  };

  const perf = calculatePerformance();

  if (!isConfigured) {
    return (
      <div className="card">
        <h2>Please configure Firebase first to view transactions.</h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Transactions</h1>
      </div>

      <div className="grid-cols-3 mb-4">
        <div className="card glass-panel">
          <h3 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Invested</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>${perf.totalInvested.toFixed(2)}</p>
        </div>
        <div className="card glass-panel">
          <h3 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Total Realized</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700 }}>${perf.totalRealized.toFixed(2)}</p>
        </div>
        <div className="card glass-panel">
          <h3 style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem" }}>Net Cashflow</h3>
          <p style={{ fontSize: "1.5rem", fontWeight: 700, color: perf.net >= 0 ? "var(--success)" : "var(--danger)" }}>
            ${perf.net.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid-cols-3" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="card" style={{ height: "fit-content" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Add Transaction</h2>
          <form onSubmit={handleAddTransaction}>
            <div className="input-group">
              <label>Symbol</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                className="input-field"
                placeholder="AAPL"
                required
              />
            </div>
            <div className="input-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input-field"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>
            <div className="grid-cols-2">
              <div className="input-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input
                  type="number"
                  step="any"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="input-field"
                  required
                />
              </div>
            </div>
            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              <Plus size={16} /> Add
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Transaction History</h2>
          {loading ? (
            <p>Loading...</p>
          ) : transactions.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No transactions found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Symbol</th>
                    <th>Type</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.date}</td>
                      <td style={{ fontWeight: 600 }}>{tx.symbol}</td>
                      <td>
                        <span className={`badge ${tx.type === "buy" ? "badge-success" : "badge-danger"}`}>
                          {tx.type === "buy" ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                          {tx.type}
                        </span>
                      </td>
                      <td>${tx.price.toFixed(2)}</td>
                      <td>{tx.quantity}</td>
                      <td style={{ fontWeight: 500 }}>${(tx.price * tx.quantity).toFixed(2)}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "0.25rem" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
