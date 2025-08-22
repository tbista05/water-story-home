import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type Params = { params: { region: string; yearMonth: string } };

export const dynamic = "force-dynamic"; // avoid static caching
// export const revalidate = 0;          // optional: also disables ISR

// reads: apps/web/src/data/<region>/<YYYY-MM>.json
function chlorophyllPath(region: string, yearMonth: string) {
  return path.join(process.cwd(), "src", "data", region.toLowerCase(), `${yearMonth}.json`);
}

export async function GET(_req: Request, { params }: Params) {
  const { region, yearMonth } = params;

  // Validate YYYY-MM (01-12 for month)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return NextResponse.json(
      { error: "Invalid yearMonth format. Expected YYYY-MM." },
      { status: 400 }
    );
  }

  const filePath = chlorophyllPath(region, yearMonth);

  try {
    const raw = await fs.readFile(filePath, "utf8");   // throws ENOENT if missing
    const parsed = JSON.parse(raw) as Array<{ lat: number; lng: number; value: number }>;

    const filtered = Array.isArray(parsed)
      ? parsed.filter((dp) => Number.isFinite(dp?.value))
      : [];

    return NextResponse.json(filtered, { status: 200 });
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return NextResponse.json(
        { message: `Chlorophyll data not found for ${region} in ${yearMonth}.` },
        { status: 404 }
      );
    }
    console.error("[api/chlorophyll] Unexpected error:", e);
    return NextResponse.json(
      { message: "Internal server error fetching chlorophyll data." },
      { status: 500 }
    );
  }
}
