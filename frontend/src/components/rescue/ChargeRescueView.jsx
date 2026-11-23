import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Compass,
  Zap,
  Sparkles,
  Info,
  Car,
  Layers,
  ArrowRight,
} from 'lucide-react';
import VehicleProfileCard from './VehicleProfileCard';
import BatteryRangeCard from './BatteryRangeCard';
import StationRescueFinder from './StationRescueFinder';
import GridRescueSimulator from './GridRescueSimulator';
import WhatIfAdvisor from './WhatIfAdvisor';
import { INDIAN_VEHICLE_PRESETS, evaluateGridAwareRescue } from '../../engine/journeyEngine';

export default function ChargeRescueView({
  onSwitchToSimulation,
  onSwitchToDiscovery,
}) {
  // Vehicle profile state
  const [selectedPresetId, setSelectedPresetId] = useState('nexon-ev');
  const [vehicle, setVehicle] = useState(() => ({ ...INDIAN_VEHICLE_PRESETS[0] }));

  // Battery & Range state
  const [currentSoc, setCurrentSoc] = useState(28); // 28% typical rescue scenario
  const [reserveSoc, setReserveSoc] = useState(15);
  const [safetyBufferPct, setSafetyBufferPct] = useState(15);

  // Microgrid stay & target state
  const [targetSoc, setTargetSoc] = useState(80);
  const [deadlineHours, setDeadlineHours] = useState(1.5);

  // Selected station for deep audit
  const [selectedStation, setSelectedStation] = useState(null);

  // Preset switch handler
  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    if (presetId === 'custom') {
      setVehicle({
        id: 'custom-ev',
        name: 'Custom Electric Vehicle',
        category: 'car',
        battery: 40.0,
        consumptionWhPerKm: 140,
        defaultConnector: 'CCS2',
        maxKw: 50.0,
      });
    } else {
      const match = INDIAN_VEHICLE_PRESETS.find((v) => v.id === presetId);
      if (match) {
        setVehicle({ ...match });
      }
    }
  };

  const handleUpdateVehicle = (updates) => {
    setVehicle((prev) => ({ ...prev, ...updates }));
  };

  // Evaluate grid outcome for the selected station
  const stationWithGridOutcome = useMemo(() => {
    if (!selectedStation) return null;
    const gridOutcome = evaluateGridAwareRescue(
      selectedStation,
      vehicle,
      currentSoc,
      targetSoc,
      deadlineHours
    );
    return {
      ...selectedStation,
      gridOutcome,
    };
  }, [selectedStation, vehicle, currentSoc, targetSoc, deadlineHours]);

  // Handoff to full simulator
  const handleOpenInSimulator = (station) => {
    if (onSwitchToSimulation) {
      onSwitchToSimulation(station, vehicle, targetSoc, deadlineHours);
    }
  };

  return (
    <div className="space-y-4">
      {/* Banner / Value Proposition */}
      <div className="bg-white border-2 border-primary-950 rounded-2xl p-3 sm:p-4 shadow-[3px_3px_0px_#111827] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent-blue border-2 border-primary-950 flex items-center justify-center font-black text-white shadow-[2px_2px_0px_#111827]">
            <ShieldAlert className="w-5 h-5 text-accent-yellow" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-primary-950 uppercase tracking-tight flex items-center gap-2">
              Charge Rescue & Grid Journey Intelligence
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-primary-950">
                Live Advisor
              </span>
            </h1>
            <p className="text-xs text-primary-700 font-bold">
              Determine battery range, verify connector compatibility, and test simulated microgrid
              charging feasibility before you drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold self-start md:self-auto">
          <span className="px-2.5 py-1 rounded-xl border border-primary-950 bg-cream-100 text-primary-900 text-[11px] font-black">
            28,553 Stations Indexed
          </span>
          <span className="px-2.5 py-1 rounded-xl border border-primary-950 bg-blue-100 text-blue-950 text-[11px] font-black">
            Zero Telemetry Claims
          </span>
        </div>
      </div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 Cols on LG): Vehicle Profile, Range Estimator & What-If Advisor */}
        <div className="lg:col-span-5 space-y-4">
          {/* Feature A: Connect My EV */}
          <VehicleProfileCard
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            vehicle={vehicle}
            onUpdateVehicle={handleUpdateVehicle}
            currentSoc={currentSoc}
            onChangeSoc={setCurrentSoc}
            reserveSoc={reserveSoc}
            onChangeReserveSoc={setReserveSoc}
          />

          {/* Feature B: Battery Range Estimator */}
          <BatteryRangeCard
            batteryKwh={vehicle.battery}
            currentSoc={currentSoc}
            reserveSoc={reserveSoc}
            consumptionWhPerKm={vehicle.consumptionWhPerKm}
            safetyBufferPct={safetyBufferPct}
            onChangeSafetyBuffer={setSafetyBufferPct}
          />

          {/* Feature F: Explainable What-If Advisor */}
          <WhatIfAdvisor
            selectedStation={stationWithGridOutcome}
            allCandidates={[]}
            vehicle={vehicle}
            currentSoc={currentSoc}
            targetSoc={targetSoc}
            deadlineHours={deadlineHours}
            onSelectAlternative={(alt) => setSelectedStation(alt)}
            onAdjustTargetSoc={(t) => setTargetSoc(t)}
            onAdjustDeadline={(d) => setDeadlineHours(d)}
          />
        </div>

        {/* Right Column (7 Cols on LG): Candidate Stops Finder & Grid-Aware Microgrid Simulator */}
        <div className="lg:col-span-7 space-y-4">
          {/* Feature C & D: Station Rescue Finder */}
          <StationRescueFinder
            vehicle={vehicle}
            currentSoc={currentSoc}
            reserveSoc={reserveSoc}
            safetyBufferPct={safetyBufferPct}
            selectedStation={selectedStation}
            onSelectStation={(st) => setSelectedStation(st)}
            onOpenInSimulator={handleOpenInSimulator}
            onOpenInMap={(st) => onSwitchToDiscovery && onSwitchToDiscovery(st)}
          />

          {/* Feature E: Grid-Aware Charging Outcome */}
          <GridRescueSimulator
            selectedStation={selectedStation}
            vehicle={vehicle}
            currentSoc={currentSoc}
            targetSoc={targetSoc}
            onChangeTargetSoc={setTargetSoc}
            deadlineHours={deadlineHours}
            onChangeDeadlineHours={setDeadlineHours}
            onOpenFullSimulator={handleOpenInSimulator}
          />
        </div>
      </div>
    </div>
  );
}
