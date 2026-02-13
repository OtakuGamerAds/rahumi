/**
 * Migration Script: Add Sequential Numbers to links.json
 *
 * Assigns a unique sequential "n" field to each link entry.
 * Numbering starts from the oldest video in channel 1 (last element = n:1),
 * goes up to newest in channel 1, then continues from oldest in channel 2
 * up to newest (highest number).
 *
 * Usage: node tools/migrate_add_numbers.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS_FILE = path.join(__dirname, "../src/config/links.json");

function main() {
  console.log("📋 Reading links.json...");

  const data = JSON.parse(fs.readFileSync(LINKS_FILE, "utf8"));

  // Get channels sorted by list_number (channel 1 first, then channel 2)
  const sortedChannelKeys = Object.keys(data).sort((a, b) => {
    return (data[a].list_number ?? 999) - (data[b].list_number ?? 999);
  });

  let counter = 1;

  for (const channelKey of sortedChannelKeys) {
    const links = data[channelKey].links;
    if (!links || links.length === 0) continue;

    console.log(`\n📺 Channel: "${channelKey}" (${links.length} links)`);

    // Assign numbers from oldest (last element) to newest (first element)
    for (let i = links.length - 1; i >= 0; i--) {
      links[i].n = counter;
      counter++;
    }

    const firstN = links[0].n;
    const lastN = links[links.length - 1].n;
    console.log(`   First element (newest): n=${firstN}`);
    console.log(`   Last element (oldest):  n=${lastN}`);
  }

  const totalAssigned = counter - 1;
  console.log(`\n✅ Assigned ${totalAssigned} numbers total.`);

  // Write back
  fs.writeFileSync(LINKS_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`💾 Saved to: ${LINKS_FILE}`);
}

main();
