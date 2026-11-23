/**
 * GridSathi AI — Charge Rescue & Journey Intelligence Engine
 * Provides deterministic battery range modeling, conservative reserve budgeting,
 * truthful connector compatibility classification, reachability evaluation,
 * and grid-aware microgrid charging simulations.
 *
 * 100% Free & Open-Source — Pure client-side calculations with zero external billing.
 */

import { BASE_VEHICLES, runScheduler, demand, clock } from './microgridEngine.js';

// =============================================================================
// Authentic Indian EV Fleet Presets (Cars & 2-Wheelers)
// =============================================================================
export const INDIAN_VEHICLE_PRESETS = [
  // --- Electric Cars ---
  {
    id: 'nexon-ev',
    name: 'Tata Nexon EV Long Range',
    category: 'car',
    battery: 40.5, // kWh
    consumptionWhPerKm: 140, // Wh/km (~7.14 km/kWh)
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 50.0,
    acMaxKw: 7.2,
    description: 'India’s bestselling electric SUV with 40.5 kWh LFP pack',
  },
  {
    id: 'tiago-ev',
    name: 'Tata Tiago EV',
    category: 'car',
    battery: 24.0,
    consumptionWhPerKm: 110, // Wh/km (~9.09 km/kWh)
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 25.0,
    acMaxKw: 3.3,
    description: 'Compact city hatchback with 24 kWh liquid-cooled pack',
  },
  {
    id: 'mg-zs-ev',
    name: 'MG ZS EV',
    category: 'car',
    battery: 50.3,
    consumptionWhPerKm: 150, // Wh/km (~6.67 km/kWh)
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 50.0,
    acMaxKw: 7.4,
    description: '50.3 kWh prismatic pack with 176 PS permanent magnet motor',
  },
  {
    id: 'xuv400',
    name: 'Mahindra XUV400 EL Pro',
    category: 'car',
    battery: 39.4,
    consumptionWhPerKm: 145, // Wh/km (~6.90 km/kWh)
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 50.0,
    acMaxKw: 7.2,
    description: 'Dual-frequency damper SUV with 39.4 kWh IP67 battery',
  },
  {
    id: 'byd-atto3',
    name: 'BYD Atto 3',
    category: 'car',
    battery: 60.5,
    consumptionWhPerKm: 150,
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 80.0,
    acMaxKw: 7.0,
    description: 'BYD Blade Battery (LFP) with ultra-high thermal stability',
  },
  {
    id: 'ioniq-5',
    name: 'Hyundai Ioniq 5',
    category: 'car',
    battery: 72.6,
    consumptionWhPerKm: 160,
    defaultConnector: 'CCS2',
    supportedConnectors: ['CCS2', 'Type 2'],
    maxKw: 150.0,
    acMaxKw: 11.0,
    description: '800V E-GMP architecture with high-speed DC charging',
  },

  // --- Electric Scooters / 2-Wheelers ---
  {
    id: 'ather-450x',
    name: 'Ather 450X (Gen 3)',
    category: 'scooter',
    battery: 3.7, // kWh
    consumptionWhPerKm: 35, // Wh/km (~28.57 km/kWh)
    defaultConnector: '3-pin/15A',
    supportedConnectors: ['3-pin/15A', 'Bharat AC-001', 'Type6'],
    maxKw: 3.3,
    acMaxKw: 1.5,
    description: 'Performance 2-wheeler with 3.7 kWh aluminium die-cast pack',
  },
  {
    id: 'ola-s1-pro',
    name: 'Ola S1 Pro (Gen 2)',
    category: 'scooter',
    battery: 4.0,
    consumptionWhPerKm: 38,
    defaultConnector: '3-pin/15A',
    supportedConnectors: ['3-pin/15A', 'Type6', 'Bharat AC-001'],
    maxKw: 3.3,
    acMaxKw: 1.5,
    description: 'High-speed electric scooter with 4.0 kWh lithium-ion battery',
  },
  {
    id: 'tvs-iqube',
    name: 'TVS iQube S',
    category: 'scooter',
    battery: 3.04,
    consumptionWhPerKm: 32,
    defaultConnector: '3-pin/15A',
    supportedConnectors: ['3-pin/15A', 'Bharat AC-001'],
    maxKw: 1.5,
    acMaxKw: 0.95,
    description: 'Family commuter EV with dual 52V battery packs',
  },
  {
    id: 'bajaj-chetak',
    name: 'Bajaj Chetak Premium',
    category: 'scooter',
    battery: 3.2,
    consumptionWhPerKm: 33,
    defaultConnector: '3-pin/15A',
    supportedConnectors: ['3-pin/15A', 'Bharat AC-001'],
    maxKw: 1.5,
    acMaxKw: 0.8,
    description: 'Metal body scooter with 3.2 kWh battery and onboard 800W charger',
  },
];

