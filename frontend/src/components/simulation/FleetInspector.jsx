import React from 'react';
import { Car, Clock, Battery, AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function FleetInspector({
  vehicles,
  selectedVehicleIndex,
  onSelectVehicle,
  result,
  demand,
  clock,
  colors,
}) {
  const selectedVehicle =
    vehicles[selectedVehicleIndex] || vehicles[0] || {};
  const selectedIdx = Math.min(selectedVehicleIndex, vehicles.length - 1);

  const neededEnergy = demand(selectedVehicle);
  const deliveredEnergy = result?.delivered?.[selectedIdx] || 0;
  const unmetEnergy = result?.remaining?.[selectedIdx] || 0;
  const isTargetMet = unmetEnergy < 0.001;

  const dueTime = clock(selectedVehicle.due * 2);

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Car className="w-4 h-4 text-emerald-400" />
          <span>Simulated Fleet ({vehicles.length} EVs)</span>
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Click any vehicle to inspect
        </span>
      </div>

      {/* Fleet Cards Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {vehicles.map((v, i) => {
          const isSelected = i === selectedIdx;
          const color = colors[i % colors.length];
          const vNeeded = demand(v);
          const vDue = clock(v.due * 2);

          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelectVehicle(i)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/60 hover:bg-slate-800/40 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-950"
                  style={{ backgroundColor: color }}
                >
                  {v.id}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {vDue}
                </span>
              </div>

              <h5 className="text-xs font-bold text-white truncate" title={v.name}>
                {v.name}
              </h5>

              <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                {vNeeded.toFixed(1)} kWh req
              </p>

              {/* SoC bar */}
              <div className="w-full h-1 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${v.soc}%`, backgroundColor: color }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Vehicle Detail Card */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-mono font-bold text-slate-950"
              style={{
                backgroundColor: colors[selectedIdx % colors.length],
              }}
            >
              {selectedVehicle.id}
            </span>
            <h4 className="text-base font-bold text-white">
              {selectedVehicle.name}
            </h4>
            <span className="text-xs text-slate-400 font-mono">
              ({selectedVehicle.battery} kWh battery)
            </span>
          </div>

          <div>
            {isTargetMet ? (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Target Met</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Target Shortfall (-{unmetEnergy.toFixed(1)} kWh)</span>
              </span>
            )}
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">SoC Target</span>
            <span className="font-mono text-slate-200 font-semibold">
              {selectedVehicle.soc}% → {selectedVehicle.target}%
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Departure Due</span>
            <span className="font-mono text-slate-200 font-semibold">
              {dueTime} ({selectedVehicle.due}h)
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Energy Delivered</span>
            <span className="font-mono text-emerald-400 font-semibold">
              {deliveredEnergy.toFixed(1)} / {neededEnergy.toFixed(1)} kWh
            </span>
          </div>

          <div>
            <span className="text-slate-500 block text-[11px]">Unmet Energy</span>
            <span
              className={`font-mono font-semibold ${
                unmetEnergy > 0.001 ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              {unmetEnergy.toFixed(1)} kWh
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
