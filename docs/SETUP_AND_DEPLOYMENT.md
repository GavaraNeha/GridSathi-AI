# GridSathi AI — Local Setup, Verification & Cloud Deployment Guide

This guide details instructions for running GridSathi AI locally, executing the automated test suite, and deploying the application to production cloud environments.

---

## 1. Prerequisites

* **Python:** 3.10 or higher (tested on Python 3.11 and 3.14)
* **Node.js:** 18 or higher (tested on Node.js 20 and 24)
* **Git:** Standard git client

---

## 2. Local Backend Setup (FastAPI)

```bash
# 1. Clone repository
git clone https://github.com/GavaraNeha/GridSathi-AI.git
cd GridSathi-AI

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start FastAPI development server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI documentation is live at `http://127.0.0.1:8000/docs`.

---

## 3. Local Frontend Setup (React 19 + Vite 6)

```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

---

## 4. Automated Verification & Test Commands

Run the full verification suite to reproduce all algorithmic proofs, range math, and full-stack invariants:

```bash
# 1. Dual Engine Parity & Invariant Tests (96 Scenarios)
node tests/test_simulation_engine.js

# 2. Scheduling Engine Invariants (48 Configurations)
node tests/test_engine.js

# 3. Charge Rescue & Journey Intelligence Test Suite (8 Test Suites / 35 Assertions)
node tests/test_journey_engine.js

# 4. Multi-Scenario Algorithmic Benchmark (8 Scenarios x 3 Policies)
node tests/benchmark_algorithms.js

# 5. Backend Unit Tests with Spatial Grid & Overpass Mocks (23 Tests)
python -m unittest tests/test_backend.py

# 6. Frontend Production Build
npm --prefix frontend run build
```

All 23 backend tests, 96 dual-engine scenarios, 48 invariants, and 8 journey engine test suites pass with **zero warnings and zero failures**.

---

## 5. Production Cloud Deployment Guide

GridSathi AI is actively deployed across two free-tier cloud environments:

### Frontend Production Deployment (Vercel)
* **Live Production URL:** [https://grid-sathi-ai.vercel.app/](https://grid-sathi-ai.vercel.app/)
* **Framework Preset:** `Vite`
* **Root Directory:** `frontend`
* **Build Command:** `npm run build` (or `vite build`)
* **Output Directory:** `dist`
* **Environment Variable:**
  * `VITE_API_BASE_URL` = `https://gridsathi-backend.onrender.com` (pointed to live Render backend; no trailing slash).
* **Routing Rewrites:** Configured in `frontend/vercel.json` for client-side SPA routing (`/(.*) -> /`).

### Backend Production Deployment (Render)
* **Live Production Service:** [https://gridsathi-backend.onrender.com](https://gridsathi-backend.onrender.com)
* **Health Endpoint:** [https://gridsathi-backend.onrender.com/api/health](https://gridsathi-backend.onrender.com/api/health)
* **Environment:** `Python 3.11`
* **Root Directory:** Repository root (`.`)
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:**
  * `PYTHON_VERSION`: `3.11.0`
  * `CORS_ORIGINS`: Optional list of custom domains (regex `allow_origin_regex=r"https://.*\.vercel\.app"` in `backend/main.py` automatically authorizes all Vercel domains).

> [!IMPORTANT]
> **Port Configuration on Render**: Do **NOT** manually set `PORT=8000` in the Render dashboard environment variables. Render dynamically injects its own `$PORT` variable into the container. The start command `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` automatically binds to Render's allocated port.

---

## Related Documentation
* [Project Overview & Requirements](PROJECT_OVERVIEW.md)
* [Architecture & Data Flow](ARCHITECTURE.md)
* [Algorithms & Mathematical Formulations](ALGORITHMS.md)
* [Empirical Performance Benchmarks](BENCHMARKS.md)
* [Competitive Positioning](COMPETITIVE_POSITIONING.md)
* [Validation, Transparency Matrix & Limitations](VALIDATION_AND_LIMITATIONS.md)
