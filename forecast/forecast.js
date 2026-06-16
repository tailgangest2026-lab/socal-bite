document.addEventListener("DOMContentLoaded", initForecast);

let forecastRows = [];
let conditionRows = [];
let dailyRows = [];
let selectedRegion = "";
let speciesFpaChartInstance = null;
let reportYearCache = {};
let renderToken = 0;

const LOCATIONS = {
  "NorCal": {
    lat: 38.4404,
    lon: -123.1190,
    station: "9415625",
    fallbackWater: 54,
    fallbackSwell: 5.0
  },

  "San Francisco Bay": {
    lat: 37.8060,
    lon: -122.4659,
    station: "9414290",
    fallbackWater: 56,
    fallbackSwell: 4.5
  },

  "Alameda County": {
    lat: 37.7749,
    lon: -122.2960,
    station: "9414290",
    fallbackWater: 56,
    fallbackSwell: 4.5
  },

  "Monterey County": {
    lat: 36.6002,
    lon: -121.8947,
    station: "9413450",
    fallbackWater: 57,
    fallbackSwell: 4.0
  },

  "Central California": {
    lat: 35.3658,
    lon: -120.8499,
    station: "9412110",
    fallbackWater: 59,
    fallbackSwell: 3.5
  },

  "San Luis Obispo County": {
    lat: 35.2828,
    lon: -120.6596,
    station: "9412110",
    fallbackWater: 60,
    fallbackSwell: 3.0
  },

  "Santa Barbara County": {
    lat: 34.4208,
    lon: -119.6982,
    station: "9411340",
    fallbackWater: 61,
    fallbackSwell: 2.8
  },

  "Ventura County": {
    lat: 34.2746,
    lon: -119.2290,
    station: "9411189",
    fallbackWater: 62,
    fallbackSwell: 3.0
  },

  "Los Angeles County": {
    lat: 33.7405,
    lon: -118.2817,
    station: "9410660",
    fallbackWater: 65,
    fallbackSwell: 2.6
  },

  "Orange County": {
    lat: 33.6037,
    lon: -117.9000,
    station: "9410580",
    fallbackWater: 66,
    fallbackSwell: 2.5
  },

  "San Diego County": {
    lat: 32.7157,
    lon: -117.1611,
    station: "9410170",
    fallbackWater: 67,
    fallbackSwell: 2.4
  }
};

const REGION_ORDER = [
  "NorCal",
  "San Francisco Bay",
  "Alameda County",
  "Monterey County",
  "Central California",
  "San Luis Obispo County",
  "Santa Barbara County",
  "Ventura County",
  "Los Angeles County",
  "Orange County",
  "San Diego County"
];

async function initForecast() {
  try {
    forecastRows = await fetchJson("../home.json");
    conditionRows = await fetchJson("../conditions.json");
    dailyRows = await loadRecentDailyRows();

    forecastRows = normalizeForecastRows(forecastRows);

    if (!forecastRows.length) {
      throw new Error("No forecast rows found.");
    }

    selectedRegion = getDefaultRegion();

    buildRegionTabs();
    renderForecast(selectedRegion);
  } catch (error) {
    console.error("Forecast load failed:", error);
  }
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

    if (!Array.isArray(index) || !index.length) {
      return [];
    }

    const recentDates = new Set(
      index
        .slice(0, 100)
        .map(report => String(report.date || "").split("T")[0])
        .filter(Boolean)
    );

    const years = [
      ...new Set(
        [...recentDates].map(date => date.substring(0, 4))
      )
    ];

    const rows = [];

    for (const year of years) {
      try {
        const yearRows = await fetchReportYear(year);

        rows.push(
          ...yearRows
            .filter(row =>
              recentDates.has(
                String(row.trip_date || "").split("T")[0]
              )
            )
            .map(row => ({
              ...row,
              __reportDate: String(row.trip_date || "").split("T")[0]
            }))
        );
      } catch (error) {
        console.warn("Could not load report year", year);
      }
    }

    return rows;
  } catch (error) {
    console.warn("Could not load daily report data");
    return [];
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

function normalizeForecastRows(rows) {
  if (!Array.isArray(rows)) return [];

  const map = {};

  rows.forEach(row => {
    const region = standardRegionName(row.region);

    if (!REGION_ORDER.includes(region)) return;

    if (!map[region]) {
      map[region] = {
        ...row,
        region
      };
    } else {
      map[region].total_trips_today =
        Number(map[region].total_trips_today || 0) + Number(row.total_trips_today || 0);

      map[region].total_anglers_today =
        Number(map[region].total_anglers_today || 0) + Number(row.total_anglers_today || 0);

      map[region].total_fish_today =
        Number(map[region].total_fish_today || 0) + Number(row.total_fish_today || 0);
    }
  });

  return Object.values(map)
    .sort((a, b) => REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region));
}

