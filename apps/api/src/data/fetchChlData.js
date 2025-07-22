// FILE: scripts/fetchChlData.js

import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://apps.glerl.noaa.gov/erddap/griddap/LH_CHL_VIIRS_Monthly_Avg.csv?Chlorophyll%5B(2020-05-15T12:00:00Z):1:(2020-05-15T12:00:00Z)%5D%5B(42.9276153373726):1:(46.5127142483862)%5D%5B(-85.1764000001763):1:(-79.8238439100497)%5D'
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'erie');
const OUTPUT_FILE = path.join(OUTPUT_DIR, '2020-05.json');

async function fetchAndProcess() {
  try {
    const res = await fetch(url);
    const text = await res.text();

    const records = parse(text, {
        columns: true,
        skip_empty_lines: true,
        from_line: 3, // ✅ Skip metadata & units rows
    });

    const cleaned = records
        .filter(row => row['Chlorophyll'] !== 'NaN')
        .map(row => ({
            lat: parseFloat(row['latitude']),
            lng: parseFloat(row['longitude']),
            value: parseFloat(row['Chlorophyll']),
        }));

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cleaned, null, 2));

    console.log(`✅ Saved ${cleaned.length} records to ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Failed to fetch or process data:', err);
  }
}

fetchAndProcess();