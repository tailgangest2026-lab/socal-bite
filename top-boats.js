let dailyIndex = [];
let currentDateIndex = 0;

document.addEventListener("DOMContentLoaded", loadTopBoatsIndex);

async function loadTopBoatsIndex() {
  const container = document.getElementById("topBoatsPage");

  try {
    container.innerHTML = "<h2>Loading available report dates...</h2>";

    const response = await fetch("daily-report-index.json?v=" + Date.now());

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
  document.getElementById("prevDay").disabled =
    currentDateIndex >= dailyIndex.length - 1;

  document.getElementById("nextDay").disabled =
    currentDateIndex <= 0;
}

async function loadTopBoatsDate(date) {
  const container = document.getElementById("topBoatsPage");

  try {
    container.innerHTML = `<h2>Loading top boats for ${formatDisplayDate(date)}...</h2>`;

    const reportInfo = dailyIndex.find(x => x.date === date);

    if (!reportInfo) {
      throw new Error("Report not found in index: " + date);
    }

    const filePath =
      reportInfo.file || `reports/daily-report-${date}.json`;

    const response =
      await fetch(filePath + "?v=" + Date.now());

    if (!response.ok) {
      throw new Error("Could not load " + filePath);
    }

    const rows = await response.json();

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
    .filter(row => row.boat)
    .map(row => ({
      boat: row.boat || "Unknown Boat",
      landing: row.landing || "Unknown Landing",
      region: row.region || "Unknown Region",
      tripType: row.trip_type || "",
      anglers: Number(row.anglers || 0),
      totalFish: Number(row.total_fish || 0),
      fishCounts: row.fish_counts || ""
    }))
    .sort((a, b) =>
      b.totalFish - a.totalFish ||
      b.anglers - a.anglers ||
      String(a.boat).localeCompare(String(b.boat))
    )
    .slice(0, 25);

  if (!boats.length) {
    container.innerHTML =
      `<h2>No top boat data found for ${formatDisplayDate(date)}.</h2>`;
    return;
  }

  container.innerHTML = `
    <section class="region-section">
      <h2>Top Boats - ${formatDisplayDate(date)}</h2>

      ${boats.map((boat, index) => `
        <div class="boat-row">
          <div>
            <strong>#${index + 1} ${boat.boat}</strong>
            <p>${boat.landing} • ${boat.region} • ${boat.tripType}</p>
          </div>

          <div>
            <strong>${numberFormat(boat.totalFish)} Fish</strong>
            <p>${numberFormat(boat.anglers)} Anglers</p>
            <p>${boat.fishCounts || "No fish counts listed"}</p>
          </div>
        </div>
      `).join("")}
    </section>
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
