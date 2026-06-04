let dailyIndex = [];
let trendRows = [];

document.addEventListener("DOMContentLoaded", loadBiteTrends);

async function loadBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  try {
    container.innerHTML = "<h2>Loading bite trends...</h2>";

    const indexResponse = await fetch("daily-report-index.json?v=" + Date.now());

    if (!indexResponse.ok) {
      throw new Error("Could not load daily-report-index.json");
    }

    dailyIndex = await indexResponse.json();

    if (!Array.isArray(dailyIndex) || !dailyIndex.length) {
      container.innerHTML = "<h2>No trend data found.</h2>";
      return;
    }

    await loadTrendWindow();

    setupControls();
    populateRegionFilter();
    renderBiteTrends();

  } catch (error) {
    console.error("Bite trends load error:", error);
    container.innerHTML = "<h2>Could not load bite trends.</h2>";
  }
}

async function loadTrendWindow() {
  const windowDays = getSelectedWindowDays();
  const selectedDates = dailyIndex.slice(0, windowDays);

  const allRows = [];

  for (const item of selectedDates) {
    try {
      const filePath =
        item.file || `reports/daily-report-${item.date}.json`;

      const response =
        await fetch(filePath + "?v=" + Date.now());

      if (!response.ok) {
        console.warn("Missing trend file:", filePath);
        continue;
      }

      const rows = await response.json();

      if (Array.isArray(rows)) {
        rows.forEach(row => {
          allRows.push({
            ...row,
            report_date: item.date
          });
        });
      }

    } catch (error) {
      console.warn("Could not load trend date:", item.date, error);
    }
  }

  trendRows = allRows;
}

function setupControls() {
  const windowSelect = document.getElementById("trendWindow");
  const regionSelect = document.getElementById("regionFilter");

  windowSelect.onchange = async () => {
    document.getElementById("biteTrendsPage").innerHTML =
      "<h2>Refreshing bite trends...</h2>";

    await loadTrendWindow();
    populateRegionFilter();
    renderBiteTrends();
  };

  regionSelect.onchange = () => {
    renderBiteTrends();
  };
}

function populateRegionFilter() {
  const select = document.getElementById("regionFilter");
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

function renderBiteTrends() {
  const container = document.getElementById("biteTrendsPage");

  if (!trendRows.length) {
    container.innerHTML = "<h2>No bite trend data found.</h2>";
    return;
  }

  const selectedRegion = document.getElementById("regionFilter").value;
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

function getSelectedWindowDays() {
  return Number(document.getElementById("trendWindow").value || 30);
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
