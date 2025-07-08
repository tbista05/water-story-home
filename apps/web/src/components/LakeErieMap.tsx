'use client';

import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const lakeErieCenter: LatLngExpression = [41.7, -82.6];

const dummyBloomLocations = [
  { lat: 41.7, lng: -83.3, intensity: 'high' },
  { lat: 41.9, lng: -82.0, intensity: 'moderate' },
];

export default function LakeErieMap() {
  return (
    <MapContainer center={lakeErieCenter} zoom={7} style={{ height: '500px', width: '100%' }}>
      <TileLayer
        attribution='Map data © OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {dummyBloomLocations.map((bloom, i) => (
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