import { LatLngExpression } from "leaflet";

type Bloom = {
  lat: number;
  lng: number;
  intensity: 'low' | 'moderate' | 'high';
};

type RegionData = {
  center: LatLngExpression;
  blooms: Bloom[];
};

export const locations: Record<string, RegionData> = {
  erie: {
    center: [41.7, -82.6],
    blooms: [
      { lat: 41.7, lng: -83.3, intensity: 'high' },
      { lat: 41.9, lng: -82.0, intensity: 'moderate' },
    ],
  },
  huron: {
    center: [44.8, -82.4],
    blooms: [
      { lat: 44.9, lng: -82.5, intensity: 'moderate' },
    ],
  },
  michigan: {
    center: [44.0, -87.0],
    blooms: [
      { lat: 44.2, lng: -87.1, intensity: 'low' },
    ],
  },
  superior: {
    center: [47.7, -87.5],
    blooms: [
      { lat: 47.8, lng: -87.6, intensity: 'moderate' },
    ],
  },
  ontario: {
    center: [43.7, -77.9],
    blooms: [
      { lat: 43.6, lng: -77.8, intensity: 'high' },
    ],
  },
};
