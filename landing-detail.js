document.addEventListener("DOMContentLoaded", initLandingDetail);

let selectedLanding = "";
let dailyRows = [];
let tripPrices = [];
let tripTypes = [];

async function initLandingDetail() {
  selectedLanding = getParam("landing");

  if (!selectedLanding) {
    setText("landingTitle", "Landing not found");
    setText("landingRegion", "Missing landing name.");
    return;
  }

  try {
    setText("landingTitle", selectedLanding);

    const [rows, prices, types] = await Promise.all([
      loadRecentDailyRows(),
      fetchJson("trip-prices.json"),
      fetchJson("landing-trip-types.json")
    ]);

    dailyRows = rows;
    tripPrices = Array.isArray(prices) ? prices : [];
    tripTypes = Array.isArray(types) ? types : [];

    const landingRows = dailyRows.filter(row => {
      return clean(row.landing).toLowerCase() === selectedLanding.toLowerCase();
    });

    renderLandingSummary(landingRows);
    renderPriceList();
    renderFleet(landingRows);
    renderRecentReports(landingRows);
  } catch (error) {
    console.error("Landing detail load failed:", error);
    setText("landingRegion", "Could not load landing profile.");
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

async function loadRecentDailyRows() {
  const index = await fetchJson("daily-report-index.json");

  if (!Array.isArray(index) || !index.length) return [];

  const recentReports = index.slice(0, 30);
  const rows = [];

  for (const report of recentReports) {
    const filePath = report.file || `reports/daily-report-${report.date}.json`;

    try {
      const reportRows = await fetchJson(filePath);

      if (Array.isArray(reportRows)) {
        rows.push(...reportRows.map(row => ({ ...row, report_date: report.date })));
      }
    } catch (error) {
      console.warn("Skipped report:", filePath, error);
    }
  }

  return rows;
}

function renderLandingSummary(rows) {
  const region = clean(rows[0]?.region || "Southern California");

  const trips = rows.length;
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  const fpa = fish / Math.max(anglers, 1);

  setText("landingRegion", region);
  setText("landingTrips", format(trips));
  setText("landingAnglers", format(anglers));
  setText("landingFish", format(fish));
  setText("landingFpa", fpa.toFixed(2));
}

function renderPriceList() {
  const container = document.getElementById("landingPriceList");
  if (!container) return;

  const prices = tripPrices
    .filter(row => clean(row.landing).toLowerCase() === selectedLanding.toLowerCase())
    .sort((a, b) => {
      const typeCompare = clean(a.trip_type).localeCompare(clean(b.trip_type));
      if (typeCompare !== 0) return typeCompare;
      return Number(a.price || 999999) - Number(b.price || 999999);
    });

  const types = tripTypes
    .filter(row => clean(row.landing).toLowerCase() === selectedLanding.toLowerCase())
    .sort((a, b) => clean(a.trip_type).localeCompare(clean(b.trip_type)));

  if (!prices.length && !types.length) {
    container.innerHTML = `<div class="empty-card">No trip prices found for this landing.</div>`;
    return;
  }

  const priceMap = {};
  prices.forEach(row => {
    const type = clean(row.trip_type);
    if (!type) return;

    if (!priceMap[type]) {
      priceMap[type] = [];
    }

    priceMap[type].push(row);
  });

  const allTripTypes = [
    ...new Set([
      ...types.map(row => clean(row.trip_type)),
      ...prices.map(row => clean(row.trip_type))
    ])
  ].filter(Boolean).sort();

  container.innerHTML = allTripTypes.map(type => {
    const rows = priceMap[type] || [];
    const cheapest = rows.length
      ? rows.slice().sort((a, b) => Number(a.price || 999999) - Number(b.price || 999999))[0]
      : null;

    const priceText = cheapest?.price
      ? `$${Number(cheapest.price).toFixed(2)}`
      : "Check Website";

    const bookingUrl = cheapest?.booking_url || cheapest?.source_url || "#";

    return `
      <div class="landing-detail-price-row">
        <span>${safe(type)}</span>
        <strong>${safe(priceText)}</strong>
        ${
          bookingUrl !== "#"
            ? `<a href="${safeUrl(bookingUrl)}" target="_blank" rel="noopener">Book</a>`
            : `<em>Check Website</em>`
        }
      </div>
    `;
  }).join("");
}

function renderFleet(rows) {
  const container = document.getElementById("landingFleet");
  if (!container) return;

  const map = {};

  rows.forEach(row => {
    const boat = clean(row.boat);
    if (!boat) return;

    if (!map[boat]) {
      map[boat] = {
        boat,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    map[boat].trips += 1;
    map[boat].anglers += Number(row.anglers || 0);
    map[boat].fish += Number(row.total_fish || 0);
  });

  const boats = Object.values(map)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1)
    }))
    .sort((a, b) => b.fpa - a.fpa)
    .slice(0, 12);

  if (!boats.length) {
    container.innerHTML = `<div class="empty-card">No fleet data found.</div>`;
    return;
  }

  container.innerHTML = boats.map(boat => `
    <a class="landing-fleet-card" href="/boat-detail.html?boat=${encodeURIComponent(boat.boat)}">
      <div>
        <h3>⚓ ${safe(boat.boat)}</h3>
        <p>${format(boat.trips)} trips · ${format(boat.fish)} fish</p>
      </div>
      <strong>${boat.fpa.toFixed(2)}</strong>
    </a>
  `).join("");
}

function renderRecentReports(rows) {
  const container = document.getElementById("landingRecentReports");
  if (!container) return;

  const recent = rows
    .slice()
    .sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0))
    .slice(0, 12);

  if (!recent.length) {
    container.innerHTML = `<div class="empty-card">No recent reports found.</div>`;
    return;
  }

  container.innerHTML = recent.map(row => `
    <article class="landing-report-card">
      <div>
        <h3>
          <a href="/boat-detail.html?boat=${encodeURIComponent(row.boat || "")}">
            ${safe(row.boat || "Unknown Boat")}
          </a>
        </h3>
        <span class="trip-pill">${safe(row.trip_type || "Trip")}</span>
      </div>

      <p>
        <strong>${format(row.anglers)}</strong> anglers ·
        <strong>${format(row.total_fish)}</strong> fish
      </p>

      <div class="landing-report-counts">
        ${renderFishCounts(row.fish_counts)}
      </div>
    </article>
  `).join("");
}

function renderFishCounts(fishCounts) {
  if (!fishCounts) return "N/A";

  return String(fishCounts)
    .split(",")
    .map(part => {
      const text = part.trim();
      const species = text.replace(/^[\d,]+\s+/, "");

      return `
        <a class="fish-count-pill" href="/species-detail.html?species=${encodeURIComponent(species)}">
          ${safe(text)}
        </a>
      `;
    })
    .join("");
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function clean(value) {
  return String(value || "").trim();
}

function format(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  const url = String(value || "#").trim();

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/")
  ) {
    return safe(url);
  }

  return "#";
}
