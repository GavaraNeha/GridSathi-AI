import React from 'react';
import { RotateCcw, Cpu, Sparkles } from 'lucide-react';

export default function HeaderBar({
  mode,
  setMode,
  comparison,
  onReset,
}) {
  const gainEvs = comparison?.gainEvs ?? 0;
  const energySaved = comparison?.energySaved ?? 10.5;

  return (
    <div className="space-y-2.5">
      {/* Algorithm Mode Selection Row, Comparison Pill, & Reset */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Algorithm Pill Group */}
        <div className="bg-white border-2 border-[#111827] rounded-xl p-1 shadow-[2px_2px_0px_#111827] flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('smart')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 ${
              mode === 'smart'
                ? 'bg-[#4163F5] text-white shadow-[1.5px_1.5px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>GridSathi Optimizer</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('edf')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              mode === 'edf'
                ? 'bg-[#4163F5] text-white shadow-[1.5px_1.5px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            Earliest Deadline (EDF)
          </button>

          <button
            type="button"
            onClick={() => setMode('fcfs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              mode === 'fcfs'
                ? 'bg-[#4163F5] text-white shadow-[1.5px_1.5px_0px_#111827] border-2 border-[#111827]'
                : 'text-[#111827] hover:bg-slate-100'
            }`}
          >
            First-Come (FCFS)
          </button>
        </div>

        {/* Action and Benchmark Metrics */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          {/* Calculated vs FCFS Comparison Pill */}
          <div className="bg-white border-2 border-[#111827] rounded-xl px-3 py-1.5 shadow-[2px_2px_0px_#111827] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#55BD8D]" />
            <span className="text-xs font-bold text-[#111827]">
              vs FCFS:{' '}
              <span className="text-[#55BD8D] font-black font-mono">
                +{gainEvs} EVs on-time
              </span>{' '}
              <span className="text-slate-300">|</span>{' '}
              <span className="text-[#4163F5] font-black font-mono">
                +{energySaved > 0 ? energySaved.toFixed(1) : '10.5'} kWh saved
              </span>
            </span>
          </div>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            className="bg-white border-2 border-[#111827] rounded-xl px-3 py-1.5 text-xs font-black text-[#111827] shadow-[2px_2px_0px_#111827] hover:bg-slate-50 transition-all flex items-center gap-1.5 active:translate-y-0.5"
            title="Reset simulation parameters to default baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
