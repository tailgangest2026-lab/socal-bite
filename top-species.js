let allData;
let currentDateIndex = 0;

getSoCalBiteData()
  .then(data => {
    allData = data;
    currentDateIndex = data.dates.indexOf(data.latestDate);

    buildDateDropdown();
    renderTopSpecies(data.latestDate);
  })
  .catch(err => {
    console.error("DATA ERROR:", err);
    document.getElementById("topSpeciesPage").innerHTML =
      "<h2>Could not load top species data.</h2>";
  });

function buildDateDropdown() {
  const select = document.getElementById("dateSelect");

  allData.dates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    select.appendChild(option);
  });

  select.value = allData.latestDate;

  select.addEventListener("change", e => {
    currentDateIndex = allData.dates.indexOf(e.target.value);
    renderTopSpecies(e.target.value);
  });

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      renderTopSpecies(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      renderTopSpecies(select.value);
    }
  };
}

function renderTopSpecies(date) {
  const report = allData.reportsByDate[date];
  const container = document.getElementById("topSpeciesPage");

  if (!report || !report.topSpecies || !report.topSpecies.length) {
    container.innerHTML = "<h2>No top species data found for this date.</h2>";
    return;
  }

  container.innerHTML = `
    <div class="region-section">
      <h2>Top Species - ${report.displayDate}</h2>
      <p class="updated">Last Updated: ${allData.updatedAt}</p>

      ${report.topSpecies.map((species, i) => `
        <div class="boat-row">
          <div>
            <strong>#${i + 1} ${species.fish}</strong>
            <p>Southern California reported catch</p>
          </div>
          <div>
            <strong>${species.count} Fish</strong>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
