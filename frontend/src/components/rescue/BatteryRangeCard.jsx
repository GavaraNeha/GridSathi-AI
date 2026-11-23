import React, { useState } from 'react';
import {
  Gauge,
  Zap,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  Thermometer,
  Wind,
  Mountain,
} from 'lucide-react';
import { calcUsableEnergy, calcEstimatedRange } from '../../engine/journeyEngine';

export default function BatteryRangeCard({
  batteryKwh,
  currentSoc,
  reserveSoc,
  consumptionWhPerKm,
  safetyBufferPct,
  onChangeSafetyBuffer,
}) {
  const [showAssumptions, setShowAssumptions] = useState(false);

  const usableEnergy = calcUsableEnergy(batteryKwh, currentSoc, reserveSoc);
  const totalPackEnergy = Math.round(((batteryKwh * currentSoc) / 100) * 10) / 10;
  const reserveEnergy = Math.round(((batteryKwh * reserveSoc) / 100) * 10) / 10;

  const range = calcEstimatedRange(usableEnergy, consumptionWhPerKm, safetyBufferPct);

  const isCriticalLow = currentSoc <= reserveSoc;
  const isWarningLow = currentSoc > reserveSoc && (currentSoc <= 20 || range.conservativeRangeKm < 30);

  return (
    <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#111827]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-primary-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-400 border-2 border-primary-950 flex items-center justify-center font-black">
            <Gauge className="w-4 h-4 text-primary-950" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-primary-950 uppercase tracking-tight">
              Battery Range Estimator
            </h2>
            <p className="text-[10px] text-primary-700 font-bold">Reserve-Adjusted Usable Range</p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary-950 bg-blue-100 text-blue-950">
          {range.kmPerKwh} km/kWh
        </span>
      </div>

      {/* Critical Battery Alerts */}
      {isCriticalLow && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-100 border-2 border-rose-600 text-rose-950 text-xs font-bold flex items-start gap-2 shadow-[2px_2px_0px_#e11d48]">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-black uppercase text-[11px] tracking-wide text-rose-900">
              🚨 Critical: Battery Below Safety Reserve ({currentSoc}% ≤ {reserveSoc}%)
            </div>
            <p className="text-[10.5px] font-medium leading-tight text-rose-800 mt-0.5">
              Usable energy is exhausted! Locate the nearest available charger immediately to avoid
              roadside stranding.
            </p>
          </div>
        </div>
      )}

      {isWarningLow && (
        <div className="mb-3 p-2.5 rounded-xl bg-amber-100 border-2 border-amber-600 text-amber-950 text-xs font-bold flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <div className="font-black uppercase text-[11px] tracking-wide text-amber-900">
              ⚠️ Low Battery Warning ({currentSoc}% SOC)
            </div>
            <p className="text-[10.5px] font-medium leading-tight text-amber-800 mt-0.5">
              Conservative range is down to {range.conservativeRangeKm} km. Prioritize verified fast
              chargers along your route.
            </p>
          </div>
        </div>
      )}

      {/* Main Range Readouts */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        {/* Conservative Range */}
        <div className="bg-emerald-50 border-2 border-primary-950 rounded-xl p-3 shadow-[2px_2px_0px_#111827]">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900 block mb-0.5">
            Conservative Safe Range
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-950">
              {range.conservativeRangeKm}
            </span>
            <span className="text-xs font-black text-emerald-800">km</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 block mt-0.5">
            Includes {safetyBufferPct}% weather & traffic margin
          </span>
        </div>

        {/* Nominal Range */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-3 shadow-[2px_2px_0px_#111827]">
          <span className="text-[10px] font-black uppercase tracking-wider text-primary-700 block mb-0.5">
            Nominal Range
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-primary-950">
              {range.nominalRangeKm}
            </span>
            <span className="text-xs font-black text-primary-800">km</span>
          </div>
          <span className="text-[10px] font-bold text-primary-600 block mt-0.5">
            Theoretical ceiling (0% margin)
          </span>
        </div>
      </div>

      {/* Usable Energy Breakdown Table */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5 mb-3 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-gray-200">
          <span className="text-[11px] font-bold text-primary-700">Total Pack Energy in Vehicle:</span>
          <span className="font-mono font-black text-primary-950">{totalPackEnergy} kWh</span>
        </div>
        <div className="flex justify-between items-center py-1 border-b border-gray-200">
          <span className="text-[11px] font-bold text-blue-700">
            Protected Reserve ({reserveSoc}%):
          </span>
          <span className="font-mono font-bold text-blue-900">-{reserveEnergy} kWh</span>
        </div>
        <div className="flex justify-between items-center py-1 pt-1.5 font-black text-emerald-900">
          <span className="text-[11px] uppercase tracking-wide">Usable Rescue Energy:</span>
          <span className="font-mono text-sm">{usableEnergy} kWh</span>
        </div>
      </div>

      {/* Safety Buffer Slider */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5 mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10.5px] font-black uppercase text-primary-900">
            Weather & Elevation Buffer
          </label>
          <span className="text-xs font-mono font-black text-blue-700">{safetyBufferPct}%</span>
        </div>
        <input
          type="range"
          min="5"
          max="35"
          step="5"
          value={safetyBufferPct}
          onChange={(e) => onChangeSafetyBuffer(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
        />
        <div className="flex justify-between text-[9px] font-bold text-primary-500 mt-0.5">
          <span>5% City / Mild</span>
          <span>15% Standard</span>
          <span>35% Highway / Heavy AC</span>
        </div>
      </div>

      {/* Assumptions & Uncertainty Accordion */}
      <div className="border border-primary-950 rounded-xl bg-cream-50 overflow-hidden">
        <button
          onClick={() => setShowAssumptions(!showAssumptions)}
          className="w-full flex items-center justify-between p-2 text-[10.5px] font-black text-primary-900 hover:bg-cream-100 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary-700" />
            Model Assumptions & Driving Factors
          </span>
          {showAssumptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showAssumptions && (
          <div className="p-2.5 pt-0 text-[10px] text-primary-800 space-y-1.5 border-t border-gray-300">
            <div className="flex items-start gap-1.5">
              <Thermometer className="w-3 h-3 text-rose-600 shrink-0 mt-0.5" />
              <span>
                <strong>Cabin AC / Climate:</strong> High AC in 40°C Indian summers increases
                consumption by 15-20%.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Mountain className="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
              <span>
                <strong>Elevation & Incline:</strong> Uphill climbs consume ~3× more energy per km
                than level highway cruising.
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <Wind className="w-3 h-3 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Speed & Aerodynamics:</strong> Driving at 100 km/h consumes ~28% more
                battery than driving at 65 km/h.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
