import React from 'react';
import { MapPin, Navigation, Zap, BatteryCharging, Cpu, PlugZap, Coins } from 'lucide-react';

export default function StationCard({
  station,
  isSelected,
  onSelect,
  onSetSimulationContext,
}) {
  const directionsUrl =
    station.maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`;

  const socketItems = station.sockets
    ? station.sockets
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const isLive = station.source?.toLowerCase().includes('live');
  const isSample = station.source?.toLowerCase().includes('sample');

  return (
    <article
      onClick={() => onSelect && onSelect(station)}
      className={`p-3 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden ${
        isSelected
          ? 'bg-blue-50/50 border-[#4163F5] shadow-[2.5px_2.5px_0px_#111827] ring-1 ring-[#4163F5]'
          : 'bg-white border-[#111827] hover:bg-slate-50 shadow-[2px_2px_0px_#111827]'
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Provenance Badge */}
          {isLive ? (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-[#55BD8D] text-white border border-[#111827] flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-white" />
              <span>Live (OSM)</span>
            </span>
          ) : isSample ? (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-[#F5AD16] text-[#111827] border border-[#111827] flex items-center gap-1">
              <span>Sample Data</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-[#EEF2FF] text-[#4163F5] border border-[#4163F5] flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-[#4163F5]" />
              <span>{station.source?.includes('National') ? 'National EV Data' : 'Cached (OSM)'}</span>
            </span>
          )}

          {station.distance_km != null && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F8FAFC] text-[#0F172A] border border-[#111827] flex items-center gap-1">
              <Navigation className="w-2 h-2 text-[#4163F5]" />
              <span>{station.distance_km} km</span>
            </span>
          )}

          {station.operator && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-[#111827] border border-slate-300 truncate max-w-[140px]">
              {station.operator}
            </span>
          )}

          {station.capacity && (
            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#F5AD16] flex items-center gap-1">
              <BatteryCharging className="w-2.5 h-2.5" />
              <span>{station.capacity}</span>
            </span>
          )}

          {station.sources_count != null && station.sources_count > 1 && (
            <span
              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300"
              title={`${station.sources_count} corroborating registry sources`}
            >
              ✓ {station.sources_count} Sources
            </span>
          )}
        </div>

        <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
          {station.id}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm sm:text-base font-black text-[#111827] mb-1 line-clamp-1">
        {station.name}
      </h3>

      {/* Address */}
      <p className="text-xs text-[#64748B] mb-2 line-clamp-2 leading-relaxed flex items-start gap-1 font-medium">
        <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
        <span>{station.address}</span>
      </p>

      {/* Sockets / Connectors & Fee info */}
      {(socketItems.length > 0 || station.fee) && (
        <div className="flex items-center gap-1 flex-wrap mb-2 text-[10px]">
          {socketItems.map((sock, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200 flex items-center gap-1"
            >
              <PlugZap className="w-2 h-2 text-[#4163F5]" />
              <span>{sock}</span>
            </span>
          ))}
          {station.fee && (
            <span className="px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
              <Coins className="w-2 h-2 text-emerald-600" />
              <span>{station.fee}</span>
            </span>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Simulate Microgrid Button */}
        {onSetSimulationContext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSetSimulationContext(station);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4163F5] hover:bg-[#3252d6] text-white text-[11px] font-black border border-[#111827] shadow-[1.5px_1.5px_0px_#111827] transition-transform active:translate-y-0.5"
          >
            <Cpu className="w-3 h-3" />
            <span>Simulate Charging Here</span>
          </button>
        )}

        {/* Directions Link */}
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-[11px] font-bold text-[#4163F5] hover:underline"
        >
          <Navigation className="w-3 h-3" />
          <span>Directions</span>
        </a>
      </div>
    </article>
  );
}
