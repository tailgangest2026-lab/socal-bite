document.addEventListener("DOMContentLoaded", initForecast);

let forecastRows = [];
let conditionRows = [];
let dailyRows = [];
let selectedRegion = "";
let speciesFpaChartInstance = null;
let reportYearCache = {};
let renderToken = 0;

async function initForecast() {
  try {
    forecastRows = await fetchJson("../home.json");
    conditionRows = await fetchJson("../conditions.json");
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
  const url = window.socalBiteDataUrl
    ? window.socalBiteDataUrl(path)
    : path;

  const response = await fetch(url + (url.includes("?") ? "&" : "?") + "v=" + Date.now());

  if (!response.ok) throw new Error("Could not load " + path);

  return response.json();
}

async function fetchReportYear(year) {
  if (reportYearCache[year]) return reportYearCache[year];

  const rows = await fetchJson(`../reports/reports-${year}.json`);
  reportYearCache[year] = Array.isArray(rows) ? rows : [];

  return reportYearCache[year];
}

async function loadRecentDailyRows() {
  try {
    const index = await fetchJson("../daily-report-index.json");
    if (!Array.isArray(index) || !index.length) return [];

    const recentDates = new Set(
      index
        .slice(0, 100)
        .map(report => String(report.date || "").split("T")[0])
        .filter(Boolean)
    );

    const years = [...new Set([...recentDates].map(date => date.substring(0, 4)))];
    const rows = [];

    for (const year of years) {
      try {
        const yearRows = await fetchReportYear(year);

        rows.push(
          ...yearRows
            .filter(row => recentDates.has(String(row.trip_date || "").split("T")[0]))
            .map(row => ({
              ...row,
              __reportDate: String(row.trip_date || "").split("T")[0]
            }))
        );
      } catch (error) {
        console.warn("Could not load yearly report:", year, error);
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

  const regions = [
    ...new Set(
      forecastRows
        .map(row => row.region || "Unknown")
        .filter(Boolean)
    )
  ];

  tabs.innerHTML = regions.map(region => `
    <button
      class="${normalizeRegion(region) === normalizeRegion(selectedRegion) ? "active" : ""}"
      type="button"
      onclick="selectRegion('${escapeAttr(region)}')"
    >
      ${safe(region)}
    </button>
  `).join("");
}

function selectRegion(region) {
  selectedRegion = region;
  buildRegionTabs();
  renderForecast(region);
}

async function renderForecast(region) {
  const currentToken = ++renderToken;

  const row =
    forecastRows.find(r => normalizeRegion(r.region) === normalizeRegion(region)) ||
    forecastRows[0];

  const displayRegion = row.region || region || "Los Angeles";
  const condition = getLatestConditionForRegion(displayRegion);

  console.log("Forecast selected region:", displayRegion);
  console.log("Forecast matched condition:", condition);

  const fish = Number(row.total_fish_today || row.totalFish || row.fish || 0);
  const anglers = Number(row.total_anglers_today || row.totalAnglers || row.anglers || 1);
  const trips = Number(row.total_trips_today || row.totalTrips || row.trips || 1);
  const fpa = fish / Math.max(anglers, 1);

  setText("selectedRegionLabel", displayRegion);
  setText("trendRegion", displayRegion);

  const forecast = await calculateForecastScore(row, condition, displayRegion, fpa, trips);

  if (currentToken !== renderToken) return;

  const score = forecast.score;
  const label = getScoreLabel(score);

  updateBiteScoreGauge(score, label);

  setText("waterTemp", formatTemp(condition?.waterTemp || condition?.water_temp) || forecast.waterTempText || estimateWaterTemp(displayRegion));
  setText("wind", formatWind(condition) || forecast.windText || estimateWind(displayRegion));
  setText("swell", formatSwell(condition) || forecast.swellText || estimateSwell(displayRegion));
  setText("visibility", condition?.visibility || forecast.visibilityText || estimateVisibility(displayRegion));
  setText("tide", condition?.tideMovement || condition?.tide_movement || condition?.tide || forecast.tideText || estimateTide(score));
  setText("sunrise", condition?.sunrise || row.sunrise || "5:42 AM");
  setText("sunset", condition?.sunset || row.sunset || "8:01 PM");
  setText("moon", condition?.moon || row.moon || "Waxing 62%");

  buildSpeciesRankings(displayRegion);
  buildSpeciesFpaChart(displayRegion);
}

function getLatestConditionForRegion(region) {
  if (!Array.isArray(conditionRows)) return null;

  const target = normalizeRegion(region);

  const matches = conditionRows
    .filter(row => {
      const rowRegion = normalizeRegion(
        row.region ||
        row.county ||
        row.area ||
        row.name ||
        row.location
      );

      return rowRegion === target;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date || a.updatedAt || a.updated_at || 0);
      const dateB = new Date(b.date || b.updatedAt || b.updated_at || 0);
      return dateB - dateA;
    });

  return matches[0] || null;
}

async function calculateForecastScore(row, condition, region, fpa, trips) {
  const locations = {
    "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340" },
    "Ventura": { lat: 34.2746, lon: -119.2290, station: "9411189" },
    "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660" },
    "Orange County": { lat: 33.6037, lon: -117.9, station: "9410580" },
    "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170" },
    "San Luis Obispo": { lat: 35.2828, lon: -120.6596, station: "9412110" }
  };

  const base = locations[region];
  let score = Number(condition?.score || 45);

  if (!condition?.score) {
    if (fpa >= 8) score += 25;
    else if (fpa >= 5) score += 18;
    else if (fpa >= 3) score += 12;
    else if (fpa >= 1.5) score += 7;

    if (trips >= 20) score += 10;
    else if (trips >= 10) score += 6;
    else if (trips >= 5) score += 3;
  }

  const conditionWind = Number(condition?.windSpeed || condition?.wind_speed);
  const conditionGust = Number(condition?.windGust || condition?.windGusts || condition?.wind_gust);
  const conditionTemp = Number(condition?.waterTemp || condition?.water_temp);
  const conditionSwell = Number(condition?.swellHeight || condition?.swell_height || condition?.waveHeight || condition?.wave_height);
  const conditionTide = condition?.tideMovement || condition?.tide_movement || condition?.tide;

  if (Number.isFinite(conditionWind)) {
    if (conditionWind <= 6) score += 10;
    else if (conditionWind <= 10) score += 6;
    else if (conditionWind <= 15) score += 1;
    else score -= 10;
  }

  if (Number.isFinite(conditionGust) && conditionGust >= 25) score -= 8;

  if (Number.isFinite(conditionSwell)) {
    if (conditionSwell <= 2.5) score += 8;
    else if (conditionSwell <= 4) score += 4;
    else if (conditionSwell >= 5) score -= 10;
  }

  if (Number.isFinite(conditionTemp)) {
    if (conditionTemp >= 63 && conditionTemp <= 70) score += 6;
    else if (conditionTemp < 58 || conditionTemp > 74) score -= 6;
  }

  if (String(conditionTide || "").toLowerCase().includes("moving")) score += 7;

  if (!base || typeof SCBConditions === "undefined") {
    return {
      score: clampScore(score),
      waterTempText: formatTemp(conditionTemp),
      windText: formatWind(condition),
      swellText: formatSwell(condition),
      visibilityText: condition?.visibility || estimateVisibility(region),
      tideText: conditionTide || estimateTide(score)
    };
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    const [weather, tides, waterTemp, marine] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, today),
      SCBConditions.getTides(base.station, today),
      SCBConditions.getWaterTemp(base.station),
      typeof SCBConditions.getMarine === "function"
        ? SCBConditions.getMarine(base.lat, base.lon, today)
        : Promise.resolve(null)
    ]);

    const wind = SCBConditions.parseWindSpeed
      ? SCBConditions.parseWindSpeed(weather?.windSpeed, conditionWind || 8)
      : Number(weather?.windSpeed || conditionWind || 8);

    const gusts = Number(weather?.windGusts || conditionGust || 0);
    const temp = Number(waterTemp || conditionTemp || 65);
    const swell = Number(marine?.waveHeight || marine?.swellWaveHeight || conditionSwell || 3);
    const tideMovement = getTideMovement(tides) || conditionTide;

    return {
      score: clampScore(score),
      waterTempText: Number.isFinite(temp) ? `${Math.round(temp)}°F` : formatTemp(conditionTemp),
      windText: buildWindText(weather, wind, gusts),
      swellText: Number.isFinite(swell) ? `${swell.toFixed(1)} ft` : formatSwell(condition),
      visibilityText: weather?.visibility || condition?.visibility || estimateVisibility(region),
      tideText: tideMovement || conditionTide || estimateTide(score)
    };
  } catch (error) {
    console.warn("NOAA forecast fallback used:", error);

    return {
      score: clampScore(score),
      waterTempText: formatTemp(conditionTemp),
      windText: formatWind(condition),
      swellText: formatSwell(condition),
      visibilityText: condition?.visibility || estimateVisibility(region),
      tideText: conditionTide || estimateTide(score)
    };
  }
}

