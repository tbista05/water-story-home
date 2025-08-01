import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import path from "path";
import fs from "fs/promises";
import type { Request, Response } from 'express';
import { SchemaType, Tool, GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import cheerio from 'cheerio';

dotenv.config(); // load environment variables from .env file

const API_KEY = process.env.GEMINI_API_KEY || ""; // Replace with your actual env var name
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-05-20" }); // Use the recommended model

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_BASE_DIR = path.join(__dirname, "data");

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

    const celsiusTemp = parseFloat(latest[idx.wtmp]);
    let fahrenheitTemp: number | null = null; // Initialize as nullable

    // Perform conversion only if celsiusTemp is a valid number
    if (!isNaN(celsiusTemp)) {
      fahrenheitTemp = (celsiusTemp * 9/5) + 32;
    }

    return {
      station,
      waterTemp: fahrenheitTemp,
      windSpeed: parseFloat(latest[idx.wspd]),
      waveHeight: parseFloat(latest[idx.wvht]),
      time: `${latest[0]}/${latest[1]}/${latest[2]} ${latest[3]}:${latest[4]}`,
    };
  } catch (err) {
    console.error(`Error fetching data for buoy ${station}`);
    return null; // Gracefully skip this buoy
  }
}

// returns all buoy info (coordinates + live data)
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

// Provides chlorophyll data for a specific region
app.get("/api/chlorophyll/:region/:yearMonth", async (req: Request<{ region: string; yearMonth: string }>, res: Response) => {
  const { region, yearMonth } = req.params; // Get the dynamic region from the URL

  // Basic validation for yearMonth format (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    // No 'return' here
    res.status(400).json({ error: 'Invalid yearMonth format. Expected YYYY-MM.' });
    return;
  }

  // Construct the full path to the chlorophyll JSON file
  // It will now look for: data/{region}/{yearMonth}.json
  const chlorophyllFilePath = path.join(DATA_BASE_DIR, region, `${yearMonth}.json`);
  
  console.log(`[Chlorophyll API] Attempting to read file from: ${chlorophyllFilePath}`);

  try {
    await fs.access(chlorophyllFilePath); // Checks if file exists and is accessible
    const data = await fs.readFile(chlorophyllFilePath, 'utf8');
    const parsedData = JSON.parse(data);

    const filteredData = parsedData.filter((dp: any) => typeof dp.value === 'number' && !isNaN(dp.value));

    res.json(filteredData);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`[Chlorophyll API] Data not found for region: ${region}, date: ${yearMonth}. Path: ${chlorophyllFilePath}`);
      res.status(404).json({ message: `Chlorophyll data not found for ${region} in ${yearMonth}.` });
    } else {
        console.error(`[Chlorophyll API] Error fetching chlorophyll data for ${region} ${yearMonth}:`, error);
        res.status(500).json({ message: 'Internal server error fetching chlorophyll data.' });
    }
    // Added return statements for clarity and immediate exit from the route handler
    return;
  }
});

// The model will use this to ask our code to scrape a website.
const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "web_scraper",
        description: "Fetches and extracts the main text content from a given URL. Use this to get information from trusted external websites.",
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            url: {
              type: SchemaType.STRING,
              description: "The URL of the website to scrape."
            }
          },
          "required": ["url"]
        }
      }
    ]
  }
];

// THE API ROUTE FOR LAKE-SPECIFIC BULLETINS
app.get("/api/bulletin/:lake", async (req: Request<{ lake: string }>, res: Response) => {
    const { lake } = req.params;
    const lakeName = lake.charAt(0).toUpperCase() + lake.slice(1);

    // *** IMPORTANT: Replace these with your actual trusted sources! ***
    const sources: Record<string, string[]> = {
        erie: [
            "https://www.epa.gov/great-lakes-advisory/lake-erie-advisory", // Example URL
            "https://www.glerl.noaa.gov/res/habs_and_hypoxia/erie.html"   // Example URL
        ],
        // Add URLs for other lakes...
        michigan: ["https://www.epa.gov/great-lakes-advisory/lake-michigan-advisory"],
        superior: ["https://www.epa.gov/great-lakes-advisory/lake-superior-advisory"],
        huron: ["https://www.epa.gov/great-lakes-advisory/lake-huron-advisory"],
        ontario: ["https://www.epa.gov/great-lakes-advisory/lake-ontario-advisory"],
    };

    const lakeSources = sources[lake.toLowerCase()];
    if (!lakeSources) {
        return res.status(400).json({ error: "Invalid or unsupported lake specified." });
    }

    try {
        const chat = model.startChat({ tools });
        const prompt = `
            You are the Great Lakes Official Information Service. Your task is to create a concise alerts and announcements bulletin for Lake ${lakeName}.
            
            First, use the web_scraper tool to check the following URLs for any new information or advisories:
            ${lakeSources.join('\n')}

            After you have gathered information from all sources, synthesize it into a list of 3 to 5 important announcements.
            If the sources mention no specific advisories, provide general safety tips or interesting facts about Lake ${lakeName}.
            
            Your final response MUST be a single, valid JSON object with one key: "announcements".
            The value of "announcements" must be an array of strings, where each string is a single announcement.
            Do not include any other text, explanations, or markdown formatting in your final answer.
        `;

        // First call to the model
        const result = await chat.sendMessage(prompt);
        let response = result.response;

        // Check if the model wants to use a tool
        const functionCalls = response.functionCalls();
        if (functionCalls && functionCalls.length > 0) {
            const scrapedData = await Promise.all(
                functionCalls.map(async (call) => {
                    if (call.name === 'web_scraper') {
                        const { url } = call.args as {url : string };
                        console.log(`[Tool] Scraping URL: ${url}`);
                        try {
                            const pageResponse = await fetch(url);
                            const html = await pageResponse.text();
                            const $ = cheerio.load(html);
                            // Extract text from main content areas, ignoring nav/footer
                            $('nav, footer, script, style').remove();
                            const mainText = $('body').text().replace(/\s\s+/g, ' ').trim().substring(0, 3000);

                            return {
                                "tool_use_response": {
                                    "name": "web_scraper",
                                    "content": `Successfully scraped content from ${url}: ${mainText}`
                                }
                            };
                        } catch (e: any) {
                            console.error(`Error scraping ${url}:`, e.message);
                            return { "tool_use_response": { "name": "web_scraper", "content": `Failed to scrape content from ${url}.` } };
                        }
                    }
                    return { "tool_use_response": { "name": "unknown_function", "content": "Unknown tool called." } };
                })
            );

            // Second call to the model, providing the scraped data
            const result2 = await chat.sendMessage(JSON.stringify(scrapedData));
            response = result2.response;
        }

        // Process the final response
        const finalResponseText = response.text();
        try {
            const jsonResponse = JSON.parse(finalResponseText);
            res.json(jsonResponse);
        } catch (e) {
            console.error("Failed to parse final JSON from LLM response:", finalResponseText);
            res.status(500).json({ error: "Could not parse the final bulletin response." });
        }

    } catch (err) {
        console.error(`Error generating bulletin for ${lake}:`, err);
        res.status(500).json({ error: "Failed to generate advisory bulletin." });
    }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log('Current working directory of the server:', process.cwd());
});

