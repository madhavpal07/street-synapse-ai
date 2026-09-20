export const FRESH_FIX_MS = 15_000;
export const SILENT_CONNECTION_MS = 45_000;

// GPS freshness and the network connection are separate measurements.
export function busStatus(bus, now = Date.now()) {
  if (!bus.connected) return 'offline';
  if (!bus.position) return 'waiting';
  if (now - bus.lastReceivedAt > SILENT_CONNECTION_MS) return 'offline';
  if (now - bus.position.timestamp > FRESH_FIX_MS) return 'stale';
  return 'live';
}

export function ageLabel(timestamp, now = Date.now()) {
  if (!timestamp) return 'No reading';
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
