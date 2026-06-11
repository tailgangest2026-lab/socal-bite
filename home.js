document.addEventListener("DOMContentLoaded", initHome);

async function initHome() {
  setText("year", new Date().getFullYear());

  const dateEl = document.getElementById("todayDate");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  try {
    const homeData = await fetchJson("home.json");

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
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
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
  if (!value) return "N/A";

  return `<a class="data-link" href="/${page}?${param}=${encodeURIComponent(value)}">${safe(value)}</a>`;
}
