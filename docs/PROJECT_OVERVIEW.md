# GridSathi AI — Project Overview & Requirements Matrix

**HackWithAditya 2026 · Energy, EV & Sustainability Submission (Track 04)**<br>
*A disruption-aware, transparent EV charging orchestration, journey rescue, and open discovery platform for power-constrained campuses and microgrids across India.*

---

## 1. Executive Overview & Mission

GridSathi AI addresses two interconnected bottlenecks facing India's accelerating EV transition: **unreliable public charging discovery** and **severe electrical grid bottlenecking** when multiple EVs charge concurrently at transformer-constrained campuses, fleet depots, and commercial microgrids.

The application connects open geospatial station mapping, driver-side battery budgeting, and behind-the-meter microgrid scheduling in one unified, 100% free and open-source platform.

```
                                      ┌─────────────────────────────────────────────────────────┐
                                      │                     GRIDSATHI AI                        │
                                      │       Tri-View Navigation Architecture (App.jsx)        │
                                      └────────────────────────────┬────────────────────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┼─────────────────────────────────────────────┐
                    ▼                                              ▼                                             ▼
  ┌───────────────────────────────────┐          ┌───────────────────────────────────┐         ┌───────────────────────────────────┐
  │         1. EV DISCOVERY           │          │         2. CHARGE RESCUE          │         │       3. MICROGRID SIMULATOR      │
  ├───────────────────────────────────┤          ├───────────────────────────────────┤         ├───────────────────────────────────┤
  │ • 28,553 authentic Indian stations│          │ • 10 Indian EV presets (Cars & 2W)│         │ • 3-bay microgrid load simulation │
  │ • 0.1° spatial grid (8,129 cells) │          │ • Usable energy & safety buffer   │         │ • Smart Slack vs. EDF vs. FCFS    │
  │ • Sub-ms Haversine proximity      │          │ • Conservative vs. nominal range  │         │ • 7 kW bay & 14 kW grid limits    │
  │ • CartoDB Voyager Leaflet map     │          │ • "Route unverified" transparency │         │ • Solar canopy (+4 kW) & faults   │
  │ • GPS Near Me & 16 pre-seeded hubs│          │ • Truthful connector compatibility│         │ • Explainable Disruption Replay   │
  │ • One-click simulation hand-off   │          │ • Dynamic What-If advice engine   │         │ • Engineering Feasibility Analysis│
  └─────────────────┬─────────────────┘          └─────────────────┬─────────────────┘         └─────────────────▲─────────────────┘
                    │                                              │                                             │
                    └─────────────────── "Simulate Charging Here" ─┴─────────────────────────────────────────────┘
                                                (SiteContextBanner Transfer)
```

---

## 2. The Three Operational Modules

### Module 1: EV Discovery (Nationwide Open Infrastructure)
* **28,553 Authentic Mapped Stations:** Mapped open-data charging station records across 4,251 Indian cities and towns, curated under ODbL / CC-BY 4.0.
* **In-Memory 0.1° Spatial Grid:** Partitions India's landmass into 8,129 spatial cells, delivering sub-millisecond bounding-box and Haversine proximity queries.
* **GPS Near Me & Pre-Seeded Metropolises:** Zero-latency offline coordinate resolution for 16 major Indian cities (Hyderabad, Bengaluru, Delhi, Mumbai, Chennai, Pune, Kochi, etc.) with Nominatim live fallback.
* **Interactive Leaflet Canvas:** Fast DC chargers, Slow AC points, and Two-Wheeler stations rendered with distinct visual markers and Google Maps directions links.
* **Simulation Hand-off:** One-click transfer of real station coordinates and operator branding to the microgrid simulator via `SiteContextBanner`.

