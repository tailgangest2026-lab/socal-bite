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

    if (!matchedRows.length) {
      renderNoSpeciesData();
      return;
    }

    renderSummary(matchedRows);
    renderSpeciesIntel(matchedRows);
    renderTrendBox(matchedRows);
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
  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(url + sep + "v=" + Date.now());

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
  const target = normalizeSpecies(speciesName);

  return parseFishCounts(fishCounts).reduce((sum, item) => {
    return normalizeSpecies(item.species) === target ? sum + item.count : sum;
  }, 0);
}

function renderSummary(rows) {
  const stats = getSpeciesStats(rows);

  setText("speciesScore", stats.score);
  setText("speciesTotalFish", format(stats.totalFish));
  setText("speciesAnglers", format(stats.anglers));
  setText("speciesFpa", stats.fpa.toFixed(2));
  setText("speciesTopRegion", stats.topRegion);
  setText("speciesSubTitle", `${stats.trips} recent reports · ${stats.trend} trend`);
}

function renderSpeciesIntel(rows) {
  const container = document.getElementById("speciesIntel");
  if (!container) return;

  const stats = getSpeciesStats(rows);
  const topBoat = getTopBoatsData(rows, 1)[0];
  const topLanding = getTopLanding(rows);
  const peakWeek = getPeakWeek(rows);
  const bestTrip = getBestReport(rows);

  container.innerHTML = `
    <div class="species-intel-row">
      <span>Current Activity</span>
      <strong>${safe(getActivityLabel(stats.score))}</strong>
    </div>

    <div class="species-intel-row">
      <span>Trend</span>
      <strong>${safe(stats.trend)}</strong>
    </div>

    <div class="species-intel-row">
      <span>Best Boat</span>
      <strong>${safe(topBoat?.boat || "N/A")}</strong>
    </div>

    <div class="species-intel-row">
      <span>Best Landing</span>
      <strong>${safe(topLanding?.landing || "N/A")}</strong>
    </div>

    <div class="species-intel-row">
      <span>Peak Week</span>
      <strong>${safe(peakWeek?.week || "N/A")} · ${format(peakWeek?.fish || 0)}</strong>
    </div>

    <div class="species-intel-row">
      <span>Best Recent Report</span>
      <strong>${bestTrip ? `${format(bestTrip.species_count)} fish` : "N/A"}</strong>
    </div>
  `;
}

function renderTrendBox(rows) {
  const container = document.getElementById("speciesTrendBox");
  if (!container) return;

  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.report_date || 0) - new Date(b.report_date || 0));

  const recent = sorted.slice(-14);
  const previous = sorted.slice(-28, -14);

  const recentFish = recent.reduce((sum, row) => sum + Number(row.species_count || 0), 0);
  const previousFish = previous.reduce((sum, row) => sum + Number(row.species_count || 0), 0);

  const change = previousFish > 0 ? ((recentFish - previousFish) / previousFish) * 100 : 0;
  const trend = getTrendFromChange(change, previous.length);

  container.innerHTML = `
    <div class="species-trend-main">
      <strong>${safe(trend)}</strong>
      <span>${change >= 0 ? "+" : ""}${change.toFixed(1)}% catch change</span>
    </div>

    <div class="species-intel-row">
      <span>Recent 14 Reports</span>
      <strong>${format(recentFish)}</strong>
    </div>

    <div class="species-intel-row">
      <span>Previous 14 Reports</span>
      <strong>${format(previousFish)}</strong>
    </div>
  `;
}

function renderWeeklyTrend(rows) {
  const container = document.getElementById("weeklyTrendChart");
  if (!container) return;

  const data = getWeeklyData(rows).slice(-12);

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
          <div class="weekly-bar-item" title="${safe(item.week)} · ${format(item.fish)} fish">
            <div class="weekly-bar" style="height:${height}%"></div>
            <span>${safe(item.week)}</span>
            <em>${format(item.fish)}</em>
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

  const total = data.reduce((sum, item) => sum + item.fish, 0);
  const max = Math.max(...data.map(item => item.fish), 1);

  container.innerHTML = data.map(item => {
    const width = Math.max(4, Math.round((item.fish / max) * 100));
    const percent = total > 0 ? Math.round((item.fish / total) * 100) : 0;

    return `
      <div class="regional-split-row">
        <span>${safe(item.region)}</span>
        <div><b style="width:${width}%"></b></div>
        <strong>${format(item.fish)}</strong>
        <em>${percent}%</em>
      </div>
    `;
  }).join("");
}

function renderTopBoats(rows) {
  const container = document.getElementById("speciesTopBoats");
  if (!container) return;

  const boats = getTopBoatsData(rows, 10);

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
        <span>${boat.trips} trips · ${boat.fpa.toFixed(2)} FPA</span>
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

  container.innerHTML = recent.map(row => {
    const anglers = Number(row.anglers || 0);
    const count = Number(row.species_count || 0);
    const fpa = count / Math.max(anglers, 1);

    return `
      <article class="species-report-card">
        <div>
          <h3>
            <a href="/boat-detail.html?boat=${encodeURIComponent(row.boat || "")}">
              ${safe(row.boat || "Unknown Boat")}
            </a>
          </h3>
          <p>${safe(formatDate(row.report_date))} · ${safe(row.landing)} · ${safe(row.region)}</p>
        </div>

        <div>
          <strong>${format(count)}</strong>
          <span>${safe(row.trip_type || "Trip")} · ${fpa.toFixed(2)} FPA</span>
        </div>
      </article>
    `;
  }).join("");
}

