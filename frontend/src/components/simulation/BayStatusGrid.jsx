import React from 'react';
import { Gauge, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BayStatusGrid({
  result,
  vehicles,
  colors,
  onSelectVehicle,
}) {
  const firstSlot = result?.slots?.[0] || {
    load: 0,
    limit: 14,
    bays: [null, null, null],
  };

  const utilizationPercent = Math.min(
    100,
    Math.round((100 * firstSlot.load) / Math.max(1, firstSlot.limit))
  );

  return (
    <div className="space-y-4">
      {/* Top Dispatch Meter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Site Active Power Dispatch (Slot 10:00)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-white">
                {firstSlot.load.toFixed(1)} kW
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {firstSlot.limit.toFixed(1)} kW capacity limit
              </span>
            </div>
          </div>
        </div>

        {/* Meter progress bar */}
        <div className="flex-1 max-w-xs space-y-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Site Utilization</span>
            <span
              className={`font-bold ${
                utilizationPercent >= 90
                  ? 'text-amber-400'
                  : utilizationPercent >= 75
                  ? 'text-emerald-400'
                  : 'text-sky-400'
              }`}
            >
              {utilizationPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                utilizationPercent >= 90
                  ? 'bg-amber-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3-Bay Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[0, 1, 2].map((bayIndex) => {
          const assignment = firstSlot.bays[bayIndex];
          const isFault = bayIndex >= result.maxBays;

          if (isFault) {
            return (
              <div
                key={bayIndex}
                className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2 opacity-80"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 font-mono">
                    BAY 0{bayIndex + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    OFFLINE
                  </span>
                </div>
                <div className="pt-2 text-xs text-rose-300/80 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Hardware Fault / Maintenance</span>
                </div>
              </div>
            );
          }

          if (!assignment) {
            return (
              <div
                key={bayIndex}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 font-mono">
                    BAY 0{bayIndex + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-400">
                    READY
                  </span>
                </div>
                <p className="text-xs text-slate-500 pt-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" />
                  <span>Awaiting scheduled EV arrival…</span>
                </p>
              </div>
            );
          }

          const vehicle = vehicles[assignment.i];
          const color = colors[assignment.i % colors.length];

          return (
            <div
              key={bayIndex}
              onClick={() => onSelectVehicle(assignment.i)}
              className="p-4 rounded-xl border border-emerald-500/40 bg-slate-900/90 hover:bg-slate-800/80 transition-all cursor-pointer space-y-2.5 shadow-md shadow-emerald-500/5 group"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 font-mono">
                  BAY 0{bayIndex + 1}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-300" />
                  <span>{assignment.power.toFixed(1)} kW</span>
                </span>
              </div>

              <div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono text-slate-950 inline-block mb-1"
                  style={{ backgroundColor: color }}
                >
                  {assignment.id}
                </span>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {vehicle.name}
                </h4>
              </div>

              {/* SoC Progress */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Initial SoC: {vehicle.soc}%</span>
                  <span>Target: {vehicle.target}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${vehicle.soc}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
