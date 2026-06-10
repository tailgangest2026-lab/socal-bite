const REGIONS = [
  "San Diego",
  "Orange County",
  "Los Angeles",
  "Ventura",
  "Santa Barbara"
];

const REGION_CONDITIONS = {
  "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170", fallbackWater: 67 },
  "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", fallbackWater: 66 },
  "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660", fallbackWater: 65 },
  "Ventura": { lat: 34.2746, lon: -119.2290, station: "9411189", fallbackWater: 62 },
  "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340", fallbackWater: 61 }
};

document.addEventListener("DOMContentLoaded", loadForecast);

async function loadForecast() {
  const container = document.getElementById("forecastCards");
  const updated = document.getElementById("forecastUpdated");

  if (!container) return;

  try {
    container.innerHTML = `<div class="loading-card">Loading regional forecasts...</div>`;

    const rows = await loadRecentReports(14);
    const conditionByRegion = await loadRegionalConditions();

    if (!rows.length) {
      container.innerHTML = `
        <div class="loading-card">
          No recent report data found. Check your daily report JSON path.
        </div>
      `;
      return;
    }

    const forecasts = buildRegionForecasts(rows, conditionByRegion);

    container.innerHTML = `
      <div class="forecast-landing-grid">
        ${forecasts.map(renderRegionCard).join("")}
      </div>
    `;

    if (updated) {
      updated.textContent =
        "Updated: " +
        new Date().toLocaleString() +
        " • Forecast uses recent catch data, NOAA tides/water temp, and Open-Meteo weather.";
    }
  } catch (error) {
    console.error("Forecast error:", error);
    container.innerHTML = `
      <div class="loading-card">
        Forecast could not be loaded. Check the browser console.
      </div>
    `;
  }
}

async function loadRecentReports(daysBack) {
  const rows = [];
  const today = new Date();

  for (let i = 1; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const dateStr = d.toISOString().slice(0, 10);

    const possibleFiles = [
      `reports/daily-report-${dateStr}.json?v=${Date.now()}`,
      `daily-report-${dateStr}.json?v=${Date.now()}`
    ];

    for (const file of possibleFiles) {
      try {
        const response = await fetch(file);
        if (!response.ok) continue;

        const data = await response.json();

        if (Array.isArray(data)) {
          rows.push(...data);
          break;
        }
      } catch {
        console.warn("Skipped:", file);
      }
    }
  }

  return rows;
}

async function loadRegionalConditions() {
  const output = {};

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  await Promise.all(REGIONS.map(async region => {
    output[region] = await loadRegionConditions(region, tomorrowStr);
  }));

  return output;
}

async function loadRegionConditions(region, dateString) {
  const base = REGION_CONDITIONS[region];

  if (!base || typeof SCBConditions === "undefined") {
    return getDefaultConditions();
  }

  try {
    const [weather, tides, waterTemp] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, dateString),
      SCBConditions.getTides(base.station, dateString),
      SCBConditions.getWaterTemp(base.station)
    ]);

    const windMph = SCBConditions.parseWindSpeed(weather?.windSpeed, 0);
    const gustMph = Number(weather?.windGusts || 0);
    const tide = calculateNoaaTideMovement(tides);
    const tempF = Number(waterTemp || base.fallbackWater);

    return {
      wind: {
        windMph,
        gustMph,
        score: getWindScore(windMph, gustMph),
        label: getWindLabel(windMph, gustMph)
      },
      tide,
      waterTemp: {
        tempF,
        score: getWaterTempScore(tempF),
        label: getWaterTempLabel(tempF)
      },
      weather: {
        forecast: weather?.shortForecast || "Forecast available",
        rainChance: weather?.precipitationProbability ?? null,
        cloudCover: weather?.cloudCover ?? null,
        uvIndex: weather?.uvIndex ?? null
      }
    };
  } catch (error) {
    console.warn("Shared NOAA/Open-Meteo conditions failed:", region, error);
    return getDefaultConditions();
  }
}

function calculateNoaaTideMovement(tides) {
  if (!tides || !tides.length) return getDefaultTide();

  const heights = tides
    .map(tide => Number(tide.v))
    .filter(value => Number.isFinite(value));

  if (heights.length < 2) return getDefaultTide();

  const movement = Math.max(...heights) - Math.min(...heights);

  return {
    movement,
    score: getTideScore(movement),
    label: getTideLabel(movement)
  };
}

