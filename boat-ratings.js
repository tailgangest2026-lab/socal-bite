let allData;
let currentDateIndex = 0;

getSoCalBiteData()
  .then(data => {
    console.log("Boat ratings data:", data);

    allData = data;
    currentDateIndex = data.dates.indexOf(data.latestDate);

    buildDateDropdown();
    buildRegionFilter(data.latestDate);
    renderBoatRatings(data.latestDate);
  })
  .catch(err => {
    console.error("DATA ERROR:", err);
    document.getElementById("boatRatingsPage").innerHTML =
      "<h2>Could not load boat ratings data.</h2>";
  });

function buildDateDropdown() {
  const select = document.getElementById("dateSelect");

  select.innerHTML = "";

  allData.dates.forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = date;
    select.appendChild(option);
  });

  select.value = allData.latestDate;

  select.onchange = e => {
    currentDateIndex = allData.dates.indexOf(e.target.value);
    buildRegionFilter(e.target.value);
    renderBoatRatings(e.target.value);
  };

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      buildRegionFilter(select.value);
      renderBoatRatings(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      buildRegionFilter(select.value);
      renderBoatRatings(select.value);
    }
  };
}

function buildRegionFilter(date) {
  const report = allData.reportsByDate[date];
  const ratings = report?.boatRatings || [];

  const regionSelect = document.getElementById("regionSelect");

  if (!regionSelect) return;

  const currentValue = regionSelect.value || "All Regions";

  const regions = [
    "All Regions",
    ...new Set(ratings.map(r => r.region).filter(Boolean))
  ];

  regionSelect.innerHTML = regions
    .map(region => `<option value="${region}">${region}</option>`)
    .join("");

  regionSelect.value = regions.includes(currentValue)
    ? currentValue
    : "All Regions";

  regionSelect.onchange = () => {
    renderBoatRatings(document.getElementById("dateSelect").value);
  };
}

function renderBoatRatings(date) {
  const report = allData.reportsByDate[date];
  const container = document.getElementById("boatRatingsPage");

  if (!report) {
    container.innerHTML = "<h2>No report found for this date.</h2>";
    return;
  }

  if (!report.boatRatings || !report.boatRatings.length) {
    container.innerHTML = `
      <div class="region-section">
        <h2>No boat rating data found for ${report.displayDate || date}</h2>
        <p>Check that your Apps Script JSON includes <strong>boatRatings</strong>.</p>
      </div>
    `;
    return;
  }

  const regionSelect = document.getElementById("regionSelect");
  const selectedRegion = regionSelect ? regionSelect.value : "All Regions";

  let ratings = report.boatRatings;

  if (selectedRegion && selectedRegion !== "All Regions") {
    ratings = ratings.filter(r => r.region === selectedRegion);
  }

  const grouped = {};

  ratings.forEach(boat => {
    const tripType = boat.tripType || "Other";
    if (!grouped[tripType]) grouped[tripType] = [];
    grouped[tripType].push(boat);
  });

  container.innerHTML = `
    <div class="region-section">
      <h2>Boat Ratings - ${report.displayDate}</h2>
      <p class="updated">Ranked by Average Fish Per Angler (FPA)</p>
    </div>

    <div class="ratings-grid">
      ${Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([tripType, boats]) => `
          <div class="rating-card">
            <h3>${tripType}</h3>

            ${boats
              .sort((a, b) => b.averageFPA - a.averageFPA)
              .map((boat, index) => `
                <div class="boat-row">
                  <div>
                    <strong>#${index + 1} ${boat.boat}</strong>
                    <p>${boat.landing} • ${boat.region}</p>
                  </div>

                  <div>
                    <strong>${boat.averageFPA} FPA</strong>
                    <p>${boat.totalFish} Fish • ${boat.totalAnglers} Anglers • ${boat.tripCount} Trips</p>
                  </div>
                </div>
              `).join("")}
          </div>
        `).join("")}
    </div>
  `;
}