export const CONNECTOR_TYPES = [
  'CCS2',
  'Type 2',
  '3-pin/15A',
  'Bharat AC-001',
  'Type6',
  'CHAdeMO',
  'GB/T',
  'Bharat DC-001',
  'IEC-60309',
];

// =============================================================================
// Deterministic Battery & Range Calculations (Feature B)
// =============================================================================

/**
 * Calculates usable battery energy accounting for reserve safety margin.
 *
 * Formula:
 * Usable Energy (kWh) = Battery Capacity (kWh) × max(0, Current SOC - Reserve SOC) / 100
 *
 * @param {number} batteryKwh - Pack capacity in kWh
 * @param {number} currentSoc - Current state of charge (0-100)
 * @param {number} reserveSoc - Minimum safety reserve (0-100)
 * @returns {number} Usable energy in kWh
 */
export function calcUsableEnergy(batteryKwh, currentSoc, reserveSoc = 15) {
  const cap = Number(batteryKwh);
  const soc = Number(currentSoc);
  const res = Number(reserveSoc);

  if (isNaN(cap) || cap <= 0) return 0;
  if (isNaN(soc) || soc <= 0) return 0;

  const validSoc = Math.min(100, Math.max(0, soc));
  const validRes = isNaN(res) ? 15 : Math.min(100, Math.max(0, res));

  if (validSoc <= validRes) return 0;

  const usable = (cap * (validSoc - validRes)) / 100;
  return Math.round(usable * 100) / 100;
}

/**
 * Calculates nominal and conservative reachable distances.
 *
 * Formulas:
 * Nominal Distance (km) = Usable Energy (kWh) / (Consumption (Wh/km) / 1000)
 * Conservative Distance (km) = Nominal Distance × (1 - Safety Margin % / 100)
 *
 * @param {number} usableEnergyKwh - Usable energy from calcUsableEnergy
 * @param {number} consumptionWhPerKm - Efficiency in Wh/km
 * @param {number} safetyBufferPct - Safety margin percentage (e.g. 15%)
 * @returns {Object} Range breakdown
 */
export function calcEstimatedRange(usableEnergyKwh, consumptionWhPerKm, safetyBufferPct = 15) {
  const energy = Number(usableEnergyKwh) || 0;
  const whPerKm = Number(consumptionWhPerKm);
  const buffer = Number(safetyBufferPct) || 15;

  if (energy <= 0 || isNaN(whPerKm) || whPerKm <= 0) {
    return {
      usableEnergyKwh: 0,
      nominalRangeKm: 0,
      conservativeRangeKm: 0,
      safetyBufferPct: buffer,
      kmPerKwh: whPerKm > 0 ? Math.round((1000 / whPerKm) * 10) / 10 : 0,
    };
  }

  const kwhPerKm = whPerKm / 1000;
  const nominalRangeKm = energy / kwhPerKm;
  const bufferMultiplier = Math.max(0, 1 - Math.min(50, Math.max(0, buffer)) / 100);
  const conservativeRangeKm = nominalRangeKm * bufferMultiplier;

  return {
    usableEnergyKwh: energy,
    nominalRangeKm: Math.round(nominalRangeKm * 10) / 10,
    conservativeRangeKm: Math.round(conservativeRangeKm * 10) / 10,
    safetyBufferPct: buffer,
    kmPerKwh: Math.round((1 / kwhPerKm) * 10) / 10,
  };
}

// =============================================================================
// Charger Compatibility Confidence Classifier (Feature D)
// =============================================================================

/**
 * Classifies station compatibility based strictly on authentic metadata evidence.
 * Distinguishes confirmed connector-format matches from operational 2-wheeler
 * charging realities (earthing, breaker rating, locking enclosure).
 * Never turns missing connector data into a positive compatibility claim.
 *
 * @param {Object} station - Station record from backend or client dataset
 * @param {Object|string} vehicleOrConnector - Vehicle object or connector string
 * @param {string|null} categoryOverride - Optional category ('car' | 'scooter')
 * @returns {Object} Compatibility assessment
 */
