import React from 'react';
import { ShieldCheck, Info, Globe, Cpu } from 'lucide-react';

export default function StatusBanner({ simulationContextStation }) {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5 shadow-lg">
      <div className="flex items-center gap-2 text-emerald-400 font-bold tracking-wide uppercase text-[11px]">
        <ShieldCheck className="w-4 h-4" />
        <span>Open-Source Provenance & Simulation Transparency Notice</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
        <div className="space-y-1">
          <strong className="text-white flex items-center gap-1.5 font-semibold">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>1. Real-World OpenStreetMap Data</span>
          </strong>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            EV charging stations are mapped by community contributors and queried in real-time via the OpenStreetMap Overpass API. Live charger bay occupancy, waiting lines, and electrical tariffs are not retrieved from charge points.
          </p>
        </div>

        <div className="space-y-1">
          <strong className="text-white flex items-center gap-1.5 font-semibold">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>2. Software Microgrid Simulation</span>
          </strong>
          <p className="text-slate-400 leading-relaxed text-[11px]">
            The optimization scheduler is a pure software simulation modeling site transformer capacity, multi-bay power dispatch, and solar canopy load balancing. Selecting a station establishes scenario context, not hardware control.
          </p>
        </div>
      </div>

      {simulationContextStation && (
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2 text-sky-400 text-[11px] font-medium">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Active Simulation Scenario Label: <strong className="text-white">{simulationContextStation.name}</strong> ({simulationContextStation.address})
          </span>
        </div>
      )}
    </div>
  );
}
