import React from 'react';
import { MapPin, Navigation, Zap, BatteryCharging, ExternalLink, Cpu } from 'lucide-react';

export default function StationCard({
  station,
  isSelected,
  onSelect,
  onSetSimulationContext,
}) {
  const directionsUrl =
    station.maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

  return (
    <article
      onClick={() => onSelect && onSelect(station)}
      className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
        isSelected
          ? 'bg-slate-800/90 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
          : 'bg-slate-900/80 hover:bg-slate-800/60 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-emerald-400" />
            <span>OSM EV Charger</span>
          </span>

          {station.operator && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {station.operator}
            </span>
          )}

          {station.capacity && (
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <BatteryCharging className="w-3 h-3" />
              <span>{station.capacity} bays</span>
            </span>
          )}
        </div>

        <span className="text-[10px] text-slate-500 font-mono">
          {station.id}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-bold text-white mb-1.5 group-hover:text-emerald-400 transition-colors line-clamp-1">
        {station.name}
      </h3>

      {/* Address */}
      <p className="text-xs text-slate-400 mb-2.5 line-clamp-2 leading-relaxed flex items-start gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
        <span>{station.address}</span>
      </p>

      {/* Sockets / Connectors if present */}
      {station.sockets && (
        <div className="text-[11px] text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800/80 mb-3 flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Sockets:</span>
          <span className="text-emerald-400 font-mono font-medium truncate">{station.sockets}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Get Directions ↗</span>
        </a>

        {onSetSimulationContext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetSimulationContext(station);
            }}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <Cpu className="w-3 h-3 text-sky-400" />
            <span>Use in Simulation</span>
          </button>
        )}
      </div>
    </article>
  );
}
