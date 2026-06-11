document.addEventListener("DOMContentLoaded", initRankings);

let currentView = "boats";
let boatRows = [];
let landingRows = [];
let filteredRows = [];

async function initRankings() {
  try {
    const dailyRows = await loadRecentDailyRows();

    boatRows = buildBoatRankings(dailyRows);
    landingRows = buildLandingRankings(dailyRows);

    buildRegionFilter(dailyRows);
    bindControls();
    renderKpis(dailyRows);
    renderRankings();
  } catch (error) {
    console.error("Rankings load failed:", error);
    document.getElementById("rankingBody").innerHTML = `
      <tr><td colspan="7">Could not load rankings.</td></tr>
    `;
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

async function loadRecentDailyRows() {
  const index = await fetchJson("daily-report-index.json");

  if (!Array.isArray(index) || !index.length) {
    return [];
  }

  const recentReports = index.slice(0, 30);
  const allRows = [];

  for (const report of recentReports) {
    const filePath = report.file || `reports/daily-report-${report.date}.json`;

    try {
      const rows = await fetchJson(filePath);

      if (Array.isArray(rows)) {
        allRows.push(...rows);
      }
    } catch (error) {
      console.warn("Skipped report:", filePath, error);
    }
  }

  return allRows;
}

function buildBoatRankings(rows) {
  const map = {};

  rows.forEach(row => {
    const boat = clean(row.boat);
    if (!boat) return;

    const key = boat.toLowerCase();
    const fish = Number(row.total_fish || 0);
    const anglers = Number(row.anglers || 0);
    const trips = 1;

    if (!map[key]) {
      map[key] = {
        name: boat,
        landing: clean(row.landing),
        region: clean(row.region),
        tripType: clean(row.trip_type),
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    map[key].trips += trips;
    map[key].anglers += anglers;
    map[key].fish += fish;

    if (!map[key].landing && row.landing) map[key].landing = clean(row.landing);
    if (!map[key].region && row.region) map[key].region = clean(row.region);
    if (!map[key].tripType && row.trip_type) map[key].tripType = clean(row.trip_type);
  });

  return Object.values(map)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1)
    }))
    .sort((a, b) => b.fpa - a.fpa);
}

function buildLandingRankings(rows) {
  const map = {};

  rows.forEach(row => {
    const landing = clean(row.landing);
    if (!landing) return;

    const key = landing.toLowerCase();
    const fish = Number(row.total_fish || 0);
    const anglers = Number(row.anglers || 0);

    if (!map[key]) {
      map[key] = {
        name: landing,
        region: clean(row.region),
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    map[key].trips += 1;
    map[key].anglers += anglers;
    map[key].fish += fish;

    if (!map[key].region && row.region) map[key].region = clean(row.region);
  });

  return Object.values(map)
    .map(item => ({
      ...item,
      fpa: item.fish / Math.max(item.anglers, 1)
    }))
    .sort((a, b) => b.fpa - a.fpa);
}

function bindControls() {
  document.querySelectorAll(".rank-toggle button").forEach(button => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view || "boats";

      document.querySelectorAll(".rank-toggle button")
        .forEach(btn => btn.classList.remove("active"));

      button.classList.add("active");

      const search = document.getElementById("rankSearch");
      if (search) {
        search.placeholder = currentView === "boats" ? "Search boats..." : "Search landings...";
        search.value = "";
      }

      renderRankings();
    });
  });

  document.getElementById("rankSearch")?.addEventListener("input", renderRankings);
  document.getElementById("rankRegion")?.addEventListener("change", renderRankings);
}

function buildRegionFilter(rows) {
  const select = document.getElementById("rankRegion");
  if (!select) return;

  const regions = [...new Set(rows.map(r => clean(r.region)).filter(Boolean))].sort();

  select.innerHTML = `<option value="all">All regions</option>` +
    regions.map(region => `<option value="${safeAttr(region)}">${safe(region)}</option>`).join("");
}

function renderKpis(rows) {
  const trips = rows.length;
  const anglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  const fpa = fish / Math.max(anglers, 1);

  setText("rankTrips", format(trips));
  setText("rankAnglers", format(anglers));
  setText("rankFish", format(fish));
  setText("rankFpa", fpa.toFixed(2));
}

function renderRankings() {
  const head = document.getElementById("rankingHead");
  const body = document.getElementById("rankingBody");

  if (!head || !body) return;

  const search = clean(document.getElementById("rankSearch")?.value).toLowerCase();
  const region = document.getElementById("rankRegion")?.value || "all";

  const source = currentView === "boats" ? boatRows : landingRows;

  filteredRows = source.filter(row => {
    const matchesRegion = region === "all" || row.region === region;
    const searchTarget = [
      row.name,
      row.landing,
      row.region,
      row.tripType
    ].join(" ").toLowerCase();

    const matchesSearch = !search || searchTarget.includes(search);

    return matchesRegion && matchesSearch;
  });

  if (currentView === "boats") {
    renderBoatTable(head, body, filteredRows);
  } else {
    renderLandingTable(head, body, filteredRows);
  }
}

function renderBoatTable(head, body, rows) {
  head.innerHTML = `
    <tr>
      <th>#</th>
      <th>Boat</th>
      <th>Region</th>
      <th>Trip Type</th>
      <th>Trips</th>
      <th>Anglers</th>
      <th>Fish</th>
      <th>FPA</th>
    </tr>
  `;

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="8">No boats found.</td></tr>`;
    return;
  }

  body.innerHTML = rows.slice(0, 100).map((row, index) => `
    <tr>
      <td>${rankDisplay(index + 1)}</td>
      <td>
        <a class="rank-name-link" href="/boat-detail.html?boat=${encodeURIComponent(row.name)}">
          <strong>${safe(row.name)}</strong>
          <span>${safe(row.landing || "Unknown Landing")}</span>
        </a>
      </td>
      <td>${safe(row.region)}</td>
      <td><span class="trip-pill">${safe(row.tripType || "Mixed")}</span></td>
      <td>${format(row.trips)}</td>
      <td>${format(row.anglers)}</td>
      <td>${format(row.fish)}</td>
      <td><span class="fpa-pill">${row.fpa.toFixed(2)}</span></td>
    </tr>
  `).join("");
}

function renderLandingTable(head, body, rows) {
  head.innerHTML = `
    <tr>
      <th>#</th>
      <th>Landing</th>
      <th>Region</th>
      <th>Trips</th>
      <th>Anglers</th>
      <th>Fish</th>
      <th>FPA</th>
    </tr>
  `;

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="7">No landings found.</td></tr>`;
    return;
  }

  body.innerHTML = rows.slice(0, 100).map((row, index) => `
    <tr>
      <td>${rankDisplay(index + 1)}</td>
      <td>
        <a class="rank-name-link" href="/landing-detail.html?landing=${encodeURIComponent(row.name)}">
          <strong>${safe(row.name)}</strong>
        </a>
      </td>
      <td>${safe(row.region)}</td>
      <td>${format(row.trips)}</td>
      <td>${format(row.anglers)}</td>
      <td>${format(row.fish)}</td>
      <td><span class="fpa-pill">${row.fpa.toFixed(2)}</span></td>
    </tr>
  `).join("");
}

function rankDisplay(rank) {
  if (rank === 1) return `<span class="rank-medal">🏆</span>`;
  return String(rank).padStart(2, "0");
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
  return String(value || "N/A")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeAttr(value) {
  return safe(value);
}
