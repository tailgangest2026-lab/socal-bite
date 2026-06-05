let trendRows = [];
let speciesYoYChart = null;

document.addEventListener("DOMContentLoaded", loadBiteTrends);

async function loadBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  try {
    container.innerHTML = "<h2>Loading bite trends...</h2>";

    const data = await fetchJsonSafe("bite-trends.json?v=" + Date.now());

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = "<h2>No bite trend data found.</h2>";
      return;
    }

    trendRows = normalizeTrendRows(data);

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

  if (
    trimmed.startsWith("<!DOCTYPE") ||
    trimmed.startsWith("<html") ||
    trimmed.startsWith("<")
  ) {
    throw new Error("Non-JSON response from " + url);
  }

  return JSON.parse(trimmed);
}

function normalizeTrendRows(data) {
  return data.map(row => ({
    year: Number(row.Year || row.year || 0),
    week: Number(row.Week || row.week || 0),
    region: row.Region || row.region || "Unknown",
    species: row.Species || row.species || "Unknown",
    trips: Number(row.Trips || row.trips || 0),
    anglers: Number(row.Anglers || row.anglers || 0),
    fish: Number(row.Fish || row.fish || 0),
    fpa: Number(row.FPA || row.fpa || 0)
  })).filter(row =>
    row.year &&
    row.week &&
    row.region &&
    row.species
  );
}

function setupControls() {
  const windowSelect = document.getElementById("trendWindow");
  const regionSelect = document.getElementById("regionFilter");
  const speciesSelect = document.getElementById("speciesTrendSelect");

  if (windowSelect) {
    windowSelect.onchange = () => {
      renderSpeciesYoYChart();
      renderBiteTrends();
    };
  }

  if (regionSelect) {
    regionSelect.onchange = () => {
      populateSpeciesTrendSelect();
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
    trendRows.map(row => row.region || "Unknown")
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

  const selectedRegion = getSelectedRegion();

  const rows = selectedRegion === "all"
    ? trendRows
    : trendRows.filter(row => row.region === selectedRegion);

  const speciesTotals = {};

  rows.forEach(row => {
    speciesTotals[row.species] =
      (speciesTotals[row.species] || 0) + row.fish;
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

  if (!canvas || !speciesSelect || !trendRows.length) return;

  const selectedSpecies = speciesSelect.value;
  const selectedRegion = getSelectedRegion();

  const rows = selectedRegion === "all"
    ? trendRows
    : trendRows.filter(row => row.region === selectedRegion);

const currentYear = Math.max(...rows.map(row => row.year));
const previousYear = currentYear - 1;

const currentYearWeeks = rows
  .filter(row => row.year === currentYear)
  .map(row => row.week);

const maxCurrentWeek = Math.max(...currentYearWeeks);

const weeks = Array.from(
  { length: maxCurrentWeek },
  (_, i) => i + 1
);

  const currentData = weeks.map(week => {
  const total = rows
    .filter(row =>
      row.year === currentYear &&
      row.week === week &&
      row.species === selectedSpecies
    )
    .reduce((sum, row) => sum + row.fish, 0);

  return total > 0 ? total : null;
});

  const previousData = weeks.map(week => {
  const total = rows
    .filter(row =>
      row.year === previousYear &&
      row.week === week &&
      row.species === selectedSpecies
    )
    .reduce((sum, row) => sum + row.fish, 0);

  return total > 0 ? total : null;
});

  const ctx = canvas.getContext("2d");

  if (speciesYoYChart) {
    speciesYoYChart.destroy();
  }

  speciesYoYChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: weeks.map(week => "W" + week),
      datasets: [
        {
          label: String(previousYear),
          data: previousData,
          borderColor: "#e7b85a",
          backgroundColor: "#e7b85a",
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        },
        {
          label: String(currentYear),
          data: currentData,
          borderColor: "#19c2d1",
          backgroundColor: "#19c2d1",
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
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
    }
  });
}

function renderBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  if (!trendRows.length) {
    container.innerHTML = "<h2>No bite trend data found.</h2>";
    return;
  }

  const selectedRegion = getSelectedRegion();
  const windowWeeks = getSelectedWindowWeeks();

  let rows = selectedRegion === "all"
    ? trendRows
    : trendRows.filter(row => row.region === selectedRegion);

  const latestYear = Math.max(...rows.map(row => row.year));
  const latestWeek = Math.max(
    ...rows
      .filter(row => row.year === latestYear)
      .map(row => row.week)
  );

  const minWeek = Math.max(1, latestWeek - windowWeeks + 1);

  rows = rows.filter(row =>
    row.year === latestYear &&
    row.week >= minWeek &&
    row.week <= latestWeek
  );

  const totalTrips = rows.reduce((sum, row) => sum + row.trips, 0);
  const totalAnglers = rows.reduce((sum, row) => sum + row.anglers, 0);
  const totalFish = rows.reduce((sum, row) => sum + row.fish, 0);
  const totalFpa = totalAnglers ? totalFish / totalAnglers : 0;

  const speciesTrends = buildSpeciesTrends(rows);
  const regionTrends = buildRegionTrends(rows);

  container.innerHTML = `
    <section class="region-section">
      <h2>Bite Trends - Last ${getSelectedWindowDays()} Days</h2>
      <p class="updated">
        ${selectedRegion === "all" ? "All Regions" : selectedRegion}
      </p>

      <div class="summary-row">
        <span>${numberFormat(totalTrips)} Trips</span>
        <span>${numberFormat(totalAnglers)} Anglers</span>
        <span>${numberFormat(totalFish)} Fish</span>
        <span>${totalFpa.toFixed(2)} FPA</span>
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
  `;
}

function buildSpeciesTrends(rows) {
  const grouped = {};

  rows.forEach(row => {
    if (!grouped[row.species]) {
      grouped[row.species] = {
        species: row.species,
        fish: 0,
        anglers: 0,
        trips: 0,
        regionsSet: new Set()
      };
    }

    grouped[row.species].fish += row.fish;
    grouped[row.species].anglers += row.anglers;
    grouped[row.species].trips += row.trips;
    grouped[row.species].regionsSet.add(row.region);
  });

  return Object.values(grouped)
    .map(item => ({
      ...item,
      regions: Array.from(item.regionsSet).sort(),
      fpa: item.anglers ? item.fish / item.anglers : 0
    }))
    .sort((a, b) =>
      b.fish - a.fish ||
      b.fpa - a.fpa
    );
}

function buildRegionTrends(rows) {
  const grouped = {};

  rows.forEach(row => {
    if (!grouped[row.region]) {
      grouped[row.region] = {
        region: row.region,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    grouped[row.region].trips += row.trips;
    grouped[row.region].anglers += row.anglers;
    grouped[row.region].fish += row.fish;
  });

  return Object.values(grouped)
    .map(item => ({
      ...item,
      fpa: item.anglers ? item.fish / item.anglers : 0
    }))
    .sort((a, b) =>
      b.fpa - a.fpa ||
      b.fish - a.fish
    );
}

function getSelectedRegion() {
  const select = document.getElementById("regionFilter");
  return select ? select.value : "all";
}

function getSelectedWindowDays() {
  const select = document.getElementById("trendWindow");
  return Number((select && select.value) || 30);
}

function getSelectedWindowWeeks() {
  const days = getSelectedWindowDays();
  return Math.max(1, Math.ceil(days / 7));
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}
