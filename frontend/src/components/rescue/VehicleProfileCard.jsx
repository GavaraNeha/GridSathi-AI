import React from 'react';
import {
  Car,
  Zap,
  Battery,
  Shield,
  Gauge,
  Sliders,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { INDIAN_VEHICLE_PRESETS, CONNECTOR_TYPES } from '../../engine/journeyEngine';

export default function VehicleProfileCard({
  selectedPresetId,
  onSelectPreset,
  vehicle,
  onUpdateVehicle,
  currentSoc,
  onChangeSoc,
  reserveSoc,
  onChangeReserveSoc,
}) {
  const isCustom = selectedPresetId === 'custom';

  return (
    <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#111827]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b-2 border-primary-950">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-400 border-2 border-primary-950 flex items-center justify-center font-black">
            <Car className="w-4 h-4 text-primary-950" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-primary-950 uppercase tracking-tight">
              Connect My EV
            </h2>
            <p className="text-[10px] text-primary-700 font-bold">Manual Driver Configuration</p>
          </div>
        </div>

        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary-950 bg-amber-100 text-amber-900 flex items-center gap-1">
          <Sliders className="w-2.5 h-2.5" />
          Manual Input
        </span>
      </div>

      {/* Transparency Disclaimer */}
      <div className="mb-3 p-2 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[10.5px] leading-snug flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
        <span>
          <strong>User-Entered Values:</strong> Data is entered manually. GridSathi AI does not
          connect to manufacturer APIs or vehicle BMS telemetry.
        </span>
      </div>

      {/* Preset Selector */}
      <div className="space-y-2 mb-3">
        <label className="text-[11px] font-black uppercase text-primary-900 tracking-wider flex items-center justify-between">
          <span>Select EV Model Preset</span>
          <span className="text-[10px] font-bold text-primary-600">
            {vehicle.category === 'scooter' ? '2-Wheeler' : 'Electric Car'}
          </span>
        </label>

        <select
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full bg-white border-2 border-primary-950 rounded-xl px-2.5 py-1.5 text-xs font-bold text-primary-950 shadow-[2px_2px_0px_#111827] focus:outline-none focus:ring-2 focus:ring-accent-blue"
        >
          <optgroup label="Electric Cars (India)">
            {INDIAN_VEHICLE_PRESETS.filter((v) => v.category === 'car').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.battery} kWh, {p.defaultConnector})
              </option>
            ))}
          </optgroup>
          <optgroup label="Electric Scooters / 2-Wheelers">
            {INDIAN_VEHICLE_PRESETS.filter((v) => v.category === 'scooter').map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.battery} kWh, {p.defaultConnector})
              </option>
            ))}
          </optgroup>
          <option value="custom">⚙️ Custom EV Configuration...</option>
        </select>
      </div>

      {/* Live Battery SOC Slider */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-3 mb-3 shadow-[2px_2px_0px_#111827]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-black uppercase text-primary-900 flex items-center gap-1.5">
            <Battery className="w-3.5 h-3.5 text-emerald-600" />
            Current Battery SOC
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              max="100"
              value={currentSoc}
              onChange={(e) => onChangeSoc(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
              className="w-12 text-right bg-emerald-50 border border-primary-950 rounded px-1 text-xs font-black text-primary-950"
            />
            <span className="text-xs font-black text-primary-950">%</span>
          </div>
        </div>

        <input
          type="range"
          min="5"
          max="100"
          step="1"
          value={currentSoc}
          onChange={(e) => onChangeSoc(Number(e.target.value))}
          className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
        />

        <div className="flex justify-between text-[9px] font-bold text-primary-600 mt-1">
          <span className="text-rose-600">5% Critical</span>
          <span>50% Mid</span>
          <span className="text-emerald-700">100% Full</span>
        </div>
      </div>

      {/* Minimum Safety Reserve Slider */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-3 mb-3 shadow-[2px_2px_0px_#111827]">
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-black uppercase text-primary-900 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Safety Reserve Buffer
          </label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="40"
              value={reserveSoc}
              onChange={(e) => onChangeReserveSoc(Math.max(0, Math.min(40, Number(e.target.value) || 0)))}
              className="w-12 text-right bg-blue-50 border border-primary-950 rounded px-1 text-xs font-black text-primary-950"
            />
            <span className="text-xs font-black text-primary-950">%</span>
          </div>
        </div>

        <input
          type="range"
          min="5"
          max="35"
          step="1"
          value={reserveSoc}
          onChange={(e) => onChangeReserveSoc(Number(e.target.value))}
          className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
        />

        <div className="flex justify-between text-[9px] font-bold text-primary-600 mt-1">
          <span>5% Aggressive</span>
          <span className="font-black text-blue-800">15% Recommended</span>
          <span>35% Conservative</span>
        </div>
      </div>

      {/* Vehicle Specification Details (Editable if Custom) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Battery Capacity */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5">
          <span className="text-[10px] font-black uppercase text-primary-700 block mb-0.5">
            Battery Pack
          </span>
          {isCustom ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.5"
                min="1"
                max="150"
                value={vehicle.battery}
                onChange={(e) => onUpdateVehicle({ battery: Number(e.target.value) || 1 })}
                className="w-full bg-cream-50 border border-primary-950 rounded px-1.5 py-0.5 text-xs font-bold"
              />
              <span className="font-black text-[11px]">kWh</span>
            </div>
          ) : (
            <span className="font-black text-sm text-primary-950">{vehicle.battery} kWh</span>
          )}
        </div>

        {/* Efficiency */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5">
          <span className="text-[10px] font-black uppercase text-primary-700 block mb-0.5">
            Consumption
          </span>
          {isCustom ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="5"
                min="20"
                max="300"
                value={vehicle.consumptionWhPerKm}
                onChange={(e) => onUpdateVehicle({ consumptionWhPerKm: Number(e.target.value) || 100 })}
                className="w-full bg-cream-50 border border-primary-950 rounded px-1.5 py-0.5 text-xs font-bold"
              />
              <span className="font-black text-[10px]">Wh/km</span>
            </div>
          ) : (
            <span className="font-black text-sm text-primary-950">
              {vehicle.consumptionWhPerKm} Wh/km
            </span>
          )}
        </div>

        {/* Required Connector Inlet */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5 col-span-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-black uppercase text-primary-700">
              Vehicle Socket Inlet
            </span>
            <span className="text-[10px] font-bold text-primary-600">Max {vehicle.maxKw} kW</span>
          </div>

          <select
            value={vehicle.defaultConnector}
            onChange={(e) => onUpdateVehicle({ defaultConnector: e.target.value })}
            className="w-full bg-cream-50 border border-primary-950 rounded-lg px-2 py-1 text-xs font-black text-primary-950"
          >
            {CONNECTOR_TYPES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
