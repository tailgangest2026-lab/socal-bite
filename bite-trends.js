let dailyIndex = [];
let trendRows = [];
let allTrendRows = [];
let speciesYoYChart = null;

document.addEventListener("DOMContentLoaded", loadBiteTrends);

async function loadBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  try {
    container.innerHTML = "<h2>Loading bite trends...</h2>";

    const dailyIndexData = await fetchJsonSafe("daily-report-index.json?v=" + Date.now());

    if (!Array.isArray(dailyIndexData) || !dailyIndexData.length) {
      container.innerHTML = "<h2>No trend data found.</h2>";
      return;
    }

    dailyIndex = dailyIndexData;

    await loadAllTrendRows();
    await loadTrendWindow();

    setupControls();
    populateRegionFilter();
    populateSpeciesTrendSelect();

    renderSpeciesYoYChart();
    renderBiteTrends();

  } catch (error) {
    console.error("Bite trends load error:", error);
    container.innerHTML = "<h2>Could not load bite trends.</h2>";
  }
}

async function fetchJsonSafe(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Could not load " + url);
  }

  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    throw new Error("Non-JSON response from " + url);
  }

  return JSON.parse(trimmed);
}

async function loadReportRows(item, label) {
  const filePath =
    item.file || `reports/daily-report-${item.date}.json`;

  try {
    const rows = await fetchJsonSafe(filePath + "?v=" + Date.now());

    if (!Array.isArray(rows)) {
      console.warn("Skipping non-array report:", filePath);
      return [];
    }

    return rows.map(row => ({
      ...row,
      report_date: item.date
    }));

  } catch (error) {
    console.warn(`Skipping ${label}:`, item.date, filePath, error.message);
    return [];
  }
}

async function loadAllTrendRows() {
  const allRows = [];

  for (const item of dailyIndex) {
    const rows = await loadReportRows(item, "historical trend date");
    allRows.push(...rows);
  }

  allTrendRows = allRows;
}

async function loadTrendWindow() {
  const windowDays = getSelectedWindowDays();
  const selectedDates = dailyIndex.slice(0, windowDays);

  const allRows = [];

  for (const item of selectedDates) {
    const rows = await loadReportRows(item, "trend date");
    allRows.push(...rows);
  }

  trendRows = allRows;
}

function setupControls() {
  const windowSelect = document.getElementById("trendWindow");
  const regionSelect = document.getElementById("regionFilter");
  const speciesSelect = document.getElementById("speciesTrendSelect");

  if (windowSelect) {
    windowSelect.onchange = async () => {
      document.getElementById("biteTrendsPage").innerHTML =
        "<h2>Refreshing bite trends...</h2>";

      await loadTrendWindow();
      populateRegionFilter();
      renderBiteTrends();
    };
  }

  if (regionSelect) {
    regionSelect.onchange = () => {
      renderSpeciesYoYChart();
      renderBiteTrends();
    };
  }

  if (speciesSelect) {
    speciesSelect.onchange = () => {
      renderSpeciesYoYChart();
    };
  }
}

function populateRegionFilter() {
  const select = document.getElementById("regionFilter");

  if (!select) return;

  const currentValue = select.value;

  const regions = [...new Set(
    trendRows.map(row => row.region || "Unknown Region")
  )].sort();

  select.innerHTML = '<option value="all">All Regions</option>';

  regions.forEach(region => {
    const option = document.createElement("option");
    option.value = region;
    option.textContent = region;
    select.appendChild(option);
  });

  if (regions.includes(currentValue)) {
    select.value = currentValue;
  }
}

