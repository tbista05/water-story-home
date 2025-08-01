'use client';

import { useRef, useEffect, useState, useMemo } from 'react'; // Added useMemo for colorScale
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'; // Circle remains, but consider CircleMarker for performance
import L, { LatLngExpression, Map as LeafletMap } from 'leaflet'; // Added LeafletMap type
import 'leaflet/dist/leaflet.css';
import chroma from 'chroma-js'; 

type Buoy = {
  lat: number;
  lng: number;
  id: string;
  waterTemp?: number | null;
  windSpeed?: number | null;
  waveHeight?: number | null;
}

interface ChlorophyllDataPoint {
  lat: number;
  lng: number;
  value: number; // Represents chlorophyll concentration
}

type LakeMapProps = {
  center: LatLngExpression;
  zoom: number;
  habs: ChlorophyllDataPoint[]; 
  buoys: Buoy[];
  activeLayer: 'habs' | 'buoys';
  onBuoyClick?: (buoy: Buoy) => void;
};

// buoy marker (unchanged)
const buoyIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [15, 15],
  iconAnchor: [12, 12],
});

// Component to trigger map recentering when props.center changes (unchanged, includes necessary map check)
function ChangeView({ center, zoom }: { center: LatLngExpression, zoom: number }) {
  const map = useMap();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!map) {
      console.warn('Map instance not available in ChangeView useEffect.');
      return;
    }

    const newLatLng = L.latLng(center);
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();

    if (initialLoadRef.current || !currentCenter.equals(newLatLng) || currentZoom !== zoom) {
      console.log(`[ChangeView] Setting map view to: Center ${newLatLng.lat}, ${newLatLng.lng}, Zoom: ${zoom}`);
      map.setView(newLatLng, zoom);
    }
    initialLoadRef.current = false;
  }, [center, zoom, map]);

  return null;
}

export default function LakeMap({ center, zoom, habs, buoys, activeLayer, onBuoyClick }: LakeMapProps) {
  // Use state to hold the map instance reference (unchanged, not strictly needed for ChangeView but harmless)
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);

  const handleMapReady = (map: LeafletMap) => {
    setMapInstance(map);
    console.log("MapContainer: Map instance created and ready!", map);
  };

  // defines the continuous color scale using useMemo
  const chlorophyllColorScale = useMemo(() => {
    // Define the colors for your gradient. These should visually align with your domain values.
    return chroma.scale(['#a8e063', '#f9d423', '#fc913a', '#ff4e50']) // Green -> Yellow -> Orange -> Red
                 // Define the data values that correspond to each color.
                 // This maps 0 to #a8e063, 4 to #f9d423, 7 to #fc913a, 10 to #ff4e50.
                 .domain([0, 4, 7, 10]);
  }, []); // Empty dependency array ensures it's created only once

  function MapReadyHandler({ onReady }: { onReady: (map: LeafletMap) => void }) {
    const map = useMap();

    useEffect(() => {
      onReady(map);
    }, [map]);

    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      className="h-full w-full z-10" 
    >
      <MapReadyHandler onReady={handleMapReady}/>
      {/* Conditionally render ChangeView only when mapInstance is available from whenReady */}
      {mapInstance && <ChangeView center={center} zoom={zoom} />}
      
      <TileLayer
        attribution='Map data © OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Show Chlorophyll data - MODIFIED TO USE GRADIENT */}
      {activeLayer === 'habs' &&
        habs.map((dataPoint, i) => (
          <Circle // Using Circle. If performance is an issue with many points, consider CircleMarker or clustering
            key={`chlorophyll-${i}`}
            center={[dataPoint.lat, dataPoint.lng]}
            radius={1500} // Radius in meters. Adjust as needed for visual representation.
            pathOptions={{
              color: '#333', // Border color of the circle
              weight: 0,      // Border weight
              fillColor: chlorophyllColorScale(dataPoint.value).hex(), // ✨ Use the gradient color from chroma.js
              fillOpacity: .9 // Opacity of the fill color
            }}
          >
            <Popup>
              <strong>Chlorophyll:</strong> {dataPoint.value.toFixed(2)} ug/L <br />
              Lat: {dataPoint.lat.toFixed(4)}, Lng: {dataPoint.lng.toFixed(4)}
            </Popup>
          </Circle>
        ))}

      {/* Show Buoy markers */}
      {activeLayer === 'buoys' &&
        buoys.map((buoy, i) => (
          <Marker 
            key={i} 
            position={[buoy.lat, buoy.lng]} 
            icon={buoyIcon}
            eventHandlers={{
              click: () => {
                if (onBuoyClick) { // Ensure the prop exists before calling
                  onBuoyClick(buoy);
                }
              },
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>Buoy ID:</strong> {buoy.id}
                <br />
                🌡 Temp: {buoy.waterTemp ?? '--'} °F {/* Assumes backend now sends Fahrenheit */}
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