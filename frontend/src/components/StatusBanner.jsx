import React from 'react';
import { ShieldCheck, Info, Globe, Cpu } from 'lucide-react';

export default function StatusBanner({ simulationContextStation }) {
  return (
    <div className="bg-white border-2 border-[#111827] rounded-3xl p-5 text-xs text-slate-600 space-y-3 shadow-[4px_4px_0px_#111827]">
      <div className="flex items-center gap-2 text-[#4163F5] font-black tracking-wider uppercase text-[11px]">
        <ShieldCheck className="w-4 h-4 text-[#55BD8D]" />
        <span>Open-Source Provenance & Simulation Transparency Notice</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
        <div className="space-y-1 bg-[#F8FAFC] border border-[#111827] rounded-2xl p-3.5">
          <strong className="text-[#111827] flex items-center gap-1.5 font-black">
            <Globe className="w-3.5 h-3.5 text-[#55BD8D]" />
            <span>1. Authentic National EV Dataset (India)</span>
          </strong>
          <p className="text-slate-600 leading-relaxed text-[11px] font-medium">
            28,550+ authentic charging stations mapped across India (ODbL / CC-BY 4.0). Live charger bay occupancy, waiting queues, and electrical tariffs are not monitored by physical hardware.
          </p>
        </div>

        <div className="space-y-1 bg-[#F8FAFC] border border-[#111827] rounded-2xl p-3.5">
          <strong className="text-[#111827] flex items-center gap-1.5 font-black">
            <Cpu className="w-3.5 h-3.5 text-[#F5AD16]" />
            <span>2. Software Microgrid Simulation</span>
          </strong>
          <p className="text-slate-600 leading-relaxed text-[11px] font-medium">
            The optimization scheduler is a pure software simulation modeling site transformer capacity, multi-bay power dispatch, and solar canopy load balancing. Selecting a station establishes scenario context, not hardware control.
          </p>
        </div>
      </div>

      {simulationContextStation && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[#4163F5] text-[11px] font-bold">
          <Info className="w-3.5 h-3.5 shrink-0" />
          <span>
            Active Simulation Scenario Label: <strong className="text-[#111827]">{simulationContextStation.name}</strong> ({simulationContextStation.address})
          </span>
        </div>
      )}
    </div>
  );
}