function getDefaultRegion() {
  return (
    forecastRows.find(row => row.region === "Los Angeles County")?.region ||
    forecastRows[0]?.region ||
    "Los Angeles County"
  );
}

function buildRegionTabs() {
  const tabs = document.getElementById("regionTabs");
  if (!tabs) return;

  tabs.innerHTML = forecastRows.map(row => `
    <button
      class="${row.region === selectedRegion ? "active" : ""}"
      type="button"
      onclick="selectRegion('${escapeAttr(row.region)}')"
    >
      ${safe(row.region)}
    </button>
  `).join("");
}

function selectRegion(region) {
  selectedRegion = standardRegionName(region);
  buildRegionTabs();
  renderForecast(selectedRegion);
}

async function renderForecast(region) {
  const currentToken = ++renderToken;

  const standardRegion = standardRegionName(region);

  const row =
    forecastRows.find(r => r.region === standardRegion) ||
    forecastRows[0];

  const displayRegion = row.region || standardRegion || "Los Angeles County";
  const condition = getLatestConditionForRegion(displayRegion);

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

  setText("waterTemp", formatTemp(getValue(condition, ["waterTemp", "water_temp", "watertemp"])) || forecast.waterTempText || estimateWaterTemp(displayRegion));
  setText("wind", formatWind(condition) || forecast.windText || estimateWind(displayRegion));
  setText("swell", formatSwell(condition) || forecast.swellText || estimateSwell(displayRegion));
  setText("visibility", getValue(condition, ["visibility"]) || forecast.visibilityText || estimateVisibility(displayRegion));
  setText("tide", getValue(condition, ["tideMovement", "tide_movement", "tidemovement", "tide"]) || forecast.tideText || estimateTide(score));

  const base = LOCATIONS[displayRegion];

if (base) {
  const today = new Date().toISOString().split("T")[0];
  const astro = getAstronomy(base.lat, base.lon, today);

  setText("sunrise", astro.sunrise);
  setText("sunset", astro.sunset);
  setText("moon", astro.moon);
} else {
  setText("sunrise", "--");
  setText("sunset", "--");
  setText("moon", "--");
}

  buildSpeciesRankings(displayRegion);
  buildSpeciesFpaChart(displayRegion);
}

function getLatestConditionForRegion(region) {
  if (!Array.isArray(conditionRows)) return null;

  const target = standardRegionName(region);

  const matches = conditionRows
    .filter(row => standardRegionName(row.region) === target)
    .sort((a, b) => {
      const dateA = new Date(getValue(a, ["date", "updatedAt", "updated_at", "updatedat"]) || 0);
      const dateB = new Date(getValue(b, ["date", "updatedAt", "updated_at", "updatedat"]) || 0);
      return dateB - dateA;
    });

  return matches[0] || null;
}

