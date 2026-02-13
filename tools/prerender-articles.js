import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LINKS_FILE = path.join(__dirname, "../src/config/links.json");
const ARTICLES_DIR = path.join(__dirname, "../src/assets/articles");
const OUTPUT_DIR = path.join(__dirname, "../src/a");
const BASE_URL = "https://rahumi.com";

/**
 * Minimal markdown-to-HTML converter for pre-rendering.
 * Handles headings, bold, italic, lists, paragraphs, and links.
 * No external dependencies required.
 */
function simpleMarkdownToHtml(md) {
  let html = md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Replace ${GAME_NAME} placeholder with static text
    .replace(/\$\{GAME_NAME\}/g, "اللعبة");

  // Process lines for lists and paragraphs
  const lines = html.split("\n");
  const result = [];
  let inList = false;
  let listType = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (inList) {
        result.push(listType === "ol" ? "</ol>" : "</ul>");
        inList = false;
        listType = null;
      }
      continue;
    }

    // Already converted to heading
    if (trimmed.startsWith("<h")) {
      if (inList) {
        result.push(listType === "ol" ? "</ol>" : "</ul>");
        inList = false;
        listType = null;
      }
      result.push(trimmed);
      continue;
    }

    // Ordered list (1. item)
    const olMatch = trimmed.match(/^\d+\.\s+(.+)/);
    if (olMatch) {
      if (!inList || listType !== "ol") {
        if (inList) result.push(listType === "ol" ? "</ol>" : "</ul>");
        result.push("<ol>");
        inList = true;
        listType = "ol";
      }
      result.push(`<li>${olMatch[1]}</li>`);
      continue;
    }

    // Unordered list (- item or * item)
    const ulMatch = trimmed.match(/^[-*]\s+(.+)/);
    if (ulMatch) {
      if (!inList || listType !== "ul") {
        if (inList) result.push(listType === "ol" ? "</ol>" : "</ul>");
        result.push("<ul>");
        inList = true;
        listType = "ul";
      }
      result.push(`<li>${ulMatch[1]}</li>`);
      continue;
    }

    // Indented list continuation (e.g. "    text under list item")
    if (inList && line.startsWith("    ")) {
      // Append to previous list item
      const lastIdx = result.length - 1;
      if (result[lastIdx] && result[lastIdx].startsWith("<li>")) {
        result[lastIdx] = result[lastIdx].replace(
          "</li>",
          `<br>${trimmed}</li>`,
        );
      } else {
        result.push(`<p>${trimmed}</p>`);
      }
      continue;
    }

    // Regular paragraph
    if (inList) {
      result.push(listType === "ol" ? "</ol>" : "</ul>");
      inList = false;
      listType = null;
    }
    result.push(`<p>${trimmed}</p>`);
  }

  if (inList) {
    result.push(listType === "ol" ? "</ol>" : "</ul>");
  }

  return result.join("\n");
}

function getVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
  return match ? match[1] : null;
}

/**
 * Generate a static HTML page for a single article.
 * The page contains real content for crawlers, but also loads main.js
 * for the full interactive experience (video player, dynamic ads, etc.)
 */
