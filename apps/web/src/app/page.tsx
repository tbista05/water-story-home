'use client';

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import the map component *only on the client*
const LakeErieMap = dynamic(() => import("@/components/LakeErieMap"), {
  ssr: false,
});

export default function Home() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/mock-data")
      .then(res => res.json())
      .then(setData);
  }, []);

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

return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">🌊 Lake Erie Dashboard</h1>

      {/* 🗺️ Map Display */}
      <LakeErieMap />

      {/* 📦 API Data Preview */}
      {data ? (
        <pre className="mt-4 bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        <p>Loading data from backend...</p>
      )}
    </main>
  );
}