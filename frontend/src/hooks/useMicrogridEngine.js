import { useState, useMemo, useCallback } from 'react';
import {
  BASE_VEHICLES,
  runScheduler,
  demand,
  clock,
  COLORS,
} from '../engine/microgridEngine';

export function useMicrogridEngine(initialContext = null) {
  const [vehicles, setVehicles] = useState(() => structuredClone(BASE_VEHICLES));
  const [mode, setMode] = useState('smart');
  const [capacity, setCapacity] = useState(14);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
  const [stationContext, setStationContext] = useState(initialContext);

  const [events, setEvents] = useState({
    fault: false,
    brownout: false,
    solar: false,
    emergency: false,
  });

  const toggleEvent = useCallback((eventName) => {
    setEvents((prev) => {
      const nextVal = !prev[eventName];
      const updated = { ...prev, [eventName]: nextVal };

      if (eventName === 'emergency') {
        setVehicles((curr) => {
          if (nextVal) {
            // Add emergency high-urgency vehicle if not already added
            if (!curr.some((v) => v.id === 'EV-7')) {
              return [
                ...curr,
                {
                  id: 'EV-7',
                  name: 'Emergency Fleet Van',
                  battery: 30,
                  soc: 15,
                  target: 65,
                  due: 0.5,
                  arrival: 0,
                },
              ];
            }
            return curr;
          } else {
            return curr.filter((v) => v.id !== 'EV-7');
          }
        });
      }
      return updated;
    });
  }, []);

  const addVehicle = useCallback((newVehicle) => {
    setVehicles((curr) => {
      const nextNum =
        Math.max(
          0,
          ...curr.map((v) => {
            const m = v.id.match(/\d+/);
            return m ? Number(m[0]) : 0;
          })
        ) + 1;

      const battery = Number(newVehicle.battery || newVehicle.capacity) || 40;
      const soc = Number(newVehicle.soc) || 20;
      const target = Number(newVehicle.target) || 80;
      const energyReq =
        newVehicle.energyReq != null && Number(newVehicle.energyReq) > 0
          ? Number(newVehicle.energyReq)
          : Math.max(0, ((target - soc) * battery) / 100);

      const created = {
        id: `EV-${nextNum}`,
        name: (newVehicle.name || newVehicle.model || `Fleet EV-${nextNum}`).trim(),
        battery,
        soc,
        target,
        energyReq,
        due: Number(newVehicle.due) || 2.0,
        arrival: Number(newVehicle.arrival) || 0,
        maxKw: Number(newVehicle.maxKw) || 7,
      };

      const updated = [...curr, created];
      setSelectedVehicleIndex(updated.length - 1);
      return updated;
    });
  }, []);

  const resetSimulation = useCallback(() => {
    setVehicles(structuredClone(BASE_VEHICLES));
    setMode('smart');
    setCapacity(14);
    setSelectedVehicleIndex(0);
    setEvents({
      fault: false,
      brownout: false,
      solar: false,
      emergency: false,
    });
  }, []);

  const applyStationContext = useCallback((station) => {
    if (!station) return;
    setStationContext(station);
    // If station has parsed capacity, adapt transformer capacity
    if (station.capacity) {
      const numBays = parseInt(station.capacity, 10);
      if (!isNaN(numBays) && numBays > 0) {
        // Approximate standard 7kW per bay with 0.7 diversity factor
        const calculatedCap = Math.min(21, Math.max(7, Math.round(numBays * 7 * 0.7)));
        setCapacity(calculatedCap);
      }
    }
  }, []);

  const simulationOptions = useMemo(
    () => ({
      capacity,
      fault: events.fault,
      brownout: events.brownout,
      solar: events.solar,
    }),
    [capacity, events]
  );

  const unDisruptedBaseline = useMemo(
    () =>
      runScheduler(
        BASE_VEHICLES,
        { capacity: 14, fault: false, brownout: false, solar: false },
        mode
      ),
    [mode]
  );

  const currentResult = useMemo(
    () => runScheduler(vehicles, simulationOptions, mode),
    [vehicles, simulationOptions, mode]
  );

  const baselineResult = useMemo(
    () => runScheduler(vehicles, simulationOptions, 'fcfs'),
    [vehicles, simulationOptions]
  );

  // Comparison metrics vs baseline FCFS
  const comparison = useMemo(() => {
    const diffOnTime = currentResult.onTime - baselineResult.onTime;
    const diffEnergy = baselineResult.unmet - currentResult.unmet;
    return {
      diffOnTime,
      diffEnergy,
    };
  }, [currentResult, baselineResult]);

  // Feature 3: Explainable Disruption Replay Diff & Rationale
  const disruptionDiff = useMemo(() => {
    const isDisrupted =
      events.fault ||
      events.brownout ||
      events.solar ||
      events.emergency ||
      capacity !== 14 ||
      vehicles.length !== BASE_VEHICLES.length;

    if (!isDisrupted) return null;

    const deltaOnTime = currentResult.onTime - unDisruptedBaseline.onTime;
    const deltaUnmet = currentResult.unmet - unDisruptedBaseline.unmet;
    const deltaCost = currentResult.cost - unDisruptedBaseline.cost;
    const deltaFairness =
      Math.round(currentResult.fairness * 100) -
      Math.round(unDisruptedBaseline.fairness * 100);

    const vehicleShifts = currentResult.vehicles.map((ev, idx) => {
      const baseIdx = unDisruptedBaseline.vehicles.findIndex((v) => v.id === ev.id);
      const baseDelivered = baseIdx >= 0 ? unDisruptedBaseline.delivered[baseIdx] : 0;
      const curDelivered = currentResult.delivered[idx];
      const deltaKwh = curDelivered - baseDelivered;

      let status = 'unchanged';
      if (baseIdx < 0) {
        status = 'injected';
      } else if (deltaKwh < -0.05) {
        status = 'lost';
      } else if (deltaKwh > 0.05) {
        status = 'gained';
      }

      return {
        id: ev.id,
        name: ev.name || ev.model,
        baseDelivered,
        curDelivered,
        deltaKwh,
        status,
        due: ev.due,
      };
    });

    const reasons = [];
    if (events.fault) {
      reasons.push(
        'Bay 3 hardware outage forced 33% reduction in simultaneous bay capacity (2 bays active). The scheduler prioritized vehicles with the tightest deadline slack.'
      );
    }
    if (events.brownout) {
      reasons.push(
        'Grid brownout throttled the site transformer ceiling to 10.0 kW, preventing concurrent high-power charging across all bays.'
      );
    }
    if (events.solar) {
      reasons.push(
        'Midday solar generation injected up to 4.0 kW auxiliary clean energy during 11:00-14:00, allowing secondary vehicles to charge without transformer overdraw.'
      );
    }
    if (events.emergency) {
      reasons.push(
        'Emergency Vehicle (EV-7) arrived with an urgent 30-minute deadline (10:30). Due to negative slack, the optimizer preempted immediate 7.0 kW power in Bay 1.'
      );
    }
    if (capacity !== 14 && !events.brownout) {
      reasons.push(
        `Transformer capacity set to ${capacity.toFixed(1)} kW (baseline standard: 14.0 kW).`
      );
    }

    return {
      deltaOnTime,
      deltaUnmet,
      deltaCost,
      deltaFairness,
      vehicleShifts,
      reasons,
      baselineResult: unDisruptedBaseline,
    };
  }, [events, capacity, vehicles, currentResult, unDisruptedBaseline]);

  return {
    vehicles,
    mode,
    setMode,
    capacity,
    setCapacity,
    events,
    toggleEvent,
    selectedVehicleIndex,
    setSelectedVehicleIndex,
    stationContext,
    applyStationContext,
    addVehicle,
    resetSimulation,
    result: currentResult,
    baseline: baselineResult,
    unDisruptedBaseline,
    disruptionDiff,
    comparison,
    simulationOptions,
    demand,
    clock,
    COLORS,
  };
}
