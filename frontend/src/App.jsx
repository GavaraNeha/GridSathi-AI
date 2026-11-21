import React from 'react';
import { Zap, MapPin, Cpu } from 'lucide-react';

/**
 * GridSathi AI — Dashboard Shell
 * Minimal application scaffold with placeholder sections for:
 * 1. EV Station Discovery (OpenStreetMap + Leaflet)
 * 2. Microgrid Simulation (scheduling engine visualization)
 *
 * Individual view components will be added in subsequent commits.
 */
export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Zap className="w-7 h-7 text-emerald-400" />
          <h1 className="text-xl font-bold tracking-tight">
            GridSathi <span className="text-emerald-400">AI</span>
          </h1>
          <span className="ml-auto text-xs text-slate-500 font-mono">
            100% Free · OpenStreetMap · Zero API Keys
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Station Discovery Placeholder */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-semibold">EV Station Discovery</h2>
          </div>
          <p className="text-slate-400 text-sm">
            India-wide EV charging station search powered by OpenStreetMap Overpass API.
            Search bar, Leaflet map view, and station listings will be added here.
          </p>
        </section>

        {/* Microgrid Simulation Placeholder */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-semibold">Microgrid Simulation</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Software-only microgrid load orchestration with 3-bay scheduling,
            transformer capacity constraints, and fairness optimization.
            Simulation dashboard components will be added here.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        GridSathi AI · 100% Open-Source · Leaflet + OpenStreetMap + Overpass API · Zero Billing
      </footer>
    </div>
  );
}
