"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { routeCoordinates, mockStops } from "@/lib/mock-transit-data";

// Custom icons
const createBusIcon = (heading: number) => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div class="relative flex items-center justify-center w-10 h-10">
        <div class="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
        <div class="absolute inset-0 bg-emerald-500 rounded-full opacity-40"></div>
        <div class="relative bg-white text-emerald-600 rounded-full w-8 h-8 flex items-center justify-center shadow-md border-2 border-emerald-500 transform transition-transform" style="transform: rotate(${heading}deg);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 -rotate-90">
            <path d="M8 6v6"/>
            <path d="M15 6v6"/>
            <path d="M2 12h19.6"/>
            <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
            <circle cx="7" cy="18" r="2"/>
            <path d="M9 18h5"/>
            <circle cx="16" cy="18" r="2"/>
          </svg>
        </div>
        <div class="absolute -top-6 whitespace-nowrap bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm">
          104
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createUserIcon = () => {
  if (typeof window === 'undefined') return null as any;
  return L.divIcon({
    className: 'custom-user-marker',
    html: `
      <div class="relative flex items-center justify-center w-6 h-6">
        <div class="absolute inset-0 bg-blue-500 rounded-full opacity-30"></div>
        <div class="relative bg-blue-600 border-2 border-white rounded-full w-4 h-4 shadow-sm"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function LiveMap({
  busPosition,
  busHeading
}: {
  busPosition: [number, number],
  busHeading: number
}) {
  const [mounted, setMounted] = useState(false);
  const [userPos] = useState<[number, number]>([29.9320, 77.7815]); // Near origin

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">Loading map...</div>;
  }

  return (
    <div className="w-full h-full absolute inset-0 z-0">
      <MapContainer
        center={busPosition}
        zoom={14}
        zoomControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <Polyline
          positions={routeCoordinates}
          color="#3b82f6"
          weight={4}
          opacity={0.8}
        />

        {/* Stops */}
        {mockStops.map((stop) => (
          <CircleMarker
            key={stop.id}
            center={[stop.latitude, stop.longitude]}
            radius={stop.status === 'passed' ? 4 : (stop.status === 'upcoming' ? 6 : 8)}
            pathOptions={{
              color: stop.status === 'passed' ? '#94a3b8' : '#10b981',
              fillColor: stop.status === 'passed' ? '#cbd5e1' : '#ffffff',
              fillOpacity: 1,
              weight: stop.status === 'current' ? 3 : 2
            }}
          />
        ))}

        {/* User Location */}
        <Marker position={userPos} icon={createUserIcon()} />

        {/* Bus Location */}
        <Marker
          position={busPosition}
          icon={createBusIcon(busHeading)}
          zIndexOffset={1000}
        />

        <MapController center={busPosition} />
      </MapContainer>
    </div>
  );
}
