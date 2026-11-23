import React from 'react';
import { Zap, MapPin, Cpu, ShieldAlert, ShieldCheck, ExternalLink } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="border-b-2 border-[#111827] bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2.5">
          {/* Brand */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#F5AD16] border-2 border-[#111827] flex items-center justify-center shadow-[1.5px_1.5px_0px_#111827] shrink-0">
                <Zap className="w-4 h-4 text-[#111827] fill-[#111827]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-[#111827]">
                    GridSathi <span className="text-[#4163F5]">AI</span>
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#111827] bg-[#55BD8D] text-white">
                    MICROGRID BRAIN LIVE
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] hidden sm:block font-medium leading-none mt-0.5">
                  Solar-Kinetic EV Load Orchestrator & OpenStreetMap Discovery
                </p>
              </div>
            </div>

            <div className="md:hidden text-[10px] font-bold text-slate-500 font-mono">
              India (IN)
            </div>
          </div>

          {/* Clean Three-View Navigation Tabs */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] p-1 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0px_#111827] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                activeTab === 'discovery'
                  ? 'bg-[#4163F5] text-white shadow-[1.5px_1.5px_0px_#111827]'
                  : 'text-[#111827] hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>EV Discovery</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                activeTab === 'simulation'
                  ? 'bg-[#4163F5] text-white shadow-[1.5px_1.5px_0px_#111827]'
                  : 'text-[#111827] hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Microgrid Simulator</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rescue')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black transition-all shrink-0 ${
                activeTab === 'rescue'
                  ? 'bg-[#E83D62] text-white shadow-[1.5px_1.5px_0px_#111827]'
                  : 'text-[#111827] hover:bg-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-accent-yellow" />
              <span>Charge Rescue</span>
            </button>
          </div>

          {/* Verification Badge & Legacy Link */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#111827] text-slate-700 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#55BD8D]" />
              <span>48/48 Invariants Verified</span>
            </div>
            <a
              href="/legacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] border border-[#111827] font-bold text-[11px] transition-colors shadow-[1px_1px_0px_#111827]"
              title="Launch preserved legacy prototype"
            >
              <span>Legacy Prototype</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
