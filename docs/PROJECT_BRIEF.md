# GridSathi AI — HackWithAditya Level 1 project brief

**Theme:** Energy, EV & Sustainability

## One-line pitch
A disruption-aware EV charging scheduler for power-constrained campuses that makes limited electricity allocation transparent, measurable and fair.

## Problem
A campus may have more EV charging demand than the installed bays or transformer headroom can simultaneously support. First-come-first-served schedules may miss urgent departures. Operators need a way to test different allocation policies, understand deadline shortfalls and respond to sudden outages.

## Proposed solution
GridSathi simulates EV arrivals, energy requirements, charging bays, transformer capacity and variable tariffs. It generates schedules under three policies, visualizes bay utilization and reports target completion, energy deficits, electricity cost and Jain fairness. A judge can trigger a charger fault, brownout, emergency arrival or solar surplus and immediately see the impact.

## Current Level 1 deliverables
- Runnable browser application with sample data and interactive disruptions
- Three deterministic scheduling heuristics/baselines
- Constraint checks and repeatable tests
- Scenario audit and first-hour feasibility lower-bound explanation
- Source code, setup instructions and demo script

## What is novel in this implementation
Not smart charging in general, which already exists. The differentiation is a single explainable demonstration integrating deadline-aware dispatch, baseline comparisons, disruption testing, per-driver impacts and a limited mathematically grounded feasibility check.

## Honest scope
This is a synthetic-data, software-only simulator. It does not control physical EV chargers, forecast actual solar generation or guarantee globally optimal schedules. The main engine is a heuristic; exact optimization is a planned enhancement.

## Potential measurable outcomes
Evaluate 20+ generated scenarios across different arrival profiles and capacity limits. Report the fraction of targets met, unmet kWh, energy cost, site violations and compute time for all algorithms. Publish both wins and losses against baselines.

## Team information — to fill in
- Team name: [ADD]
- Team leader: [ADD]
- Team members: [ADD]
- GitHub repository: [ADD]
- Deployed demo URL: [ADD]
- Real stakeholder interview / validation: [ADD IF COMPLETED]

## AI assistance disclosure
Initial project scaffolding, scheduling logic and documentation were generated with AI assistance. The team must understand, validate and revise the implementation and disclose tools used according to event rules.