async function calculateForecastScore(row, condition, region, fpa, trips) {
  const standardRegion = standardRegionName(region);
  const base = LOCATIONS[standardRegion];

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
      waterTempText: formatTemp(conditionTemp) || `${base?.fallbackWater || 65}°F`,
      windText: formatWind(condition) || estimateWind(standardRegion),
      swellText: formatSwell(condition) || estimateSwell(standardRegion),
      visibilityText: getValue(condition, ["visibility"]) || estimateVisibility(standardRegion),
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
    const temp = Number(waterTemp || conditionTemp || base.fallbackWater || 65);
    const swell = Number(marine?.waveHeight || marine?.swellWaveHeight || conditionSwell || base.fallbackSwell || 3);
    const tideMovement = getTideMovement(tides) || conditionTide;

    return {
      score: clampScore(score),
      waterTempText: Number.isFinite(temp) ? `${Math.round(temp)}°F` : `${base.fallbackWater}°F`,
      windText: buildWindText(weather, wind, gusts),
      swellText: Number.isFinite(swell) ? `${swell.toFixed(1)} ft` : `${base.fallbackSwell.toFixed(1)} ft`,
      visibilityText: weather?.visibility || getValue(condition, ["visibility"]) || estimateVisibility(standardRegion),
      tideText: tideMovement || conditionTide || estimateTide(score)
    };
  } catch (error) {
    console.warn("NOAA forecast fallback used:", error);

    return {
      score: clampScore(score),
      waterTempText: formatTemp(conditionTemp) || `${base.fallbackWater}°F`,
      windText: formatWind(condition) || estimateWind(standardRegion),
      swellText: formatSwell(condition) || estimateSwell(standardRegion),
      visibilityText: getValue(condition, ["visibility"]) || estimateVisibility(standardRegion),
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
  const targetRegion = standardRegionName(region);

  const regionRows = dailyRows.filter(row =>
    standardRegionName(row.region) === targetRegion
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
  const targetRegion = standardRegionName(region);

  const rows = dailyRows.filter(row =>
    standardRegionName(row.region) === targetRegion
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

function estimateWaterTemp(region) {
  const standardRegion = standardRegionName(region);
  const base = LOCATIONS[standardRegion];

  return `${Math.round(base?.fallbackWater || 65)}°F`;
}

function estimateWind(region) {
  const winds = {
    "NorCal": "12 kt NW",
    "San Francisco Bay": "10 kt W",
    "Alameda County": "9 kt W",
    "Monterey County": "9 kt NW",
    "Central California": "10 kt NW",
    "San Luis Obispo County": "10 kt NW",
    "Santa Barbara County": "8 kt NW",
    "Ventura County": "9 kt W",
    "Los Angeles County": "7 kt W",
    "Orange County": "6 kt SW",
    "San Diego County": "5 kt S"
  };

  return winds[standardRegionName(region)] || "8 kt W";
}

function estimateSwell(region) {
  const standardRegion = standardRegionName(region);
  const base = LOCATIONS[standardRegion];
  const swell = Number(base?.fallbackSwell || 3);

  return `${swell.toFixed(1)} ft`;
}

function estimateVisibility(region) {
  const standardRegion = standardRegionName(region);

  if (standardRegion === "San Diego County") return "13 mi";
  if (standardRegion === "NorCal") return "8 mi";

  return "10 mi";
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

function standardRegionName(value) {
  const text = String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(".", "")
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\s+/g, " ");

  const aliases = {
    "norcal": "NorCal",
    "northern california": "NorCal",

    "san francisco bay": "San Francisco Bay",
    "sf bay": "San Francisco Bay",
    "san francisco": "San Francisco Bay",

    "alameda": "Alameda County",
    "alameda county": "Alameda County",

    "monterey": "Monterey County",
    "monterey county": "Monterey County",

    "central california": "Central California",
    "central ca": "Central California",
    "morro bay": "Central California",

    "san luis obispo": "San Luis Obispo County",
    "san luis obispo county": "San Luis Obispo County",
    "slo": "San Luis Obispo County",

    "santa barbara": "Santa Barbara County",
    "santa barbara county": "Santa Barbara County",

    "ventura": "Ventura County",
    "ventura county": "Ventura County",

    "los angeles": "Los Angeles County",
    "los angeles county": "Los Angeles County",
    "la": "Los Angeles County",
    "la county": "Los Angeles County",

    "orange": "Orange County",
    "orange county": "Orange County",
    "oc": "Orange County",

    "san diego": "San Diego County",
    "san diego county": "San Diego County",

    "socal": "Los Angeles County",
    "southern california": "Los Angeles County"
  };

  return aliases[text] || value;
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
function getAstronomy(lat, lon, dateString) {
  return {
    sunrise: calculateSunTime(lat, lon, dateString, true),
    sunset: calculateSunTime(lat, lon, dateString, false),
    moon: getMoonPhase(dateString)
  };
}

function calculateSunTime(lat, lon, dateString, isSunrise) {
  const date = dateString
    ? new Date(`${dateString}T12:00:00`)
    : new Date();

  const zenith = 90.833;
  const dayOfYear = getDayOfYear(date);
  const lngHour = lon / 15;

  const t = isSunrise
    ? dayOfYear + ((6 - lngHour) / 24)
    : dayOfYear + ((18 - lngHour) / 24);

  const meanAnomaly = (0.9856 * t) - 3.289;

  let trueLongitude =
    meanAnomaly +
    (1.916 * Math.sin(toRadians(meanAnomaly))) +
    (0.020 * Math.sin(toRadians(2 * meanAnomaly))) +
    282.634;

  trueLongitude = normalizeDegrees(trueLongitude);

  let rightAscension = toDegrees(
    Math.atan(0.91764 * Math.tan(toRadians(trueLongitude)))
  );

  rightAscension = normalizeDegrees(rightAscension);

  const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
  const raQuadrant = Math.floor(rightAscension / 90) * 90;

  rightAscension = rightAscension + longitudeQuadrant - raQuadrant;
  rightAscension = rightAscension / 15;

  const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));

  const cosHourAngle =
    (Math.cos(toRadians(zenith)) -
      (sinDeclination * Math.sin(toRadians(lat)))) /
    (cosDeclination * Math.cos(toRadians(lat)));

  if (cosHourAngle > 1 || cosHourAngle < -1) {
    return "--";
  }

  let hourAngle = isSunrise
    ? 360 - toDegrees(Math.acos(cosHourAngle))
    : toDegrees(Math.acos(cosHourAngle));

  hourAngle = hourAngle / 15;

  const localMeanTime =
    hourAngle +
    rightAscension -
    (0.06571 * t) -
    6.622;

  const utcTime = normalizeHours(localMeanTime - lngHour);

  const utcDate = new Date(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0
  ));

  utcDate.setUTCMinutes(Math.round(utcTime * 60));

  return utcDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles"
  });
}

