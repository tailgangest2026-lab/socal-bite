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
      fetchJson("trip-prices.json").catch(() => [])
    ]);

    dailyRows = rows;
    tripPrices = Array.isArray(prices) ? prices : [];

    const boatRows = dailyRows.filter(row =>
      clean(row.boat).toLowerCase() === selectedBoat.toLowerCase()
    );

    if (!boatRows.length) {
      renderNoBoatData();
      return;
    }

    renderSummary(boatRows);
    renderBoatIntel(boatRows);
    renderTrend(boatRows);
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
  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(url + sep + "v=" + Date.now());

  if (!response.ok) throw new Error("Could not load " + path);
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

  const stats = getStats(rows);

  setText("boatLanding", `${landing} · ${region}`);
  setText("boatScore", stats.score);
  setText("boatTrips", format(stats.trips));
  setText("boatAnglers", format(stats.anglers));
  setText("boatFish", format(stats.fish));
  setText("boatFpa", stats.fpa.toFixed(2));
}

function renderBoatIntel(rows) {
  const container = document.getElementById("boatIntel");
  if (!container) return;

  const stats = getStats(rows);
  const topSpecies = getTopSpecies(rows, 1)[0];
  const bestTrip = getBestTripType(rows);
  const streak = getHotStreak(rows);
  const bestDate = getBestTrip(rows);

  container.innerHTML = `
    <div class="boat-intel-row">
      <span>Current Trend</span>
      <strong>${safe(stats.trend)}</strong>
    </div>

    <div class="boat-intel-row">
      <span>Hot Streak</span>
      <strong>${streak.current} trip${streak.current === 1 ? "" : "s"}</strong>
    </div>

    <div class="boat-intel-row">
      <span>Best Species</span>
      <strong>${safe(topSpecies?.name || "N/A")}</strong>
    </div>

    <div class="boat-intel-row">
      <span>Best Trip Type</span>
      <strong>${safe(bestTrip?.tripType || "N/A")}</strong>
    </div>

    <div class="boat-intel-row">
      <span>Best Recent Trip</span>
      <strong>${bestDate ? `${format(bestDate.total_fish)} fish` : "N/A"}</strong>
    </div>
  `;
}

function renderTrend(rows) {
  const container = document.getElementById("boatTrend");
  if (!container) return;

  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.report_date || 0) - new Date(b.report_date || 0));

  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);

  const recentStats = getStats(recent);
  const previousStats = getStats(previous);

  const change = previousStats.fpa > 0
    ? ((recentStats.fpa - previousStats.fpa) / previousStats.fpa) * 100
    : 0;

  const direction = change > 10 ? "Rising" : change < -10 ? "Cooling" : "Stable";

  container.innerHTML = `
    <div class="boat-trend-main">
      <strong>${direction}</strong>
      <span>${change >= 0 ? "+" : ""}${change.toFixed(1)}% FPA change</span>
    </div>

    <div class="boat-intel-row">
      <span>Last 7 Trips FPA</span>
      <strong>${recentStats.fpa.toFixed(2)}</strong>
    </div>

    <div class="boat-intel-row">
      <span>Previous 7 Trips FPA</span>
      <strong>${previousStats.fpa.toFixed(2)}</strong>
    </div>
  `;
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
      map[tripType] = { tripType, trips: 0, fish: 0, anglers: 0 };
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

  const species = getTopSpecies(rows, 12);

  if (!species.length) {
    container.innerHTML = `<div class="empty-card">No species data found.</div>`;
    return;
  }

  const total = species.reduce((sum, item) => sum + item.count, 0);

  container.innerHTML = species.map(item => {
    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;

    return `
      <a class="boat-species-pill" href="/species-detail.html?species=${encodeURIComponent(item.name)}">
        <span>${safe(item.name)}</span>
        <strong>${format(item.count)}</strong>
        <em>${percent}%</em>
      </a>
    `;
  }).join("");
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

  container.innerHTML = recent.map(row => {
    const anglers = Number(row.anglers || 0);
    const fish = Number(row.total_fish || 0);
    const fpa = fish / Math.max(anglers, 1);

    return `
      <article class="boat-report-card">
        <div class="boat-report-top">
          <h3>${safe(formatDate(row.report_date))}</h3>
          <span class="trip-pill">${safe(row.trip_type || "Trip")}</span>
        </div>

        <p>
          <strong>${format(anglers)}</strong> anglers ·
          <strong>${format(fish)}</strong> fish ·
          <strong>${fpa.toFixed(2)}</strong> FPA
        </p>

        <div class="landing-report-counts">
          ${renderFishCounts(row.fish_counts)}
        </div>
      </article>
    `;
  }).join("");
}

