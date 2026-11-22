import React, { useState, useMemo } from 'react';
import {
  X,
  Car,
  AlertCircle,
  Plus,
  Clock,
  Zap,
  BatteryCharging,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { runScheduler, demand, clock } from '../../engine/microgridEngine';

export default function AddVehicleModal({
  isOpen,
  onClose,
  onAddVehicle,
  currentVehicles = [],
  simulationOptions = {},
  mode = 'smart',
}) {
  const [model, setModel] = useState('Tata Tiago EV');
  const [inputMode, setInputMode] = useState('direct_kwh'); // 'direct_kwh' | 'battery_soc'
  const [energyReq, setEnergyReq] = useState(8.0);
  const [battery, setBattery] = useState(24);
  const [soc, setSoc] = useState(30);
  const [target, setTarget] = useState(80);
  const [arrival, setArrival] = useState(0.0);
  const [due, setDue] = useState(2.0);
  const [maxKw, setMaxKw] = useState(7.0);
  const [error, setError] = useState('');

  // Quick Model Presets
  const handleSelectPreset = (pName, pBat, pKw) => {
    setModel(pName);
    setBattery(pBat);
    setMaxKw(pKw);
    setError('');
  };

  const candidateVehicle = useMemo(() => {
    const calculatedReq =
      inputMode === 'direct_kwh'
        ? Number(energyReq) || 8.0
        : Math.max(0, ((Number(target) - Number(soc)) * Number(battery)) / 100);

    return {
      id: `EV-${(currentVehicles?.length || 6) + 1}`,
      name: model.trim() || 'New EV',
      battery: Number(battery) || 40,
      soc: Number(soc) || 20,
      target: Number(target) || 80,
      energyReq: calculatedReq,
      arrival: Number(arrival) || 0,
      due: Number(due) || 2.0,
      maxKw: Number(maxKw) || 7.0,
    };
  }, [model, energyReq, arrival, due, maxKw, battery, soc, target, inputMode, currentVehicles]);

  // Live Feasibility Calculation via existing scheduling engine
  const evaluation = useMemo(() => {
    if (!currentVehicles || !simulationOptions) return null;

    if (candidateVehicle.due <= candidateVehicle.arrival) {
      return {
        isInvalid: true,
        error: 'Departure deadline must strictly exceed arrival time.',
      };
    }

    const testFleet = [...currentVehicles, candidateVehicle];
    const simResult = runScheduler(testFleet, simulationOptions, mode || 'smart');
    const candIdx = testFleet.length - 1;

    const reqEnergy = demand(candidateVehicle);
    const delivered = simResult.delivered[candIdx];
    const unmet = simResult.remaining[candIdx];
    const isOnTime = unmet < 0.0001;
    const pctDelivered =
      reqEnergy > 0 ? Math.min(100, Math.round((delivered / reqEnergy) * 100)) : 100;

    const assignedSlots = simResult.slots
      .filter((s) => s.bays.some((b) => b?.i === candIdx))
      .map((s) => {
        const bay = s.bays.find((b) => b?.i === candIdx);
        return {
          time: s.time,
          power: bay?.power || bay?.kw || 0,
        };
      });

    let reason = null;
    if (!isOnTime) {
      const durationHours = candidateVehicle.due - candidateVehicle.arrival;
      const maxChargerPhysicalKwh = durationHours * Math.min(7, candidateVehicle.maxKw || 7);
      if (reqEnergy > maxChargerPhysicalKwh) {
        reason = `Physical charger constraint: Delivering ${reqEnergy.toFixed(1)} kWh requires at least ${(reqEnergy / Math.min(7, candidateVehicle.maxKw || 7)).toFixed(1)}h at ${(candidateVehicle.maxKw || 7).toFixed(1)} kW max charging speed, but the simulated parking window is only ${durationHours.toFixed(1)}h.`;
      } else {
        const activeCap = simulationOptions.capacity || 14;
        reason = `Grid capacity contention: Under the simulated ${activeCap.toFixed(1)} kW transformer cap, higher-urgency fleet vehicles with tighter deadlines were prioritized for bay allocations.`;
      }
    }

    const departureClock = clock(Math.round(candidateVehicle.due * 2));
    const summary = isOnTime
      ? `Under the current simulated grid capacity (${simulationOptions.capacity || 14} kW), this EV is projected to receive all ${reqEnergy.toFixed(1)} kWh before departure at ${departureClock}.`
      : `Under the current simulated grid capacity (${simulationOptions.capacity || 14} kW), this EV is projected to receive ${delivered.toFixed(1)} of its requested ${reqEnergy.toFixed(1)} kWh before departure at ${departureClock} (${pctDelivered}% delivered).`;

    return {
      isInvalid: false,
      reqEnergy,
      delivered,
      unmet,
      isOnTime,
      pctDelivered,
      assignedSlots,
      reason,
      summary,
    };
  }, [candidateVehicle, currentVehicles, simulationOptions, mode]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!model.trim()) {
      setError('Please provide a vehicle model or name.');
      return;
    }
    if (Number(due) <= Number(arrival)) {
      setError('Departure deadline must strictly exceed arrival time.');
      return;
    }
    if (candidateVehicle.energyReq <= 0) {
      setError('Required energy must strictly be greater than 0 kWh.');
      return;
    }

    onAddVehicle(candidateVehicle);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl rounded-3xl bg-white border-2 border-[#111827] p-6 shadow-[8px_8px_0px_#111827] space-y-4 my-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#55BD8D] border-2 border-[#111827] flex items-center justify-center text-white shadow-[2px_2px_0px_#111827]">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#111827]">
                Add Vehicle & Feasibility Advisor
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Live feasibility evaluation under active microgrid constraints
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-200 hover:border-[#111827] text-slate-500 hover:text-[#111827] hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border-2 border-[#E83D62] text-[#E83D62] text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
            Popular Indian EV Presets:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { name: 'Tata Tiago EV', bat: 24, kw: 3.3 },
              { name: 'MG Comet EV', bat: 17.3, kw: 3.3 },
              { name: 'Tata Punch EV', bat: 35, kw: 7.2 },
              { name: 'BYD Atto 3', bat: 60, kw: 7.0 },
              { name: 'Mahindra XUV400', bat: 39.4, kw: 7.2 },
            ].map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p.name, p.bat, p.kw)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                  model === p.name
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:border-[#111827]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Row 1: Vehicle Name & Max Power */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[#111827] font-black block mb-1">
                Vehicle Name / Identifier
              </label>
              <input
                type="text"
                required
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Tata Punch EV, Fleet #7"
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] font-bold text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[#111827] font-black block mb-1">
                Max Onboard Charger Speed (kW)
              </label>
              <select
                value={maxKw}
                onChange={(e) => setMaxKw(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] font-bold text-xs"
              >
                <option value={3.3}>3.3 kW (Slow AC / 2W / Small EV)</option>
                <option value={7.0}>7.0 kW (Standard Fast AC Bay)</option>
                <option value={11.0}>11.0 kW (Dual-Charger Capable)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Input Mode Switch & Energy Required */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border-2 border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-[#111827] text-xs">
                Charging Demand Input Mode:
              </span>
              <div className="flex items-center gap-1 bg-white border border-[#111827] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setInputMode('direct_kwh')}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition-all ${
                    inputMode === 'direct_kwh'
                      ? 'bg-[#4163F5] text-white'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Direct Energy (kWh)
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('battery_soc')}
                  className={`px-2.5 py-1 rounded text-[10px] font-black transition-all ${
                    inputMode === 'battery_soc'
                      ? 'bg-[#4163F5] text-white'
                      : 'text-slate-600 hover:text-black'
                  }`}
                >
                  Battery Pack & SoC (%)
                </button>
              </div>
            </div>

            {inputMode === 'direct_kwh' ? (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-slate-600 font-bold block mb-1 text-[11px]">
                    Energy Required to Deliver (kWh)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="0.5"
                    required
                    value={energyReq}
                    onChange={(e) => setEnergyReq(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white border-2 border-[#111827] text-[#111827] font-mono font-bold text-sm"
                  />
                </div>
                <div className="pt-4 text-xs font-bold text-slate-500">
                  ≈ {(energyReq / 0.15).toFixed(0)} km highway range
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-600 font-bold block mb-1 text-[10px]">
                    Battery (kWh)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    step="1"
                    value={battery}
                    onChange={(e) => setBattery(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#111827] text-[#111827] font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1 text-[10px]">
                    Arrival SoC (%)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="80"
                    step="5"
                    value={soc}
                    onChange={(e) => setSoc(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#111827] text-[#111827] font-mono font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1 text-[10px]">
                    Target SoC (%)
                  </label>
                  <input
                    type="number"
                    min="20"
                    max="100"
                    step="5"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#111827] text-[#111827] font-mono font-bold text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Arrival Time & Departure Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#111827] font-black block mb-1">
                Arrival Slot
              </label>
              <select
                value={arrival}
                onChange={(e) => setArrival(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] font-mono font-bold text-xs"
              >
                <option value={0.0}>10:00 (Immediate)</option>
                <option value={0.5}>10:30 (+30 min)</option>
                <option value={1.0}>11:00 (+1.0 hour)</option>
                <option value={1.5}>11:30 (+1.5 hours)</option>
                <option value={2.0}>12:00 (+2.0 hours)</option>
              </select>
            </div>

            <div>
              <label className="text-[#111827] font-black block mb-1">
                Departure Deadline
              </label>
              <select
                value={due}
                onChange={(e) => setDue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-[#F8FAFC] border-2 border-[#111827] text-[#111827] font-mono font-bold text-xs"
              >
                <option value={0.5}>10:30 (Urgent 30-min window)</option>
                <option value={1.0}>11:00 (1 hour window)</option>
                <option value={1.5}>11:30 (1.5 hour window)</option>
                <option value={2.0}>12:00 (2 hour window)</option>
                <option value={2.5}>12:30 (2.5 hour window)</option>
                <option value={3.0}>13:00 (3 hour window)</option>
                <option value={4.0}>14:00 (4 hour window)</option>
                <option value={5.0}>15:00 (End of day)</option>
              </select>
            </div>
          </div>

          {/* FEATURE 2: LIVE CHARGING DEADLINE FEASIBILITY ADVISOR CARD */}
          {evaluation && !evaluation.isInvalid && (
            <div
              className={`p-4 rounded-2xl border-2 transition-all space-y-2.5 ${
                evaluation.isOnTime
                  ? 'bg-emerald-50/70 border-[#55BD8D] text-emerald-950'
                  : 'bg-amber-50/80 border-[#F5AD16] text-amber-950'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  {evaluation.isOnTime ? (
                    <CheckCircle2 className="w-4 h-4 text-[#55BD8D]" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-[#F5AD16]" />
                  )}
                  <span className="uppercase tracking-wider text-[11px]">
                    Charging Deadline Feasibility Advisor
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider text-white ${
                    evaluation.isOnTime ? 'bg-[#55BD8D]' : 'bg-[#F5AD16]'
                  }`}
                >
                  {evaluation.isOnTime ? 'Feasible (100% on-time)' : 'Shortfall Detected'}
                </span>
              </div>

              {/* Understandable Human Summary */}
              <p className="text-xs font-bold leading-relaxed">
                {evaluation.summary}
              </p>

              {/* Assigned intervals preview */}
              {evaluation.assignedSlots.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                  <span className="font-bold text-slate-600">Projected Charging Intervals:</span>
                  {evaluation.assignedSlots.map((as, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-slate-300 font-mono font-bold text-slate-800"
                    >
                      {as.time} ({as.power.toFixed(1)} kW)
                    </span>
                  ))}
                </div>
              )}

              {/* Detailed Reason if shortfall exists */}
              {evaluation.reason && (
                <div className="p-2.5 rounded-xl bg-white/80 border border-amber-300 text-[11px] text-amber-900 leading-relaxed font-medium">
                  <strong>Root Cause:</strong> {evaluation.reason}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-1 flex items-center gap-1 font-medium">
                <Info className="w-3 h-3 shrink-0" />
                <span>
                  Simulated projection under current microgrid parameters. Does not guarantee physical charging in the real world.
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-2 border-[#111827] bg-white text-[#111827] font-black shadow-[2px_2px_0px_#111827] hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl border-2 border-[#111827] bg-[#55BD8D] hover:bg-[#48a97c] text-white font-black shadow-[2px_2px_0px_#111827] flex items-center gap-1.5 transition-transform active:translate-y-0.5"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add to Fleet Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
