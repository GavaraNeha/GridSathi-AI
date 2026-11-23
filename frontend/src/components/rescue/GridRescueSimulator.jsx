import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  TrendingUp,
  Info,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { evaluateGridAwareRescue } from '../../engine/journeyEngine';

export default function GridRescueSimulator({
  selectedStation,
  vehicle,
  currentSoc,
  targetSoc,
  onChangeTargetSoc,
  deadlineHours,
  onChangeDeadlineHours,
  onOpenFullSimulator,
}) {
  const [stationTransformerCap, setStationTransformerCap] = useState(14); // kW

  // Compute the grid-aware outcome across Smart, EDF, and FCFS
  const outcome = useMemo(() => {
    if (!selectedStation || !vehicle) return null;
    return evaluateGridAwareRescue(
      selectedStation,
      vehicle,
      currentSoc,
      targetSoc,
      deadlineHours,
      { capacity: stationTransformerCap }
    );
  }, [selectedStation, vehicle, currentSoc, targetSoc, deadlineHours, stationTransformerCap]);

  if (!selectedStation) {
    return (
      <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-4 shadow-[3px_3px_0px_#111827] text-center py-8">
        <Cpu className="w-8 h-8 text-primary-400 mx-auto mb-2" />
        <h3 className="text-sm font-black text-primary-950 uppercase">No Station Selected</h3>
        <p className="text-xs text-primary-700 mt-1">
          Select any candidate station from the list above to simulate grid charging outcomes.
        </p>
      </div>
    );
  }

  const smart = outcome?.policies?.smart;
  const edf = outcome?.policies?.edf;
  const fcfs = outcome?.policies?.fcfs;

  return (
    <div className="bg-[#FAF8F5] border-2 border-primary-950 rounded-2xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#111827]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 mb-3 border-b-2 border-primary-950 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-yellow border-2 border-primary-950 flex items-center justify-center font-black">
            <Cpu className="w-4 h-4 text-primary-950" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-primary-950 uppercase tracking-tight">
              Grid-Aware Charging Outcome
            </h2>
            <p className="text-[10px] text-primary-700 font-bold">
              Simulated Microgrid Feasibility & Multi-Algorithm Audit
            </p>
          </div>
        </div>

        {/* Disclaimer Tag */}
        <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border border-primary-950 bg-amber-100 text-amber-950 self-start sm:self-auto">
          Simulated Model (Not Live IoT)
        </span>
      </div>

      {/* Selected Station Banner */}
      <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5 mb-3 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <span className="text-[9.5px] font-black uppercase text-primary-600 block">
            Target Microgrid Node
          </span>
          <span className="text-xs sm:text-sm font-black text-primary-950 truncate block">
            {selectedStation.name}
          </span>
          <span className="text-[10px] text-primary-700 font-bold">
            {selectedStation.operator || 'CPO'} • {selectedStation.capacity || '3-Bay Microgrid (14 kW Cap)'}
          </span>
        </div>

        <button
          onClick={() => onOpenFullSimulator(selectedStation, vehicle, targetSoc, deadlineHours)}
          className="px-2.5 py-1.5 bg-accent-blue text-white rounded-xl font-black text-xs uppercase border-2 border-primary-950 shadow-[2px_2px_0px_#111827] hover:bg-blue-700 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-1 shrink-0 ml-2"
        >
          <span>Open Full Sim</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Charging Parameter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
        {/* Target SOC Slider */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10.5px] font-black uppercase text-primary-900 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-600" />
              Target Charge SOC
            </label>
            <span className="text-xs font-mono font-black text-primary-950">{targetSoc}%</span>
          </div>
          <input
            type="range"
            min={Math.min(95, Math.max(currentSoc + 5, 40))}
            max="100"
            step="5"
            value={targetSoc}
            onChange={(e) => onChangeTargetSoc(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-2 bg-gray-200 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-bold text-primary-600 mt-1">
            <span>+{outcome?.requestedEnergyKwh} kWh needed</span>
            <span>Current: {currentSoc}%</span>
          </div>
        </div>

        {/* Departure Deadline Slider */}
        <div className="bg-white border-2 border-primary-950 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[10.5px] font-black uppercase text-primary-900 flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-600" />
              Stay Duration Deadline
            </label>
            <span className="text-xs font-mono font-black text-primary-950">
              {deadlineHours}h ({outcome?.departureClock})
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4.0"
            step="0.5"
            value={deadlineHours}
            onChange={(e) => onChangeDeadlineHours(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-gray-200 rounded-lg"
          />
          <div className="flex justify-between text-[9px] font-bold text-primary-600 mt-1">
            <span>30m Quick</span>
            <span>1.5h Standard</span>
            <span>4.0h Long Stop</span>
          </div>
        </div>
      </div>

      {/* Physical Hardware Feasibility Notice */}
      {outcome && !outcome.isPhysicallyFeasible && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border-2 border-rose-600 text-rose-950 text-xs font-bold flex items-start gap-2">
          <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-black uppercase text-[10.5px] block text-rose-900">
              Hardware Charger Limit Exceeded
            </span>
            <p className="text-[10px] font-medium leading-tight text-rose-800 mt-0.5">
              {outcome.physicalNotice}
            </p>
          </div>
        </div>
      )}

      {/* Three Algorithm Comparison Table */}
      <div className="bg-white border-2 border-primary-950 rounded-xl overflow-hidden mb-3">
        <div className="bg-cream-100 px-3 py-1.5 border-b-2 border-primary-950 flex items-center justify-between">
          <span className="text-[10.5px] font-black uppercase text-primary-950">
            Scheduling Policy Comparison (14 kW Microgrid)
          </span>
          <span className="text-[9.5px] font-bold text-primary-700">3 Background EVs in Queue</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 text-[10px] font-black uppercase text-primary-600">
                <th className="px-3 py-1.5">Policy</th>
                <th className="px-2 py-1.5">Delivered</th>
                <th className="px-2 py-1.5">Unmet</th>
                <th className="px-2 py-1.5 text-center">Deadline Met?</th>
                <th className="px-3 py-1.5 text-right">Fairness</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-bold">
              {/* Smart Slack Policy */}
              <tr className="bg-emerald-50/50">
                <td className="px-3 py-2">
                  <span className="font-black text-emerald-950 block">Smart Slack</span>
                  <span className="text-[9px] text-emerald-800 font-normal">Slack-Optimal</span>
                </td>
                <td className="px-2 py-2 font-mono text-emerald-950">
                  {smart?.delivered} kWh
                </td>
                <td className="px-2 py-2 font-mono text-primary-700">
                  {smart?.unmet} kWh
                </td>
                <td className="px-2 py-2 text-center">
                  {smart?.onTime ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-400">
                      <AlertTriangle className="w-3 h-3" /> {smart?.pctDelivered}%
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-emerald-900">
                  {smart?.fairness}%
                </td>
              </tr>

              {/* EDF Policy */}
              <tr>
                <td className="px-3 py-2">
                  <span className="font-black text-primary-950 block">EDF</span>
                  <span className="text-[9px] text-primary-600 font-normal">Earliest Deadline</span>
                </td>
                <td className="px-2 py-2 font-mono text-primary-950">
                  {edf?.delivered} kWh
                </td>
                <td className="px-2 py-2 font-mono text-primary-700">
                  {edf?.unmet} kWh
                </td>
                <td className="px-2 py-2 text-center">
                  {edf?.onTime ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-400">
                      <AlertTriangle className="w-3 h-3" /> {edf?.pctDelivered}%
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-primary-700">
                  {edf?.fairness}%
                </td>
              </tr>

              {/* FCFS Baseline Policy */}
              <tr>
                <td className="px-3 py-2">
                  <span className="font-black text-primary-950 block">FCFS</span>
                  <span className="text-[9px] text-primary-600 font-normal">First-Come Baseline</span>
                </td>
                <td className="px-2 py-2 font-mono text-primary-950">
                  {fcfs?.delivered} kWh
                </td>
                <td className="px-2 py-2 font-mono text-primary-700">
                  {fcfs?.unmet} kWh
                </td>
                <td className="px-2 py-2 text-center">
                  {fcfs?.onTime ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-400">
                      <XCircle className="w-3 h-3" /> {fcfs?.pctDelivered}%
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-primary-700">
                  {fcfs?.fairness}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Disclaimer */}
      <div className="p-2 rounded-xl bg-cream-50 border border-primary-900/30 text-[10px] text-primary-800 leading-tight flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-0.5" />
        <span>
          <strong>Simulated Station Behavior:</strong> GridSathi AI models typical 3-bay microgrid
          transformers (14 kW default) and background fleet queues to show how smart scheduling
          protects your deadline versus uncoordinated charging. Real stations may have different grid
          feeders.
        </span>
      </div>
    </div>
  );
}
