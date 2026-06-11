(() => {
  const LOCATIONS = {
    "Santa Barbara": { county: "Santa Barbara County", lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, swell: 2.8 },
    "Ventura": { county: "Ventura County", lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, swell: 3.0 },
    "Los Angeles": { county: "Los Angeles County", lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, swell: 2.6 },
    "Orange County": { county: "Orange County", lat: 33.6037, lon: -117.9, station: "9410580", water: 66, swell: 2.5 },
    "San Diego": { county: "San Diego County", lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, swell: 2.4 }
  };

  let currentMode = "pier";
  let currentRegion = "Los Angeles";

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 10);
    buildModeTabs();
    buildRegionTabs();
    loadConditions();
  });

  function buildModeTabs() {
    document.querySelectorAll(".mode-tabs button").forEach(button => {
      button.addEventListener("click", () => {
        currentMode = button.dataset.mode || "pier";

        document.querySelectorAll(".mode-tabs button").forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        loadConditions();
      });
    });
  }

  function buildRegionTabs() {
    const tabs = document.getElementById("regionTabs");
    if (!tabs) return;

    tabs.innerHTML = Object.keys(LOCATIONS).map(region => `
      <button
        type="button"
        class="${region === currentRegion ? "active" : ""}"
        data-region="${safeAttr(region)}"
      >
        ${safe(region)}
      </button>
    `).join("");

    tabs.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", () => {
        currentRegion = button.dataset.region || "Los Angeles";
        buildRegionTabs();
        loadConditions();
      });
    });
  }

  async function loadConditions() {
    const base = LOCATIONS[currentRegion] || LOCATIONS["Los Angeles"];
    const date = document.getElementById("dateSelect")?.value || new Date().toISOString().split("T")[0];

    setText("conditionLocationLabel", `${currentRegion} · ${labelMode(currentMode)}`);
    setText("conditionRating", "Loading");

    try {
      const [weather, tides, waterTemp] = await Promise.all([
        SCBConditions.getWeather(base.lat, base.lon, date),
        SCBConditions.getTides(base.station, date),
        SCBConditions.getWaterTemp(base.station)
      ]);

      const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
      const gusts = Number(weather?.windGusts || 0);
      const temp = Number(waterTemp || base.water);
      const swell = Number(base.swell);
      const tideMovement = getTideMovement(tides);
      const score = calculateModeScore({
        mode: currentMode,
        wind,
        gusts,
        swell,
        waterTemp: temp,
        tideMovement,
        rainChance: weather?.precipitationProbability,
        uvIndex: weather?.uvIndex
      });

      const rating = getRating(score);

      renderMainConditions({
        mode: currentMode,
        region: currentRegion,
        base,
        weather,
        tides,
        wind,
        gusts,
        temp,
        swell,
        tideMovement,
        score,
        rating
      });

      renderAllRegions(date);
    } catch (error) {
      console.error("Conditions load failed:", error);
      setText("conditionRating", "Unavailable");
    }
  }

  function renderMainConditions(data) {
    const { mode, region, weather, tides, wind, gusts, temp, swell, tideMovement, score, rating } = data;

    setText("conditionLocationLabel", `${region} · ${labelMode(mode)}`);
    setText("conditionWaterTemp", `${Math.round(temp)}°`);
    setText("conditionAirTemp", `water · air ${weather?.temperature || "--"}°F`);

    const ratingEl = document.getElementById("conditionRating");
    if (ratingEl) {
      ratingEl.textContent = `${score}/100 · ${rating}`;
      ratingEl.className = "green-pill";
    }

    setText("conditionWind", `${wind} mph`);
    setText("conditionWindDir", gusts ? `Gusts ${gusts} mph` : "Light to moderate");
    setText("conditionSwell", `${swell.toFixed(1)} ft`);
    setText("conditionSwellPeriod", mode === "boat" ? "Offshore estimate" : mode === "beach" ? "Surf estimate" : "Nearshore estimate");
    setText("conditionTide", tideMovement);
    setText("conditionNextTide", getNextTideLabel(tides));
    setText("conditionVisibility", estimateVisibility(region, wind));
    setText("conditionClarity", estimateClarity(mode, wind, swell));
    setText("conditionClarityNote", mode === "beach" ? "Surf zone" : mode === "pier" ? "Pier zone" : "Offshore zone");
    setText("conditionMoon", weather?.moonPhase || "Waxing 62%");
    setText("conditionSunrise", weather?.sunrise || "5:42 AM");
    setText("conditionSunset", weather?.sunset || "8:01 PM");
    setText("conditionAdvisory", wind >= 18 || gusts >= 25 ? "Possible" : "None");
  }

  async function renderAllRegions(date) {
    const grid = document.getElementById("allRegionsGrid");
    const title = document.getElementById("allRegionsTitle");
    if (!grid) return;

    if (title) {
      title.textContent = `All regions · ${labelMode(currentMode)}`;
    }

    grid.innerHTML = `<div class="loading-card">Loading regional board...</div>`;

    const cards = [];

    for (const [region, base] of Object.entries(LOCATIONS)) {
      try {
        const [weather, tides, waterTemp] = await Promise.all([
          SCBConditions.getWeather(base.lat, base.lon, date),
          SCBConditions.getTides(base.station, date),
          SCBConditions.getWaterTemp(base.station)
        ]);

        const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
        const temp = Number(waterTemp || base.water);
        const tideMovement = getTideMovement(tides);
        const score = calculateModeScore({
          mode: currentMode,
          wind,
          gusts: Number(weather?.windGusts || 0),
          swell: base.swell,
          waterTemp: temp,
          tideMovement,
          rainChance: weather?.precipitationProbability,
          uvIndex: weather?.uvIndex
        });

        cards.push(`
          <article class="region-card condition-region-card">
            <div class="region-top">
              <span>${safe(region)}</span>
              <strong>${score}</strong>
            </div>

            <div class="region-stat-row">
              <div>
                <small>Wind</small>
                <b>${wind} mph</b>
              </div>
              <div>
                <small>Water</small>
                <b>${Math.round(temp)}°</b>
              </div>
            </div>

            <div class="region-details">
              <p><span>Swell</span>${Number(base.swell).toFixed(1)} ft</p>
              <p><span>Tide</span>${safe(tideMovement)}</p>
              <p><span>Rating</span>${safe(getRating(score))}</p>
            </div>
          </article>
        `);
      } catch (error) {
        cards.push(`
          <article class="region-card condition-region-card">
            <div class="region-top">
              <span>${safe(region)}</span>
              <strong>--</strong>
            </div>
            <div class="region-details">
              <p><span>Status</span>Unavailable</p>
            </div>
          </article>
        `);
      }
    }

    grid.innerHTML = cards.join("");
  }

  function calculateModeScore({
  mode,
  wind,
  gusts,
  swell,
  waterTemp,
  tideMovement,
  rainChance,
  uvIndex
}) {

  let score = 60;

  // WIND
  if (wind <= 5) score += 15;
  else if (wind <= 8) score += 10;
  else if (wind <= 12) score += 5;
  else if (wind <= 16) score -= 5;
  else if (wind <= 20) score -= 15;
  else score -= 25;

  // GUSTS
  if (gusts > 25) score -= 15;
  else if (gusts > 18) score -= 8;

  // SWELL
  if (mode === "boat") {
    if (swell <= 2) score += 15;
    else if (swell <= 3) score += 10;
    else if (swell <= 4) score += 5;
    else if (swell <= 5) score -= 10;
    else score -= 25;
  }

  if (mode === "pier") {
    if (swell <= 3) score += 10;
    else if (swell <= 5) score += 2;
    else score -= 12;
  }

  if (mode === "beach") {
    if (swell >= 2 && swell <= 4) score += 12;
    else if (swell > 6) score -= 15;
  }

  // WATER TEMP
  if (waterTemp >= 63 && waterTemp <= 69) {
    score += 8;
  }

  // TIDE
  if (String(tideMovement).includes("Moving")) {
    score += 10;
  }

  // RAIN
  if (rainChance > 60) score -= 15;
  else if (rainChance > 30) score -= 8;

  // UV
  if (mode === "beach" && uvIndex > 9) {
    score -= 5;
  }

  return Math.max(25, Math.min(100, Math.round(score)));
}
  function getTideMovement(tides) {
    if (!Array.isArray(tides) || tides.length < 2) return "Unknown";

    const now = new Date();
    const future = tides
      .map(t => ({
        time: new Date(t.time || t.t || t.date),
        height: Number(t.height || t.v || t.prediction)
      }))
      .filter(t => t.time > now && Number.isFinite(t.height))
      .slice(0, 2);

    if (future.length < 2) return "Unknown";

    const diff = future[1].height - future[0].height;

    if (Math.abs(diff) < 0.15) return "Slack";
    return diff > 0 ? "Rising / Moving" : "Falling / Moving";
  }

  function getNextTideLabel(tides) {
    if (!Array.isArray(tides) || !tides.length) return "Tide data pending";

    const now = new Date();
    const next = tides
      .map(t => ({
        time: new Date(t.time || t.t || t.date),
        height: Number(t.height || t.v || t.prediction)
      }))
      .filter(t => t.time > now && Number.isFinite(t.height))
      .sort((a, b) => a.time - b.time)[0];

    if (!next) return "Tide data pending";

    return `${next.height.toFixed(1)} ft · ${next.time.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  function estimateVisibility(region, wind) {
    if (wind >= 15) return "6 mi";
    if (region === "San Diego") return "13 mi";
    return "10 mi";
  }

  function estimateClarity(mode, wind, swell) {
    if (mode === "beach" && swell > 4) return "Choppy";
    if (wind > 14) return "Stirred";
    if (swell < 3) return "Clean";
    return "Fair";
  }

  function getRating(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Fair";
    return "Slow";
  }

  function labelMode(mode) {
    if (mode === "boat") return "Boat";
    if (mode === "beach") return "Surf";
    return "Pier";
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value || "--";
  }

  function safe(value) {
    return String(value || "N/A")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeAttr(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
})();
