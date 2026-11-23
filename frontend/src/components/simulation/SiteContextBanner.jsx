import React from 'react';
import { MapPin, Zap, Building2, Sliders, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SiteContextBanner({
  stationContext,
  capacity,
  setCapacity,
  events,
  toggleEvent,
  onOpenDiscovery,
}) {
  const stationName = stationContext?.name || 'GridSathi Campus Microgrid Hub';
  const stationAddress =
    stationContext?.address || 'Demonstration Site · Gachibowli, Hyderabad, Telangana';
  const operator = stationContext?.operator || 'Institutional CPO';
  const sockets = stationContext?.sockets || 'CCS2 (60 kW), Type 2 (7.4 kW)';
  const capacityDesc = stationContext?.capacity || '3 charging bays';
  const sourceName = stationContext?.source || 'National EV Dataset (India)';

  return (
    <div className="bg-white border-2 border-[#111827] rounded-2xl p-3.5 sm:p-4 shadow-[2.5px_2.5px_0px_#111827] space-y-3">
      {/* Top Meta Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#EEF2FF] text-[#4163F5] border border-[#4163F5] flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>Selected Site Context</span>
          </span>

          <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#F5AD16]">
            {operator}
          </span>

          {stationContext && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-[#55BD8D] text-white border border-[#111827]">
              Real Mapped Infrastructure
            </span>
          )}
        </div>

        {/* Change Site button */}
        {onOpenDiscovery && (
          <button
            type="button"
            onClick={onOpenDiscovery}
            className="self-start md:self-auto px-2.5 py-1 rounded-lg border-2 border-[#111827] bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] text-xs font-bold shadow-[1.5px_1.5px_0px_#111827] flex items-center gap-1.5 transition-transform active:translate-y-0.5"
          >
            <MapPin className="w-3.5 h-3.5 text-[#4163F5]" />
            <span>Switch Station Map</span>
          </button>
        )}
      </div>

      {/* Main Info Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Station Identity & Mapped Specifications (6 cols) */}
        <div className="lg:col-span-6 space-y-1.5">
          <h2 className="text-base sm:text-lg font-black text-[#111827] leading-snug">
            {stationName}
          </h2>

          <p className="text-xs text-[#64748B] flex items-start gap-1 font-medium leading-relaxed">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>{stationAddress}</span>
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Mapped Points: <strong>{capacityDesc}</strong>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
              Connectors: <strong>{sockets}</strong>
            </span>
          </div>

          <div className="text-[9px] text-slate-400 font-mono">
            Provenance: {sourceName} · ODbL / CC-BY 4.0
          </div>
        </div>

        {/* Right Column: Hypothetical Simulation Configuration Controls (6 cols) */}
        <div className="lg:col-span-6 bg-[#F8FAFC] border-2 border-[#111827] rounded-xl p-3 shadow-[1.5px_1.5px_0px_#111827] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#111827] flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-[#4163F5]" />
              <span>Simulated Scenario Configuration</span>
            </span>
            <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-[#111827] text-white">
              {capacity.toFixed(1)} kW CAP
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setCapacity(10)}
              className={`px-2 py-1 rounded-lg border-2 font-bold text-center transition-all ${
                capacity === 10
                  ? 'bg-[#E83D62] text-white border-[#111827] shadow-[1.5px_1.5px_0px_#111827]'
                  : 'bg-white text-[#111827] border-slate-200 hover:border-[#111827]'
              }`}
            >
              <span className="block text-[10px] font-black">10 kW</span>
              <span className="text-[8px] block opacity-80">Congested</span>
            </button>

            <button
              type="button"
              onClick={() => setCapacity(14)}
              className={`px-2 py-1 rounded-lg border-2 font-bold text-center transition-all ${
                capacity === 14
                  ? 'bg-[#4163F5] text-white border-[#111827] shadow-[1.5px_1.5px_0px_#111827]'
                  : 'bg-white text-[#111827] border-slate-200 hover:border-[#111827]'
              }`}
            >
              <span className="block text-[10px] font-black">14 kW</span>
              <span className="text-[8px] block opacity-80">Standard</span>
            </button>

            <button
              type="button"
              onClick={() => setCapacity(21)}
              className={`px-2 py-1 rounded-lg border-2 font-bold text-center transition-all ${
                capacity === 21
                  ? 'bg-[#55BD8D] text-white border-[#111827] shadow-[1.5px_1.5px_0px_#111827]'
                  : 'bg-white text-[#111827] border-slate-200 hover:border-[#111827]'
              }`}
            >
              <span className="block text-[10px] font-black">21 kW</span>
              <span className="text-[8px] block opacity-80">Surplus</span>
            </button>
          </div>

          {/* Explicit Transparency Disclaimer */}
          <p className="text-[9px] text-slate-500 leading-tight font-medium">
            <strong className="text-slate-700">Transparency Notice:</strong> Physical grid transformer rating, real-time bay occupancy, and live queues are not monitored by physical hardware. The parameters above are simulated inputs for this microgrid optimization scenario.
          </p>
        </div>
      </div>
    </div>
  );
}
