import React, { useState } from 'react';
import { Filter, AlertCircle, Layers, Database, Globe } from 'lucide-react';
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

  const filteredStations = stations.filter((station) => {
    if (filterType === 'branded') {
      return Boolean(station.operator);
    }
    if (filterType === 'capacity') {
      return Boolean(station.capacity);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>EV Charging Stations</span>
            {city && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {city}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {isSampleData ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Database className="w-3.5 h-3.5" />
                Offline Sample Records ({filteredStations.length})
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-400">
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                {stations.length > 0
                  ? `${filteredStations.length} stations mapped in OpenStreetMap`
                  : 'Enter an Indian city to search'}
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="all">All Stations ({stations.length})</option>
            <option value="branded">With Operator Tag</option>
            <option value="capacity">With Bay Capacity</option>
          </select>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 animate-pulse space-y-2.5"
            >
              <div className="h-4 bg-slate-800 rounded w-1/3"></div>
              <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
              <div className="h-6 bg-slate-800/40 rounded w-1/4 mt-2"></div>
            </div>
          ))}
        </div>
      )}

      {/* Error / Offline Notice */}
      {!isLoading && error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Overpass Query Notice</span>
          </div>
          <p className="leading-relaxed">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredStations.length === 0 && (
        <div className="p-8 rounded-xl border border-slate-800 bg-slate-900/50 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-slate-300">
              No Charging Stations Found in Area
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {apiMessage ||
                'Try searching another Indian city (e.g. Hyderabad, Bengaluru, Delhi, Pune, Vijayawada).'}
            </p>
          </div>

          {onLoadSamples && (
            <button
              type="button"
              onClick={onLoadSamples}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors mt-2"
            >
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Verified Offline Sample Data</span>
            </button>
          )}
        </div>
      )}

      {/* Station Cards Grid / List */}
      {!isLoading && filteredStations.length > 0 && (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {filteredStations.map((station) => (
            <StationCard
              key={station.id || station.place_id}
              station={station}
              isSelected={selectedStation?.id === station.id}
              onSelect={onSelectStation}
              onSetSimulationContext={onSetSimulationContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}
