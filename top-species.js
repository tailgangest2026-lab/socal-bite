let dailyIndex = [];
let currentDateIndex = 0;

document.addEventListener("DOMContentLoaded", loadTopSpeciesIndex);

async function loadTopSpeciesIndex() {
  const container = document.getElementById("topSpeciesPage");

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
    loadTopSpeciesDate(dailyIndex[currentDateIndex].date);

  } catch (error) {
    console.error("Top species index load error:", error);
    container.innerHTML = "<h2>Could not load top species data.</h2>";
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

    if (currentDateIndex < 0) {
      currentDateIndex = 0;
    }

    loadTopSpeciesDate(dailyIndex[currentDateIndex].date);
    updateNavButtons();
  };

  prevBtn.onclick = () => {
    if (currentDateIndex < dailyIndex.length - 1) {
      currentDateIndex++;
      select.value = dailyIndex[currentDateIndex].date;
      loadTopSpeciesDate(select.value);
      updateNavButtons();
    }
  };

  nextBtn.onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = dailyIndex[currentDateIndex].date;
      loadTopSpeciesDate(select.value);
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

async function loadTopSpeciesDate(date) {
  const container = document.getElementById("topSpeciesPage");

  try {
    container.innerHTML =
      `<h2>Loading top species for ${formatDisplayDate(date)}...</h2>`;

    const reportInfo =
      dailyIndex.find(x => x.date === date);

    if (!reportInfo) {
      throw new Error("Report not found in index: " + date);
    }

    const filePath =
      reportInfo.file || `reports/daily-report-${date}.json`;

    const response =
      await fetch(socalBiteDataUrl(filePath));

    if (!response.ok) {
      throw new Error("Could not load " + filePath);
    }

    const rows =
      await response.json();

    renderTopSpecies(date, rows);

  } catch (error) {
    console.error("Top species date load error:", error);

    container.innerHTML =
      `<h2>Could not load top species for ${formatDisplayDate(date)}.</h2>`;
  }
}

function renderTopSpecies(date, rows) {
  const container = document.getElementById("topSpeciesPage");

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML =
      `<h2>No top species data found for ${formatDisplayDate(date)}.</h2>`;
    return;
  }

  const grouped = buildSpeciesByRegion(rows);

  container.innerHTML = `
    <section class="region-section">
      <h2>Top Species - ${formatDisplayDate(date)}</h2>
      <p class="updated">Ranked by total fish reported</p>
    </section>

    ${Object.keys(grouped).sort().map(region => {
      const speciesRows = Object.keys(grouped[region])
        .map(species => ({
          species,
          count: grouped[region][species]
        }))
        .sort((a, b) =>
          b.count - a.count ||
          String(a.species).localeCompare(String(b.species))
        )
        .slice(0, 10);

      return `
        <section class="region-section">
          <h2>${region}</h2>

          ${speciesRows.map((item, index) => `
            <div class="boat-row">
              <div>
                <strong>#${index + 1} ${item.species}</strong>
                <p>${region} reported catch</p>
              </div>

              <div>
                <strong>${numberFormat(item.count)} Fish</strong>
              </div>
            </div>
          `).join("")}
        </section>
      `;
    }).join("")}
  `;
}

function buildSpeciesByRegion(rows) {
  const grouped = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";
    const fishCounts = row.fish_counts || "";

    if (!grouped[region]) {
      grouped[region] = {};
    }

    parseFishCounts(fishCounts).forEach(item => {
      if (!item.species || item.count <= 0) return;

      grouped[region][item.species] =
        (grouped[region][item.species] || 0) + item.count;
    });
  });

  return grouped;
}

function parseFishCounts(fishCounts) {
  return String(fishCounts || "")
    .split(",")
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const match = part.match(/^(\d+)\s+(.+)$/);

      if (!match) {
        return null;
      }

      return {
        count: Number(match[1] || 0),
        species: match[2].trim()
      };
    })
    .filter(Boolean);
}

function formatDisplayDate(dateString) {
  const parts = String(dateString).split("-");

  if (parts.length !== 3) {
    return dateString;
  }

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
