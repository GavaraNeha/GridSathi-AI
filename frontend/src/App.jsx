import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import LeafletMapView from './components/LeafletMapView';
import StationList from './components/StationList';
import StatusBanner from './components/StatusBanner';
import { fetchConfig, fetchStations, fetchSampleStations } from './services/api';
import { Zap, MapPin, Cpu, ShieldCheck, Gauge, ArrowRight, Globe } from 'lucide-react';

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

  // Initialize configuration
  useEffect(() => {
    async function loadInitialConfig() {
      const cfg = await fetchConfig();
      setConfig(cfg);
    }
    loadInitialConfig();
  }, []);

  // Search stations when user initiates search or selects a city
  const handleSearch = async (cityName) => {
    const term = cityName?.trim() || '';
    if (term.length < 2) return;

    setCurrentCity(term);
    setIsLoading(true);
    setError(null);
    setIsSampleData(false);

    try {
      const res = await fetchStations(term);

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
      setError('Failed to load sample stations.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Navbar */}
      <Navbar
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Hero Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Mapped Stations (OSM)
              </span>
              <b className="text-xl font-bold font-mono text-white">
                {stations.length}
              </b>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Transformer Cap
              </span>
              <b className="text-xl font-bold font-mono text-white">14 kW</b>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Smart Bays
              </span>
              <b className="text-xl font-bold font-mono text-white">3 × 7 kW</b>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Engine Audit
              </span>
              <b className="text-sm font-bold font-mono text-emerald-400">48/48 PASS</b>
            </div>
          </div>
        </div>

        {/* Tab 1: Discovery & Maps View */}
        {activeTab === 'discovery' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="mb-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>OpenStreetMap & Overpass Discovery (India)</span>
                </span>
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Locate EV Charging Stations Across India
                </h1>
              </div>

              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoading}
                currentCity={currentCity}
              />
            </div>

            {/* Split View: Station Cards (Left) & Leaflet Map (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Station List (5 cols on lg) */}
              <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <StationList
                  stations={stations}
                  isLoading={isLoading}
                  error={error}
                  city={currentCity}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                  onSetSimulationContext={(s) => setSimulationContextStation(s)}
                  onLoadSamples={handleLoadSamples}
                  isSampleData={isSampleData}
                  apiMessage={apiMessage}
                />
              </div>

              {/* Right Column: Leaflet Interactive Map View (7 cols on lg) */}
              <div className="lg:col-span-7 space-y-4">
                <LeafletMapView
                  stations={stations}
                  selectedStation={selectedStation}
                  onSelectStation={(s) => setSelectedStation(s)}
                  city={currentCity}
                  centerLat={cityCoords.lat}
                  centerLng={cityCoords.lng}
                />

                {/* Selected Station Detail Banner */}
                {selectedStation && (
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Selected Station
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        {selectedStation.name}
                      </h4>
                      <p className="text-slate-400 line-clamp-1">
                        {selectedStation.address}
                      </p>
                    </div>

                    <a
                      href={
                        selectedStation.maps_url ||
                        `https://www.google.com/maps/dir/?api=1&destination=${selectedStation.lat},${selectedStation.lng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-md shrink-0 flex items-center gap-1.5"
                    >
                      <span>Get Directions ↗</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Transparency Banner */}
            <StatusBanner simulationContextStation={simulationContextStation} />
          </div>
        )}

        {/* Tab 2: Smart Microgrid Simulation Placeholder / Switcher */}
        {activeTab === 'simulation' && (
          <div className="p-8 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <Cpu className="w-8 h-8" />
            </div>

            <div className="max-w-lg mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
                Preserved Microgrid Engine
              </span>
              <h2 className="text-2xl font-bold text-white">
                Intelligent EV Load Scheduling & Microgrid Dispatch
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                The microgrid scheduling engine simulates 3 bays, dynamic transformer caps (7–21 kW), solar generation, disruption what-if analysis, and Slack-Priority optimization.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="http://127.0.0.1:8000/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <span>Launch Preserved Simulation Prototype</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setActiveTab('discovery')}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors"
              >
                Return to Station Discovery
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        GridSathi AI · 100% Free OpenStreetMap & Overpass EV Platform · Software-only demonstration
      </footer>
    </div>
  );
}
