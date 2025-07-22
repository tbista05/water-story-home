import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import fs from "fs/promises";

const app = express();
const PORT = 3001;

app.use(cors());

const BUOYS_FILE = path.join(__dirname, "data", "buoys.json");

// Helper to fetch live buoy data
async function fetchBuoyData(station: string) {
  const url = `https://www.ndbc.noaa.gov/data/realtime2/${station}.txt`;

  try {
    const text = await fetch(url).then((r) => r.text());
    const lines = text.trim().split("\n");
    const cols = lines[0].replace(/^#/, "").trim().split(/\s+/);
    const latest = lines[lines.length - 1].trim().split(/\s+/);

    const idx = {
      wtmp: cols.indexOf("WTMP"),
      wspd: cols.indexOf("WSPD"),
      wvht: cols.indexOf("WVHT"),
    };

    return {
      station,
      waterTemp: parseFloat(latest[idx.wtmp]),
      windSpeed: parseFloat(latest[idx.wspd]),
      waveHeight: parseFloat(latest[idx.wvht]),
      time: `${latest[0]}/${latest[1]}/${latest[2]} ${latest[3]}:${latest[4]}`,
    };
  } catch (err) {
    console.error(`Error fetching data for buoy ${station}`);
    return null; // Gracefully skip this buoy
  }
}

// 🔄 New route: returns all buoy info (coordinates + live data)
app.get("/api/buoys", async (req, res) => {
  try {
    const raw = await fs.readFile(BUOYS_FILE, "utf-8");
    const buoys = JSON.parse(raw);

    const results = await Promise.all(
      buoys.map(async (buoy: any) => {
        const liveData = await fetchBuoyData(buoy.id);
        return liveData
          ? { ...buoy, ...liveData }
          : { ...buoy, error: "No live data" };
      })
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load buoy list" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API server running on http://localhost:${PORT}`);
});

