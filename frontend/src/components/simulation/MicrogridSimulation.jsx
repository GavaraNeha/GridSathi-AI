import React, { useState } from 'react';
import DisruptionDeck from './DisruptionDeck';
import BayStatusGrid from './BayStatusGrid';
import MetricsCards from './MetricsCards';
import FleetInspector from './FleetInspector';
import ScheduleRibbon from './ScheduleRibbon';
import LoadProfileChart from './LoadProfileChart';
import FeasibilityAudit from './FeasibilityAudit';
import AddVehicleModal from './AddVehicleModal';

export default function MicrogridSimulation({ engine }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const {
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
    addVehicle,
    resetSimulation,
    result,
    comparison,
    demand,
    clock,
    COLORS,
  } = engine;

  return (
    <div className="space-y-6">
      {/* 1. Policy & Disruption Deck */}
      <DisruptionDeck
        mode={mode}
        setMode={setMode}
        capacity={capacity}
        setCapacity={setCapacity}
        events={events}
        toggleEvent={toggleEvent}
        comparison={comparison}
        onReset={resetSimulation}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        stationContext={stationContext}
      />

      {/* 2. Primary Performance Metrics */}
      <MetricsCards result={result} vehicles={vehicles} />

      {/* 3. 3-Bay Dispatch Status Meter */}
      <BayStatusGrid
        result={result}
        vehicles={vehicles}
        colors={COLORS}
        onSelectVehicle={(idx) => setSelectedVehicleIndex(idx)}
      />

      {/* 4. Fleet Inspector & Selected EV Breakdown */}
      <FleetInspector
        vehicles={vehicles}
        selectedVehicleIndex={selectedVehicleIndex}
        onSelectVehicle={(idx) => setSelectedVehicleIndex(idx)}
        result={result}
        demand={demand}
        clock={clock}
        colors={COLORS}
      />

      {/* 5. 30-Minute Schedule Allocation Ribbon */}
      <ScheduleRibbon
        result={result}
        vehicles={vehicles}
        colors={COLORS}
      />

      {/* 6. Stacked Load Profile & Transformer Ceiling */}
      <LoadProfileChart
        result={result}
        vehicles={vehicles}
        colors={COLORS}
      />

      {/* 7. Feasibility Certificate & Window Audit */}
      <FeasibilityAudit
        result={result}
        vehicles={vehicles}
        demand={demand}
        mode={mode}
      />

      {/* Add Vehicle Modal */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVehicle={addVehicle}
      />
    </div>
  );
}
