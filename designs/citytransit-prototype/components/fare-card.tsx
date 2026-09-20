"use client";

import { calculateFare } from "@/lib/eta";
import { formatCurrency } from "@/lib/formatters";

export function FareCard({ distanceKm }: { distanceKm: number }) {
  const baseFare = 10;
  const distanceRate = 1.76;
  const total = calculateFare(distanceKm);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 relative overflow-hidden">
      {/* Decorative dashed line for ticket effect */}
      <div className="absolute left-0 top-1/2 -mt-2 w-3 h-4 bg-white border-r border-slate-200 rounded-r-full"></div>
      <div className="absolute right-0 top-1/2 -mt-2 w-3 h-4 bg-white border-l border-slate-200 rounded-l-full"></div>
      <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-slate-200"></div>

      <div className="pb-5">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estimated Fare</div>
        <div className="text-3xl font-bold text-slate-900">{formatCurrency(total)}</div>
      </div>

      <div className="pt-5 space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span>Base fare</span>
          <span>{formatCurrency(baseFare)}</span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span>Distance fare ({distanceKm} km)</span>
          <span>{formatCurrency(total - baseFare)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60">
        <div className="text-[10px] text-slate-400 text-center">
          Final fare may vary by operator rules.
        </div>
      </div>
    </div>
  );
}
