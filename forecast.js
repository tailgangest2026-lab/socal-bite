document.addEventListener("DOMContentLoaded", initForecast);

let forecastRows = [];
let dailyRows = [];
let selectedRegion = "";

async function initForecast() {
  try {
    forecastRows = await fetchJson("home.json");
    dailyRows = await loadRecentDailyRows();

    if (!Array.isArray(forecastRows) || !forecastRows.length) {
      throw new Error("No forecast rows found.");
    }

    selectedRegion = forecastRows[0].region || "Los Angeles";

    buildRegionTabs();
    renderForecast(selectedRegion);
  } catch (error) {
    console.error("Forecast load failed:", error);
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
  try {
    const index = await fetchJson("daily-report-index.json");

    if (!Array.isArray(index) || !index.length) {
      return [];
    }

    const recentReports = index.slice(0, 30);
    const rows = [];

    for (const report of recentReports) {
      const filePath = report.file || `reports/daily-report-${report.date}.json`;

      try {
        const reportRows = await fetchJson(filePath);

        if (Array.isArray(reportRows)) {
          rows.push(...reportRows);
        }
      } catch (error) {
        console.warn("Skipped report:", filePath, error);
      }
    }

    return rows;
  } catch (error) {
    console.warn("Could not load daily-report-index.json:", error);
    return [];
  }
}

function buildRegionTabs() {
  const tabs = document.getElementById("regionTabs");
  if (!tabs) return;

  tabs.innerHTML = forecastRows.map(row => {
    const region = row.region || "Unknown";

    return `
      <button
        class="${region === selectedRegion ? "active" : ""}"
        type="button"
        onclick="selectRegion('${escapeAttr(region)}')"
      >
        ${safe(region)}
      </button>
    `;
  }).join("");
}

function selectRegion(region) {
  selectedRegion = region;
  buildRegionTabs();
  renderForecast(region);
}

function renderForecast(region) {
  const row = forecastRows.find(r => r.region === region) || forecastRows[0];

  const fish = Number(row.total_fish_today || 0);
  const anglers = Number(row.total_anglers_today || 1);
  const trips = Number(row.total_trips_today || 1);
  const fpa = fish / Math.max(anglers, 1);

  const score = Math.round(Math.min(96, Math.max(35, 45 + fpa * 8 + trips * 1.5)));

  const label =
    score >= 85 ? "Excellent" :
    score >= 70 ? "Good" :
    score >= 55 ? "Fair" :
    "Slow";

  setText("selectedRegionLabel", region);
  setText("trendRegion", region);
  setText("biteScore", score);
  setText("biteLabel", label);

  setText("waterTemp", row.water_temp || row.waterTemp || estimateWaterTemp(region));
  setText("wind", row.wind || estimateWind(region));
  setText("swell", row.swell || estimateSwell(region));
  setText("visibility", row.visibility || estimateVisibility(region));
  setText("tide", row.tide_movement || row.tide || estimateTide(score));
  setText("sunrise", row.sunrise || "5:42 AM");
  setText("sunset", row.sunset || "8:01 PM");
  setText("moon", row.moon || "Waxing 62%");

  buildSpeciesRankings(region);
  buildSpeciesFpaChart(region);
}
function buildSpeciesFpaChart(region) {
  const chart = document.getElementById("speciesFpaChart");
  if (!chart) return;

  const species = buildSpeciesFpaByRegion(region);

  if (!species.length) {
    chart.innerHTML = `
      <div class="empty-card">
        No chart data found for ${safe(region)}.
      </div>
    `;
    return;
  }

  const maxFpa = Math.max(...species.map(item => item.fpa), 1);

  chart.innerHTML = species.map(item => {
    const width = Math.max(6, Math.round((item.fpa / maxFpa) * 100));

    return `
      <div class="fpa-row">
        <div class="fpa-label">
          <strong>${safe(item.name)}</strong>
          <span>${format(item.count)} fish · ${format(item.anglers)} anglers</span>
        </div>

        <div class="fpa-bar-wrap">
          <div class="fpa-bar" style="width:${width}%"></div>
        </div>

        <b>${item.fpa.toFixed(2)}</b>
      </div>
    `;
  }).join("");
}
function buildSpeciesRankings(region) {
  const container = document.getElementById("speciesRankings");
  if (!container) return;

  const species = buildSpeciesFpaByRegion(region);

  if (!species.length) {
    container.innerHTML = `
      <div class="empty-card">
        No species fish-per-angler data found for ${safe(region)}.
      </div>
    `;
    return;
  }

  container.innerHTML = species.map((item, index) => `
    <a class="species-rank-card" href="/species-detail.html?species=${encodeURIComponent(item.name)}">
      <div>
        <span>Rank #${index + 1}</span>
        <h3>${safe(item.name)}</h3>
      </div>
      <strong>${item.fpa.toFixed(2)}</strong>
      <small>${format(item.count)} fish · ${format(item.anglers)} anglers</small>
    </a>
  `).join("");
}

function buildSpeciesFpaByRegion(region) {
  const targetRegion = String(region || "").toLowerCase();

  const regionRows = dailyRows.filter(row => {
    return String(row.region || "").toLowerCase() === targetRegion;
  });

  const speciesTotals = {};
  const speciesAnglers = {};

  regionRows.forEach(row => {
    const anglers = Number(row.anglers || 0);
    const fishCounts = String(row.fish_counts || "");

    parseFishCounts(fishCounts).forEach(item => {
      if (!item.species || !Number.isFinite(item.count)) return;

      speciesTotals[item.species] = (speciesTotals[item.species] || 0) + item.count;
      speciesAnglers[item.species] = (speciesAnglers[item.species] || 0) + anglers;
    });
  });

  return Object.entries(speciesTotals)
    .map(([name, count]) => {
      const anglers = Math.max(speciesAnglers[name] || 1, 1);

      return {
        name,
        count,
        anglers,
        fpa: count / anglers
      };
    })
    .filter(item => item.count > 0)
    .sort((a, b) => b.fpa - a.fpa)
    .slice(0, 6);
}

function parseFishCounts(text) {
  return String(text || "")
    .split(",")
    .map(part => {
      const cleaned = part.trim();
      const match = cleaned.match(/^([\d,]+)\s+(.+)$/);

      if (!match) return null;

      return {
        count: Number(match[1].replace(/,/g, "")),
        species: match[2].trim()
      };
    })
    .filter(Boolean);
}

function estimateWaterTemp(region) {
  const temps = {
    "San Diego": "67°F",
    "Orange County": "66°F",
    "Los Angeles": "65°F",
    "Ventura": "63°F",
    "Santa Barbara": "62°F",
    "San Luis Obispo": "60°F"
  };

  return temps[region] || "65°F";
}

function estimateWind(region) {
  const winds = {
    "San Diego": "5 kt S",
    "Orange County": "6 kt SW",
    "Los Angeles": "7 kt W",
    "Ventura": "9 kt W",
    "Santa Barbara": "8 kt NW",
    "San Luis Obispo": "10 kt NW"
  };

  return winds[region] || "6 kt W";
}

function estimateSwell(region) {
  const swells = {
    "San Diego": "4 ft @ 11s",
    "Orange County": "3 ft @ 12s",
    "Los Angeles": "3 ft @ 10s",
    "Ventura": "4 ft @ 9s",
    "Santa Barbara": "2 ft @ 11s",
    "San Luis Obispo": "5 ft @ 10s"
  };

  return swells[region] || "3 ft @ 10s";
}

function estimateVisibility(region) {
  return region === "San Diego" ? "13 mi" : "10 mi";
}

function estimateTide(score) {
  if (score >= 75) return "Moving";
  if (score >= 55) return "Rising";
  return "Falling";
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "--";
}

function format(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function safe(value) {
  return String(value || "N/A")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return String(value || "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', "&quot;");
}