function populateSpeciesTrendSelect() {
  const select = document.getElementById("speciesTrendSelect");

  if (!select) return;

  const speciesTotals = {};

  allTrendRows.forEach(row => {
    parseFishCounts(row.fish_counts || "").forEach(item => {
      speciesTotals[item.species] =
        (speciesTotals[item.species] || 0) + item.count;
    });
  });

  const species = Object.keys(speciesTotals)
    .sort((a, b) => speciesTotals[b] - speciesTotals[a]);

  select.innerHTML = "";

  species.forEach(name => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  if (species.includes("Bluefin Tuna")) {
    select.value = "Bluefin Tuna";
  } else if (species.length) {
    select.value = species[0];
  }
}

function renderSpeciesYoYChart() {
  const canvas = document.getElementById("speciesYoYChart");
  const speciesSelect = document.getElementById("speciesTrendSelect");
  const regionSelect = document.getElementById("regionFilter");

  if (!canvas || !speciesSelect || !allTrendRows.length) return;

  const selectedSpecies = speciesSelect.value;
  const selectedRegion = regionSelect ? regionSelect.value : "all";

  const rows = selectedRegion === "all"
    ? allTrendRows
    : allTrendRows.filter(row => row.region === selectedRegion);

  const weekly = buildWeeklySpeciesTrend(rows, selectedSpecies);
  const chartData = buildYoYChartData(weekly);

  const ctx = canvas.getContext("2d");

  if (speciesYoYChart) {
    speciesYoYChart.destroy();
  }

  const chartColors = {
    year2025: "#e7b85a",
    year2026: "#19c2d1"
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#ffffff",
          font: {
            weight: "bold"
          }
        }
      },
      tooltip: {
        backgroundColor: "rgba(3,18,32,.95)",
        titleColor: "#19c2d1",
        bodyColor: "#ffffff",
        borderColor: "rgba(25,194,209,.7)",
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: "#dcecf2",
          font: {
            weight: "bold"
          }
        },
        grid: {
          color: "rgba(255,255,255,.08)"
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: "#dcecf2",
          font: {
            weight: "bold"
          }
        },
        grid: {
          color: "rgba(255,255,255,.08)"
        }
      }
    }
  };

  speciesYoYChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartData.weeks,
      datasets: [
        {
          label: "2025",
          data: chartData.year2025,
          borderColor: chartColors.year2025,
          backgroundColor: chartColors.year2025,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: "2026",
          data: chartData.year2026,
          borderColor: chartColors.year2026,
          backgroundColor: chartColors.year2026,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    },
    options: chartOptions
  });
}

function buildWeeklySpeciesTrend(rows, selectedSpecies) {
  const weekly = {};

  rows.forEach(row => {
    const date = parseDate(row.report_date || row.trip_date);
    if (!date) return;

    const year = date.getFullYear();
    const week = getWeekNumber(date);

    parseFishCounts(row.fish_counts || "").forEach(item => {
      if (item.species !== selectedSpecies) return;

      if (!weekly[week]) {
        weekly[week] = {
          week,
          year2025: 0,
          year2026: 0
        };
      }

      if (year === 2025) {
        weekly[week].year2025 += item.count;
      }

      if (year === 2026) {
        weekly[week].year2026 += item.count;
      }
    });
  });

  return weekly;
}

function buildYoYChartData(weekly) {
  const weeks = Object.keys(weekly)
    .map(Number)
    .sort((a, b) => a - b);

  return {
    weeks: weeks.map(week => `W${week}`),
    year2025: weeks.map(week => weekly[week].year2025 || 0),
    year2026: weeks.map(week => weekly[week].year2026 || 0)
  };
}

function renderBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  if (!trendRows.length) {
    container.innerHTML = "<h2>No bite trend data found.</h2>";
    return;
  }

  const regionSelect = document.getElementById("regionFilter");
  const selectedRegion = regionSelect ? regionSelect.value : "all";
  const windowDays = getSelectedWindowDays();

  const rows = selectedRegion === "all"
    ? trendRows
    : trendRows.filter(row => row.region === selectedRegion);

  const speciesTrends = buildSpeciesTrends(rows);
  const regionTrends = buildRegionTrends(rows);
  const topBoats = buildTrendTopBoats(rows);

  container.innerHTML = `
    <section class="region-section">
      <h2>Bite Trends - Last ${windowDays} Days</h2>
      <p class="updated">
        ${selectedRegion === "all" ? "All Regions" : selectedRegion}
      </p>

      <div class="summary-row">
        <span>${numberFormat(getTotalTrips(rows))} Trips</span>
        <span>${numberFormat(getTotalAnglers(rows))} Anglers</span>
        <span>${numberFormat(getTotalFish(rows))} Fish</span>
        <span>${getFpa(getTotalFish(rows), getTotalAnglers(rows)).toFixed(2)} FPA</span>
      </div>
    </section>

    <section class="region-section">
      <h2>Top Species Trend</h2>

      ${speciesTrends.slice(0, 15).map((item, index) => `
        <div class="boat-row">
          <div>
            <strong>#${index + 1} ${item.species}</strong>
            <p>${item.regions.join(", ")}</p>
          </div>

          <div>
            <strong>${numberFormat(item.fish)} Fish</strong>
            <p>${numberFormat(item.trips)} Trips • ${item.fpa.toFixed(2)} FPA</p>
          </div>
        </div>
      `).join("")}
    </section>

    ${selectedRegion === "all" ? `
      <section class="region-section">
        <h2>Regional Bite Strength</h2>

        ${regionTrends.map((item, index) => `
          <div class="boat-row">
            <div>
              <strong>#${index + 1} ${item.region}</strong>
              <p>${numberFormat(item.trips)} Trips</p>
            </div>

            <div>
              <strong>${item.fpa.toFixed(2)} FPA</strong>
              <p>${numberFormat(item.fish)} Fish • ${numberFormat(item.anglers)} Anglers</p>
            </div>
          </div>
        `).join("")}
      </section>
    ` : ""}

    <section class="region-section">
      <h2>Top Boats Trend</h2>

      ${topBoats.slice(0, 15).map((boat, index) => `
        <div class="boat-row">
          <div>
            <strong>#${index + 1} ${boat.boat}</strong>
            <p>${boat.landing} • ${boat.region}</p>
          </div>

          <div>
            <strong>${boat.fpa.toFixed(2)} FPA</strong>
            <p>${numberFormat(boat.fish)} Fish • ${numberFormat(boat.anglers)} Anglers • ${numberFormat(boat.trips)} Trips</p>
          </div>
        </div>
      `).join("")}
    </section>
  `;
}

