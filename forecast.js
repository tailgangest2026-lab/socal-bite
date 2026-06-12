document.addEventListener("DOMContentLoaded", initForecast);

let forecastRows = [];
let dailyRows = [];
let selectedRegion = "";
let speciesFpaChartInstance = null;

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
  const url = window.socalBiteDataUrl
    ? window.socalBiteDataUrl(path)
    : path;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

function normalizeReportFile(report) {
  if (report.file) {
    const match = String(report.file).match(/daily-report-(\d{4}-\d{2}-\d{2})/);
    if (match) return `reports/daily-report-${match[1]}.json`;
    return report.file;
  }

  const date = String(report.date || "").split("T")[0];
  return `reports/daily-report-${date}.json`;
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
      const filePath = normalizeReportFile(report);

      try {
        const reportRows = await fetchJson(filePath);

if (Array.isArray(reportRows)) {
  const reportDate =
    String(report.date || "").split("T")[0] ||
    String(filePath).match(/\d{4}-\d{2}-\d{2}/)?.[0] ||
    "";

  reportRows.forEach(row => {
    rows.push({
      ...row,
      __reportDate: reportDate
    });
  });
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

async function renderForecast(region) {
  const row = forecastRows.find(r => r.region === region) || forecastRows[0];

  const fish = Number(row.total_fish_today || 0);
  const anglers = Number(row.total_anglers_today || 1);
  const trips = Number(row.total_trips_today || 1);
  const fpa = fish / Math.max(anglers, 1);

  const score = await calculateForecastScore(row, region, fpa, trips);
  const label = getScoreLabel(score);

  setText("selectedRegionLabel", region);
  setText("trendRegion", region);

  updateBiteScoreGauge(score, label);

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
    canvas.parentElement.innerHTML = `<div class="empty-card">No 12-week trend data found for ${safe(region)}.</div>`;
    return;
  }

  if (speciesFpaChartInstance) {
    speciesFpaChartInstance.destroy();
  }

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
          ticks: {
            color: "#9cc4d5"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: "#9cc4d5"
          },
          grid: {
            color: "rgba(255,255,255,0.08)"
          }
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

async function calculateForecastScore(row, region, fpa, trips) {
  const locations = {
    "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340" },
    "Ventura": { lat: 34.2746, lon: -119.2290, station: "9411189" },
    "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660" },
    "Orange County": { lat: 33.6037, lon: -117.9, station: "9410580" },
    "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170" },
    "San Luis Obispo": { lat: 35.2828, lon: -120.6596, station: "9412110" }
  };

  const base = locations[region];

  let score = 45;

  if (fpa >= 8) score += 25;
  else if (fpa >= 5) score += 18;
  else if (fpa >= 3) score += 12;
  else if (fpa >= 1.5) score += 7;

  if (trips >= 20) score += 10;
  else if (trips >= 10) score += 6;
  else if (trips >= 5) score += 3;

  if (!base || typeof SCBConditions === "undefined") {
    return clampScore(score);
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

    const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
    const gusts = Number(weather?.windGusts || 0);
    const temp = Number(waterTemp || 65);
    const swell = Number(marine?.waveHeight || marine?.swellWaveHeight || 3);
    const tideMovement = getTideMovement(tides);

    if (wind <= 6) score += 10;
    else if (wind <= 10) score += 6;
    else if (wind <= 15) score += 1;
    else score -= 10;

    if (gusts >= 25) score -= 8;

    if (swell <= 2.5) score += 8;
    else if (swell <= 4) score += 4;
    else if (swell >= 5) score -= 10;

    if (temp >= 63 && temp <= 70) score += 6;
    else if (temp < 58 || temp > 74) score -= 6;

    if (String(tideMovement).toLowerCase().includes("moving")) score += 7;

    return clampScore(score);
  } catch (error) {
    console.warn("NOAA forecast score fallback used:", error);
    return clampScore(score);
  }
}

function getTideMovement(tides) {
  if (!Array.isArray(tides) || tides.length < 2) {
    return "Unknown";
  }

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

  if (validTides.length < 2) {
    return "Unknown";
  }

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

function clampScore(score) {
  return Math.max(35, Math.min(96, Math.round(Number(score || 0))));
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
function buildRegionalFpaTrend(region) {
  const targetRegion = String(region || "").toLowerCase();
  const today = new Date();

  const weeks = [];

  for (let i = 11; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(today.getDate() - i * 7);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);

    weeks.push({
      start,
      end,
      fish: 0,
      anglers: 0,
      label: `${start.getMonth() + 1}/${start.getDate()}`
    });
  }

  dailyRows.forEach(row => {
    if (String(row.region || "").toLowerCase() !== targetRegion) return;

    const rowDate = new Date(row.__reportDate || row.date || row.report_date || row.reportDate || "");
    if (isNaN(rowDate)) return;

    const anglers = Number(row.anglers || 0);
    const fishCounts = String(row.fish_counts || "");

    const totalFish = parseFishCounts(fishCounts)
      .reduce((sum, item) => sum + Number(item.count || 0), 0);

    weeks.forEach(week => {
      if (rowDate >= week.start && rowDate <= week.end) {
        week.fish += totalFish;
        week.anglers += anglers;
      }
    });
  });

  return weeks
    .map(week => ({
      label: week.label,
      fish: week.fish,
      anglers: week.anglers,
      fpa: week.anglers > 0 ? week.fish / week.anglers : 0
    }))
    .filter(week => week.fish > 0 || week.anglers > 0);
}
function buildSpeciesWeeklyTrend(region) {
  const targetRegion = String(region || "").toLowerCase();

  const rows = dailyRows.filter(row =>
    String(row.region || "").toLowerCase() === targetRegion
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
      if (!speciesTotals[item.species]) {
        speciesTotals[item.species] = {};
      }

      if (!speciesTotals[item.species][week.key]) {
        speciesTotals[item.species][week.key] = {
          fish: 0,
          anglers: 0
        };
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

  const colors = [
    "#20d3e2",
    "#7b61ff",
    "#ff5b5b",
    "#24d17e",
    "#ffc766",
    "#00c2ff"
  ];

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
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;

  d.setUTCDate(d.getUTCDate() + 4 - dayNum);

  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));

  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
