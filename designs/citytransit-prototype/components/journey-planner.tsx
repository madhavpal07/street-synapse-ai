"use client";

import { useState } from "react";
import { Search, MapPin, ArrowDownUp, Navigation2 } from "lucide-react";

export function JourneyPlanner({ onFindBuses }: { onFindBuses?: () => void }) {
  const [from, setFrom] = useState("Quantum University Main Gate");
  const [to, setTo] = useState("Roorkee Railway Station");

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="bg-white m-4 rounded-2xl shadow-sm border border-slate-100 p-4 relative z-40">
      <div className="relative">
        {/* Timeline connector line */}
        <div className="absolute left-3.5 top-8 bottom-8 w-0.5 bg-slate-200 rounded-full"></div>

        {/* From Input */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-shrink-0 z-10 w-7 h-7 flex items-center justify-center bg-white">
            <MapPin className="w-5 h-5 text-emerald-500" fill="currentColor" fillOpacity={0.2} />
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">From</div>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Current Location"
            />
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors z-20"
          aria-label="Swap locations"
        >
          <ArrowDownUp className="w-4 h-4" />
        </button>

        {/* To Input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0 z-10 w-7 h-7 flex items-center justify-center bg-white">
            <Search className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">To</div>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Where do you want to go?"
            />
          </div>
        </div>
      </div>

      <button
        onClick={onFindBuses}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-200"
      >
        <Navigation2 className="w-4 h-4" />
        Find Live Buses
      </button>
    </div>
  );
}
