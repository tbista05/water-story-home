import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: any) {
  // 👇 pull params from the untyped context and cast locally
  const { region, yearMonth } = ctx.params as { region: string; yearMonth: string };
  const lake = region.toLowerCase();

  // Validate YYYY-MM (01–12)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return NextResponse.json(
      { error: "Invalid yearMonth format. Expected YYYY-MM." },
      { status: 400 }
    );
  }

  const filePath = path.join(process.cwd(), "src", "data", lake, `${yearMonth}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf8"); // throws ENOENT if missing
    const parsed: Array<{ lat: number; lng: number; value: number }> = JSON.parse(raw);
    const filtered = parsed.filter((dp) => Number.isFinite(dp?.value));
    return NextResponse.json(filtered, { status: 200 });
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      return NextResponse.json(
        { message: `Chlorophyll data not found for ${lake} in ${yearMonth}.` },
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
