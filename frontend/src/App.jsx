import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import LeafletMapView from './components/LeafletMapView';
import StationList from './components/StationList';
import StatusBanner from './components/StatusBanner';
import MicrogridSimulation from './components/simulation/MicrogridSimulation';
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

  // Search stations when user initiates search, selects a city, or uses GPS near-me
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
    setActiveTab('simulation');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#111827] flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab 1: Discovery & OpenStreetMap View (Default in Commit 12) */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            {/* Search Bar Container */}
            <div className="p-6 rounded-3xl bg-white border-2 border-[#111827] shadow-[5px_5px_0px_#111827]">
              <div className="mb-4">
                <span className="text-[11px] font-black text-[#4163F5] uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#55BD8D]" />
                  <span>OpenStreetMap & Overpass Discovery (India)</span>
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight mt-0.5">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
              <div className="lg:col-span-7 space-y-4">
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
                  <div className="p-5 rounded-3xl bg-white border-2 border-[#111827] shadow-[4px_4px_0px_#111827] space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#55BD8D] text-white">
                          Selected Charging Hub
                        </span>
                        <h3 className="text-lg font-black text-[#111827] mt-1">
                          {selectedStation.name}
                        </h3>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{selectedStation.address}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => handleSetSimulationContext(selectedStation)}
                        className="px-4 py-2 rounded-xl bg-[#4163F5] hover:bg-[#3452d9] text-white text-xs font-black border-2 border-[#111827] shadow-[2px_2px_0px_#111827] transition-transform active:translate-y-0.5 flex items-center gap-1.5"
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

        {/* Tab 2: Smart Microgrid Simulation View */}
        {activeTab === 'simulation' && (
          <MicrogridSimulation engine={simulationEngine} />
        )}
      </main>
    </div>
  );
}
