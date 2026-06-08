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

function getValue(row, possibleKeys) {
  for (const key of possibleKeys) {
    if (row[key]) return row[key];
  }
  return "";
}

function addUrl(urls, loc) {
  if (loc) urls.add(loc);
}

const urls = new Set();

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

const speciesData = readJson(path.join(__dirname, "../species.json"));
const boatData = readJson(path.join(__dirname, "../boat-detail.json"));
const landingData = readJson(path.join(__dirname, "../landing-detail.json"));
const dailyIndex = readJson(path.join(__dirname, "../daily-report-index.json"));

speciesData.forEach(row => {
  const species = getValue(row, [
    "species",
    "Species",
    "fish",
    "Fish",
    "name",
    "Name",
    "species_name",
    "speciesName"
  ]);

  if (species) {
    addUrl(
      urls,
      `${SITE_URL}/species-detail.html?species=${encodeURIComponent(species)}`
    );
  }
});

boatData.forEach(row => {
  const boat = getValue(row, [
    "boat",
    "Boat",
    "boat_name",
    "Boat Name",
    "boatName",
    "vessel",
    "Vessel"
  ]);

  if (boat) {
    addUrl(
      urls,
      `${SITE_URL}/boat-detail.html?boat=${encodeURIComponent(boat)}`
    );
  }
});

landingData.forEach(row => {
  const landing = getValue(row, [
    "landing",
    "Landing",
    "landing_name",
    "Landing Name",
    "landingName"
  ]);

  if (landing) {
    addUrl(
      urls,
      `${SITE_URL}/landing-detail.html?landing=${encodeURIComponent(landing)}`
    );
  }
});

dailyIndex.forEach(row => {
  const date = getValue(row, ["date", "trip_date", "Trip Date"]);

  if (date) {
    addUrl(urls, `${SITE_URL}/daily-report.html?date=${encodeURIComponent(date)}`);
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
console.log(`Species rows found: ${speciesData.length}`);
console.log(`Boat rows found: ${boatData.length}`);
console.log(`Landing rows found: ${landingData.length}`);
console.log(`Daily report rows found: ${dailyIndex.length}`);
