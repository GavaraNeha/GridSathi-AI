# GridSathi AI — EV Microgrid Scheduling & OpenStreetMap Discovery Platform

**HackWithAditya 2026 · Energy, EV & Sustainability Submission (Track 04)**<br>
*A disruption-aware, transparent EV charging orchestration, journey rescue, and open discovery platform for power-constrained campuses and microgrids across India.*

**100% Free & Open-Source:** Built on Leaflet, OpenStreetMap, Nominatim, Overpass API, the Nationwide EV Charging Infrastructure Dataset (28,553 authentic stations across 4,251 cities under ODbL / CC-BY 4.0), React 19 (Vite 6), Tailwind CSS, and FastAPI. **Zero Google Cloud accounts, zero API keys, zero BMS integrations, and zero payment credentials required.**

---

### 🌐 Live Production Deployment & Quick Links

* 🚀 **Live Production Application:** [https://grid-sathi-ai.vercel.app/](https://grid-sathi-ai.vercel.app/) (Vercel Free Tier)
* ⚡ **Live Backend Health & Status:** [https://gridsathi-backend.onrender.com/api/health](https://gridsathi-backend.onrender.com/api/health) (Render Free Tier)
* 📂 **GitHub Source Repository:** [https://github.com/GavaraNeha/GridSathi-AI](https://github.com/GavaraNeha/GridSathi-AI)
* 📖 **Interactive OpenAPI Docs:** [https://gridsathi-backend.onrender.com/docs](https://gridsathi-backend.onrender.com/docs)

---

## 1. Executive Overview & The Three Core Modules

GridSathi AI addresses two interconnected challenges facing India's accelerating EV transition: **unreliable public charging discovery** and **severe electrical grid bottlenecking** when multiple EVs charge concurrently at transformer-constrained campuses, fleet depots, and commercial microgrids.

The application is structured into **three modular, unified operational pillars**:

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

### Module 1: EV Discovery (Nationwide Open Infrastructure)
* **28,553 Authentic Mapped Stations:** Mapped open-data charging station records across 4,251 Indian cities and towns, curated under ODbL / CC-BY 4.0.
* **In-Memory 0.1° Spatial Grid:** Partitions India's landmass into 8,129 spatial cells, delivering sub-millisecond bounding-box and Haversine proximity queries.
* **GPS Near Me & Pre-Seeded Metropolises:** Zero-latency offline coordinate resolution for 16 major Indian cities (Hyderabad, Bengaluru, Delhi, Mumbai, Chennai, Pune, Kochi, etc.) with Nominatim live fallback.
* **Interactive Leaflet Canvas:** Fast DC chargers, Slow AC points, and Two-Wheeler stations rendered with distinct visual markers and Google Maps turn-by-turn directions links.

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

## 2. Three-Minute Judge Demonstration Workflow

Follow this concise 3-minute walkthrough to evaluate all critical platform capabilities:

| Time | Action | What to Observe | Evaluated Capability |
| :---: | :--- | :--- | :--- |
| **0:00–1:00** | **Nationwide Discovery**<br>1. Open [Live Application](https://grid-sathi-ai.vercel.app/).<br>2. Type `Hyderabad` in the search box.<br>3. Inspect station card & map marker.<br>4. Click **"Simulate Charging Here"**. | • 50 authentic stations load instantly with operator branding, connector types, and bay ratings.<br>• Leaflet map displays pins with distance tags.<br>• Active view automatically transitions to the Microgrid Simulator with `SiteContextBanner` transferring real coordinates and operator metadata. | OpenStreetMap & Dataset spatial indexing; seamless cross-tab context hand-off. |
| **1:00–2:00** | **Charge Rescue Intelligence**<br>1. Click the **Charge Rescue** tab.<br>2. Observe the default **Tata Nexon EV Long Range** profile (40.5 kWh pack, 28% battery SOC, 15% reserve buffer).<br>3. (Optional) Adjust SOC or reserve sliders to inspect dynamic live range recalculation.<br>4. Inspect **Battery Range Estimator** card and **Station Rescue Finder** rankings.<br>5. Select a candidate stop & check the **What-If Decision Advisor**. | • Battery Range Estimator card displays Conservative Safe Range (32 km) vs. Nominal Range (37.6 km) derived deterministically from 5.265 kWh usable energy (rounded and displayed as 5.27 kWh in UI), tagged with the explicit `"Estimated within range — route unverified"` badge.<br>• Station Rescue Finder ranks reachable stops by detour distance and socket compatibility.<br>• What-If Decision Advisor dynamically suggests exact energy and time saved by lowering target SOC. | Deterministic range budgeting; unverified-route transparency; grounded vehicle presets. |
| **2:00–3:00** | **Microgrid Dispatch & Feasibility**<br>1. Click the **Microgrid Simulator** tab.<br>2. Observe the HeaderBar benchmark comparison pill.<br>3. Toggle between **GridSathi Optimizer** (Smart), **Earliest Deadline** (EDF), and **First-Come** (FCFS).<br>4. In Disruption Deck, toggle **Bay 3 Hardware Fault**.<br>5. Scroll to the **Physical Grid Bottleneck** card (Engineering Feasibility Analysis). | • Benchmark pill dynamically shows `vs FCFS: 0 EVs on-time \| +6.0 kWh additional energy delivered vs FCFS`.<br>• Disruption Deck immediately triggers shifted allocation rings on the multi-track Schedule Ribbon.<br>• Engineering Feasibility Analysis breaks down physical constraints: 14 kW grid cap allows max 2 concurrent bays at 7 kW, and EV-3 has an unavoidable 0.7 kWh hardware absorption deficit. | Multi-algorithm dispatch parity; discrete-event disruption replay; physical constraint breakdown. |

---

## 3. Transparency Matrix: What is Real, Estimated, and Simulated

To maintain absolute scientific integrity, GridSathi AI explicitly demarcates data sources and model boundaries:

| Dimension | Real & Grounded (Empirical) | Estimated (Mathematical Model) | Simulated (Deterministic Software) |
| :--- | :--- | :--- | :--- |
| **Geospatial Infrastructure** | **28,553 authentic charging stations** (names, lat/lng coordinates, CPOs, socket formats, addresses) from OpenStreetMap and the Nationwide EV Dataset (ODbL / CC-BY 4.0). | **Road driving distances** (estimated via 1.30× Haversine circuity approximation; clearly tagged as `"route unverified"`). | *Not simulated.* Zero synthetic or fictitious charging station listings are generated. |
| **Vehicle Specifications** | **10 authentic Indian EV models** (nameplate battery capacity in kWh, realistic city consumption in Wh/km, physical socket inlets). | **Conservative safe driving range** (derived by deducting user safety buffer from remaining battery capacity). | *Not simulated.* No fake battery chemistries or fabricated efficiency curves. |
| **Microgrid & Charging Physics** | **Physical charging limits:** 7.0 kW AC bay rating; 14 kW site transformer limit; discrete 30-minute time intervals. | **Charging session duration:** calculated from requested kWh divided by effective concurrent bay power. | **Fleet queues & grid dispatch:** vehicle arrival sequences, bay occupancies, solar curves, and hardware faults are educational software simulations. (Zero physical IoT hardware). |
| **Algorithmic Performance** | **Exact discrete-event execution:** all power allocations, energy sums, costs, and Jain fairness indices are computed from actual simulated schedules. | **Theoretical minimum deficit:** Linear Programming (LP) upper bound proves 14.36 kWh is the physical minimum deficit strictly for the baseline 6-vehicle campus scenario. | **Heuristic policy:** Smart Slack is an online priority heuristic, not an offline globally optimal MILP solver. |

---

## 4. Requirements-to-Evidence Matrix (Hackathon Evaluation)

| Evaluation Criterion | Relevant Implemented Feature | Code Location | Verification Method | Implemented Status |
| :--- | :--- | :--- | :--- | :---: |
| **1. Innovation & Real-World Feasibility** | Combined nationwide EV discovery (28,553 stations), Charge Rescue range intelligence (`journeyEngine.js`), and transformer-constrained microgrid load scheduling with Station-to-Simulation hand-off (`SiteContextBanner`). | `backend/main.py`<br>`frontend/src/engine/journeyEngine.js`<br>`frontend/src/engine/microgridEngine.js` | Run `node tests/test_journey_engine.js` and `node tests/benchmark_algorithms.js` to see real-time constraint enforcement. | **Complete** |
| **2. Algorithmic Correctness & Integrity** | Exact constraint enforcement: 7 kW bay cap, 14 kW transformer cap, energy conservation, deadline cutoffs, Feasibility-Aware Critical Slack dispatch, and zero duality gap LP bound. | `tests/test_engine.js`<br>`tests/test_simulation_engine.js`<br>`frontend/src/engine/microgridEngine.js` | Run `node tests/test_simulation_engine.js` (96 scenarios pass with 100% dual-engine parity and 0 violations). | **Complete** |
| **3. Disruption Resilience & What-If Testing** | Real-time simulation of charger hardware faults (2 bays), grid brownouts (10 kW), emergency arrivals, and midday solar canopy generation (+4 kW boost) with shifted allocation rings. | `frontend/src/components/simulation/DisruptionDeck.jsx`<br>`frontend/src/components/simulation/ScheduleRibbon.jsx` | In UI, toggle disruptions in Disruption Deck and observe dynamic multi-track power re-allocation and shifted allocation rings without page reload. | **Complete** |
| **4. Transparency & Explainability** | Explicit demarcation of authentic OSM points vs. simulated dispatch; mathematical necessary-condition audits; truthful connector compatibility; What-If guidance. | `frontend/src/components/simulation/FeasibilityAudit.jsx`<br>`frontend/src/components/rescue/WhatIfAdvisor.jsx`<br>`frontend/src/components/StatusBanner.jsx` | Audit card computes dynamic physical bottlenecks vs. heuristic outcomes; What-If card dynamically calculates energy savings from adjusted targets. | **Complete** |
| **5. Full-Stack Engineering Quality** | Asynchronous FastAPI service with 0.1° spatial grid indexing (8,129 buckets), light neo-brutalist React SPA with CartoDB Voyager tiles, and 23 backend unit tests. | `tests/test_backend.py`<br>`frontend/src/App.jsx`<br>`frontend/src/index.css` | Run `python -m unittest tests/test_backend.py` (23/23 pass) and `npm --prefix frontend run build` (clean Vite bundle in ~12s). | **Complete** |
| **6. Cloud Deployment Readiness** | Live Vercel SPA deployment with client-side rewrites; live Render FastAPI service with dynamic `$PORT`; production CORS regex matching `https://.*\.vercel\.app`. | `render.yaml`<br>`frontend/vercel.json`<br>`requirements.txt`<br>`backend/main.py` | Both services active, healthy, and publicly verified with zero secrets or billing accounts. | **Complete** |

---

## 5. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Client["Client Browser (React 19 + Vite 6 SPA — Light Neo-Brutalist)"]
        Nav["Tri-View Navigation Tabs (App.jsx)"]
        DiscoveryTab["EV Discovery View"]
        RescueTab["Charge Rescue View"]
        SimulatorTab["Microgrid Simulator View"]

        subgraph DiscoveryView["Module 1: EV Discovery"]
            SearchBar["SearchBar & City Selector"]
            LeafletMap["Leaflet Map Canvas (CartoDB Voyager Light)"]
            StationList["StationList & StationCards"]
        end

        subgraph RescueView["Module 2: Charge Rescue"]
            ProfileCard["VehicleProfileCard (10 Indian Presets)"]
            RangeCard["BatteryRangeCard (Safe vs. Nominal Range)"]
            RescueFinder["StationRescueFinder (Detour & Compatibility)"]
            WhatIfCard["WhatIfAdvisor (Dynamic Decision Cards)"]
            GridRescueSim["GridRescueSimulator (Outcome Evaluator)"]
        end

        subgraph SimView["Module 3: Microgrid Simulator"]
            HeaderBar["HeaderBar (Smart / EDF / FCFS Switcher & vs FCFS Pill)"]
            SiteBanner["SiteContextBanner (Station Context Transfer)"]
            Topology["MicrogridTopology (Live Power Flow)"]
            LoadChart["LoadProfileChart (Power Curve & Grid Ceiling)"]
            Ribbon["ScheduleRibbon (10-Slot Multi-Track Timeline)"]
            DisruptionDeck["DisruptionDeck (Fault, Brownout, Solar, Emergency)"]
            AuditCard["FeasibilityAudit (Engineering Feasibility Analysis)"]
            FleetTable["FleetInspector (Individual EV Session Audit)"]
        end

        Nav --> DiscoveryTab & RescueTab & SimulatorTab
        DiscoveryTab --> SearchBar & LeafletMap & StationList
        RescueTab --> ProfileCard & RangeCard & RescueFinder & WhatIfCard & GridRescueSim
        SimulatorTab --> HeaderBar & SiteBanner & Topology & LoadChart & Ribbon & DisruptionDeck & AuditCard & FleetTable
    end

    subgraph ClientEngines["Deterministic Client-Side Engines (Zero Network Overhead)"]
        JourneyEngine["journeyEngine.js<br>• Battery Range & Usable Energy Math<br>• 1.30x Circuity Distance Math<br>• Truthful Connector Format Audit<br>• Candidate Ranking & Detour Scoring<br>• What-If Advice Generator"]
        MicrogridEngine["microgridEngine.js<br>• runScheduler(vehicles, options, mode)<br>• Smart Slack (Critical Feasible Priority)<br>• Earliest Deadline First (EDF)<br>• First-Come, First-Served (FCFS)<br>• Jain's Fairness Index & Energy Conservation"]
    end

    subgraph BackendService["FastAPI Backend Service (Python 3.11 on Render)"]
        APIEndpoints["FastAPI Endpoints<br>• /api/health (28,553 Station Count)<br>• /api/config (Attribution & Rate Limits)<br>• /api/stations (Proximity & City Search)<br>• /api/locations (Autocomplete Suggestions)"]
        SpatialGrid["0.1° Spatial Grid Index<br>(8,129 Bounding-Box Buckets)"]
        DatasetStore["In-Memory Dataset<br>(28,553 Authentic Stations in India)"]
        CacheMgr["Disk & In-Memory TTL Cache<br>(24h Geocodes, 1h Overpass)"]
        RateLimiter["IP Rate Limiter (60 req/min)"]
    end

    subgraph PublicGeospatial["100% Free Public Geospatial Infrastructure"]
        Nominatim["OSM Nominatim Geocoding API"]
        OverpassPool["Global Overpass API Mirrors (kumi.systems, overpass-api.de, private.coffee)"]
    end

    SearchBar -- "1. Search City or GPS Near Me" --> APIEndpoints
    APIEndpoints --> SpatialGrid --> DatasetStore
    APIEndpoints -- "Fallback if unmapped" --> Nominatim & OverpassPool
    StationList -- "2. Simulate Charging Here" --> SiteBanner
    ProfileCard & RangeCard --> JourneyEngine
    RescueFinder & WhatIfCard --> JourneyEngine
    JourneyEngine -- "Inject Simulated Rescue EV" --> MicrogridEngine
    SimulatorTab --> MicrogridEngine
```

---

## 6. Mathematical Foundations & Algorithmic Dispatch

### A. Feasibility-Aware Critical Slack Formulation
At each 30-minute time slot $t \in \{0, 1, \dots, 9\}$, for each eligible vehicle $x$ with remaining demand $R_x(t)$, departure deadline slot $t_{\text{due}, x}$, and bay charging speed limit $P_{\text{bay}, x} = \min(P_{\max, x}, 7.0\text{ kW})$:

$$\Delta t = 0.5\text{ h}, \quad \text{SlotCapacity}_x = P_{\text{bay}, x} \times \Delta t = 3.5\text{ kWh}$$

$$\text{AvailableSlots}(x, t) = \max(1, t_{\text{due}, x} - t)$$

$$\text{MaxAchievable}_x(t) = \text{AvailableSlots}(x, t) \times \text{SlotCapacity}_x$$

$$\text{Slack}(x, t) = \text{MaxAchievable}_x(t) - R_x(t)$$

To prevent infeasible requests (e.g., $15\text{ kWh}$ in $30\text{ minutes}$ at a $7\text{ kW}$ charger, where $\text{Slack} = -11.5\text{ kWh}$) from monopolizing charging bays and forcing feasible vehicles to miss deadlines, GridSathi AI employs a **Three-Tier Critical Slack Priority Rule**:

1. **Group 0 (Critical Feasible — $0 \le \text{Slack} < \text{SlotCapacity}_x$):**
   The vehicle is physically capable of meeting its deadline under maximum power, but cannot skip the current slot without falling into an individual deficit. Sorted by least positive slack $\min \text{Slack}(x, t)$, then earliest deadline $t_{\text{due}, x}$.
2. **Group 1 (Imminent Infeasible / Emergency Arrival — $\text{Slack} < 0$):**
   The vehicle's request exceeds physical charger capabilities even under continuous unconstrained power. Rather than discarding or starving the vehicle, it receives **best-effort partial charging** from available/slack power before its window closes, sorted by earliest departure $t_{\text{due}, x}$, then remaining deficit.
3. **Group 2 (Buffered Feasible — $\text{Slack} \ge \text{SlotCapacity}_x$):**
   The vehicle has at least one full 30-minute buffer slot of leeway under maximum power. It safely yields charging bays to urgent/emergency vehicles and completes charging in subsequent slots.

### B. Physical Microgrid Dispatch Constraints
At every time slot $t$:
1. **Per-Bay Charger Rating Limit**: $P_{x, b}(t) \le 7.0\text{ kW}, \quad \forall b \in \{1, \dots, B_{\max}\}$ (where $B_{\max} = 2$ under hardware fault, $3$ normally).
2. **Total Site Grid Ceiling**: $\sum_{b=1}^{B_{\max}} P_{b}(t) \le P_{\text{grid\_limit}} + P_{\text{solar}}(t)$ (where $P_{\text{grid\_limit}} \in \{7, 10, 14, 21\}\text{ kW}$, capped at $10\text{ kW}$ under brownout, and $P_{\text{solar}}(t) \in [0, 4]\text{ kW}$).
3. **Energy Conservation (First Law of Thermodynamics)**:
   $$\sum_{t=0}^{t_{\text{due}, x}-1} P_x(t) \times 0.5\text{ h} \le E_{\text{requested}, x}, \quad \text{and} \quad \sum_{i=1}^N E_{\text{delivered}, i} + \sum_{i=1}^N E_{\text{unmet}, i} \equiv \sum_{i=1}^N E_{\text{requested}, i}$$
4. **Strict Deadline Enforcement**: $P_x(t) = 0, \quad \forall t \ge t_{\text{due}, x}$.
5. **Bay Singularity**: Each vehicle occupies at most one bay per time slot: $\sum_{b=1}^{B_{\max}} \mathbb{I}(x \text{ assigned to } b) \le 1$.

### C. Jain's Fairness Index
To evaluate equitable power distribution across all fleet drivers:

$$J(x) = \frac{\left(\sum_{i=1}^{n} f_i\right)^2}{n \sum_{i=1}^{n} f_i^2}, \quad \text{where } f_i = \begin{cases} \frac{E_{\text{delivered}, i}}{E_{\text{requested}, i}} & \text{if } E_{\text{requested}, i} > 0 \\ 1.0 & \text{otherwise} \end{cases}$$

### D. Linear Programming Feasibility Bound (Baseline Campus Scenario)
To assess whether the baseline shortfall of 14.86 kWh under Smart Slack is avoidable, we formulated and solved the linear-programming upper bound maximizing delivered energy across all 10 slots subject to all grid, per-bay, arrival, and deadline constraints for the standard six-vehicle campus microgrid workload (`BASE_VEHICLES` under 14 kW grid cap):
$$\max \sum_{i=0}^5 \sum_{t=0}^{d_i-1} 0.5 \cdot p_{i,t} \quad \text{s.t.} \quad \sum_{i=0}^5 p_{i,t} \le 14\text{ kW}, \quad 0 \le p_{i,t} \le 7\text{ kW}, \quad \sum_{t=0}^{d_i-1} 0.5 \cdot p_{i,t} \le D_i$$

* **Continuous LP Upper Bound:** **53.90 kWh**
* **Discrete EDF Simulation:** Delivers **53.90 kWh** using $\le 3$ active bays in every slot.
* **Exact Zero Duality Gap:** Because the discrete schedule matches the relaxed continuous upper bound, **53.90 kWh is the mathematically proven global optimum for deliverable energy strictly within this specific baseline six-vehicle campus simulation scenario (`BASE_VEHICLES` under 14 kW grid limit)**. This optimality proof does not generalize to arbitrary online arrival sequences, varying fleet compositions, or unconstrained grid scales.
* **True Minimum Deficit (Baseline Scenario):** $68.26 - 53.90 = \mathbf{14.36\text{ kWh}}$ (for the baseline 6-vehicle scenario; not a universal bound across arbitrary workloads).
* **Algorithmic Trade-off:** Smart Slack delivers 53.40 kWh (14.86 kWh deficit), exhibiting an algorithmic trade-off gap of exactly 0.50 kWh against offline EDF in this static baseline. In exchange, Smart Slack is designed with an explicit algorithmic objective to avoid starvation of near-term feasible vehicles when unpredictable emergency arrivals occur (by prioritizing feasible vehicles with near-zero slack in Group 0 ahead of over-demanding requests). As shown in Scenario 8, this heuristic structure prioritizes timely delivery for feasible deadlines rather than optimizing purely for aggregate volume.

---

## 7. Algorithmic Performance Benchmark (8 Operational Scenarios)

The table below reflects reproducible measurements executed by `tests/benchmark_algorithms.js` comparing **Smart (Feasibility-Aware Critical Slack)**, **EDF (Earliest Deadline First)**, and **FCFS (First-Come, First-Served Baseline)**:

| Scenario | Policy | On-Time EVs | Unmet Energy | Peak Load | Energy Cost | Jain Fairness | Bay Violations | Latency |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Standard Campus Baseline (14 kW)** | **Smart (Slack)** | **3/6 (50%)** | **14.9 kWh** | 14.0 kW | ₹296 | **86%** | 0 | 1.8 ms |
| | EDF | 3/6 (50%) | 14.4 kWh | 14.0 kW | ₹301 | 92% | 0 | 0.3 ms |
| | FCFS (Baseline) | 3/6 (50%) | 20.9 kWh | 14.0 kW | ₹260 | 64% | 0 | 0.1 ms |
| **2. Constrained Transformer (10 kW)** | **Smart (Slack)** | **2/6 (33%)** | 26.4 kWh | 10.0 kW | ₹237 | **74%** | 0 | 0.1 ms |
| | EDF | 1/6 (17%) | 24.3 kWh | 10.0 kW | ₹255 | 87% | 0 | 0.1 ms |
| | FCFS (Baseline) | 3/6 (50%) | 24.9 kWh | 10.0 kW | ₹249 | 56% | 0 | 0.1 ms |
| **3. Severe Congestion (7 kW Cap)** | **Smart (Slack)** | **2/6 (33%)** | 35.4 kWh | 7.0 kW | ₹189 | **51%** | 0 | 0.1 ms |
| | EDF | 1/6 (17%) | 33.3 kWh | 7.0 kW | ₹207 | 72% | 0 | 0.2 ms |
| | FCFS (Baseline) | 1/6 (17%) | 33.3 kWh | 7.0 kW | ₹207 | 49% | 0 | 0.2 ms |
| **4. Charger Hardware Fault (Bay 3 Offline)** | **Smart (Slack)** | **3/6 (50%)** | **15.9 kWh** | 14.0 kW | ₹293 | **82%** | 0 | 1.0 ms |
| | EDF | 2/6 (33%) | 17.2 kWh | 14.0 kW | ₹282 | 90% | 0 | 0.1 ms |
| | FCFS (Baseline) | 3/6 (50%) | 23.7 kWh | 14.0 kW | ₹241 | 59% | 0 | 0.1 ms |
| **5. Solar Canopy Midday Surplus (+4 kW)** | **Smart (Slack)** | **3/6 (50%)** | **14.4 kWh** | 16.0 kW | ₹296 | **87%** | 0 | 0.1 ms |
| | EDF | 3/6 (50%) | 13.9 kWh | 16.0 kW | ₹300 | 93% | 0 | 0.1 ms |
| | FCFS (Baseline) | 3/6 (50%) | 19.9 kWh | 16.0 kW | ₹263 | 67% | 0 | 0.2 ms |
| **6. Compounded Disruption (Brownout + Fault)** | **Smart (Slack)** | **2/6 (33%)** | 26.4 kWh | 10.0 kW | ₹237 | **74%** | 0 | 0.1 ms |
| | EDF | 1/6 (17%) | 25.1 kWh | 10.0 kW | ₹249 | 83% | 0 | 0.2 ms |
| | FCFS (Baseline) | 3/6 (50%) | 25.7 kWh | 10.0 kW | ₹244 | 54% | 0 | 0.1 ms |
| **7. Solar-Assisted Fault Recovery** | **Smart (Slack)** | **3/6 (50%)** | **15.9 kWh** | 14.0 kW | ₹293 | **82%** | 0 | 0.1 ms |
| | EDF | 2/6 (33%) | 17.2 kWh | 14.0 kW | ₹282 | 90% | 0 | 0.1 ms |
| | FCFS (Baseline) | 3/6 (50%) | 23.7 kWh | 14.0 kW | ₹241 | 59% | 0 | 0.1 ms |
| **8. Impossible Emergency Arrival (EV-7)** | **Smart (Slack)** | **3/7 (43%)** | **29.9 kWh** | 14.0 kW | ₹296 | **73%** | 0 | 0.4 ms |
| | EDF | 3/7 (43%) | 29.4 kWh | 14.0 kW | ₹301 | 85% | 0 | 0.1 ms |
| | FCFS (Baseline) | 3/7 (43%) | 35.9 kWh | 14.0 kW | ₹260 | 55% | 0 | 0.1 ms |

---

## 8. UI Architecture & Engineering Feasibility Analysis

### 1. Light Neo-Brutalist Design System
Characterized by high-contrast ink-black borders (`#111827`), a warm canvas (`#F7F5F0`), crisp tactile box-shadows (`shadow-[3px_3px_0px_#111827]`), and bright functional color accents (`#4163F5` Indigo, `#55BD8D` Emerald, `#F5AD16` Amber, `#E83D62` Crimson). Proportional dimensions ensure a visually dense, clean layout at standard 100% browser zoom.

### 2. HeaderBar Benchmark Pill (`HeaderBar.jsx` — Commit 16)
Dynamically reads simulation deltas against the FCFS baseline:
* **Smart Optimizer:** `vs FCFS: 0 EVs on-time | +6.0 kWh additional energy delivered vs FCFS`
* **EDF Policy:** `vs FCFS: 0 EVs on-time | +6.5 kWh additional energy delivered vs FCFS`
* **FCFS Policy:** `vs FCFS: 0 EVs on-time | 0.0 kWh additional energy delivered vs FCFS`
* Formats positive, zero, negative, and unavailable values accurately with zero hardcoded fallbacks.

### 3. Engineering Feasibility Analysis (`FeasibilityAudit.jsx` — Commit 16)
Provides transparent physical grounding for observed shortfalls:
* **Header:** `Physical Grid Bottleneck — 14.9 kWh Energy Deficit` (avoids unverified "Unavoidable" assertions).
* **Overview Box:** `68.3 kWh Total Demand (6 EVs) vs. 14 kW Grid Cap (3 Bays)`.
* **Three Concrete Physical Explanations:**
  1. *Transformer & Bay Concurrency Limit:* Explains that 14 kW site power across 3 physical bays allows at most 2 concurrent bays to charge at 7 kW full rate without grid overdraw.
  2. *Per-Vehicle Hardware Limit:* Dynamically identifies EV-3 (requests 11.2 kWh, but its 1.5h parking window allows at most 10.5 kWh at 7 kW, proving a 0.7 kWh hardware deficit).
  3. *Overlapping Deadlines & Competition:* Explains policy-driven power allocation under competing departure deadlines.

---

## 9. Quick Start (Run Locally)

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.11 and 3.14)
- Node.js 18+ (tested on Node.js 24)

### 2. Backend Setup
```bash
# 1. Clone repository
git clone https://github.com/GavaraNeha/GridSathi-AI.git
cd GridSathi-AI

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Start FastAPI server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI documentation is live at `http://127.0.0.1:8000/docs`.

### 3. Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install Node dependencies
npm install

# 3. Start Vite development server
npm run dev
```
Open `http://localhost:5173/` in your browser.

---

## 10. Verification & Automated Test Commands

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

## 11. Production Cloud Deployment Guide

GridSathi AI is actively deployed across two free-tier cloud environments:

### Frontend Production Deployment (Vercel)
* **Live URL:** [https://grid-sathi-ai.vercel.app/](https://grid-sathi-ai.vercel.app/)
* **Framework Preset:** `Vite`
* **Root Directory:** `frontend`
* **Build Command:** `npm run build` (or `vite build`)
* **Output Directory:** `dist`
* **Environment Variable:**
  * `VITE_API_BASE_URL` = `https://gridsathi-backend.onrender.com` (pointed to live Render backend; no trailing slash).
* **Routing Rewrites:** Configured in `frontend/vercel.json` for client-side SPA routing (`/(.*) -> /`).

### Backend Production Deployment (Render)
* **Live Service:** [https://gridsathi-backend.onrender.com](https://gridsathi-backend.onrender.com)
* **Health Endpoint:** [https://gridsathi-backend.onrender.com/api/health](https://gridsathi-backend.onrender.com/api/health)
* **Environment:** `Python 3.11`
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
* **Environment Variables:**
  * `PYTHON_VERSION`: `3.11.0`
  * `CORS_ORIGINS`: Optional list of custom domains (regex `allow_origin_regex=r"https://.*\.vercel\.app"` in `backend/main.py` automatically authorizes all Vercel domains).

> [!IMPORTANT]
> **Port Configuration on Render**: Do **NOT** manually set `PORT=8000` in the Render dashboard environment variables. Render dynamically injects its own `$PORT` variable into the container. The start command `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` automatically binds to Render's allocated port.

---

## 12. Open Data Attribution & Ethical Boundaries

1. **Nationwide EV Charging Infrastructure Dataset (India):** Built using mapped open-data charging station records curated under the Open Database License (ODbL) and Creative Commons Attribution 4.0 International (CC-BY 4.0).
2. **OpenStreetMap & Contributors:** Geospatial map tiles and geocoding powered by OpenStreetMap contributors, CartoDB Voyager, and Nominatim under ODbL.
3. **Software Simulation vs. Physical Actuation:** All charging schedules, bay power allocations, transformer overload limits, and fleet queues are high-fidelity deterministic software simulations. There is no physical IoT connection, hardware actuator, or BMS communication with real vehicles or chargers.
4. **Live Bay Availability Notice:** Real-time physical bay occupancy, live electrical tariffs, and equipment fault status are not monitored by physical hardware sensors. Station data reflects mapped infrastructure.
5. **Route Reachability Disclaimer:** Reachability badges and driving distances use an empirical 1.30× Haversine circuity approximation and do not constitute verified turn-by-turn road navigation or traffic-aware routing.
6. **Algorithmic Heuristic Scope:** The scheduling engine is an event-driven constrained heuristic optimized for sub-millisecond browser execution (~1 ms). Because multi-bay constrained scheduling is NP-hard, online heuristics are not claimed to be globally optimal for all arbitrary arrival sequences without an offline Mixed-Integer Linear Program (MILP) solver.