function getMoonPhase(dateString) {
  const date = dateString
    ? new Date(`${dateString}T12:00:00`)
    : new Date();

  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const lunarCycle = 29.53058867;

  const daysSinceNewMoon = (date - knownNewMoon) / 86400000;
  const moonAge =
    ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;

  const illumination = Math.round(
    (1 - Math.cos((2 * Math.PI * moonAge) / lunarCycle)) * 50
  );

  let phase = "New Moon";

  if (moonAge < 1.84566) phase = "New Moon";
  else if (moonAge < 5.53699) phase = "Waxing Crescent";
  else if (moonAge < 9.22831) phase = "First Quarter";
  else if (moonAge < 12.91963) phase = "Waxing Gibbous";
  else if (moonAge < 16.61096) phase = "Full Moon";
  else if (moonAge < 20.30228) phase = "Waning Gibbous";
  else if (moonAge < 23.99361) phase = "Last Quarter";
  else if (moonAge < 27.68493) phase = "Waning Crescent";

  return `${phase} ${illumination}%`;
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function toRadians(degrees) {
  return degrees * Math.PI / 180;
}

function toDegrees(radians) {
  return radians * 180 / Math.PI;
}

function normalizeDegrees(value) {
  return ((value % 360) + 360) % 360;
}

function normalizeHours(value) {
  return ((value % 24) + 24) % 24;
}
