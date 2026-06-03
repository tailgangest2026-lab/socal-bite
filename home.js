const HOME_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnTfpTLkH6K_50KZS2UqOxtWOyOT168q76rsJo2ABqPCF1FzKM2i8i-Os-TKuxNisRfv5tBgIcCEJtieAvUjGl5K0hvLaAa82FETAkq5jwJao3gtQxSefFhjdUxZWn-3xnCxaL5vywdC1N2aDx_bSxsxgR-XHXlzylRXYa0GSOWd7ln9aLHusxml3YbdqnUHTo7AZupjW_RXG2ohh3y9Lec5svVqiKFw-3IDuNmAX8c_R149gdcW2W50lPj8JEhloutP73GZr8St4NotP_zPr_NmCJfsvpai-SDj3Sc5_AL_pOL23-Zzs8dPz-8s3w&lib=MPCnQ2DjEMlEbUxk9HZxL1zD8tEPV74OM";

function loadHomeSummary() {
  const container = document.getElementById("homeRegionCards");
  if (!container) return;

  window.handleHomeData = function(data) {
    console.log("Home data received:", data);

    const updatedElement = document.getElementById("lastUpdated");
    if (updatedElement) {
      updatedElement.textContent = new Date().toLocaleString();
    }

    if (!Array.isArray(data) || !data.length) {
      container.innerHTML = '<div class="loading-card">No homepage data found.</div>';
      return;
    }

    container.innerHTML = data.map(region => `
      <article class="region-summary-card">
        <div class="region-card-header">
          <h3>${region.region || "Unknown Region"}</h3>
          <span class="region-pill">Today</span>
        </div>

        <div class="summary-stats">
          <div><strong>${numberFormat(region.total_trips_today)}</strong><span>Trips</span></div>
          <div><strong>${numberFormat(region.total_anglers_today)}</strong><span>Anglers</span></div>
          <div><strong>${numberFormat(region.total_fish_today)}</strong><span>Fish</span></div>
        </div>

        <div class="summary-list">
          <p><b>Top Boat:</b> ${region.top_boat_today || "N/A"}</p>
          <p><b>Top Landing:</b> ${region.top_landing_today || "N/A"}</p>
          <p><b>Top Species:</b> ${region.top_species_today || "N/A"}</p>
          <p><b>Best 30-Day Boat:</b> ${region.best_boat_last_30_days || "N/A"}</p>
          <p><b>Best 90-Day Boat:</b> ${region.best_boat_last_90_days || "N/A"}</p>
        </div>
      </article>
    `).join("");
  };

  const script = document.createElement("script");
  script.src = HOME_URL;

  script.onerror = function(e) {
    console.error("JSONP script failed to load:", e, script.src);
    container.innerHTML = '<div class="loading-card">Unable to load homepage data.</div>';
  };

  document.body.appendChild(script);
}

function numberFormat(value) {
  return Number(value || 0).toLocaleString();
}

document.addEventListener("DOMContentLoaded", loadHomeSummary);
