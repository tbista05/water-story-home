'use client'; // Marking as client component as it might eventually have interactive elements

import React from 'react';
import Link from 'next/link'; // For navigation
import { ChevronLeft } from 'lucide-react'; // Example icon for back button
import { Droplets } from "lucide-react"; // Reusing the icon from your main page header

export default function HistoricalDataPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Re-use your existing header structure for consistency */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            {/* Back button to the dashboard */}
            <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-5 h-5" />
              <span className="text-lg font-semibold">Back to Dashboard</span>
            </Link>

            {/* Page Title */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Historical Data</h1>
            </div>

            {/* Live Data / Other Header elements - adjust as needed */}
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Archived Data</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Explore Historical Great Lakes Data</h2>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-2xl font-semibold text-blue-700 mb-4">Past Water Quality Trends</h3>
          <p className="text-gray-700 leading-relaxed">
            Dive into extensive archives of water temperature, chlorophyll levels, and other key indicators over the years for each of the Great Lakes. Understand long-term changes and patterns.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
            <li>Data available from 2000 to present (placeholder)</li>
            <li>Interactive charts and graphs coming soon! (placeholder)</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-2xl font-semibold text-green-700 mb-4">Buoy Data Archives</h3>
          <p className="text-gray-700 leading-relaxed">
            Access a historical record of buoy readings, including wind speed, wave height, and more, providing insights into past weather and water conditions.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
            <li>Searchable by buoy ID and date range (placeholder)</li>
            <li>Downloadable datasets for research (placeholder)</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-semibold text-purple-700 mb-4">Environmental Events History</h3>
          <p className="text-gray-700 leading-relaxed">
            Review records of significant environmental events, such as major algal blooms, storm events, or pollution incidents, and their impact on the Great Lakes.
          </p>
          <ul className="list-disc list-inside mt-4 text-gray-600 space-y-2">
            <li>Case studies and reports (placeholder)</li>
            <li>Annual summaries and trends (placeholder)</li>
          </ul>
        </section>
      </main>

      {/* Re-use your existing footer for consistency */}
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
            {/* Add other footer columns if they exist in your main layout */}
          </div>
        </div>
      </footer>
    </div>
  );
}