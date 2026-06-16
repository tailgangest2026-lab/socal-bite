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

    forecastRows = forecastRows.filter(row =>
      conditionRows.some(condition =>
        normalizeRegion(condition.region) === normalizeRegion(row.region)
      )
    );

    if (!Array.isArray(forecastRows) || !forecastRows.length) {
      throw new Error("No matching forecast and condition rows found.");
    }

    selectedRegion = getDefaultRegion();

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

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

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
    console.warn("Could not load recent daily rows:", error);
    return [];
  }
}

function getDefaultRegion() {
  const preferred = [
    "Los Angeles",
    "Orange County",
    "San Diego",
    "Ventura",
    "Santa Barbara",
    "San Luis Obispo"
  ];

  const match = preferred.find(region =>
    forecastRows.some(row =>
      normalizeRegion(row.region) === normalizeRegion(region)
    )
  );

  return match || forecastRows[0]?.region || "Los Angeles";
}

function buildRegionTabs() {
  const tabs = document.getElementById("regionTabs");
  if (!tabs) return;

  const regions = forecastRows
    .map(row => row.region)
    .filter(Boolean);

  tabs.innerHTML = regions.map(region => `
    <button
      class="${normalizeRegion(region) === normalizeRegion(selectedRegion) ? "active" : ""}"
      type="button"
      onclick="selectRegion('${escapeAttr(region)}')"
    >
      ${safe(cleanRegionLabel(region))}
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

  setText("selectedRegionLabel", cleanRegionLabel(displayRegion));
  setText("trendRegion", cleanRegionLabel(displayRegion));

  const forecast = await calculateForecastScore(row, condition, displayRegion, fpa, trips);

  if (currentToken !== renderToken) return;

  const score = forecast.score;
  const label = getScoreLabel(score);

  updateBiteScoreGauge(score, label);

  setText("waterTemp", formatTemp(getValue(condition, ["waterTemp", "water_temp", "watertemp"])) || forecast.waterTempText || estimateWaterTemp(displayRegion));
  setText("wind", formatWind(condition) || forecast.windText || estimateWind(displayRegion));
  setText("swell", formatSwell(condition) || forecast.swellText || estimateSwell(displayRegion));
  setText("visibility", getValue(condition, ["visibility"]) || forecast.visibilityText || estimateVisibility(displayRegion));
  setText("tide", getValue(condition, ["tideMovement", "tide_movement", "tidemovement", "tide"]) || forecast.tideText || estimateTide(score));
  setText("sunrise", getValue(condition, ["sunrise"]) || row.sunrise || "5:42 AM");
  setText("sunset", getValue(condition, ["sunset"]) || row.sunset || "8:01 PM");
  setText("moon", getValue(condition, ["moon"]) || row.moon || "Waxing 62%");

  buildSpeciesRankings(displayRegion);
  buildSpeciesFpaChart(displayRegion);
}

function getLatestConditionForRegion(region) {
  if (!Array.isArray(conditionRows)) return null;

  const target = normalizeRegion(region);

  const matches = conditionRows
    .filter(row => normalizeRegion(row.region) === target)
    .sort((a, b) => {
      const dateA = new Date(getValue(a, ["date", "updatedAt", "updated_at", "updatedat"]) || 0);
      const dateB = new Date(getValue(b, ["date", "updatedAt", "updated_at", "updatedat"]) || 0);
      return dateB - dateA;
    });

  return matches[0] || null;
}

async function calculateForecastScore(row, condition, region, fpa, trips) {
  const locations = {
    "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340" },
    "Santa Barbara County": { lat: 34.4208, lon: -119.6982, station: "9411340" },

    "Ventura": { lat: 34.2746, lon: -119.2290, station: "9411189" },
    "Ventura County": { lat: 34.2746, lon: -119.2290, station: "9411189" },

    "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660" },
    "Los Angeles County": { lat: 33.7405, lon: -118.2817, station: "9410660" },

    "Orange County": { lat: 33.6037, lon: -117.9, station: "9410580" },

    "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170" },
    "San Diego County": { lat: 32.7157, lon: -117.1611, station: "9410170" },

    "San Luis Obispo": { lat: 35.2828, lon: -120.6596, station: "9412110" },
    "San Luis Obispo County": { lat: 35.2828, lon: -120.6596, station: "9412110" }
  };

  const base = locations[region] || locations[cleanRegionLabel(region)];
  let score = Number(getValue(condition, ["score"]) || 45);

  if (!getValue(condition, ["score"])) {
    if (fpa >= 8) score += 25;
    else if (fpa >= 5) score += 18;
    else if (fpa >= 3) score += 12;
    else if (fpa >= 1.5) score += 7;

    if (trips >= 20) score += 10;
    else if (trips >= 10) score += 6;
    else if (trips >= 5) score += 3;
  }

  const conditionWind = Number(getValue(condition, ["windSpeed", "wind_speed", "windspeed"]));
  const conditionGust = Number(getValue(condition, ["windGust", "windGusts", "wind_gust", "windgust"]));
  const conditionTemp = Number(getValue(condition, ["waterTemp", "water_temp", "watertemp"]));
  const conditionSwell = Number(getValue(condition, ["swellHeight", "swell_height", "swellheight", "waveHeight", "wave_height", "waveheight"]));
  const conditionTide = getValue(condition, ["tideMovement", "tide_movement", "tidemovement", "tide"]);

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

  if (String(conditionTide || "").toLowerCase().includes("moving")) {
    score += 7;
  }

  if (!base || typeof SCBConditions === "undefined") {
    return {
      score: clampScore(score),
      waterTempText: formatTemp(conditionTemp),
      windText: formatWind(condition),
      swellText: formatSwell(condition),
      visibilityText: getValue(condition, ["visibility"]) || estimateVisibility(region),
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
      visibilityText: weather?.visibility || getValue(condition, ["visibility"]) || estimateVisibility(region),
      tideText: tideMovement || conditionTide || estimateTide(score)
    };
  } catch (error) {
    console.warn("NOAA forecast fallback used:", error);

    return {
      score: clampScore(score),
      waterTempText: formatTemp(conditionTemp),
      windText: formatWind(condition),
      swellText: formatSwell(condition),
      visibilityText: getValue(condition, ["visibility"]) || estimateVisibility(region),
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
      parent.innerHTML = `<div class="empty-card">No 12-week trend data found for ${safe(cleanRegionLabel(region))}.</div>`;
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
    container.innerHTML = `<div class="empty-card">No species fish-per-angler data found for ${safe(cleanRegionLabel(region))}.</div>`;
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
  const regionRows = dailyRows.filter(row =>
    normalizeRegion(row.region) === targetRegion
  );

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
  const rows = dailyRows.filter(row =>
    normalizeRegion(row.region) === targetRegion
  );

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

function getValue(obj, keys) {
  if (!obj) return "";

  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }

  return "";
}

function formatTemp(value) {
  const temp = Number(value);
  if (!Number.isFinite(temp)) return "";
  return `${Math.round(temp)}°F`;
}

function formatWind(row) {
  if (!row) return "";

  const speed = Number(getValue(row, ["windSpeed", "wind_speed", "windspeed"]));
  const gust = Number(getValue(row, ["windGust", "windGusts", "wind_gust", "windgust"]));
  const direction = getValue(row, ["windDirection", "wind_direction", "winddirection"]);

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

  const wave = Number(getValue(row, ["waveHeight", "wave_height", "waveheight"]));
  const swell = Number(getValue(row, ["swellHeight", "swell_height", "swellheight"]));
  const period = Number(getValue(row, ["swellPeriod", "swell_period", "swellperiod"]));

  const height = Number.isFinite(swell) && swell > 0 ? swell : wave;

  if (!Number.isFinite(height)) return "";

  let text = `${height.toFixed(1)} ft`;

  if (Number.isFinite(period) && period > 0) {
    text += ` @ ${Math.round(period)}s`;
  }

  return text;
}

function normalizeRegion(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ");

  const aliases = {
    "los angeles county": "los angeles",
    "los angeles": "los angeles",
    "la": "los angeles",
    "l a": "los angeles",

    "orange county": "orange county",
    "orange": "orange county",
    "oc": "orange county",
    "o c": "orange county",

    "san diego county": "san diego",
    "san diego": "san diego",

    "ventura county": "ventura",
    "ventura": "ventura",

    "santa barbara county": "santa barbara",
    "santa barbara": "santa barbara",

    "san luis obispo county": "san luis obispo",
    "san luis obispo": "san luis obispo",
    "slo": "san luis obispo",
    "s l o": "san luis obispo"
  };

  return aliases[text] || text;
}

function cleanRegionLabel(region) {
  const normalized = normalizeRegion(region);

  const labels = {
    "los angeles": "Los Angeles",
    "orange county": "Orange County",
    "san diego": "San Diego",
    "ventura": "Ventura",
    "santa barbara": "Santa Barbara",
    "san luis obispo": "San Luis Obispo"
  };

  return labels[normalized] || region;
}

function estimateWaterTemp(region) {
  const temps = {
    "San Diego": "67°F",
    "San Diego County": "67°F",
    "Orange County": "66°F",
    "Los Angeles": "65°F",
    "Los Angeles County": "65°F",
    "Ventura": "63°F",
    "Ventura County": "63°F",
    "Santa Barbara": "62°F",
    "Santa Barbara County": "62°F",
    "San Luis Obispo": "60°F",
    "San Luis Obispo County": "60°F"
  };

  return temps[region] || temps[cleanRegionLabel(region)] || "65°F";
}

function estimateWind(region) {
  const winds = {
    "San Diego": "5 kt S",
    "San Diego County": "5 kt S",
    "Orange County": "6 kt SW",
    "Los Angeles": "7 kt W",
    "Los Angeles County": "7 kt W",
    "Ventura": "9 kt W",
    "Ventura County": "9 kt W",
    "Santa Barbara": "8 kt NW",
    "Santa Barbara County": "8 kt NW",
    "San Luis Obispo": "10 kt NW",
    "San Luis Obispo County": "10 kt NW"
  };

  return winds[region] || winds[cleanRegionLabel(region)] || "6 kt W";
}

function estimateSwell(region) {
  const swells = {
    "San Diego": "4 ft @ 11s",
    "San Diego County": "4 ft @ 11s",
    "Orange County": "3 ft @ 12s",
    "Los Angeles": "3 ft @ 10s",
    "Los Angeles County": "3 ft @ 10s",
    "Ventura": "4 ft @ 9s",
    "Ventura County": "4 ft @ 9s",
    "Santa Barbara": "2 ft @ 11s",
    "Santa Barbara County": "2 ft @ 11s",
    "San Luis Obispo": "5 ft @ 10s",
    "San Luis Obispo County": "5 ft @ 10s"
  };

  return swells[region] || swells[cleanRegionLabel(region)] || "3 ft @ 10s";
}

function estimateVisibility(region) {
  return cleanRegionLabel(region) === "San Diego" ? "13 mi" : "10 mi";
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
