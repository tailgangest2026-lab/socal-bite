const fs = require("fs");
const path = require("path");

const SITE_URL = "https://thesocalbite.com";

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, "..", file), "utf8"));
  } catch {
    console.log(`Skipped missing file: ${file}`);
    return [];
  }
}

function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.reports)) return data.reports;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function get(row, fields) {
  for (const field of fields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== "") {
      return row[field];
    }
  }
  return "";
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function add(urls, url) {
  if (url) urls.add(url);
}

function extractSpecies(fishCounts) {
  if (!fishCounts) return [];

  return String(fishCounts)
    .split(",")
    .map(item =>
      item
        .replace(/\d+(\.\d+)?%?/g, "")
        .replace(/\bReleased\b/gi, "")
        .replace(/\bRelease\b/gi, "")
        .replace(/\bKept\b/gi, "")
        .replace(/\bFish\b/gi, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);
}

const urls = new Set();
const boats = new Set();
const species = new Set();
const landings = new Set();

[
  "/",
  "/forecast/",
  "/conditions/",
  "/rankings/",
  "/species/",
  "/landings/",
  "/daily-report/",
  "/gear/",
  "/news/",
  "/about/"
].forEach(page => add(urls, `${SITE_URL}${page}`));

const speciesRows = asArray(readJson("species.json"));
const boatRows = asArray(readJson("boat-detail.json"));
const landingRows = asArray(readJson("landing-detail.json"));
const dailyIndex = asArray(readJson("daily-report-index.json"));

speciesRows.forEach(row => {
  const name = clean(get(row, ["species", "Species", "name", "Name", "fish", "Fish"]));
  if (name) species.add(name);
});

boatRows.forEach(row => {
  const name = clean(get(row, ["boat", "Boat", "boat_name", "boatName", "name", "Name"]));
  if (name) boats.add(name);
});

landingRows.forEach(row => {
  const name = clean(get(row, ["landing", "Landing", "landing_name", "landingName", "name", "Name"]));
  if (name) landings.add(name);
});

dailyIndex.forEach(report => {
  const date = clean(get(report, ["date", "trip_date", "Date"]));

  if (date) {
    add(urls, `${SITE_URL}/daily-report/?date=${encodeURIComponent(date)}`);
  }

  const reportFile = report.file || (date ? `reports/daily-report-${date}.json` : "");
  if (!reportFile) return;

  const rows = asArray(readJson(reportFile));

  rows.forEach(row => {
    const boat = clean(get(row, ["boat", "Boat", "boat_name", "boatName"]));
    const landing = clean(get(row, ["landing", "Landing", "landing_name", "landingName"]));
    const directSpecies = clean(get(row, ["species", "Species", "fish", "Fish"]));

    if (boat) boats.add(boat);
    if (landing) landings.add(landing);
    if (directSpecies) species.add(directSpecies);

    const fishCounts = get(row, [
      "fish_counts",
      "fishCounts",
      "fish counts",
      "FishCounts",
      "Fish Counts"
    ]);

    extractSpecies(fishCounts).forEach(name => species.add(clean(name)));
  });
});

boats.forEach(name => {
  add(urls, `${SITE_URL}/boat-detail/?boat=${encodeURIComponent(name)}`);
});

species.forEach(name => {
  add(urls, `${SITE_URL}/species-detail/?species=${encodeURIComponent(name)}`);
});

landings.forEach(name => {
  add(urls, `${SITE_URL}/landing-detail/?landing=${encodeURIComponent(name)}`);
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${Array.from(urls).sort().map(url => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`).join("\n")}
</urlset>
`;

fs.writeFileSync(path.join(__dirname, "../sitemap.xml"), sitemap);

console.log(`Sitemap generated with ${urls.size} URLs`);
console.log(`Species pages found: ${species.size}`);
console.log(`Boat pages found: ${boats.size}`);
console.log(`Landing pages found: ${landings.size}`);
console.log(`Daily report rows found: ${dailyIndex.length}`);