function updateBiteScoreGauge(score, label) {
  const cleanScore = Math.max(0, Math.min(100, Number(score || 0)));

  const scoreValue = document.getElementById("biteScoreValue");
  const scoreLabel = document.getElementById("biteScoreLabel");
  const scoreRing =
    document.getElementById("biteScoreRing") ||
    document.querySelector(".score-ring");

  if (scoreValue) scoreValue.textContent = Math.round(cleanScore);
  if (scoreLabel) scoreLabel.textContent = label || getScoreLabel(cleanScore);

  if (!scoreRing) return;

  scoreRing.style.setProperty("--score", cleanScore);

  scoreRing.classList.remove("score-poor", "score-ok", "score-fair", "score-good");
  scoreRing.classList.add(getScoreClass(cleanScore));
}

function getScoreClass(score) {
  score = Number(score || 0);
  if (score < 40) return "score-poor";
  if (score < 60) return "score-ok";
  if (score < 80) return "score-fair";
  return "score-good";
}

function getScoreLabel(score) {
  score = Number(score || 0);
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Slow";
}

function buildSpeciesFpaChart(region) {
  const canvas = document.getElementById("speciesFpaChart");
  if (!canvas) return;

  const trend = buildSpeciesWeeklyTrend(region);

  if (!trend.weeks.length || !trend.datasets.length) {
    const parent = canvas.parentElement;
    if (parent) {
      parent.innerHTML = `<div class="empty-card">No 12-week trend data found for ${safe(region)}.</div>`;
    }
    return;
  }

  if (speciesFpaChartInstance) speciesFpaChartInstance.destroy();

  speciesFpaChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: trend.weeks,
      datasets: trend.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            color: "#9cc4d5",
            usePointStyle: true
          }
        }
      },
      scales: {
        x: {
          ticks: { color: "#9cc4d5" },
          grid: { color: "rgba(255,255,255,0.05)" }
        },
        y: {
          beginAtZero: true,
          ticks: { color: "#9cc4d5" },
          grid: { color: "rgba(255,255,255,0.08)" }
        }
      }
    }
  });
}

