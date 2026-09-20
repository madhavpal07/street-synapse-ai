export type Bus = {
  id: string;
  routeNumber: string;
  destination: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  status: "live" | "stale" | "offline";
  etaMinutes: number;
  distanceKm: number;
  amenities: string[];
};

export type Stop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  sequence: number;
  estimatedArrival?: string;
  status: "passed" | "current" | "upcoming";
};

export type Route = {
  id: string;
  number: string;
  name: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  stops: Stop[];
};

export type Fare = {
  baseFare: number;
  distanceFare: number;
  total: number;
};