export function classifyConnectorCompatibility(
  station,
  vehicleOrConnector = 'CCS2',
  categoryOverride = null
) {
  if (!station) {
    return {
      status: 'unknown',
      confidence: 'none',
      label: 'Compatibility unknown — no socket metadata',
      badgeColor: 'amber',
      reason: 'No station metadata available.',
      matchedSockets: [],
    };
  }

  let requiredConnector = 'CCS2';
  let category = categoryOverride || 'car';
  let vehicleName = 'vehicle';

  if (typeof vehicleOrConnector === 'object' && vehicleOrConnector !== null) {
    requiredConnector = vehicleOrConnector.defaultConnector || 'CCS2';
    category = vehicleOrConnector.category || categoryOverride || 'car';
    vehicleName = vehicleOrConnector.name || 'EV';
  } else if (typeof vehicleOrConnector === 'string') {
    requiredConnector = vehicleOrConnector;
    if (requiredConnector.toLowerCase().includes('3-pin') || requiredConnector.toLowerCase().includes('type6')) {
      category = categoryOverride || 'scooter';
    }
  }

  // 1. Check for genuine connector list or socket string
  const hasRawConnectors = Array.isArray(station.connectors) && station.connectors.length > 0;
  const rawSocketsStr = (station.sockets || '').trim();
  const hasExplicitSockets =
    rawSocketsStr.length > 0 &&
    rawSocketsStr.toLowerCase() !== 'unspecified' &&
    rawSocketsStr.toLowerCase() !== 'standard ev bay';

  if (!hasRawConnectors && !hasExplicitSockets && station.has_connector_data !== true) {
    return {
      status: 'unknown',
      confidence: 'none',
      label: 'Compatibility unknown — no socket metadata',
      badgeColor: 'amber',
      reason:
        'This station does not advertise specific socket types in the national registry. Confirm compatibility locally before arrival.',
      matchedSockets: [],
    };
  }

  // Normalize search targets
  const target = (requiredConnector || 'CCS2').toLowerCase().replace(/[^a-z0-9]/g, '');

  const availableSockets = [];
  if (hasRawConnectors) {
    for (const c of station.connectors) {
      if (typeof c === 'object' && c?.type) {
        availableSockets.push(String(c.type));
      } else if (typeof c === 'string') {
        availableSockets.push(c);
      }
    }
  }
  if (hasExplicitSockets) {
    for (const s of rawSocketsStr.split(',')) {
      const trimmed = s.trim();
      if (trimmed && !availableSockets.includes(trimmed)) {
        availableSockets.push(trimmed);
      }
    }
  }

  // Match target connector against available sockets
  const matched = availableSockets.filter((sock) => {
    const norm = sock.toLowerCase().replace(/[^a-z0-9]/g, '');
    return norm.includes(target) || target.includes(norm);
  });

  if (matched.length > 0) {
    // Audit check for 2-wheelers / scooters:
    // A 3-pin, Type 6, or Bharat AC-001 match is a connector format match,
    // but does NOT automatically guarantee vehicle charging compatibility
    // due to unverified earthing, breaker limits (5A vs 15A), or locked enclosures.
    const isScooterSocket = matched.some((m) => {
      const low = m.toLowerCase();
      return low.includes('3-pin') || low.includes('15a') || low.includes('type6') || low.includes('bharat ac');
    });

    if (category === 'scooter' && isScooterSocket) {
      return {
        status: 'potentially_compatible',
        confidence: 'moderate',
        label: 'Potentially compatible — verify with operator',
        badgeColor: 'blue',
        reason: `Station lists ${matched.join(', ')} socket format. For ${vehicleName}, verify earthing, 15A breaker rating, and portable cable access with the site operator before relying on this stop.`,
        matchedSockets: matched,
      };
    }

    return {
      status: 'compatible',
      confidence: 'high',
      label: 'Compatible connector format',
      badgeColor: 'emerald',
      reason: `Verified ${matched.join(', ')} socket matches your vehicle's ${requiredConnector} inlet format.`,
      matchedSockets: matched,
    };
  }

  return {
    status: 'incompatible',
    confidence: 'high',
    label: 'Incompatible connector format',
    badgeColor: 'rose',
    reason: `Station advertises [${availableSockets.join(', ')}], but does not provide ${requiredConnector}.`,
    matchedSockets: [],
  };
}