function buildRegionForecasts(rows, conditionByRegion) {
  const today = new Date();

  return REGIONS.map(region => {
    const regionRows = rows.filter(row => {
      return clean(getValue(row, ["region", "Region"])) === clean(region);
    });

    const last7Rows = regionRows.filter(row => {
      const age = daysAgo(getRowDate(row), today);
      return age >= 1 && age <= 7;
    });

    const previous7Rows = regionRows.filter(row => {
      const age = daysAgo(getRowDate(row), today);
      return age >= 8 && age <= 14;
    });

    return calculateRegionForecast(
      region,
      last7Rows,
      previous7Rows,
      conditionByRegion[region] || getDefaultConditions()
    );
  }).sort((a, b) => b.finalScore - a.finalScore);
}

function calculateRegionForecast(region, last7Rows, previous7Rows, conditions) {
  const last7Fish = sumFish(last7Rows);
  const previous7Fish = sumFish(previous7Rows);

  const last7Anglers = sumAnglers(last7Rows);
  const last7Trips = countTrips(last7Rows);
  const previous7Trips = countTrips(previous7Rows);

  const fpa = last7Anglers > 0 ? last7Fish / last7Anglers : 0;

  const trendScore = getTrendScore(last7Fish, previous7Fish);
  const volumeScore = getVolumeScore(last7Fish);
  const fpaScore = getFpaScore(fpa);
  const tripScore = getTripScore(last7Trips, previous7Trips);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const moon = getMoonPhaseScore(tomorrow);
  const wind = conditions.wind;
  const tide = conditions.tide;
  const waterTemp = conditions.waterTemp;

  const finalScore = Math.round(
    trendScore * 0.30 +
    volumeScore * 0.22 +
    fpaScore * 0.25 +
    tripScore * 0.10 +
    moon.score * 0.04 +
    wind.score * 0.04 +
    tide.score * 0.03 +
    waterTemp.score * 0.02
  );

  return {
    region,
    conditions,
    last7Fish,
    previous7Fish,
    last7Anglers,
    last7Trips,
    previous7Trips,
    fpa,
    trendScore,
    volumeScore,
    fpaScore,
    tripScore,
    moon,
    wind,
    tide,
    waterTemp,
    finalScore,
    label: getForecastLabel(finalScore),
    topSpecies: getTopSpecies(last7Rows),
    topBoats: getTopBoats(last7Rows),
    topLandings: getTopLandings(last7Rows)
  };
}

function renderRegionCard(item) {
  return `
    <article class="forecast-landing-card ${item.label.toLowerCase()}">
      <div class="forecast-landing-top">
        <div>
          <h4>${item.region}</h4>
          <p>Regional Bite Forecast</p>
        </div>
        <span class="forecast-badge ${item.label.toLowerCase()}">${item.label}</span>
      </div>

      <div class="forecast-score">
        ${item.finalScore}<span>/100</span>
      </div>

      <div class="forecast-details">
        <p><strong>Last 7 Days:</strong> ${formatNumber(item.last7Fish)} fish</p>
        <p><strong>Previous 7 Days:</strong> ${formatNumber(item.previous7Fish)} fish</p>
        <p><strong>Trips:</strong> ${formatNumber(item.last7Trips)}</p>
        <p><strong>FPA:</strong> ${item.fpa.toFixed(2)}</p>
        <p><strong>Moon:</strong> ${item.moon.phase}</p>
        <p><strong>Wind:</strong> ${item.wind.label} (${item.wind.windMph.toFixed(0)} mph, gusts ${item.wind.gustMph.toFixed(0)} mph)</p>
        <p><strong>Forecast:</strong> ${item.conditions?.weather?.forecast || "Forecast available"}</p>
        <p><strong>Rain Chance:</strong> ${formatPercent(item.conditions?.weather?.rainChance)}</p>
        <p><strong>Cloud Cover:</strong> ${formatPercent(item.conditions?.weather?.cloudCover)}</p>
        <p><strong>UV Index:</strong> ${formatValue(item.conditions?.weather?.uvIndex)}</p>
        <p><strong>Tide Movement:</strong> ${item.tide.label} (${item.tide.movement.toFixed(2)} ft)</p>
        <p><strong>Water Temp:</strong> ${item.waterTemp.label} (${item.waterTemp.tempF ? item.waterTemp.tempF.toFixed(1) + "°F" : "Unknown"})</p>
      </div>

      <div class="forecast-factors">
        <div><span>Trend</span><strong>${item.trendScore}</strong></div>
        <div><span>Volume</span><strong>${item.volumeScore}</strong></div>
        <div><span>FPA</span><strong>${item.fpaScore}</strong></div>
        <div><span>Trips</span><strong>${item.tripScore}</strong></div>
        <div><span>Moon</span><strong>${item.moon.score}</strong></div>
        <div><span>Wind</span><strong>${item.wind.score}</strong></div>
        <div><span>Tide</span><strong>${item.tide.score}</strong></div>
        <div><span>Temp</span><strong>${item.waterTemp.score}</strong></div>
      </div>

      <div class="forecast-species">
        <h5>Top Bite</h5>
        ${
          item.topSpecies.length
            ? item.topSpecies.map(s => `<span>${s.species}: ${formatNumber(s.count)}</span>`).join("")
            : `<span>No species data</span>`
        }
      </div>

      <div class="forecast-species">
        <h5>Top Landings</h5>
        ${
          item.topLandings.length
            ? item.topLandings.map(l => `<span>${l.landing}: ${formatNumber(l.fish)}</span>`).join("")
            : `<span>No landing data</span>`
        }
      </div>

      <div class="forecast-species">
        <h5>Top Boats</h5>
        ${
          item.topBoats.length
            ? item.topBoats.map(b => `<span>${b.boat}: ${formatNumber(b.fish)}</span>`).join("")
            : `<span>No boat data</span>`
        }
      </div>
    </article>
  `;
}

