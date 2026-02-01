/**
 * Fetch Roblox Game Names
 *
 * This script fetches proper game names from Roblox URLs and updates
 * the map_name field in your JSON files.
 *
 * Usage: node fetch_roblox_names.js [links_main.json] [links_extra.json]
 *
 * Features:
 * - Fetches game titles from Roblox game pages
 * - Decodes HTML entities (emojis like &#x1FA90; → 🪐)
 * - Handles redirects and 404 errors
 * - Skips entries that already have valid Roblox names
 * - Rate limiting to avoid being blocked
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// HTML entity decoder
function decodeHtmlEntities(text) {
  if (!text) return text;
  return text
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// Fetch URL with redirect handling
function fetchUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Too many redirects"));
      return;
    }

    // Clean up malformed URLs
    url = url.replace(/https?$/, "");

    const protocol = url.startsWith("https") ? https : http;
    const options = {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 30000,
    };

    const req = protocol.get(url, options, (res) => {
      if (
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith("/")) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        fetchUrl(redirectUrl, redirectCount + 1)
          .then(resolve)
          .catch(reject);
        return;
      }

      if (res.statusCode === 404) {
        resolve({ status: 404, data: "" });
        return;
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// Extract title from HTML
function extractTitle(html) {
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch) {
    let title = titleMatch[1];
    title = title.replace(/ - Roblox$/i, "");
    title = title.replace(/\| The Official Roblox Website$/i, "");
    title = title.replace(/\| Play on Roblox$/i, "");
    title = decodeHtmlEntities(title);
    return title.trim();
  }
  return null;
}

// Check if text contains Arabic characters (likely a YouTube title)
function containsArabic(text) {
  return /[\u0600-\u06FF]/.test(text);
}

// Fetch game name from Roblox URL
async function fetchGameName(robloxUrl) {
  try {
    const result = await fetchUrl(robloxUrl);
    if (result.status === 404) {
      return "Unknown Game (404 Not Found)";
    }
    return extractTitle(result.data);
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return null;
  }
}

// Process a list of links
async function processLinksList(links, forceUpdate = false) {
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const mapName = link.map_name || "";
    const mapLink = link.map_link;

    // Check if update is needed
    const needsUpdate =
      forceUpdate ||
      containsArabic(mapName) ||
      mapName.includes("| Play on Roblox") ||
      mapName.startsWith(":") ||
      mapName === "Run Script Update to Fetch Name";

    if (!needsUpdate) {
      console.log(
        `[${i + 1}/${links.length}] SKIP: ${mapName.substring(0, 40)}`,
      );
      skipped++;
      continue;
    }

    if (!mapLink || mapLink === "https://www.roblox.com") {
      console.log(`[${i + 1}/${links.length}] SKIP (no valid map_link)`);
      skipped++;
      continue;
    }

    console.log(
      `[${i + 1}/${links.length}] Fetching: ${mapLink.substring(0, 55)}...`,
    );

    const gameName = await fetchGameName(mapLink);

    if (gameName) {
      console.log(`  OLD: ${mapName.substring(0, 50)}`);
      console.log(`  NEW: ${gameName.substring(0, 50)}`);
      link.map_name = gameName;
      updated++;
    } else {
      console.log(`  FAILED to fetch`);
      failed++;
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }
  return { updated, failed, skipped };
}

// Process the main links.json file
async function processLinksFile(filePath, forceUpdate = false) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Processing: ${filePath}`);
  console.log(`${"=".repeat(60)}`);

  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let totalUpdated = 0;

  for (const [key, channelData] of Object.entries(data)) {
    console.log(`\n--- Channel: ${key} ---`);
    if (channelData && channelData.links) {
      const { updated, failed, skipped } = await processLinksList(
        channelData.links,
        forceUpdate,
      );
      totalUpdated += updated;
      console.log(
        `Section Result - Updated: ${updated}, Failed: ${failed}, Skipped: ${skipped}`,
      );
    } else {
      console.warn(`Warning: No links array for ${key}.`);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`\nSaved to: ${filePath}`);
}

async function main() {
  const args = process.argv.slice(2);
  const configDir = path.join(__dirname, "..", "config");
  const linksFile = path.join(configDir, "links.json");

  await processLinksFile(linksFile);

  console.log(`\n${"=".repeat(60)}`);
  console.log("Done! Game names updated from Roblox.");
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
