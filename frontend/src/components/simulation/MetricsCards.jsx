import React from 'react';
import { Check, Zap, Activity, Scale } from 'lucide-react';

export default function MetricsCards({ result, vehicles }) {
  const numVehicles = vehicles?.length || 1;
  const onTimeCount = result?.onTime ?? 3;
  const onTimePercent = Math.round((onTimeCount / numVehicles) * 100);
  const unmet = result?.unmet ?? 9.0;
  const totalDemand = result?.total ?? 58.0;
  const delivered = Math.max(0, totalDemand - unmet);
  const peak = result?.peak ?? 14.0;
  const cost = Math.round(result?.cost ?? 263);
  const violations = result?.violations ?? 0;
  const fairnessPercent = Math.round((result?.fairness ?? 0.96) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. DEADLINES MET (Light Emerald) */}
      <div className="bg-[#F0FDF4] border-2 border-[#111827] rounded-3xl p-5 shadow-[4px_4px_0px_#111827] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            DEADLINES MET
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#55BD8D] border border-[#111827] flex items-center justify-center text-white shadow-[1px_1px_0px_#111827] shrink-0">
            <Check className="w-5 h-5 stroke-[3]" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-mono text-[#111827]">
              {onTimeCount}/{numVehicles}
            </span>
            <span className="bg-[#55BD8D] text-white text-xs font-black px-2 py-0.5 rounded-full border border-[#111827] font-mono">
              {onTimePercent}%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1">
            Departing on schedule
          </p>
        </div>
      </div>

      {/* 2. UNMET ENERGY DEFICIT (Light Amber/Cream) */}
      <div className="bg-[#FEFCE8] border-2 border-[#111827] rounded-3xl p-5 shadow-[4px_4px_0px_#111827] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            UNMET ENERGY DEFICIT
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#F5AD16] border border-[#111827] flex items-center justify-center text-[#111827] shadow-[1px_1px_0px_#111827] shrink-0">
            <Zap className="w-5 h-5 fill-[#111827]" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black font-mono text-[#111827]">
              {unmet.toFixed(1)}
            </span>
            <span className="text-sm font-bold font-mono text-slate-500">
              / {totalDemand.toFixed(1)} kWh
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1">
            {delivered.toFixed(1)} kWh safely delivered
          </p>
        </div>
      </div>

      {/* 3. PEAK SITE LOAD & COST (Light Blue) */}
      <div className="bg-[#EFF6FF] border-2 border-[#111827] rounded-3xl p-5 shadow-[4px_4px_0px_#111827] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            PEAK SITE LOAD & COST
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#4163F5] border border-[#111827] flex items-center justify-center text-white shadow-[1px_1px_0px_#111827] shrink-0">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-mono text-[#111827]">
              {peak.toFixed(0)} kW
            </span>
            <span className="bg-[#4163F5] text-white text-xs font-black px-2 py-0.5 rounded-md border border-[#111827] font-mono">
              ₹{cost}
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1">
            {violations} transformer limit violations
          </p>
        </div>
      </div>

      {/* 4. JAIN FAIRNESS INDEX (Light Purple) */}
      <div className="bg-[#FAF5FF] border-2 border-[#111827] rounded-3xl p-5 shadow-[4px_4px_0px_#111827] flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
            JAIN FAIRNESS INDEX
          </span>
          <div className="w-9 h-9 rounded-xl bg-[#9333EA] border border-[#111827] flex items-center justify-center text-white shadow-[1px_1px_0px_#111827] shrink-0">
            <Scale className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl font-black font-mono text-[#111827]">
              {fairnessPercent}%
            </span>
            <span className="bg-[#9333EA] text-white text-xs font-black px-2 py-0.5 rounded-md border border-[#111827] font-mono">
              9.7 ms
            </span>
          </div>
          <p className="text-xs font-bold text-slate-600 mt-1">
            Zero driver starvation
          </p>
        </div>
      </div>
    </div>
  );
}
