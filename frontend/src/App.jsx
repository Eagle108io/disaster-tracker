import React, { useEffect, useMemo, useState, useCallback } from "react";
import "./App.css";

const API = "https://disaster-tracker-api.onrender.com/api/alerts";

const SEVERITIES = ["critical", "high", "medium", "low"];
const TYPES = ["flood", "wildfire", "earthquake", "storm", "landslide", "other"];

const severityLabel = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low"
};

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso + "Z").getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function EmptyState({ onReset, filtered }) {
  return (
    <div className="empty-state">
      <div className="empty-glyph">◌</div>
      <p>{filtered ? "No alerts match these filters." : "No alerts reported yet."}</p>
      {filtered && (
        <button className="btn-ghost" onClick={onReset}>Clear filters</button>
      )}
    </div>
  );
}

function AlertForm({ onCreate, onClose }) {
  const [form, setForm] = useState({
    title: "",
    type: "flood",
    severity: "medium",
    location: "",
    latitude: "",
    longitude: "",
    description: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.location.trim()) {
      setError("Title and location are required.");
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        ...form,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create alert.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="modal-header">
          <h2>Report an Alert</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <label className="field">
          <span>Title</span>
          <input
            value={form.title}
            onChange={update("title")}
            placeholder="e.g. Flash Flood Warning"
            autoFocus
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Type</span>
            <select value={form.type} onChange={update("type")}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Severity</span>
            <select value={form.severity} onChange={update("severity")}>
              {SEVERITIES.map((s) => <option key={s} value={s}>{severityLabel[s]}</option>)}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Location</span>
          <input
            value={form.location}
            onChange={update("location")}
            placeholder="e.g. Klang Valley, Selangor"
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Latitude (optional)</span>
            <input value={form.latitude} onChange={update("latitude")} placeholder="3.0738" inputMode="decimal" />
          </label>
          <label className="field">
            <span>Longitude (optional)</span>
            <input value={form.longitude} onChange={update("longitude")} placeholder="101.5183" inputMode="decimal" />
          </label>
        </div>

        <label className="field">
          <span>Description (optional)</span>
          <textarea
            value={form.description}
            onChange={update("description")}
            rows={3}
            placeholder="What's happening, what should people do?"
          />
        </label>

        {error && <div className="form-error">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Broadcasting…" : "Broadcast alert"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AlertCard({ alert, onResolve, onDelete }) {
  const isActive = alert.status === "active";
  return (
    <li className={`alert-card sev-${alert.severity} ${!isActive ? "resolved" : ""}`}>
      <div className="alert-severity-bar" />
      <div className="alert-body">
        <div className="alert-top">
          <span className="alert-badge">
            {isActive && <span className="dot" />}
            {isActive ? severityLabel[alert.severity] : "Resolved"}
          </span>
          <span className="alert-type">{alert.type}</span>
          <span className="alert-time">{timeAgo(alert.created_at)}</span>
        </div>
        <h3 className="alert-title">{alert.title}</h3>
        <div className="alert-location">
          <span>📍 {alert.location}</span>
          {alert.latitude != null && alert.longitude != null && (
            <span className="coords">{alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}</span>
          )}
        </div>
        {alert.description && <p className="alert-desc">{alert.description}</p>}
        <div className="alert-actions">
          {isActive && (
            <button className="btn-ghost small" onClick={() => onResolve(alert.id)}>Mark resolved</button>
          )}
          <button className="btn-ghost small danger" onClick={() => onDelete(alert.id)}>Delete</button>
        </div>
      </div>
    </li>
  );
}

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [severityFilter, setSeverityFilter] = useState("all");

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (severityFilter !== "all") params.set("severity", severityFilter);
      const res = await fetch(`${API}?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load alerts");
      setAlerts(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async (payload) => {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to create alert");
    }
    await fetchAlerts();
  };

  const resolveAlert = async (id) => {
    await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "resolved" })
    });
    fetchAlerts();
  };

  const deleteAlert = async (id) => {
    if (!confirm("Delete this alert permanently?")) return;
    await fetch(`${API}/${id}`, { method: "DELETE" });
    fetchAlerts();
  };

  const activeCount = useMemo(
    () => alerts.filter((a) => a.status === "active").length,
    [alerts]
  );
  const criticalCount = useMemo(
    () => alerts.filter((a) => a.status === "active" && a.severity === "critical").length,
    [alerts]
  );

  const resetFilters = () => { setStatusFilter("active"); setSeverityFilter("all"); };
  const isFiltered = statusFilter !== "active" || severityFilter !== "all";

  return (
    <div className="app">
      <header className="header">
        <div className="header-sweep" />
        <div className="header-inner">
          <div className="wordmark">
            <span className="wordmark-dot" />
            SIGNAL
            <span className="wordmark-sub">Disaster Alert Network</span>
          </div>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-value">{activeCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat critical">
              <span className="stat-value">{criticalCount}</span>
              <span className="stat-label">Critical</span>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              + Report Alert
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="filters">
          <div className="filter-group">
            <label>Status</label>
            <div className="pill-group">
              {["active", "resolved", "all"].map((s) => (
                <button
                  key={s}
                  className={`pill ${statusFilter === s ? "active" : ""}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label>Severity</label>
            <div className="pill-group">
              <button
                className={`pill ${severityFilter === "all" ? "active" : ""}`}
                onClick={() => setSeverityFilter("all")}
              >
                all
              </button>
              {SEVERITIES.map((s) => (
                <button
                  key={s}
                  className={`pill sev-${s} ${severityFilter === s ? "active" : ""}`}
                  onClick={() => setSeverityFilter(s)}
                >
                  {severityLabel[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="banner-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading feed…</div>
        ) : alerts.length === 0 ? (
          <EmptyState onReset={resetFilters} filtered={isFiltered} />
        ) : (
          <ul className="alert-list">
            {alerts.map((a) => (
              <AlertCard key={a.id} alert={a} onResolve={resolveAlert} onDelete={deleteAlert} />
            ))}
          </ul>
        )}
      </main>

      {showForm && <AlertForm onCreate={createAlert} onClose={() => setShowForm(false)} />}
    </div>
  );
}
