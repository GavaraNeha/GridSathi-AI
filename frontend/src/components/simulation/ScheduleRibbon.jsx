import React from 'react';
import { Flag } from 'lucide-react';

export default function ScheduleRibbon({ result, vehicles, colors, disruptionDiff }) {
  const slots = result?.slots || [];
  const tariffs = [6.5, 6.5, 5.0, 5.0, 4.5, 4.5, 5.0, 6.0, 7.5, 8.5];
  const baselineSlots = disruptionDiff?.baselineResult?.slots || [];

  // Helper to check if a vehicle departs in this slot
  const isVehicleDeadline = (carIndex, slotIndex) => {
    const v = vehicles?.[carIndex];
    if (!v) return false;
    const deadlineSlot = Math.round(v.due * 2);
    return deadlineSlot === slotIndex;
  };

  const getVehicleColor = (carIndex) => {
    if (typeof colors === 'function') return colors(carIndex);
    if (Array.isArray(colors) && colors.length > 0) return colors[carIndex % colors.length];
    const palette = ['#E83D62', '#4163F5', '#F5AD16', '#55BD8D', '#06B6D4', '#8B5CF6', '#EC4899'];
    return palette[carIndex % palette.length];
  };

  return (
    <div className="bg-white border-2 border-[#111827] rounded-2xl shadow-[3px_3px_0px_#111827] p-3.5 sm:p-4 space-y-3">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm sm:text-base font-black text-[#111827]">
            Multi-Track Charging Ribbon & Departure Flags
          </h3>
          <p className="text-xs text-[#64748B]">
            Color-coded 30-min power capsules across Chargers 1–3 with red departure deadline markers.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto shrink-0">
          {disruptionDiff && (
            <div className="bg-[#FEF3C7] text-[#B45309] border border-[#F5AD16] rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5AD16] animate-pulse" />
              <span>Shifted Allocation</span>
            </div>
          )}
          <div className="bg-[#FFE4E6] text-[#E83D62] border border-[#E83D62]/40 rounded-full px-2.5 py-0.5 text-xs font-bold flex items-center gap-1">
            <Flag className="w-3 h-3 fill-[#E83D62]" />
            <span>Red Flag = Departure Deadline</span>
          </div>
        </div>
      </div>

      {/* Ribbon Matrix Table */}
      <div className="overflow-x-auto pb-1.5">
        <div className="min-w-[700px] space-y-1.5">
          {/* Header Row: Charger & Slots */}
          <div className="grid grid-cols-[100px_repeat(10,1fr)] gap-2 items-center">
            {/* Charger Label Pill */}
            <div className="bg-[#111827] text-white font-black text-[11px] py-1.5 px-3 rounded-full text-center">
              CHARGER
            </div>

            {/* 10 Time Slots */}
            {slots.map((s, idx) => (
              <div
                key={s.time || idx}
                className="bg-white border border-[#111827] rounded-xl py-1 px-1.5 text-center shadow-[1px_1px_0px_#111827]"
              >
                <div className="text-[11px] font-black font-mono text-[#111827]">
                  {s.time}
                </div>
                <div className="text-[9px] font-bold text-slate-500 font-mono">
                  ₹{tariffs[idx] || 5}
                </div>
              </div>
            ))}
          </div>

          {/* 3 Charger Bay Rows */}
          {[0, 1, 2].map((bayIdx) => {
            const isFault = bayIdx >= (result?.maxBays ?? 3);

            return (
              <div
                key={bayIdx}
                className="grid grid-cols-[100px_repeat(10,1fr)] gap-2 items-center"
              >
                {/* Bay Header Card */}
                <div className="bg-white border-2 border-[#111827] rounded-xl p-2 text-center shadow-[2px_2px_0px_#111827]">
                  <div className="text-xs font-black text-[#111827]">
                    Bay 0{bayIdx + 1}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 font-mono">
                    7.0 kW
                  </div>
                </div>

                {/* Slot Cells */}
                {slots.map((s, slotIdx) => {
                  if (isFault) {
                    return (
                      <div
                        key={slotIdx}
                        className="bg-red-50/60 border border-red-300 rounded-lg h-9 flex items-center justify-center text-[9px] font-black text-red-500"
                        title="Bay offline due to hardware fault"
                      >
                        OFFLINE
                      </div>
                    );
                  }

                  const assignment = s.bays?.[bayIdx];
                  const kw = assignment?.kw ?? assignment?.power ?? 0;
                  const carIndex = assignment?.carIndex ?? assignment?.i;

                  if (!assignment || kw <= 0.001 || carIndex === undefined) {
                    return (
                      <div
                        key={slotIdx}
                        className="bg-[#F8FAFC] border border-slate-200 rounded-lg h-9 flex items-center justify-center text-xs font-mono text-slate-400"
                      >
                        --
                      </div>
                    );
                  }

                  const car = vehicles[carIndex];
                  const hasDeadlineFlag = isVehicleDeadline(carIndex, slotIdx);
                  const carBg = getVehicleColor(carIndex);

                  const baseAssign = baselineSlots[slotIdx]?.bays?.[bayIdx];
                  const isShifted = Boolean(
                    disruptionDiff &&
                    (baseAssign?.id !== assignment?.id ||
                      Math.abs((baseAssign?.kw || 0) - kw) > 0.05)
                  );

                  return (
                    <div
                      key={slotIdx}
                      className={`rounded-lg h-9 p-0.5 flex flex-col justify-center items-center text-center text-white relative shadow-xs border ${
                        isShifted ? 'ring-2 ring-[#F5AD16] border-white' : 'border-black/20'
                      }`}
                      style={{ backgroundColor: carBg }}
                      title={`${car?.id || 'EV'} receiving ${kw.toFixed(1)} kW${
                        isShifted ? ' (Allocation shifted from baseline by active disruption)' : ''
                      }`}
                    >
                      {isShifted && (
                        <div
                          className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-[#F5AD16] border border-[#111827] shadow-xs"
                          title="Allocation shifted by active disruption"
                        />
                      )}
                      <div className="text-[10px] font-black leading-tight truncate w-full">
                        {car?.id || 'EV'}
                      </div>
                      <div className="text-[9px] font-bold font-mono leading-tight opacity-90">
                        {kw.toFixed(1)}kW
                      </div>

                      {/* Red Departure Deadline Flag */}
                      {hasDeadlineFlag && (
                        <div
                          className="absolute -top-1.5 -right-1 bg-white border border-[#E83D62] rounded-full p-0.5 shadow-sm"
                          title="Departure Deadline"
                        >
                          <Flag className="w-2.5 h-2.5 fill-[#E83D62] text-[#E83D62]" />
                        </div>
                      )}
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
