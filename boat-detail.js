document.addEventListener("DOMContentLoaded", initBoatDetail);

let selectedBoat = "";
let dailyRows = [];
let tripPrices = [];

async function initBoatDetail() {
  selectedBoat = getParam("boat");

  if (!selectedBoat) {
    setText("boatName", "Boat not found");
    setText("boatLanding", "Missing boat name.");
    return;
  }

  setText("boatName", selectedBoat);

  try {
    const [rows, prices] = await Promise.all([
      loadRecentDailyRows(),
      fetchJson("trip-prices.json")
    ]);

    dailyRows = rows;
    tripPrices = Array.isArray(prices) ? prices : [];

    const boatRows = dailyRows.filter(row => {
      return clean(row.boat).toLowerCase() === selectedBoat.toLowerCase();
    });

    renderSummary(boatRows);
    renderTripMix(boatRows);
    renderPrices(boatRows);
    renderTopSpecies(boatRows);
    renderReports(boatRows);
  } catch (error) {
    console.error("Boat detail load failed:", error);
    setText("boatLanding", "Could not load boat profile.");
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

function renderSummary(rows) {
  const landing = clean(rows[0]?.landing || "Unknown Landing");
  const region = clean(rows[0]?.region || "Southern California");

  const trips = rows.length;
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  const fpa = fish / Math.max(anglers, 1);

  setText("boatLanding", `${landing} · ${region}`);
  setText("boatTrips", format(trips));
  setText("boatAnglers", format(anglers));
  setText("boatFish", format(fish));
  setText("boatFpa", fpa.toFixed(2));
}

function renderTripMix(rows) {
  const container = document.getElementById("boatTripMix");
  if (!container) return;

  const map = {};

  rows.forEach(row => {
    const tripType = clean(row.trip_type || "Trip");
    const fish = Number(row.total_fish || 0);
    const anglers = Number(row.anglers || 0);

    if (!map[tripType]) {
      map[tripType] = {
        tripType,
        trips: 0,
        fish: 0,
        anglers: 0
      };
    }

    map[tripType].trips += 1;
    map[tripType].fish += fish;
    map[tripType].anglers += anglers;
  });

  const tripMix = Object.values(map)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1)
    }))
    .sort((a, b) => b.trips - a.trips);

  if (!tripMix.length) {
    container.innerHTML = `<div class="empty-card">No trip mix found.</div>`;
    return;
  }

  container.innerHTML = tripMix.map(item => `
    <div class="boat-trip-row">
      <span class="trip-pill">${safe(item.tripType)}</span>
      <b>${format(item.trips)} trips</b>
      <b>${format(item.fish)} fish</b>
      <strong>${item.fpa.toFixed(2)} FPA</strong>
    </div>
  `).join("");
}

function renderPrices(rows) {
  const container = document.getElementById("boatPrices");
  if (!container) return;

  const landing = clean(rows[0]?.landing || "");
  const boat = selectedBoat.toLowerCase();

  let prices = tripPrices.filter(row => {
    const priceBoat = clean(row.boat).toLowerCase();
    const priceLanding = clean(row.landing).toLowerCase();

    return priceBoat === boat || (!priceBoat && landing && priceLanding === landing.toLowerCase());
  });

  prices = prices
    .filter(row => row.price || row.booking_url || row.source_url)
    .sort((a, b) => Number(a.price || 999999) - Number(b.price || 999999))
    .slice(0, 12);

  if (!prices.length) {
    container.innerHTML = `<div class="empty-card">No pricing found for this boat or landing.</div>`;
    return;
  }

  container.innerHTML = prices.map(row => `
    <div class="boat-price-row">
      <div>
        <h3>${safe(row.trip_type || "Trip")}</h3>
        <p>${safe(row.notes || "Check landing website for details.")}</p>
      </div>

      <strong>${row.price ? "$" + Number(row.price).toFixed(0) : "Check"}</strong>

      <a href="${safeUrl(row.booking_url || row.source_url || "#")}" target="_blank" rel="noopener">
        Book →
      </a>
    </div>
  `).join("");
}

function renderTopSpecies(rows) {
  const container = document.getElementById("boatSpecies");
  if (!container) return;

  const speciesTotals = {};

  rows.forEach(row => {
    parseFishCounts(row.fish_counts).forEach(item => {
      speciesTotals[item.species] = (speciesTotals[item.species] || 0) + item.count;
    });
  });

  const species = Object.entries(speciesTotals)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  if (!species.length) {
    container.innerHTML = `<div class="empty-card">No species data found.</div>`;
    return;
  }

  container.innerHTML = species.map(item => `
    <a class="boat-species-pill" href="/species-detail.html?species=${encodeURIComponent(item.name)}">
      <span>${safe(item.name)}</span>
      <strong>${format(item.count)}</strong>
    </a>
  `).join("");
}

function renderReports(rows) {
  const container = document.getElementById("boatReports");
  if (!container) return;

  const recent = rows
    .slice()
    .sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0))
    .slice(0, 16);

  if (!recent.length) {
    container.innerHTML = `<div class="empty-card">No trips for this boat in the latest reports.</div>`;
    return;
  }

  container.innerHTML = recent.map(row => `
    <article class="boat-report-card">
      <div class="boat-report-top">
        <h3>${safe(row.report_date || "Recent Report")}</h3>
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

function parseFishCounts(text) {
  return String(text || "")
    .split(",")
    .map(part => {
      const match = part.trim().match(/^([\d,]+)\s+(.+)$/);
      if (!match) return null;

      return {
        count: Number(match[1].replace(/,/g, "")),
        species: match[2].trim()
      };
    })
    .filter(Boolean);
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
