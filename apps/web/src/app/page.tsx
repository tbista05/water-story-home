'use client';

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/mock-data")
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">🌊 Lake Erie Dashboard</h1>
      {data ? (
        <pre className="mt-4 bg-gray-100 p-4 rounded">{JSON.stringify(data, null, 2)}</pre>
      ) : (
        <p>Loading data from backend...</p>
      )}
    </main>
  );
}