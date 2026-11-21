import React from 'react';
import { ShieldCheck, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export default function FeasibilityAudit({ result, vehicles, demand, mode }) {
  const isShortage = result.unmet > 0.001;

  // 10:00–11:00 urgent vehicles check (due <= 1 hour)
  const urgentVehicles = vehicles.filter((v) => v.due <= 1);
  const urgentNeed = urgentVehicles.reduce((a, v) => a + demand(v), 0);
  const hourSupply = (result.slots || [])
    .slice(0, 2)
    .reduce((a, s) => a + s.limit * 0.5, 0);
  const provableDeficit = Math.max(0, urgentNeed - hourSupply);

  // Impacted vehicles list
  const deficits = vehicles
    .map((v, i) => {
      const need = demand(v);
      const unmet = result.remaining[i] || 0;
      return { v, need, unmet };
    })
    .filter((x) => x.unmet > 0.00001);

  const policyName =
    mode === 'smart'
      ? 'Slack-Priority Heuristic'
      : mode === 'edf'
      ? 'Earliest-Deadline-First Baseline'
      : 'First-Come First-Served Baseline';

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Mathematical Feasibility Audit & Window Bounds
            </h3>
            <p className="text-xs text-slate-400">
              Necessary-condition window checks vs heuristic schedule outcomes
            </p>
          </div>
        </div>

        <div>
          {isShortage ? (
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Shortfall Detected</span>
            </span>
          ) : (
            <span className="px-3 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>All Targets Met</span>
            </span>
          )}
        </div>
      </div>

      {/* Audit Body */}
      <div className="space-y-3 text-xs leading-relaxed text-slate-300">
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <p>
            <strong className="text-white">Scenario Summary:</strong>{' '}
            {result.total.toFixed(1)} kWh requested by fleet;{' '}
            <span className="text-emerald-400 font-bold">
              {(result.total - result.unmet).toFixed(1)} kWh
            </span>{' '}
            delivered by {policyName}.{' '}
            <strong className="text-white">
              {result.violations} site-capacity violations.
            </strong>
          </p>

          <p>
            <strong className="text-white">
              10:00–11:00 Urgent Window Check:
            </strong>{' '}
            {urgentNeed.toFixed(1)} kWh requested by 11:00 versus{' '}
            {hourSupply.toFixed(1)} kWh maximum physical site energy available.{' '}
            {provableDeficit > 0 ? (
              <span className="text-amber-400 font-medium">
                At least <strong>{provableDeficit.toFixed(1)} kWh</strong> of
                these urgent requests is physically impossible to fulfill in
                this initial window regardless of scheduling algorithm.
              </span>
            ) : (
              <span className="text-slate-400">
                No immediate shortage is mathematically proven by this 1-hour
                window check.
              </span>
            )}
          </p>

          <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-800/80">
            Note: Overall unmet energy is the result of this constrained dispatch
            heuristic, not a certified minimum. Exact certification requires an
            offline Mixed-Integer Linear Program (MILP).
          </p>
        </div>

        {/* Impacted Vehicles Deficit Badges */}
        {deficits.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Vehicles Experiencing Energy Shortfall ({deficits.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {deficits.map(({ v, need, unmet }) => {
                const percentUnmet = Math.round(
                  (100 * unmet) / Math.max(0.001, need)
                );
                return (
                  <span
                    key={v.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-1.5"
                  >
                    <strong>{v.id}:</strong> -{unmet.toFixed(1)} kWh ({percentUnmet}%
                    unmet)
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
