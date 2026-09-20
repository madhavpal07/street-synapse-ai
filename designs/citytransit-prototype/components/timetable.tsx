"use client";

import { mockTimetable, mockRoute } from "@/lib/mock-transit-data";

export function Timetable() {
  const nextBusIndex = 5; // Simulating 10:15 AM as next

  return (
    <div className="bg-white px-4 py-6">
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-amber-600 font-bold">
            {mockRoute.number}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{mockRoute.origin} → {mockRoute.destination}</h3>
            <p className="text-sm text-slate-500 mt-0.5">Route schedule</p>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-slate-900 mb-4 px-1">Today&apos;s Departures</h4>

      <div className="grid grid-cols-3 gap-3">
        {mockTimetable.map((time, index) => {
          const isNext = index === nextBusIndex;
          const isPast = index < nextBusIndex;

          return (
            <div
              key={time}
              className={`py-3 rounded-xl text-center text-sm font-medium transition-colors border ${
                isNext
                  ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/20 ring-offset-1'
                  : isPast
                    ? 'bg-slate-50 text-slate-400 border-slate-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300'
              }`}
            >
              {isNext && <div className="text-[9px] uppercase tracking-wider font-bold mb-0.5 opacity-90">Next Bus</div>}
              {time}
            </div>
          );
        })}
      </div>
    </div>
  );
}
