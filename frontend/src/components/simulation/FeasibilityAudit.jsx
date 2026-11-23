import React from 'react';
import { Award, AlertTriangle, AlertCircle } from 'lucide-react';

export default function FeasibilityAudit({ result, vehicles, demand, mode }) {
  const unmetKwh = result?.unmet ?? 0;
  const isShortage = unmetKwh > 0.001;
  const totalDemand = vehicles.reduce((a, v) => a + demand(v), 0);
  const gridCap = result?.gridCap ?? result?.slots?.[0]?.gridLimit ?? 14;
  const maxBays = result?.maxBays ?? 3;
  const concurrentFullPowerBays = Math.min(maxBays, Math.floor(gridCap / 7));

  // Policy display name
  const policyLabel =
    mode === 'smart'
      ? 'Smart Slack Optimizer'
      : mode === 'edf'
      ? 'Earliest Deadline First'
      : 'First-Come First-Served';

  // Per-vehicle hardware charging limit check (7 kW max bay charging speed)
  const hardwareLimitedVehicles = vehicles
    .map((v) => {
      const need = demand(v);
      const maxPower = v.maxKw ? Math.min(Number(v.maxKw), 7) : 7;
      const staySlots = Math.max(
        0,
        Math.round((v.due ?? 1.5) * 2) - Math.round((v.arrival ?? 0) * 2)
      );
      const stayHours = staySlots * 0.5;
      const maxAbsorbable = stayHours * maxPower;
      const hardwareDeficit = Math.max(0, need - maxAbsorbable);
      return { v, need, maxPower, stayHours, maxAbsorbable, hardwareDeficit };
    })
    .filter((x) => x.hardwareDeficit > 0.001);

  // Deficit vehicles list
  const impacted = vehicles
    .map((v, i) => {
      const need = demand(v);
      const unmet = result?.remaining?.[i] || 0;
      const pct = Math.round(((need - unmet) / Math.max(1, need)) * 100);
      return { v, need, unmet, pct };
    })
    .filter((x) => x.unmet > 0.001);

  return (
    <div className="bg-white border-2 border-[#111827] rounded-2xl shadow-[3px_3px_0px_#111827] p-3.5 sm:p-4 space-y-3">
      {/* Header Row */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#E83D62] border border-[#111827] flex items-center justify-center text-white shadow-[1.5px_1.5px_0px_#111827] shrink-0">
          <Award className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
              OFFICIAL ENGINEERING AUDIT · FEASIBILITY CERTIFICATE
            </span>
            {isShortage ? (
              <span className="bg-[#E83D62] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>SHORTFALL DETECTED</span>
              </span>
            ) : (
              <span className="bg-[#55BD8D] text-white text-[9px] font-black px-1.5 py-0.2 rounded-md">
                FEASIBLE
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-black text-[#111827] tracking-tight mt-0.5">
            {isShortage
              ? `Physical Grid Bottleneck — ${unmetKwh.toFixed(1)} kWh Energy Deficit`
              : 'Zero Energy Deficit — All Fleet Demands Certified Feasible'}
          </h3>
        </div>
      </div>

      {/* Fleet Demand vs Grid Constraints Overview Box */}
      <div className="bg-[#F8FAFC] border-2 border-[#111827] rounded-xl p-3">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
          FLEET DEMAND & GRID CONSTRAINTS
        </span>
        <div className="text-sm sm:text-base font-black font-mono text-[#111827] mt-0.5">
          {totalDemand.toFixed(1)} kWh Total Demand ({vehicles.length} EVs) vs. {gridCap} kW Grid Cap ({maxBays} Bays)
        </div>
      </div>

      {/* Why every request cannot be simultaneously satisfied */}
      {isShortage && (
        <div className="space-y-1.5 text-xs">
          <span className="font-black text-[#E83D62] uppercase tracking-wider text-[10px] block">
            PHYSICAL CONSTRAINTS CAUSING ENERGY DEFICIT:
          </span>
          <div className="space-y-1 text-[#111827] font-medium leading-relaxed pl-1.5 text-xs">
            <p>
              • <strong className="font-bold">Transformer & Bay Concurrency Limit:</strong> Site power is capped at {gridCap} kW across {maxBays} physical bays. At 7 kW per charger, at most {concurrentFullPowerBays} bays can draw full power simultaneously without overloading the grid.
            </p>
            {hardwareLimitedVehicles.length > 0 ? (
              <p>
                • <strong className="font-bold">Per-Vehicle Hardware Limit:</strong>{' '}
                {hardwareLimitedVehicles.map((h) => `${h.v.id} (${h.v.name || h.v.model || 'EV'}) requests ${h.need.toFixed(1)} kWh, but its ${h.stayHours.toFixed(1)}h parking window allows at most ${h.maxAbsorbable.toFixed(1)} kWh at ${h.maxPower} kW (${h.hardwareDeficit.toFixed(1)} kWh hardware deficit)`).join('; ')}.
              </p>
            ) : (
              <p>
                • <strong className="font-bold">Per-Vehicle Charging Limit:</strong> Each bay is capped at 7 kW max (3.5 kWh per 30-min slot), bounding the energy absorbable during short parking stays.
              </p>
            )}
            <p>
              • <strong className="font-bold">Overlapping Deadlines & Competition:</strong> Multiple vehicles compete for limited charging windows before departure. Under {policyLabel}, {result?.onTime ?? 0} of {vehicles.length} EVs meet their deadline, leaving {unmetKwh.toFixed(1)} kWh unmet across {impacted.length} impacted vehicles.
            </p>
          </div>
        </div>
      )}

      {/* Impacted Vehicles Box */}
      {impacted.length > 0 && (
        <div className="bg-white border-2 border-[#111827] rounded-xl p-3 space-y-2">
          <span className="text-[11px] font-black text-slate-700 tracking-wider uppercase block">
            IMPACTED VEHICLES ({impacted.length}):
          </span>

          <div className="space-y-2">
            {impacted.map(({ v, unmet, pct }) => {
              const badgeBg =
                v.id === 'EV-3'
                  ? '#F5AD16'
                  : v.id === 'EV-5'
                  ? '#06B6D4'
                  : v.id === 'EV-2'
                  ? '#4163F5'
                  : '#E83D62';

              return (
                <div
                  key={v.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-white text-[10px] font-black px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: badgeBg }}
                    >
                      {v.id}
                    </span>
                    <span className="font-black text-[#111827]">{v.name || v.model}</span>
                    <span className="bg-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                      {v.due <= 1 ? 'Urgent' : 'Normal'}
                    </span>
                  </div>

                  <span className="font-black font-mono text-[#E83D62]">
                    -{unmet.toFixed(1)} kWh ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
