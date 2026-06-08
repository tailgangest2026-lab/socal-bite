document.addEventListener("DOMContentLoaded", loadBoatDetail);

async function loadBoatDetail() {
  const boatInfo = document.getElementById("boatInfo");
  const params = new URLSearchParams(window.location.search);
  const boatName = params.get("boat");

  if (!boatName) {
    boatInfo.innerHTML = '<div class="loading-card">No boat selected.</div>';
    return;
  }

  try {
    const indexRes = await fetch(socalBiteDataUrl("daily-report-index.json"));
    const dailyIndex = indexRes.ok ? await indexRes.json() : [];

    updateSeo(boatName);

    const recentRows = await loadRecentBoatReports(dailyIndex, boatName);

    renderBoatInfo(boatName, recentRows);
    renderTopSpecies(recentRows);
    renderRecentReports(recentRows);

  } catch (err) {
    console.error("Boat detail error:", err);
    boatInfo.innerHTML = '<div class="loading-card">Boat detail not available.</div>';
  }
}

async function loadRecentBoatReports(dailyIndex, boatName) {
  const recentReports = Array.isArray(dailyIndex) ? dailyIndex.slice(0, 30) : [];
  const allRows = [];

  for (const report of recentReports) {
    const filePath = report.file || `reports/daily-report-${report.date}.json`;

    try {
      const response = await fetch(socalBiteDataUrl(filePath));
      if (!response.ok) continue;

      const rows = await response.json();
      if (!Array.isArray(rows)) continue;

      rows.forEach(row => {
        if (normalize(row.boat) === normalize(boatName)) {
          allRows.push(row);
        }
      });
    } catch (err) {
      console.warn("Skipped report:", filePath, err);
    }
  }

  return allRows;
}

function renderBoatInfo(boatName, rows) {
  const container = document.getElementById("boatInfo");

  const totalTrips = rows.length;
  const totalAnglers = rows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const totalFish = rows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);
  const fpa = totalAnglers ? totalFish / totalAnglers : 0;

  const landings = [...new Set(rows.map(row => row.landing).filter(Boolean))];
  const tripTypes = [...new Set(rows.map(row => row.trip_type).filter(Boolean))];

  container.innerHTML = `
    <article class="region-card landing-card">

      <div class="landing-card-top">
        <h2>${escapeHtml(boatName)}</h2>
        <p>${landings.length ? landings.map(escapeHtml).join(", ") : "Southern California Sportfishing Boat"}</p>
      </div>

      <div class="landing-stats">
        <div><strong>${number(totalTrips)}</strong><span>Trips</span></div>
        <div><strong>${number(totalAnglers)}</strong><span>Anglers</span></div>
        <div><strong>${number(totalFish)}</strong><span>Fish</span></div>
        <div><strong>${fpa.toFixed(2)}</strong><span>FPA</span></div>
      </div>

      <div class="landing-info">
        ${
          landings.length
            ? `<p><i class="fa-solid fa-anchor"></i> Landing: ${landings.map(landing => `
                <a href="landing-detail.html?landing=${encodeURIComponent(landing)}">${escapeHtml(landing)}</a>
              `).join(", ")}</p>`
            : ""
        }

        ${
          tripTypes.length
            ? `<p><i class="fa-solid fa-ship"></i> Trip Types: ${escapeHtml(tripTypes.join(", "))}</p>`
            : ""
        }
      </div>

    </article>
  `;
}

function renderTopSpecies(rows) {
  const container = document.getElementById("topSpecies");
  const speciesTotals = {};

  rows.forEach(row => {
    parseFishCounts(row.fish_counts).forEach(item => {
      speciesTotals[item.species] = (speciesTotals[item.species] || 0) + item.count;
    });
  });

  const topSpecies = Object.entries(speciesTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!topSpecies.length) {
    container.innerHTML = '<div class="loading-card">No species data found.</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Species</th>
            <th>Fish</th>
          </tr>
        </thead>
        <tbody>
          ${topSpecies.map(([species, count]) => `
            <tr>
              <td>
                <a href="species-detail.html?species=${encodeURIComponent(species)}">
                  ${escapeHtml(species)}
                </a>
              </td>
              <td>${number(count)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}
function renderRecentReports(rows) {
  const container = document.getElementById("recentReports");

  const recent = rows.slice(0, 30);

  if (!recent.length) {
    container.innerHTML = '<div class="loading-card">No recent fish reports found for this boat.</div>';
    return;
  }

  const groupedByDate = {};

  recent.forEach(row => {
    const date = row.trip_date || "Unknown Date";

    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }

    groupedByDate[date].push(row);
  });

  container.innerHTML = Object.keys(groupedByDate).map(date => {
    const dayRows = groupedByDate[date];

    const totalTrips = dayRows.length;
    const totalAnglers = dayRows.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
    const totalFish = dayRows.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);

    return `
      <section class="daily-report-card">
        <h2>Daily Fishing Report - ${escapeHtml(formatDate(date))}</h2>

        <p class="report-summary">
          <strong>${number(totalTrips)}</strong> Trips
          <span>•</span>
          <strong>${number(totalAnglers)}</strong> Anglers
          <span>•</span>
          <strong>${number(totalFish)}</strong> Fish
        </p>

        ${dayRows.map(row => `
          <div class="daily-boat-row">
            <div>
              <h3>${escapeHtml(row.boat || "Unknown Boat")}</h3>
              <p>${escapeHtml(row.landing || "")}</p>
              <p>${escapeHtml(row.trip_type || "")} • ${number(row.anglers)} Anglers</p>
            </div>

            <div>
              <strong>${number(row.total_fish)} Fish</strong>
              <p>${escapeHtml(row.fish_counts || "No fish count listed")}</p>
            </div>
          </div>
        `).join("")}
      </section>
    `;
  }).join("");
}

function parseFishCounts(fishCounts) {
  if (!fishCounts) return [];

  return String(fishCounts)
    .split(",")
    .map(item => {
      const match = item.trim().match(/^([\d.]+)\s+(.+)$/);
      if (!match) return null;

      const species = match[2]
        .replace(/\bReleased\b/gi, "")
        .replace(/\bRelease\b/gi, "")
        .replace(/\bKept\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        count: Number(match[1]),
        species
      };
    })
    .filter(Boolean);
}

function updateSeo(boatName) {
  const title = `${boatName} Fishing Report | SoCal Bite`;
  const description = `${boatName} sportfishing report with top species, recent trips, fish counts, landings, and fish-per-angler performance.`;
  const url = `https://thesocalbite.com/boat-detail.html?boat=${encodeURIComponent(boatName)}`;

  document.title = title;

  const boatTitle = document.getElementById("boatTitle");
  const pageTitle = document.getElementById("pageTitle");
  const metaDescription = document.getElementById("metaDescription");
  const canonicalLink = document.getElementById("canonicalLink");
  const ogTitle = document.getElementById("ogTitle");
  const ogDescription = document.getElementById("ogDescription");
  const ogUrl = document.getElementById("ogUrl");

  if (boatTitle) boatTitle.textContent = `${boatName} Fishing Report`;
  if (pageTitle) pageTitle.textContent = title;
  if (metaDescription) metaDescription.setAttribute("content", description);
  if (canonicalLink) canonicalLink.setAttribute("href", url);
  if (ogTitle) ogTitle.setAttribute("content", title);
  if (ogDescription) ogDescription.setAttribute("content", description);
  if (ogUrl) ogUrl.setAttribute("content", url);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
