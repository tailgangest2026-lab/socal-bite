let allData;
let currentDateIndex = 0;

getSoCalBiteData().then(data => {
  allData = data;
  currentDateIndex = data.dates.indexOf(data.latestDate);
  buildDateDropdown();
  renderDailyReport(data.latestDate);
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
    renderDailyReport(e.target.value);
  });

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      renderDailyReport(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      renderDailyReport(select.value);
    }
  };
}

function renderDailyReport(date) {
  const report = allData.reportsByDate[date];
  const container = document.getElementById("dailyReport");

  container.innerHTML = `
    <h1>Daily Fishing Report - ${report.displayDate}</h1>
    <p class="updated">Last Updated: ${allData.updatedAt}</p>
    ${report.regions.map(region => `
      <div class="region-section">
        <h2>${region.region}</h2>
        <div class="summary-row">
          <span>${region.totalTrips} Trips</span>
          <span>${region.totalAnglers} Anglers</span>
          <span>${region.totalFish} Fish</span>
        </div>

        ${region.landings.map(landing => `
          <div class="landing-card">
            <h3>${landing.landing}</h3>
            <p>${landing.totalTrips} Trips • ${landing.totalAnglers} Anglers • ${landing.totalFish} Fish</p>

            ${landing.boats.map(boat => `
              <div class="boat-row">
                <div>
                  <strong>${boat.boat}</strong>
                  <p>${boat.tripType} • ${boat.anglers} Anglers</p>
                </div>
                <div>
                  <strong>${boat.totalFish} Fish</strong>
                  <p>${fishList(boat.fish)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        `).join("")}
      </div>
    `).join("")}
  `;
}