function getSpeciesStats(rows) {
  const totalFish = rows.reduce((sum, row) => sum + Number(row.species_count || 0), 0);
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const trips = rows.length;
  const fpa = totalFish / Math.max(anglers, 1);

  const regionMap = {};
  rows.forEach(row => {
    const region = clean(row.region || "Unknown");
    regionMap[region] = (regionMap[region] || 0) + Number(row.species_count || 0);
  });

  const topRegion = Object.entries(regionMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const score = calculateSpeciesScore(trips, totalFish, anglers, fpa);
  const trend = getSpeciesTrend(rows);

  return { totalFish, anglers, trips, fpa, topRegion, score, trend };
}

function calculateSpeciesScore(trips, fish, anglers, fpa) {
  let score = 0;

  score += Math.min(trips * 2.5, 30);
  score += Math.min(fish / 35, 35);
  score += Math.min(fpa * 18, 25);
  score += Math.min(anglers / 100, 10);

  return Math.round(Math.min(score, 100));
}

function getSpeciesTrend(rows) {
  const sorted = rows
    .slice()
    .sort((a, b) => new Date(a.report_date || 0) - new Date(b.report_date || 0));

  const recent = sorted.slice(-14);
  const previous = sorted.slice(-28, -14);

  const recentFish = recent.reduce((sum, row) => sum + Number(row.species_count || 0), 0);
  const previousFish = previous.reduce((sum, row) => sum + Number(row.species_count || 0), 0);

  const change = previousFish > 0 ? ((recentFish - previousFish) / previousFish) * 100 : 0;
  return getTrendFromChange(change, previous.length);
}

function getTrendFromChange(change, previousCount) {
  if (!previousCount) return "Building";
  if (change > 15) return "Rising";
  if (change < -15) return "Cooling";
  return "Stable";
}

function getActivityLabel(score) {
  if (score >= 85) return "Very Hot";
  if (score >= 70) return "Hot";
  if (score >= 50) return "Active";
  if (score >= 30) return "Slow";
  return "Very Slow";
}

function getTopBoatsData(rows, limit = 10) {
  const map = {};

  rows.forEach(row => {
    const boat = clean(row.boat || "Unknown Boat");
    const landing = clean(row.landing || "");
    const region = clean(row.region || "");
    const anglers = Number(row.anglers || 0);
    const fish = Number(row.species_count || 0);

    if (!map[boat]) {
      map[boat] = { boat, landing, region, trips: 0, anglers: 0, fish: 0 };
    }

    map[boat].trips += 1;
    map[boat].anglers += anglers;
    map[boat].fish += fish;
  });

  return Object.values(map)
    .map(item => ({ ...item, fpa: item.fish / Math.max(item.anglers, 1) }))
    .sort((a, b) => b.fish - a.fish)
    .slice(0, limit);
}

function getTopLanding(rows) {
  const map = {};

  rows.forEach(row => {
    const landing = clean(row.landing || "Unknown Landing");
    map[landing] = (map[landing] || 0) + Number(row.species_count || 0);
  });

  return Object.entries(map)
    .map(([landing, fish]) => ({ landing, fish }))
    .sort((a, b) => b.fish - a.fish)[0];
}

function getWeeklyData(rows) {
  const weekly = {};

  rows.forEach(row => {
    const week = getWeekLabel(row.report_date);
    weekly[week] = (weekly[week] || 0) + Number(row.species_count || 0);
  });

  return Object.entries(weekly)
    .map(([week, fish]) => ({ week, fish }))
    .sort((a, b) => Number(a.week.replace("W", "")) - Number(b.week.replace("W", "")));
}

function getPeakWeek(rows) {
  return getWeeklyData(rows).sort((a, b) => b.fish - a.fish)[0];
}

function getBestReport(rows) {
  return rows
    .slice()
    .sort((a, b) => Number(b.species_count || 0) - Number(a.species_count || 0))[0];
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

function formatDate(value) {
  if (!value) return "Recent Report";

  const date = new Date(value + "T00:00:00");
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function normalizeSpecies(value) {
  return clean(value).toLowerCase().replace(/\s+/g, " ");
}

function renderNoSpeciesData() {
  setText("speciesSubTitle", "No recent reports found for this species.");
  setText("speciesScore", "--");
  setText("speciesTotalFish", "0");
  setText("speciesAnglers", "0");
  setText("speciesFpa", "--");
  setText("speciesTopRegion", "--");

  [
    "speciesIntel",
    "speciesTrendBox",
    "weeklyTrendChart",
    "regionalSplitChart",
    "speciesTopBoats",
    "speciesRecentReports"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="empty-card">No recent data found.</div>`;
  });
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
