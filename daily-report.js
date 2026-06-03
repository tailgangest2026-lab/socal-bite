fetch("daily-report-index.json")
fetch(`daily-report-${date}.json`)

let dailyIndex = [];
let currentDateIndex = 0;

document.addEventListener("DOMContentLoaded", loadDailyReportIndex);

function loadDailyReportIndex() {
  const container = document.getElementById("dailyReport");
  container.innerHTML = "<h2>Loading available report dates...</h2>";

  loadJsonp(
    DAILY_BASE_URL + "?page=daily-report-index",
    "handleDailyReportIndex"
  );
}

window.handleDailyReportIndex = function(data) {
  const container = document.getElementById("dailyReport");

  if (!Array.isArray(data) || !data.length) {
    container.innerHTML = "<h2>No daily report dates found.</h2>";
    return;
  }

  dailyIndex = data;

  buildDateDropdown();

  currentDateIndex = 0;
  loadDailyReportDate(dailyIndex[0].date);
};

function buildDateDropdown() {
  const select = document.getElementById("dateSelect");
  const prevBtn = document.getElementById("prevDay");
  const nextBtn = document.getElementById("nextDay");

  select.innerHTML = "";

  dailyIndex.forEach(item => {
    const option = document.createElement("option");
    option.value = item.date;
    option.textContent = formatDisplayDate(item.date);
    select.appendChild(option);
  });

  select.value = dailyIndex[currentDateIndex].date;

  select.onchange = e => {
    currentDateIndex = dailyIndex.findIndex(x => x.date === e.target.value);
    loadDailyReportDate(e.target.value);
    updateNavButtons();
  };

  prevBtn.onclick = () => {
    if (currentDateIndex < dailyIndex.length - 1) {
      currentDateIndex++;
      select.value = dailyIndex[currentDateIndex].date;
      loadDailyReportDate(select.value);
      updateNavButtons();
    }
  };

  nextBtn.onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = dailyIndex[currentDateIndex].date;
      loadDailyReportDate(select.value);
      updateNavButtons();
    }
  };

  updateNavButtons();
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prevDay");
  const nextBtn = document.getElementById("nextDay");

  prevBtn.disabled = currentDateIndex >= dailyIndex.length - 1;
  nextBtn.disabled = currentDateIndex <= 0;
}

function loadDailyReportDate(date) {
  const container = document.getElementById("dailyReport");

  container.innerHTML = `<h2>Loading report for ${formatDisplayDate(date)}...</h2>`;

  window.handleDailyReportDate = function(data) {
    renderDailyReport(date, data);
  };

  loadJsonp(
    DAILY_BASE_URL + "?page=daily-report-date&date=" + encodeURIComponent(date),
    "handleDailyReportDate"
  );
}

function renderDailyReport(date, rows) {
  const container = document.getElementById("dailyReport");

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML = `<h2>No report data found for ${formatDisplayDate(date)}.</h2>`;
    return;
  }

  const grouped = groupDailyRows(rows);
  const totals = getTotals(rows);

  container.innerHTML = `
    <section class="region-section">
      <h2>Daily Fishing Report - ${formatDisplayDate(date)}</h2>

      <div class="summary-row">
        <span>${numberFormat(totals.trips)} Trips</span>
        <span>${numberFormat(totals.anglers)} Anglers</span>
        <span>${numberFormat(totals.fish)} Fish</span>
      </div>
    </section>

    ${Object.keys(grouped).sort().map(region => `
      <section class="region-section">
        <h2>${region}</h2>

        ${Object.keys(grouped[region]).sort().map(landing => {
          const boats = grouped[region][landing];

          const landingTotals = getTotals(boats);

          return `
            <div class="landing-card">
              <h3>${landing}</h3>

              <p class="daily-landing-summary">
                ${numberFormat(landingTotals.trips)} Trips •
                ${numberFormat(landingTotals.anglers)} Anglers •
                ${numberFormat(landingTotals.fish)} Fish
              </p>

              ${boats
                .sort((a, b) =>
                  String(a.boat || "").localeCompare(String(b.boat || ""))
                )
                .map(boat => `
                  <div class="boat-row">
                    <div>
                      <strong>${boat.boat || "Unknown Boat"}</strong>
                      <p>${boat.trip_type || "Trip"} • ${numberFormat(boat.anglers)} Anglers</p>
                    </div>

                    <div>
                      <strong>${numberFormat(boat.total_fish)} Fish</strong>
                      <p>${boat.fish_counts || "No fish counts listed"}</p>
                    </div>
                  </div>
                `).join("")}
            </div>
          `;
        }).join("")}
      </section>
    `).join("")}
  `;
}

function groupDailyRows(rows) {
  const grouped = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";
    const landing = row.landing || "Unknown Landing";

    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][landing]) grouped[region][landing] = [];

    grouped[region][landing].push(row);
  });

  return grouped;
}

function getTotals(rows) {
  return rows.reduce(
    (totals, row) => {
      totals.trips += 1;
      totals.anglers += Number(row.anglers || 0);
      totals.fish += Number(row.total_fish || 0);
      return totals;
    },
    {
      trips: 0,
      anglers: 0,
      fish: 0
    }
  );
}

function loadJsonp(url, callbackName) {
  const oldScript = document.getElementById(callbackName + "Script");

  if (oldScript) {
    oldScript.remove();
  }

  const script = document.createElement("script");
  script.id = callbackName + "Script";
  script.src = url + "&callback=" + callbackName + "&v=" + Date.now();

  script.onerror = function(e) {
    console.error("JSONP load failed:", e);
    document.getElementById("dailyReport").innerHTML =
      "<h2>Could not load fishing report data.</h2>";
  };

  document.body.appendChild(script);
}

function formatDisplayDate(dateString) {
  const parts = String(dateString).split("-");

  if (parts.length !== 3) return dateString;

  const date = new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}
