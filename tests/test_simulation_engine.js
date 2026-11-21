/**
 * GridSathi AI — Dual Engine Parity & Invariant Test Suite
 * Compares the original verified engine.js against frontend/src/engine/microgridEngine.js
 * across 96 scenarios (48 standard + 48 brownout/emergency combinations).
 * Verifies exact numerical parity, physical constraints, energy conservation,
 * deadline enforcement, and Jain's fairness index mathematical bounds.
 */

const assert = require('node:assert/strict');
const path = require('node:path');

// 1. Load legacy engine.js
require('../engine.js');
const legacyEngine = globalThis.GridEngine;

async function runTests() {
  console.log('=== GridSathi AI: Dual Engine Verification Suite ===');

  // 2. Dynamically import React ES module engine
  const esmModule = await import('../frontend/src/engine/microgridEngine.js');
  const { runScheduler, BASE_VEHICLES, demand: esmDemand } = esmModule;

  let scenariosTested = 0;
  let parityChecksPassed = 0;

  const modes = ['smart', 'edf', 'fcfs'];
  const capacities = [7, 10, 14, 21];
  const faults = [false, true];
  const solars = [false, true];
  const brownouts = [false, true];

  for (const mode of modes) {
    for (const capacity of capacities) {
      for (const fault of faults) {
        for (const solar of solars) {
          for (const brownout of brownouts) {
            scenariosTested++;
            const opts = { capacity, fault, solar, brownout };

            // Run both engines
            const rLegacy = legacyEngine.run(legacyEngine.BASE, opts, mode);
            const rESM = runScheduler(BASE_VEHICLES, opts, mode);

            // Invariant 1: Slots length must be exactly 10
            assert.equal(rESM.slots.length, 10, 'Slot count must be 10');
            assert.equal(rESM.violations, 0, 'Must have zero site limit violations');

            // Invariant 2: Physical Bay and Power Constraints
            const expectedMaxBays = fault ? 2 : 3;
            assert.equal(rESM.maxBays, expectedMaxBays, 'Max bays mismatch');

            for (let t = 0; t < 10; t++) {
              const sESM = rESM.slots[t];
              const sLeg = rLegacy.slots[t];

              // Parity checks
              assert(Math.abs(sESM.load - sLeg.load) < 1e-6, `Load parity slot ${t}`);
              assert(Math.abs(sESM.limit - sLeg.limit) < 1e-6, `Limit parity slot ${t}`);

              // Constraint checks
              assert(sESM.load <= sESM.limit + 1e-7, `Slot ${t} load exceeds site limit`);
              const activeBays = sESM.bays.filter(Boolean);
              assert(activeBays.length <= expectedMaxBays, `Active bays exceed limit in slot ${t}`);

              for (const bay of activeBays) {
                assert(bay.power <= 7.0 + 1e-7, 'Bay power exceeds 7.0 kW hardware limit');
                assert(bay.power >= 0, 'Bay power cannot be negative');
              }
            }

            // Invariant 3: Vehicle Delivery and Deadline Invariants
            for (let i = 0; i < BASE_VEHICLES.length; i++) {
              const reqEnergy = esmDemand(BASE_VEHICLES[i]);
              assert(rESM.delivered[i] <= reqEnergy + 1e-6, `Vehicle ${i} over-delivered`);
              assert(rESM.remaining[i] >= -1e-6, `Vehicle ${i} remaining energy negative`);

              // No charging after departure due slot
              const dueSlot = Math.round(BASE_VEHICLES[i].due * 2);
              for (let t = dueSlot; t < 10; t++) {
                assert.equal(
                  rESM.allocations[i][t],
                  0,
                  `Vehicle ${i} allocated power after deadline at slot ${t}`
                );
              }

              // Parity check per vehicle
              assert(
                Math.abs(rESM.delivered[i] - rLegacy.delivered[i]) < 1e-6,
                `Delivered parity vehicle ${i}`
              );
              assert(
                Math.abs(rESM.remaining[i] - rLegacy.remaining[i]) < 1e-6,
                `Remaining parity vehicle ${i}`
              );
            }

            // Invariant 4: First Law of Thermodynamics (Energy Conservation)
            const sumDelivered = rESM.delivered.reduce((a, b) => a + b, 0);
            assert(
              Math.abs(rESM.unmet + sumDelivered - rESM.total) < 1e-6,
              'Energy conservation violated: unmet + delivered != total requested'
            );

            // Invariant 5: Jain's Fairness Index bounds [0, 1]
            assert(rESM.fairness >= 0.0 && rESM.fairness <= 1.0 + 1e-6, 'Jain fairness out of [0, 1] bounds');
            assert(Math.abs(rESM.fairness - rLegacy.fairness) < 1e-6, 'Fairness parity mismatch');

            // Invariant 6: Cost Parity
            assert(Math.abs(rESM.cost - rLegacy.cost) < 1e-5, 'Cost parity mismatch');

            parityChecksPassed++;
          }
        }
      }
    }
  }

  // 3. Emergency Fleet Vehicle Dynamic Addition Scenario
  console.log('Testing Dynamic Emergency Vehicle Insertion...');
  const emergencyFleet = [
    ...structuredClone(BASE_VEHICLES),
    { id: 'EV-7', name: 'Emergency Vehicle', battery: 30, soc: 15, target: 65, due: 0.5, arrival: 0 },
  ];
  const rSmartEmergency = runScheduler(emergencyFleet, { capacity: 14 }, 'smart');
  const rFcfsEmergency = runScheduler(emergencyFleet, { capacity: 14 }, 'fcfs');

  assert.equal(rSmartEmergency.slots.length, 10);
  assert.equal(rSmartEmergency.violations, 0);
  // Emergency vehicle has tight deadline (due 0.5h = slot 0 only); Smart policy prioritizes urgent slack
  console.log(` - Smart On-time with Emergency: ${rSmartEmergency.onTime}/${emergencyFleet.length}`);
  console.log(` - FCFS On-time with Emergency:  ${rFcfsEmergency.onTime}/${emergencyFleet.length}`);

  console.log(`\nALL CHECKS PASSED: ${scenariosTested} Scenarios Tested`);
  console.log(` - Numerical Parity between engine.js and microgridEngine.js: 100%`);
  console.log(` - Physical capacity, bay allocations, deadlines & conservation: 0 violations.`);
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
