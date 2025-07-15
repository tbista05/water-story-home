'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css';

type Bloom = {
  lat: number;
  lng: number;
  intensity: 'low' | 'moderate' | 'high';
};

type HABMapProps = {
  center: LatLngExpression;
  bloomLocations: Bloom[];
};

// Component to trigger map recentering when props.center changes
function ChangeView({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

export default function HABMap({ center, bloomLocations }: HABMapProps) {
  return (
    <MapContainer center={center} zoom={7} style={{ height: '500px', width: '100%' }}>
      <ChangeView center={center}/>
      <TileLayer
        attribution='Map data © OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {bloomLocations.map((bloom, i) => (
        <Circle
          key={i}
          center={[bloom.lat, bloom.lng]}
          radius={10000}
          pathOptions={{
            color: bloom.intensity === 'high' ? 'red' : 'orange',
            fillOpacity: 0.5,
          }}
        >
          <Popup>
            HAB Intensity: <strong>{bloom.intensity}</strong>
          </Popup>
        </Circle>
      ))}
    </MapContainer>
  );
}