import React from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  ShieldCheck,
  TrendingDown,
  Sparkles,
  Clock,
} from 'lucide-react';
import { generateWhatIfDecisions, calcChargingTimeEstimate } from '../../engine/journeyEngine';

export default function WhatIfAdvisor({
  selectedStation,
  allCandidates = [],
  vehicle,
  currentSoc,
  targetSoc,
  deadlineHours,
  onSelectAlternative,
  onAdjustTargetSoc,
  onAdjustDeadline,
}) {
  const gridOutcome = selectedStation?.gridOutcome || null;

  // Generate plain-language what-if insights
  const decisions = generateWhatIfDecisions(
    selectedStation,
    allCandidates,
    vehicle,
    gridOutcome
  );

  // Dynamic calculations for scenario tweaks (zero hardcoded values)
  const unmetDeficit = gridOutcome?.policies?.smart?.unmet || 0;
  const isDeficit = unmetDeficit > 0.05;

  // 1. Time needed for deficit
  const deficitTime = calcChargingTimeEstimate(
    unmetDeficit,
    vehicle?.maxKw || 7.0,
    7.0,
    gridOutcome?.capacity || 14.0,
    2
  );
  const recommendedAddHours = Math.max(0.5, Math.ceil(deficitTime.minutes / 30) * 0.5);

  // 2. Savings from lowering target to 70%
  const batteryCap = vehicle?.battery || 40;
  const targetDiff = Math.max(0, targetSoc - 70);
  const energySavedKwh = Math.round(((batteryCap * targetDiff) / 100) * 10) / 10;
  const timeSaved = calcChargingTimeEstimate(
    energySavedKwh,
    vehicle?.maxKw || 7.0,
    7.0,
    gridOutcome?.capacity || 14.0,
    2
  );

  return (
    <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#111827]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-primary-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-400 border-2 border-primary-950 flex items-center justify-center font-black">
            <Sparkles className="w-4 h-4 text-primary-950" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-primary-950 uppercase tracking-tight">
              Explainable What-If Advisor
            </h2>
            <p className="text-[10px] text-primary-700 font-bold">Actionable Charging Intelligence</p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary-950 bg-purple-100 text-purple-950">
          Smart Advice
        </span>
      </div>

      {/* Decision Cards List */}
      <div className="space-y-2 mb-3">
        {decisions.map((item, idx) => {
          let bgClass = 'bg-blue-50 border-blue-300 text-blue-950';
          let icon = <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />;

          if (item.type === 'success') {
            bgClass = 'bg-emerald-50 border-emerald-400 text-emerald-950';
            icon = <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />;
          } else if (item.type === 'warning') {
            bgClass = 'bg-amber-50 border-amber-400 text-amber-950';
            icon = <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />;
          } else if (item.type === 'error') {
            bgClass = 'bg-rose-50 border-rose-400 text-rose-950';
            icon = <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />;
          } else if (item.type === 'recommendation') {
            bgClass = 'bg-purple-50 border-purple-400 text-purple-950';
            icon = <Lightbulb className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />;
          }

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-xl border-2 text-xs flex items-start gap-2 shadow-[2px_2px_0px_#111827] ${bgClass}`}
            >
              {icon}
              <div className="flex-1">
                <span className="font-black uppercase text-[11px] tracking-wide block mb-0.5">
                  {item.title}
                </span>
                <p className="text-[10.5px] leading-snug">{item.text}</p>

                {item.targetStationId && (
                  <button
                    type="button"
                    onClick={() => {
                      const alt = allCandidates.find((c) => c.id === item.targetStationId);
                      if (alt) onSelectAlternative(alt);
                    }}
                    className="mt-1.5 px-2 py-0.5 bg-purple-700 text-white rounded-lg font-black text-[10px] uppercase border border-primary-950 hover:bg-purple-800 transition-colors inline-flex items-center gap-1"
                  >
                    <span>Switch to this station</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive What-If Scenarios Box */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5">
        <span className="text-[10px] font-black uppercase text-primary-600 block mb-1.5">
          Simulated Scenario Alternatives (Calculated from Active Demand):
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {/* Quick Target 70% button */}
          <button
            type="button"
            disabled={targetSoc <= 70}
            onClick={() => onAdjustTargetSoc(70)}
            className={`p-2 rounded-lg text-left transition-colors border ${
              targetSoc <= 70
                ? 'bg-gray-100 border-gray-300 opacity-60 cursor-not-allowed'
                : 'bg-cream-50 hover:bg-cream-100 border-primary-950'
            }`}
          >
            <span className="font-black text-[10.5px] uppercase text-primary-950 block">
              Adjust Target to 70%
            </span>
            <span className="text-[9.5px] text-primary-700 block">
              {targetSoc > 70
                ? `Saves ~${energySavedKwh} kWh (~${timeSaved.formattedTime} under modeled conditions)`
                : 'Already at or below 70% target'}
            </span>
          </button>

          {/* Extend Stay button */}
          <button
            type="button"
            onClick={() => onAdjustDeadline(deadlineHours + recommendedAddHours)}
            className="p-2 bg-cream-50 hover:bg-cream-100 border border-primary-950 rounded-lg text-left transition-colors"
          >
            <span className="font-black text-[10.5px] uppercase text-primary-950 block">
              {isDeficit
                ? `+${deficitTime.formattedTime} Window Extension`
                : '+30m Departure Buffer'}
            </span>
            <span className="text-[9.5px] text-primary-700 block">
              {isDeficit
                ? `Covers remaining ${unmetDeficit} kWh deficit at ~${deficitTime.effectiveKw} kW rate`
                : 'Adds simulated parking safety margin'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