function generateArticlePage(item, videoId, articleHtml) {
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  const articleUrl = `${BASE_URL}/a/${item.n}`;

  // Extract first heading as title, fallback to generic
  const titleMatch = articleHtml.match(/<h[1-3]>([^<]+)<\/h[1-3]>/);
  const articleTitle = titleMatch
    ? titleMatch[1].replace(/\$\{GAME_NAME\}/g, "اللعبة")
    : `مقال رقم ${item.n}`;
  const pageTitle = `${articleTitle} - رحومي`;

  // Extract first paragraph as description
  const descMatch = articleHtml.match(/<p>([^<]+)<\/p>/);
  const description = descMatch
    ? descMatch[1].substring(0, 160)
    : "اكتشف أسرار ونصائح حصرية في ألعاب روبلوكس مع رحومي!";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <!-- Consent Mode Default -->
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'analytics_storage': 'denied'
      });
    </script>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-SPEWBEZZSN"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-SPEWBEZZSN');
    </script>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <meta name="description" content="${description}">
    <meta property="og:title" content="${pageTitle}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${thumbnailUrl}">
    <meta property="og:url" content="${articleUrl}">
    <meta property="og:type" content="article">
    <link rel="canonical" href="${articleUrl}">
    <link rel="icon" href="/assets/images/profile_pictures/Rahumi.jpg">
    <link rel="stylesheet" href="/styles/main.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .article-container { max-width: 800px; margin: 0 auto; padding: 2rem 1rem; color: var(--text-color); }
        .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: var(--shadow-lg); }
        .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
        .article-content { background-color: var(--surface-color); padding: 2rem; border-radius: 12px; box-shadow: var(--shadow-md); margin-bottom: 2rem; line-height: 1.8; font-size: 1.1rem; }
        .article-content h1, .article-content h2, .article-content h3 { color: var(--primary-color); margin-top: 1.5rem; margin-bottom: 1rem; }
        .article-content p { margin-bottom: 1rem; }
        .article-content ul, .article-content ol { margin-right: 1.5rem; margin-bottom: 1rem; }
        .play-button-container { display: flex; justify-content: center; margin-top: 2rem; margin-bottom: 2rem; }
        .play-big-btn { font-size: 1.5rem; padding: 1rem 3rem; border-radius: 50px; background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; box-shadow: 0 4px 15px rgba(46, 204, 113, 0.4); transition: transform 0.3s ease, box-shadow 0.3s ease; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; }
        .play-big-btn:hover { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 25px rgba(46, 204, 113, 0.6); }
        .ad-container { width: 100%; margin: 0; text-align: center; overflow: hidden; display: flex; justify-content: center; align-items: center; min-height: 0; background-color: transparent; border-radius: 8px; transition: margin 0.3s ease; }
        .ad-container:has(ins.adsbygoogle[data-ad-status="filled"]) { margin: 2rem 0; min-height: 100px; background-color: var(--surface-color-secondary, transparent); }
        ins.adsbygoogle[data-ad-status="unfilled"] { display: none !important; }
        .ad-container:has(ins.adsbygoogle[data-ad-status="unfilled"]) { display: none !important; }
        @media (max-width: 480px) { .play-big-btn { padding: 1rem 1.5rem; font-size: 1.2rem; width: 100%; max-width: 300px; } }
    </style>

    <script>
      // Flag for main.js: this is a pre-rendered short URL article page
      window.__shortArticleNumber = ${item.n};
    </script>
</head>
<body>
    <main class="container">
        <div id="article-view">
            <div class="article-container">
                <!-- Video Section -->
                <div class="video-wrapper">
                    <iframe id="video-embed"
                        src="https://www.youtube.com/embed/${videoId}?rel=0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen
                        loading="lazy"
                        title="${articleTitle}"></iframe>
                </div>

                <!-- Play Button -->
                <div class="play-button-container">
                    <a id="game-play-btn" href="${item.map_link}" target="_blank" class="btn play-big-btn">
                        العب الماب الآن <img src="https://www.google.com/s2/favicons?domain=roblox.com" alt="Roblox" style="margin-right: 10px; width: 24px; height: 24px; vertical-align: middle;">
                    </a>
                </div>

                <!-- Article Content (pre-rendered for crawlers) -->
                <div id="article-content" class="article-content">
${articleHtml}
                </div>
            </div>
        </div>
    </main>

    <script src="/scripts/title-utils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="/scripts/main.js"></script>
    <script src="/scripts/consent.js"></script>
</body>
</html>`;
}

function prerender() {
  console.log("Pre-rendering article pages...");

  const linksData = JSON.parse(fs.readFileSync(LINKS_FILE, "utf8"));

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let generated = 0;
  let skipped = 0;

  for (const channel of Object.values(linksData)) {
    for (const item of channel.links || []) {
      if (!item.n) {
        skipped++;
        continue;
      }

      const videoId = getVideoId(item.video_link);
      if (!videoId) {
        skipped++;
        continue;
      }

      // Check if markdown article exists
      const mdPath = path.join(ARTICLES_DIR, `${videoId}.md`);
      let articleHtml = "<p>اكتشف أسرار ونصائح حصرية في هذا الفيديو!</p>";

      if (fs.existsSync(mdPath)) {
        const mdContent = fs.readFileSync(mdPath, "utf8");
        articleHtml = simpleMarkdownToHtml(mdContent);
      }

      // Generate HTML
      const html = generateArticlePage(item, videoId, articleHtml);

      // Write to src/a/{n}/index.html
      const articleDir = path.join(OUTPUT_DIR, String(item.n));
      if (!fs.existsSync(articleDir)) {
        fs.mkdirSync(articleDir, { recursive: true });
      }
      fs.writeFileSync(path.join(articleDir, "index.html"), html, "utf8");
      generated++;
    }
  }

  console.log(
    `Pre-render complete: ${generated} pages generated, ${skipped} skipped.`,
  );
}

prerender();
