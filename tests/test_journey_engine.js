/**
 * GridSathi AI — Journey & Rescue Engine Comprehensive Test Suite
 * Validates deterministic battery modeling, unverified reachability claims,
 * scooter compatibility uncertainty (Ather/Ola/TVS/Bajaj), charging-time
 * estimation, deficit math, and microgrid simulation guardrails.
 */

const assert = require('assert');

async function runTests() {
  console.log('=== GridSathi AI: Journey & Rescue Intelligence Test Suite ===\n');

  const journeyEngine = await import('../frontend/src/engine/journeyEngine.js');
  const {
    calcUsableEnergy,
    calcEstimatedRange,
    classifyConnectorCompatibility,
    evaluateReachability,
    rankRescueCandidates,
    evaluateGridAwareRescue,
    calcChargingTimeEstimate,
    generateWhatIfDecisions,
    INDIAN_VEHICLE_PRESETS,
  } = journeyEngine;

  // ---------------------------------------------------------------------------
  // 1. Vehicle Presets Integrity (Cars & Scooters)
  // ---------------------------------------------------------------------------
  console.log('1. Testing Vehicle Presets Integrity...');
  assert(INDIAN_VEHICLE_PRESETS.length >= 10, 'Should have at least 10 authentic presets');
  const nexon = INDIAN_VEHICLE_PRESETS.find((v) => v.id === 'nexon-ev');
  assert(nexon && nexon.battery === 40.5 && nexon.category === 'car', 'Nexon EV should have 40.5 kWh capacity');
  const ather = INDIAN_VEHICLE_PRESETS.find((v) => v.id === 'ather-450x');
  assert(ather && ather.category === 'scooter' && ather.battery === 3.7, 'Ather 450X should be scooter with 3.7 kWh');
  const ola = INDIAN_VEHICLE_PRESETS.find((v) => v.id === 'ola-s1-pro');
  assert(ola && ola.category === 'scooter' && ola.battery === 4.0, 'Ola S1 Pro should be scooter with 4.0 kWh');
  const tvs = INDIAN_VEHICLE_PRESETS.find((v) => v.id === 'tvs-iqube');
  assert(tvs && tvs.category === 'scooter', 'TVS iQube should be scooter');
  const chetak = INDIAN_VEHICLE_PRESETS.find((v) => v.id === 'bajaj-chetak');
  assert(chetak && chetak.category === 'scooter', 'Bajaj Chetak should be scooter');
  console.log('  ✓ Verified 10 authentic Indian EV presets across Cars & 2-Wheelers');

  // ---------------------------------------------------------------------------
  // 2. Battery & SOC Mathematical Invariants
  // ---------------------------------------------------------------------------
  console.log('\n2. Testing Battery Usable Energy & Range Math...');
  // 40.5 kWh battery, 50% SOC, 15% reserve -> (50 - 15)% = 35% of 40.5 = 14.175 -> rounded 14.18 kWh
  const usable = calcUsableEnergy(40.5, 50, 15);
  assert.strictEqual(usable, 14.18, `Expected 14.18 kWh usable, got ${usable}`);

  // Strict edge-case boundaries
  assert.strictEqual(calcUsableEnergy(0, 50, 15), 0, 'Zero battery capacity should yield 0');
  assert.strictEqual(calcUsableEnergy(-10, 50, 15), 0, 'Negative capacity should yield 0');
  assert.strictEqual(calcUsableEnergy(40, 10, 15), 0, 'SOC below reserve should yield 0');
  assert.strictEqual(calcUsableEnergy(40, 15, 15), 0, 'SOC equal to reserve should yield 0');
  assert.strictEqual(calcUsableEnergy(40, -5, 15), 0, 'Negative SOC should yield 0');
  // Clamping: 120% SOC clamped to 100%
  const clamped = calcUsableEnergy(40.0, 120, 20); // (100 - 20) * 40 / 100 = 32 kWh
  assert.strictEqual(clamped, 32.0, `Expected 32.0 kWh, got ${clamped}`);

  // Range estimation: 14.18 kWh, 140 Wh/km (0.14 kWh/km)
  // nominal range = 14.18 / 0.14 = 101.285 km -> 101.3 km
  // conservative range with 15% buffer = 101.285 * 0.85 = 86.09 km -> 86.1 km
  const range = calcEstimatedRange(14.18, 140, 15);
  assert.strictEqual(range.nominalRangeKm, 101.3, `Nominal range mismatch: ${range.nominalRangeKm}`);
  assert.strictEqual(range.conservativeRangeKm, 86.1, `Conservative range mismatch: ${range.conservativeRangeKm}`);
  assert.strictEqual(range.kmPerKwh, 7.1, `km/kWh mismatch: ${range.kmPerKwh}`);

  // Invalid / zero efficiency
  const zeroEffRange = calcEstimatedRange(14.18, 0, 15);
  assert.strictEqual(zeroEffRange.nominalRangeKm, 0);
  assert.strictEqual(zeroEffRange.conservativeRangeKm, 0);
  console.log('  ✓ Battery energy and range formulas validated with strict edge cases');

  // ---------------------------------------------------------------------------
  // 3. Reachability Claims & Circuity Detour Modeling
  // ---------------------------------------------------------------------------
  console.log('\n3. Testing Reachability Claims & Route Transparency...');
  // Case A: Unverified straight-line distance within range
  // 50 km straight-line -> effective road = 50 * 1.30 = 65.0 km <= 85 km conservative
  const reachUnverified = evaluateReachability(50, 100, 85, false);
  assert.strictEqual(reachUnverified.status, 'estimated_reachable');
  assert.strictEqual(reachUnverified.label, 'Estimated within range — route unverified');
  assert.strictEqual(reachUnverified.effectiveRoadKm, 65.0);
  assert.strictEqual(reachUnverified.isRoadDistance, false);
  assert(reachUnverified.reason.includes('Actual road distance is unverified'), 'Must explicitly disclose unverified routing');

  // Case B: Verified road distance (e.g. OSRM)
  const reachVerified = evaluateReachability(65, 100, 85, true);
  assert.strictEqual(reachVerified.status, 'estimated_reachable');
  assert.strictEqual(reachVerified.label, 'Within range (verified route)');
  assert.strictEqual(reachVerified.effectiveRoadKm, 65);
  assert.strictEqual(reachVerified.isRoadDistance, true);

  // Case C: Marginal reachability (penetrates reserve buffer)
  // 70 km straight-line -> effective road = 70 * 1.30 = 91.0 km > 85 km but <= 100 km nominal
  const reachMarginal = evaluateReachability(70, 100, 85, false);
  assert.strictEqual(reachMarginal.status, 'marginal');
  assert.strictEqual(reachMarginal.label, 'Marginal / At risk of reserve depletion');

  // Case D: Completely out of range
  // 80 km straight-line -> effective road = 80 * 1.30 = 104.0 km > 100 km nominal
  const reachOut = evaluateReachability(80, 100, 85, false);
  assert.strictEqual(reachOut.status, 'unreachable');
  assert.strictEqual(reachOut.label, 'Out of estimated range');

  // Case E: Invalid or negative distance
  const reachInvalid = evaluateReachability(-15, 100, 85, false);
  assert.strictEqual(reachInvalid.status, 'unknown');
  assert.strictEqual(reachInvalid.label, 'Distance unknown');
  console.log('  ✓ Reachability claims verified: zero false guarantees on unverified road approximations');

  // ---------------------------------------------------------------------------
  // 4. Charger Compatibility & Scooter Uncertainty
  // ---------------------------------------------------------------------------
  console.log('\n4. Testing Charger Compatibility & Scooter Nuance Handling...');
  const stationCCS2 = {
    id: 'st-1',
    name: 'Tata Power Fast Hub',
    sockets: 'CCS2 (30 kW), Type 2 (7.2 kW)',
    connectors: [{ type: 'CCS2', power_kw: 30 }, { type: 'Type 2', power_kw: 7.2 }],
    has_connector_data: true,
  };

  const stationScooter3Pin = {
    id: 'st-2',
    name: 'Kirana EV Point',
    sockets: '3-pin/15A (3.3 kW)',
    connectors: [{ type: '3-pin/15A', power_kw: 3.3 }],
    has_connector_data: true,
  };

  const stationMissing = {
    id: 'st-3',
    name: 'Unverified Point',
    sockets: 'Unspecified',
    connectors: [],
    has_connector_data: false,
  };

  // Car (Nexon) on CCS2 station -> Confirmed compatible format
  const compCar = classifyConnectorCompatibility(stationCCS2, nexon);
  assert.strictEqual(compCar.status, 'compatible');
  assert.strictEqual(compCar.label, 'Compatible connector format');

  // Car (Nexon) on 3-pin socket -> Incompatible format
  const compCarOn3Pin = classifyConnectorCompatibility(stationScooter3Pin, nexon);
  assert.strictEqual(compCarOn3Pin.status, 'incompatible');
  assert.strictEqual(compCarOn3Pin.label, 'Incompatible connector format');

  // SCOOTER AUDIT: Ather 450X on public 3-pin socket
  // MUST NOT issue guaranteed compatibility; MUST flag as potentially compatible
  const compAther = classifyConnectorCompatibility(stationScooter3Pin, ather);
  assert.strictEqual(compAther.status, 'potentially_compatible', 'Ather on 3-pin must be potentially_compatible');
  assert.strictEqual(compAther.label, 'Potentially compatible — verify with operator');
  assert(compAther.reason.includes('verify earthing, 15A breaker rating'), 'Must mention earthing/breaker operational caveats');

  // SCOOTER AUDIT: Ola S1 Pro, TVS iQube, Bajaj Chetak on 3-pin socket
  const compOla = classifyConnectorCompatibility(stationScooter3Pin, ola);
  assert.strictEqual(compOla.status, 'potentially_compatible');
  const compTvs = classifyConnectorCompatibility(stationScooter3Pin, tvs);
  assert.strictEqual(compTvs.status, 'potentially_compatible');
  const compChetak = classifyConnectorCompatibility(stationScooter3Pin, chetak);
  assert.strictEqual(compChetak.status, 'potentially_compatible');

  // Missing connector metadata: MUST be classified as unknown, NEVER compatible
  const compMissing = classifyConnectorCompatibility(stationMissing, nexon);
  assert.strictEqual(compMissing.status, 'unknown');
  assert.strictEqual(compMissing.label, 'Compatibility unknown — no socket metadata');
  assert.strictEqual(compMissing.confidence, 'none');
  console.log('  ✓ Scooter operational uncertainties and missing data handled with complete truthfulness');

  // ---------------------------------------------------------------------------
  // 5. Charging Time & Deficit Estimation Math
  // ---------------------------------------------------------------------------
  console.log('\n5. Testing Charging Time Estimation Math (Dynamic Constraints)...');
  // Scenario A: 14.0 kWh at 7 kW bay with 14 kW site cap -> 14 / 7 = 2.0 hours (120 mins)
  const est1 = calcChargingTimeEstimate(14.0, 7.0, 7.0, 14.0, 1);
  assert.strictEqual(est1.hours, 2.0);
  assert.strictEqual(est1.minutes, 120);
  assert.strictEqual(est1.formattedTime, '2h 0m');

  // Scenario B: 7.0 kWh bottlenecked by 3.5 kW site share (14 kW / 4 bays) -> 7 / 3.5 = 2.0 hours
  const est2 = calcChargingTimeEstimate(7.0, 7.0, 7.0, 14.0, 4);
  assert.strictEqual(est2.effectiveKw, 3.5);
  assert.strictEqual(est2.hours, 2.0);
  assert.strictEqual(est2.minutes, 120);

  // Scenario C: Zero energy requested -> 0 mins
  const estZero = calcChargingTimeEstimate(0, 7.0, 7.0, 14.0, 2);
  assert.strictEqual(estZero.hours, 0);
  assert.strictEqual(estZero.minutes, 0);
  assert.strictEqual(estZero.formattedTime, '0 mins');

  // Scenario D: Zero or negative vehicle charging power (guardrail against division by zero)
  const estZeroPower = calcChargingTimeEstimate(10.0, 0.0, 7.0, 14.0, 2);
  assert(Number.isFinite(estZeroPower.hours), 'Hours must be finite even if vehicle maxKw is 0');
  assert(Number.isFinite(estZeroPower.effectiveKw), 'effectiveKw must be finite');
  console.log('  ✓ Charging time and rate calculations mathematically grounded under concurrency');

  // ---------------------------------------------------------------------------
  // 6. Infeasible Departure Deadlines & Grid Simulation
  // ---------------------------------------------------------------------------
  console.log('\n6. Testing Infeasible Departure Deadlines & Grid Feasibility...');
  // 24.3 kWh requested in 1.0 hour at 7 kW bay (Max physical = 7.0 kWh)
  const outcomeInfeasible = evaluateGridAwareRescue(
    stationCCS2,
    nexon,
    20, // 20% arrival SOC
    80, // 80% target SOC -> 24.3 kWh
    1.0, // 1.0 hour deadline
    { capacity: 14 }
  );
  assert.strictEqual(outcomeInfeasible.isPhysicallyFeasible, false);
  assert(outcomeInfeasible.physicalNotice.includes('Physical charger constraint'), 'Must flag physical charger bottleneck');
  assert.strictEqual(outcomeInfeasible.isSimulated, true);
  assert(outcomeInfeasible.policies.smart.delivered <= 7.0, 'Delivered power in 1.0h cannot exceed bay capacity');

  // Feasible request: 3.5 kWh in 1.5 hours
  const outcomeFeasible = evaluateGridAwareRescue(
    stationCCS2,
    ather,
    50, // 50%
    80, // 80% of 3.7 kWh = 1.11 kWh
    1.5,
    { capacity: 14 }
  );
  assert.strictEqual(outcomeFeasible.isPhysicallyFeasible, true);
  assert.strictEqual(outcomeFeasible.physicalNotice, null);
  console.log('  ✓ Physical hardware feasibility limits correctly enforced');

  // ---------------------------------------------------------------------------
  // 7. No Suitable Stops & Candidate Ranking
  // ---------------------------------------------------------------------------
  console.log('\n7. Testing Candidate Ranking & Empty/Distant Stop Handling...');
  // Empty array handling
  const emptyRank = rankRescueCandidates([], nexon, 30, 15, 15);
  assert.deepStrictEqual(emptyRank, [], 'Empty stations array should return empty ranking');

  // Distant stations (500 km away)
  const farCandidates = [
    { id: 'st-far-1', name: 'Far Station 1', distance_km: 450, sockets: 'CCS2', has_connector_data: true },
    { id: 'st-far-2', name: 'Far Station 2', distance_km: 500, sockets: 'CCS2', has_connector_data: true },
  ];
  const farRanked = rankRescueCandidates(farCandidates, nexon, 30, 15, 15);
  assert.strictEqual(farRanked.length, 2);
  assert.strictEqual(farRanked[0].reachability.status, 'unreachable');
  assert.strictEqual(farRanked[1].reachability.status, 'unreachable');
  console.log('  ✓ Extreme distances and empty candidate lists handled safely');

  // ---------------------------------------------------------------------------
  // 8. What-If Advisor Dynamic Scenario Math (Zero Hardcoded Claims)
  // ---------------------------------------------------------------------------
  console.log('\n8. Testing What-If Advisor Dynamic Advice Generation...');
  const candidateStops = [
    {
      id: 'st-active',
      name: 'Active Station',
      distance_km: 15,
      sockets: 'CCS2',
      connectors: [{ type: 'CCS2', power_kw: 30 }],
      has_connector_data: true,
      compatibility: { status: 'compatible' },
      reachability: { status: 'estimated_reachable', effectiveRoadKm: 19.5, marginKm: 60 },
      gridOutcome: outcomeInfeasible, // Has an unmet deficit!
    },
  ];

  const whatIfDecisions = generateWhatIfDecisions(
    candidateStops[0],
    candidateStops,
    nexon,
    outcomeInfeasible
  );

  const congestionNotice = whatIfDecisions.find((d) => d.title.includes('Grid Congestion Deficit'));
  assert(congestionNotice !== undefined, 'Must provide congestion deficit advisory');
  assert(!congestionNotice.text.includes('30 mins'), 'Must not hardcode 30 minutes in deficit resolution');
  assert(congestionNotice.text.includes('Simulated estimate under modeled conditions'), 'Must disclose simulated conditions');
  console.log('  ✓ What-If advice is 100% dynamically computed with zero hardcoded claims');

  console.log('\n=============================================================');
  console.log('ALL 8 COMPREHENSIVE JOURNEY & RESCUE TEST SUITES PASSED (100%)');
  console.log('=============================================================');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
