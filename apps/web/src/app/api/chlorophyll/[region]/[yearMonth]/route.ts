import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // optional, but keeps it tiny

export async function GET(req: Request, ctx: any) {
  const { region, yearMonth } = ctx.params as { region: string; yearMonth: string };
  const lake = region.toLowerCase();

  // Validate YYYY-MM (01–12)
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(yearMonth)) {
    return NextResponse.json({ error: "Invalid yearMonth format. Expected YYYY-MM." }, { status: 400 });
  }

  // Fetch the static asset from /public/data
  const url = new URL(`/data/${lake}/${yearMonth}.json`, req.url);
  const res = await fetch(url.toString(), { cache: "no-store" });

  if (res.status === 404) {
    return NextResponse.json({ message: `Chlorophyll data not found for ${lake} in ${yearMonth}.` }, { status: 404 });
  }
  if (!res.ok) {
    return NextResponse.json({ message: `Upstream error ${res.status}` }, { status: res.status });
  }

  const parsed = (await res.json()) as Array<{ lat: number; lng: number; value: number }>;
  const filtered = parsed.filter((dp) => Number.isFinite(dp?.value));

  return NextResponse.json(filtered, { status: 200 });
}

