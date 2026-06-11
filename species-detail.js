document.addEventListener("DOMContentLoaded", initSpeciesDetail);

let selectedSpecies = "";
let dailyRows = [];

async function initSpeciesDetail() {
  selectedSpecies = getParam("species");

  if (!selectedSpecies) {
    setText("speciesTitle", "Species not found");
    return;
  }

  setText("speciesTitle", `🐟 ${selectedSpecies}`);
  setText("speciesBoatTitle", selectedSpecies);

  try {
    dailyRows = await loadRecentDailyRows(84);

    const matchedRows = rowsForSpecies(dailyRows, selectedSpecies);

    renderSummary(matchedRows);
    renderWeeklyTrend(matchedRows);
    renderRegionalSplit(matchedRows);
    renderTopBoats(matchedRows);
    renderRecentReports(matchedRows);
  } catch (error) {
    console.error("Species detail load failed:", error);
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) throw new Error("Could not load " + path);

  return response.json();
}

async function loadRecentDailyRows(days = 84) {
  const index = await fetchJson("daily-report-index.json");

  if (!Array.isArray(index) || !index.length) return [];

  const reports = index.slice(0, days);
  const rows = [];

  for (const report of reports) {
    const filePath = report.file || `reports/daily-report-${report.date}.json`;

    try {
      const reportRows = await fetchJson(filePath);

      if (Array.isArray(reportRows)) {
        rows.push(...reportRows.map(row => ({ ...row, report_date: report.date })));
      }
    } catch (error) {
      console.warn("Skipped report:", filePath, error);
    }
  }

  return rows;
}

function rowsForSpecies(rows, speciesName) {
  return rows
    .map(row => {
      const count = getSpeciesCount(row.fish_counts, speciesName);
      return { ...row, species_count: count };
    })
    .filter(row => row.species_count > 0);
}

function getSpeciesCount(fishCounts, speciesName) {
  const target = clean(speciesName).toLowerCase();

  return parseFishCounts(fishCounts).reduce((sum, item) => {
    return clean(item.species).toLowerCase() === target
      ? sum + item.count
      : sum;
  }, 0);
}

function renderSummary(rows) {
  const totalFish = rows.reduce((sum, row) => sum + Number(row.species_count || 0), 0);
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fpa = totalFish / Math.max(anglers, 1);

  const regionMap = {};
  rows.forEach(row => {
    const region = clean(row.region || "Unknown");
    regionMap[region] = (regionMap[region] || 0) + Number(row.species_count || 0);
  });

  const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  setText("speciesTotalFish", format(totalFish));
  setText("speciesAnglers", format(anglers));
  setText("speciesFpa", fpa.toFixed(2));
  setText("speciesTopRegion", topRegion);
}

function renderWeeklyTrend(rows) {
  const container = document.getElementById("weeklyTrendChart");
  if (!container) return;

  const weekly = {};

  rows.forEach(row => {
    const week = getWeekLabel(row.report_date);
    weekly[week] = (weekly[week] || 0) + Number(row.species_count || 0);
  });

  const data = Object.entries(weekly)
    .map(([week, fish]) => ({ week, fish }))
    .sort((a, b) => Number(a.week.replace("W", "")) - Number(b.week.replace("W", "")))
    .slice(-12);

  if (!data.length) {
    container.innerHTML = `<div class="empty-card">No weekly trend found.</div>`;
    return;
  }

  const max = Math.max(...data.map(item => item.fish), 1);

  container.innerHTML = `
    <div class="weekly-bars">
      ${data.map(item => {
        const height = Math.max(4, Math.round((item.fish / max) * 100));

        return `
          <div class="weekly-bar-item">
            <div class="weekly-bar" style="height:${height}%"></div>
            <span>${safe(item.week)}</span>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderRegionalSplit(rows) {
  const container = document.getElementById("regionalSplitChart");
  if (!container) return;

  const map = {};

  rows.forEach(row => {
    const region = clean(row.region || "Unknown");
    map[region] = (map[region] || 0) + Number(row.species_count || 0);
  });

  const data = Object.entries(map)
    .map(([region, fish]) => ({ region, fish }))
    .sort((a, b) => b.fish - a.fish);

  if (!data.length) {
    container.innerHTML = `<div class="empty-card">No regional data found.</div>`;
    return;
  }

  const max = Math.max(...data.map(item => item.fish), 1);

  container.innerHTML = data.map(item => {
    const width = Math.max(4, Math.round((item.fish / max) * 100));

    return `
      <div class="regional-split-row">
        <span>${safe(item.region)}</span>
        <div>
          <b style="width:${width}%"></b>
        </div>
        <strong>${format(item.fish)}</strong>
      </div>
    `;
  }).join("");
}

function renderTopBoats(rows) {
  const container = document.getElementById("speciesTopBoats");
  if (!container) return;

  const map = {};

  rows.forEach(row => {
    const boat = clean(row.boat || "Unknown Boat");
    const landing = clean(row.landing || "");
    const region = clean(row.region || "");
    const anglers = Number(row.anglers || 0);
    const fish = Number(row.species_count || 0);

    if (!map[boat]) {
      map[boat] = {
        boat,
        landing,
        region,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    map[boat].trips += 1;
    map[boat].anglers += anglers;
    map[boat].fish += fish;
  });

  const boats = Object.values(map)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1)
    }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, 10);

  if (!boats.length) {
    container.innerHTML = `<div class="empty-card">No boats found for ${safe(selectedSpecies)}.</div>`;
    return;
  }

  container.innerHTML = boats.map(boat => `
    <a class="species-boat-card" href="/boat-detail.html?boat=${encodeURIComponent(boat.boat)}">
      <div>
        <h3>${safe(boat.boat)}</h3>
        <p>${safe(boat.landing)} · ${safe(boat.region)}</p>
      </div>
      <div>
        <strong>${format(boat.fish)}</strong>
        <span>${boat.fpa.toFixed(2)} FPA</span>
      </div>
    </a>
  `).join("");
}

function renderRecentReports(rows) {
  const container = document.getElementById("speciesRecentReports");
  if (!container) return;

  const recent = rows
    .slice()
    .sort((a, b) => new Date(b.report_date || 0) - new Date(a.report_date || 0))
    .slice(0, 12);

  if (!recent.length) {
    container.innerHTML = `<div class="empty-card">No recent reports found.</div>`;
    return;
  }

  container.innerHTML = recent.map(row => `
    <article class="species-report-card">
      <div>
        <h3>
          <a href="/boat-detail.html?boat=${encodeURIComponent(row.boat || "")}">
            ${safe(row.boat || "Unknown Boat")}
          </a>
        </h3>
        <p>${safe(row.landing)} · ${safe(row.region)}</p>
      </div>

      <div>
        <strong>${format(row.species_count)}</strong>
        <span>${safe(row.trip_type || "Trip")}</span>
      </div>
    </article>
  `).join("");
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

function getWeekLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "W--";

  const start = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - start) / 86400000);
  const week = Math.ceil((days + start.getDay() + 1) / 7);

  return `W${String(week).padStart(2, "0")}`;
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

function clean(value) {
  return String(value || "").trim();
}

function format(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
