let allData;
let currentDateIndex = 0;

getSoCalBiteData()
  .then(data => {
    allData = data;
    currentDateIndex = data.dates.indexOf(data.latestDate);

    buildDateDropdown();
    renderTopBoats(data.latestDate);
  })
  .catch(err => {
    console.error("DATA ERROR:", err);
    document.getElementById("topBoatsPage").innerHTML =
      "<h2>Could not load top boats data.</h2>";
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
    renderTopBoats(e.target.value);
  });

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      renderTopBoats(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      renderTopBoats(select.value);
    }
  };
}

function renderTopBoats(date) {
  const report = allData.reportsByDate[date];
  const container = document.getElementById("topBoatsPage");

  if (!report || !report.topBoats || !report.topBoats.length) {
    container.innerHTML = "<h2>No top boat data found for this date.</h2>";
    return;
  }

  container.innerHTML = `
    <div class="region-section">
      <h2>Top Boats - ${report.displayDate}</h2>
      <p class="updated">Last Updated: ${allData.updatedAt}</p>

      ${report.topBoats.map((boat, i) => `
        <div class="boat-row">
          <div>
            <strong>#${i + 1} ${boat.boat}</strong>
            <p>${boat.landing} • ${boat.region} • ${boat.tripType || ""}</p>
          </div>
          <div>
            <strong>${boat.totalFish} Fish</strong>
            <p>${boat.anglers || 0} Anglers</p>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}
