import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function LoadProfileChart({ result, vehicles, colors }) {
  const slots = result?.slots || [];
  const maxScale = 24; // 24 kW max scale height
  const chartHeightPx = 160;

  const getVehicleColor = (carIndex) => {
    if (typeof colors === 'function') return colors(carIndex);
    if (Array.isArray(colors) && colors.length > 0) return colors[carIndex % colors.length];
    const palette = ['#E83D62', '#4163F5', '#F5AD16', '#55BD8D', '#06B6D4', '#8B5CF6', '#EC4899'];
    return palette[carIndex % palette.length];
  };

  return (
    <div className="bg-white border-2 border-[#111827] rounded-2xl shadow-[3px_3px_0px_#111827] p-3.5 sm:p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-black text-[#111827] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#4163F5]" />
            <span>Site Power Load Curve & Grid Capacity Ceiling</span>
          </h3>
          <p className="text-xs text-[#64748B]">
            30-minute interval aggregate power dispatch vs transformer and solar capacity
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#F5AD16] block"></span>
            <span className="text-slate-600 font-bold text-[11px]">Site Limit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#4163F5] block"></span>
            <span className="text-slate-600 font-bold text-[11px]">EV Power Draw</span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative pt-6 pb-2 px-2 overflow-x-auto">
        <div className="min-w-[640px] flex items-end justify-between gap-3 h-[160px] border-b-2 border-[#111827] relative">
          {slots.map((s, idx) => {
            const loadHeight = (s.load / maxScale) * chartHeightPx;
            const limitHeight = (s.limit / maxScale) * chartHeightPx;

            return (
              <div
                key={s.time || idx}
                className="flex-1 flex flex-col items-center justify-end h-full relative group"
              >
                {/* Capacity line tick */}
                <div
                  className="absolute w-full border-t-2 border-dashed border-[#F5AD16] z-20 pointer-events-none"
                  style={{ bottom: `${limitHeight}px` }}
                  title={`Site limit: ${s.limit.toFixed(1)} kW`}
                />

                {/* Stacked EV segments */}
                <div
                  className="w-full max-w-[42px] rounded-t-lg overflow-hidden flex flex-col-reverse justify-start border-2 border-b-0 border-[#111827] z-10 transition-all group-hover:brightness-105"
                  style={{ height: `${loadHeight}px` }}
                >
                  {s.bays.filter(Boolean).map((a, bIdx) => {
                    const kw = a.kw ?? a.power ?? 0;
                    const carIndex = a.carIndex ?? a.i;
                    const segmentHeight = s.load > 0 ? (kw / s.load) * 100 : 0;
                    const color = getVehicleColor(carIndex);

                    return (
                      <div
                        key={bIdx}
                        style={{
                          height: `${segmentHeight}%`,
                          backgroundColor: color,
                        }}
                        className="w-full relative transition-all"
                        title={`Bay ${bIdx + 1}: ${kw.toFixed(1)} kW`}
                      />
                    );
                  })}
                </div>

                {/* Time label under column */}
                <div className="text-center mt-2">
                  <span className="text-[11px] font-mono text-[#111827] block font-black">
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

      {/* Footnote */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-mono">
        <span>Site Limit: {result?.slots?.[0]?.limit || 14} kW</span>
        <span>Peak Observed: {result?.peak?.toFixed(1) || 14.0} kW</span>
        <span>Modeled Total Cost: ₹{Math.round(result?.cost || 263)}</span>
      </div>
    </div>
  );
}
