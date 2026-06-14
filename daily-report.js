document.addEventListener("DOMContentLoaded", initReports);

let reportIndex = [];
let currentRegion = "All";
let currentRows = [];
let reportYearCache = {};

async function initReports() {
  try {
    reportIndex = await fetchJson("daily-report-index.json");

    if (!Array.isArray(reportIndex) || !reportIndex.length) {
      showDateListMessage("No report dates found.");
      return;
    }

    buildRegionTabs();
    buildDateList();

    loadReport(reportIndex[0]);
  } catch (error) {
    console.error("Daily report load error:", error);
    showDateListMessage("Could not load daily reports.");
  }
}

async function fetchJson(path) {
  const url =
    typeof socalBiteDataUrl === "function"
      ? socalBiteDataUrl(path)
      : path;

  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) {
    throw new Error("Could not load " + path);
  }

  return response.json();
}

async function getYearRowsForDate(date) {
  const year = String(date).substring(0, 4);
  const filePath = `reports/reports-${year}.json`;

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
    "Los Angeles",
    "Orange County",
    "San Diego",
    "Ventura",
    "Santa Barbara",
    "San Luis Obispo"
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
  const container = document.getElementById("reportDateList");
  if (!container) return;

  container.innerHTML = reportIndex.map((report, index) => {
    const label = formatDisplayDate(report.date);

    return `
      <button
        class="report-date-card ${index === 0 ? "active" : ""}"
        type="button"
        data-date="${safeAttr(report.date)}"
      >
        <span class="report-date-icon">▣</span>
        <span>
          <strong>${safe(label)}</strong>
          <small>${safe(report.date)}</small>
        </span>
        <b>›</b>
      </button>
    `;
  }).join("");

  container.querySelectorAll(".report-date-card").forEach(button => {
    button.addEventListener("click", () => {
      container
        .querySelectorAll(".report-date-card")
        .forEach(btn => btn.classList.remove("active"));

      button.classList.add("active");

      const date = button.dataset.date;
      const report = reportIndex.find(item => item.date === date);

      if (report) {
        loadReport(report);
      }
    });
  });
}

async function loadReport(report) {
  try {
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
        <a class="data-link" href="/boat-detail.html?boat=${encodeURIComponent(row.boat || "")}">
          ${safe(row.boat || "Unknown Boat")}
        </a>
      </td>

      <td>
        <a class="data-link" href="/landing-detail.html?landing=${encodeURIComponent(row.landing || "")}">
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
        <a class="fish-count-pill" href="/species-detail.html?species=${encodeURIComponent(species)}">
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
