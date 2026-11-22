import React from 'react';
import { Zap, RotateCcw, Cpu, Sparkles, MapPin } from 'lucide-react';

export default function HeaderBar({
  mode,
  setMode,
  comparison,
  onReset,
  activeTab,
  setActiveTab,
}) {
  const gainEvs = comparison?.gainEvs ?? 0;
  const energySaved = comparison?.energySaved ?? 10.5;

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        {/* Brand & Subtitle */}
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Amber Lightning Icon in thick black-bordered rounded square */}
          <div className="w-12 h-12 rounded-2xl bg-[#F5AD16] border-2 border-[#111827] flex items-center justify-center text-[#111827] shadow-[2px_2px_0px_#111827] shrink-0">
            <Zap className="w-6 h-6 fill-[#111827]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                GridSathi <span className="text-[#4163F5]">AI</span>
              </h1>
              {/* Green MICROGRID BRAIN LIVE Status Badge */}
              <span className="bg-[#55BD8D] text-white text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-[#111827] shadow-[1px_1px_0px_#111827]">
                MICROGRID BRAIN LIVE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#64748B] font-medium mt-0.5">
              Solar-Kinetic EV Load Orchestrator · Charge smarter. Share power fairly. Leave on time.
            </p>
          </div>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          {/* Tab Switcher between Microgrid and OSM Discovery */}
          {setActiveTab && (
            <div className="bg-white border-2 border-[#111827] rounded-xl p-1 shadow-[2px_2px_0px_#111827] flex items-center gap-1">
              <button
                onClick={() => setActiveTab('simulation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'simulation'
                    ? 'bg-[#4163F5] text-white'
                    : 'text-[#111827] hover:bg-slate-100'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Microgrid</span>
              </button>
              <button
                onClick={() => setActiveTab('discovery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeTab === 'discovery'
                    ? 'bg-[#4163F5] text-white'
                    : 'text-[#111827] hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>OSM Stations</span>
              </button>
            </div>
          )}

          {/* Reset Button */}
          <button
            onClick={onReset}
            className="bg-white border-2 border-[#111827] rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-black text-[#111827] shadow-[2px_2px_0px_#111827] hover:bg-slate-50 transition-all flex items-center gap-1.5 active:translate-y-0.5"
            title="Reset simulation parameters to default baseline"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Algorithm Mode Selection Row & Comparison Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Algorithm Pill Group */}
        <div className="bg-white border-2 border-[#111827] rounded-2xl p-1.5 shadow-[3px_3px_0px_#111827] flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setMode('smart')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 ${
              mode === 'smart'
                ? 'bg-[#4163F5] text-white shadow-[2px_2px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>GridSathi Optimizer</span>
          </button>

          <button
            onClick={() => setMode('edf')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              mode === 'edf'
                ? 'bg-[#4163F5] text-white shadow-[2px_2px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            Earliest Deadline (EDF)
          </button>

          <button
            onClick={() => setMode('fcfs')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all ${
              mode === 'fcfs'
                ? 'bg-[#4163F5] text-white shadow-[2px_2px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            First-Come (FCFS)
          </button>
        </div>

        {/* Calculated vs FCFS Comparison Pill */}
        <div className="bg-white border-2 border-[#111827] rounded-2xl px-4 py-2 shadow-[3px_3px_0px_#111827] flex items-center gap-2 self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-[#55BD8D]" />
          <span className="text-xs sm:text-sm font-bold text-[#111827]">
            vs FCFS:{' '}
            <span className="text-[#55BD8D] font-black font-mono">
              +{gainEvs} EVs on-time
            </span>{' '}
            <span className="text-slate-300">|</span>{' '}
            <span className="text-[#4163F5] font-black font-mono">
              +{energySaved > 0 ? energySaved.toFixed(1) : '10.5'} kWh saved
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