### Module 2: Charge Rescue (Grounded Journey & Range Intelligence)
* **Authentic Indian EV Presets:** Ten factory specifications spanning passenger cars (Tata Nexon EV, Tiago EV, MG ZS EV, BYD Atto 3, Mahindra XUV400) and electric two-wheelers (Ather 450X, Ola S1 Pro, TVS iQube, Bajaj Chetak, Hero Vida V1).
* **Deterministic Battery Range Modeling:** Calculates usable energy from current State of Charge (SOC) while deducting a configurable Safety Reserve Buffer (5–25%) to prevent battery exhaustion.
* **Truthful Reachability Claims:** Clearly distinguishes straight-line distance, estimated road distance (using an empirical 1.30× Haversine circuity factor), and verified turn-by-turn routing. Displays prominent notices: `"Estimated within range — route unverified"`.
* **Connector Compatibility Audit:** Evaluates connector format matching while explicitly flagging operational scooter charging nuances (e.g., portable 3-pin adapter requirements, proprietary protocols).
* **Explainable What-If Advisor:** Dynamically computes actionable adjustments (e.g. lowering target SOC to save energy or extending parking duration) to resolve projected charging deficits.

### Module 3: Microgrid Simulator (Transformer-Constrained Load Orchestration)
* **Constrained 3-Bay Dispatch:** Models a 3-bay charging station operating under an aggregate transformer limit (default 14 kW, with 7 kW per-bay caps).
* **Multi-Policy Comparative Benchmarking:** Implements **Smart Critical Slack Dispatch**, **Earliest Deadline First (EDF)**, and **First-Come, First-Served (FCFS)** running concurrently across identical fleet and electrical constraints.
* **Live Disruption Deck:** Dynamically models midday solar canopy generation (+4 kW boost), transformer brownouts (capped to 10 kW), charger hardware failures (Bay 3 offline), and emergency vehicle insertions.
* **Engineering Feasibility Analysis:** Formulates physical bottlenecks into three transparent components: transformer concurrency ceilings, per-vehicle onboard charger limits, and overlapping departure deadline contention.

---

## 3. Problem Statement & Real-World Challenges

India's accelerating transition to electric mobility faces two interconnected, compounding bottlenecks across drivers and the electrical grid:

```
               DRIVER-SIDE BOTTLENECK                                     GRID-SIDE BOTTLENECK
  ┌──────────────────────────────────────────────┐           ┌──────────────────────────────────────────────┐
  │ • Fragmented public charging networks        │           │ • Rigid transformer capacity headroom (DTx)  │
  │ • Incompatible sockets & unverified adapters │   vs.     │ • Simultaneous charging trips main breakers   │
  │ • Unrealistic dashboard range estimates      │           │ • Severe peak-demand penalty surcharges      │
  │ • Fear of battery exhaustion & stranding    │           │ • Uncoordinated First-Come First-Served queue│
  └──────────────────────────────────────────────┘           └──────────────────────────────────────────────┘
                                                 ▲           ▲
                                                 │           │
                                 ┌───────────────┴───────────┴───────────────┐
                                 │       UNEXPECTED OPERATIONAL SHOCKS       │
                                 │ • Charger hardware outages (Bay offline)  │
                                 │ • Utility brownouts & solar fluctuations  │
                                 │ • High-priority emergency vehicle arrivals│
                                 └───────────────────────────────────────────┘
```

1. **Fragmented & Unverified Discovery:** Public charging infrastructure in India is split across dozens of proprietary operator applications without open aggregation standards. Drivers frequently travel to mapped locations only to find incompatible connector formats or unverified 3-pin adapter requirements for electric scooters.
2. **Battery Range Uncertainty:** Commercial dashboard displays project ideal nominal range. Real-world Indian operating conditions (dense traffic, high ambient temperatures, heavy AC draw, and elevation changes) drain batteries significantly faster. Without safety buffers, drivers face roadside stranding.
3. **Physical Transformer Bottlenecks:** Upgrading dedicated distribution transformers (DTx) or commercial grid sanction limits in India is capital-intensive and slow, often taking 6 to 18 months. Consequently, commercial campuses, educational institutions, and fleet hubs install multiple fast chargers behind existing transformers with fixed capacity ceilings (e.g., 14 kW site limit across three 7 kW bays).
4. **Uncoordinated Charging & Peak Demand Penalties:** When multiple EVs plug in under unmanaged First-Come, First-Served (FCFS) rules, concurrent power draw exceeds transformer limits, tripping site protection or incurring severe peak-demand penalty tariffs from local distribution companies (DISCOMs).
5. **Operational Shocks & Missed Deadlines:** Real charging environments experience solar canopy intermittency, utility brownouts, hardware bay faults, and unexpected emergency vehicle arrivals. Rigid scheduling rules starve near-term departures and disrupt fleet operations.

