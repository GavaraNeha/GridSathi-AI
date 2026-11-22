import React from 'react';
import { Zap, MapPin, Cpu, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="border-b-2 border-[#111827] bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F5AD16] border-2 border-[#111827] flex items-center justify-center shadow-[2px_2px_0px_#111827]">
                <Zap className="w-5 h-5 text-[#111827] fill-[#111827]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight text-[#111827]">
                    GridSathi <span className="text-[#4163F5]">AI</span>
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#111827] bg-[#55BD8D] text-white">
                    MICROGRID BRAIN LIVE
                  </span>
                </div>
                <p className="text-xs text-[#64748B] hidden sm:block font-medium">
                  Solar-Kinetic EV Load Orchestrator & OpenStreetMap Discovery
                </p>
              </div>
            </div>

            <div className="md:hidden text-xs font-bold text-slate-500">
              India (IN)
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0px_#111827]">
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'simulation'
                  ? 'bg-[#4163F5] text-white shadow-xs'
                  : 'text-[#111827] hover:bg-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Smart Microgrid</span>
            </button>
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-black transition-all ${
                activeTab === 'discovery'
                  ? 'bg-[#4163F5] text-white shadow-xs'
                  : 'text-[#111827] hover:bg-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>OSM Discovery</span>
            </button>
          </div>

          {/* Legacy Prototype & Compliance Badge */}
          <div className="hidden lg:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-[#111827] text-slate-700 font-bold">
              <ShieldCheck className="w-4 h-4 text-[#55BD8D]" />
              <span>48/48 Verified Invariants</span>
            </div>
            <a
              href="http://127.0.0.1:8000/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#F8FAFC] hover:bg-slate-100 text-[#111827] border border-[#111827] font-bold text-xs transition-colors shadow-[1px_1px_0px_#111827]"
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
