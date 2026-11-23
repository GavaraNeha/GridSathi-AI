# GridSathi AI — Validation, Transparency Matrix & Limitations

To maintain absolute scientific integrity, GridSathi AI explicitly demarcates empirical open data from mathematical approximations and software simulations.

---

## 1. Transparency Matrix: What is Real, Estimated, and Simulated

| Dimension | Real & Grounded (Empirical) | Estimated (Mathematical Model) | Simulated (Deterministic Software) |
| :--- | :--- | :--- | :--- |
| **Geospatial Infrastructure** | **28,553 authentic charging stations** (names, coordinates, CPOs, socket formats, addresses) from OpenStreetMap and the Nationwide EV Dataset (ODbL / CC-BY 4.0). | **Road driving distances** (estimated via 1.30× Haversine circuity approximation; clearly tagged as `"route unverified"`). | *Not simulated.* Zero synthetic or fictitious charging station listings are generated. |
| **Vehicle Specifications** | **10 authentic Indian EV models** (nameplate battery capacity in kWh, realistic city consumption in Wh/km, physical socket inlets). | **Conservative safe driving range** (derived by deducting user safety buffer from remaining battery capacity). | *Not simulated.* No fake battery chemistries or fabricated efficiency curves. |
| **Microgrid & Charging Physics** | **Physical charging limits:** 7.0 kW AC bay rating; 14 kW site transformer limit; discrete 30-minute time intervals. | **Charging session duration:** calculated from requested kWh divided by effective concurrent bay power. | **Fleet queues & grid dispatch:** vehicle arrival sequences, bay occupancies, solar curves, and hardware faults are educational software simulations. (Zero physical IoT hardware). |
| **Algorithmic Performance** | **Exact discrete-event execution:** all power allocations, energy sums, costs, and Jain fairness indices are computed from actual simulated schedules. | **Theoretical minimum deficit:** Linear Programming (LP) upper bound proves 14.36 kWh is the physical minimum deficit strictly for the baseline 6-vehicle campus scenario. | **Heuristic policy:** Smart Slack is an online priority heuristic, not an offline globally optimal MILP solver. |

---

## 2. System Limitations & Operational Boundaries

1. **Software Simulation vs. Physical Actuation:** All charging schedules, bay power allocations, transformer overload limits, and fleet queues are high-fidelity deterministic software simulations. There is no physical IoT connection, hardware relay, or BMS communication with real vehicles or chargers.
2. **Live Bay Availability Notice:** Real-time physical bay occupancy, live electrical tariffs, and equipment fault status are not monitored by physical hardware sensors. Station data reflects mapped open infrastructure.
3. **Route Reachability Disclaimer:** Reachability badges and driving distances use an empirical 1.30× Haversine circuity approximation and do not constitute verified turn-by-turn road navigation or traffic-aware routing. All reachable stops are explicitly tagged with `"Estimated within range — route unverified"`.
4. **Algorithmic Heuristic Scope:** The scheduling engine is an event-driven constrained heuristic optimized for sub-millisecond browser execution (~1 ms). Because multi-bay constrained scheduling is NP-hard, online heuristics are not claimed to be globally optimal for all arbitrary arrival sequences without an offline Mixed-Integer Linear Program (MILP) solver.

---

## 3. Scalability & Computational Efficiency

* **Microgrid Engine Time Complexity:** The scheduling heuristic executes in $O(T \cdot N \log N)$ time per planning horizon, where $T=10$ discrete slots and $N$ is the number of active vehicles in the queue. In standard browser V8 execution, the 6-vehicle baseline schedules in **~1.8 ms (Smart Slack)**, **~0.3 ms (EDF)**, and **~0.1 ms (FCFS)**.
* **Spatial Index Space & Time Complexity:** The backend spatial index partitions 28,553 records into 8,129 buckets, loading in ~1.2 seconds and serving proximity queries in **~15 milliseconds** with a **~117 MB RSS footprint** on Python 3.11.

---

## 4. Future Development Roadmap

To transition GridSathi AI from a functional software prototype into enterprise commercial operation, the following engineering integrations are planned:

1. **OCPP Protocol Gateway:** Implementation of Open Charge Point Protocol (OCPP 1.6J / 2.0.1) over WebSockets to transmit dynamic power curtailment profiles (`SetChargingProfile`) to physical EVSE hardware.
2. **Smart Sub-Metering Telemetry:** Real-time Modbus RTU / MQTT telemetry reading physical site power draw and rooftop solar inverter outputs.
3. **CPO Dynamic Availability APIs:** Integration with Indian charge point operators (Tata Power, Statiq, Jio-bp) for live socket availability and dynamic tariff feeds.
4. **Elevation-Aware Routing Engine:** Integration with an open routing engine (OSRM or Valhalla) to calculate topography-aware road distances and traffic delays.

---

## 5. Open Data Attribution & Licensing

1. **Nationwide EV Charging Infrastructure Dataset (India):** Built using mapped open-data charging station records curated under the Open Database License (ODbL) and Creative Commons Attribution 4.0 International (CC-BY 4.0).
2. **OpenStreetMap & Contributors:** Geospatial map tiles and geocoding powered by OpenStreetMap contributors, CartoDB Voyager, and Nominatim under ODbL.
3. **Open-Source Codebase:** Application source code is released under the MIT License.

---

## Related Documentation
* [Project Overview & Requirements](PROJECT_OVERVIEW.md)
* [Architecture & Data Flow](ARCHITECTURE.md)
* [Algorithms & Mathematical Formulations](ALGORITHMS.md)
* [Empirical Performance Benchmarks](BENCHMARKS.md)
* [Competitive Positioning](COMPETITIVE_POSITIONING.md)
* [Local Setup & Cloud Deployment Guide](SETUP_AND_DEPLOYMENT.md)
