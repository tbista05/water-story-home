import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";        // ensure serverless, no static caching
// export const revalidate = 0;                 // optional: also disables ISR

type BuoyEntry = { id: string; lake: string; lat: number; lng: number };

const BUOYS_FILE = path.join(process.cwd(), "src", "data", "buoys.json");

// Fetch NOAA buoy data
async function fetchBuoyData(station: string) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) return null;

    const cols = lines[0].replace(/^#/, "").trim().split(/\s+/);
    const latest = lines[lines.length - 1].trim().split(/\s+/);

    const iWTMP = cols.indexOf("WTMP");
    const iWSPD = cols.indexOf("WSPD");
    const iWVHT = cols.indexOf("WVHT");

    const wtmp = iWTMP >= 0 ? parseFloat(latest[iWTMP]) : NaN;
    const wspd = iWSPD >= 0 ? parseFloat(latest[iWSPD]) : NaN;
    const wvht = iWVHT >= 0 ? parseFloat(latest[iWVHT]) : NaN;

    const fahrenheit = Number.isNaN(wtmp) ? null : (wtmp * 9) / 5 + 32;

    return {
      station,
      waterTemp: fahrenheit,
      windSpeed: Number.isNaN(wspd) ? null : wspd,
      waveHeight: Number.isNaN(wvht) ? null : wvht,
      time: `${latest[0]}/${latest[1]}/${latest[2]} ${latest[3]}:${latest[4]}`,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const raw = await fs.readFile(BUOYS_FILE, "utf-8");
    const buoys: BuoyEntry[] = JSON.parse(raw);

    const results = await Promise.all(
      buoys.map(async (buoy) => {
        const liveData = await fetchBuoyData(buoy.id);
        return liveData ? { ...buoy, ...liveData } : { ...buoy, error: "No live data" };
      })
    );

    return NextResponse.json(results);
  } catch (err) {
    console.error("[api/buoys] error:", err);
    return NextResponse.json({ error: "Failed to load buoy list" }, { status: 500 });
  }
}
