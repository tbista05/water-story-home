'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Info, Droplets, AlertTriangle, Wind } from 'lucide-react';

 // The data structure we expect from our API
interface BulletinResponse {
  announcements: string[];
}

 export default function AlertsPage() {
    const LAKES = ['Superior', 'Michigan', 'Huron', 'Erie', 'Ontario'];
    const [selectedLake, setSelectedLake] = useState<string>(LAKES[0]);
    const [bulletin, setBulletin] = useState<BulletinResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!selectedLake) return;

        const fetchBulletin = async () => {
            setLoading(true);
            setError(null);
            setBulletin(null);
            try {
                const response = await fetch(`http://localhost:3001/api/bulletin/${selectedLake.toLowerCase()}`);
                
                // Check for a non-ok response and attempt to parse error JSON
                if (!response.ok) {
                    let errorMsg = `An error occurred: ${response.statusText}`;
                    try {
                        // Attempt to get more specific error from the response body
                        const errData = await response.json();
                        errorMsg = errData.error || "Failed to fetch bulletin. The server returned an error.";
                    } catch (e) {
                        // If the error response isn't JSON, use the status text
                        console.error("Could not parse error JSON from server.", e);
                    }
                    throw new Error(errorMsg);
                }

                const data: BulletinResponse = await response.json();
                setBulletin(data);

            } catch (err: any) {
                // Catches both network errors and errors thrown from non-ok responses
                setError(err.message);
                console.error("Error fetching bulletin:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBulletin();
    }, [selectedLake]); // This effect re-runs whenever selectedLake changes

  return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            {/* Unified Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-semibold">Back to Dashboard</span>
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900">Great Lakes Alerts & Announcements</h1>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

                {/* --- Bulletin Section (Top Attraction) --- */}
                <div className="mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Lake Bulletin 🌊</h2>
                    <p className="text-lg text-gray-600 mb-6">Select a lake to view the latest real-time alerts and advisories.</p>

                    {/* Lake Selector */}
                    <div className="mb-8">
                        <div className="flex flex-wrap gap-3">
                            {LAKES.map(lake => (
                                <button
                                    key={lake}
                                    onClick={() => setSelectedLake(lake)}
                                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                        selectedLake === lake
                                            ? 'bg-blue-600 text-white shadow-md ring-2 ring-offset-2 ring-blue-500'
                                            : 'bg-white text-gray-800 hover:bg-gray-200 border border-gray-300'
                                    }`}
                                >
                                    {lake}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bulletin Display Area */}
                    <div className="bg-white rounded-lg shadow-xl p-6 md:p-8 min-h-[20rem] flex flex-col justify-center">
                        {loading && (
                            <div className="text-center text-gray-500">
                                <Wind className="animate-spin h-8 w-8 mx-auto mb-3" />
                                <p>Generating latest bulletin for Lake {selectedLake}...</p>
                            </div>
                        )}

                        {error && (
                            <div className="text-center text-red-600">
                                <AlertTriangle className="h-8 w-8 mx-auto mb-3" />
                                <p className="font-semibold">Could not load bulletin:</p>
                                <p>{error}</p>
                            </div>
                        )}

                        {!loading && !error && bulletin && (
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Lake {selectedLake} Bulletin</h3>
                                <ul className="space-y-3">
                                    {bulletin.announcements.map((item, index) => (
                                        <li key={index} className="flex items-start">
                                            <Info className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Horizontal Divider --- */}
                <hr className="my-12 border-gray-200" />

                {/* --- Informative Sections (Below Bulletin) --- */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-gray-900">
                        General Information & Resources
                    </h2>

                    <section className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-2xl font-semibold text-blue-700 mb-4">Safety Information</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Stay informed about swimming advisories, harmful algal bloom warnings, and fish consumption guidelines. Always check local authorities for the most current safety alerts.
                        </p>
                        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
                            <li><a href="https://www.epa.gov/great-lakes-monitoring" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">EPA Great Lakes Monitoring</a></li>
                            <li><a href="https://www.glerl.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">NOAA Great Lakes Environmental Research Laboratory (GLERL)</a></li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-2xl font-semibold text-green-700 mb-4">Conservation Efforts</h3>
                        <p className="text-gray-700 leading-relaxed">
                            Discover initiatives dedicated to preserving the ecological health and biodiversity of the Great Lakes, from wetland restoration to invasive species management.
                        </p>
                        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
                            <li><a href="https://greatlakes.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Alliance for the Great Lakes</a></li>
                            <li><a href="https://www.nature.org/en-us/about-us/where-we-work/north-america/united-states/michigan/stories-in-michigan/great-lakes-conservation/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">The Nature Conservancy - Great Lakes</a></li>
                        </ul>
                    </section>

                    <section className="bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-2xl font-semibold text-purple-700 mb-4">Key Organizations</h3>
                        <p className="text-gray-700 leading-relaxed">
                            A list of prominent organizations providing valuable data, research, and advocacy for the Great Lakes.
                        </p>
                        <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
                            <li>International Joint Commission (IJC)</li>
                            <li>Council of Great Lakes Governors and Premiers</li>
                            <li>Great Lakes Commission</li>
                        </ul>
                    </section>
                </div>
            </main>

            {/* Unified Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <p className="text-center text-gray-500 text-sm">
                        © {new Date().getFullYear()} Great Lakes Information Portal. All Rights Reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}