// =============================================================================
// Reachability Evaluator (Feature C)
// =============================================================================

/**
 * Evaluates whether a station is estimated to be reachable based on distance and range.
 *
 * Grounding & Truthfulness Rules:
 * - Differentiates straight-line distance, estimated road distance, and verified routed distance.
 * - Never labels an approximation as definitively "Safe" or "Safely Reachable".
 * - Uses transparent wording: "Estimated within range — route unverified".
 *
 * @param {number} distanceKm - Measured distance in km (straight-line or route)
 * @param {number} nominalRangeKm - Nominal range without safety buffer
 * @param {number} conservativeRangeKm - Conservative range with safety buffer
 * @param {boolean} isRoadDistance - True ONLY if calculated from verified road routing (e.g. OSRM)
 * @returns {Object} Reachability status
 */
export function evaluateReachability(
  distanceKm,
  nominalRangeKm,
  conservativeRangeKm,
  isRoadDistance = false
) {
  const dist = Number(distanceKm);
  if (isNaN(dist) || dist < 0) {
    return {
      status: 'unknown',
      label: 'Distance unknown',
      badgeColor: 'gray',
      distanceKm: 0,
      straightLineKm: 0,
      effectiveRoadKm: 0,
      isRoadDistance: false,
      marginKm: 0,
      reason: 'Distance coordinates unavailable.',
    };
  }

  const straightLineKm = Math.round(dist * 10) / 10;
  // If only straight-line Haversine distance is available, model realistic 1.30x road circuity
  const CIRCA_FACTOR = 1.3;
  const effectiveRoadKm = isRoadDistance
    ? straightLineKm
    : Math.round(straightLineKm * CIRCA_FACTOR * 10) / 10;

  const marginKm = Math.round((conservativeRangeKm - effectiveRoadKm) * 10) / 10;

  if (effectiveRoadKm <= conservativeRangeKm) {
    return {
      status: 'estimated_reachable',
      label: isRoadDistance
        ? 'Within range (verified route)'
        : 'Estimated within range — route unverified',
      badgeColor: 'emerald',
      distanceKm: dist,
      straightLineKm,
      effectiveRoadKm,
      isRoadDistance,
      marginKm,
      reason: isRoadDistance
        ? `Reachable with ~${marginKm} km safety reserve remaining on verified road route.`
        : `Straight-line: ${straightLineKm} km. Estimated road travel (~${effectiveRoadKm} km with 1.3× circuity) is within your conservative range (${conservativeRangeKm} km). Actual road distance is unverified.`,
    };
  }

  if (effectiveRoadKm <= nominalRangeKm) {
    return {
      status: 'marginal',
      label: 'Marginal / At risk of reserve depletion',
      badgeColor: 'amber',
      distanceKm: dist,
      straightLineKm,
      effectiveRoadKm,
      isRoadDistance,
      marginKm,
      reason: `Straight-line: ${straightLineKm} km. Estimated road travel (~${effectiveRoadKm} km) may reach the station but will deplete your protected safety reserve (${Math.abs(marginKm)} km shortfall vs conservative target).`,
    };
  }

  return {
    status: 'unreachable',
    label: 'Out of estimated range',
    badgeColor: 'rose',
    distanceKm: dist,
    straightLineKm,
    effectiveRoadKm,
    isRoadDistance,
    marginKm,
    reason: `Straight-line: ${straightLineKm} km. Estimated road travel (~${effectiveRoadKm} km) exceeds your total nominal battery range (${nominalRangeKm} km).`,
  };
}

// =============================================================================
// Charging Time & Deficit Estimator (Feature E / F Math)
// =============================================================================

/**
 * Calculates estimated charging duration and additional time needed to resolve deficits.
 * Purely mathematical model under simulated microgrid constraints.
 *
 * @param {number} energyKwh - Energy to deliver
 * @param {number} vehicleMaxKw - Maximum vehicle charging kW
 * @param {number} bayMaxKw - Station bay limit (typically 7.0 kW AC)
 * @param {number} transformerLimitKw - Station transformer capacity (default 14.0 kW)
 * @param {number} activeConcurrency - Number of competing bays active
 * @returns {Object} Estimated duration and effective rate
 */