function buildSpeciesTrends(rows) {
  const grouped = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";
    const anglers = Number(row.anglers || 0);

    parseFishCounts(row.fish_counts || "").forEach(item => {
      if (!item.species || item.count <= 0) return;

      if (!grouped[item.species]) {
        grouped[item.species] = {
          species: item.species,
          fish: 0,
          anglers: 0,
          trips: 0,
          regionsSet: new Set()
        };
      }

      grouped[item.species].fish += item.count;
      grouped[item.species].anglers += anglers;
      grouped[item.species].trips += 1;
      grouped[item.species].regionsSet.add(region);
    });
  });

  return Object.values(grouped)
    .map(item => ({
      ...item,
      regions: Array.from(item.regionsSet).sort(),
      fpa: getFpa(item.fish, item.anglers)
    }))
    .sort((a, b) =>
      b.fish - a.fish ||
      b.fpa - a.fpa
    );
}

function buildRegionTrends(rows) {
  const grouped = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";

    if (!grouped[region]) {
      grouped[region] = {
        region,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    grouped[region].trips += 1;
    grouped[region].anglers += Number(row.anglers || 0);
    grouped[region].fish += Number(row.total_fish || 0);
  });

  return Object.values(grouped)
    .map(item => ({
      ...item,
      fpa: getFpa(item.fish, item.anglers)
    }))
    .sort((a, b) =>
      b.fpa - a.fpa ||
      b.fish - a.fish
    );
}

function buildTrendTopBoats(rows) {
  const grouped = {};

  rows.forEach(row => {
    const boat = row.boat || "Unknown Boat";
    const landing = row.landing || "Unknown Landing";
    const region = row.region || "Unknown Region";
    const key = `${region}|${landing}|${boat}`;

    if (!grouped[key]) {
      grouped[key] = {
        boat,
        landing,
        region,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    grouped[key].trips += 1;
    grouped[key].anglers += Number(row.anglers || 0);
    grouped[key].fish += Number(row.total_fish || 0);
  });

  return Object.values(grouped)
    .filter(item => item.anglers >= 5)
    .map(item => ({
      ...item,
      fpa: getFpa(item.fish, item.anglers)
    }))
    .sort((a, b) =>
      b.fpa - a.fpa ||
      b.fish - a.fish
    );
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

function parseDate(dateString) {
  const parts = String(dateString || "").split("-");

  if (parts.length !== 3) return null;

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
}

function getWeekNumber(date) {
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDays = Math.floor((date - firstDay) / 86400000);

  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
}

function getSelectedWindowDays() {
  const select = document.getElementById("trendWindow");
  return Number((select && select.value) || 30);
}

function getTotalTrips(rows) {
  return rows.length;
}

function getTotalAnglers(rows) {
  return rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
}

function getTotalFish(rows) {
  return rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
}

function getFpa(fish, anglers) {
  return anglers > 0 ? fish / anglers : 0;
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}
