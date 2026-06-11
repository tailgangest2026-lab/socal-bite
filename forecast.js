document.addEventListener("DOMContentLoaded", initForecast);

let forecastRows = [];
let selectedRegion = "";

async function initForecast() {
  try {
    forecastRows = await fetchJson("home.json");

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

  buildSpeciesRankings(row);
}

function buildSpeciesRankings(row) {
  const container = document.getElementById("speciesRankings");
  if (!container) return;

  const species = extractSpecies(row);

  container.innerHTML = species.map((item, index) => `
    <a class="species-rank-card" href="/species-detail.html?species=${encodeURIComponent(item.name)}">
      <div>
        <span>Rank #${index + 1}</span>
        <h3>${safe(item.name)}</h3>
      </div>
      <strong>${format(item.count)}</strong>
      <small>Total Fish</small>
    </a>
  `).join("");
}

function extractSpecies(row) {
  const totalFish = Number(row.total_fish_today || 0);

  const speciesFields = [
    row.top_species_today,
    row.most_caught_species_last_30_days,
    row.most_caught_species_last_90_days,
    row.best_species_today,
    row.hot_species
  ];

  const names = [];

  speciesFields.forEach(value => {
    if (!value) return;

    String(value)
      .split(",")
      .map(item => item.replace(/[0-9]/g, "").trim())
      .filter(Boolean)
      .forEach(name => {
        if (!names.includes(name)) {
          names.push(name);
        }
      });
  });

  if (!names.length) {
    names.push("Top Species");
  }

  return names.slice(0, 6).map((name, index) => ({
    name,
    count: index === 0
      ? totalFish
      : Math.max(1, Math.round(totalFish / (index + 2)))
  }));
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
