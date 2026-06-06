document.addEventListener("DOMContentLoaded", loadBoatRatings);

async function loadBoatRatings() {
  const container = document.getElementById("boatRatingsPage");

  try {
    const response = await fetch(socalBiteDataUrl("boat-ratings.json"));

    if (!response.ok) {
      throw new Error("Could not load boat-ratings.json");
    }

    const rows = await response.json();

    renderBoatRatings(rows);

  } catch (error) {
    console.error("Boat ratings load error:", error);
    container.innerHTML = "<h2>Could not load boat ratings.</h2>";
  }
}

function renderBoatRatings(rows) {
  const container = document.getElementById("boatRatingsPage");

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML = "<h2>No boat ratings found.</h2>";
    return;
  }

  const grouped = {};

  rows.forEach(row => {
    const region = row.region || "Unknown Region";
    const tripType = row.trip_type || "Unknown Trip Type";

    if (!grouped[region]) grouped[region] = {};
    if (!grouped[region][tripType]) grouped[region][tripType] = [];

    grouped[region][tripType].push(row);
  });

  container.innerHTML = `
    <section class="region-section">
      <h2>Boat Ratings by Region & Trip Type</h2>
      <p class="updated">Ranked by Fish Per Angler (FPA)</p>
    </section>

    ${Object.keys(grouped).sort().map(region => `
      <section class="region-section">
        <h2>${region}</h2>

        ${Object.keys(grouped[region]).sort().map(tripType => {
          const boats = grouped[region][tripType]
            .sort((a, b) =>
              Number(b.fpa || 0) - Number(a.fpa || 0) ||
              Number(b.trips || 0) - Number(a.trips || 0)
            );

          return `
            <div class="landing-card">
              <h3>${tripType}</h3>

              ${boats.map((boat, index) => `
                <div class="boat-row">
                  <div>
                    <strong>#${index + 1} ${boat.boat || "Unknown Boat"}</strong>
                    <p>${boat.landing || "Unknown Landing"}</p>
                  </div>

                  <div>
                    <strong>${numberFormat(boat.fpa)} FPA</strong>
                    <p>
                      ${numberFormat(boat.trips)} Trips •
                      ${numberFormat(boat.anglers)} Anglers •
                      ${numberFormat(boat.fish)} Fish
                    </p>
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

function numberFormat(value) {
  const num = Number(value || 0);

  if (String(value).includes(".") || num % 1 !== 0) {
    return num.toFixed(2);
  }

  return num.toLocaleString();
}
