'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// types
type Bloom = {
  lat: number;
  lng: number;
  intensity: 'low' | 'moderate' | 'high';
};

type Buoy = {
  lat: number;
  lng: number;
  id: string;
  waterTemp?: number;
  windSpeed?: number;
  waveHeight?: number;
}

type LakeMapProps = {
  center: LatLngExpression;
  habs: Bloom[];
  buoys: Buoy[];
  activeLayer: 'habs' | 'buoys';
};

// buoy marker
const buoyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [25, 25],
  iconAnchor: [12, 12],
});

// Component to trigger map recentering when props.center changes
function ChangeView({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function LakeMap({ center, habs, buoys, activeLayer }: LakeMapProps) {
  return (
    <MapContainer center={center} zoom={7} style={{ height: '500px', width: '100%' }}>
      <ChangeView center={center}/>
      <TileLayer
        attribution='Map data © OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* ✅ Show HAB markers */}
      {activeLayer === 'habs' &&
        habs.map((bloom, i) => (
          <Circle
            key={i}
            center={[bloom.lat, bloom.lng]}
            radius={10000}
            pathOptions={{
              color: bloom.intensity === 'high' ? 'red' : bloom.intensity === 'moderate' ? 'orange' : 'green',
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              <strong>HAB Intensity:</strong> {bloom.intensity}
            </Popup>
          </Circle>
        ))}

      {/* ✅ Show Buoy markers */}
      {activeLayer === 'buoys' &&
        buoys.map((buoy, i) => (
          <Marker key={i} position={[buoy.lat, buoy.lng]} icon={buoyIcon}>
            <Popup>
              <div className="text-sm">
                <strong>Buoy ID:</strong> {buoy.id}
                <br />
                🌡 Temp: {buoy.waterTemp ?? '--'} °C
                <br />
                💨 Wind: {buoy.windSpeed ?? '--'} m/s
                <br />
                🌊 Wave: {buoy.waveHeight ?? '--'} m
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}