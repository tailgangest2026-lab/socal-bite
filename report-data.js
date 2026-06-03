const HOME_JSON_URL = "home.json";

async function loadHomeSummary() {
  const container = document.getElementById("homeRegionCards");

  try {
    const response = await fetch(HOME_JSON_URL + "?v=" + Date.now());

    if (!response.ok) {
      throw new Error("Could not load home.json");
    }

    const data = await response.json();

    if (!data.length) {
      container.innerHTML = `<div class="loading-card">No homepage data found.</div>`;
      return;
    }

    container.innerHTML = data.map(region => `
      <article class="region-summary-card">
        <div class="region-card-header">
          <h3>${region.region || "Unknown Region"}</h3>
          <span class="region-pill">Today</span>
        </div>

        <div class="summary-stats">
          <div>
            <strong>${numberFormat(region.total_trips_today)}</strong>
            <span>Trips</span>
          </div>

          <div>
            <strong>${numberFormat(region.total_anglers_today)}</strong>
            <span>Anglers</span>
          </div>

          <div>
            <strong>${numberFormat(region.total_fish_today)}</strong>
            <span>Fish</span>
          </div>
        </div>

        <div class="summary-list">
          <p><b>Top Boat:</b> ${region.top_boat_today || "N/A"}</p>
          <p><b>Top Landing:</b> ${region.top_landing_today || "N/A"}</p>
          <p><b>Top Species:</b> ${region.top_species_today || "N/A"}</p>
          <p><b>Best 30-Day Boat:</b> ${region.best_boat_last_30_days || "N/A"}</p>
          <p><b>Best 90-Day Boat:</b> ${region.best_boat_last_90_days || "N/A"}</p>
          <p><b>Top Species 30 Days:</b> ${region.most_caught_species_last_30_days || "N/A"}</p>
          <p><b>Top Species 90 Days:</b> ${region.most_caught_species_last_90_days || "N/A"}</p>
        </div>
      </article>
    `).join("");

  } catch (error) {
    console.error("Homepage load error:", error);
    container.innerHTML = `<div class="loading-card">Unable to load homepage data.</div>`;
  }
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}

document.addEventListener("DOMContentLoaded", loadHomeSummary);
