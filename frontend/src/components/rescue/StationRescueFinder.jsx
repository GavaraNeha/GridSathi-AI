import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Search,
  Crosshair,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Zap,
  Cpu,
  Layers,
  ChevronRight,
} from 'lucide-react';
import {
  rankRescueCandidates,
  classifyConnectorCompatibility,
  evaluateReachability,
} from '../../engine/journeyEngine';
import { fetchStations } from '../../services/api';

const QUICK_CITIES = ['Hyderabad', 'Bengaluru', 'Delhi', 'Mumbai', 'Chennai', 'Pune'];

export default function StationRescueFinder({
  vehicle,
  currentSoc,
  reserveSoc,
  safetyBufferPct,
  selectedStation,
  onSelectStation,
  onOpenInSimulator,
  onOpenInMap,
}) {
  const [cityInput, setCityInput] = useState('Hyderabad');
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'safe' | 'compatible'

  // Fetch stations for the selected city or coordinates
  const loadStationsForLocation = async (cityName, lat = null, lng = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStations(cityName, lat, lng);
      if (data && data.stations) {
        setStations(data.stations);
        if (data.stations.length > 0 && !selectedStation) {
          // Auto-select first station
          onSelectStation(data.stations[0]);
        }
      } else {
        setStations([]);
      }
    } catch (err) {
      console.error('Failed to load rescue stations:', err);
      setError(err.message || 'Unable to load charging stations.');
      setStations([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadStationsForLocation('Hyderabad');
  }, []);

  // GPS Near Me Trigger
  const handleNearMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCityInput('Near Me (GPS)');
        loadStationsForLocation('Nearby', latitude, longitude);
      },
      (err) => {
        setLoading(false);
        setError(`GPS error: ${err.message}. Using city search instead.`);
      },
      { timeout: 8000 }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (cityInput.trim().length >= 2) {
      loadStationsForLocation(cityInput.trim());
    }
  };

  // Rank candidate stations deterministically
  const rankedCandidates = rankRescueCandidates(
    stations,
    vehicle,
    currentSoc,
    reserveSoc,
    safetyBufferPct
  );

  // Apply quick filters
  const filteredCandidates = rankedCandidates.filter((c) => {
    if (filterMode === 'in_range') {
      return c.reachability.status === 'estimated_reachable' || c.reachability.status === 'safe';
    }
    if (filterMode === 'compatible') {
      return c.compatibility.status === 'compatible' || c.compatibility.status === 'potentially_compatible';
    }
    return true;
  });

  const inRangeCount = rankedCandidates.filter(
    (c) => c.reachability.status === 'estimated_reachable' || c.reachability.status === 'safe'
  ).length;
  const compatibleCount = rankedCandidates.filter(
    (c) => c.compatibility.status === 'compatible' || c.compatibility.status === 'potentially_compatible'
  ).length;

  return (
    <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-3 border-b-2 border-primary-950 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-400 border-2 border-primary-950 flex items-center justify-center font-black">
            <Compass className="w-4 h-4 text-primary-950" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-primary-950 uppercase tracking-tight">
              Charge Rescue Stops
            </h2>
            <p className="text-[10px] text-primary-700 font-bold">
              Ranked by Safety, Compatibility & Detour
            </p>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-1 bg-white border-2 border-primary-950 rounded-xl p-0.5">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-colors ${
              filterMode === 'all'
                ? 'bg-primary-950 text-white'
                : 'text-primary-700 hover:bg-cream-100'
            }`}
          >
            All ({rankedCandidates.length})
          </button>
          <button
            onClick={() => setFilterMode('in_range')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-colors ${
              filterMode === 'in_range'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-900 hover:bg-emerald-50'
            }`}
          >
            In Range ({inRangeCount})
          </button>
          <button
            onClick={() => setFilterMode('compatible')}
            className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase transition-colors ${
              filterMode === 'compatible'
                ? 'bg-blue-600 text-white'
                : 'text-blue-900 hover:bg-blue-50'
            }`}
          >
            Compatible ({compatibleCount})
          </button>
        </div>
      </div>

      {/* Origin Search Form */}
      <form onSubmit={handleSearchSubmit} className="mb-3 space-y-2">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <MapPin className="w-3.5 h-3.5 text-primary-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Search Indian city or corridor..."
              className="w-full bg-white border-2 border-primary-950 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-primary-950 shadow-[2px_2px_0px_#111827] focus:outline-none focus:ring-2 focus:ring-accent-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-accent-yellow border-2 border-primary-950 rounded-xl px-3 py-1.5 text-xs font-black text-primary-950 shadow-[2px_2px_0px_#111827] hover:bg-amber-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
          </button>

          <button
            type="button"
            onClick={handleNearMe}
            disabled={loading}
            className="bg-emerald-300 border-2 border-primary-950 rounded-xl px-2.5 py-1.5 text-xs font-black text-primary-950 shadow-[2px_2px_0px_#111827] hover:bg-emerald-400 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1"
            title="Use Current GPS Coordinates"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Near Me</span>
          </button>
        </div>

        {/* Quick City Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-black uppercase text-primary-600 mr-1">Quick:</span>
          {QUICK_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setCityInput(city);
                loadStationsForLocation(city);
              }}
              className="text-[10px] font-bold px-2 py-0.5 rounded-lg border border-primary-950 bg-white text-primary-900 hover:bg-cream-200 transition-colors"
            >
              {city}
            </button>
          ))}
        </div>
      </form>

      {/* Error Notice */}
      {error && (
        <div className="mb-3 p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center text-xs font-black text-primary-700 animate-pulse">
          Scanning 28,553 authentic stations across India...
        </div>
      )}

      {/* No Safe Stops Warning (Feature C Requirement) */}
      {!loading && rankedCandidates.length > 0 && inRangeCount === 0 && (
        <div className="mb-3 p-3 rounded-xl bg-rose-100 border-2 border-rose-600 text-rose-950 shadow-[2px_2px_0px_#e11d48]">
          <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wide text-rose-900 mb-1">
            <XCircle className="w-4 h-4 text-rose-600" />
            ⚠️ No Stations Estimated Within Range!
          </div>
          <p className="text-[11px] leading-snug text-rose-900 font-medium">
            All stations in this search radius exceed your conservative battery range.
            <br />
            <strong>Rescue Advice:</strong> Limit driving speed to ≤50 km/h, turn off cabin AC
            immediately, and locate any accessible 15A 3-pin commercial socket nearby for an
            emergency top-up.
          </p>
        </div>
      )}

      {/* Candidate List Container */}
      {!loading && (
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filteredCandidates.length === 0 ? (
            <div className="py-6 text-center text-xs text-primary-600 font-bold bg-white rounded-xl border border-dashed border-primary-400">
              No stations match the selected filter. Try switching to "All".
            </div>
          ) : (
            filteredCandidates.map((station) => {
              const isSelected = selectedStation?.id === station.id;
              const r = station.reachability;
              const c = station.compatibility;

              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`p-2.5 sm:p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cream-100 border-primary-950 shadow-[3px_3px_0px_#111827]'
                      : 'bg-white border-primary-950/40 hover:border-primary-950 shadow-[1px_1px_0px_#111827]'
                  }`}
                >
                  {/* Card Title & Operator */}
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-primary-950 truncate">
                          {station.name}
                        </h3>
                        {isSelected && (
                          <span className="shrink-0 text-[9px] font-black uppercase bg-primary-950 text-white px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-primary-700 font-bold truncate">
                        {station.operator || 'Independent Operator'} • {station.address}
                      </p>
                    </div>

                    {/* Distance Badge */}
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black font-mono text-primary-950 block">
                        ~{r.effectiveRoadKm} km
                      </span>
                      <span className="text-[9px] text-primary-600 font-bold block">
                        {r.isRoadDistance ? 'Verified Route' : 'Est. Road (~1.3×)'}
                      </span>
                      <span className="text-[8.5px] text-gray-500 font-medium block">
                        Air: {r.straightLineKm} km
                      </span>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    {/* Reachability Badge */}
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border border-primary-950 flex items-center gap-1 ${
                        r.status === 'estimated_reachable' || r.status === 'safe'
                          ? 'bg-emerald-100 text-emerald-950'
                          : r.status === 'marginal'
                          ? 'bg-amber-100 text-amber-950'
                          : 'bg-rose-100 text-rose-950'
                      }`}
                    >
                      {(r.status === 'estimated_reachable' || r.status === 'safe') && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      )}
                      {r.status === 'marginal' && (
                        <AlertTriangle className="w-3 h-3 text-amber-700" />
                      )}
                      {r.status === 'unreachable' && <XCircle className="w-3 h-3 text-rose-700" />}
                      {r.label}
                    </span>

                    {/* Compatibility Badge */}
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border border-primary-950 flex items-center gap-1 ${
                        c.status === 'compatible'
                          ? 'bg-emerald-100 text-emerald-950'
                          : c.status === 'potentially_compatible'
                          ? 'bg-blue-100 text-blue-950'
                          : c.status === 'incompatible'
                          ? 'bg-rose-100 text-rose-950'
                          : 'bg-amber-100 text-amber-950'
                      }`}
                    >
                      {c.status === 'compatible' && (
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      )}
                      {c.status === 'potentially_compatible' && (
                        <HelpCircle className="w-3 h-3 text-blue-700" />
                      )}
                      {c.status === 'incompatible' && <XCircle className="w-3 h-3 text-rose-700" />}
                      {c.status === 'unknown' && <HelpCircle className="w-3 h-3 text-amber-700" />}
                      {c.label}
                    </span>

                    {/* Sockets / Power Badge */}
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-gray-300 bg-gray-50 text-gray-800">
                      Sockets: {station.sockets || 'Unspecified'}
                    </span>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-200 text-xs">
                    <span className="text-[10px] text-primary-700 font-bold truncate max-w-[180px]">
                      {r.reason}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenInSimulator(station);
                        }}
                        className="px-2 py-1 bg-accent-blue text-white rounded-lg font-black text-[10px] uppercase border border-primary-950 hover:bg-blue-700 flex items-center gap-1"
                      >
                        <Cpu className="w-3 h-3" />
                        Simulate
                      </button>

                      {station.maps_url && (
                        <a
                          href={station.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 bg-white text-primary-950 rounded-lg font-black text-[10px] uppercase border border-primary-950 hover:bg-gray-100 flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
