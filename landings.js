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
  ?.addEventListener("change", );

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


try {
  const reportRows = await fetchJson(filePath);

  if (Array.isArray(reportRows)) {
    rows.push(...reportRows);
  }
} catch (error) {
  console.warn("Skipped report:", filePath);
}


}

return rows;
}

function buildLandingStats(rows) {
const map = {};

rows.forEach(row => {
const landing = String(row.landing || "").trim();


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
function renderPriceComparison() {
  const tbody = document.getElementById("priceCompareBody");
  if (!tbody) return;

  const selectedType = document.getElementById("tripTypeSelect")?.value || "";
  const selectedRegion = document.getElementById("priceRegionSelect")?.value || "all";

  let prices = tripPrices;

  if (selectedType) {
    prices = prices.filter(row => row.trip_type === selectedType);
  }

  if (selectedRegion !== "all") {
    prices = prices.filter(row => row.region === selectedRegion);
  }

  prices = [...prices].sort((a, b) => Number(a.price || 999999) - Number(b.price || 999999));

  if (!prices.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">No prices found.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = prices.slice(0, 100).map(row => `
    <tr>
      <td>
        <a href="/landing-detail.html?landing=${encodeURIComponent(row.landing)}">
          ${safe(row.landing)}
        </a>
      </td>
      <td>${safe(row.region)}</td>
      <td>${safe(row.trip_type)}</td>
      <td>${row.price ? "$" + Number(row.price).toFixed(2) : "Check Website"}</td>
      <td>${row.last_updated || ""}</td>
      <td>
        <a href="${row.booking_url || row.source_url || "#"}" target="_blank" rel="noopener">
          Book
        </a>
      </td>
    </tr>
  `).join("");
}

function renderLandingCards() {
const grid =
document.getElementById("landingsGrid");

if (!grid) return;

grid.innerHTML = landingStats
.map(landing => {

  const landingPrices =
    tripPrices.filter(
      row => row.landing === landing.landing
    );

  const landingTripTypes =
    tripTypes.filter(
      row => row.landing === landing.landing
    );

  const cheapestPrice =
    landingPrices.length
      ? Math.min(
          ...landingPrices.map(
            x => Number(x.price || 999999)
          )
        )
      : null;

  return `
    <article class="landing-card-love">

      <div class="landing-card-top">

        <div>
          <h3>
            <a href="/landing-detail.html?landing=${encodeURIComponent(landing.landing)}">
              ${safe(landing.landing)}
            </a>
          </h3>

          <p>${safe(landing.region)}</p>
        </div>

        ${
          cheapestPrice
            ? `
              <div class="landing-price-badge">
                From $${cheapestPrice.toFixed(0)}
              </div>
            `
            : ""
        }

      </div>

      <div class="landing-kpis">

        <div>
          <span>Trips</span>
          <strong>${format(landing.trips)}</strong>
        </div>

        <div>
          <span>Anglers</span>
          <strong>${format(landing.anglers)}</strong>
        </div>

        <div>
          <span>Fish</span>
          <strong>${format(landing.fish)}</strong>
        </div>

        <div>
          <span>FPA</span>
          <strong>${landing.fpa.toFixed(2)}</strong>
        </div>

      </div>

      <div class="landing-trip-types">

        ${landingTripTypes
          .slice(0, 12)
          .map(type => `
            <span>
              ${safe(type.trip_type)}
            </span>
          `)
          .join("")}

      </div>

      <div class="landing-price-list">

        ${landingPrices
          .sort(
            (a, b) =>
              Number(a.price || 999999) -
              Number(b.price || 999999)
          )
          .slice(0, 8)
          .map(price => `
            <div class="landing-price-row">

              <span>
                ${safe(price.trip_type)}
              </span>

              <strong>
                ${
                  price.price
                    ? "$" + Number(price.price).toFixed(2)
                    : "Check Website"
                }
              </strong>

            </div>
          `)
          .join("")}

      </div>

      <div class="landing-actions">

        <a
          href="/landing-detail.html?landing=${encodeURIComponent(landing.landing)}"
        >
          Details
        </a>

        ${
          landingPrices[0]?.booking_url
            ? `
              <a
                href="${landingPrices[0].booking_url}"
                target="_blank"
                rel="noopener"
              >
                Book Trip
              </a>
            `
            : ""
        }

      </div>

    </article>
  `;
})
.join("");

}

function format(value) {
return Number(value || 0)
.toLocaleString("en-US");
}

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
