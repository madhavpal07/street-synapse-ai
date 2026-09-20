"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { mockStops } from "@/lib/mock-transit-data";

export function RouteTimeline() {
  const [expanded, setExpanded] = useState(false);

  const startStop = mockStops[0];
  const endStop = mockStops[mockStops.length - 1];
  const intermediateStops = mockStops.slice(1, -1);

  return (
    <div className="py-4">
      <div className="relative pl-6">
        {/* Continuous Line */}
        <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-slate-200"></div>

        {/* Start Stop */}
        <div className="relative z-10 flex items-start gap-4 mb-6">
          <div className="absolute -left-6 top-1 w-6 h-6 flex items-center justify-center bg-white">
            <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Board At</div>
            <div className="text-sm font-semibold text-slate-900">{startStop.name}</div>
          </div>
          <div className="text-sm font-medium text-slate-900">{startStop.estimatedArrival}</div>
        </div>

        {/* Intermediate Stops Toggle */}
        <div className="relative z-10 mb-6">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors"
          >
            {intermediateStops.length} Intermediate Stops
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Stops */}
        {expanded && (
          <div className="mb-6 space-y-6 relative z-10">
            {intermediateStops.map((stop) => (
              <div key={stop.id} className="flex items-start gap-4">
                <div className="absolute -left-6 mt-1 w-6 h-6 flex items-center justify-center bg-white">
                  <div className={`w-2 h-2 rounded-full ${stop.status === 'passed' ? 'bg-slate-300' : 'bg-emerald-400'}`}></div>
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${stop.status === 'passed' ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-700 font-medium'}`}>
                    {stop.name}
                  </div>
                </div>
                <div className={`text-xs font-medium ${stop.status === 'passed' ? 'text-slate-400' : 'text-slate-700'}`}>
                  {stop.estimatedArrival}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* End Stop */}
        <div className="relative z-10 flex items-start gap-4">
          <div className="absolute -left-6 top-1 w-6 h-6 flex items-center justify-center bg-white">
            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-50"></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-0.5">Drop Off</div>
            <div className="text-sm font-semibold text-slate-900">{endStop.name}</div>
          </div>
          <div className="text-sm font-medium text-slate-900">{endStop.estimatedArrival}</div>
        </div>
      </div>
    </div>
  );
}
