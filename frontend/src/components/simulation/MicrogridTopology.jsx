import React, { useRef, useState, useEffect } from 'react';
import { Zap, Sun, Brain, Car, Gauge, ChevronDown, AlertTriangle } from 'lucide-react';

export default function MicrogridTopology({
  result,
  vehicles,
  capacity,
  events,
  mode,
  onSelectBay,
  onScrollDown,
}) {
  const containerRef = useRef(null);
  const feederRef = useRef(null);
  const solarRef = useRef(null);
  const coreRef = useRef(null);
  const bay1Ref = useRef(null);
  const bay2Ref = useRef(null);
  const bay3Ref = useRef(null);

  const [svgPaths, setSvgPaths] = useState({
    feederToCore: '',
    solarToCore: '',
    coreToBay1: '',
    coreToBay2: '',
    coreToBay3: '',
  });

  // Calculate live 10:00 slot status
  const firstSlot = result?.slots?.[0] || {
    load: 14,
    limit: capacity,
    bays: [null, null, null],
  };

  const activeLoad = firstSlot.load || 0;
  const currentLimit = firstSlot.limit || capacity;
  const isSolarActive = Boolean(events?.solar);
  const solarBoost = isSolarActive ? 4.0 : 0.0;
  const isBrownout = Boolean(events?.brownout);
  const isBay3Fault = Boolean(events?.fault);

  // Bay 1 data
  const bay1Assign = firstSlot.bays?.[0];
  const bay1CarIndex = bay1Assign?.carIndex ?? bay1Assign?.i;
  const bay1Ev = bay1CarIndex !== undefined ? vehicles[bay1CarIndex] : null;
  const bay1Kw = bay1Assign?.kw ?? bay1Assign?.power ?? 0;
  const bay1Battery = bay1Ev?.battery || bay1Ev?.capacity || 40;
  const bay1Name = bay1Ev ? (bay1Ev.name || bay1Ev.model) : 'Tata Nexon EV';
  const bay1Soc = bay1Ev
    ? Math.min(
        100,
        Math.round(
          bay1Ev.soc + (bay1Kw * 0.5 * 100) / Math.max(1, bay1Battery)
        )
      )
    : 55;

  // Bay 2 data
  const bay2Assign = firstSlot.bays?.[1];
  const bay2CarIndex = bay2Assign?.carIndex ?? bay2Assign?.i;
  const bay2Ev = bay2CarIndex !== undefined ? vehicles[bay2CarIndex] : null;
  const bay2Kw = bay2Assign?.kw ?? bay2Assign?.power ?? 0;
  const bay2Battery = bay2Ev?.battery || bay2Ev?.capacity || 40;
  const bay2Name = bay2Ev ? (bay2Ev.name || bay2Ev.model) : 'Mahindra XUV400';
  const bay2Soc = bay2Ev
    ? Math.min(
        100,
        Math.round(
          bay2Ev.soc + (bay2Kw * 0.5 * 100) / Math.max(1, bay2Battery)
        )
      )
    : 64;

  // Bay 3 data
  const bay3Assign = firstSlot.bays?.[2];
  const bay3CarIndex = bay3Assign?.carIndex ?? bay3Assign?.i;
  const bay3Ev = bay3CarIndex !== undefined ? vehicles[bay3CarIndex] : null;
  const bay3Kw = bay3Assign?.kw ?? bay3Assign?.power ?? 0;
  const bay3Battery = bay3Ev?.battery || bay3Ev?.capacity || 40;
  const bay3Name = bay3Ev ? (bay3Ev.name || bay3Ev.model) : 'MG ZS EV';
  const bay3Soc = bay3Ev
    ? Math.min(
        100,
        Math.round(
          bay3Ev.soc + (bay3Kw * 0.5 * 100) / Math.max(1, bay3Battery)
        )
      )
    : 45;

  // Compute curved SVG bezier paths based on bounding rectangles
  useEffect(() => {
    function updateCurves() {
      if (!containerRef.current || !coreRef.current) return;

      const cRect = containerRef.current.getBoundingClientRect();
      const getPos = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return {
          left: r.left - cRect.left,
          right: r.right - cRect.left,
          top: r.top - cRect.top,
          bottom: r.bottom - cRect.top,
          centerX: r.left - cRect.left + r.width / 2,
          centerY: r.top - cRect.top + r.height / 2,
        };
      };

      const feeder = getPos(feederRef.current);
      const solar = getPos(solarRef.current);
      const core = getPos(coreRef.current);
      const b1 = getPos(bay1Ref.current);
      const b2 = getPos(bay2Ref.current);
      const b3 = getPos(bay3Ref.current);

      if (!core) return;

      // Curved cubic bezier generator
      const curve = (x1, y1, x2, y2) => {
        const dx = Math.abs(x2 - x1) * 0.55;
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
      };

      setSvgPaths({
        feederToCore: feeder ? curve(feeder.right, feeder.centerY, core.left, core.centerY - 20) : '',
        solarToCore: solar ? curve(solar.right, solar.centerY, core.left, core.centerY + 20) : '',
        coreToBay1: b1 ? curve(core.right, core.centerY - 25, b1.left, b1.centerY) : '',
        coreToBay2: b2 ? curve(core.right, core.centerY, b2.left, b2.centerY) : '',
        coreToBay3: b3 ? curve(core.right, core.centerY + 25, b3.left, b3.centerY) : '',
      });
    }

    updateCurves();
    window.addEventListener('resize', updateCurves);
    const timer = setTimeout(updateCurves, 100);
    return () => {
      window.removeEventListener('resize', updateCurves);
      clearTimeout(timer);
    };
  }, [capacity, events, mode, vehicles]);

  return (
    <div className="bg-white border-2 border-[#111827] rounded-3xl shadow-[5px_5px_0px_#111827] p-5 sm:p-7 space-y-4">
      {/* Top Header of Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="bg-[#4163F5] text-white text-[11px] font-black px-2.5 py-1 rounded-md tracking-wider uppercase">
              LIVE TOPOLOGY · 10:00 SLOT
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[#111827] tracking-tight">
              Microgrid Power Flow & Smart Charging Bays
            </h2>
          </div>
          <p className="text-xs text-[#64748B] font-medium mt-1">
            Click any EV bay or queued car to inspect its live current pulse, battery fill, and deadline buffer.
          </p>
        </div>

        {/* Active Draw Indicator */}
        <div className="flex items-center gap-2 bg-white border-2 border-[#111827] rounded-xl px-3.5 py-1.5 shadow-[2px_2px_0px_#111827] shrink-0 self-start md:self-auto">
          <Gauge className="w-4 h-4 text-[#4163F5]" />
          <span className="text-sm font-bold text-[#111827]">
            Active Draw:{' '}
            <span className="text-[#4163F5] font-black font-mono">
              {activeLoad.toFixed(1)}
            </span>{' '}
            <span className="text-slate-400 font-mono">/ {currentLimit.toFixed(0)} kW</span>
          </span>
        </div>
      </div>

      {/* Main Canvas with Grid Background */}
      <div
        ref={containerRef}
        className="border-2 border-[#111827] rounded-2xl bg-[#FAFAF8] topology-grid p-6 sm:p-8 relative min-h-[460px] overflow-hidden"
      >
        {/* SVG Power Lines Layer */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          {/* Feeder to Core */}
          {svgPaths.feederToCore && (
            <path
              d={svgPaths.feederToCore}
              fill="none"
              stroke="#4163F5"
              strokeWidth="4"
              strokeDasharray="6 6"
              className={activeLoad > 0 ? 'animate-power-flow' : ''}
              strokeLinecap="round"
            />
          )}

          {/* Solar to Core */}
          {svgPaths.solarToCore && (
            <path
              d={svgPaths.solarToCore}
              fill="none"
              stroke={isSolarActive ? '#F5AD16' : '#CBD5E1'}
              strokeWidth="4"
              strokeDasharray="6 6"
              className={isSolarActive ? 'animate-power-flow' : ''}
              strokeLinecap="round"
            />
          )}

          {/* Core to Bay 1 */}
          {svgPaths.coreToBay1 && (
            <path
              d={svgPaths.coreToBay1}
              fill="none"
              stroke={bay1Kw > 0 ? '#E83D62' : '#CBD5E1'}
              strokeWidth="4"
              strokeDasharray="6 6"
              className={bay1Kw > 0 ? 'animate-power-flow' : ''}
              strokeLinecap="round"
            />
          )}

          {/* Core to Bay 2 */}
          {svgPaths.coreToBay2 && (
            <path
              d={svgPaths.coreToBay2}
              fill="none"
              stroke={bay2Kw > 0 ? '#F5AD16' : '#CBD5E1'}
              strokeWidth="4"
              strokeDasharray="6 6"
              className={bay2Kw > 0 ? 'animate-power-flow' : ''}
              strokeLinecap="round"
            />
          )}

          {/* Core to Bay 3 */}
          {svgPaths.coreToBay3 && (
            <path
              d={svgPaths.coreToBay3}
              fill="none"
              stroke={isBay3Fault ? '#EF4444' : bay3Kw > 0 ? '#4163F5' : '#CBD5E1'}
              strokeWidth="4"
              strokeDasharray="6 6"
              className={bay3Kw > 0 && !isBay3Fault ? 'animate-power-flow' : ''}
              strokeLinecap="round"
            />
          )}
        </svg>

        {/* 3-Column Node Elements Grid */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 min-h-[380px]">
          {/* Left Column: Power Sources */}
          <div className="flex flex-col justify-around gap-6 w-full lg:w-56 shrink-0">
            {/* GRID FEEDER CARD */}
            <div
              ref={feederRef}
              className="bg-white border-2 border-[#111827] rounded-2xl p-4 shadow-[3px_3px_0px_#111827]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] border border-[#C7D2FE] flex items-center justify-center text-[#4163F5] shrink-0">
                  <Zap className="w-5 h-5 fill-[#4163F5]" />
                </div>
                <div>
                  <span className="text-[11px] font-black tracking-wider text-[#111827] block">
                    GRID FEEDER
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isBrownout ? 'text-[#E83D62]' : 'text-[#4163F5]'
                    }`}
                  >
                    {isBrownout ? 'BROWNOUT (10kW)' : 'TRANSFORMER OK'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-lg font-black font-mono text-[#111827]">
                  {capacity.toFixed(1)} kW
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  MAX
                </span>
              </div>
            </div>

            {/* SOLAR CANOPY CARD */}
            <div
              ref={solarRef}
              className="bg-white border-2 border-[#111827] rounded-2xl p-4 shadow-[3px_3px_0px_#111827]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#F5AD16] shrink-0">
                  <Sun className="w-5 h-5 fill-[#F5AD16]" />
                </div>
                <div>
                  <span className="text-[11px] font-black tracking-wider text-[#111827] block">
                    SOLAR CANOPY
                  </span>
                  <span
                    className={`text-[10px] font-bold ${
                      isSolarActive ? 'text-[#55BD8D]' : 'text-slate-400'
                    }`}
                  >
                    {isSolarActive ? 'ACTIVE GENERATING' : 'STANDBY MODE'}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-lg font-black font-mono text-[#111827]">
                  {solarBoost.toFixed(1)} kW
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  BOOST
                </span>
              </div>
            </div>
          </div>

          {/* Center Column: GridSathi Core Brain */}
          <div className="flex justify-center my-4 lg:my-0">
            <div
              ref={coreRef}
              className="bg-[#111827] text-white border-2 border-[#111827] rounded-3xl p-5 sm:p-6 shadow-[5px_5px_0px_rgba(17,24,39,0.3)] w-60 sm:w-64 text-center relative"
            >
              {/* Brain Icon in glowing badge */}
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-400/30 flex items-center justify-center text-pink-400 shadow-md">
                <Brain className="w-6 h-6" />
              </div>

              <h3 className="text-sm font-black tracking-widest text-white mt-3">
                GRIDSATHI CORE
              </h3>

              <div className="text-[11px] font-bold text-[#38BDF8] tracking-wider mt-0.5">
                {mode === 'smart'
                  ? 'SMART SLACK DISPATCH'
                  : mode === 'edf'
                  ? 'EARLIEST DEADLINE'
                  : 'FIRST-COME FIRST-SERVED'}
              </div>

              {/* Dispatch power pill */}
              <div className="mt-3 inline-block bg-[#F5AD16]/20 border border-[#F5AD16]/40 text-[#F5AD16] font-mono text-xs font-black px-3 py-1 rounded-md">
                DISPATCH: {activeLoad.toFixed(1)} kW
              </div>
            </div>
          </div>

          {/* Right Column: 3 Smart Charging Bays */}
          <div className="flex flex-col gap-3.5 w-full lg:w-72 shrink-0">
            {/* BAY 01 */}
            <div
              ref={bay1Ref}
              onClick={() => onSelectBay && onSelectBay(0)}
              className="bg-white border-2 border-[#4163F5] rounded-2xl p-3.5 shadow-[3px_3px_0px_#111827] hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#111827] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md">
                  BAY 01
                </span>
                <span className="bg-[#E83D62] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md font-mono">
                  {bay1Kw.toFixed(1)} kW
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#111827] mt-2 truncate">
                <Car className="w-3.5 h-3.5 text-[#E83D62] shrink-0" />
                <span className="truncate">
                  {bay1Ev ? `${bay1Ev.id} · ${bay1Name}` : 'EV-1 · Tata Nexon EV'}
                </span>
              </div>
              {/* Battery progress */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 border border-[#111827] rounded-full h-3 relative overflow-hidden">
                  <div
                    className="h-full bg-[#E83D62] transition-all duration-500 rounded-full"
                    style={{ width: `${bay1Soc}%` }}
                  />
                </div>
                <span className="text-[10px] font-black font-mono text-[#111827]">
                  {bay1Soc}% SoC
                </span>
              </div>
            </div>

            {/* BAY 02 */}
            <div
              ref={bay2Ref}
              onClick={() => onSelectBay && onSelectBay(1)}
              className="bg-white border-2 border-[#111827] rounded-2xl p-3.5 shadow-[3px_3px_0px_#111827] hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#111827] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md">
                  BAY 02
                </span>
                <span className="bg-[#F5AD16] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md font-mono">
                  {bay2Kw.toFixed(1)} kW
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-[#111827] mt-2 truncate">
                <Car className="w-3.5 h-3.5 text-[#F5AD16] shrink-0" />
                <span className="truncate">
                  {bay2Ev ? `${bay2Ev.id} · ${bay2Name}` : 'EV-6 · Mahindra XUV400'}
                </span>
              </div>
              {/* Battery progress */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-slate-100 border border-[#111827] rounded-full h-3 relative overflow-hidden">
                  <div
                    className="h-full bg-[#F5AD16] transition-all duration-500 rounded-full"
                    style={{ width: `${bay2Soc}%` }}
                  />
                </div>
                <span className="text-[10px] font-black font-mono text-[#111827]">
                  {bay2Soc}% SoC
                </span>
              </div>
            </div>

            {/* BAY 03 */}
            <div
              ref={bay3Ref}
              onClick={() => onSelectBay && onSelectBay(2)}
              className={`bg-white border-2 rounded-2xl p-3.5 shadow-[3px_3px_0px_#111827] hover:-translate-y-0.5 transition-transform cursor-pointer ${
                isBay3Fault ? 'border-[#EF4444] bg-red-50/40' : 'border-[#111827]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#111827] text-white text-[10px] font-black px-2.5 py-0.5 rounded-md">
                  BAY 03
                </span>
                {isBay3Fault ? (
                  <span className="bg-[#EF4444] text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                    OFFLINE (FAULT)
                  </span>
                ) : bay3Kw > 0 ? (
                  <span className="bg-[#4163F5] text-white text-[11px] font-black px-2.5 py-0.5 rounded-md font-mono">
                    {bay3Kw.toFixed(1)} kW
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px] font-bold font-mono">
                    BAY READY (7kW)
                  </span>
                )}
              </div>

              {isBay3Fault ? (
                <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Hardware trip / Offline</span>
                </div>
              ) : bay3Ev ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#111827] mt-2 truncate">
                    <Car className="w-3.5 h-3.5 text-[#4163F5] shrink-0" />
                    <span className="truncate">
                      {bay3Ev.id} · {bay3Name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 border border-[#111827] rounded-full h-3 relative overflow-hidden">
                      <div
                        className="h-full bg-[#4163F5] transition-all duration-500 rounded-full"
                        style={{ width: `${bay3Soc}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-black font-mono text-[#111827]">
                      {bay3Soc}% SoC
                    </span>
                  </div>
                </>
              ) : (
                <div className="mt-3 text-xs text-slate-400 font-mono italic">
                  Awaiting Scheduled EV...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Down Arrow Button at bottom center */}
        {onScrollDown && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={onScrollDown}
              className="w-8 h-8 rounded-full bg-white border-2 border-[#111827] shadow-[2px_2px_0px_#111827] flex items-center justify-center text-[#111827] hover:bg-slate-50 transition-transform active:translate-y-0.5"
              title="Scroll to Connected Fleet"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
