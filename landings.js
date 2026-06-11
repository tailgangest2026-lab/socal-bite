document.addEventListener("DOMContentLoaded", initLandings);

let landingStats = [];
let tripPrices = [];
let tripTypes = [];

async function initLandings() {
try {
const [dailyRows, prices, types] = await Promise.all([
loadRecentDailyRows(),
fetchJson("trip-prices.json"),
fetchJson("landing-trip-types.json")
]);

```
tripPrices = Array.isArray(prices) ? prices : [];
tripTypes = Array.isArray(types) ? types : [];

landingStats = buildLandingStats(dailyRows);

buildTripTypeDropdown();
buildRegionDropdown();
renderPriceComparison();
renderLandingCards();

document
  .getElementById("tripTypeSelect")
  ?.addEventListener("change", renderPriceComparison);

document
  .getElementById("priceRegionSelect")
  ?.addEventListener("change", renderPriceComparison);
```

} catch (error) {
console.error("Landings load failed:", error);
}
}

async function fetchJson(path) {
const url =
typeof socalBiteDataUrl === "function"
? socalBiteDataUrl(path)
: path;

const response = await fetch(url + "?v=" + Date.now());

if (!response.ok) {
throw new Error("Could not load " + path);
}

return response.json();
}

async function loadRecentDailyRows() {
const index = await fetchJson("daily-report-index.json");

const recentReports = index.slice(0, 30);

const rows = [];

for (const report of recentReports) {
const filePath =
report.file ||
`reports/daily-report-${report.date}.json`;

```
try {
  const reportRows = await fetchJson(filePath);

  if (Array.isArray(reportRows)) {
    rows.push(...reportRows);
  }
} catch (error) {
  console.warn("Skipped report:", filePath);
}
```

}

return rows;
}

function buildLandingStats(rows) {
const map = {};

rows.forEach(row => {
const landing = String(row.landing || "").trim();

```
if (!landing) return;

if (!map[landing]) {
  map[landing] = {
    landing,
    region: row.region || "",
    trips: 0,
    anglers: 0,
    fish: 0
  };
}

map[landing].trips += 1;
map[landing].anglers += Number(row.anglers || 0);
map[landing].fish += Number(row.total_fish || 0);
```

});

return Object.values(map)
.map(item => ({
...item,
fpa:
item.fish /
Math.max(item.anglers, 1)
}))
.sort((a, b) => b.fish - a.fish);
}

function buildTripTypeDropdown() {
const select =
document.getElementById("tripTypeSelect");

if (!select) return;

const uniqueTypes = [
...new Set(
tripTypes.map(x => x.trip_type)
)
].sort();

select.innerHTML =
'<option value="">Choose Trip Type</option>' +
uniqueTypes
.map(
type =>
`<option value="${type}">${type}</option>`
)
.join("");
}

function buildRegionDropdown() {
const select =
document.getElementById("priceRegionSelect");

if (!select) return;

const regions = [
...new Set(
landingStats.map(x => x.region)
)
].sort();

select.innerHTML =
'<option value="all">All Regions</option>' +
regions
.map(
region =>
`<option value="${region}">${region}</option>`
)
.join("");
}
