"use client";

import { useState, useEffect } from "react";
import { TransitHeader } from "@/components/transit-header";
import { JourneyPlanner } from "@/components/journey-planner";
import { MapControls } from "@/components/map-controls";
import { TripDrawer } from "@/components/trip-drawer";
import { BottomNav } from "@/components/bottom-nav";
import { Timetable } from "@/components/timetable";
import { routeCoordinates } from "@/lib/mock-transit-data";
import { calculateETA } from "@/lib/eta";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "live" | "timetable" | "nearby" | "more">("live");
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [busIndex, setBusIndex] = useState(0);
  const [busPosition, setBusPosition] = useState<[number, number]>(routeCoordinates[0]);
  const [busHeading, setBusHeading] = useState(45);
  const [LiveMap, setLiveMap] = useState<any>(null);

  useEffect(() => {
    import("@/components/live-map").then((mod) => {
      setLiveMap(() => mod.default);
    });
  }, []);

  // Calculate ETA based on remaining distance.
  // 1 index ≈ 0.85 km roughly for this demo
  const remainingStops = routeCoordinates.length - busIndex - 1;
  const distanceKm = Math.max(0.1, remainingStops * 0.85);
  const speedKmph = 25; // average speed
  const eta = calculateETA(distanceKm, speedKmph);

  // Mock live movement
  useEffect(() => {
    if (activeTab !== "live" || !isTrackingActive) return;

    // Trigger window resize events during the 700ms CSS transition
    // so the Leaflet map smoothly recalculates its dimensions
    let start = Date.now();
    const resizeInterval = setInterval(() => {
      window.dispatchEvent(new Event('resize'));
      if (Date.now() - start > 800) {
        clearInterval(resizeInterval);
      }
    }, 50);

    const interval = setInterval(() => {
      setBusIndex((prev) => {
        const next = (prev + 1) % routeCoordinates.length;
        const currentPos = routeCoordinates[prev];
        const nextPos = routeCoordinates[next];

        // Calculate heading
        if (next !== 0) {
          const dy = nextPos[0] - currentPos[0];
          const dx = nextPos[1] - currentPos[1];
          let theta = Math.atan2(dy, dx); // range (-PI, PI]
          theta *= 180 / Math.PI; // rads to degs, range (-180, 180]
          // Convert to 0-360 range and adjust for map coordinates if needed
          let heading = (theta + 360) % 360;
          setBusHeading(heading);
        }

        setBusPosition(routeCoordinates[next]);
        return next;
      });
    }, 4000); // Move every 4 seconds

    return () => clearInterval(interval);
  }, [activeTab, isTrackingActive]);

  return (
    <main className="flex-1 flex flex-col bg-slate-50 relative pb-16">
      <TransitHeader />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-40 px-4 pt-2">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("live")}
            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'live' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Live Tracking
            {activeTab === 'live' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("timetable")}
            className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'timetable' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Timetable / समय सारणी
            {activeTab === 'timetable' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full"></div>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === "live" ? (
          <>
            <div
              className={`absolute bottom-0 left-0 right-0 z-0 transition-all duration-700 ease-in-out ${
                isTrackingActive ? "h-full" : "h-[65%]"
              }`}
            >
              {LiveMap ? (
                <LiveMap busPosition={busPosition} busHeading={busHeading} />
              ) : (
                <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
                  <div className="text-slate-400 font-medium">Loading Map...</div>
                </div>
              )}
            </div>

            <div className="relative z-10 pointer-events-none flex flex-col h-full overflow-hidden">
              <div
                className={`pointer-events-auto transition-all duration-700 ease-in-out origin-top ${
                  isTrackingActive
                    ? "opacity-0 -translate-y-full absolute w-full"
                    : "opacity-100 translate-y-0 relative w-full"
                }`}
              >
                <JourneyPlanner onFindBuses={() => setIsTrackingActive(true)} />
              </div>
              <div className="flex-1"></div>

              <div className={`pointer-events-auto transition-all duration-700 ease-in-out ${
                isTrackingActive ? "mb-[30vh]" : "mb-6"
              }`}>
                <MapControls />
              </div>
            </div>

            {isTrackingActive && (
              <TripDrawer eta={eta} distance={distanceKm} speed={speedKmph} />
            )}
          </>
        ) : activeTab === "timetable" ? (
          <div className="flex-1 overflow-y-auto">
            <Timetable />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚧</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Coming Soon</h3>
            <p className="text-sm">This section is currently under development. Please check back later!</p>
          </div>
        )}
      </div>

      <BottomNav
        activeTab={activeTab === 'home' && !isTrackingActive ? 'home' : activeTab}
        onHomeClick={() => {
          setActiveTab("live");
          setIsTrackingActive(false);
        }}
        onLiveClick={() => {
          setActiveTab("live");
          setIsTrackingActive(true);
        }}
        onTimetableClick={() => setActiveTab("timetable")}
        onNearbyClick={() => setActiveTab("nearby")}
        onMoreClick={() => setActiveTab("more")}
      />
    </main>
  );
}
