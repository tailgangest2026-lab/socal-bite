let allData;
let currentDateIndex = 0;

getSoCalBiteData()
  .then(data => {
    allData = data;
    currentDateIndex = data.dates.indexOf(data.latestDate);

    buildDateDropdown();
    renderRegionReport(data.latestDate);
  })
  .catch(err => {
    console.error("DATA ERROR:", err);
    document.getElementById("regionReport").innerHTML =
      "<h2>Could not load regional report data.</h2>";
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
    renderRegionReport(e.target.value);
  });

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      renderRegionReport(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      renderRegionReport(select.value);
    }
  };
}

function renderRegionReport(date) {
  const report = allData.reportsByDate[date];
  const regionName = window.SOCAL_BITE_REGION;
  const container = document.getElementById("regionReport");

  if (!report || !report.regions) {
    container.innerHTML = "<h2>No report data found for this date.</h2>";
    return;
  }

  const region = report.regions.find(r => r.region === regionName);

  if (!region) {
    container.innerHTML = `<h2>No ${regionName} data found for this date.</h2>`;
    return;
  }

  container.innerHTML = `
    <div class="region-section">
      <h2>${region.region} - ${report.displayDate}</h2>
      <p class="updated">Last Updated: ${allData.updatedAt}</p>

      <div class="summary-row">
        <span>${region.totalTrips} Trips</span>
        <span>${region.totalAnglers} Anglers</span>
        <span>${region.totalFish} Fish</span>
      </div>
    </div>

    ${region.landings.map(landing => `
      <div class="landing-card">
        <h3>${landing.landing}</h3>
        <p>${landing.totalTrips} Trips • ${landing.totalAnglers} Anglers • ${landing.totalFish} Fish</p>

        ${landing.boats.map(boat => `
          <div class="boat-row">
            <div>
              <strong>${boat.boat}</strong>
              <p>${boat.tripType || ""} • ${boat.anglers || 0} Anglers</p>
            </div>

            <div>
              <strong>${boat.totalFish} Fish</strong>
              <p>${fishList(boat.fish)}</p>
            </div>
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}
