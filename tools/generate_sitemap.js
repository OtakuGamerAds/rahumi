import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS_FILE = path.join(__dirname, "../src/config/links.json");
const OUTPUT_FILE = path.join(__dirname, "../src/sitemap.xml");
const ROBOTS_FILE = path.join(__dirname, "../src/robots.txt");
const BASE_URL = "https://rahumi.com";

function getVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? match[1] : null;
}

function generateSitemap() {
  console.log("Generating sitemap...");

  try {
    const data = fs.readFileSync(LINKS_FILE, "utf8");
    const content = JSON.parse(data);

    // XML Header
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Static Pages
    const staticPages = ["", "/videos/", "/about/", "/contact/"];

    staticPages.forEach((page) => {
      sitemap += `
    <url>
        <loc>${BASE_URL}${page}</loc>
        <changefreq>weekly</changefreq>
        <priority>${page === "" ? "1.0" : "0.8"}</priority>
    </url>`;
    });

    // Dynamic Article Pages
    let articleCount = 0;

    // Iterate through channels
    Object.values(content).forEach((channel) => {
      const links = channel.links || [];
      links.forEach((item) => {
        const videoId = getVideoId(item.video_link);
        if (videoId) {
          sitemap += `
    <url>
        <loc>${BASE_URL}/article/?id=${videoId}</loc>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>`;
          articleCount++;
        }
      });
    });

    sitemap += `
</urlset>`;

    fs.writeFileSync(OUTPUT_FILE, sitemap);
    console.log(
      `Sitemap generated with ${articleCount} articles! Saved to ${OUTPUT_FILE}`,
    );

    // Generate robots.txt
    const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${BASE_URL}/sitemap.xml
`;
    fs.writeFileSync(ROBOTS_FILE, robotsTxt);
    console.log(`robots.txt generated! Saved to ${ROBOTS_FILE}`);
  } catch (error) {
    console.error("Error generating sitemap:", error);
    process.exit(1);
  }
}

generateSitemap();
