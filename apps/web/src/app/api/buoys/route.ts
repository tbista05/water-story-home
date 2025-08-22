import { NextResponse } from "next/server";
import fs from "fs/promises";
import { BUOYS_FILE } from "@/src/lib/server/paths";
import { fetchBuoyData } from "@/src/lib/server/buoys";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const raw = await fs.readFile(BUOYS_FILE, "utf-8");
    const buoys: Array<{ id: string; lake: string; lat: number; lng: number }> = JSON.parse(raw);

    const results = await Promise.all(
      buoys.map(async (b) => {
        const live = await fetchBuoyData(b.id);
        return live ? { ...b, ...live } : { ...b, error: "No live data" };
      })
    );

    return NextResponse.json(results);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load buoy list" }, { status: 500 });
  }
}
