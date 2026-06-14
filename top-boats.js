let dailyIndex = [];
let currentDateIndex = 0;
let reportYearCache = {};

document.addEventListener("DOMContentLoaded", loadTopBoatsIndex);

async function loadTopBoatsIndex() {
  const container = document.getElementById("topBoatsPage");

  try {
    container.innerHTML = "<h2>Loading available report dates...</h2>";

    const response = await fetch(socalBiteDataUrl("daily-report-index.json"));

    if (!response.ok) {
      throw new Error("Could not load daily-report-index.json");
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = "<h2>No report dates found.</h2>";
      return;
    }

    dailyIndex = data;
    currentDateIndex = 0;

    buildDateDropdown();
    loadTopBoatsDate(dailyIndex[currentDateIndex].date);

  } catch (error) {
    console.error("Top boats index load error:", error);
    container.innerHTML = "<h2>Could not load top boats data.</h2>";
  }
}

function buildDateDropdown() {
  const select = document.getElementById("dateSelect");
  const prevBtn = document.getElementById("prevDay");
  const nextBtn = document.getElementById("nextDay");

  if (!select || !prevBtn || !nextBtn) return;

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
    if (currentDateIndex < 0) currentDateIndex = 0;

    loadTopBoatsDate(dailyIndex[currentDateIndex].date);
    updateNavButtons();
  };

  prevBtn.onclick = () => {
    if (currentDateIndex < dailyIndex.length - 1) {
      currentDateIndex++;
      select.value = dailyIndex[currentDateIndex].date;
      loadTopBoatsDate(select.value);
      updateNavButtons();
    }
  };

  nextBtn.onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = dailyIndex[currentDateIndex].date;
      loadTopBoatsDate(select.value);
      updateNavButtons();
    }
  };

  updateNavButtons();
}

function updateNavButtons() {
  const prevBtn = document.getElementById("prevDay");
  const nextBtn = document.getElementById("nextDay");

  if (prevBtn) {
    prevBtn.disabled = currentDateIndex >= dailyIndex.length - 1;
  }

  if (nextBtn) {
    nextBtn.disabled = currentDateIndex <= 0;
  }
}

async function fetchReportYear(year) {
  if (reportYearCache[year]) {
    return reportYearCache[year];
  }

  const filePath = `reports/reports-${year}.json`;
  const response = await fetch(socalBiteDataUrl(filePath));

  if (!response.ok) {
    throw new Error("Could not load " + filePath);
  }

  const rows = await response.json();
  reportYearCache[year] = Array.isArray(rows) ? rows : [];

  return reportYearCache[year];
}

async function loadTopBoatsDate(date) {
  const container = document.getElementById("topBoatsPage");

  try {
    container.innerHTML = `<h2>Loading top boats for ${formatDisplayDate(date)}...</h2>`;

    const year = String(date).substring(0, 4);
    const yearRows = await fetchReportYear(year);

    const rows = yearRows.filter(row => {
      return String(row.trip_date || "") === String(date);
    });

    renderTopBoats(date, rows);

  } catch (error) {
    console.error("Top boats date load error:", error);
    container.innerHTML =
      `<h2>Could not load top boats for ${formatDisplayDate(date)}.</h2>`;
  }
}

function renderTopBoats(date, rows) {
  const container = document.getElementById("topBoatsPage");

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML =
      `<h2>No top boat data found for ${formatDisplayDate(date)}.</h2>`;
    return;
  }

  const boats = rows
    .filter(row => row.boat && Number(row.anglers || 0) >= 5)
    .map(row => {
      const anglers = Number(row.anglers || 0);
      const totalFish = Number(row.total_fish || 0);

      return {
        boat: row.boat || "Unknown Boat",
        landing: row.landing || "Unknown Landing",
        region: row.region || "Unknown Region",
        tripType: row.trip_type || "",
        anglers,
        totalFish,
        fpa: anglers > 0 ? totalFish / anglers : 0,
        fishCounts: row.fish_counts || ""
      };
    });

  const grouped = {};

  boats.forEach(boat => {
    if (!grouped[boat.region]) {
      grouped[boat.region] = [];
    }

    grouped[boat.region].push(boat);
  });

  container.innerHTML = `
    <section class="region-section">
      <h2>Top Boats - ${formatDisplayDate(date)}</h2>
      <p class="updated">Ranked by FPA</p>
    </section>

    ${Object.keys(grouped).sort().map(region => {
      const regionBoats = grouped[region]
        .sort((a, b) =>
          b.fpa - a.fpa ||
          b.totalFish - a.totalFish
        )
        .slice(0, 10);

      return `
        <section class="region-section">
          <h2>${safe(region)}</h2>

          ${regionBoats.map((boat, index) => `
            <div class="boat-row">
              <div>
                <strong>#${index + 1} ${safe(boat.boat)}</strong>
                <p>${safe(boat.landing)} • ${safe(boat.tripType)}</p>
              </div>

              <div>
                <strong>${boat.fpa.toFixed(2)} FPA</strong>
                <p>${numberFormat(boat.totalFish)} Fish • ${numberFormat(boat.anglers)} Anglers</p>
                <p>${safe(boat.fishCounts || "No fish counts listed")}</p>
              </div>
            </div>
          `).join("")}
        </section>
      `;
    }).join("")}
  `;
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

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
