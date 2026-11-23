import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import LeafletMapView from './components/LeafletMapView';
import StationList from './components/StationList';
import StatusBanner from './components/StatusBanner';
import MicrogridSimulation from './components/simulation/MicrogridSimulation';
import ChargeRescueView from './components/rescue/ChargeRescueView';
import { useMicrogridEngine } from './hooks/useMicrogridEngine';
import { fetchConfig, fetchStations, fetchSampleStations } from './services/api';
import { MapPin, Globe } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('discovery');
  const [currentCity, setCurrentCity] = useState('Hyderabad');
  const [stations, setStations] = useState([]);
  const [cityCoords, setCityCoords] = useState({ lat: 17.3850, lng: 78.4867 });
  const [selectedStation, setSelectedStation] = useState(null);
  const [simulationContextStation, setSimulationContextStation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiMessage, setApiMessage] = useState('');
  const [isSampleData, setIsSampleData] = useState(false);

  // Initialize Microgrid Simulation Hook
  const simulationEngine = useMicrogridEngine(simulationContextStation);

  // Initialize configuration
  useEffect(() => {
    async function loadInitialConfig() {
      const cfg = await fetchConfig();
      setConfig(cfg);
    }
    loadInitialConfig();
  }, []);

  // Search stations when user initiates search or selects a city
  const handleSearch = async (cityName, lat = null, lng = null) => {
    const term = cityName?.trim() || '';
    if (term.length < 2 && (lat == null || lng == null)) return;

    setCurrentCity(term || 'Nearby');
    setIsLoading(true);
    setError(null);
    setIsSampleData(false);

    try {
      const res = await fetchStations(term || 'Nearby', lat, lng);

      if (res.error) {
        setError(res.error);
        setApiMessage(res.message || '');
        setStations([]);
      } else {
        const found = res.stations || [];
        setStations(found);
        setApiMessage(res.message || '');
        if (res.lat && res.lng) {
          setCityCoords({ lat: res.lat, lng: res.lng });
        } else if (lat != null && lng != null) {
          setCityCoords({ lat, lng });
        }
        if (found.length > 0) {
          setSelectedStation(found[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected search error occurred.');
      setStations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchNearMe = (lat, lng) => {
    handleSearch('Nearby', lat, lng);
  };

  // Initial load: Hyderabad (pre-seeded coordinates)
  useEffect(() => {
    handleSearch('Hyderabad');
  }, []);

  // Offline sample loader fallback
  const handleLoadSamples = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchSampleStations(currentCity || 'Rajahmundry');
      setStations(res.stations || []);
      setIsSampleData(true);
      setApiMessage(res.disclaimer || 'Verified historical sample records.');
      if (res.stations?.length > 0) {
        setSelectedStation(res.stations[0]);
      }
    } catch {
      setError('Failed to load sample records.');
    } finally {
      setIsLoading(false);
    }
  };

  // Switch context from Discovery to Simulation
  const handleSetSimulationContext = (station) => {
    setSimulationContextStation(station);
    simulationEngine.applyStationContext(station);
    setActiveTab('simulation');
  };

  // Switch context from Rescue to Simulation
  const handleRescueHandoffToSimulation = (station, rescueVehicle = null, targetSoc = 80, deadlineHours = 1.5) => {
    if (station) {
      setSimulationContextStation(station);
      simulationEngine.applyStationContext(station);
    }
    if (rescueVehicle) {
      const current = rescueVehicle.soc || 20;
      const neededEnergy = (rescueVehicle.battery * Math.max(0, targetSoc - current)) / 100;
      simulationEngine.addVehicle({
        name: `${rescueVehicle.name} (Rescue)`,
        battery: rescueVehicle.battery,
        soc: current,
        target: targetSoc,
        energyReq: Math.round(neededEnergy * 10) / 10,
        due: deadlineHours,
        arrival: 0.0,
        maxKw: rescueVehicle.maxKw || 7.0,
      });
    }
    setActiveTab('simulation');
  };

  // Switch context from Rescue to Discovery map
  const handleRescueHandoffToDiscovery = (station) => {
    if (station) {
      setSelectedStation(station);
      if (station.lat && station.lng) {
        setCityCoords({ lat: station.lat, lng: station.lng });
      }
    }
    setActiveTab('discovery');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111827] flex flex-col font-sans">
      {/* Unified Top Navigation Bar (Always Visible Across Both Views) */}
      <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area — Strictly One Main View Rendered At A Time */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-5 lg:px-6 py-3.5 sm:py-4">
        {/* Tab 1: EV Station Discovery & OpenStreetMap View */}
        {activeTab === 'discovery' && (
          <div className="space-y-4">
            {/* Search Bar Container */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#111827] shadow-[3px_3px_0px_#111827]">
              <div className="mb-3">
                <span className="text-[10px] font-black text-[#4163F5] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#55BD8D]" />
                  <span>OpenStreetMap & Overpass Discovery (India)</span>
                </span>
                <h2 className="text-lg sm:text-xl font-black text-[#111827] tracking-tight mt-0.5">
                  Locate Real EV Charging Stations Across India
                </h2>
              </div>

              <SearchBar
                onSearch={handleSearch}
                onSearchNearMe={handleSearchNearMe}
                isLoading={isLoading}
                currentCity={currentCity}
              />
            </div>

            {/* Split View: Station Cards (Left) & Leaflet Map (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* Left Column: Station List (5 cols on lg) */}
              <div className="lg:col-span-5">
                <StationList
                  stations={stations}
                  isLoading={isLoading}
                  error={error}
                  city={currentCity}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                  onSetSimulationContext={handleSetSimulationContext}
                  onLoadSamples={handleLoadSamples}
                  isSampleData={isSampleData}
                  apiMessage={apiMessage}
                />
              </div>

              {/* Right Column: Leaflet Map (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-3">
                <LeafletMapView
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                  onSetSimulationContext={handleSetSimulationContext}
                  city={currentCity}
                  centerLat={cityCoords.lat}
                  centerLng={cityCoords.lng}
                />

                {/* Selected Station Detail Card */}
                {selectedStation && (
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-[#111827] shadow-[2.5px_2.5px_0px_#111827] space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#55BD8D] text-white">
                          Selected Charging Hub
                        </span>
                        <h3 className="text-base font-black text-[#111827] mt-0.5 truncate">
                          {selectedStation.name}
                        </h3>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5 font-medium truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{selectedStation.address}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetSimulationContext(selectedStation)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#4163F5] hover:bg-[#3452d9] text-white text-xs font-black border-2 border-[#111827] shadow-[2px_2px_0px_#111827] transition-transform active:translate-y-0.5 flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                      >
                        <span>Simulate Charging Here</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transparency Banner */}
            <StatusBanner simulationContextStation={simulationContextStation} />
          </div>
        )}

        {/* Tab 2: Microgrid Simulator View */}
        {activeTab === 'simulation' && (
          <MicrogridSimulation
            engine={simulationEngine}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Tab 3: Charge Rescue & Journey Intelligence View */}
        {activeTab === 'rescue' && (
          <ChargeRescueView
            onSwitchToSimulation={handleRescueHandoffToSimulation}
            onSwitchToDiscovery={handleRescueHandoffToDiscovery}
          />
        )}
      </main>
    </div>
  );
}
