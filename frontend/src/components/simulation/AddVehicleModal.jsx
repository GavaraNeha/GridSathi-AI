import React, { useState } from 'react';
import { X, PlusCircle, Car, AlertCircle } from 'lucide-react';

export default function AddVehicleModal({ isOpen, onClose, onAddVehicle }) {
  const [name, setName] = useState('Tata Tiago EV');
  const [battery, setBattery] = useState(24);
  const [soc, setSoc] = useState(30);
  const [target, setTarget] = useState(75);
  const [due, setDue] = useState(2.0);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a vehicle name or model.');
      return;
    }
    if (Number(target) <= Number(soc)) {
      setError('Target State of Charge must strictly exceed Initial SoC.');
      return;
    }
    if (Number(battery) <= 0) {
      setError('Battery capacity must be greater than 0 kWh.');
      return;
    }

    onAddVehicle({
      name: name.trim(),
      battery: Number(battery),
      soc: Number(soc),
      target: Number(target),
      due: Number(due),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">
              Add Vehicle to Fleet
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Vehicle Model / Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Tata Tiago EV, Ola S1 Pro"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Battery Pack (kWh)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                step="1"
                required
                value={battery}
                onChange={(e) => setBattery(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Departure Due (Hours)
              </label>
              <select
                value={due}
                onChange={(e) => setDue(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm"
              >
                <option value={0.5}>0.5 hrs (10:30)</option>
                <option value={1.0}>1.0 hrs (11:00)</option>
                <option value={1.5}>1.5 hrs (11:30)</option>
                <option value={2.0}>2.0 hrs (12:00)</option>
                <option value={2.5}>2.5 hrs (12:30)</option>
                <option value={3.0}>3.0 hrs (13:00)</option>
                <option value={4.0}>4.0 hrs (14:00)</option>
                <option value={5.0}>5.0 hrs (15:00)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Initial SoC (%)
              </label>
              <input
                type="number"
                min="5"
                max="90"
                step="1"
                required
                value={soc}
                onChange={(e) => setSoc(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Target SoC (%)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                step="1"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white font-mono text-sm"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Vehicle</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
