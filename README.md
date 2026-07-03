# Signal — Disaster Alert Network

A full-stack app for reporting and tracking disaster alerts.

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`), persisted to `backend/alerts.db`

## Project structure

```
disaster-alert-network/
├── backend/
│   ├── server.js      # Express API
│   ├── db.js           # SQLite setup + seed data
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    └── package.json
```

## Running it locally

You'll need Node.js 18+ installed.

### 1. Start the backend

```bash
cd backend
npm install
npm start
```

This starts the API on `http://localhost:4000` and creates `alerts.db` with a couple of seed alerts on first run.

### 2. Start the frontend (in a new terminal)

```bash
cd frontend
npm install
npm run dev
```

This starts the app on `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend, so no extra config is needed.

Open `http://localhost:5173` in your browser.

## API reference

| Method | Endpoint            | Description                          |
|--------|----------------------|---------------------------------------|
| GET    | `/api/alerts`         | List alerts (`?status=`, `?severity=`, `?type=` filters) |
| GET    | `/api/alerts/:id`     | Get a single alert                    |
| POST   | `/api/alerts`         | Create an alert                       |
| PATCH  | `/api/alerts/:id`     | Update an alert (e.g. resolve it)     |
| DELETE | `/api/alerts/:id`     | Delete an alert                       |
| GET    | `/api/health`         | Health check                          |

### Alert fields

```json
{
  "title": "Flash Flood Warning",
  "type": "flood",
  "severity": "high",       // low | medium | high | critical
  "location": "Klang Valley, Selangor",
  "latitude": 3.0738,        // optional
  "longitude": 101.5183,     // optional
  "description": "...",      // optional
  "status": "active"         // active | resolved
}
```

## Notes

- The frontend defaults to showing **active** alerts; use the filter pills to view resolved or all alerts, and filter by severity.
- To reset the database, stop the backend and delete `backend/alerts.db` (and `.db-wal` / `.db-shm` if present) — it will reseed on next start.
- For production, build the frontend with `npm run build` (outputs to `frontend/dist`) and serve it from your host of choice, pointing `VITE`-proxied `/api` calls at your deployed backend URL.
