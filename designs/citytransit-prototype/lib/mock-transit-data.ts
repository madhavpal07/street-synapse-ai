import { Route, Stop } from "@/types/transit";

export const mockStops: Stop[] = [
  { id: "s1", name: "Quantum University Main Gate", latitude: 29.9329, longitude: 77.7811, sequence: 1, status: "passed", estimatedArrival: "10:14 AM" },
  { id: "s2", name: "Solani Park", latitude: 29.8687, longitude: 77.8931, sequence: 2, status: "passed", estimatedArrival: "10:18 AM" },
  { id: "s3", name: "Civil Lines", latitude: 29.8643, longitude: 77.8911, sequence: 3, status: "passed", estimatedArrival: "10:22 AM" },
  { id: "s4", name: "Railway Crossing", latitude: 29.8621, longitude: 77.8900, sequence: 4, status: "upcoming", estimatedArrival: "10:29 AM" },
  { id: "s5", name: "Roorkee Bus Stand", latitude: 29.8576, longitude: 77.8887, sequence: 5, status: "upcoming", estimatedArrival: "10:35 AM" },
  { id: "s6", name: "Main Bazaar", latitude: 29.8550, longitude: 77.8870, sequence: 6, status: "upcoming", estimatedArrival: "10:39 AM" },
  { id: "s7", name: "Roorkee Railway Station", latitude: 29.8718, longitude: 77.8847, sequence: 7, status: "upcoming", estimatedArrival: "10:42 AM" },
];

export const mockRoute: Route = {
  id: "r104",
  number: "104",
  name: "Express",
  origin: "Quantum University Main Gate",
  destination: "ISBT",
  distanceKm: 25,
  durationMinutes: 28,
  stops: mockStops,
};

export const routeCoordinates: [number, number][] = [
  [29.9329, 77.7811],
  [29.9200, 77.8000],
  [29.9000, 77.8400],
  [29.8800, 77.8700],
  [29.8687, 77.8931],
  [29.8643, 77.8911],
  [29.8621, 77.8900],
  [29.8576, 77.8887],
  [29.8550, 77.8870],
  [29.8718, 77.8847]
];

export const mockTimetable = [
  "06:30 AM", "07:15 AM", "08:00 AM", "08:45 AM", "09:30 AM", "10:15 AM",
  "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM"
];
