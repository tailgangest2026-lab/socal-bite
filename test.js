(() => {
  const LOCATIONS = {
    "San Luis Obispo": {
      county: "San Luis Obispo County",
      lat: 35.2828,
      lon: -120.6596,
      station: "9412110",
      fallbackWater: 60,
      fallbackSwell: 3.0
    },
    "Santa Barbara": {
      county: "Santa Barbara County",
      lat: 34.4208,
      lon: -119.6982,
      station: "9411340",
      fallbackWater: 61,
      fallbackSwell: 2.8
    },
    "Ventura": {
      county: "Ventura County",
      lat: 34.2746,
      lon: -119.229,
      station: "9411189",
      fallbackWater: 62,
      fallbackSwell: 3.0
    },
    "Los Angeles": {
      county: "Los Angeles County",
      lat: 33.7405,
      lon: -118.2817,
      station: "9410660",
      fallbackWater: 65,
      fallbackSwell: 2.6
    },
    "Orange County": {
      county: "Orange County",
      lat: 33.6037,
      lon: -117.9,
      station: "9410580",
      fallbackWater: 66,
      fallbackSwell: 2.5
    },
    "San Diego": {
      county: "San Diego County",
      lat: 32.7157,
      lon: -117.1611,
      station: "9410170",
      fallbackWater: 67,
      fallbackSwell: 2.4
    }
  };

  let currentMode = "pier";
  let currentRegion = "Los Angeles";

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 10);

    const dateSelect = document.getElementById("dateSelect");
    if (dateSelect) {
      dateSelect.addEventListener("change", () => {
        loadConditions();
      });
    }

    buildModeTabs();
    buildRegionTabs();
    loadConditions();
  });

  function buildModeTabs() {
    document.querySelectorAll(".mode-tabs button").forEach(button => {
      button.addEventListener("click", () => {
        currentMode = button.dataset.mode || "pier";

        document
          .querySelectorAll(".mode-tabs button")
          .forEach(btn => btn.classList.remove("active"));

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

    const date =
      document.getElementById("dateSelect")?.value ||
      new Date().toISOString().split("T")[0];

    setText("conditionLocationLabel", `${currentRegion} · ${labelMode(currentMode)}`);
    setText("conditionRating", "Loading");

    try {
      const data = await fetchConditionData(base, date);

      renderMainConditions({
        mode: currentMode,
        region: currentRegion,
        base,
        ...data
      });

      renderAllRegions(date);
    } catch (error) {
      console.error("Conditions load failed:", error);
      setText("conditionRating", "Unavailable");
    }
  }

  async function fetchConditionData(base, date) {
    const [weather, tides, waterTemp, marine] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, date),
      SCBConditions.getTides(base.station, date),
      SCBConditions.getWaterTemp(base.station),
      typeof SCBConditions.getMarine === "function"
        ? SCBConditions.getMarine(base.lat, base.lon, date)
        : Promise.resolve(null)
    ]);

    const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
    const gusts = Number(weather?.windGusts || 0);
    const temp = Number(waterTemp || base.fallbackWater || 65);

    const swell = Number(
      marine?.waveHeight ||
      marine?.swellWaveHeight ||
      base.fallbackSwell ||
      3
    );

    const swellPeriod = Number(
      marine?.wavePeriod ||
      marine?.swellWavePeriod ||
      0
    );

    const swellDirection =
      marine?.waveDirectionText ||
      marine?.swellWaveDirectionText ||
      "W";

    const tideMovement = getTideMovement(tides, date);

    const score = calculateModeScore({
      mode: currentMode,
      wind,
      gusts,
      swell,
      waterTemp: temp,
      tideMovement,
      rainChance: Number(weather?.precipitationProbability || 0),
      uvIndex: Number(weather?.uvIndex || 0)
    });

    const rating = getRating(score);

    return {
      date,
      weather,
      tides,
      marine,
      wind,
      gusts,
      temp,
      swell,
      swellPeriod,
      swellDirection,
      tideMovement,
      score,
      rating
    };
  }

  function renderMainConditions(data) {
    const {
      mode,
      region,
      date,
      weather,
      tides,
      wind,
      gusts,
      temp,
      swell,
      swellPeriod,
      swellDirection,
      tideMovement,
      score,
      rating
    } = data;

    setText("conditionLocationLabel", `${region} · ${labelMode(mode)}`);
    setText("conditionWaterTemp", `${Math.round(temp)}°`);
    setText("conditionAirTemp", `water · air ${weather?.temperature || "--"}°F`);

    const ratingEl = document.getElementById("conditionRating");
    if (ratingEl) {
      ratingEl.textContent = `${score}/100 · ${rating}`;
      ratingEl.className = ratingClass(score);
    }

    setText("conditionWind", `${wind} mph`);
    setText(
      "conditionWindDir",
      gusts ? `Gusts ${gusts} mph` : weather?.windDirection || "Light to moderate"
    );

    setText("conditionSwell", `${swell.toFixed(1)} ft`);
    setText(
      "conditionSwellPeriod",
      swellPeriod
        ? `${swellPeriod.toFixed(1)} sec · ${swellDirection}`
        : `${swellDirection} · marine estimate`
    );

    setText("conditionTide", tideMovement);
    setText("conditionNextTide", getNextTideLabel(tides, date));

    setText("conditionVisibility", estimateVisibility(region, wind, weather?.visibility));
    setText("conditionClarity", estimateClarity(mode, wind, swell));

    setText(
      "conditionClarityNote",
      mode === "beach" ? "Surf zone" : mode === "pier" ? "Pier zone" : "Offshore zone"
    );

    setText("conditionMoon", weather?.moonPhase || "Moon data pending");
    setText("conditionSunrise", weather?.sunrise || "--");
    setText("conditionSunset", weather?.sunset || "--");
    setText("conditionAdvisory", wind >= 18 || gusts >= 25 || swell >= 5 ? "Possible" : "None");
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
        const data = await fetchConditionData(base, date);

        cards.push(`
          <article class="region-card condition-region-card">
            <div class="region-top">
              <span>${safe(region)}</span>
              <strong>${data.score}</strong>
            </div>

            <div class="region-stat-row">
              <div>
                <small>Wind</small>
                <b>${data.wind} mph</b>
              </div>
              <div>
                <small>Water</small>
                <b>${Math.round(data.temp)}°</b>
              </div>
            </div>

            <div class="region-details">
              <p><span>Swell</span>${data.swell.toFixed(1)} ft</p>
              <p><span>Period</span>${data.swellPeriod ? data.swellPeriod.toFixed(1) + " sec" : "N/A"}</p>
              <p><span>Tide</span>${safe(data.tideMovement)}</p>
              <p><span>Rating</span>${safe(data.rating)}</p>
            </div>
          </article>
        `);
      } catch (error) {
        console.warn("Region unavailable:", region, error);

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

    if (wind <= 5) score += 15;
    else if (wind <= 8) score += 10;
    else if (wind <= 12) score += 5;
    else if (wind <= 16) score -= 5;
    else if (wind <= 20) score -= 15;
    else score -= 25;

    if (gusts > 25) score -= 15;
    else if (gusts > 18) score -= 8;

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
      else if (swell < 1.5) score -= 5;
    }

    if (waterTemp >= 63 && waterTemp <= 69) {
      score += 8;
    } else if (waterTemp < 58 || waterTemp > 74) {
      score -= 8;
    }

    const tideText = String(tideMovement).toLowerCase();

    if (tideText.includes("moving")) {
      score += 10;
    } else if (tideText.includes("slack")) {
      score -= 6;
    }

    if (rainChance > 60) score -= 15;
    else if (rainChance > 30) score -= 8;

    if (mode === "beach" && uvIndex > 9) {
      score -= 5;
    }

    return Math.max(25, Math.min(100, Math.round(score)));
  }

  function getTideMovement(tides, selectedDate) {
    if (!Array.isArray(tides) || tides.length < 2) return "Unknown";

    const parsed = parseTides(tides);
    if (parsed.length < 2) return "Unknown";

    const targetTime = getTargetTideTime(selectedDate);

    let nextIndex = parsed.findIndex(t => t.time > targetTime);

    if (nextIndex <= 0) {
      nextIndex = 1;
    }

    const previous = parsed[nextIndex - 1];
    const next = parsed[nextIndex];

    if (!previous || !next) return "Unknown";

    const diff = next.height - previous.height;

    if (Math.abs(diff) < 0.15) return "Slack";
    return diff > 0 ? "Rising / Moving" : "Falling / Moving";
  }

  function getNextTideLabel(tides, selectedDate) {
    if (!Array.isArray(tides) || !tides.length) return "Tide data pending";

    const parsed = parseTides(tides);
    if (!parsed.length) return "Tide data pending";

    const targetTime = getTargetTideTime(selectedDate);
    const next = parsed.find(t => t.time > targetTime) || parsed[0];

    return `${next.type} ${next.height.toFixed(1)} ft · ${next.time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
  }

  function parseTides(tides) {
    return tides
      .map(t => {
        const rawTime = String(t.t || t.time || t.date || "").replace(" ", "T");

        return {
          time: new Date(rawTime),
          height: Number(t.v || t.height || t.prediction),
          type: t.type === "H" ? "High" : t.type === "L" ? "Low" : "Tide"
        };
      })
      .filter(t => !Number.isNaN(t.time.getTime()) && Number.isFinite(t.height))
      .sort((a, b) => a.time - b.time);
  }

  function getTargetTideTime(selectedDate) {
    if (!selectedDate) return new Date();

    const today = new Date().toISOString().split("T")[0];

    if (selectedDate === today) {
      return new Date();
    }

    return new Date(`${selectedDate}T12:00:00`);
  }

  function estimateVisibility(region, wind, apiVisibility) {
    if (apiVisibility) return `${apiVisibility} mi`;
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
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 45) return "Slow";
    return "Poor";
  }

  function ratingClass(score) {
    if (score >= 90) return "green-pill";
    if (score >= 75) return "cyan-pill";
    if (score >= 60) return "small-pill";
    return "outline-pill";
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
