# Roadmap

## Level 1: must-have
- [x] Working browser UI closely matching the supplied screenshots
- [x] Six sample EVs and three charging bays
- [x] Three scheduling strategies
- [x] Site limit slider and four disruption controls
- [x] Per-EV results, fairness, costs and deadline metrics
- [x] Allocation ribbon and power graph
- [x] Constraint tests
- [ ] Record real demo video and upload to a team-owned link
- [ ] Obtain stakeholder feedback from campus facilities or EV charging users
- [ ] Publish GitHub history under the team's own account

## Before claiming an optimizer is optimal
- [ ] Replace heuristic with OR-Tools CP-SAT or linear/mixed-integer solver
- [ ] Model binary vehicle-to-bay assignment and charging power by time slot
- [ ] Add charging efficiency, battery taper and connector compatibility
- [ ] Prove optimality or report optimality gap and solver time
- [ ] Benchmark 20–100 seeded scenarios with transparent data

## Level 2 enhancement ideas
- [ ] Rolling-horizon rescheduling with event logs
- [ ] Time-varying campus non-EV demand and solar forecasts
- [ ] Priority policies with configurable fairness guarantees
- [ ] Charger interoperability via OCPP test simulator
- [ ] Cost/CO2 trade-off frontier and robust optimization
- [ ] Persistent database, auth and reproducible scenario exports
