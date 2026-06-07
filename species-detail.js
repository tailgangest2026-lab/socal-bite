let speciesChart = null;

document.addEventListener("DOMContentLoaded", loadSpeciesDetail);

async function loadSpeciesDetail() {
  const container = document.getElementById("speciesDetailPage");
  const species = getSpeciesFromUrl();

  document.title = `${species} Fishing Report | SoCal Bite`;
  document.getElementById("pageTitle").textContent = `${species} Fishing Report`;

  try {
    container.innerHTML = `<h2>Loading ${species} report...</h2>`;

    const indexResponse = await fetch(socalBiteDataUrl("daily-report-index.json"));

    if (!indexResponse.ok) {
      throw new Error("Could not load daily-report-index.json");
    }

    const dailyIndex = await indexResponse.json();
    const recentReports = dailyIndex.slice(0, 30);
    const allRows = [];

    for (const report of recentReports) {
      const filePath = report.file || `reports/daily-report-${report.date}.json`;

      try {
        const response = await fetch(socalBiteDataUrl(filePath));
        if (!response.ok) continue;

        const rows = await response.json();

        if (Array.isArray(rows)) {
          allRows.push(...rows);
        }
      } catch (error) {
        console.warn("Skipped report:", filePath, error);
      }
    }

    const detail = buildSpeciesDetail(species, allRows, recentReports);
    renderSpeciesDetail(species, detail);

  } catch (error) {
    console.error("Species detail load error:", error);
    container.innerHTML = `<h2>Could not load ${species} report.</h2>`;
  }
}

function buildSpeciesDetail(species, rows, recentReports) {
  const topBoats = {};
  const topRegions = {};
  const topTripTypes = {};
  const recentCatches = [];
  const trend = {};

  recentReports.forEach(report => {
    trend[report.date] = 0;
  });

  rows.forEach(row => {
    const fishCount = getSpeciesCount(row.fish_counts, species);

    if (fishCount <= 0) return;

    const region = row.region || "Unknown Region";
    const landing = row.landing || "Unknown Landing";
    const boat = row.boat || "Unknown Boat";
    const tripType = row.trip_type || "Unknown Trip Type";
    const anglers = Number(row.anglers || 0);
    const date = row.trip_date || "";

    topRegions[region] = (topRegions[region] || 0) + fishCount;
    topTripTypes[tripType] = (topTripTypes[tripType] || 0) + fishCount;
    trend[date] = (trend[date] || 0) + fishCount;

    if (!topBoats[boat]) {
      topBoats[boat] = {
        boat,
        landing,
        fish: 0,
        anglers: 0
      };
    }

    topBoats[boat].fish += fishCount;
    topBoats[boat].anglers += anglers;

    recentCatches.push({
      date,
      region,
      landing,
      boat,
      tripType,
      anglers,
      count: fishCount
    });
  });

  const boats = Object.values(topBoats)
    .map(item => ({
      ...item,
      fpa: item.anglers > 0 ? item.fish / item.anglers : 0
    }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 10);

  const regions = Object.keys(topRegions)
    .map(region => ({
      region,
      fish: topRegions[region]
    }))
    .sort((a, b) => b.fish - a.fish);

  const trendRows = Object.keys(trend)
    .sort()
    .map(date => ({
      date,
      fish: trend[date]
    }));

  const totalFish = trendRows.reduce((sum, item) => sum + item.fish, 0);

  return {
    totalFish,
    biteStatus: getBiteStatus(totalFish),
    topBoat: boats[0]?.boat || "No data",
    topRegion: regions[0]?.region || "No data",
    bestTripType: getTopKey(topTripTypes) || "No data",
    boats,
    regions,
    recentCatches: recentCatches
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 25),
    trend: trendRows
  };
}

