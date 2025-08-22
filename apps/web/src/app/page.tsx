'use client';

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { locations } from "../lib/lakeData";
import Timeline from '../components/Timeline';
import { Droplets, X, Thermometer, Wind, Waves } from "lucide-react";

// Dynamically import the map component only on client
const LakeMap = dynamic(() => import("@/components/LakeMap"), { ssr: false });

type Region = keyof typeof locations;
type Layer = 'habs' | 'buoys';

interface ChlorophyllDataPoint {
  lat: number;
  lng: number;
  value: number;
}

type ExistingBuoy = {
  lat: number;
  lng: number;
  id: string;
  waterTemp?: number | null;
  windSpeed?: number | null;
  waveHeight?: number | null;
  // added so we can filter by lake without using `any`
  lake?: Region;
};

// --- Helper function to generate all monthly dates ---
function generateMonthlyDates(startYear: number, startMonth: number, endYear: number, endMonth: number): string[] {
  const dates: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    const currentMonth = (year === startYear) ? startMonth : 1;
    const maxMonth = (year === endYear) ? endMonth : 12;

    for (let month = currentMonth; month <= maxMonth; month++) {
      const yearMonth = `${year}-${String(month).padStart(2, '0')}`;
      dates.push(yearMonth);
    }
  }
  return dates;
}

// helper function to calculate average and severity
interface SeverityInfo {
  label: string;
  className: string;
}

const getChlorophyllSeverity = (averageValue: number): SeverityInfo => {
  if (averageValue >= 7) {
    return { label: 'Severe', className: 'bg-red-100 text-red-800' };
  } else if (averageValue >= 4) {
    return { label: 'High', className: 'bg-orange-100 text-orange-800' };
  } else if (averageValue >= 2) {
    return { label: 'Moderate', className: 'bg-yellow-100 text-yellow-800' };
  } else if (averageValue >= 0) {
    return { label: 'Low', className: 'bg-green-100 text-green-800' };
  }
  return { label: 'N/A', className: 'bg-gray-100 text-gray-800' };
};

