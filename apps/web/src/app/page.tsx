'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component *only on the client*
const HABMap = dynamic(() => import("@/components/HABMap"), {
  ssr: false,
});

const locations = {
  lakeErie : {
    center: [41.7, -82.6] as [number, number],
    blooms : [
      { lat: 41.7, lng: -83.3, intensity: 'high' as const },
      { lat: 41.9, lng: -82.0, intensity: 'moderate' as const },
    ],
  },

  saginawBay : {
    center: [43.7, -83.6] as [number, number],
    blooms : [
      { lat: 43.8, lng: -83.5, intensity: 'moderate' as const },
      { lat: 43.6, lng: -83.7, intensity: 'low' as const },
    ],
  },
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [selectedRegion, setSelectedRegion] = useState<'lakeErie' | 'saginawBay'>('lakeErie');
  const current = locations[selectedRegion];

return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🌊 Lake Erie Dashboard</h1>

      {/* Region toggle */}
      <div className="mb-4 space-x-2">
        <button
          onClick={() => setSelectedRegion('lakeErie')}
          className={`px-4 py-2 rounded ${selectedRegion === 'lakeErie' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Lake Erie
        </button>
        <button
          onClick={() => setSelectedRegion('saginawBay')}
          className={`px-4 py-2 rounded ${selectedRegion === 'saginawBay' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Saginaw Bay
        </button>
      </div>

      {/* 🗺️ Map Display */}
      <HABMap center={current.center} bloomLocations={current.blooms} />
    </main>
  );
}

//   return (
//     <main className="p-6">
//       <h1 className="text-2xl font-bold">🌊 Lake Erie Dashboard</h1>
//       {data ? (
//         <pre className="mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
//       ) : (
//         <p>Loading data from backend...</p>
//       )}
//     </main>
//   );
// }