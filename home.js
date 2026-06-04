async function loadHomeSummary() {
  const container = document.getElementById("homeRegionCards");

  if (!container) return;

  const regionIcons = {
    "San Diego": "assets/icons/san-diego.svg",
    "Orange County": "assets/icons/orange-county-orange.svg",
    "Los Angeles": "assets/icons/los-angeles-palm.svg",
    "Ventura": "assets/icons/ventura-sailboat.svg",
    "Santa Barbara": "assets/icons/santa-barbara-mission.svg",
    "San Luis Obispo": "assets/icons/san-luis-obispo-morro.svg",
  };

  try {
    const response = await fetch("home.json?v=" + Date.now());

    if (!response.ok) {
      throw new Error("Could not load home.json");
    }

    const data = await response.json();

    console.log("Home data received:", data);

    const updatedElement = document.getElementById("lastUpdated");

    if (updatedElement) {
      updatedElement.textContent = new Date().toLocaleString();
    }

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML =
        '<div class="loading-card">No homepage data found.</div>';
      return;
    }

    container.innerHTML = data.map(region => {
      const iconSrc = regionIcons[region.region] || "assets/icons/fish-default.png";

      return `
        <article class="region-summary-card">

          <div class="region-card-header">
            <h3>${region.region || "Unknown Region"}</h3>

            <img
              src="${iconSrc}"
              class="region-icon"
              alt="${region.region || "Region"} icon"
              onerror="this.src='assets/icons/fish-default.svg';"
            >
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
            <p class="summary-item">
              <i class="fa-solid fa-trophy"></i>
              <b>Top Boat:</b>
              <span>${region.top_boat_today || "N/A"}</span>
            </p>

            <p class="summary-item">
              <i class="fa-solid fa-anchor"></i>
              <b>Top Landing:</b>
              <span>${region.top_landing_today || "N/A"}</span>
            </p>

            <p class="summary-item">
              <i class="fa-solid fa-fish"></i>
              <b>Top Species:</b>
              <span>${region.top_species_today || "N/A"}</span>
            </p>

            <p class="summary-item">
              <i class="fa-solid fa-medal"></i>
              <b>Best 30-Day Boat:</b>
              <span>${region.best_boat_last_30_days || "N/A"}</span>
            </p>

            <p class="summary-item">
              <i class="fa-solid fa-crown"></i>
              <b>Best 90-Day Boat:</b>
              <span>${region.best_boat_last_90_days || "N/A"}</span>
            </p>
          </div>

        </article>
      `;
    }).join("");

  } catch (error) {
    console.error("Home load error:", error);

    container.innerHTML =
      '<div class="loading-card">Unable to load homepage data.</div>';
  }
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}

document.addEventListener("DOMContentLoaded", loadHomeSummary);
