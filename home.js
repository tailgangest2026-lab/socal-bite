document.addEventListener("DOMContentLoaded", initHome);

async function initHome() {
  setDate();
  setYear();

  try {
    const homeData = await fetchJson("home.json");

    buildKpis(homeData);
    buildRegionBoard(homeData);
    buildForecastPreview(homeData);
  } catch (error) {
    console.error("Home data error:", error);
  }

  try {
    const topBoats = await fetchJson("top-boats.json");
    buildTopBoats(topBoats);
  } catch (error) {
    console.error("Top boats error:", error);
    showEmpty("topBoatsList", "Top boat rankings unavailable.");
  }

  try {
    const topLandings = await fetchJson("top-landings.json");
    buildTopLandings(topLandings);
  } catch (error) {
    console.error("Top landings error:", error);
    showEmpty("topLandingsList", "Landing rankings unavailable.");
  }
}

async function fetchJson(path) {
  const url =
    typeof socalBiteDataUrl === "function"
      ? socalBiteDataUrl(path)
      : path;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
  }

  return response.json();
}

function setDate() {
  const todayDate = document.getElementById("todayDate");

  if (!todayDate) return;

  todayDate.textContent = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

function setYear() {
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
}

function buildKpis(data) {
  const rows = getRows(data);

  const trips = rows.length;
  const anglers = sumField(rows, ["anglers", "Anglers"]);
  const fish = sumField(rows, ["total_fish", "totalFish", "Total Fish", "fish"]);

  setText("kpiTrips", formatNumber(trips));
  setText("kpiAnglers", formatNumber(anglers));
  setText("kpiFish", formatNumber(fish));
}

function buildRegionBoard(data) {
  const container = document.getElementById("regionBoard");
  if (!container) return;

  const rows = getRows(data);

  if (!rows.length) {
    container.innerHTML = `<div class="empty-card">No regional data available.</div>`;
    return;
  }

  const regions = groupBy(rows, row => clean(row.region || row.Region || "Unknown"));

  const cards = Object.entries(regions)
    .map(([region, regionRows]) => {
      const trips = regionRows.length;
      const anglers = sumField(regionRows, ["anglers", "Anglers"]);
      const fish = sumField(regionRows, ["total_fish", "totalFish", "Total Fish", "fish"]);
      const topBoat = topValue(regionRows, ["boat", "Boat"]);
      const topLanding = topValue(regionRows, ["landing", "Landing"]);
      const topSpecies = getTopSpecies(regionRows);

      return `
        <article class="region-card">
          <div class="region-top">
            <span>${escapeHtml(region)}</span>
            <strong>${formatNumber(fish)}</strong>
          </div>

          <div class="region-stat-row">
            <div>
              <small>Trips</small>
              <b>${formatNumber(trips)}</b>
            </div>
            <div>
              <small>Anglers</small>
              <b>${formatNumber(anglers)}</b>
            </div>
          </div>

          <div class="region-details">
            <p><span>Top Boat</span>${escapeHtml(topBoat)}</p>
            <p><span>Landing</span>${escapeHtml(topLanding)}</p>
            <p><span>Hot Species</span>${escapeHtml(topSpecies)}</p>
          </div>
        </article>
      `;
    })
    .join("");

  container.innerHTML = cards;
}

function buildTopBoats(data) {
  const container = document.getElementById("topBoatsList");
  if (!container) return;

  const rows = getRows(data).slice(0, 6);

  if (!rows.length) {
    showEmpty("topBoatsList", "Top boat rankings unavailable.");
    return;
  }

  container.innerHTML = rows
    .map((row, index) => {
      const boat = clean(row.boat || row.Boat || row.name || row.Name || "Unknown Boat");
      const landing = clean(row.landing || row.Landing || row.region || row.Region || "");
      const fpa = numberValue(row.fish_per_angler || row.fpa || row.FPA || row["Fish Per Angler"]);
      const fish = numberValue(row.total_fish || row.totalFish || row["Total Fish"]);

      return rankingItem(index + 1, boat, landing, fpa ? `${fpa.toFixed(2)} FPA` : `${formatNumber(fish)} fish`);
    })
    .join("");
}

function buildTopLandings(data) {
  const container = document.getElementById("topLandingsList");
  if (!container) return;

  const rows = getRows(data).slice(0, 6);

  if (!rows.length) {
    showEmpty("topLandingsList", "Landing rankings unavailable.");
    return;
  }

  container.innerHTML = rows
    .map((row, index) => {
      const landing = clean(row.landing || row.Landing || row.name || row.Name || "Unknown Landing");
      const region = clean(row.region || row.Region || "");
      const fish = numberValue(row.total_fish || row.totalFish || row["Total Fish"] || row.fish);

      return rankingItem(index + 1, landing, region, `${formatNumber(fish)} fish`);
    })
    .join("");
}

function buildForecastPreview(data) {
  const container = document.getElementById("forecastPreview");
  if (!container) return;

  const rows = getRows(data);

  const regions = Object.keys(groupBy(rows, row => clean(row.region || row.Region || "Unknown"))).slice(0, 4);

  if (!regions.length) {
    container.innerHTML = `
      <article class="forecast-card">
        <span>Forecast</span>
        <strong>Coming Soon</strong>
        <p>Open the forecast page for full regional scoring.</p>
      </article>
    `;
    return;
  }

  container.innerHTML = regions
    .map((region, index) => {
      const score = Math.max(68, 94 - index * 6);

      return `
        <article class="forecast-card">
          <span>${escapeHtml(region)}</span>
          <strong>${score}</strong>
          <p>${score >= 85 ? "Strong bite potential" : score >= 75 ? "Good conditions" : "Fair bite window"}</p>
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
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(subtitle || "Southern California")}</span>
      </div>
      <b>${escapeHtml(value)}</b>
    </div>
  `;
}

function getRows(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data.rows)) return data.rows;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.reports)) return data.reports;
  if (Array.isArray(data.today)) return data.today;
  if (Array.isArray(data.daily)) return data.daily;
  if (Array.isArray(data.items)) return data.items;

  if (data && typeof data === "object") {
    const firstArray = Object.values(data).find(value => Array.isArray(value));
    return firstArray || [];
  }

  return [];
}

