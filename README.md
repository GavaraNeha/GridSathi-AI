# GridSathi AI — EV Microgrid Scheduling & OpenStreetMap Discovery Platform

**HackWithAditya 2026 · Energy, EV & Sustainability**

GridSathi AI is an interactive, software-only EV charging station discovery and microgrid load orchestration platform for India. It combines real-world community-mapped EV charging discovery with an intelligent microgrid scheduling engine that balances transformer capacity limits, multi-bay allocations, and solar canopy generation.

**100% Free & Open-Source:** Uses Leaflet, OpenStreetMap, Nominatim, and the Overpass API. **No Google Cloud account, no API keys, and no billing setups required.**

---

## Architecture Overview

1. **Frontend (React + Vite + Leaflet)**:
   - Modern dark EV cyber dashboard (`http://localhost:5173`).
   - Interactive Leaflet map with custom SVG charging station pin markers and OpenStreetMap tile rendering.
   - India-wide city and locality search with debounced autocomplete.
   - Station cards displaying operator brand, bay capacity, address, and directions links.
   - Hero metrics: Discovered stations, transformer capacity ceiling, active smart bays, engine test audit.

2. **Backend (Python FastAPI)**:
   - Asynchronous endpoints on `http://localhost:8000`:
     - `GET /api/health` — Service health and provider status (`OpenStreetMap`).
     - `GET /api/config` — Public configuration indicating zero-key mode.
     - `GET /api/locations?q=` — India-wide city suggestions via Nominatim and local pre-seeded registry.
     - `GET /api/stations?city=` — Real EV charging stations via Overpass API (`amenity=charging_station`).
     - `GET /api/stations/sample` — Verified offline historical sample data.
   - Built-in in-memory LRU caching (TTL: 24h for geocodes, 1h for stations) to respect OSM usage policies.
   - Request throttling and IP rate limiting (60 req/min).

3. **Microgrid Scheduling Engine (`engine.js`)**:
   - 3 scheduling algorithms: Slack-Priority GridSathi Heuristic, Earliest Deadline First (EDF), First Come First Served (FCFS).
   - 10 discrete 30-minute time slots (5-hour simulation window: 10:00 to 15:00).
   - Transformer ceiling constraints (7–21 kW configurable).
   - Disruption controls: Charger 2 fault, grid brownout, emergency vehicle arrival, solar surplus wave.
   - Feasibility audit with mathematical necessary condition checks.
   - 48 automated test configurations verifying zero capacity violations, bay limits, and energy conservation.

---

## Quick Start (Run Locally)

### 1. Start the FastAPI Backend
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open interactive Swagger API docs at `http://localhost:8000/docs`.

### 2. Start the React Frontend
```bash
cd frontend
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Preserved Legacy Prototype Fallback
The original vanilla prototype remains 100% operational and served directly by the backend:
Open `http://localhost:8000/index.html` or `python -m http.server 8000`.

---

## Automated Test Suites

### 1. Microgrid Scheduling Invariant Tests (48 Scenarios)
```bash
node tests/test_engine.js
```
*Output: `PASS: 48 configurations × capacity, bay, energy, deadline and conservation checks`*

### 2. FastAPI Backend Test Suite (9 Tests)
```bash
python -m unittest tests/test_backend.py
```
*Output: `Ran 9 tests ... OK`*

### 3. Frontend Production Build
```bash
cd frontend
npm run build
```
*Output: `✓ built in ~15s`*

---

## Important Disclaimers

1. **Software Simulation**: The charging schedule, bay allocations, queue management, and electrical costs are modeled by a deterministic heuristic simulation. There is no physical hardware connection to real charging stations.
2. **OpenStreetMap Data**: Station listings represent real-world locations mapped by community OpenStreetMap contributors. Live occupancy, real-time bay availability, queue lengths, and actual charging tariffs are not provided by charge point operators.
3. **Usage Policy**: The backend respects the OSM Nominatim and Overpass public server usage policies by implementing request throttling, User-Agent identification, and in-memory response caching.

---

## File Structure

```text
GridSathi-AI/
├── backend/
│   ├── main.py                    # FastAPI application (OpenStreetMap & Overpass)
│   └── server.py                  # Preserved fallback HTTP server
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LeafletMapView.jsx # Interactive Leaflet + OSM map canvas
│   │   │   ├── Navbar.jsx         # Top navigation and status bar
│   │   │   ├── SearchBar.jsx      # India-wide search with autocomplete
│   │   │   ├── StationCard.jsx    # Station details, operator tags, directions
│   │   │   ├── StationList.jsx    # Filtered station listing and empty states
│   │   │   └── StatusBanner.jsx   # Transparency and attribution disclaimers
│   │   ├── services/
│   │   │   └── api.js             # API client service layer
│   │   ├── App.jsx                # Main dashboard layout
│   │   ├── index.css              # Dark EV cyber styles and OSM tile filters
│   │   └── main.jsx               # React entry point
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── verified_station_examples.json
├── docs/
├── tests/
│   ├── test_backend.py            # Automated tests for FastAPI backend
│   └── test_engine.js             # Automated tests for 48 scheduling scenarios
├── .env.example                   # Zero-key configuration template
├── .gitignore                     # Git exclusions
├── app.js                         # Preserved original UI controller
├── engine.js                      # Preserved microgrid scheduling engine
├── index.html                     # Preserved original single-page UI
├── README.md                      # Documentation
├── stations.js                    # Preserved original location script
└── styles.css                     # Preserved original styles
```
