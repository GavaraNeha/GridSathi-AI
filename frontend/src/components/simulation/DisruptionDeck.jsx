import React from 'react';
import {
  Zap,
  Sliders,
  AlertTriangle,
  Sun,
  ShieldAlert,
  RotateCcw,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';

export default function DisruptionDeck({
  mode,
  setMode,
  capacity,
  setCapacity,
  events,
  toggleEvent,
  comparison,
  onReset,
  onOpenAddModal,
  stationContext,
}) {
  const diffOnTime = comparison?.diffOnTime ?? 0;
  const diffEnergy = comparison?.diffEnergy ?? 0;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
      {/* Top Header: Scenario Title & Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Interactive Microgrid Optimizer
            </span>
            {stationContext && (
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-xs">
                Context: <strong className="text-white">{stationContext.name}</strong>
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            Dispatch Policy & Disruption Testing
          </h2>
        </div>

        {/* Algorithm Modes */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'smart'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Slack-Priority (Smart)
          </button>
          <button
            type="button"
            onClick={() => setMode('edf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'edf'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⏱️ Earliest Deadline (EDF)
          </button>
          <button
            type="button"
            onClick={() => setMode('fcfs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'fcfs'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🚗 First-Come (FCFS)
          </button>
        </div>
      </div>

      {/* Comparison Callout vs FCFS Baseline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            <strong>Algorithmic Gain vs FCFS Baseline:</strong>{' '}
            <span
              className={diffOnTime >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
            >
              {diffOnTime >= 0 ? `+${diffOnTime}` : diffOnTime} EVs on-time
            </span>{' '}
            |{' '}
            <span
              className={diffEnergy >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}
            >
              {diffEnergy >= 0 ? `+${diffEnergy.toFixed(1)}` : diffEnergy.toFixed(1)} kWh
            </span>{' '}
            energy delivered
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Add Vehicle</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Simulation to Baseline"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls: Transformer Slider & Disruption Switches */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
        {/* Transformer Slider (5 cols) */}
        <div className="md:col-span-5 p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Transformer Capacity:</span>
            </span>
            <b className="text-sm font-mono text-white bg-slate-800 px-2.5 py-0.5 rounded">
              {capacity} kW
            </b>
          </div>

          <input
            type="range"
            min="7"
            max="21"
            step="1"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>7 kW (1 bay)</span>
            <span>14 kW (standard)</span>
            <span>21 kW (3 full bays)</span>
          </div>
        </div>

        {/* Disruption Deck Toggles (7 cols) */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Charger Fault */}
          <button
            type="button"
            onClick={() => toggleEvent('fault')}
            className={`p-3 rounded-xl border text-left transition-all ${
              events.fault
                ? 'bg-rose-500/15 border-rose-500 text-rose-300 ring-1 ring-rose-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 mb-1.5 ${events.fault ? 'text-rose-400' : 'text-slate-500'}`} />
            <span className="text-xs font-bold block">Bay 3 Fault</span>
            <small className="text-[10px] text-slate-500 block">Cap at 2 bays</small>
          </button>

          {/* Grid Brownout */}
          <button
            type="button"
            onClick={() => toggleEvent('brownout')}
            className={`p-3 rounded-xl border text-left transition-all ${
              events.brownout
                ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Zap className={`w-4 h-4 mb-1.5 ${events.brownout ? 'text-amber-400' : 'text-slate-500'}`} />
            <span className="text-xs font-bold block">Brownout</span>
            <small className="text-[10px] text-slate-500 block">Cap at 10 kW</small>
          </button>

          {/* Solar Canopy */}
          <button
            type="button"
            onClick={() => toggleEvent('solar')}
            className={`p-3 rounded-xl border text-left transition-all ${
              events.solar
                ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <Sun className={`w-4 h-4 mb-1.5 ${events.solar ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-xs font-bold block">Solar Boost</span>
            <small className="text-[10px] text-slate-500 block">+1–4 kW solar</small>
          </button>

          {/* Emergency Arrival */}
          <button
            type="button"
            onClick={() => toggleEvent('emergency')}
            className={`p-3 rounded-xl border text-left transition-all ${
              events.emergency
                ? 'bg-purple-500/15 border-purple-500 text-purple-300 ring-1 ring-purple-500/40'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <ShieldAlert className={`w-4 h-4 mb-1.5 ${events.emergency ? 'text-purple-400' : 'text-slate-500'}`} />
            <span className="text-xs font-bold block">Emergency</span>
            <small className="text-[10px] text-slate-500 block">+EV-7 arrival</small>
          </button>
        </div>
      </div>
    </div>
  );
}
