const fs = require("fs");
const path = require("path");

const SITE_URL = "https://thesocalbite.com";

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    console.log(`Skipped missing file: ${filePath}`);
    return [];
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function addUrl(urls, loc) {
  if (!loc) return;
  urls.add(loc);
}

const urls = new Set();

// Main pages
[
  "/",
  "/daily-report.html",
  "/boat-ratings.html",
  "/top-boats.html",
  "/top-species.html",
  "/species.html",
  "/bite-trends.html",
  "/landings.html",
  "/news.html",
  "/about.html"
].forEach(page => addUrl(urls, `${SITE_URL}${page}`));

// Load JSON files
const speciesData = readJson(path.join(__dirname, "../species.json"));
const boatData = readJson(path.join(__dirname, "../boat-detail.json"));
const landingData = readJson(path.join(__dirname, "../landing-detail.json"));

// Species detail pages
speciesData.forEach(row => {
  const species = row.species || row.name;
  if (species) {
    addUrl(
      urls,
      `${SITE_URL}/species-detail.html?species=${encodeURIComponent(species)}`
    );
  }
});

// Boat detail pages
boatData.forEach(row => {
  const boat = row.boat || row.boat_name;
  if (boat) {
    addUrl(
      urls,
      `${SITE_URL}/boat-detail.html?boat=${encodeURIComponent(boat)}`
    );
  }
});

// Landing detail pages
landingData.forEach(row => {
  const landing = row.landing || row.landing_name;
  if (landing) {
    addUrl(
      urls,
      `${SITE_URL}/landing-detail.html?landing=${encodeURIComponent(landing)}`
    );
  }
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls)
  .map(url => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`)
  .join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, "../sitemap.xml"), sitemap);

console.log(`Sitemap generated with ${urls.size} URLs`);
