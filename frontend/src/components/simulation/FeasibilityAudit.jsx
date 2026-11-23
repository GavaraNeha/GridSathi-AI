import React from 'react';
import { Award, AlertTriangle, AlertCircle } from 'lucide-react';

export default function FeasibilityAudit({ result, vehicles, demand, mode }) {
  const isShortage = (result?.unmet ?? 0) > 0.001;
  const totalUnmet = Math.round(result?.unmet ?? 9);

  // 10:00–11:00 urgent vehicles check (due <= 1 hour)
  const urgentVehicles = vehicles.filter((v) => v.due <= 1);
  const urgentNeed = urgentVehicles.reduce((a, v) => a + demand(v), 0);
  const hourSupply = (result?.slots || [])
    .slice(0, 2)
    .reduce((a, s) => a + s.limit * 0.5, 0);

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
              ? `Physical Grid Bottleneck — ${totalUnmet} kWh Unavoidable Energy Deficit`
              : 'Zero Energy Deficit — All Fleet Demands Certified Feasible'}
          </h3>
        </div>
      </div>

      {/* Urgent Window Box */}
      <div className="bg-[#F8FAFC] border-2 border-[#111827] rounded-xl p-3">
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">
          10:00–11:00 URGENT WINDOW
        </span>
        <div className="text-sm sm:text-base font-black font-mono text-[#111827] mt-0.5">
          {urgentNeed.toFixed(0)} kWh Req vs. {hourSupply.toFixed(0)} kWh Max Supply
        </div>
      </div>

      {/* Why every request cannot be satisfied */}
      <div className="space-y-0.5 text-xs">
        <span className="font-black text-[#E83D62] uppercase tracking-wider text-[10px] block">
          WHY EVERY REQUEST CANNOT BE SIMULTANEOUSLY SATISFIED:
        </span>
        <p className="text-[#111827] font-medium leading-relaxed pl-1.5 text-xs">
          • 10:00–11:00 Urgent Window needs {urgentNeed.toFixed(1)} kWh, but physical supply is capped at {hourSupply.toFixed(1)} kWh (3 bays @ {result?.slots?.[0]?.limit || 14} kW limit).
        </p>
      </div>

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
