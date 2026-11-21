import React from 'react';
import { BarChart3, Info } from 'lucide-react';

export default function LoadProfileChart({ result, vehicles, colors }) {
  const slots = result?.slots || [];
  const maxScale = 24; // 24 kW max scale height
  const chartHeightPx = 180;

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Site Power Load Curve & Grid Capacity Ceiling</span>
          </h3>
          <p className="text-xs text-slate-400">
            30-minute interval aggregate power dispatch vs transformer and solar capacity
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 block"></span>
            <span className="text-slate-400">Site Limit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 block"></span>
            <span className="text-slate-400">EV Power Draw</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2 px-2 overflow-x-auto">
        <div className="min-w-[640px] flex items-end justify-between gap-3 h-[180px] border-b border-slate-800 relative">
          {slots.map((s) => {
            // Calculate load height
            const loadHeight = (s.load / maxScale) * chartHeightPx;
            const limitHeight = (s.limit / maxScale) * chartHeightPx;

            return (
              <div
                key={s.t}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
              >
                {/* Capacity line tick */}
                <div
                  className="absolute w-full border-t-2 border-dashed border-amber-400/80 z-20 pointer-events-none"
                  style={{ bottom: `${limitHeight}px` }}
                  title={`Site limit: ${s.limit.toFixed(1)} kW`}
                />

                {/* Stacked EV segments */}
                <div
                  className="w-full max-w-[48px] rounded-t overflow-hidden flex flex-col-reverse justify-start shadow-lg z-10 transition-all group-hover:brightness-110"
                  style={{ height: `${loadHeight}px` }}
                >
                  {s.bays.filter(Boolean).map((a, bIdx) => {
                    const segmentHeight =
                      s.load > 0
                        ? (a.power / s.load) * 100
                        : 0;
                    const color = colors[a.i % colors.length];
                    const vehicle = vehicles[a.i];

                    return (
                      <div
                        key={bIdx}
                        style={{
                          height: `${segmentHeight}%`,
                          backgroundColor: color,
                        }}
                        className="w-full relative transition-all"
                        title={`${vehicle.name} (${a.id}): ${a.power.toFixed(1)} kW`}
                      />
                    );
                  })}
                </div>

                {/* Time label under column */}
                <div className="text-center mt-2">
                  <span className="text-[11px] font-mono text-slate-300 block font-semibold">
                    {s.time}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 block">
                    {s.load.toFixed(1)} kW
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solar & Grid Footnote */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60 font-mono">
        <span>Site Base Cap: {result.gridCap} kW</span>
        <span>Peak Observed Load: {result.peak.toFixed(1)} kW</span>
        <span>Modeled Total Cost: ₹{Math.round(result.cost)}</span>
        <span>Peak Headroom: {(result.gridCap + 4).toFixed(1)} kW</span>
      </div>
    </div>
  );
}
