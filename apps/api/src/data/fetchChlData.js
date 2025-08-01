// FILE: scripts/fetchChlData.js

import fs from 'fs/promises';
import fetch from 'node-fetch';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the base directory for all data output
const BASE_OUTPUT_DIR = path.join(__dirname, '..', 'data'); // Points to apps/api/src/data

// Define bounding box coordinates for each Great Lake
const LAKE_BOUNDS = {
    superior: { latMin: 46.290877595506, latMax: 49.0622787250686, lonMin: -92.2393462144662, lonMax: -84.1590606615635 },
    michigan: { latMin: 41.3389808729367, latMax: 46.2093367308081, lonMin: -88.2680418693139, lonMax: -84.533234020258 },
    huron: { latMin: 42.9276153373726, latMax: 46.5127142483862, lonMin: -85.1764000001763, lonMax: -79.8238439100497 },
    erie: { latMin: 41.2690208353805, latMax: 43.0179972728271, lonMin: -83.6574899492178, lonMax: -78.4429490894234 },
    ontario: { latMin: 43.1018959037845, latMax: 44.5872516676337, lonMin: -79.9943010509483, lonMax: -76.0072934743003 },
};

const LAKE_ERDDAP_CODES = {
    superior: 'LS',
    michigan: 'LM',
    huron: 'LH',
    erie: 'LE',
    ontario: 'LO',
};

// Function to generate all monthly dates from 2018 to 2024
function generateMonthlyDates(startYear, startMonth, endYear, endMonth) {
    const dates = [];
    for (let year = startYear; year <= endYear; year++) {
        let currentMonth = (year === startYear) ? startMonth : 1; // Start from startMonth in startYear, otherwise from January
        let maxMonth = (year === endYear) ? endMonth : 12;      // Go up to endMonth in endYear, otherwise to December

        for (let month = currentMonth; month <= maxMonth; month++) {
            // Use 15th of the month for monthly average data points
            const date = new Date(Date.UTC(year, month - 1, 15, 12, 0, 0)); // Month is 0-indexed
            dates.push(date.toISOString()); // Format as YYYY-MM-DDTHH:MM:SSZ
        }
    }
    return dates;
}

const MONTHLY_DATES = generateMonthlyDates(2018, 5, 2024, 5);

// 403 error no more -- values to where you want the script to resume
const RESUME_FROM_LAKE = 'ontario'; 
const RESUME_FROM_YEAR_MONTH = '2023-11'; 

async function fetchAndProcess() {
    console.log('Starting data download for all Great Lakes (May 2018 - May 2024)...');
    console.log(`Script will resume from: ${RESUME_FROM_LAKE} - ${RESUME_FROM_YEAR_MONTH}`);

    let resumeLakeFound = false;
    let resumeDateFound = false;

    for (const lakeName in LAKE_BOUNDS) {
        if (!resumeLakeFound) {
            if (lakeName === RESUME_FROM_LAKE) {
                resumeLakeFound = true;
            } else {
                console.log(`Skipping lake: ${lakeName} (before resume point)`);
                continue; // Skip to the next lake until resumeLakeFound is true
            }
        }

        const { latMin, latMax, lonMin, lonMax } = LAKE_BOUNDS[lakeName];
        const lakeOutputDir = path.join(BASE_OUTPUT_DIR, lakeName);

        const erddapCode = LAKE_ERDDAP_CODES[lakeName];
        if (!erddapCode) {
            console.error(`ERROR: No ERDDAP code found for lake: ${lakeName}. Skipping.`);
            continue;
        }

        await fs.mkdir(lakeOutputDir, { recursive: true });
        console.log(`Created directory: ${lakeOutputDir}`);

        // For the *first* lake to process (RESUME_FROM_LAKE), we need to manage the date resume.
        // For subsequent lakes, we process all dates, as the overall resume point has passed.
        if (lakeName !== RESUME_FROM_LAKE) {
            resumeDateFound = true; // All dates for subsequent lakes should be processed
        }


        for (const dateIso of MONTHLY_DATES) {
            const yearMonth = dateIso.substring(0, 7);

            if (!resumeDateFound) {
                if (yearMonth === RESUME_FROM_YEAR_MONTH) {
                    resumeDateFound = true;
                } else {
                    console.log(`Skipping date: ${yearMonth} for ${lakeName} (before resume point)`);
                    continue; // Skip to the next date until resumeDateFound is true
                }
            }

            const outputFileName = `${yearMonth}.json`;
            const OUTPUT_FILE = path.join(lakeOutputDir, outputFileName);

            // ✅ Existing check: If the file already exists, always skip fetching it.
            // This is crucial for robust resuming and avoiding redundant downloads.
            try {
                await fs.access(OUTPUT_FILE);
                console.log(`✅ File already exists: ${outputFileName} for ${lakeName}. Skipping fetch.`);
                continue;
            } catch (e) {
                // File does not exist, proceed with fetch
            }

            const url = `https://apps.glerl.noaa.gov/erddap/griddap/${erddapCode}_CHL_VIIRS_Monthly_Avg.csv?Chlorophyll%5B(${dateIso}):1:(${dateIso})%5D%5B(${latMin}):1:(${latMax})%5D%5B(${lonMin}):1:(${lonMax})%5D`;

            try {
                process.stdout.write(`Fetching ${lakeName} - ${yearMonth}... `);

                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`❌ ERDDAP HTTP Error for ${lakeName} ${yearMonth}: ${res.status} ${res.statusText}`);
                    // Log the error and continue to the next date/lake.
                    // This is especially important if some data points are genuinely missing or inaccessible.
                    continue;
                }

                const text = await res.text();

                if (text.trim().split('\n').length < 3) {
                    console.warn(`⚠️ No data rows found for ${lakeName} - ${yearMonth}. Skipping.`);
                    continue;
                }

                const records = parse(text, {
                    columns: true,
                    skip_empty_lines: true,
                });

                const dataRecords = records.slice(1);

                const cleaned = dataRecords
                    .filter(row => {
                        const chlorophyllValue = row['Chlorophyll'];
                        return chlorophyllValue !== '' && chlorophyllValue !== null && !isNaN(parseFloat(chlorophyllValue));
                    })
                    .map(row => ({
                        lat: parseFloat(row['latitude']),
                        lng: parseFloat(row['longitude']),
                        value: parseFloat(row['Chlorophyll']),
                    }));

                if (cleaned.length > 0) {
                    await fs.writeFile(OUTPUT_FILE, JSON.stringify(cleaned, null, 2));
                    console.log(`✅ Saved ${cleaned.length} records to ${OUTPUT_FILE}`);
                } else {
                    console.log(`ℹ️ No valid chlorophyll records found for ${lakeName} - ${yearMonth}. Skipping file creation.`);
                }

            } catch (err) {
                console.error(`❌ Failed to fetch or process data for ${lakeName} - ${yearMonth}:`, err);
            } finally {
                // **Important:** While you asked to remove the delay, please be aware
                // that omitting a delay drastically increases the chance of hitting
                // 403 Forbidden errors again due to rate limiting.
                // For reliable long-running data acquisition, a small delay (e.g., 500-1000ms)
                // is highly recommended here, even with the resume logic.
                // Example: await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
    console.log('Data download complete!');
}

fetchAndProcess();