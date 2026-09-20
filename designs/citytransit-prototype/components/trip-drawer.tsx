"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { Clock, Route as RouteIcon, IndianRupee, Zap, Snowflake, Accessibility, Info, AlertTriangle } from "lucide-react";
import { RouteTimeline } from "./route-timeline";
import { FareCard } from "./fare-card";
import { mockRoute } from "@/lib/mock-transit-data";

export function TripDrawer({
  eta,
  distance,
  speed
}: {
  eta: number,
  distance: number,
  speed: number
}) {
  const [open, setOpen] = useState(true);
  const [snap, setSnap] = useState<number | string | null>(0.3);

  return (
    <Drawer.Root open={open} onOpenChange={setOpen} snapPoints={[0.3, 0.6, 1]} activeSnapPoint={snap} setActiveSnapPoint={setSnap} modal={false} dismissible={false}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/5" />
        <Drawer.Content className="bg-white flex flex-col rounded-t-[2rem] border-t border-slate-200 mt-24 h-full max-h-[90vh] fixed bottom-0 left-0 right-0 z-[100] w-full max-w-[520px] mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
          <div className="p-4 bg-white rounded-t-[2rem] flex-shrink-0">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-slate-200 mb-6" />

            {/* Collapsed State / Header Content */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Arriving Soon</div>
                <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
                  {eta <= 1 ? "Arriving now" : `Arrives in ${eta} mins`}
                </h2>
                <div className="text-sm font-medium text-slate-500 mt-1">{distance.toFixed(1)} km away</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="bg-emerald-100 text-emerald-800 text-sm font-bold px-3 py-1.5 rounded-lg mb-1 shadow-sm">
                  {mockRoute.number} {mockRoute.name}
                </div>
                <div className="text-xs text-slate-400 font-medium">Updated 8s ago</div>
              </div>
            </div>

            {/* AI Insights / RoadSense */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-semibold text-blue-900">RoadSense AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-slate-500">95% Smooth Ride</span>
                <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[95%] h-full bg-emerald-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white overflow-y-auto flex-1 overscroll-y-contain custom-scrollbar">
            {/* Travel Summary */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                <Clock className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-sm font-bold text-slate-900">{mockRoute.durationMinutes} min</div>
                <div className="text-[10px] text-slate-500 uppercase font-medium">Journey</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                <RouteIcon className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-sm font-bold text-slate-900">{mockRoute.distanceKm} km</div>
                <div className="text-[10px] text-slate-500 uppercase font-medium">Distance</div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-100">
                <IndianRupee className="w-5 h-5 text-slate-400 mb-2" />
                <div className="text-sm font-bold text-slate-900">₹54</div>
                <div className="text-[10px] text-slate-500 uppercase font-medium">Fare</div>
              </div>
            </div>

            {/* Vehicle Amenities */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Electric Bus
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap">
                <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                AC
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-xs font-medium text-slate-700 whitespace-nowrap">
                <Accessibility className="w-3.5 h-3.5 text-emerald-500" />
                Wheelchair Accessible
              </div>
            </div>

            {/* Route Timeline */}
            <h3 className="font-bold text-slate-900 mb-2 px-1">Route & Stops</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
              <RouteTimeline />
            </div>

            {/* Fare Card */}
            <div className="mb-24">
              <FareCard distanceKm={mockRoute.distanceKm} />
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