function getStats(rows) {
  const trips = rows.length;
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  const fpa = fish / Math.max(anglers, 1);

  const score = calculateBoatScore(trips, anglers, fish, fpa);
  const trend = getTrend(rows);

  return { trips, anglers, fish, fpa, score, trend };
}

function calculateBoatScore(trips, anglers, fish, fpa) {
  let score = 0;

  score += Math.min(trips * 3, 30);
  score += Math.min(fpa * 14, 45);
  score += Math.min(fish / 25, 15);
  score += Math.min(anglers / 30, 10);

  return Math.round(Math.min(score, 100));
}

function getTrend(rows) {
  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.report_date || 0) - new Date(b.report_date || 0));

  const recent = sorted.slice(-7);
  const previous = sorted.slice(-14, -7);

  const recentFpa = getStatsBasic(recent).fpa;
  const previousFpa = getStatsBasic(previous).fpa;

  if (!previous.length || previousFpa === 0) return "Building";
  if (recentFpa > previousFpa * 1.1) return "Rising";
  if (recentFpa < previousFpa * 0.9) return "Cooling";
  return "Stable";
}

function getStatsBasic(rows) {
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  return { anglers, fish, fpa: fish / Math.max(anglers, 1) };
}

function getTopSpecies(rows, limit = 12) {
  const speciesTotals = {};

  rows.forEach(row => {
    parseFishCounts(row.fish_counts).forEach(item => {
      speciesTotals[item.species] = (speciesTotals[item.species] || 0) + item.count;
    });
  });

  return Object.entries(speciesTotals)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function getBestTripType(rows) {
  const map = {};

  rows.forEach(row => {
    const tripType = clean(row.trip_type || "Trip");
    if (!map[tripType]) map[tripType] = { tripType, fish: 0, anglers: 0, trips: 0 };

    map[tripType].fish += Number(row.total_fish || 0);
    map[tripType].anglers += Number(row.anglers || 0);
    map[tripType].trips += 1;
  });

  return Object.values(map)
    .map(item => ({ ...item, fpa: item.fish / Math.max(item.anglers, 1) }))
    .sort((a, b) => b.fpa - a.fpa)[0];
}

function getBestTrip(rows) {
  return rows
    .slice()
    .sort((a, b) => Number(b.total_fish || 0) - Number(a.total_fish || 0))[0];
}

function getHotStreak(rows) {
  const sorted = rows
    .slice()
    .sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0));

  let current = 0;

  for (const row of sorted) {
    if (Number(row.total_fish || 0) > 0) current++;
    else break;
  }

  return { current };
}

function renderNoBoatData() {
  setText("boatLanding", "No recent reports found for this boat.");
  setText("boatScore", "--");
  setText("boatTrips", "0");
  setText("boatAnglers", "0");
  setText("boatFish", "0");
  setText("boatFpa", "--");

  ["boatIntel", "boatTrend", "boatTripMix", "boatPrices", "boatSpecies", "boatReports"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="empty-card">No recent data found.</div>`;
  });
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

function formatDate(value) {
  if (!value) return "Recent Report";

  const date = new Date(value + "T00:00:00");
  if (isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
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
