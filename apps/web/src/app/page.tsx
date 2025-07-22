'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { locations } from "../lib/lakeData";

// Dynamically import the map component only on client
const LakeMap = dynamic(() => import("@/components/LakeMap"), {
  ssr: false,
});

type Region = keyof typeof locations;
type Layer = 'habs' | 'buoys';

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<Region>('erie');
  const [activeLayer, setActiveLayer] = useState<Layer>('habs');
  const [buoys, setBuoys] = useState<any[]>([]);

  const current = locations[selectedRegion];

  // 🚀 Fetch buoy list (placeholder — can later be real API or different per region)
  useEffect(() => {
  fetch("http://localhost:3001/api/buoys")
    .then(res => res.json())
    .then(data => {
      const filtered = data.filter((b: any) => b.lake === selectedRegion);
      setBuoys(filtered);
    })
    .catch(err => console.error("Failed to load buoy data", err));
}, [selectedRegion]);

  return (
    <main className="p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-4">🌊 WaterStory Dashboard</h1>

      {/* 🌐 Region toggle */}
      <div className="mb-4 space-x-2">
        {Object.entries(locations).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setSelectedRegion(key as Region)}
            className={`px-4 py-2 rounded ${selectedRegion === key ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* 🗂 Layer toggle */}
      <div className="mb-4 space-x-2">
        <button
          onClick={() => setActiveLayer('habs')}
          className={`px-4 py-2 rounded ${activeLayer === 'habs' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          Show HABs
        </button>
        <button
          onClick={() => setActiveLayer('buoys')}
          className={`px-4 py-2 rounded ${activeLayer === 'buoys' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}
        >
          Show Buoys
        </button>
      </div>

      {/* 🗺️ Map Display */}
      <LakeMap
        center={current.center}
        habs={current.blooms}
        buoys={buoys}
        activeLayer={activeLayer}
      />
    </main>
  );
}