---

## 4. Proposed Solution: Input → Processing → Output → Benefit

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. EV DISCOVERY (Geospatial Mapping)                                                                        │
│    • INPUT: City name query or device GPS coordinates.                                                      │
│    • PROCESSING: Sub-ms 0.1° spatial grid query (8,129 buckets) over 28,553 authentic records.              │
│    • OUTPUT: Interactive Leaflet map with filtered pins (Fast DC, Slow AC, 2W) & directions.                │
│    • BENEFIT: Instant, zero-credential discovery of mapped infrastructure across 4,251 Indian towns.        │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. CHARGE RESCUE (Driver Battery Intelligence)                                                              │
│    • INPUT: Vehicle model (10 Indian presets), current SOC (%), reserve buffer (%), target SOC (%).          │
│    • PROCESSING: Usable energy deduction, 1.30× circuity distance approximation, socket matching audit.     │
│    • OUTPUT: Conservative safe range vs. nominal range, ranked stops, and dynamic What-If advice.           │
│    • BENEFIT: Prevents stranding through conservative safety budgeting; resolves deficits before driving.   │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. MICROGRID SIMULATOR (Transformer-Constrained Load Orchestration)                                         │
│    • INPUT: Fleet arrival queue, departure deadlines, 14 kW site transformer cap, solar/fault disruptions.  │
│    • PROCESSING: Event-driven discrete-event scheduling comparing Smart Slack, EDF, and FCFS policies.      │
│    • OUTPUT: Interactive power flow topology, 10-slot multi-track ribbon, and feasibility audit.            │
│    • BENEFIT: Delivers +12.7% more energy vs. FCFS in baseline simulation without transformer overdraw.     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Market Relevance, Target Users & Adoption Potential

### Target User Segments
1. **Educational Campuses & Institutional Facilities:** Universities and engineering colleges operating solar arrays and EV fleets with constrained transformer headroom, where students and staff charge concurrently during work hours.
2. **Commercial EV Fleet Depots:** Last-mile logistics (electric 2W/3W delivery fleets such as Zypp, Yulu, Zomato hubs) and corporate shuttle vans operating under rigid shift turnaround deadlines.
3. **Commercial Parking & Hospitality Hosts:** Hotels, commercial office parks, and multi-tenant complexes seeking to provide multi-bay EV charging without investing in multi-lakh-rupee dedicated distribution transformer upgrades.
4. **Academic Researchers & Engineering Students:** Power systems and computer science researchers studying constrained online scheduling, Jain fairness, and spatial indexing.
5. **EV Owners & Drivers in India:** Commuters and long-distance drivers requiring conservative, transparent range planning that accounts for AC load, battery reserve margins, and socket compatibility.

### Adoption Pathway & Readiness Boundary
* **Current Prototype Readiness (Functional software prototype; real-world validation pending):** Fully functional deterministic simulation engine, open-data spatial search over 28,553 authentic records, comprehensive automated test suites, responsive light neo-brutalist UI, and live cloud deployment.
* **Requirements for Full Enterprise Production Deployment:**
  1. *OCPP Protocol Gateway:* Implementation of Open Charge Point Protocol (OCPP 1.6J / 2.0.1) to transmit dynamic charging profiles (`SetChargingProfile`) to physical EVSE chargers.
  2. *Smart Sub-Metering Telemetry:* Modbus RTU / MQTT integration for real-time site power and solar generation telemetry.
  3. *CPO API Integrations:* Formal data exchange with Indian charging networks (Tata Power, Statiq, Jio-bp) for live bay availability and dynamic tariff feeds.
  4. *Turn-by-Turn Routing Engine:* Integration with an open routing engine (OSRM or Valhalla) for elevation-aware, turn-by-turn road navigation.

