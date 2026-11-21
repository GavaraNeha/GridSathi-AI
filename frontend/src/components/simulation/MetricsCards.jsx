import React from 'react';
import { CheckCircle2, AlertOctagon, IndianRupee, Scale } from 'lucide-react';

export default function MetricsCards({ result, vehicles }) {
  const numVehicles = vehicles?.length || 1;
  const onTimePercent = Math.round((result.onTime / numVehicles) * 100);
  const deliveredTotal = Math.max(0, result.total - result.unmet);
  const fairnessPercent = Math.round(result.fairness * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* 1. Deadlines Met */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Deadlines Met
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {result.onTime}/{numVehicles}
          </span>
          <span className="text-xs text-emerald-400 font-mono font-bold">
            ({onTimePercent}%)
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          EVs reaching requested target before departure
        </p>
      </div>

      {/* 2. Unmet Energy Deficit */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Unmet Energy Deficit
          </span>
          <AlertOctagon
            className={`w-4 h-4 ${
              result.unmet > 0.001 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          />
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold font-mono ${
              result.unmet > 0.001 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {result.unmet.toFixed(1)} kWh
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {deliveredTotal.toFixed(1)} of {result.total.toFixed(1)} kWh delivered
        </p>
      </div>

      {/* 3. Peak Site Load & Cost */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Peak Load & Cost
          </span>
          <IndianRupee className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {result.peak.toFixed(1)} kW
          </span>
          <span className="text-xs text-sky-400 font-mono font-bold">
            ₹{Math.round(result.cost)}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {result.violations} site-capacity violations
        </p>
      </div>

      {/* 4. Jain Fairness Index */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            Jain Fairness Index
          </span>
          <Scale className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono text-white">
            {fairnessPercent}%
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          Equitable delivered / requested energy ratios
        </p>
      </div>
    </div>
  );
}
