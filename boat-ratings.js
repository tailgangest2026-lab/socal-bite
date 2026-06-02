let allData;
let currentDateIndex = 0;

getSoCalBiteData()
  .then(data => {
    allData = data;
    currentDateIndex = data.dates.indexOf(data.latestDate);

    buildDateDropdown();
    buildFilters(data.latestDate);
    renderBoatRatings(data.latestDate);
  })
  .catch(err => {
    console.error("DATA ERROR:", err);
    document.getElementById("boatRatingsPage").innerHTML =
      "<h2>Could not load boat ratings data.</h2>";
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
    buildFilters(e.target.value);
    renderBoatRatings(e.target.value);
  });

  document.getElementById("prevDay").onclick = () => {
    if (currentDateIndex > 0) {
      currentDateIndex--;
      select.value = allData.dates[currentDateIndex];
      buildFilters(select.value);
      renderBoatRatings(select.value);
    }
  };

  document.getElementById("nextDay").onclick = () => {
    if (currentDateIndex < allData.dates.length - 1) {
      currentDateIndex++;
      select.value = allData.dates[currentDateIndex];
      buildFilters(select.value);
      renderBoatRatings(select.value);
    }
  };
}

function buildFilters(date) {
  const report = allData.reportsByDate[date];
  const ratings = report.boatRatings || [];

  const regionSelect = document.getElementById("regionSelect");
  const tripTypeSelect = document.getElementById("tripTypeSelect");

  const selectedRegion = regionSelect.value || "All Regions";
  const selectedTripType = tripTypeSelect.value || "All Trip Types";

  const regions = ["All Regions", ...new Set(ratings.map(r => r.region).filter(Boolean))];
  const tripTypes = ["All Trip Types", ...new Set(ratings.map(r => r.tripType).filter(Boolean))];

  regionSelect.innerHTML = regions
    .map(region => `<option value="${region}">${region}</option>`)
    .join("");

  tripTypeSelect.innerHTML = tripTypes
    .map(type => `<option value="${type}">${type}</option>`)
    .join("");

  regionSelect.value = regions.includes(selectedRegion) ? selectedRegion : "All Regions";
  tripTypeSelect.value = tripTypes.includes(selectedTripType) ? selectedTripType : "All Trip Types";

  regionSelect.onchange = () => renderBoatRatings(date);
  tripTypeSelect.onchange = () => renderBoatRatings(date);
}

function renderBoatRatings(date) {

const report = allData.reportsByDate[date];
const container = document.getElementById("boatRatingsPage");

if (!report || !report.boatRatings || !report.boatRatings.length) {
container.innerHTML =
"<h2>No boat rating data found for this date.</h2>";
return;
}

const selectedRegion =
document.getElementById("regionSelect").value;

let ratings = report.boatRatings;

if (
selectedRegion &&
selectedRegion !== "All Regions"
) {
ratings = ratings.filter(
r => r.region === selectedRegion
);
}

const grouped = {};

ratings.forEach(boat => {

```
const tripType =
  boat.tripType || "Other";

if (!grouped[tripType]) {
  grouped[tripType] = [];
}

grouped[tripType].push(boat);
```

});

container.innerHTML = `

```
<div class="region-section">
  <h2>Boat Ratings - ${report.displayDate}</h2>

  <p class="updated">
    Ranked by Average Fish Per Angler (FPA)
  </p>
</div>

<div class="ratings-grid">

  ${Object.entries(grouped)
    .sort()
    .map(([tripType, boats]) => `

      <div class="rating-card">

        <h3>${tripType}</h3>

        ${boats
          .sort(
            (a,b) =>
              b.averageFPA - a.averageFPA
          )
          .map((boat,index) => `

            <div class="boat-row">

              <div>
                <strong>
                  #${index + 1}
                  ${boat.boat}
                </strong>

                <p>
                  ${boat.landing}
                </p>
              </div>

              <div>
                <strong>
                  ${boat.averageFPA} FPA
                </strong>

                <p>
                  ${boat.totalFish} Fish •
                  ${boat.totalAnglers} Anglers
                </p>
              </div>

            </div>

          `).join("")}

      </div>

  `).join("")}

</div>
```

`;
}

  `;
}