---

## 6. Hackathon Requirements-to-Evidence Matrix

| Evaluation Criterion | Relevant Implemented Feature | Code Location | Verification Method | Implemented Status |
| :--- | :--- | :--- | :--- | :---: |
| **1. Innovation & Real-World Feasibility** | Combined nationwide EV discovery (28,553 stations), Charge Rescue range intelligence (`journeyEngine.js`), and transformer-constrained microgrid load scheduling with Station-to-Simulation hand-off (`SiteContextBanner`). | `backend/main.py`<br>`frontend/src/engine/journeyEngine.js`<br>`frontend/src/engine/microgridEngine.js` | Run `node tests/test_journey_engine.js` and `node tests/benchmark_algorithms.js` to see real-time constraint enforcement. | **Complete** |
| **2. Algorithmic Correctness & Integrity** | Exact constraint enforcement: 7 kW bay cap, 14 kW transformer cap, energy conservation, deadline cutoffs, Feasibility-Aware Critical Slack dispatch, and zero duality gap LP bound. | `tests/test_engine.js`<br>`tests/test_simulation_engine.js`<br>`frontend/src/engine/microgridEngine.js` | Run `node tests/test_simulation_engine.js` (96 scenarios pass with 100% dual-engine parity and 0 violations). | **Complete** |
| **3. Disruption Resilience & What-If Testing** | Real-time simulation of charger hardware faults (2 bays), grid brownouts (10 kW), emergency arrivals, and midday solar canopy generation (+4 kW boost) with shifted allocation rings. | `frontend/src/components/simulation/DisruptionDeck.jsx`<br>`frontend/src/components/simulation/ScheduleRibbon.jsx` | In UI, toggle disruptions in Disruption Deck and observe dynamic multi-track power re-allocation and shifted allocation rings without page reload. | **Complete** |
| **4. Transparency & Explainability** | Explicit demarcation of authentic OSM points vs. simulated dispatch; mathematical necessary-condition audits; truthful connector compatibility; What-If guidance. | `frontend/src/components/simulation/FeasibilityAudit.jsx`<br>`frontend/src/components/rescue/WhatIfAdvisor.jsx`<br>`frontend/src/components/StatusBanner.jsx` | Audit card computes dynamic physical bottlenecks vs. heuristic outcomes; What-If card dynamically calculates energy savings from adjusted targets. | **Complete** |
| **5. Full-Stack Engineering Quality** | Asynchronous FastAPI service with 0.1° spatial grid indexing (8,129 buckets), light neo-brutalist React SPA with CartoDB Voyager tiles, and 23 backend unit tests. | `tests/test_backend.py`<br>`frontend/src/App.jsx`<br>`frontend/src/index.css` | Run `python -m unittest tests/test_backend.py` (23/23 pass) and `npm --prefix frontend run build` (clean Vite bundle in ~12s). | **Complete** |
| **6. Cloud Deployment Readiness** | Live Vercel SPA deployment with client-side rewrites; live Render FastAPI service with dynamic `$PORT`; production CORS regex matching `https://.*\.vercel\.app`. | `render.yaml`<br>`frontend/vercel.json`<br>`requirements.txt`<br>`backend/main.py` | Both services active, healthy, and publicly verified with zero secrets or billing accounts. | **Complete** |

---

## Related Documentation
* [Architecture & Data Flow](ARCHITECTURE.md)
* [Algorithms & Mathematical Formulations](ALGORITHMS.md)
* [Empirical Performance Benchmarks](BENCHMARKS.md)
* [Competitive Positioning](COMPETITIVE_POSITIONING.md)
* [Local Setup & Cloud Deployment Guide](SETUP_AND_DEPLOYMENT.md)
* [Validation, Transparency Matrix & Limitations](VALIDATION_AND_LIMITATIONS.md)