function buildSpeciesRankings(region) {
  const container = document.getElementById("speciesRankings");
  if (!container) return;

  const species = buildSpeciesFpaByRegion(region);

  if (!species.length) {
    container.innerHTML = `<div class="empty-card">No species fish-per-angler data found for ${safe(region)}.</div>`;
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
  const targetRegion = normalizeRegion(region);
  const regionRows = dailyRows.filter(row => normalizeRegion(row.region) === targetRegion);

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

function buildSpeciesWeeklyTrend(region) {
  const targetRegion = normalizeRegion(region);
  const rows = dailyRows.filter(row => normalizeRegion(row.region) === targetRegion);

  const today = new Date();
  const weeks = [];

  for (let i = 11; i >= 0; i--) {
    const start = new Date(today);
    start.setDate(today.getDate() - i * 7 - 6);

    const end = new Date(today);
    end.setDate(today.getDate() - i * 7);

    weeks.push({
      key: `${start.getFullYear()}-W${String(getWeekNumber(start)).padStart(2, "0")}`,
      label: `${start.getFullYear()}-W${String(getWeekNumber(start)).padStart(2, "0")}`,
      start,
      end
    });
  }

  const speciesTotals = {};

  rows.forEach(row => {
    const rowDate = new Date(row.trip_date || row.__reportDate || row.date || "");
    if (isNaN(rowDate)) return;

    const anglers = Number(row.anglers || 0);
    if (!anglers) return;

    const week = weeks.find(w => rowDate >= w.start && rowDate <= w.end);
    if (!week) return;

    parseFishCounts(row.fish_counts).forEach(item => {
      if (!item || !item.species) return;

      if (!speciesTotals[item.species]) speciesTotals[item.species] = {};
      if (!speciesTotals[item.species][week.key]) {
        speciesTotals[item.species][week.key] = { fish: 0, anglers: 0 };
      }

      speciesTotals[item.species][week.key].fish += Number(item.count || 0);
      speciesTotals[item.species][week.key].anglers += anglers;
    });
  });

  const topSpecies = Object.entries(speciesTotals)
    .map(([name, weekData]) => {
      const fish = Object.values(weekData).reduce((sum, item) => sum + item.fish, 0);
      return { name, fish };
    })
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 6)
    .map(item => item.name);

  const colors = ["#20d3e2", "#7b61ff", "#ff5b5b", "#24d17e", "#ffc766", "#00c2ff"];

  const datasets = topSpecies.map((species, index) => ({
    label: species,
    data: weeks.map(week => {
      const item = speciesTotals[species]?.[week.key];
      if (!item || !item.anglers) return null;
      return Number((item.fish / item.anglers).toFixed(2));
    }),
    borderColor: colors[index],
    backgroundColor: colors[index],
    borderWidth: 2,
    tension: 0.4,
    pointRadius: 2,
    pointHoverRadius: 5,
    fill: false,
    spanGaps: true
  }));

  return {
    weeks: weeks.map(w => w.label),
    datasets
  };
}

function getTideMovement(tides) {
  if (!Array.isArray(tides) || tides.length < 2) return "Unknown";

  const now = new Date();

  const validTides = tides
    .map(tide => {
      const time = tide.t || tide.time || tide.dateTime || tide.timestamp;
      const value = Number(tide.v || tide.value || tide.height || tide.prediction);

      return {
        time: time ? new Date(time) : null,
        value
      };
    })
    .filter(tide => tide.time instanceof Date && !isNaN(tide.time) && Number.isFinite(tide.value))
    .sort((a, b) => a.time - b.time);

  if (validTides.length < 2) return "Unknown";

  let previous = validTides[0];
  let next = validTides[1];

  for (let i = 1; i < validTides.length; i++) {
    if (validTides[i].time >= now) {
      previous = validTides[i - 1] || validTides[i];
      next = validTides[i];
      break;
    }
  }

  const diff = next.value - previous.value;

  if (Math.abs(diff) < 0.15) return "Slack";
  if (diff > 0) return "Moving Rising";
  return "Moving Falling";
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

function formatTemp(value) {
  const temp = Number(value);
  if (!Number.isFinite(temp)) return "";
  return `${Math.round(temp)}°F`;
}

function formatWind(row) {
  if (!row) return "";

  const speed = Number(row.windSpeed || row.wind_speed);
  const gust = Number(row.windGust || row.windGusts || row.wind_gust);
  const direction = row.windDirection || row.wind_direction || "";

  if (!Number.isFinite(speed)) return "";

  let text = `${Math.round(speed)} kt`;

  if (direction) text += ` ${direction}`;
  if (Number.isFinite(gust) && gust > speed) text += `, gusts ${Math.round(gust)} kt`;

  return text;
}

function buildWindText(weather, wind, gusts) {
  const speed = Math.round(Number(wind || weather?.windSpeed || 0));
  const direction =
    weather?.windDirectionText ||
    weather?.windDirection ||
    weather?.windDir ||
    "";

  let text = `${speed} kt`;

  if (direction) text += ` ${direction}`;
  if (Number.isFinite(gusts) && gusts > speed) text += `, gusts ${Math.round(gusts)} kt`;

  return text;
}

function formatSwell(row) {
  if (!row) return "";

  const wave = Number(row.waveHeight || row.wave_height);
  const swell = Number(row.swellHeight || row.swell_height);
  const period = Number(row.swellPeriod || row.swell_period);

  const height = Number.isFinite(swell) ? swell : wave;

  if (!Number.isFinite(height)) return "";

  let text = `${height.toFixed(1)} ft`;

  if (Number.isFinite(period)) text += ` @ ${Math.round(period)}s`;

  return text;
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

function clampScore(score) {
  return Math.max(35, Math.min(96, Math.round(Number(score || 0))));
}

function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function normalizeRegion(value) {
  let text = String(value || "")
    .trim()
    .toLowerCase();

  text = text
    .replaceAll(".", "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ");

  text = text
    .replace(/\bcounty\b/g, "")
    .replace(/\bca\b/g, "")
    .replace(/\bcalifornia\b/g, "")
    .trim();

  const aliases = {
    "la": "los angeles",
    "l a": "los angeles",
    "los angeles county": "los angeles",
    "orange": "orange county",
    "oc": "orange county",
    "o c": "orange county",
    "orange county": "orange county",
    "san diego county": "san diego",
    "santa barbara county": "santa barbara",
    "ventura county": "ventura",
    "san luis obispo county": "san luis obispo",
    "slo": "san luis obispo",
    "s l o": "san luis obispo"
  };

  return aliases[text] || text;
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
