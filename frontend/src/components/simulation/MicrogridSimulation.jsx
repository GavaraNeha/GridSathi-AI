import React, { useState, useRef } from 'react';
import HeaderBar from './HeaderBar';
import SiteContextBanner from './SiteContextBanner';
import MicrogridTopology from './MicrogridTopology';
import FleetInspector from './FleetInspector';
import DisruptionDeck from './DisruptionDeck';
import MetricsCards from './MetricsCards';
import FeasibilityAudit from './FeasibilityAudit';
import ScheduleRibbon from './ScheduleRibbon';
import LoadProfileChart from './LoadProfileChart';
import AddVehicleModal from './AddVehicleModal';

export default function MicrogridSimulation({
  engine,
  activeTab,
  setActiveTab,
}) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fleetSectionRef = useRef(null);

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
    addVehicle,
    resetSimulation,
    result,
    comparison,
    demand,
    clock,
    COLORS,
  } = engine;

  const getColor = (idx) =>
    Array.isArray(COLORS)
      ? COLORS[idx % COLORS.length]
      : typeof COLORS === 'function'
      ? COLORS(idx)
      : '#4163F5';

  const handleScrollToFleet = () => {
    if (fleetSectionRef.current) {
      fleetSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Top Header & Algorithm Selector Bar */}
      <HeaderBar
        mode={mode}
        setMode={setMode}
        comparison={comparison}
        onReset={resetSimulation}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* 2. Selected Site Context & Scenario Parameters (Feature 1) */}
      <SiteContextBanner
        stationContext={engine.stationContext}
        capacity={capacity}
        setCapacity={setCapacity}
        events={events}
        toggleEvent={toggleEvent}
        onOpenDiscovery={() => setActiveTab && setActiveTab('discovery')}
      />

      {/* 3. Main Microgrid Topology — HIGHEST PRIORITY */}
      <MicrogridTopology
        result={result}
        vehicles={vehicles}
        capacity={capacity}
        events={events}
        mode={mode}
        onSelectBay={(bayIdx) => {
          const slot0 = result?.slots?.[0];
          const assign = slot0?.bays?.[bayIdx];
          if (assign && assign.carIndex !== undefined) {
            setSelectedVehicleIndex(assign.carIndex);
            handleScrollToFleet();
          }
        }}
        onScrollDown={handleScrollToFleet}
      />

      {/* 3. Connected EV Fleet */}
      <div ref={fleetSectionRef}>
        <FleetInspector
          vehicles={vehicles}
          selectedVehicleIndex={selectedVehicleIndex}
          onSelectVehicle={(idx) => setSelectedVehicleIndex(idx)}
          result={result}
          demand={demand}
          clock={clock}
          colors={getColor}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* 4. What-If Disruption Deck & Explainable Replay */}
      <DisruptionDeck
        capacity={capacity}
        setCapacity={setCapacity}
        events={events}
        toggleEvent={toggleEvent}
        onReset={resetSimulation}
        disruptionDiff={engine.disruptionDiff}
        mode={mode}
      />

      {/* 5. Performance Dashboard (4 Colorful KPI Cards) */}
      <MetricsCards result={result} vehicles={vehicles} />

      {/* 6. Feasibility Certificate & Window Audit */}
      <FeasibilityAudit
        result={result}
        vehicles={vehicles}
        demand={demand}
        mode={mode}
      />

      {/* 7. Multi-Track Charging Ribbon & Departure Flags */}
      <ScheduleRibbon
        result={result}
        vehicles={vehicles}
        colors={getColor}
        disruptionDiff={engine.disruptionDiff}
      />

      {/* 8. Stacked Load Profile & Transformer Ceiling */}
      <LoadProfileChart
        result={result}
        vehicles={vehicles}
        colors={getColor}
      />

      {/* Modal for adding custom EV with Feasibility Advisor */}
      <AddVehicleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVehicle={addVehicle}
        currentVehicles={vehicles}
        simulationOptions={
          engine.simulationOptions || {
            capacity,
            fault: events.fault,
            brownout: events.brownout,
            solar: events.solar,
          }
        }
        mode={mode}
      />
    </div>
  );
}
