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
  if (loc) urls.add(loc);
}

function extractSpeciesFromFishCounts(fishCounts) {
  if (!fishCounts) return [];

  return String(fishCounts)
    .split(",")
    .map(item =>
      item
        .replace(/[0-9]/g, "")
        .trim()
    )
    .filter(Boolean);
}

const urls = new Set();
const speciesSet = new Set();

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

const boatData = readJson(path.join(__dirname, "../boat-detail.json"));
const landingData = readJson(path.join(__dirname, "../landing-detail.json"));
const dailyIndex = readJson(path.join(__dirname, "../daily-report-index.json"));

boatData.forEach(row => {
  const boat = row.boat || row.Boat || row.boat_name || row.boatName;
  if (boat) {
    addUrl(urls, `${SITE_URL}/boat-detail.html?boat=${encodeURIComponent(boat)}`);
  }
});

landingData.forEach(row => {
  const landing = row.landing || row.Landing || row.landing_name || row.landingName;
  if (landing) {
    addUrl(urls, `${SITE_URL}/landing-detail.html?landing=${encodeURIComponent(landing)}`);
  }
});

dailyIndex.forEach(report => {
  const date = report.date || report.trip_date;

  if (date) {
    addUrl(urls, `${SITE_URL}/daily-report.html?date=${encodeURIComponent(date)}`);
  }

  const filePath = report.file || `reports/daily-report-${date}.json`;
  const reportRows = readJson(path.join(__dirname, "..", filePath));

  reportRows.forEach(row => {
    const fishCounts = row.fish_counts || row.fishCounts || row["fish counts"];

    extractSpeciesFromFishCounts(fishCounts).forEach(species => {
      speciesSet.add(species);
    });
  });
});

speciesSet.forEach(species => {
  addUrl(
    urls,
    `${SITE_URL}/species-detail.html?species=${encodeURIComponent(species)}`
  );
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
console.log(`Species pages found: ${speciesSet.size}`);
console.log(`Boat rows found: ${boatData.length}`);
console.log(`Landing rows found: ${landingData.length}`);
console.log(`Daily report rows found: ${dailyIndex.length}`);
