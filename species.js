const TARGET_SPECIES = [
  "Yellowtail",
  "Bluefin Tuna",
  "Yellowfin Tuna",
  "Rockfish",
  "White Seabass",
  "Halibut",
  "Calico Bass",
  "Sheephead",
  "Whitefish",
  "Lingcod"
];

document.addEventListener("DOMContentLoaded", loadSpeciesReports);

async function loadSpeciesReports() {
  const container = document.getElementById("speciesPage");

  try {
    container.innerHTML = "<h2>Loading species reports...</h2>";

    const indexResponse = await fetch("daily-report-index.json?v=" + Date.now());

    if (!indexResponse.ok) {
      throw new Error("Could not load daily-report-index.json");
    }

    const dailyIndex = await indexResponse.json();

    if (!Array.isArray(dailyIndex) || !dailyIndex.length) {
      container.innerHTML = "<h2>No daily reports found.</h2>";
      return;
    }

    const recentReports = dailyIndex.slice(0, 30);

    const allRows = [];

    for (const report of recentReports) {
      const filePath = report.file || `reports/daily-report-${report.date}.json`;

      try {
        const response = await fetch(filePath + "?v=" + Date.now());

        if (!response.ok) continue;

        const rows = await response.json();

        if (Array.isArray(rows)) {
          allRows.push(...rows);
        }
      } catch (error) {
        console.warn("Skipped report:", filePath, error);
      }
    }

    renderSpeciesReports(allRows);

  } catch (error) {
    console.error("Species report load error:", error);
    container.innerHTML = "<h2>Could not load species reports.</h2>";
  }
}

function renderSpeciesReports(rows) {
  const container = document.getElementById("speciesPage");

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML = "<h2>No species data found.</h2>";
    return;
  }

  const speciesData = buildSpeciesSummary(rows);

  container.innerHTML = `
    <section class="region-section">
      <h2>Southern California Species Reports</h2>
      <p class="updated">Last 30 days based on reported sportfishing catches</p>
    </section>

    <section class="region-section">
      ${TARGET_SPECIES.map(species => {
        const item = speciesData[species] || {
          fish: 0,
          topRegion: "No data",
          topBoat: "No data",
          biteStatus: "Slow"
        };

  return `
  <a class="boat-row" href="species-detail.html?species=${encodeURIComponent(species)}">
    <div>
      <strong>${species}</strong>
      <p>${item.biteStatus} bite • Top Region: ${item.topRegion}</p>
      <p>Top Boat: ${item.topBoat}</p>
    </div>

    <div>
      <strong>${numberFormat(item.fish)} Fish</strong>
      <p>Last 30 Days</p>
    </div>
  </a>
`;
      }).join("")}
    </section>
  `;
}

function buildSpeciesSummary(rows) {
  const data = {};

  TARGET_SPECIES.forEach(species => {
    data[species] = {
      fish: 0,
      regions: {},
      boats: {}
    };
  });

  rows.forEach(row => {
    const region = row.region || "Unknown Region";
    const boat = row.boat || "Unknown Boat";
    const fishItems = parseFishCounts(row.fish_counts);

    fishItems.forEach(item => {
      if (!TARGET_SPECIES.includes(item.species)) return;

      data[item.species].fish += item.count;

      data[item.species].regions[region] =
        (data[item.species].regions[region] || 0) + item.count;

      data[item.species].boats[boat] =
        (data[item.species].boats[boat] || 0) + item.count;
    });
  });

  Object.keys(data).forEach(species => {
    const item = data[species];

    item.topRegion = getTopKey(item.regions) || "No data";
    item.topBoat = getTopKey(item.boats) || "No data";
    item.biteStatus = getBiteStatus(item.fish);
  });

  return data;
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
