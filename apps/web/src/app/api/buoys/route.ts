import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // optional

type BuoyEntry = { id: string; lake: string; lat: number; lng: number };

async function fetchBuoyData(station: string) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`;
  try {
    const text = await fetch(url, { cache: "no-store" }).then((r) => r.text());
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

export async function GET(req: Request) {
  // Load buoys list from static asset
  const listUrl = new URL("/data/buoys.json", req.url);
  const listRes = await fetch(listUrl.toString(), { cache: "no-store" });
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to load buoy list" }, { status: listRes.status });
  }
  const buoys = (await listRes.json()) as BuoyEntry[];

  const results = await Promise.all(
    buoys.map(async (b) => {
      const live = await fetchBuoyData(b.id);
      return live ? { ...b, ...live } : { ...b, error: "No live data" };
    })
  );

  return NextResponse.json(results);
}
