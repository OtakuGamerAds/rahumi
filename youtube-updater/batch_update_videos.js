const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// --- CONFIGURATION ---
const LINKS_JSON_PATH = path.join(__dirname, "../src/config/links.json");
const ROBLOX_REGEX_SRC = "https:\/\/www\.roblox\.com\/games\/\\S+";
const SAVE_BUTTON_SELECTOR = "#save";
const DESCRIPTION_TEXTBOX_SELECTOR = "#textbox";

async function main() {
  console.log("--- STARTING BATCH UPDATE (RETRY/PREPEND MODE) ---");

  // 1. Load Links
  if (!fs.existsSync(LINKS_JSON_PATH)) {
    console.error(`Error: links.json not found at ${LINKS_JSON_PATH}`);
    return;
  }
  const linksData = JSON.parse(fs.readFileSync(LINKS_JSON_PATH, "utf8"));
  const channelName = "قناتي الثانية";

  if (!linksData[channelName] || !linksData[channelName].links) {
    console.error(`Error: Channel '${channelName}' not found in links.json`);
    return;
  }

  const videos = linksData[channelName].links;
  console.log(`Found ${videos.length} videos to process.`);

  // 2. Connect to Browser
  let browser;
  try {
    browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
      defaultViewport: null,
    });
    console.log("Connected to Chrome.");
  } catch (e) {
    console.error(
      "Could not connect to browser. Is Chrome running with remote debugging?",
      e.message,
    );
    return;
  }

  const pages = await browser.pages();
  const page = pages.length > 0 ? pages[0] : await browser.newPage();

  // Report Data
  const results = {
    success: [],
    skipped: [],
    failed: [],
  };

  // 3. Process Videos
  for (let i = 0; i < videos.length; i++) {
    const videoEntry = videos[i];
    const videoUrl = videoEntry.video_link;

    let videoId = "";
    if (videoUrl.includes("youtu.be/"))
      videoId = videoUrl.split("youtu.be/")[1];
    else if (videoUrl.includes("v="))
      videoId = videoUrl.split("v=")[1].split("&")[0];

    if (!videoId) {
      results.skipped.push({ videoUrl, reason: "Invalid URL" });
      continue;
    }

    console.log(
      `\n[${i + 1}/${videos.length}] Processing Video ID: ${videoId}`,
    );
    const newLink = `https://rahumi.com/article/?id=${videoId}`;
    const studioUrl = `https://studio.youtube.com/video/${videoId}/edit`;

    try {
      await page.goto(studioUrl, { waitUntil: "domcontentloaded" });

      try {
        await page.waitForSelector(DESCRIPTION_TEXTBOX_SELECTOR, {
          timeout: 15000,
        });
      } catch (e) {
        console.log(`  Failed to load editor. Skipping.`);
        results.failed.push({ videoId, reason: "Editor timeout" });
        continue;
      }

      // Find description box
      const textboxes = await page.$$(DESCRIPTION_TEXTBOX_SELECTOR);
      let descriptionTextbox = null;

      // Strategy 1: Find by content (Roblox link or Arabic 'Map Link')
      for (const box of textboxes) {
        const text = await page.evaluate((el) => el.textContent, box);
        if (
          text.includes("رابط الماب") ||
          text.includes("https://www.roblox.com/games/")
        ) {
          descriptionTextbox = box;
          break;
        }
      }

      // Strategy 2: Fallback to index 1 (usually Description) if Strategy 1 failed
      if (!descriptionTextbox && textboxes.length >= 2) {
        // Verify index 1 isn't the title (simplistic check)
        console.log(
          "  Logic: Keyword search failed. Assuming 2nd textbox is Description.",
        );
        descriptionTextbox = textboxes[1];
      } else if (!descriptionTextbox && textboxes.length === 1) {
        console.log("  Logic: Only 1 textbox found. Using it (Caution).");
        descriptionTextbox = textboxes[0];
      }

      if (!descriptionTextbox) {
        console.log(`  Could not identify description textbox. Skipping.`);
        results.failed.push({ videoId, reason: "Textbox not found" });
        continue;
      }

      // Scroll to it
      await descriptionTextbox.evaluate((el) => el.scrollIntoView());

      // Get Current Text
      const currentText = await page.evaluate(
        (el) => el.textContent,
        descriptionTextbox,
      );

      // Check if already updated
      if (currentText.includes("rahumi.com/article")) {
        console.log(`  Already updated. Skipping.`);
        results.skipped.push({ videoId, reason: "Already updated" });
        continue;
      }

      // Determine Action: Replace or Prepend
      const needsReplacement = currentText.match(
        /https:\/\/www\.roblox\.com\/games\/\S+/,
      );

      if (needsReplacement) {
        console.log("  Action: REPLACE existing Roblox link.");
        const updateResult = await page.evaluate(
          (box, regexStr, replacementLink) => {
            const regex = new RegExp(regexStr);
            const editable =
              box.closest('[contenteditable="true"]') ||
              box.querySelector('[contenteditable="true"]') ||
              box;

            function findTextNode(node) {
              if (
                node.nodeType === Node.TEXT_NODE &&
                regex.test(node.textContent)
              ) {
                return node;
              }
              for (const child of node.childNodes) {
                const found = findTextNode(child);
                if (found) return found;
              }
              return null;
            }

            const textNode = findTextNode(editable);
            if (!textNode)
              return { success: false, msg: "Link node not found" };

            const match = textNode.textContent.match(regex);
            const range = document.createRange();
            range.setStart(textNode, match.index);
            range.setEnd(textNode, match.index + match[0].length);

            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            editable.focus();
            return { success: true };
          },
          descriptionTextbox,
          ROBLOX_REGEX_SRC,
          newLink,
        );

        if (!updateResult.success) {
          console.log(`  Replace failed: ${updateResult.msg}`);
          results.failed.push({ videoId, reason: updateResult.msg });
          continue;
        }

        await page.keyboard.type(newLink);
      } else {
        console.log("  Action: PREPEND new link (No Roblox link found).");
        const prependText = `رابط اللعبة: ${newLink}\n\n`;

        // Focus and move to start
        await descriptionTextbox.focus();
        await page.keyboard.down("Control");
        await page.keyboard.press("Home");
        await page.keyboard.up("Control");

        // Ensure we are at the start (sometimes Ctrl+Home selects all on Mac/some inputs? No, usually Start on Windows)
        // Just in case, press Left arrow a bunch or use `setSelectionRange` approach via evaluate if possible.
        // But contenteditable selection is ranged.

        // Safer approach: DOM insertion + input event to avoid cursor weirdness?
        // Or just standard typing at the beginning.

        // Let's use evaluate to Set Cursor to Start
        await page.evaluate((box) => {
          const editable =
            box.closest('[contenteditable="true"]') ||
            box.querySelector('[contenteditable="true"]') ||
            box;
          editable.focus();
          const range = document.createRange();
          range.selectNodeContents(editable);
          range.collapse(true); // collapse to start
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        }, descriptionTextbox);

        await page.keyboard.type(prependText);
      }

      // Save
      await new Promise((r) => setTimeout(r, 500));
      console.log("  Saving...");
      try {
        await page.waitForFunction(
          (selector) => {
            const btn = document.querySelector(selector);
            return btn && btn.getAttribute("aria-disabled") === "false";
          },
          { timeout: 3000 },
          SAVE_BUTTON_SELECTOR,
        );

        await page.evaluate((selector) => {
          const btnHost = document.querySelector(selector);
          if (btnHost) {
            const innerBtn = btnHost.querySelector("button");
            if (innerBtn) innerBtn.click();
            else btnHost.click();
          }
        }, SAVE_BUTTON_SELECTOR);

        await page.waitForFunction(
          (selector) => {
            const btn = document.querySelector(selector);
            return btn && btn.getAttribute("aria-disabled") === "true";
          },
          { timeout: 15000 },
          SAVE_BUTTON_SELECTOR,
        );

        console.log("  Success.");
        results.success.push(videoId);
      } catch (saveError) {
        console.log("  Save failed/timed out/not needed.");
        // Might happen if text didn't change enough? Checking disabled state
        const disabled = await page.evaluate(
          (s) => document.querySelector(s)?.getAttribute("aria-disabled"),
          SAVE_BUTTON_SELECTOR,
        );
        if (disabled === "true") {
          console.log("  (Button disabled, assuming saved or no change)");
          results.success.push(videoId);
        } else {
          results.failed.push({ videoId, reason: "Save button issue" });
        }
      }
    } catch (videoError) {
      console.error(`  Error: ${videoError.message}`);
      results.failed.push({ videoId, reason: videoError.message });
    }
  }

  // 4. Wrap Up
  const reportContent = `BATCH REPORT (Retry/Prepend)
Timestamp: ${new Date().toISOString()}
Success: ${results.success.length}, Skipped: ${results.skipped.length}, Failed: ${results.failed.length}

FAILED:
${results.failed.map((f) => `- ${f.videoId}: ${f.reason}`).join("\n")}

SKIPPED:
${results.skipped.map((s) => `- ${s.videoUrl}: ${s.reason}`).join("\n")}

SUCCESS:
${results.success.join(", ")}
`;
  fs.writeFileSync("batch_report.txt", reportContent);
  console.log("\n--- BATCH UPDATE COMPLETE ---");
  console.log(`Report saved to batch_report.txt`);
  console.log("Disconnecting...");
  browser.disconnect();
}

main();
