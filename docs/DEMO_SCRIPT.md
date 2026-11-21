# GridSathi AI — Judge-Ready 4-Minute Demo Script

**Theme:** Energy, EV & Sustainability · **Event:** HackWithAditya 2026<br>
**Stack:** 100% Free & Open-Source (Leaflet + OpenStreetMap + FastAPI + Vite React) · **Zero Paid API Keys**

---

### Step 1: The Problem Hook (0:00 – 0:35)
> *"India's EV transition faces a silent physical bottleneck: grid transformer capacity. When 6 fleet EVs arrive at a campus depot simultaneously, each demanding up to 7 kW, but the site transformer is capped at 14 kW, standard unmanaged charging trips circuit breakers or leaves urgent vehicles stranded. GridSathi AI solves this with transparent, explainable load scheduling paired with India-wide open charging discovery."*

### Step 2: OpenStreetMap Live Discovery (0:35 – 1:15)
1. Open `http://localhost:5173/` in the browser.
2. In the Search Bar, select **Hyderabad** or type **Vijayawada** / **Rajahmundry**.
3. Point out:
   - Real-world station listings populated dynamically via the OpenStreetMap Overpass API.
   - Interactive dark-mode Leaflet map with custom SVG EV pins.
   - Zero Google API keys or billing accounts used; 100% open geospatial data.
   - Explicit disclaimer badge separating real community-mapped station coordinates from software microgrid optimization.
4. Click on any station card (e.g. *Tata Power EZ Charge* or *Ather Grid*). Notice the detail drawer and directions link.
5. Click **"Simulate Microgrid"** to transfer the station context into the simulation.

### Step 3: Baseline Microgrid Dispatch (1:15 – 2:00)
1. The app automatically transitions to the **Smart Microgrid** tab with the selected station's context.
2. Walk the judges through the layout:
   - **Top Dispatch Meter**: Shows 10:00 active draw ($14.0\text{ kW}$) perfectly respecting the $14.0\text{ kW}$ transformer limit ($100\%$ utilization).
   - **3 Smart Bays**: Displays live vehicle allocations, dispatch power ($7.0\text{ kW}$), and battery SoC progress bars.
   - **Fleet Inspector**: 6 simulated Indian EVs (Tata Nexon EV, BYD Atto 3, MG ZS EV, etc.) with arrival times and departure deadlines.
   - **Schedule Ribbon**: 30-minute allocation matrix over 10 slots showing how charging windows are partitioned.
   - **Load Profile**: Stacked power bar chart with the gold dashed line representing the site capacity ceiling.

### Step 4: Disruption What-If Analysis (2:00 – 2:50)
> *"Real-world campuses face disruptions. Let's test how GridSathi responds in real time."*
1. **Trigger Charger Fault**: Click **Bay 3 Fault**.
   - Notice Bay 3 turns red/offline. Available bays drop to 2.
   - The scheduler dynamically re-allocates power without exceeding the 14 kW limit.
2. **Trigger Grid Brownout**: Click **Brownout**.
   - Transformer limit drops to $10\text{ kW}$.
   - The stacked load profile and bay meters automatically throttle back to obey the lower limit. Zero capacity violations occur.
3. **Trigger Solar Canopy**: Click **Solar Boost**.
   - Midday solar curve adds up to $+4\text{ kW}$ of clean local generation.
   - The capacity ceiling line rises during peak midday hours (11:30–13:30), allowing extra energy to be delivered without drawing from the grid.

### Step 5: Policy Comparison & Tradeoffs (2:50 – 3:30)
1. Toggle between **⚡ Slack-Priority (Smart)**, **⏱️ Earliest Deadline (EDF)**, and **🚗 First-Come (FCFS)**.
2. Point to the **Algorithmic Gain Pill**:
   - Smart delivers **$+6.5\text{ to }9.3\text{ kWh}$ more energy** than FCFS.
   - Smart achieves **$97\%$ Jain Fairness** compared to **$64\%$ for FCFS**.
3. **Honest Tradeoff Disclosure**:
   > *"FCFS satisfies earlier arrivals to 100% while starving later vehicles completely. GridSathi's Slack-Priority ensures equitable energy distribution across all departing vehicles, drastically increasing total fleet transit readiness."*

### Step 6: Mathematical Feasibility Audit & Wrap-Up (3:30 – 4:00)
1. Scroll down to the **Feasibility Audit Card**:
   - Point out the **10:00–11:00 urgent window check**: It compares urgent requests against the physical 1-hour site energy ceiling ($14\text{ kW} \times 0.5\text{h} \times 2 = 14\text{ kWh}$).
   - Explain: *"This is a mathematically grounded lower bound. If urgent demand exceeds 14 kWh, shortfall is physically unavoidable regardless of algorithm."*
2. Conclude:
   > *"GridSathi AI demonstrates that campus EV charging can be resilient, fair, and mathematically verifiable—without requiring proprietary hardware or paid cloud APIs."*

---

## Judge Q&A Cheat Sheet

1. **Q: Is this real or simulated data?**
   - *A: Station locations are 100% authentic from OpenStreetMap. Charger bay allocations, queue schedules, and tariffs are a high-fidelity software heuristic simulation. We explicitly disclose this separation in the UI.*
2. **Q: Why a heuristic instead of MILP / CP-SAT?**
   - *A: The heuristic runs in $<2\text{ milliseconds}$ in the browser, enabling instant, real-time interactivity when judges toggle disruptions or move sliders. MILP exact solvers are the next planned phase for cloud-based offline batch scheduling.*
3. **Q: How is fairness defined?**
   - *A: Using Jain's Fairness Index: $J(x) = \frac{(\sum x_i)^2}{n \sum x_i^2}$, where $x_i = \text{delivered}_i / \text{requested}_i$. It ranges from $1/n$ (worst) to $1.0$ (perfect equity).*
