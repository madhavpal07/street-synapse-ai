"use client";

import { useState } from "react";
import { Bus, Globe2 } from "lucide-react";

export function TransitHeader() {
  const [lang, setLang] = useState<"EN" | "HI">("EN");
  const [networkStatus, setNetworkStatus] = useState<"live" | "offline">("live");

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 text-white p-1.5 rounded-lg shadow-sm">
            <Bus className="w-5 h-5" />
          </div>
          <h1 className="font-heading font-semibold text-xl tracking-tight text-slate-900">Sawaari</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-slate-100 rounded-md cursor-pointer hover:bg-slate-200 transition-colors" onClick={() => setLang(lang === "EN" ? "HI" : "EN")}>
            <Globe2 className="w-3.5 h-3.5 text-slate-600" />
            <span className={lang === "EN" ? "text-slate-900" : "text-slate-500"}>EN</span>
            <span className="text-slate-300">|</span>
            <span className={lang === "HI" ? "text-slate-900" : "text-slate-500"}>हिन्दी</span>
          </div>
        </div>
      </div>

      {/* Network Status Banner */}
      <div className={`px-4 py-1.5 flex items-center justify-center text-xs font-medium transition-colors ${networkStatus === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
        {networkStatus === 'live' ? (
          <>
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Tracking
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
            Offline Timetable Mode - <span className="font-normal ml-1">Live location unavailable. Showing scheduled timetable.</span>
          </>
        )}
      </div>
    </header>
  );
}
