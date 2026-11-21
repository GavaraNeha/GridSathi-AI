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

      const created = {
        id: `EV-${nextNum}`,
        name: newVehicle.name.trim() || `Fleet EV-${nextNum}`,
        battery: Number(newVehicle.battery) || 40,
        soc: Number(newVehicle.soc) || 20,
        target: Number(newVehicle.target) || 80,
        due: Number(newVehicle.due) || 2.0,
        arrival: 0,
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
    comparison,
    demand,
    clock,
    COLORS,
  };
}
