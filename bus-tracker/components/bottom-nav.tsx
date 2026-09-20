"use client";

import { Home, Bus, Clock, MapPin, MoreHorizontal } from "lucide-react";

export function BottomNav({
  activeTab,
  onHomeClick,
  onLiveClick,
  onTimetableClick,
  onNearbyClick,
  onMoreClick
}: {
  activeTab?: string;
  onHomeClick?: () => void;
  onLiveClick?: () => void;
  onTimetableClick?: () => void;
  onNearbyClick?: () => void;
  onMoreClick?: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[110] bg-white border-t border-slate-200 pb-safe">
      <div className="w-full max-w-[520px] mx-auto flex justify-between items-center px-6 py-3">
        <button
          onClick={onHomeClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'home' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={onLiveClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'live' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <Bus className="w-6 h-6" />
          <span className="text-[10px] font-medium">Live</span>
        </button>
        <button
          onClick={onTimetableClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'timetable' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-medium">Timetable</span>
        </button>
        <button
          onClick={onNearbyClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'nearby' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <MapPin className="w-6 h-6" />
          <span className="text-[10px] font-medium">Nearby</span>
        </button>
        <button
          onClick={onMoreClick}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'more' ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
        >
          <MoreHorizontal className="w-6 h-6" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>
    </div>
  );
}
