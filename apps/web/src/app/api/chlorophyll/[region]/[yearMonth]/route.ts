import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type Params = { params: { region: string; yearMonth: string } };

// read JSON files from: apps/web/src/data/<region>/<YYYY-MM>.json
function chlorophyllPath(region: string, yearMonth: string) {
  return path.join(process.cwd(), "apps", "web", "src", "data", region, `${yearMonth}.json`);
}

export const dynamic = "force-dynamic"; // avoid static caching if you want fresh reads

export async function GET(_req: Request, { params }: Params) {
  const { region, yearMonth } = params;

  // Validate YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return NextResponse.json(
      { error: "Invalid yearMonth format. Expected YYYY-MM." },
      { status: 400 }
    );
  }

  const filePath = chlorophyllPath(region, yearMonth);

  try {
    await fs.access(filePath); // ensure file exists
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    // Keep only numeric values
    const filtered = Array.isArray(parsed)
      ? parsed.filter((dp: any) => typeof dp?.value === "number" && !Number.isNaN(dp.value))
      : [];

    return NextResponse.json(filtered, { status: 200 });
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return NextResponse.json(
        { message: `Chlorophyll data not found for ${region} in ${yearMonth}.` },
        { status: 404 }
      );
    }
    console.error("[chlorophyll] Unexpected error:", e);
    return NextResponse.json(
      { message: "Internal server error fetching chlorophyll data." },
      { status: 500 }
    );
  }
}
