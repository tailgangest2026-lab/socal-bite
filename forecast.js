const REGIONS = [
  "San Diego",
  "Orange County",
  "Los Angeles",
  "Ventura",
  "Santa Barbara"
];

async function loadForecast() {
  const container = document.getElementById("forecastCards");
  const updated = document.getElementById("forecastUpdated");

  if (!container) return;

  try {
    container.innerHTML = `<div class="loading-card">Loading landing forecasts...</div>`;

    const rows = await loadRecentReports(14);

    console.log("Forecast rows loaded:", rows);
    console.log("Sample row:", rows[0]);

    if (!rows.length) {
      container.innerHTML = `
        <div class="loading-card">
          No recent report data found. Check your daily report JSON path.
        </div>
      `;
      return;
    }

    const grouped = buildLandingForecastsByRegion(rows);

    container.innerHTML = REGIONS.map(region => {
      const landings = grouped[region] || [];

      return `
        <section class="forecast-region-section">
          <div class="forecast-region-header">
            <h3>${region}</h3>
            <span>${landings.length} landings</span>
          </div>

          ${
            landings.length
              ? `<div class="forecast-landing-grid">
                  ${landings.map(renderLandingCard).join("")}
                </div>`
              : `<div class="loading-card">No recent data for ${region}.</div>`
          }
        </section>
      `;
    }).join("");

    if (updated) {
      updated.textContent = "Updated: " + new Date().toLocaleString();
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
          console.log("Loaded:", file, data.length);
          break;
        }
      } catch (err) {
        console.warn("Skipped:", file);
      }
    }
  }

  return rows;
}

function buildLandingForecastsByRegion(rows) {
  const today = new Date();
  const grouped = {};

  rows.forEach(row => {
    const region = getValue(row, ["region", "Region"]) || "Unknown Region";
    const landing = getValue(row, ["landing", "Landing", "landing_name", "Landing Name"]);

    if (!landing) return;

    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][landing]) {
      grouped[region][landing] = {
        region,
        landing,
        last7Rows: [],
        previous7Rows: []
      };
    }

    const rowDate = getRowDate(row);
    const age = daysAgo(rowDate, today);

    if (age >= 1 && age <= 7) grouped[region][landing].last7Rows.push(row);
    if (age >= 8 && age <= 14) grouped[region][landing].previous7Rows.push(row);
  });

  const output = {};

  Object.keys(grouped).forEach(region => {
    output[region] = Object.values(grouped[region])
      .map(calculateLandingForecast)
      .filter(item => item.last7Fish > 0 || item.previous7Fish > 0)
      .sort((a, b) => b.finalScore - a.finalScore);
  });

  return output;
}

function calculateLandingForecast(item) {
  const last7Fish = sumFish(item.last7Rows);
  const previous7Fish = sumFish(item.previous7Rows);

  const last7Anglers = sumAnglers(item.last7Rows);
  const previous7Anglers = sumAnglers(item.previous7Rows);

  const last7Trips = countTrips(item.last7Rows);
  const previous7Trips = countTrips(item.previous7Rows);

  const fpa = last7Anglers > 0 ? last7Fish / last7Anglers : 0;

  const trendScore = getTrendScore(last7Fish, previous7Fish);
  const volumeScore = getVolumeScore(last7Fish);
  const fpaScore = getFpaScore(fpa);
  const tripScore = getTripScore(last7Trips, previous7Trips);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const moon = getMoonPhaseScore(tomorrow);

  const finalScore = Math.round(
    trendScore * 0.30 +
    volumeScore * 0.25 +
    fpaScore * 0.25 +
    tripScore * 0.10 +
    moon.score * 0.10
  );

  return {
    region: item.region,
    landing: item.landing,
    last7Fish,
    previous7Fish,
    last7Anglers,
    previous7Anglers,
    last7Trips,
    previous7Trips,
    fpa,
    trendScore,
    volumeScore,
    fpaScore,
    tripScore,
    moon,
    finalScore,
    label: getForecastLabel(finalScore),
    topSpecies: getTopSpecies(item.last7Rows),
    topBoats: getTopBoats(item.last7Rows)
  };
}

function renderLandingCard(item) {
  return `
    <article class="forecast-landing-card ${item.label.toLowerCase()}">
      <div class="forecast-landing-top">
        <div>
          <h4>${item.landing}</h4>
          <p>${item.region}</p>
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
      </div>

      <div class="forecast-factors">
        <div><span>Trend</span><strong>${item.trendScore}</strong></div>
        <div><span>Volume</span><strong>${item.volumeScore}</strong></div>
        <div><span>FPA</span><strong>${item.fpaScore}</strong></div>
        <div><span>Trips</span><strong>${item.tripScore}</strong></div>
        <div><span>Moon</span><strong>${item.moon.score}</strong></div>
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

function getMoonPhaseScore(date = new Date()) {
  const knownNewMoon = new Date("2000-01-06T18:14:00Z");
  const lunarCycle = 29.53058867;

  const daysSinceNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
  const moonAge = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;

  if (moonAge < 1.84566) return { phase: "New Moon", score: 90, age: moonAge };
  if (moonAge < 5.53699) return { phase: "Waxing Crescent", score: 65, age: moonAge };
  if (moonAge < 9.22831) return { phase: "First Quarter", score: 75, age: moonAge };
  if (moonAge < 12.91963) return { phase: "Waxing Gibbous", score: 60, age: moonAge };
  if (moonAge < 16.61096) return { phase: "Full Moon", score: 85, age: moonAge };
  if (moonAge < 20.30228) return { phase: "Waning Gibbous", score: 60, age: moonAge };
  if (moonAge < 23.99361) return { phase: "Last Quarter", score: 75, age: moonAge };
  if (moonAge < 27.68493) return { phase: "Waning Crescent", score: 65, age: moonAge };

  return { phase: "New Moon", score: 90, age: moonAge };
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
  if (previous7 <= 0) return 70;

  const change = (last7 - previous7) / previous7;

  if (change >= 0.5) return 100;
  if (change >= 0.25) return 85;
  if (change >= 0) return 70;
  if (change >= -0.25) return 50;
  return 25;
}

function getVolumeScore(fish) {
  if (fish >= 10000) return 100;
  if (fish >= 5000) return 85;
  if (fish >= 2500) return 70;
  if (fish >= 1000) return 50;
  if (fish > 0) return 30;
  return 0;
}

function getFpaScore(fpa) {
  if (fpa >= 8) return 100;
  if (fpa >= 5) return 85;
  if (fpa >= 3) return 70;
  if (fpa >= 1.5) return 50;
  if (fpa > 0) return 30;
  return 0;
}

function getTripScore(last7Trips, previous7Trips) {
  if (last7Trips <= 0) return 0;
  if (previous7Trips <= 0) return 70;

  const change = (last7Trips - previous7Trips) / previous7Trips;

  if (change >= 0.35) return 100;
  if (change >= 0.15) return 85;
  if (change >= 0) return 70;
  if (change >= -0.25) return 50;
  return 25;
}

function getForecastLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 40) return "Fair";
  return "Slow";
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

loadForecast();