function getTopSpecies(rows) {
  const totals = {};

  rows.forEach(row => {
    const fishCounts = getValue(row, ["fish_counts", "Fish Counts"]);
    if (!fishCounts) return;

    fishCounts.split(",").forEach(item => {
      const match = item.trim().match(/^(\d+)\s+(.+)$/);
      if (!match) return;

      const count = Number(match[1]);
      const species = match[2].trim();

      if (!species || !count) return;
      totals[species] = (totals[species] || 0) + count;
    });
  });

  return Object.entries(totals)
    .map(([species, count]) => ({ species, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function getTopBoats(rows) {
  const totals = {};

  rows.forEach(row => {
    const boat = getValue(row, ["boat", "Boat", "boat_name", "Boat Name"]);
    const fish = Number(getValue(row, ["total_fish", "fish_count", "count", "fish", "Fish", "Count"]) || 0);

    if (!boat || !fish) return;
    totals[boat] = (totals[boat] || 0) + fish;
  });

  return Object.entries(totals)
    .map(([boat, fish]) => ({ boat, fish }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 3);
}

function getTopLandings(rows) {
  const totals = {};

  rows.forEach(row => {
    const landing = getValue(row, ["landing", "Landing", "landing_name", "Landing Name"]);
    const fish = Number(getValue(row, ["total_fish", "fish_count", "count", "fish", "Fish", "Count"]) || 0);

    if (!landing || !fish) return;
    totals[landing] = (totals[landing] || 0) + fish;
  });

  return Object.entries(totals)
    .map(([landing, fish]) => ({ landing, fish }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 3);
}

function getDefaultConditions() {
  return {
    wind: getDefaultWind(),
    tide: getDefaultTide(),
    waterTemp: getDefaultWaterTemp(),
    weather: {
      forecast: "Unknown",
      rainChance: null,
      cloudCover: null,
      uvIndex: null
    }
  };
}

function getDefaultWind() {
  return { windMph: 0, gustMph: 0, score: 55, label: "Unknown" };
}

function getDefaultTide() {
  return { movement: 0, score: 55, label: "Unknown" };
}

function getDefaultWaterTemp() {
  return { tempF: 0, score: 55, label: "Unknown" };
}

function getMoonPhaseScore(date = new Date()) {
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const lunarCycle = 29.53058867;

  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const moonAge = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;

  if (moonAge < 1.84566) return { phase: "New Moon", score: 85, age: moonAge };
  if (moonAge < 5.53699) return { phase: "Waxing Crescent", score: 65, age: moonAge };
  if (moonAge < 9.22831) return { phase: "First Quarter", score: 72, age: moonAge };
  if (moonAge < 12.91963) return { phase: "Waxing Gibbous", score: 60, age: moonAge };
  if (moonAge < 16.61096) return { phase: "Full Moon", score: 82, age: moonAge };
  if (moonAge < 20.30228) return { phase: "Waning Gibbous", score: 60, age: moonAge };
  if (moonAge < 23.99361) return { phase: "Last Quarter", score: 72, age: moonAge };
  if (moonAge < 27.68493) return { phase: "Waning Crescent", score: 65, age: moonAge };

  return { phase: "New Moon", score: 85, age: moonAge };
}

function getWindScore(windMph, gustMph) {
  if (!windMph && !gustMph) return 55;
  if (windMph <= 6 && gustMph <= 12) return 90;
  if (windMph <= 10 && gustMph <= 18) return 78;
  if (windMph <= 15 && gustMph <= 24) return 62;
  if (windMph <= 20 && gustMph <= 30) return 42;
  return 25;
}

function getWindLabel(windMph, gustMph) {
  if (!windMph && !gustMph) return "Unknown";
  if (windMph <= 6 && gustMph <= 12) return "Excellent";
  if (windMph <= 10 && gustMph <= 18) return "Good";
  if (windMph <= 15 && gustMph <= 24) return "Fair";
  if (windMph <= 20 && gustMph <= 30) return "Poor";
  return "Rough";
}

function getTideScore(movement) {
  if (!movement) return 55;
  if (movement >= 4) return 90;
  if (movement >= 2.5) return 78;
  if (movement >= 1.5) return 62;
  if (movement >= 0.75) return 45;
  return 30;
}

function getTideLabel(movement) {
  if (!movement) return "Unknown";
  if (movement >= 4) return "Strong";
  if (movement >= 2.5) return "Good";
  if (movement >= 1.5) return "Moderate";
  if (movement >= 0.75) return "Weak";
  return "Very Weak";
}

function getWaterTempScore(tempF) {
  if (!tempF) return 55;
  if (tempF >= 64 && tempF <= 68) return 90;
  if (tempF >= 61 && tempF < 64) return 76;
  if (tempF > 68 && tempF <= 72) return 76;
  if (tempF >= 58 && tempF < 61) return 60;
  if (tempF > 72 && tempF <= 76) return 58;
  return 40;
}

function getWaterTempLabel(tempF) {
  if (!tempF) return "Unknown";
  if (tempF >= 64 && tempF <= 68) return "Prime";
  if (tempF >= 61 && tempF < 64) return "Cool Good";
  if (tempF > 68 && tempF <= 72) return "Warm Good";
  if (tempF >= 58 && tempF < 61) return "Cool";
  if (tempF > 72 && tempF <= 76) return "Warm";
  return "Poor";
}

function getValue(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
      return row[key];
    }
  }
  return "";
}

function getRowDate(row) {
  return new Date(getValue(row, ["trip_date", "date", "report_date", "created_at", "Trip Date", "Date"]));
}

function daysAgo(date, today) {
  if (!date || isNaN(date)) return 999;
  return Math.floor((today - date) / (1000 * 60 * 60 * 24));
}

function sumFish(rows) {
  return rows.reduce((total, row) => {
    return total + Number(getValue(row, ["total_fish", "fish_count", "count", "fish", "total_count", "Fish", "Count"]) || 0);
  }, 0);
}

function sumAnglers(rows) {
  return rows.reduce((total, row) => {
    return total + Number(getValue(row, ["anglers", "total_anglers", "angler_count", "Anglers"]) || 0);
  }, 0);
}

function countTrips(rows) {
  const trips = new Set();

  rows.forEach(row => {
    const tripKey = [
      getValue(row, ["trip_date", "date", "report_date", "Trip Date", "Date"]),
      getValue(row, ["landing", "Landing", "landing_name"]),
      getValue(row, ["boat", "Boat", "boat_name"]),
      getValue(row, ["trip_type", "Trip Type"])
    ].join("|");

    trips.add(tripKey);
  });

  return trips.size;
}

function getTrendScore(last7, previous7) {
  if (last7 <= 0) return 0;
  if (previous7 <= 0) return 65;

  const change = (last7 - previous7) / previous7;

  if (change >= 0.75) return 95;
  if (change >= 0.40) return 85;
  if (change >= 0.15) return 75;
  if (change >= 0) return 65;
  if (change >= -0.25) return 48;
  return 30;
}

function getVolumeScore(fish) {
  if (fish >= 10000) return 92;
  if (fish >= 5000) return 82;
  if (fish >= 2500) return 70;
  if (fish >= 1000) return 52;
  if (fish > 0) return 32;
  return 0;
}

function getFpaScore(fpa) {
  if (fpa >= 8) return 92;
  if (fpa >= 5) return 82;
  if (fpa >= 3) return 70;
  if (fpa >= 1.5) return 52;
  if (fpa > 0) return 32;
  return 0;
}

function getTripScore(last7Trips, previous7Trips) {
  if (last7Trips <= 0) return 0;
  if (previous7Trips <= 0) return 65;

  const change = (last7Trips - previous7Trips) / previous7Trips;

  if (change >= 0.50) return 90;
  if (change >= 0.25) return 80;
  if (change >= 0) return 65;
  if (change >= -0.25) return 48;
  return 30;
}

function getForecastLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Slow";
}

function clean(value) {
  return String(value || "").trim().toLowerCase();
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatPercent(value) {
  return value === null || value === undefined ? "N/A" : `${Math.round(value)}%`;
}

function formatValue(value) {
  return value === null || value === undefined ? "N/A" : `${Math.round(value)}`;
}
