import React from 'react';
import { Zap, MapPin, Cpu, ShieldCheck, ExternalLink, Globe } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/30">
                <Zap className="w-6 h-6 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-extrabold tracking-tight text-white">
                    GridSathi <span className="text-emerald-400">AI</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" />
                    <span>OSM Live · Zero Keys</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  OpenStreetMap EV Discovery & Microgrid Load Dispatch (India)
                </p>
              </div>
            </div>

            {/* Quick status mobile badge */}
            <div className="md:hidden text-xs text-slate-400">
              India (IN)
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('discovery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'discovery'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>OSM Discovery</span>
            </button>
            <button
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'simulation'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Smart Microgrid</span>
              <span className="text-[10px] bg-slate-950/40 px-1.5 py-0.5 rounded text-slate-300 font-mono">
                SIM
              </span>
            </button>
          </div>

          {/* Status info & Fallback button */}
          <div className="hidden lg:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Engine Compliance: 48/48 Invariants</span>
            </div>
            <a
              href="http://127.0.0.1:8000/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              title="Launch preserved legacy prototype"
            >
              <span>Legacy Prototype</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