export function calcChargingTimeEstimate(
  energyKwh,
  vehicleMaxKw = 7.0,
  bayMaxKw = 7.0,
  transformerLimitKw = 14.0,
  activeConcurrency = 2
) {
  const energy = Math.max(0, Number(energyKwh) || 0);
  const vKw = Math.max(0.1, Number(vehicleMaxKw) || 7.0);
  const bKw = Math.max(0.1, Number(bayMaxKw) || 7.0);
  const tKw = Math.max(0.1, Number(transformerLimitKw) || 14.0);
  const concurrency = Math.max(1, Number(activeConcurrency) || 1);

  // Effective charging speed is bottlenecked by vehicle inlet, bay hardware, and site share
  const siteShareKw = tKw / concurrency;
  const effectiveKw = Math.max(0.1, Math.min(vKw, bKw, siteShareKw));

  if (energy <= 0) {
    return {
      hours: 0,
      minutes: 0,
      effectiveKw: Math.round(effectiveKw * 10) / 10,
      formattedTime: '0 mins',
    };
  }

  const hours = energy / effectiveKw;
  const totalMins = Math.ceil(hours * 60);

  return {
    hours: Math.round(hours * 10) / 10,
    minutes: totalMins,
    effectiveKw: Math.round(effectiveKw * 10) / 10,
    formattedTime:
      totalMins >= 60
        ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
        : `${totalMins} mins`,
  };
}

// =============================================================================
// Candidate Stop Ranking (Feature C)
// =============================================================================

/**
 * Transparently ranks candidate rescue stops based on reachability, compatibility,
 * detour, and verified power metadata.
 *
 * @param {Array} stations - List of station objects
 * @param {Object} vehicle - Vehicle config
 * @param {number} currentSoc - Current state of charge
 * @param {number} reserveSoc - Safety reserve
 * @param {number} safetyBufferPct - Safety margin
 * @returns {Array} Ranked candidate stops
 */
export function rankRescueCandidates(
  stations = [],
  vehicle,
  currentSoc,
  reserveSoc = 15,
  safetyBufferPct = 15
) {
  if (!Array.isArray(stations) || stations.length === 0 || !vehicle) return [];

  const usableEnergy = calcUsableEnergy(vehicle.battery, currentSoc, reserveSoc);
  const rangeInfo = calcEstimatedRange(usableEnergy, vehicle.consumptionWhPerKm, safetyBufferPct);

  return stations
    .map((station) => {
      const distance = Number(station.distance_km ?? 0);
      const isRoad = Boolean(station.is_road_distance);

      const reachability = evaluateReachability(
        distance,
        rangeInfo.nominalRangeKm,
        rangeInfo.conservativeRangeKm,
        isRoad
      );

      const compatibility = classifyConnectorCompatibility(station, vehicle);

      // Deterministic ranking score:
      // Reachability: estimated_reachable = 300, marginal = 150, unreachable = 0
      // Compatibility: compatible = 200, potentially_compatible = 150, unknown = 80, incompatible = 0
      // Distance penalty: -2 points per effective road km
      // Corroborated sources bonus: +5 points per source
      let score = 0;
      if (reachability.status === 'estimated_reachable' || reachability.status === 'safe') {
        score += 300;
      } else if (reachability.status === 'marginal') {
        score += 150;
      } else {
        score += 0;
      }

      if (compatibility.status === 'compatible') {
        score += 200;
      } else if (compatibility.status === 'potentially_compatible') {
        score += 150;
      } else if (compatibility.status === 'unknown') {
        score += 80;
      } else {
        score += 0;
      }

      score -= reachability.effectiveRoadKm * 2;
      score += (station.sources_count || 1) * 5;

      return {
        ...station,
        reachability,
        compatibility,
        rankingScore: Math.round(score),
      };
    })
    .sort((a, b) => b.rankingScore - a.rankingScore);
}

// =============================================================================
// Grid-Aware Microgrid Outcome Evaluator (Feature E)
// =============================================================================

