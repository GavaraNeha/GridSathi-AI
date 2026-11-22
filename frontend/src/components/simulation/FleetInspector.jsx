import React from 'react';
import { Plus, BatteryCharging, Clock, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function FleetInspector({
  vehicles,
  selectedVehicleIndex,
  onSelectVehicle,
  result,
  demand,
  clock,
  colors,
  onOpenAddModal,
}) {
  const getColor = (idx) => {
    if (typeof colors === 'function') return colors(idx);
    if (Array.isArray(colors) && colors.length > 0) return colors[idx % colors.length];
    const palette = ['#E83D62', '#4163F5', '#F5AD16', '#55BD8D', '#06B6D4', '#8B5CF6', '#EC4899'];
    return palette[idx % palette.length];
  };

  const currentIdx = selectedVehicleIndex ?? 0;
  const currentVehicle = vehicles[currentIdx] || vehicles[0];
  const delivered = currentVehicle ? (result.delivered?.[currentIdx] || 0) : 0;
  const need = currentVehicle ? demand(currentVehicle) : 0;
  const unmet = Math.max(0, need - delivered);
  const onTime = unmet <= 0.001;

  // Map slot index to clock string
  const formatSlot = (slotIdx) => {
    const totalMinutes = 600 + slotIdx * 30;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-sm sm:text-base font-black tracking-wider uppercase text-[#111827]">
          CONNECTED FLEET ({vehicles.length} VEHICLES) — CLICK TO INSPECT
        </h3>

        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="bg-[#55BD8D] hover:bg-[#46a87b] text-white text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-[#111827] shadow-[2px_2px_0px_#111827] flex items-center gap-1.5 self-start sm:self-auto transition-transform active:translate-y-0.5"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add EV</span>
          </button>
        )}
      </div>

      {/* 6 Responsive Fleet Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {vehicles.map((v, idx) => {
          const isSelected = idx === currentIdx;
          const carColor = getColor(idx);
          const carDelivered = result.delivered?.[idx] || 0;
          const carNeed = demand(v);
          const carUnmet = Math.max(0, carNeed - carDelivered);
          const isDone = carUnmet <= 0.001;
          const isUrgent = v.due <= 1;

          return (
            <div
              key={v.id || idx}
              onClick={() => onSelectVehicle(idx)}
              className={`bg-white border-2 rounded-2xl p-3 shadow-[3px_3px_0px_#111827] cursor-pointer transition-all hover:-translate-y-0.5 ${
                isSelected
                  ? 'border-[#4163F5] ring-2 ring-[#4163F5] bg-blue-50/30'
                  : 'border-[#111827]'
              }`}
            >
              {/* ID & Status Pill */}
              <div className="flex items-center justify-between">
                <span
                  className="text-white text-[10px] font-black px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: carColor }}
                >
                  {v.id}
                </span>

                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-800'
                      : isUrgent
                      ? 'bg-red-100 text-[#E83D62]'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {isDone ? 'Ready' : isUrgent ? 'Urgent' : 'Normal'}
                </span>
              </div>

              {/* Model */}
              <div className="text-xs font-black text-[#111827] truncate mt-2">
                {v.name || v.model}
              </div>

              {/* Battery Bar & SoC */}
              <div className="mt-2 space-y-1">
                <div className="w-full bg-slate-100 border border-[#111827] rounded-full h-2 relative overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${v.soc}%`,
                      backgroundColor: carColor,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-500 font-bold">{v.soc}% SoC</span>
                  <span className="text-slate-700 font-bold">🎯 {v.target}%</span>
                </div>
              </div>

              {/* Departure Badge */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-400">Deadline</span>
                <span className="text-[#111827] font-mono">Due {clock(v.due)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Vehicle Detailed Inspection Card */}
      {currentVehicle && (
        <div className="bg-white border-2 border-[#111827] rounded-2xl p-4 sm:p-5 shadow-[4px_4px_0px_#111827] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span
                className="text-white text-xs font-black px-3 py-1 rounded-lg"
                style={{ backgroundColor: getColor(currentIdx) }}
              >
                {currentVehicle.id}
              </span>
              <div>
                <h4 className="text-sm sm:text-base font-black text-[#111827]">
                  {currentVehicle.name || currentVehicle.model}
                </h4>
                <p className="text-xs text-[#64748B]">
                  Arrived 10:00 · Departure Deadline: {clock(currentVehicle.due)} ({currentVehicle.due}h stay)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onTime ? (
                <span className="bg-[#55BD8D] text-white text-xs font-black px-3 py-1 rounded-xl border border-[#111827] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>On-Time Target Met</span>
                </span>
              ) : (
                <span className="bg-[#E83D62] text-white text-xs font-black px-3 py-1 rounded-xl border border-[#111827] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Shortfall: -{unmet.toFixed(1)} kWh</span>
                </span>
              )}
            </div>
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#F8FAFC] border border-[#111827] rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Battery Capacity</span>
              <span className="text-sm font-black font-mono text-[#111827]">
                {currentVehicle.battery || currentVehicle.capacity} kWh
              </span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#111827] rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Energy Requested</span>
              <span className="text-sm font-black font-mono text-[#111827]">{need.toFixed(1)} kWh</span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#111827] rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Energy Delivered</span>
              <span className="text-sm font-black font-mono text-[#55BD8D]">{delivered.toFixed(1)} kWh</span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#111827] rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Remaining Deficit</span>
              <span className="text-sm font-black font-mono text-[#E83D62]">{unmet.toFixed(1)} kWh</span>
            </div>
          </div>

          {/* Vehicle Feasibility Advisor Detail */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-500 text-[11px]">Allocated Slots:</span>
              {result?.allocations?.[currentIdx]
                ?.map((kw, slotIdx) => (kw > 0 ? { slot: slotIdx, kw } : null))
                .filter(Boolean)
                .map((a, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#4163F5] font-mono font-bold text-[10px]"
                  >
                    {result.slots[a.slot]?.time} ({a.kw.toFixed(1)} kW)
                  </span>
                ))}
              {(!result?.allocations?.[currentIdx] ||
                !result.allocations[currentIdx].some((kw) => kw > 0)) && (
                <span className="text-[11px] text-slate-400 italic">No charging slots allocated</span>
              )}
            </div>

            <div className="text-[11px] font-bold text-slate-600">
              {onTime ? (
                <span className="text-[#55BD8D]">
                  ✓ Feasible: Scheduled to reach {currentVehicle.target}% target by {clock(currentVehicle.due)}
                </span>
              ) : (
                <span className="text-[#E83D62]">
                  ⚠ Deficit: Shortfall of {unmet.toFixed(1)} kWh due to grid/bay capacity
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
