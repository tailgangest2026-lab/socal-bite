document.addEventListener("DOMContentLoaded", initHome);

let reportYearCache = {};

async function initHome() {
  setText("year", new Date().getFullYear());

  const yesterday = getYesterdayString();

  const dateEl = document.getElementById("todayDate");
  if (dateEl) {
    dateEl.textContent = formatDisplayDate(yesterday);
  }

  try {
    const yesterdayRows = await loadRowsForDate(yesterday);
    const homeData = buildHomeDataFromRows(yesterdayRows);

    buildKpis(homeData);
    buildRegionBoard(homeData);
    buildTopBoatsFromHome(homeData);
    buildTopLandingsFromHome(homeData);
    buildForecastPreview(homeData);
  } catch (error) {
    console.error("Homepage load failed:", error);
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(url + sep + "v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

async function fetchReportYear(year) {
  if (reportYearCache[year]) {
    return reportYearCache[year];
  }

  const rows = await fetchJson(`reports/reports-${year}.json`);
  reportYearCache[year] = Array.isArray(rows) ? rows : [];

  return reportYearCache[year];
}

async function loadRowsForDate(date) {
  const year = String(date).substring(0, 4);
  const yearRows = await fetchReportYear(year);

  return yearRows.filter(row => {
    return String(row.trip_date || "") === String(date);
  });
}

function buildHomeDataFromRows(rows) {
  const regionMap = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";

    if (!regionMap[region]) {
      regionMap[region] = {
        region,
        total_trips_today: 0,
        total_anglers_today: 0,
        total_fish_today: 0,
        top_boat_today: "",
        top_landing_today: "",
        top_species_today: "",
        best_boat_last_30_days: ""
      };
    }

    const item = regionMap[region];

    item.total_trips_today += 1;
    item.total_anglers_today += Number(row.anglers || 0);
    item.total_fish_today += Number(row.total_fish || 0);
  });

  Object.values(regionMap).forEach(regionItem => {
    const regionRows = rows.filter(row => row.region === regionItem.region);

    const topBoat = getTopByField(regionRows, "boat");
    const topLanding = getTopByField(regionRows, "landing");
    const topSpecies = getTopSpecies(regionRows);

    regionItem.top_boat_today = topBoat || "N/A";
    regionItem.best_boat_last_30_days = topBoat || "N/A";
    regionItem.top_landing_today = topLanding || "N/A";
    regionItem.top_species_today = topSpecies || "N/A";
  });

  return Object.values(regionMap).sort((a, b) => {
    return Number(b.total_fish_today || 0) - Number(a.total_fish_today || 0);
  });
}

function getTopByField(rows, field) {
  const map = {};

  rows.forEach(row => {
    const key = row[field];
    if (!key) return;

    if (!map[key]) {
      map[key] = {
        name: key,
        fish: 0
      };
    }

    map[key].fish += Number(row.total_fish || 0);
  });

  return Object.values(map)
    .sort((a, b) => b.fish - a.fish)[0]?.name || "";
}

function getTopSpecies(rows) {
  const speciesTotals = {};

  rows.forEach(row => {
    parseFishCounts(row.fish_counts).forEach(item => {
      speciesTotals[item.species] =
        (speciesTotals[item.species] || 0) + item.count;
    });
  });

  return Object.entries(speciesTotals)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)[0]?.name || "";
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

function buildKpis(data) {
  const trips = data.reduce((sum, r) => sum + Number(r.total_trips_today || 0), 0);
  const anglers = data.reduce((sum, r) => sum + Number(r.total_anglers_today || 0), 0);
  const fish = data.reduce((sum, r) => sum + Number(r.total_fish_today || 0), 0);

  setText("kpiTrips", format(trips));
  setText("kpiAnglers", format(anglers));
  setText("kpiFish", format(fish));
}

function buildRegionBoard(data) {
  const el = document.getElementById("regionBoard");
  if (!el) return;

  if (!data.length) {
    el.innerHTML = `<div class="empty-card">No report data found for yesterday.</div>`;
    return;
  }

  el.innerHTML = data.map(r => `
    <article class="region-card">
      <div class="region-top">
        <span>${safe(r.region)}</span>
        <strong>${format(r.total_fish_today)} fish</strong>
      </div>

      <div class="region-stat-row">
        <div>
          <small>Trips</small>
          <b>${format(r.total_trips_today)}</b>
        </div>
        <div>
          <small>Anglers</small>
          <b>${format(r.total_anglers_today)}</b>
        </div>
      </div>

      <div class="region-details">
        <p><span>Top Boat</span>${detailLink("boat-detail.html", "boat", r.top_boat_today)}</p>
        <p><span>Landing</span>${detailLink("landing-detail.html", "landing", r.top_landing_today)}</p>
        <p><span>Hot Species</span>${detailLink("species-detail.html", "species", r.top_species_today)}</p>
      </div>
    </article>
  `).join("");
}

function buildTopBoatsFromHome(data) {
  const el = document.getElementById("topBoatsList");
  if (!el) return;

  el.innerHTML = data
    .slice()
    .sort((a, b) => Number(b.total_fish_today || 0) - Number(a.total_fish_today || 0))
    .map((r, i) => rankingItem(
      i + 1,
      r.best_boat_last_30_days || r.top_boat_today || "Unknown Boat",
      r.region || "Southern California",
      `${format(r.total_fish_today)} fish`
    ))
    .join("");
}

function buildTopLandingsFromHome(data) {
  const el = document.getElementById("topLandingsList");
  if (!el) return;

  el.innerHTML = data
    .slice()
    .sort((a, b) => Number(b.total_fish_today || 0) - Number(a.total_fish_today || 0))
    .map((r, i) => rankingItem(
      i + 1,
      r.top_landing_today || "Unknown Landing",
      r.region || "Southern California",
      `${format(r.total_fish_today)} fish`
    ))
    .join("");
}

function buildForecastPreview(data) {
  const el = document.getElementById("forecastPreview");
  if (!el) return;

  el.innerHTML = data
    .slice()
    .sort((a, b) => Number(b.total_fish_today || 0) - Number(a.total_fish_today || 0))
    .slice(0, 4)
    .map((r, i) => {
      const score = Math.max(72, 94 - i * 5);

      return `
        <article class="forecast-card">
          <span>${safe(r.region)}</span>
          <strong>${score}</strong>
          <p>${score >= 85 ? "Strong bite potential" : "Good bite window"}</p>
        </article>
      `;
    })
    .join("");
}

function rankingItem(rank, title, subtitle, value) {
  return `
    <div class="ranking-item">
      <div class="rank-num">${rank}</div>
      <div class="rank-main">
        <strong>${safe(title)}</strong>
        <span>${safe(subtitle)}</span>
      </div>
      <b>${safe(value)}</b>
    </div>
  `;
}

function getYesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toLocalDateString(date);
}

function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
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

function detailLink(page, param, value) {
  if (!value || value === "N/A") return "N/A";

  return `<a class="data-link" href="/${page}?${param}=${encodeURIComponent(value)}">${safe(value)}</a>`;
}
