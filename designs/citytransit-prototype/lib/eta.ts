export function calculateETA(distanceKm: number, speedKmph: number): number {
  if (speedKmph <= 0) return 0;
  // Basic ETA calculation
  // ETA in minutes = (distance / speed) * 60
  // Adding dwell time of 30 seconds per intermediate stop (assume roughly 1 stop every 1.5km)
  const stopsLeft = Math.floor(distanceKm / 1.5);
  const dwellTimeMinutes = stopsLeft * 0.5;
  const driveTimeMinutes = (distanceKm / speedKmph) * 60;

  return Math.max(1, Math.round(driveTimeMinutes + dwellTimeMinutes));
}

export function calculateFare(distanceKm: number): number {
  const baseFare = 10;
  const distanceRate = 1.76;
  // Floor the value or round it appropriately
  return Math.round(baseFare + (distanceKm * distanceRate));
}