export default function Home() {
  const [selectedRegion, setSelectedRegion] = useState<Region>('erie');
  const [activeLayer, setActiveLayer] = useState<Layer>('habs');

  const [existingBuoys, setExistingBuoys] = useState<ExistingBuoy[]>([]);

  const [chlorophyllData, setChlorophyllData] = useState<ChlorophyllDataPoint[]>([]);

  const [loadingExistingBuoys, setLoadingExistingBuoys] = useState(true);
  const [errorExistingBuoys, setErrorExistingBuoys] = useState<string | null>(null);

  const [loadingChlorophyll, setLoadingChlorophyll] = useState(true);
  const [errorChlorophyll, setErrorChlorophyll] = useState<string | null>(null);

  const [selectedBuoy, setSelectedBuoy] = useState<ExistingBuoy | null>(null);

  const current = locations[selectedRegion];

  // Generate all available dates once using useMemo
  const allAvailableDates = useMemo(() => generateMonthlyDates(2018, 5, 2024, 5), []);
  const [selectedYearMonth, setSelectedYearMonth] = useState<string>(allAvailableDates[0]);

  // Fetch buoy list 
  useEffect(() => {
    setLoadingExistingBuoys(true);
    setErrorExistingBuoys(null);
    setSelectedBuoy(null);

    fetch("/api/buoys", { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ExistingBuoy[]>;
      })
      .then((data) => {
        const filtered = data.filter((b) => b.lake === selectedRegion);
        setExistingBuoys(filtered);
      })
      .catch(err => {
        console.error("Failed to load existing buoy data", err);
        setErrorExistingBuoys("Failed to load existing buoy data.");
        setExistingBuoys([]);
      })
      .finally(() => {
        setLoadingExistingBuoys(false);
      });
  }, [selectedRegion]);

  // Fetch CHLOROPHYLL data (for 'habs' layer)
  useEffect(() => {
    setLoadingChlorophyll(true);
    setErrorChlorophyll(null);

    if (!selectedRegion || !selectedYearMonth) {
      setLoadingChlorophyll(false);
      return;
    }

    const chlorophyllApiUrl = `/api/chlorophyll/${selectedRegion}/${selectedYearMonth}`;
    
    fetch(chlorophyllApiUrl, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Chlorophyll data for "${selectedRegion}" in ${selectedYearMonth} not found.`);
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json() as Promise<ChlorophyllDataPoint[]>;
      })
      .then((data) => {
        const sampleRate = 20;
        const sampledData = data.filter((_, index) => index % sampleRate === 0);
        setChlorophyllData(sampledData);
      })
      .catch(err => {
        console.error("Failed to load chlorophyll data", err);
        setErrorChlorophyll(err.message || "Failed to load chlorophyll data.");
        setChlorophyllData([]);
      })
      .finally(() => {
        setLoadingChlorophyll(false);
      });
  }, [selectedRegion, selectedYearMonth]);

  const handleYearMonthChange = (yearMonth: string) => {
    setSelectedYearMonth(yearMonth);
  };

  const handleBuoyClick = (buoy: ExistingBuoy) => {
    console.log("[DEBUG] Buoy clicked:", buoy);
    setSelectedBuoy(buoy);
  };

  const averageChlorophyll = useMemo(() => {
    if (chlorophyllData.length === 0) return 0;
    const sum = chlorophyllData.reduce((acc, point) => acc + point.value, 0);
    return sum / chlorophyllData.length;
  }, [chlorophyllData]);

  const { label: severityLabel, className: severityClass } = useMemo(() => {
    return getChlorophyllSeverity(averageChlorophyll);
  }, [averageChlorophyll]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">WaterStory Dashboard</h1>
            </div>

            {/* NAV DISABLED FOR SHOWCASE: no clickable links */}
            <nav className="hidden md:flex space-x-8">
              <span className="text-blue-600 font-medium cursor-default select-none">Overview</span>
              <span className="text-gray-400 cursor-not-allowed select-none" title="Coming soon">Alerts and Announcements</span>
              <span className="text-gray-400 cursor-not-allowed select-none" title="Coming soon">Forecasts</span>
              <span className="text-gray-400 cursor-not-allowed select-none" title="Coming soon">Historical Data</span>
            </nav>

            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Live Data</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-6 flex flex-col">

        <div className="flex flex-wrap gap-4 justify-center mb-6">
          <div className="flex space-x-2">
            {(Object.keys(locations) as Region[]).map((key) => (
              <button
                key={key}
                onClick={() => setSelectedRegion(key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${selectedRegion === key ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveLayer('habs')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeLayer === 'habs' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Show Chlorophyll (HABs)
            </button>
            <button
              onClick={() => setActiveLayer('buoys')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${activeLayer === 'buoys' ? 'bg-yellow-600 text-white shadow-md' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              Show Buoys (Data)
            </button>
          </div>
        </div>

        <section className="mb-8 flex-grow">
          <div className="glass-card rounded-3xl p-6 shadow-lg h-full flex flex-col">

            {/* Map Header/Title part - DYNAMICALLY CHANGED HERE */}
            <div className="flex justify-between items-center mb-4">
              <div>
                {activeLayer === 'habs' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">Harmful Algal Bloom Status</h2>
                    <p className="text-gray-600">Historical satellite monitoring (2018 - 2024)</p>
                  </>
                )}
                {activeLayer === 'buoys' && (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900">Buoy Data Overview</h2>
                    <p className="text-gray-600">Real-time buoy monitoring</p>
                  </>
                )}
              </div>

              {activeLayer === 'habs' && chlorophyllData.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <span className={`${severityClass} px-2 py-1 rounded-full text-xs font-medium`}>
                    {severityLabel}
                  </span>
                  <span className={`bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium`}>
                    Index: {averageChlorophyll.toFixed(2)}
                  </span>
                </div>
              ) : activeLayer === 'habs' && loadingChlorophyll ? (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  Calculating Index...
                </div>
              ) : activeLayer === 'habs' && errorChlorophyll ? (
                <div className="flex items-center space-x-2 text-sm text-red-600">
                  No Index
                </div>
              ) : activeLayer === 'buoys' && (
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    Showing Live Data
                  </span>
                </div>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden flex-grow" style={{ height: "70vh" }}>
              <LakeMap
                center={current.center}
                zoom={current.zoom}
                habs={chlorophyllData}
                buoys={existingBuoys}
                activeLayer={activeLayer}
                onBuoyClick={handleBuoyClick}
              />

              {(loadingChlorophyll && activeLayer === 'habs') || (loadingExistingBuoys && activeLayer === 'buoys') ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-20 rounded-2xl">
                  <p className="text-lg text-gray-700">
                    {activeLayer === 'habs' ? `Loading chlorophyll data for ${selectedYearMonth}...` : "Loading existing buoy data..."}
                  </p>
                </div>
              ) : (errorChlorophyll && activeLayer === 'habs') || (errorExistingBuoys && activeLayer === 'buoys') ? (
                <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-90 z-20 rounded-2xl">
                  <p className="text-lg text-red-700">
                    Error: {activeLayer === 'habs' ? errorChlorophyll : errorExistingBuoys}
                  </p>
                </div>
              ) : null}

              {activeLayer === 'habs' && (
                <div className="absolute bottom-4 left-4 glass-card rounded-xl p-4 z-15">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Chlorophyll Index</h4>
                  <div
                    className="w-full h-4 rounded-full mb-2"
                    style={{ background: 'linear-gradient(to right, #a8e063 0%, #f9d423 40%, #fc913a 70%, #ff4e50 100%)' }}
                  />
                  <div className="flex justify-between text-xs text-gray-700">
                    <span>0</span>
                    <span>4</span>
                    <span>7</span>
                    <span>10+</span>
                  </div>
                </div>
              )}
            </div>

            {activeLayer === 'buoys' && selectedBuoy && (
              <div className="glass-card bg-white/95 rounded-xl p-6 shadow-lg mt-6 border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Buoy Details: {selectedBuoy.id}</h3>
                  <button
                    onClick={() => setSelectedBuoy(null)}
                    className="text-gray-500 hover:text-gray-900"
                    title="Close details"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-gray-700">
                  {selectedBuoy.waterTemp !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Thermometer size={18} className="text-blue-500 flex-shrink-0" />
                      <span className="text-lg">
                        Temperature: <span className="font-semibold">
                          {selectedBuoy.waterTemp != null ? `${selectedBuoy.waterTemp.toFixed(1)}°F` : '--°F'}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedBuoy.windSpeed !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Wind size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-lg">
                        Wind Speed: <span className="font-semibold">
                          {selectedBuoy.windSpeed != null ? `${selectedBuoy.windSpeed.toFixed(1)} m/s` : '-- m/s'}
                        </span>
                      </span>
                    </div>
                  )}
                  {selectedBuoy.waveHeight !== undefined && (
                    <div className="flex items-center space-x-2">
                      <Waves size={18} className="text-purple-500 flex-shrink-0" />
                      <span className="text-lg">
                        Wave Height: <span className="font-semibold">
                          {selectedBuoy.waveHeight != null ? `${selectedBuoy.waveHeight.toFixed(1)} m` : '-- m'}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeLayer === 'habs' && (
              <Timeline
                availableDates={allAvailableDates}
                selectedYearMonth={selectedYearMonth}
                onYearMonthChange={handleYearMonthChange}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="font-semibold text-gray-900 mb-3">Data Sources</h5>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>NOAA/GLERL Monitoring</li>
                <li>EPA Great Lakes Quality</li>
                <li>Michigan State University</li>
                <li>Alliance for Great Lakes</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
