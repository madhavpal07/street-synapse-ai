"use client";

import { MapPin, Navigation, Plus, Minus } from "lucide-react";

export function MapControls() {
  return (
    <div className="absolute right-4 bottom-32 z-40 flex flex-col gap-3">
      <div className="bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col">
        <button className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 border-b border-slate-100 active:bg-slate-100 transition-colors" aria-label="Zoom in">
          <Plus className="w-5 h-5" />
        </button>
        <button className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors" aria-label="Zoom out">
          <Minus className="w-5 h-5" />
        </button>
      </div>

      <button className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-blue-600 hover:bg-slate-50 active:bg-slate-100 transition-colors" aria-label="My location">
        <Navigation className="w-5 h-5" />
      </button>

      <button className="w-10 h-10 bg-white rounded-xl shadow-md border border-slate-100 flex items-center justify-center text-emerald-600 hover:bg-slate-50 active:bg-slate-100 transition-colors" aria-label="Recenter bus">
        <MapPin className="w-5 h-5" />
      </button>
    </div>
  );
}
