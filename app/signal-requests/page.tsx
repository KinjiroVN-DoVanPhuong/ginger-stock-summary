"use client";

import { useState, useEffect } from "react";
import { useFirebase } from "@/lib/firebase";
import { ref, push, onValue, remove, update } from "firebase/database";
import { Plus, Trash2, CheckCircle, Clock, PlayCircle } from "lucide-react";

interface SignalRequest {
  id: string;
  create_at: string;
  request_date: string;
  status: "request" | "running" | "completed";
}

export default function SignalRequestsPage() {
  const { db, isConfigured } = useFirebase();
  const [requests, setRequests] = useState<SignalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    request_date: new Date().toISOString().split("T")[0],
    status: "request" as const,
  });

  useEffect(() => {
    if (!db || !isConfigured) {
      setLoading(false);
      return;
    }

    const reqRef = ref(db, "trading_signal_request");
    const unsubscribe = onValue(reqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reqList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        // Sort by create_at descending
        reqList.sort((a, b) => new Date(b.create_at).getTime() - new Date(a.create_at).getTime());
        setRequests(reqList);
      } else {
        setRequests([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, isConfigured]);

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    try {
      const reqRef = ref(db, "trading_signal_request");
      await push(reqRef, {
        create_at: new Date().toISOString(),
        request_date: formData.request_date,
        status: formData.status,
      });
      setFormData({
        request_date: new Date().toISOString().split("T")[0],
        status: "request",
      });
    } catch (error) {
      console.error("Error adding request", error);
      alert("Failed to add request");
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    if (confirm("Are you sure you want to delete this request?")) {
      try {
        await remove(ref(db, `trading_signal_request/${id}`));
      } catch (error) {
        console.error("Error deleting request", error);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!db) return;
    try {
      const reqRef = ref(db, `trading_signal_request/${id}`);
      await update(reqRef, { status: newStatus });
    } catch (error) {
      console.error("Error updating status", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "request":
        return <span className="badge badge-warning"><Clock size={12} style={{ marginRight: '4px' }} /> Request</span>;
      case "running":
        return <span className="badge badge-primary"><PlayCircle size={12} style={{ marginRight: '4px' }} /> Running</span>;
      case "completed":
        return <span className="badge badge-success"><CheckCircle size={12} style={{ marginRight: '4px' }} /> Completed</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  if (!isConfigured) {
    return (
      <div className="card">
        <h2>Please configure Firebase first to view signal requests.</h2>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Signal Requests</h1>
      </div>

      <div className="grid-cols-3" style={{ gridTemplateColumns: "1fr 2fr" }}>
        <div className="card" style={{ height: "fit-content" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>New Request</h2>
          <form onSubmit={handleAddRequest}>
            <div className="input-group">
              <label>Request Date</label>
              <input
                type="date"
                name="request_date"
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div className="input-group">
              <label>Initial Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="input-field"
              >
                <option value="request">Request</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "0.5rem" }}>
              <Plus size={16} /> Create Request
            </button>
          </form>
        </div>

        <div className="card">
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1rem" }}>Requests List</h2>
          {loading ? (
            <p>Loading...</p>
          ) : requests.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No requests found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Created At</th>
                    <th>Request Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id}>
                      <td>{new Date(req.create_at).toLocaleString()}</td>
                      <td>{req.request_date}</td>
                      <td>
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value)}
                          className="input-field"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem", borderRadius: "0.25rem", minWidth: "120px" }}
                        >
                          <option value="request">Request</option>
                          <option value="running">Running</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleDelete(req.id)}
                          style={{ background: "transparent", border: "none", color: "var(--danger)", cursor: "pointer", padding: "0.25rem" }}
                          title="Delete Request"
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
