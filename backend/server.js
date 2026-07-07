import express from "express";
import cors from "cors";
import db from "./db.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// GET all alerts (optionally filter by status/severity/type)
app.get("/api/alerts", (req, res) => {
  const { status, severity, type } = req.query;
  let query = "SELECT * FROM alerts WHERE 1=1";
  const params = [];

  if (status) {
    query += " AND status = ?";
    params.push(status);
  }
  if (severity) {
    query += " AND severity = ?";
    params.push(severity);
  }
  if (type) {
    query += " AND type = ?";
    params.push(type);
  }
  query += " ORDER BY created_at DESC";

  const alerts = db.prepare(query).all(...params);
  res.json(alerts);
});

// GET single alert
app.get("/api/alerts/:id", (req, res) => {
  const alert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  res.json(alert);
});

// POST new alert
app.post("/api/alerts", (req, res) => {
  const { title, type, severity, location, latitude, longitude, description } = req.body;

  if (!title || !type || !severity || !location) {
    return res.status(400).json({ error: "title, type, severity, and location are required" });
  }
  const validSeverities = ["low", "medium", "high", "critical"];
  if (!validSeverities.includes(severity)) {
    return res.status(400).json({ error: `severity must be one of: ${validSeverities.join(", ")}` });
  }

  const stmt = db.prepare(`
    INSERT INTO alerts (title, type, severity, location, latitude, longitude, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    title,
    type,
    severity,
    location,
    latitude ?? null,
    longitude ?? null,
    description ?? null
  );

  const newAlert = db.prepare("SELECT * FROM alerts WHERE id = ?").get(result.lastInsertRowid);
  res.status(201).json(newAlert);
});

// PATCH update alert (e.g. resolve it, edit fields)
app.patch("/api/alerts/:id", (req, res) => {
  const existing = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Alert not found" });

  const fields = ["title", "type", "severity", "location", "latitude", "longitude", "description", "status"];
  const updates = {};
  for (const f of fields) {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  }

  const merged = { ...existing, ...updates };
  db.prepare(`
    UPDATE alerts SET title=?, type=?, severity=?, location=?, latitude=?, longitude=?, description=?, status=?
    WHERE id=?
  `).run(
    merged.title, merged.type, merged.severity, merged.location,
    merged.latitude, merged.longitude, merged.description, merged.status,
    req.params.id
  );

  const updated = db.prepare("SELECT * FROM alerts WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// DELETE alert
app.delete("/api/alerts/:id", (req, res) => {
  const result = db.prepare("DELETE FROM alerts WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Alert not found" });
  res.status(204).send();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Disaster Alert Network API running on http://localhost:${PORT}`);
});
