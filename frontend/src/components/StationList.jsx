import React, { useState, useMemo } from 'react';
import { Filter, AlertCircle, Database, Globe, ArrowUpDown, Zap } from 'lucide-react';
import StationCard from './StationCard';

export default function StationList({
  stations = [],
  isLoading,
  error,
  city = '',
  selectedStation,
  onSelectStation,
  onSetSimulationContext,
  onLoadSamples,
  isSampleData = false,
  apiMessage = '',
}) {
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  const filteredStations = useMemo(() => {
    let list = stations.filter((station) => {
      if (filterType === 'branded') {
        return Boolean(station.operator);
      }
      if (filterType === 'capacity') {
        return Boolean(station.capacity);
      }
      return true;
    });

    if (sortBy === 'distance') {
      list = [...list].sort((a, b) => {
        const distA = a.distance_km != null ? a.distance_km : 9999;
        const distB = b.distance_km != null ? b.distance_km : 9999;
        return distA - distB;
      });
    }

    return list;
  }, [stations, filterType, sortBy]);

  const hasLiveStations = stations.some((s) => s.source?.toLowerCase().includes('live'));

  return (
    <div className="bg-white border-2 border-[#111827] rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_#111827] space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg sm:text-xl font-black text-[#111827]">
              EV Charging Stations
            </h2>
            {city && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#111827] text-white font-mono">
                {city}
              </span>
            )}
            {hasLiveStations ? (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                ● Live OSM
              </span>
            ) : isSampleData ? (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                Sample Data
              </span>
            ) : stations.length > 0 ? (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">
                ● National EV Dataset (28k+)
              </span>
            ) : null}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 font-medium">
            {isSampleData ? (
              <span className="text-[#F5AD16] font-bold flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Offline Sample Records ({filteredStations.length})
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#55BD8D]" />
                {stations.length > 0
                  ? `${filteredStations.length} authentic stations mapped in National EV Dataset`
                  : 'Enter an Indian city to search'}
              </span>
            )}
          </p>
        </div>

        {/* Filters & Sorting */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] rounded-xl px-2.5 py-1 font-bold shadow-[2px_2px_0px_#111827] focus:outline-none"
          >
            <option value="distance">Nearest First</option>
            <option value="default">Default Order</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] rounded-xl px-2.5 py-1 font-bold shadow-[2px_2px_0px_#111827] focus:outline-none"
          >
            <option value="all">All ({stations.length})</option>
            <option value="branded">With Operator</option>
            <option value="capacity">With Capacity</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-2xl border-2 border-[#111827] bg-slate-50 animate-pulse space-y-2.5 shadow-[2px_2px_0px_#111827]"
            >
              <div className="h-4 bg-slate-200 rounded w-1/3"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              <div className="h-6 bg-slate-200 rounded w-1/4 mt-2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error / Offline Notice */}
      {!isLoading && error && filteredStations.length === 0 && (
        <div className="p-4 rounded-2xl border-2 border-[#E83D62] bg-red-50 text-[#E83D62] text-xs space-y-2 shadow-[2px_2px_0px_#111827]">
          <div className="flex items-center gap-2 font-black text-red-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#E83D62]" />
            <span>Overpass Query Notice</span>
          </div>
          <p className="leading-relaxed font-medium">{error}</p>
        </div>
      )}

      {/* Stations List Container */}
      {!isLoading && filteredStations.length > 0 && (
        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {filteredStations.map((station) => (
            <StationCard
              key={station.id}
              station={station}
              isSelected={selectedStation?.id === station.id}
              onSelect={onSelectStation}
              onSetSimulationContext={onSetSimulationContext}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredStations.length === 0 && (
        <div className="text-center py-10 px-4 rounded-2xl border-2 border-dashed border-[#111827] bg-[#FAFAF8] space-y-3">
          <Globe className="w-8 h-8 text-slate-400 mx-auto" />
          <h4 className="text-sm font-black text-[#111827]">
            No stations found for this query in OpenStreetMap
          </h4>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            Try searching for a larger Indian city, or load verified sample records to explore the microgrid simulation.
          </p>
          {onLoadSamples && (
            <button
              type="button"
              onClick={onLoadSamples}
              className="mt-2 px-4 py-2 rounded-xl bg-white border-2 border-[#111827] text-xs font-black text-[#111827] shadow-[2px_2px_0px_#111827] hover:bg-slate-50 transition-transform active:translate-y-0.5"
            >
              Load Sample Records
            </button>
          )}
        </div>
      )}
    </div>
  );
}
