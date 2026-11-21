import React from 'react';
import { Calendar, Zap } from 'lucide-react';

export default function ScheduleRibbon({ result, vehicles, colors }) {
  const slots = result?.slots || [];

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>30-Minute Charger Bay Allocation Matrix</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          🚩 = Departure Deadline Slot
        </span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[720px] text-xs">
          {/* Header Row: Slots & Tariffs */}
          <div className="grid grid-cols-11 gap-1 pb-2 border-b border-slate-800 text-center font-mono">
            <div className="text-left font-bold text-slate-400 py-1 px-2">
              BAY / TARIFF
            </div>
            {slots.map((s) => (
              <div
                key={s.t}
                className="py-1 px-1 bg-slate-950/60 rounded border border-slate-800/80"
              >
                <b className="text-white block text-[11px]">{s.time}</b>
                <span className="text-[10px] text-amber-400">
                  ₹{s.tariff}/kWh
                </span>
              </div>
            ))}
          </div>

          {/* Bay Rows */}
          {[0, 1, 2].map((bayIndex) => {
            const isFault = bayIndex >= result.maxBays;

            return (
              <div
                key={bayIndex}
                className="grid grid-cols-11 gap-1 items-center py-1.5 border-b border-slate-800/50"
              >
                {/* Bay label */}
                <div className="text-left font-mono px-2">
                  <span className="font-bold text-slate-200 block">
                    Bay 0{bayIndex + 1}
                  </span>
                  <small className="text-[10px] text-slate-500">
                    {isFault ? 'OFFLINE' : '7 kW max'}
                  </small>
                </div>

                {/* 10 Slot Cells */}
                {slots.map((s) => {
                  if (isFault) {
                    return (
                      <div
                        key={s.t}
                        className="h-11 rounded bg-rose-950/20 border border-rose-900/30 flex items-center justify-center text-[10px] text-rose-500/60 font-mono"
                      >
                        FAULT
                      </div>
                    );
                  }

                  const assignment = s.bays[bayIndex];
                  if (!assignment) {
                    return (
                      <div
                        key={s.t}
                        className="h-11 rounded bg-slate-950/30 border border-slate-800/40 flex items-center justify-center text-[11px] text-slate-600 font-mono"
                      >
                        —
                      </div>
                    );
                  }

                  const vehicle = vehicles[assignment.i];
                  const color = colors[assignment.i % colors.length];
                  const isDeadline =
                    Math.round(vehicle.due * 2) === s.t + 1;

                  return (
                    <div
                      key={s.t}
                      className="h-11 rounded p-1 flex flex-col justify-center items-center text-center shadow-sm text-slate-950 font-bold font-mono transition-transform hover:scale-105"
                      style={{ backgroundColor: color }}
                      title={`${vehicle.name} (${assignment.power.toFixed(1)} kW)`}
                    >
                      <span className="text-[10px] leading-tight truncate w-full">
                        {assignment.id} {isDeadline ? '🚩' : ''}
                      </span>
                      <span className="text-[9px] opacity-90">
                        {assignment.power.toFixed(1)} kW
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