/**
 * Simulates charging the rescue vehicle at the selected station across
 * Smart (Slack-Priority), EDF, and FCFS policies under transformer limits.
 *
 * @param {Object} station - Selected station
 * @param {Object} vehicle - Vehicle config
 * @param {number} arrivalSoc - SOC when arriving at the station
 * @param {number} targetSoc - Desired charge target SOC (e.g. 80%)
 * @param {number} deadlineHours - Planned stay duration (e.g. 1.5h)
 * @param {Object} microgridOptions - Microgrid capacity & disruption settings
 * @returns {Object} Comparative scheduling outcome
 */
export function evaluateGridAwareRescue(
  station,
  vehicle,
  arrivalSoc,
  targetSoc = 80,
  deadlineHours = 1.5,
  microgridOptions = {}
) {
  const cap = Number(microgridOptions.capacity || 14);
  const arrival = Math.max(0, Math.min(100, Number(arrivalSoc) || 15));
  const target = Math.max(arrival, Math.min(100, Number(targetSoc) || 80));
  const due = Math.max(0.5, Number(deadlineHours) || 1.5);

  const neededEnergy = (vehicle.battery * (target - arrival)) / 100;
  const roundedEnergy = Math.round(neededEnergy * 10) / 10;

  // Rescue vehicle to inject into the simulated microgrid
  const rescueEV = {
    id: 'EV-RESCUE',
    name: `${vehicle.name} (Rescue)`,
    battery: vehicle.battery,
    soc: arrival,
    target: target,
    energyReq: roundedEnergy,
    arrival: 0.0,
    due: due,
    maxKw: Math.min(vehicle.maxKw || 7.0, 7.0), // Cap to station bay hardware limit (7 kW)
  };

  // Run with existing base background fleet (EV-1 to EV-3 representing active bay occupants)
  const backgroundFleet = BASE_VEHICLES.slice(0, 3);
  const testFleet = [...backgroundFleet, rescueEV];
  const candIdx = testFleet.length - 1;

  const simOptions = {
    capacity: cap,
    fault: Boolean(microgridOptions.fault),
    brownout: Boolean(microgridOptions.brownout),
    solar: Boolean(microgridOptions.solar),
  };

  const results = {};
  for (const mode of ['smart', 'edf', 'fcfs']) {
    const outcome = runScheduler(testFleet, simOptions, mode);
    const delivered = outcome.delivered[candIdx];
    const unmet = outcome.remaining[candIdx];
    const onTime = unmet < 0.001;
    const pct =
      roundedEnergy > 0 ? Math.min(100, Math.round((delivered / roundedEnergy) * 100)) : 100;

    results[mode] = {
      delivered: Math.round(delivered * 10) / 10,
      unmet: Math.round(unmet * 10) / 10,
      onTime,
      pctDelivered: pct,
      totalCost: outcome.cost,
      fairness: Math.round(outcome.fairness * 100),
    };
  }

  // Physical feasibility check
  const maxBayCapacityKwh = due * (rescueEV.maxKw || 7.0);
  const isPhysicallyFeasible = roundedEnergy <= maxBayCapacityKwh;

  let physicalNotice = null;
  if (!isPhysicallyFeasible) {
    physicalNotice = `Physical charger constraint: Delivering ${roundedEnergy} kWh at a 7 kW charger requires at least ${(roundedEnergy / 7.0).toFixed(1)}h. Your planned ${due}h departure window is physically insufficient.`;
  }

  return {
    isSimulated: true,
    stationName: station?.name || 'Selected Station',
    operator: station?.operator || 'Unknown Operator',
    capacity: cap,
    requestedEnergyKwh: roundedEnergy,
    deadlineHours: due,
    departureClock: clock(Math.round(due * 2)),
    isPhysicallyFeasible,
    physicalNotice,
    policies: results,
  };
}

// =============================================================================
// Explainable What-If Decision Generator (Feature F)
// =============================================================================

/**
 * Generates transparent plain-language advice comparing selected station,
 * alternative stops, and parameter tweaks (charging target or deadline).
 * All duration estimates are calculated dynamically from energy deficits
 * and effective charging speeds under simulated conditions.
 *
 * @param {Object} selectedCandidate - Station chosen by user
 * @param {Array} allCandidates - Ranked candidate list
 * @param {Object} vehicle - Vehicle config
 * @param {Object} gridOutcome - Output from evaluateGridAwareRescue
 * @returns {Array} Plain-language insight cards
 */
