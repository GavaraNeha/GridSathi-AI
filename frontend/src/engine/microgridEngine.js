/**
 * GridSathi AI — Microgrid Scheduling Engine (ES Module)
 * Constrained heuristic for 3-bay EV load scheduling with transformer limits,
 * dynamic solar generation, disruption modeling, and Jain's fairness index.
 * 100% mathematically aligned with the verified 48-invariant engine.js suite.
 */

export const COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

export const BASE_VEHICLES = [
  { id: 'EV-1', name: 'Tata Nexon EV', battery: 32, soc: 42, target: 55, due: 1, arrival: 0 },
  { id: 'EV-2', name: 'BYD Atto 3', battery: 60, soc: 40, target: 70, due: 3, arrival: 0 },
  { id: 'EV-3', name: 'MG ZS EV', battery: 40, soc: 30, target: 58, due: 1.5, arrival: 0 },
  { id: 'EV-4', name: 'Kia EV6', battery: 70, soc: 55, target: 82, due: 5, arrival: 0 },
  { id: 'EV-5', name: 'Hyundai Kona', battery: 40, soc: 45, target: 70, due: 2, arrival: 0 },
  { id: 'EV-6', name: 'Mahindra XUV400', battery: 40, soc: 51, target: 66, due: 1.5, arrival: 0 },
];

export const TARIFF = [6.5, 6.5, 5.0, 5.0, 4.5, 4.5, 5.0, 6.0, 7.5, 8.5];

export function demand(ev) {
  if (ev.energyReq != null && !isNaN(ev.energyReq) && Number(ev.energyReq) > 0) {
    return Number(ev.energyReq);
  }
  return Math.max(0, ((ev.target - ev.soc) * ev.battery) / 100);
}

export function solarAt(t, enabled) {
  return enabled ? [0, 0, 1, 2, 3, 4, 3, 2, 1, 0][t] : 0;
}

export function clock(t) {
  const mins = 600 + Math.round(t * 30);
  const h = String(Math.floor(mins / 60)).padStart(2, '0');
  const m = String(mins % 60).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Executes scheduling simulation.
 * @param {Array} vehicles
 * @param {Object} options { capacity: 14, fault: false, brownout: false, solar: false }
 * @param {string} mode 'smart' | 'fcfs' | 'edf'
 */
export function runScheduler(vehicles, options = {}, mode = 'smart') {
  const cap = Number(options.capacity ?? 14);
  const fault = Boolean(options.fault);
  const brownout = Boolean(options.brownout);
  const solar = Boolean(options.solar);

  const n = 10;
  const slots = [];
  const remaining = vehicles.map(demand);
  const delivered = vehicles.map(() => 0);
  const allocations = vehicles.map(() => Array(n).fill(0));

  const maxBays = fault ? 2 : 3;
  const gridCap = Math.min(cap, brownout ? 10 : Infinity);
  const peakMax = gridCap + 4;

  for (let t = 0; t < n; t++) {
    const siteLimit = gridCap + solarAt(t, solar);
    const bayAssignments = Array(maxBays).fill(null);
    let left = siteLimit;

    const eligible = vehicles
      .map((ev, i) => ({
        ev,
        i,
        need: remaining[i],
        dueSlot: Math.round(ev.due * 2),
        arrivalSlot: Math.round((ev.arrival || 0) * 2),
      }))
      .filter((x) => x.need > 0.000001 && x.arrivalSlot <= t && t < x.dueSlot);

    const priority = (x) => {
      if (mode === 'fcfs') return [x.arrivalSlot, x.i];
      if (mode === 'edf') return [x.dueSlot, x.i];
      // Smart: Feasibility-Aware Slack Priority
      // Group 0 (Critical Feasible): 0 <= slack < slotCap. Must charge this slot or becomes infeasible.
      // Group 1 (Imminent Infeasible / Emergency): slack < 0. Infeasible for 100%, best-effort charge before departure.
      // Group 2 (Buffered Feasible): slack >= slotCap. Has >= 30 min buffer; safely yields to urgent needs.
      const maxPower = x.ev.maxKw ? Number(x.ev.maxKw) : 7;
      const bayLimit = Math.min(maxPower, 7);
      const slotCap = bayLimit * 0.5;
      const availableSlots = Math.max(1, x.dueSlot - t);
      const maxAchievable = availableSlots * slotCap;
      const slack = maxAchievable - x.need;

      if (slack >= -1e-6 && slack < slotCap - 1e-6) {
        return [0, slack, x.dueSlot, x.i];
      } else if (slack < -1e-6) {
        return [1, x.dueSlot, -slack, x.i];
      } else {
        return [2, slack, x.dueSlot, x.i];
      }
    };

    eligible.sort((a, b) => {
      const p = priority(a);
      const q = priority(b);
      for (let k = 0; k < p.length; k++) {
        if (p[k] !== q[k]) return p[k] - q[k];
      }
      return 0;
    });

    for (let b = 0; b < maxBays; b++) {
      const choice = eligible.find(
        (x) => remaining[x.i] > 0.000001 && !bayAssignments.some((z) => z?.i === x.i)
      );
      if (!choice || left < 0.000001) break;

      const maxPower = choice.ev.maxKw ? Number(choice.ev.maxKw) : 7;
      const power = Math.min(maxPower, 7, left, remaining[choice.i] / 0.5);
      if (power < 0.000001) break;

      const energy = power * 0.5;
      remaining[choice.i] = Math.max(0, remaining[choice.i] - energy);
      delivered[choice.i] += energy;
      allocations[choice.i][t] = power;

      bayAssignments[b] = {
        i: choice.i,
        carIndex: choice.i,
        id: choice.ev.id,
        power,
        kw: power,
      };
      left -= power;
    }

    slots.push({
      t,
      time: clock(t),
      tariff: TARIFF[t],
      solar: solarAt(t, solar),
      limit: siteLimit,
      gridLimit: gridCap,
      load: siteLimit - left,
      bays: bayAssignments,
    });
  }

  const unmet = remaining.reduce((a, b) => a + b, 0);
  const total = vehicles.reduce((a, v) => a + demand(v), 0);
  const onTime = vehicles.filter((v, i) => remaining[i] < 0.00001).length;
  const cost = slots.reduce((a, s) => a + s.load * 0.5 * s.tariff, 0);
  const peak = Math.max(0, ...slots.map((s) => s.load));
  const fractions = vehicles.map((v, i) => (demand(v) > 0 ? delivered[i] / demand(v) : 1));
  const sumFractions = fractions.reduce((a, b) => a + b, 0);
  const sumSqFractions = fractions.reduce((a, b) => a + b * b, 0);
  const fairness = sumFractions ** 2 / (vehicles.length * sumSqFractions || 1);
  const violations = slots.filter((s) => s.load > s.limit + 1e-7).length;

  return {
    mode,
    vehicles,
    slots,
    remaining,
    delivered,
    allocations,
    unmet,
    total,
    onTime,
    cost,
    peak,
    fairness,
    violations,
    gridCap,
    peakMax,
    maxBays,
  };
}
