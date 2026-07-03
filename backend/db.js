import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "alerts.db"));

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')),
    location TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','resolved')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed a couple of example alerts on first run
const count = db.prepare("SELECT COUNT(*) AS c FROM alerts").get().c;
if (count === 0) {
  const seed = db.prepare(`
    INSERT INTO alerts (title, type, severity, location, latitude, longitude, description)
    VALUES (@title, @type, @severity, @location, @latitude, @longitude, @description)
  `);
  const examples = [
    {
      title: "Flash Flood Warning",
      type: "flood",
      severity: "high",
      location: "Klang Valley, Selangor",
      latitude: 3.0738,
      longitude: 101.5183,
      description: "Heavy rainfall causing rapid water level rise near the Klang River."
    },
    {
      title: "Wildfire Spreading Near Ridge Trail",
      type: "wildfire",
      severity: "critical",
      location: "Angeles National Forest, CA",
      latitude: 34.2367,
      longitude: -118.0567,
      description: "Fast-moving wildfire, evacuation orders issued for nearby residential zones."
    }
  ];
  const insertMany = db.transaction((rows) => rows.forEach((r) => seed.run(r)));
  insertMany(examples);
}

export default db;