function renderSpeciesDetail(species, detail) {
  const container = document.getElementById("speciesDetailPage");

  container.innerHTML = `
    <section class="region-section">
      <h2>${species} Fishing Report</h2>
      <p class="updated">Southern California • Last 30 Days</p>
    </section>

    <section class="region-section">
      <h2>Current Bite Status: ${detail.biteStatus}</h2>

      <div class="summary-stats">
        <div><strong>${numberFormat(detail.totalFish)}</strong><span>Last 30 Day Catch</span></div>
        <div><strong>${detail.topRegion}</strong><span>Top Region</span></div>
        <div><strong>${detail.topBoat}</strong><span>Top Boat</span></div>
        <div><strong>${detail.bestTripType}</strong><span>Best Trip Type</span></div>
      </div>
    </section>

    <section class="region-section">
      <h2>30 Day Trend</h2>
      <canvas id="speciesTrendChart" height="120"></canvas>
    </section>

    <section class="region-section">
      <h2>Top Boats for ${species}</h2>
      ${renderBoatRows(detail.boats)}
    </section>

    <section class="region-section">
      <h2>Top Regions</h2>
      ${renderRegionRows(detail.regions)}
    </section>

    <section class="region-section">
      <h2>Recent ${species} Catches</h2>
      ${renderRecentRows(detail.recentCatches)}
    </section>

    <section class="region-section">
      <h2>${species} Fishing Summary</h2>
      <p>
        ${species} fishing in Southern California has produced
        ${numberFormat(detail.totalFish)} fish over the last 30 days.
        The top region is ${detail.topRegion}, and the top producing boat is
        ${detail.topBoat}. Recent catches help show whether the bite is heating up
        or slowing down across local sportfishing landings.
      </p>
    </section>
  `;

  renderTrendChart(detail.trend, species);
}

function renderBoatRows(boats) {
  if (!boats.length) return "<p>No boat data found.</p>";

  return boats.map((item, index) => `
    <div class="boat-row">
      <div>
        <strong>#${index + 1} ${item.boat}</strong>
        <p>${item.landing}</p>
      </div>
      <div>
        <strong>${numberFormat(item.fish)} Fish</strong>
        <p>${numberFormat(item.anglers)} anglers • ${item.fpa.toFixed(2)} FPA</p>
      </div>
    </div>
  `).join("");
}

function renderRegionRows(regions) {
  if (!regions.length) return "<p>No region data found.</p>";

  return regions.map((item, index) => `
    <div class="boat-row">
      <div>
        <strong>#${index + 1} ${item.region}</strong>
      </div>
      <div>
        <strong>${numberFormat(item.fish)} Fish</strong>
      </div>
    </div>
  `).join("");
}

function renderRecentRows(rows) {
  if (!rows.length) return "<p>No recent catches found.</p>";

  return rows.map(item => `
    <div class="boat-row">
      <div>
        <strong>${formatDisplayDate(item.date)} • ${item.boat}</strong>
        <p>${item.landing} • ${item.region} • ${item.tripType}</p>
      </div>
      <div>
        <strong>${numberFormat(item.count)} Fish</strong>
        <p>${numberFormat(item.anglers)} anglers</p>
      </div>
    </div>
  `).join("");
}

function renderTrendChart(trend, species) {
  const canvas = document.getElementById("speciesTrendChart");
  if (!canvas || !window.Chart) return;

  if (speciesChart) {
    speciesChart.destroy();
  }

  speciesChart = new Chart(canvas, {
    type: "line",
    data: {
      labels: trend.map(item => formatShortDate(item.date)),
      datasets: [{
        label: `${species} Catch`,
        data: trend.map(item => item.fish),
        tension: 0.25,
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function getSpeciesCount(fishCounts, targetSpecies) {
  const items = parseFishCounts(fishCounts);
  const found = items.find(item => item.species === targetSpecies);
  return found ? found.count : 0;
}

function parseFishCounts(fishCounts) {
  return String(fishCounts || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(\d+)\s+(.+)$/);
      if (!match) return null;

      return {
        count: Number(match[1] || 0),
        species: match[2].trim()
      };
    })
    .filter(Boolean);
}

function getTopKey(obj) {
  return Object.keys(obj || {}).sort((a, b) => obj[b] - obj[a])[0];
}

function getBiteStatus(count) {
  if (count >= 1000) return "Hot";
  if (count >= 300) return "Good";
  if (count >= 75) return "Fair";
  return "Slow";
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}

function formatDisplayDate(dateText) {
  if (!dateText) return "";
  const date = new Date(dateText + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function formatShortDate(dateText) {
  if (!dateText) return "";
  const date = new Date(dateText + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}
function getSpeciesFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const querySpecies = params.get("species");

  if (querySpecies) return querySpecies;

  const fileName = window.location.pathname
    .split("/")
    .pop()
    .replace(".html", "");

  if (!fileName || fileName === "species-detail") return "Yellowtail";

  return fileName
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
