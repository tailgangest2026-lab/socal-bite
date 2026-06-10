const fs = require("fs");
const path = require("path");

const SITE_URL = "https://thesocalbite.com";

function readJson(filePath) {
  try { return JSON.parse(fs.readFileSync(filePath, "utf8")); }
  catch { return []; }
}
function asArray(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.reports)) return data.reports;
  return [];
}
function escapeXml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function slugify(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function cleanName(value) { return String(value || "").replace(/\s+/g, " ").trim(); }
function addUrl(urls, loc) { if (loc) urls.add(loc); }
function extractSpeciesFromFishCounts(fishCounts) {
  if (!fishCounts) return [];
  return String(fishCounts).split(",").map(item => item.replace(/\d+(\.\d+)?%?/g, "").replace(/\bReleased\b|\bRelease\b|\bKept\b|\bFish\b/gi, "").replace(/\s+/g, " ").trim()).filter(Boolean);
}

const urls = new Set();
const speciesSet = new Set();
["/", "/forecast", "/conditions", "/rankings", "/species", "/reports", "/trends", "/subscribe"].forEach(page => addUrl(urls, `${SITE_URL}${page}`));

const root = path.join(__dirname, "..");
const publicRoot = path.join(root, "public");
const dailyIndex = asArray(readJson(path.join(publicRoot, "daily-report-index.json"))).length
  ? asArray(readJson(path.join(publicRoot, "daily-report-index.json")))
  : asArray(readJson(path.join(root, "daily-report-index.json")));

dailyIndex.forEach(report => {
  const date = report.date || report.trip_date;
  if (date) addUrl(urls, `${SITE_URL}/reports/${encodeURIComponent(date)}`);
  const filePath = report.file || `reports/daily-report-${date}.json`;
  const candidates = [path.join(publicRoot, filePath), path.join(root, filePath)];
  const reportRows = asArray(readJson(candidates.find(fs.existsSync) || candidates[0]));
  reportRows.forEach(row => extractSpeciesFromFishCounts(row.fish_counts || row.fishCounts || row["Fish Counts"]).forEach(species => speciesSet.add(cleanName(species))));
});

speciesSet.forEach(species => addUrl(urls, `${SITE_URL}/species/${slugify(species)}`));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Array.from(urls).sort().map(url => `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`).join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(publicRoot, "sitemap.xml"), sitemap);
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log(`Sitemap generated with ${urls.size} URLs`);
