import React from 'react';
import {
  Sliders,
  AlertTriangle,
  Zap,
  Sun,
  ShieldAlert,
  RotateCcw,
  TrendingDown,
  TrendingUp,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function DisruptionDeck({
  capacity,
  setCapacity,
  events,
  toggleEvent,
  onReset,
  disruptionDiff,
  mode = 'smart',
}) {
  return (
    <div className="bg-[#111827] text-white border-2 border-[#111827] rounded-2xl shadow-[3px_3px_0px_rgba(17,24,39,0.3)] p-4 sm:p-5 space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-800">
        <div>
          <span className="text-[9px] font-black tracking-widest text-[#F5AD16] uppercase block">
            STRESS TESTING & SIMULATION ENGINE
          </span>
          <h3 className="text-sm sm:text-base font-black text-white tracking-tight mt-0.5">
            What-If Disruptions & Operational Controls
          </h3>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl px-2.5 py-1 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Disruptions</span>
        </button>
      </div>

      {/* Slider & Disruption Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        {/* Left: Transformer Capacity Slider (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-[#4163F5]" />
              <span>Transformer Capacity Ceiling</span>
            </span>
            <span className="text-xs font-black font-mono text-[#F5AD16] bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {capacity.toFixed(1)} kW
            </span>
          </div>

          <input
            type="range"
            min="7"
            max="21"
            step="0.5"
            value={capacity}
            onChange={(e) => setCapacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#4163F5]"
          />

          <div className="flex justify-between text-[9px] font-mono text-slate-500 font-bold">
            <span>7 kW (Congested)</span>
            <span>14 kW (Standard)</span>
            <span>21 kW (Surplus)</span>
          </div>
        </div>

        {/* Right: 4 Operational Disruption Switches (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 1. Charger Fault */}
          <button
            type="button"
            onClick={() => toggleEvent('fault')}
            className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              events.fault
                ? 'bg-[#E83D62]/15 border-[#E83D62] text-white shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Bay 3 Hardware Fault</span>
              <span className="text-[9px] text-slate-400 block">
                {events.fault ? 'Bay 3 tripped offline' : 'All 3 bays operational'}
              </span>
            </div>
            <div
              className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                events.fault ? 'bg-[#E83D62]' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  events.fault ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* 2. Grid Brownout */}
          <button
            type="button"
            onClick={() => toggleEvent('brownout')}
            className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              events.brownout
                ? 'bg-[#F5AD16]/15 border-[#F5AD16] text-white shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Grid Brownout (10 kW)</span>
              <span className="text-[9px] text-slate-400 block">
                {events.brownout ? 'Supply throttled to 10 kW' : 'Normal grid voltage'}
              </span>
            </div>
            <div
              className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                events.brownout ? 'bg-[#F5AD16]' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  events.brownout ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* 3. Solar Canopy Boost */}
          <button
            type="button"
            onClick={() => toggleEvent('solar')}
            className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              events.solar
                ? 'bg-[#55BD8D]/15 border-[#55BD8D] text-white shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Solar Canopy (+4 kW)</span>
              <span className="text-[9px] text-slate-400 block">
                {events.solar ? 'Midday generation active' : 'Solar array idle'}
              </span>
            </div>
            <div
              className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                events.solar ? 'bg-[#55BD8D]' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  events.solar ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </button>

          {/* 4. Emergency Arrival */}
          <button
            type="button"
            onClick={() => toggleEvent('emergency')}
            className={`p-2.5 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
              events.emergency
                ? 'bg-[#8B5CF6]/15 border-[#8B5CF6] text-white shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="space-y-0.5">
              <span className="text-xs font-black block">Emergency EV (+EV-7)</span>
              <span className="text-[9px] text-slate-400 block">
                {events.emergency ? 'Urgent EV-7 inserted at 10:00' : 'Baseline 6-EV fleet'}
              </span>
            </div>
            <div
              className={`w-7 h-4 rounded-full transition-colors relative p-0.5 ${
                events.emergency ? 'bg-[#8B5CF6]' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  events.emergency ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* FEATURE 3: EXPLAINABLE DISRUPTION REPLAY & IMPACT ANALYSIS PANEL */}
      {disruptionDiff && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F5AD16] animate-ping" />
              <h4 className="text-sm font-black text-white tracking-wide uppercase flex items-center gap-2">
                <span>Disruption Replay & Causal Decision Analysis</span>
                <span className="text-[10px] font-bold text-slate-400 font-mono normal-case">
                  (Mode: {mode.toUpperCase()})
                </span>
              </h4>
            </div>

            <span className="text-[11px] text-[#F5AD16] font-mono font-bold bg-[#F5AD16]/10 border border-[#F5AD16]/30 px-2.5 py-0.5 rounded-lg">
              Active Disruption Delta Active
            </span>
          </div>

          {/* Before vs After KPI Delta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* On-Time EVs Delta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                On-Time Departures
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-slate-400 line-through">
                  {disruptionDiff.baselineResult.onTime}/6
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={`text-base font-black font-mono ${
                    disruptionDiff.deltaOnTime >= 0 ? 'text-[#55BD8D]' : 'text-[#E83D62]'
                  }`}
                >
                  {disruptionDiff.baselineResult.onTime + disruptionDiff.deltaOnTime}
                </span>
                <span
                  className={`text-[10px] font-bold font-mono ${
                    disruptionDiff.deltaOnTime >= 0 ? 'text-[#55BD8D]' : 'text-[#E83D62]'
                  }`}
                >
                  ({disruptionDiff.deltaOnTime >= 0 ? '+' : ''}
                  {disruptionDiff.deltaOnTime})
                </span>
              </div>
            </div>

            {/* Unmet Energy Delta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Unmet Deficit
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-slate-400 line-through">
                  {disruptionDiff.baselineResult.unmet.toFixed(1)}k
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={`text-base font-black font-mono ${
                    disruptionDiff.deltaUnmet <= 0 ? 'text-[#55BD8D]' : 'text-[#E83D62]'
                  }`}
                >
                  {(disruptionDiff.baselineResult.unmet + disruptionDiff.deltaUnmet).toFixed(1)} kWh
                </span>
              </div>
            </div>

            {/* Peak Site Load */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Peak Load Draw
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-slate-400 line-through">
                  {disruptionDiff.baselineResult.peak.toFixed(1)}k
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span className="text-base font-black font-mono text-white">
                  {(disruptionDiff.baselineResult.peak +
                    (events.brownout ? -4.0 : events.solar ? 2.0 : 0.0)).toFixed(1)}{' '}
                  kW
                </span>
              </div>
            </div>

            {/* Jain's Fairness Delta */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                Jain Fairness Index
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-mono text-slate-400 line-through">
                  {Math.round(disruptionDiff.baselineResult.fairness * 100)}%
                </span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
                <span
                  className={`text-base font-black font-mono ${
                    disruptionDiff.deltaFairness >= 0 ? 'text-[#55BD8D]' : 'text-[#E83D62]'
                  }`}
                >
                  {Math.round(disruptionDiff.baselineResult.fairness * 100) +
                    disruptionDiff.deltaFairness}
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Vehicle Energy Shift Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-black tracking-wider uppercase text-slate-300 block">
              Vehicle-by-Vehicle Energy Allocation Shifts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {disruptionDiff.vehicleShifts.map((vs) => (
                <div
                  key={vs.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white block">{vs.id}</span>
                    <span className="text-[10px] text-slate-400 truncate block max-w-[140px]">
                      {vs.name}
                    </span>
                  </div>

                  {vs.status === 'injected' ? (
                    <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500 font-mono font-bold text-[10px]">
                      +{vs.curDelivered.toFixed(1)} kWh (Injected)
                    </span>
                  ) : vs.status === 'lost' ? (
                    <span className="px-2 py-0.5 rounded bg-red-900/40 text-[#E83D62] border border-red-500 font-mono font-bold text-[10px] flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      <span>{vs.deltaKwh.toFixed(1)} kWh</span>
                    </span>
                  ) : vs.status === 'gained' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-900/40 text-[#55BD8D] border border-emerald-500 font-mono font-bold text-[10px] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+{vs.deltaKwh.toFixed(1)} kWh</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold text-[10px]">
                      Unchanged ({vs.curDelivered.toFixed(1)}k)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Algorithmic Causal Explanations */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 space-y-2 text-xs">
            <span className="font-black text-[#F5AD16] text-[11px] uppercase tracking-wider block">
              Algorithmic Scheduling Rationale:
            </span>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed list-disc list-inside">
              {disruptionDiff.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
