document.addEventListener("DOMContentLoaded", initReports);

let reportIndex = [];
let currentRegion = "All";
let currentRows = [];
let reportYearCache = {};

async function initReports() {
  try {
    reportIndex = await fetchJson("../daily-report-index.json");

    if (!Array.isArray(reportIndex) || !reportIndex.length) {
      showDateListMessage("No report dates found.");
      return;
    }

    buildRegionTabs();
    buildDateList();

    const urlDate = getParam("date");
    const selectedReport =
      reportIndex.find(report => report.date === urlDate) || reportIndex[0];

    loadReport(selectedReport);
  } catch (error) {
    console.error("Daily report load error:", error);
    showDateListMessage("Could not load daily reports.");
  }
}

function updateReportSeo(date) {
  if (!date) return;

  document.title =
    `Southern California Fishing Report - ${date} | The SoCal Bite`;

  let canonical = document.getElementById("canonical-link");

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.id = "canonical-link";
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }

  canonical.href =
    `${window.location.origin}/daily-report/?date=${encodeURIComponent(date)}`;

  const description = document.querySelector('meta[name="description"]');

  if (description) {
    description.content =
      `Southern California fishing report for ${date}. Fish counts, boats, landings, anglers, trip types and species caught across Southern California.`;
  }

  const ogUrl = document.querySelector('meta[property="og:url"]');

  if (ogUrl) {
    ogUrl.content = canonical.href;
  }
}

async function fetchJson(path) {
  const url =
    typeof socalBiteDataUrl === "function"
      ? socalBiteDataUrl(path)
      : path;

  const sep = url.includes("?") ? "&" : "?";
  const response = await fetch(url + sep + "v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

async function getYearRowsForDate(date) {
  const year = String(date).substring(0, 4);
  const filePath = `../reports/reports-${year}.json`;

  if (!reportYearCache[year]) {
    const rows = await fetchJson(filePath);
    reportYearCache[year] = Array.isArray(rows) ? rows : [];
  }

  return reportYearCache[year].filter(row => {
    return String(row.trip_date || "") === String(date);
  });
}

function buildRegionTabs() {
  const tabs = document.getElementById("reportRegionTabs");
  if (!tabs) return;

  const regions = [
    "All",
    "Alameda County",
    "Central California",
    "Los Angeles",
    "Marin County",
    "Monterey County",
    "Orange County",
    "San Diego",
    "San Francisco Bay",
    "San Mateo",
    "Santa Barbara",
    "Santa Cruz",
    "Ventura County"
  ];

  tabs.innerHTML = regions.map(region => `
    <button
      type="button"
      class="${region === currentRegion ? "active" : ""}"
      data-region="${safeAttr(region)}"
    >
      ${safe(region)}
    </button>
  `).join("");

  tabs.querySelectorAll("button").forEach(button => {
    button.addEventListener("click", () => {
      currentRegion = button.dataset.region || "All";
      buildRegionTabs();
      renderReportRows(currentRows);
    });
  });
}

function buildDateList() {
  const select = document.getElementById("reportDateSelect");
  if (!select) return;

  const urlDate = getParam("date");

  select.innerHTML = reportIndex.map((report, index) => {
    const label = formatDisplayDate(report.date);
    const isSelected =
      report.date === urlDate || (!urlDate && index === 0);

    return `
      <option
        value="${safeAttr(report.date)}"
        ${isSelected ? "selected" : ""}
      >
        ${safe(label)} — ${safe(report.date)}
      </option>
    `;
  }).join("");

  select.addEventListener("change", () => {
    const date = select.value;
    const report = reportIndex.find(item => item.date === date);

    if (report) {
      const newUrl =
        `${window.location.pathname}?date=${encodeURIComponent(report.date)}`;

      window.history.pushState({}, "", newUrl);
      loadReport(report);
    }
  });
}

async function loadReport(report) {
  try {
    updateReportSeo(report.date);

    currentRows = await getYearRowsForDate(report.date);

    setText("selectedReportTitle", formatDisplayDate(report.date));
    setText("selectedReportMeta", report.date);

    renderReportRows(currentRows);
  } catch (error) {
    console.error("Report file load error:", error);
    currentRows = [];

    setText("selectedReportTitle", formatDisplayDate(report.date || ""));
    setText("selectedReportMeta", report.date || "");

    renderReportRows([]);
  }
}

function renderReportRows(rows) {
  const tbody = document.getElementById("reportRows");
  if (!tbody) return;

  let filtered = rows;

  if (currentRegion !== "All") {
    filtered = rows.filter(row => clean(row.region) === currentRegion);
  }

  const trips = filtered.length;
  const anglers = filtered.reduce((sum, row) => sum + Number(row.anglers || 0), 0);
  const fish = filtered.reduce((sum, row) => sum + Number(row.total_fish || 0), 0);

  setText("reportTrips", format(trips));
  setText("reportAnglers", format(anglers));
  setText("reportFish", format(fish));

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7">No trips found for this region/date.</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(row => `
    <tr>
      <td>
        <a class="data-link" href="/boat-detail/?boat=${encodeURIComponent(row.boat || "")}">
          ${safe(row.boat || "Unknown Boat")}
        </a>
      </td>

      <td>
        <a class="data-link" href="/landing-detail/?landing=${encodeURIComponent(row.landing || "")}">
          ${safe(row.landing || "Unknown Landing")}
        </a>
      </td>

      <td>${safe(row.region)}</td>

      <td>
        <span class="trip-pill">${safe(row.trip_type || "Trip")}</span>
      </td>

      <td>${format(row.anglers)}</td>

      <td>${format(row.total_fish)}</td>

      <td class="fish-count-cell">
        ${renderFishCounts(row.fish_counts)}
      </td>
    </tr>
  `).join("");
}

function renderFishCounts(fishCounts) {
  if (!fishCounts) return "N/A";

  return String(fishCounts)
    .split(",")
    .map(part => {
      const text = part.trim();
      const species = text.replace(/^[\d,]+\s+/, "");

      return `
        <a class="fish-count-pill" href="/species-detail/?species=${encodeURIComponent(species)}">
          ${safe(text)}
        </a>
      `;
    })
    .join("");
}

function showDateListMessage(message) {
  const container = document.getElementById("reportDateList");

  if (container) {
    container.innerHTML = `<div class="empty-card">${safe(message)}</div>`;
  }
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

  if (el) {
    el.textContent = value;
  }
}

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeAttr(value) {
  return safe(value);
}
