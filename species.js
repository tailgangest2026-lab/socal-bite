document.addEventListener("DOMContentLoaded", loadSpeciesReports);

async function loadSpeciesReports() {
  const container = document.getElementById("speciesGrid");
  if (!container) return;

  try {
    container.innerHTML = `<div class="loading-card">Loading species analytics...</div>`;

    const index = await fetchJson("daily-report-index.json");

    if (!Array.isArray(index) || !index.length) {
      container.innerHTML = `<div class="empty-card">No daily reports found.</div>`;
      return;
    }

    const recentReports = index.slice(0, 84);
    const allRows = [];

    for (const report of recentReports) {
      const filePath = report.file || `reports/daily-report-${report.date}.json`;

      try {
        const rows = await fetchJson(filePath);
        if (Array.isArray(rows)) allRows.push(...rows);
      } catch (error) {
        console.warn("Skipped report:", filePath, error);
      }
    }

    const speciesData = buildSpeciesSummary(allRows);
    renderSpeciesCards(speciesData);
  } catch (error) {
    console.error("Species report load error:", error);
    container.innerHTML = `<div class="empty-card">Could not load species reports.</div>`;
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json();
}

function buildSpeciesSummary(rows) {
  const speciesMap = {};
  const maxRegions = [
    "Los Angeles",
    "Orange County",
    "San Diego",
    "Ventura",
    "Santa Barbara",
    "San Luis Obispo"
  ];

  rows.forEach(row => {
    const fishCounts = String(row.fish_counts || "");
    const region = clean(row.region || "Unknown");
    const anglers = Number(row.anglers || 0);

    parseFishCounts(fishCounts).forEach(item => {
      if (!speciesMap[item.species]) {
        speciesMap[item.species] = {
          name: item.species,
          fish: 0,
          trips: 0,
          anglers: 0,
          regions: {}
        };
      }

      speciesMap[item.species].fish += item.count;
      speciesMap[item.species].trips += 1;
      speciesMap[item.species].anglers += anglers;

      if (!speciesMap[item.species].regions[region]) {
        speciesMap[item.species].regions[region] = 0;
      }

      speciesMap[item.species].regions[region] += item.count;
    });
  });

  return Object.values(speciesMap)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1),
      regionList: maxRegions
        .filter(region => item.regions[region])
        .map(region => ({
          region,
          fish: item.regions[region]
        }))
    }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 30);
}

function parseFishCounts(text) {
  return String(text || "")
    .split(",")
    .map(part => {
      const match = part.trim().match(/^([\d,]+)\s+(.+)$/);
      if (!match) return null;

      return {
        count: Number(match[1].replace(/,/g, "")),
        species: match[2].trim()
      };
    })
    .filter(Boolean);
}

function renderSpeciesCards(speciesData) {
  const container = document.getElementById("speciesGrid");
  if (!container) return;

  if (!speciesData.length) {
    container.innerHTML = `<div class="empty-card">No species data found.</div>`;
    return;
  }

  const maxFish = Math.max(...speciesData.map(item => item.fish), 1);

  container.innerHTML = speciesData.map((item, index) => {
    const width = Math.max(2, Math.round((item.fish / maxFish) * 100));

    return `
      <a class="species-card-love" href="/species-detail.html?species=${encodeURIComponent(item.name)}">
        <div class="species-card-top">
          <div class="species-title-wrap">
            <span class="species-rank">${String(index + 1).padStart(2, "0")}</span>
            <div>
              <h2>🐟 ${safe(item.name)}</h2>
              <p>${format(item.trips)} trips · ${format(item.anglers)} anglers · ${item.fpa.toFixed(2)} FPA</p>
            </div>
          </div>

          <div class="species-total">
            <strong>${format(item.fish)}</strong>
            <span>Fish</span>
          </div>
        </div>

        <div class="species-bar-track">
          <div class="species-bar-fill" style="width:${width}%"></div>
        </div>

        <div class="species-region-pills">
          ${renderRegionPills(item.regionList)}
        </div>
      </a>
    `;
  }).join("");
}

function renderRegionPills(regions) {
  if (!regions.length) {
    return `<span>Regional data unavailable</span>`;
  }

  return regions.map(item => `
    <span>${safe(item.region)}: <b>${format(item.fish)}</b></span>
  `).join("");
}

function clean(value) {
  return String(value || "").trim();
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
