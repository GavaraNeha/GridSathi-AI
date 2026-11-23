# GridSathi AI — Algorithmic Dispatch & Mathematical Foundations

This document details the mathematical formulations, physical constraint equations, priority queuing heuristics, and Linear Programming (LP) optimality proofs implemented in GridSathi AI's microgrid scheduling engine.

---

## 1. Feasibility-Aware Critical Slack Formulation

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

---

## 2. Physical Microgrid Dispatch Constraints

At every time slot $t$:
1. **Per-Bay Charger Rating Limit**:
   $$P_{x, b}(t) \le 7.0\text{ kW}, \quad \forall b \in \{1, \dots, B_{\max}\} \quad (B_{\max} = 2 \text{ under hardware fault, } 3 \text{ normally})$$
2. **Total Site Grid Ceiling**:
   $$\sum_{b=1}^{B_{\max}} P_{b}(t) \le P_{\text{grid\_limit}} + P_{\text{solar}}(t) \quad (P_{\text{grid\_limit}} \in \{7, 10, 14, 21\}\text{ kW}, \text{ capped at } 10\text{ kW under brownout, and } P_{\text{solar}}(t) \in [0, 4]\text{ kW})$$
3. **Energy Conservation (First Law of Thermodynamics)**:
   $$\sum_{t=0}^{t_{\text{due}, x}-1} P_x(t) \times 0.5\text{ h} \le E_{\text{requested}, x}, \quad \text{and} \quad \sum_{i=1}^N E_{\text{delivered}, i} + \sum_{i=1}^N E_{\text{unmet}, i} \equiv \sum_{i=1}^N E_{\text{requested}, i}$$
4. **Strict Deadline Enforcement**:
   $$P_x(t) = 0, \quad \forall t \ge t_{\text{due}, x}$$
5. **Bay Singularity**: Each vehicle occupies at most one bay per time slot:
   $$\sum_{b=1}^{B_{\max}} \mathbb{I}(x \text{ assigned to } b) \le 1$$

---

## 3. Jain's Fairness Index

To evaluate equitable power distribution across all fleet drivers:

$$J(x) = \frac{\left(\sum_{i=1}^{n} f_i\right)^2}{n \sum_{i=1}^{n} f_i^2}, \quad \text{where } f_i = \begin{cases} \frac{E_{\text{delivered}, i}}{E_{\text{requested}, i}} & \text{if } E_{\text{requested}, i} > 0 \\ 1.0 & \text{otherwise} \end{cases}$$

---

## 4. Linear Programming Feasibility Bound (Baseline Campus Scenario)

To assess whether the baseline shortfall of 14.86 kWh under Smart Slack is avoidable, we formulated and solved the linear-programming upper bound maximizing delivered energy across all 10 slots subject to all grid, per-bay, arrival, and deadline constraints for the standard six-vehicle campus microgrid workload (`BASE_VEHICLES` under 14 kW grid cap):

$$\max \sum_{i=0}^5 \sum_{t=0}^{d_i-1} 0.5 \cdot p_{i,t} \quad \text{s.t.} \quad \sum_{i=0}^5 p_{i,t} \le 14\text{ kW}, \quad 0 \le p_{i,t} \le 7\text{ kW}, \quad \sum_{t=0}^{d_i-1} 0.5 \cdot p_{i,t} \le D_i$$

* **Continuous LP Upper Bound:** **53.90 kWh**
* **Discrete EDF Simulation:** Delivers **53.90 kWh** using $\le 3$ active bays in every slot.
* **Exact Zero Duality Gap:** Because the discrete schedule matches the relaxed continuous upper bound, **53.90 kWh is the mathematically proven global optimum for deliverable energy strictly within this specific baseline six-vehicle campus simulation scenario (`BASE_VEHICLES` under 14 kW grid limit)**. This optimality proof does not generalize to arbitrary online arrival sequences, varying fleet compositions, or unconstrained grid scales.
* **True Minimum Deficit (Baseline Scenario):** $68.26 - 53.90 = \mathbf{14.36\text{ kWh}}$ (for the baseline 6-vehicle scenario; not a universal bound across arbitrary workloads).
* **Algorithmic Trade-off:** Smart Slack delivers 53.40 kWh (14.86 kWh deficit), exhibiting an algorithmic trade-off gap of exactly 0.50 kWh against offline EDF in this static baseline. In exchange, Smart Slack is designed with an explicit algorithmic objective to avoid starvation of near-term feasible vehicles when unpredictable emergency arrivals occur (by prioritizing feasible vehicles with near-zero slack in Group 0 ahead of over-demanding requests). As shown in Scenario 8, this heuristic structure prioritizes timely delivery for feasible deadlines rather than optimizing purely for aggregate volume.

---

## 5. Algorithmic Trade-Off Analysis

Smart Slack is **not claimed to be universally superior** to Earliest Deadline First (EDF) or First-Come, First-Served (FCFS) across all operating environments:

* **Static Feasible Queues:** When all arriving vehicles have feasible deadlines and no unexpected disruptions occur, offline EDF achieves higher aggregate delivered energy (53.90 kWh vs. 53.40 kWh) because it schedules strictly by deadline urgency without slack partitioning overhead.
* **Unconstrained Low-Density Queues:** Under low-density arrivals where total concurrent demand never approaches transformer limits, FCFS performs adequately and completes identical on-time vehicle counts (3/6) without requiring deadline tracking.
* **Dynamic Emergency Disruptions:** Smart Slack's advantage emerges during sudden grid disruptions, hardware faults, and emergency arrivals (Scenario 8). By isolating infeasible requests in Group 1, Smart Slack prevents impossible charging demands from preempting achievable charging windows, safeguarding feasible vehicle deadlines from starvation.

---

## Related Documentation
* [Project Overview & Requirements](PROJECT_OVERVIEW.md)
* [Architecture & Data Flow](ARCHITECTURE.md)
* [Empirical Performance Benchmarks](BENCHMARKS.md)
* [Competitive Positioning](COMPETITIVE_POSITIONING.md)
* [Local Setup & Cloud Deployment Guide](SETUP_AND_DEPLOYMENT.md)
* [Validation, Transparency Matrix & Limitations](VALIDATION_AND_LIMITATIONS.md)
