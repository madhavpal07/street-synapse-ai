'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ageLabel } from '../lib/status';

function FollowBus({ selected, follow, focusCount }) {
  const map = useMap();
  const lastFocus = useRef(-1);
  const lastBus = useRef(null);
  const latitude = selected?.position?.latitude;
  const longitude = selected?.position?.longitude;
  useEffect(() => {
    if (latitude == null || longitude == null) return;
    const requested = lastFocus.current !== focusCount || lastBus.current !== selected.busId;
    if (follow || requested) {
      map.setView([latitude, longitude], requested ? Math.max(map.getZoom(), 15) : map.getZoom(), { animate: true });
    }
    lastFocus.current = focusCount;
    lastBus.current = selected.busId;
  }, [map, latitude, longitude, follow, focusCount, selected?.busId]);
  return null;
}

function BusMarker({ bus, selected, onSelect, now }) {
  const ref = useRef(null);
  const [initialPosition] = useState([bus.position.latitude, bus.position.longitude]);
  const icon = useMemo(() => L.divIcon({
    className: 'bus-map-icon',
    html: `<div class="map-bus ${bus.status} ${selected ? 'is-selected' : ''}"><span>${bus.busId.replace('BUS-', '')}</span></div>`,
    iconSize: [48, 38], iconAnchor: [24, 19], popupAnchor: [0, -24],
  }), [bus.busId, bus.status, selected]);

  useEffect(() => {
    const marker = ref.current;
    if (!marker) return;
    const from = marker.getLatLng();
    const to = L.latLng(bus.position.latitude, bus.position.longitude);
    if (from.equals(to)) return;
    // Interpolation only smooths received points. It does not predict a route.
    if (from.distanceTo(to) > 2000 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      marker.setLatLng(to);
      return;
    }
    const start = performance.now();
    let frame;
    const animate = (time) => {
      const ratio = Math.min(1, (time - start) / 700);
      marker.setLatLng([from.lat + (to.lat - from.lat) * ratio, from.lng + (to.lng - from.lng) * ratio]);
      if (ratio < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [bus.position.latitude, bus.position.longitude]);

  return <Marker ref={ref} position={initialPosition} icon={icon} title={bus.busId} eventHandlers={{ click: () => onSelect(bus.busId) }}>
    <Popup><strong>{bus.busId}</strong><p>{bus.status === 'live' ? 'Live GPS reading' : 'Last known location'}<br />GPS {ageLabel(bus.position.timestamp, now)}<br />Accuracy ±{Math.round(bus.position.accuracy)} m</p></Popup>
  </Marker>;
}

export default function BusMap({ buses, selectedId, onSelect, follow, focusCount, now }) {
  const selected = buses.find((bus) => bus.busId === selectedId);
  const [tileError, setTileError] = useState(false);
  return <>
    <MapContainer center={[29.8543, 77.888]} zoom={12} className="bus-map" zoomControl={true}>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} eventHandlers={{ tileerror: () => setTileError(true), tileload: () => setTileError(false) }} />
      <FollowBus selected={selected} follow={follow} focusCount={focusCount} />
      {selected?.position && <Circle center={[selected.position.latitude, selected.position.longitude]} radius={selected.position.accuracy} pathOptions={{ color: '#195be7', fillOpacity: 0.08, weight: 1 }} />}
      {buses.filter((bus) => bus.position).map((bus) => <BusMarker key={bus.busId} bus={bus} selected={bus.busId === selectedId} onSelect={onSelect} now={now} />)}
    </MapContainer>
    {tileError && <div className="tile-error" role="status">Map tiles could not load. Check internet access; coordinates remain available below.</div>}
  </>;
}
