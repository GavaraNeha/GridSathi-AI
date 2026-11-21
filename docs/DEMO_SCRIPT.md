# Suggested 4-minute demo script

**0:00–0:30 — Problem:** “Six EVs, three chargers, but only 14 kW available. Who gets power first, and what happens if the grid changes?”

**0:30–1:10 — Live topology:** Show active power, fleet deadlines and charger allocations. Explain that these are simulated vehicles and 30-minute slots.

**1:10–1:50 — Baseline comparison:** Switch between FCFS, EDF and GridSathi. Explain why metrics change; do not assert a win if the live data does not show one.

**1:50–2:40 — Judge disruption:** Toggle charger fault or brownout. Show that the schedule, capacity graph, missed targets and impacted vehicles update immediately.

**2:40–3:20 — Feasibility audit:** Explain the difference between a provable first-hour capacity shortfall and the heuristic's overall unmet energy. This distinction is a credibility advantage.

**3:20–4:00 — Roadmap:** State that the next milestone is exact OR-Tools optimization, charger integration and real-world calibration. End with one clear result measured on repeatable test scenarios.

## Questions to prepare for
1. Is this actually AI? — Currently a constrained scheduling heuristic, not an ML model; exact mathematical optimization is planned. Do not mislabel it.
2. Why not FCFS? — Show matched-scenario quantitative results, including cases where FCFS is equally good or better.
3. How is safety guaranteed? — In the model, allocated power never exceeds the site and per-bay limits; this is not a physical safety certification.
4. How did you measure fairness? — Jain's index on delivered/requested energy ratios, with its known limitations.
5. Is the data real? — No. Synthetic data is explicitly disclosed.
