document.addEventListener("DOMContentLoaded", initSpeciesReports);

let allSpeciesRows = [];
let reportYearCache = {};

async function initSpeciesReports() {
  const container = document.getElementById("speciesGrid");
  if (!container) return;

  try {
    container.innerHTML = `<div class="loading-card">Loading species analytics...</div>`;

    allSpeciesRows = await loadSpeciesRows();

    setupDefaultCustomDates();
    buildSpeciesRegionFilter(allSpeciesRows);
    bindSpeciesControls();
    renderFilteredSpecies();
  } catch (error) {
    console.error("Species report load error:", error);
    container.innerHTML = `<div class="empty-card">Could not load species reports.</div>`;
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(url + sep + "v=" + Date.now());

  if (!response.ok) {
    throw new Error(`Could not load ${path}`);
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

async function loadSpeciesRows() {
  const index = await fetchJson("daily-report-index.json");

  if (!Array.isArray(index) || !index.length) {
    return [];
  }

  const recentDates = new Set(
    index
      .slice(0, 90)
      .map(report => String(report.date || "").split("T")[0])
      .filter(Boolean)
  );

  const years = [
    ...new Set([...recentDates].map(date => date.substring(0, 4)))
  ];

  const allRows = [];

  for (const year of years) {
    try {
      const yearRows = await fetchReportYear(year);

      allRows.push(
        ...yearRows
          .filter(row => recentDates.has(String(row.trip_date || "")))
          .map(row => ({
            ...row,
            report_date: row.trip_date
          }))
      );
    } catch (error) {
      console.warn("Skipped yearly report:", year, error);
    }
  }

  return allRows;
}

function bindSpeciesControls() {
  const dateRangeSelect = document.getElementById("speciesDateRange");
  const customDateRange = document.getElementById("speciesCustomDateRange");

  dateRangeSelect?.addEventListener("change", () => {
    if (customDateRange) {
      customDateRange.classList.toggle("hidden", dateRangeSelect.value !== "custom");
    }

    renderFilteredSpecies();
  });

  document.getElementById("speciesStartDate")?.addEventListener("change", () => {
    if (dateRangeSelect) dateRangeSelect.value = "custom";
    if (customDateRange) customDateRange.classList.remove("hidden");
    renderFilteredSpecies();
  });

  document.getElementById("speciesEndDate")?.addEventListener("change", () => {
    if (dateRangeSelect) dateRangeSelect.value = "custom";
    if (customDateRange) customDateRange.classList.remove("hidden");
    renderFilteredSpecies();
  });

  document.getElementById("speciesRegion")?.addEventListener("change", renderFilteredSpecies);
}

function renderFilteredSpecies() {
  const container = document.getElementById("speciesGrid");
  if (!container) return;

  const dateRows = filterRowsByDateRange(allSpeciesRows);
  const region = document.getElementById("speciesRegion")?.value || "all";

  const filteredRows = dateRows.filter(row => {
    return region === "all" || clean(row.region) === region;
  });

  const speciesData = buildSpeciesSummary(filteredRows);
  renderSpeciesCards(speciesData);
}

function filterRowsByDateRange(rows) {
  const range = getSpeciesDateFilter();

  if (!range.start || !range.end) {
    return rows;
  }

  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T23:59:59`);

  return rows.filter(row => {
    const rowDateString = getRowDate(row);
    if (!rowDateString) return false;

    const rowDate = new Date(`${rowDateString}T12:00:00`);

    return rowDate >= start && rowDate <= end;
  });
}

function buildSpeciesRegionFilter(rows) {
  const select = document.getElementById("speciesRegion");
  if (!select) return;

  const regions = [...new Set(rows.map(row => clean(row.region)).filter(Boolean))].sort();

  select.innerHTML =
    `<option value="all">All regions</option>` +
    regions.map(region => `
      <option value="${safeAttr(region)}">${safe(region)}</option>
    `).join("");
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
    container.innerHTML = `<div class="empty-card">No species data found for this selection.</div>`;
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

function getSpeciesDateFilter() {
  const option = document.getElementById("speciesDateRange")?.value || "month";
  const today = new Date();

  switch (option) {
    case "today": {
      return {
        start: formatDate(today),
        end: formatDate(today)
      };
    }

    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);

      return {
        start: formatDate(y),
        end: formatDate(y)
      };
    }

    case "week": {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());

      return {
        start: formatDate(weekStart),
        end: formatDate(today)
      };
    }

    case "month": {
      return {
        start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: formatDate(today)
      };
    }

    case "prevMonth": {
      return {
        start: formatDate(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        end: formatDate(new Date(today.getFullYear(), today.getMonth(), 0))
      };
    }

    case "custom": {
      return {
        start: document.getElementById("speciesStartDate")?.value || "",
        end: document.getElementById("speciesEndDate")?.value || ""
      };
    }

    default: {
      return {
        start: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
        end: formatDate(today)
      };
    }
  }
}

function setupDefaultCustomDates() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const startInput = document.getElementById("speciesStartDate");
  const endInput = document.getElementById("speciesEndDate");

  if (startInput && !startInput.value) startInput.value = formatDate(monthStart);
  if (endInput && !endInput.value) endInput.value = formatDate(today);
}

function getRowDate(row) {
  const possibleDate =
    row.report_date ||
    row.date ||
    row.trip_date ||
    row.tripDate ||
    row.TripDate ||
    row["Trip Date"] ||
    "";

  return normalizeDateString(possibleDate);
}

function normalizeDateString(value) {
  if (!value) return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDate(value);
  }

  const text = String(value).trim();

  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const compactMatch = text.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (compactMatch) return `${compactMatch[1]}-${compactMatch[2]}-${compactMatch[3]}`;

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return formatDate(parsed);
  }

  return "";
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function safeAttr(value) {
  return safe(value);
}