function sumField(rows, keys) {
  return rows.reduce((sum, row) => {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && row[key] !== "") {
        return sum + numberValue(row[key]);
      }
    }

    return sum;
  }, 0);
}

function numberValue(value) {
  if (typeof value === "number") return value;

  const parsed = Number(String(value || "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function clean(value) {
  return String(value || "").trim();
}

function groupBy(rows, getKey) {
  return rows.reduce((groups, row) => {
    const key = getKey(row) || "Unknown";

    if (!groups[key]) {
      groups[key] = [];
    }

    groups[key].push(row);
    return groups;
  }, {});
}

function topValue(rows, keys) {
  const counts = {};

  rows.forEach(row => {
    for (const key of keys) {
      const value = clean(row[key]);

      if (value) {
        counts[value] = (counts[value] || 0) + 1;
        break;
      }
    }
  });

  const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

  return winner ? winner[0] : "N/A";
}

function getTopSpecies(rows) {
  const speciesCounts = {};

  rows.forEach(row => {
    const fishCounts = clean(row.fish_counts || row.fishCounts || row["Fish Counts"]);

    if (!fishCounts) return;

    fishCounts.split(",").forEach(part => {
      const species = part.replace(/[0-9]/g, "").trim();

      if (species) {
        speciesCounts[species] = (speciesCounts[species] || 0) + 1;
      }
    });
  });

  const winner = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0];

  return winner ? winner[0] : "Mixed Bag";
}

function setText(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function formatNumber(value) {
  return numberValue(value).toLocaleString("en-US");
}

function showEmpty(id, message) {
  const element = document.getElementById(id);

  if (element) {
    element.innerHTML = `<div class="empty-card">${escapeHtml(message)}</div>`;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
