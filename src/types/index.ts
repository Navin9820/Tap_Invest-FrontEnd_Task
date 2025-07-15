export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number;
  accuracy: number;
}

export interface WorkoutData {
  id: string;
  startTime: number;
  endTime: number | null;
  distance: number;
  duration: number;
  route: RoutePoint[];
  averageSpeed: number;
  maxSpeed: number;
  calories: number;
}

export interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
}