export function generateWhatIfDecisions(
  selectedCandidate,
  allCandidates = [],
  vehicle,
  gridOutcome
) {
  const insights = [];

  if (!selectedCandidate) {
    return [
      {
        title: 'Select a Station',
        type: 'info',
        text: 'Select a candidate charging stop to view grid-aware scheduling analysis and what-if alternatives.',
      },
    ];
  }

  // 1. Grid Feasibility & Deficit Analysis (Simulated Conditions)
  if (gridOutcome) {
    const smart = gridOutcome.policies?.smart;
    const fcfs = gridOutcome.policies?.fcfs;
    const requested = gridOutcome.requestedEnergyKwh || 0;
    const delivered = smart?.delivered || 0;
    const unmet = Math.max(0, Math.round((requested - delivered) * 10) / 10);

    if (smart?.onTime) {
      insights.push({
        title: 'Charging Window On-Time',
        type: 'success',
        text: `Under simulated ${gridOutcome.capacity} kW microgrid limits, the Smart Optimizer is projected to deliver all ${requested} kWh before departure at ${gridOutcome.departureClock}. (Simulated estimate under modeled conditions)`,
      });
    } else {
      // Calculate dynamic additional time needed from actual unmet deficit
      const deficitEstimate = calcChargingTimeEstimate(
        unmet,
        vehicle?.maxKw || 7.0,
        7.0, // bay cap
        gridOutcome.capacity || 14.0,
        2 // average active concurrency
      );

      insights.push({
        title: 'Simulated Grid Congestion Deficit',
        type: 'warning',
        text: `Smart scheduling delivers ${delivered} of ${requested} kWh (${smart?.pctDelivered ?? 0}%) by ${gridOutcome.departureClock} under simulated contention. Delivering the remaining ${unmet} kWh deficit requires an estimated ~${deficitEstimate.formattedTime} of additional charging at ~${deficitEstimate.effectiveKw} kW effective rate. (Simulated estimate under modeled conditions)`,
        deficitMins: deficitEstimate.minutes,
        deficitKwh: unmet,
      });
    }

    if (smart && fcfs && smart.pctDelivered > fcfs.pctDelivered) {
      insights.push({
        title: 'Smart vs Baseline Advantage',
        type: 'info',
        text: `Smart Slack prioritization delivers ${smart.delivered} kWh vs ${fcfs.delivered} kWh under unmanaged FCFS (${smart.pctDelivered - fcfs.pctDelivered}% more energy delivered under simulated 14 kW transformer limits).`,
      });
    }
  }

  // 2. Compatibility & Scooter Guidance
  const comp = selectedCandidate.compatibility;
  if (comp?.status === 'potentially_compatible') {
    insights.push({
      title: 'Scooter 3-Pin / Socket Advisory',
      type: 'warning',
      text: comp.reason || 'Public 3-pin AC sockets often have earthing or breaker restrictions. Verify socket accessibility and amperage with the site operator before driving.',
    });
  } else if (comp?.status === 'unknown') {
    insights.push({
      title: 'Unverified Socket Metadata',
      type: 'warning',
      text: 'This station lacks verified socket records in the public dataset. Confirm plug standards locally before relying on this location.',
    });
  } else if (comp?.status === 'incompatible') {
    insights.push({
      title: 'Critical Socket Incompatibility',
      type: 'error',
      text: `Station does not provide ${vehicle?.defaultConnector || 'CCS2'}. This stop cannot charge your vehicle.`,
    });
  }

  // 3. Alternative Stop Search
  const verifiedAlt = allCandidates.find(
    (c) =>
      c.id !== selectedCandidate.id &&
      (c.reachability?.status === 'estimated_reachable' || c.reachability?.status === 'safe') &&
      c.compatibility?.status === 'compatible'
  );

  if (verifiedAlt && selectedCandidate.compatibility?.status !== 'compatible') {
    insights.push({
      title: `Recommended Alternative: ${verifiedAlt.name}`,
      type: 'recommendation',
      text: `${verifiedAlt.name} (est. ~${verifiedAlt.reachability?.effectiveRoadKm} km away) advertises verified ${verifiedAlt.sockets || 'compatible'} sockets and is within estimated range with ~${verifiedAlt.reachability?.marginKm} km reserve.`,
      targetStationId: verifiedAlt.id,
    });
  }

  return insights;
}
