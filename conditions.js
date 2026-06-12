(() => {
  const DEBUG = true;

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
  let requestId = 0;

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 10);

    const dateSelect = document.getElementById("dateSelect");
    if (dateSelect) {
      dateSelect.addEventListener("change", () => {
        debug("DATE CHANGED:", dateSelect.value);
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
    const thisRequest = ++requestId;

    const base = LOCATIONS[currentRegion] || LOCATIONS["Los Angeles"];

    const date =
      document.getElementById("dateSelect")?.value ||
      getTodayString();

    debug("FETCHING CONDITIONS FOR:", {
      date,
      region: currentRegion,
      mode: currentMode,
      base
    });

    setLoadingState();

    try {
      const data = await fetchConditionData(base, date);

      if (thisRequest !== requestId) {
        debug("Skipped old request:", thisRequest);
        return;
      }

      renderMainConditions({
        mode: currentMode,
        region: currentRegion,
        base,
        ...data
      });

      renderAllRegions(date, thisRequest);
    } catch (error) {
      console.error("Conditions load failed:", error);
      setText("conditionRating", "Unavailable");
    }
  }

  function setLoadingState() {
    setText("conditionLocationLabel", `${currentRegion} · ${labelMode(currentMode)}`);
    setText("conditionWaterTemp", "--°");
    setText("conditionAirTemp", "water · air --°F");
    setText("conditionRating", "Loading");

    setText("conditionWind", "--");
    setText("conditionWindDir", "--");

    setText("conditionForecast", "--");
    setText("conditionCloudRain", "Cloud / rain");

    setText("conditionSwell", "--");
    setText("conditionSwellPeriod", "Loading");
    setText("conditionTide", "--");
    setText("conditionNextTide", "Loading tide window");
    setText("conditionVisibility", "--");
    setText("conditionClarity", "--");
    setText("conditionMoon", "--");
    setText("conditionSunrise", "--");
    setText("conditionSunset", "--");
    setText("conditionAdvisory", "--");
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

    debug("NOAA RESPONSE:", {
      date,
      weather,
      tides,
      waterTemp,
      marine
    });

    const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
    const gusts = Number(weather?.windGusts || 0);

    const currentWaterTemp = Number(waterTemp || base.fallbackWater || 65);

    const temp = estimateFutureWaterTemp(
      currentWaterTemp,
      date,
      weather?.temperature
    );

    const waterTempLabel = isToday(date)
      ? "NOAA latest water"
      : "estimated water";

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
      currentWaterTemp,
      temp,
      waterTempLabel,
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
      waterTempLabel,
      swell,
      swellPeriod,
      swellDirection,
      tideMovement,
      score,
      rating
    } = data;

    setText("conditionLocationLabel", `${region} · ${labelMode(mode)} · ${formatDateLabel(date)}`);
    setText("conditionTitle", `${formatDateLabel(date)}'s Conditions`);

setText("conditionWaterTemp", `${Math.round(temp)}°`);
setText("conditionWaterLabel", waterTempLabel);

setText(
  "conditionAirOnlyTemp",
  `${Math.round(weather?.temperature ?? 0) || "--"}°`
);
setText("conditionAirLabel", "Forecast air temp");

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

    setText("conditionForecast", weather?.shortForecast || "Forecast available");

    setText(
      "conditionCloudRain",
      `${weather?.cloudCover ?? "--"}% clouds · ${weather?.precipitationProbability ?? "--"}% rain`
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

    setText("conditionMoon", getMoonPhase(date));
    setText("conditionSunrise", weather?.sunrise || getEstimatedSunrise(date));
    setText("conditionSunset", weather?.sunset || getEstimatedSunset(date));
    setText("conditionAdvisory", wind >= 18 || gusts >= 25 || swell >= 5 ? "Possible" : "None");
  }

  async function renderAllRegions(date, activeRequest) {
    const grid = document.getElementById("allRegionsGrid");
    const title = document.getElementById("allRegionsTitle");

    if (!grid) return;

    if (title) {
      title.textContent = `All regions · ${labelMode(currentMode)} · ${formatDateLabel(date)}`;
    }

    grid.innerHTML = `<div class="loading-card">Loading regional board...</div>`;

    const cards = [];

    for (const [region, base] of Object.entries(LOCATIONS)) {
      if (activeRequest !== requestId) return;

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
                <small>Air</small>
                <b>${Math.round(data.weather?.temperature ?? data.temp)}°</b>
              </div>
              <div>
                <small>${isToday(date) ? "Water Now" : "Water Est."}</small>
                <b>${Math.round(data.temp)}°</b>
              </div>
            </div>

            <div class="region-details">
              <p><span>Forecast</span>${safe(data.weather?.shortForecast || "Available")}</p>
              <p><span>Clouds</span>${data.weather?.cloudCover ?? "--"}%</p>
              <p><span>Rain</span>${data.weather?.precipitationProbability ?? "--"}%</p>
              <p><span>Swell</span>${data.swell.toFixed(1)} ft</p>
              <p><span>Tide</span>${safe(data.tideMovement)}</p>
              <p><span>Moon</span>${safe(getMoonPhase(date))}</p>
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

    if (activeRequest === requestId) {
      grid.innerHTML = cards.join("");
    }
  }

  function estimateFutureWaterTemp(currentWaterTemp, dateString, airTemp) {
    const today = new Date(`${getTodayString()}T12:00:00`);
    const target = new Date(`${dateString}T12:00:00`);

    const daysAhead = Math.max(
      0,
      Math.round((target - today) / 86400000)
    );

    if (daysAhead === 0) {
      return roundOne(currentWaterTemp);
    }

    const air = Number(airTemp || 70);
    const airInfluence = (air - currentWaterTemp) * 0.08;
    const seasonalTrend = getSeasonalWaterTrend(dateString);

    const estimate =
      currentWaterTemp +
      daysAhead * seasonalTrend +
      airInfluence;

    const limitedEstimate = clamp(
      estimate,
      currentWaterTemp - 3,
      currentWaterTemp + 3
    );

    return roundOne(limitedEstimate);
  }

  function getSeasonalWaterTrend(dateString) {
    const month = getDateMonth(dateString);

    if (month >= 4 && month <= 8) return 0.15;
    if (month >= 9 && month <= 11) return -0.12;

    return -0.03;
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

    if (nextIndex <= 0) nextIndex = 1;

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

    if (isToday(selectedDate)) {
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

  function formatDateLabel(dateString) {
    if (!dateString) return "Today";

    const today = getTodayString();

    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = toLocalDateString(tomorrowDate);

    if (dateString === today) return "Today";
    if (dateString === tomorrow) return "Tomorrow";

    const date = new Date(`${dateString}T12:00:00`);

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  }

  function getMoonPhase(dateString) {
    const date = dateString
      ? new Date(`${dateString}T12:00:00`)
      : new Date();

    const knownNewMoon = new Date("2026-06-10T12:00:00");
    const lunarCycle = 29.53058867;

    const daysSinceNewMoon = (date - knownNewMoon) / 86400000;
    const moonAge = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle;

    const illumination = Math.round(
      (1 - Math.cos((2 * Math.PI * moonAge) / lunarCycle)) * 50
    );

    let phase = "New Moon";

    if (moonAge < 1.84566) phase = "New Moon";
    else if (moonAge < 5.53699) phase = "Waxing Crescent";
    else if (moonAge < 9.22831) phase = "First Quarter";
    else if (moonAge < 12.91963) phase = "Waxing Gibbous";
    else if (moonAge < 16.61096) phase = "Full Moon";
    else if (moonAge < 20.30228) phase = "Waning Gibbous";
    else if (moonAge < 23.99361) phase = "Last Quarter";
    else if (moonAge < 27.68493) phase = "Waning Crescent";

    return `${phase} ${illumination}%`;
  }

  function getEstimatedSunrise(dateString) {
    const month = getDateMonth(dateString);

    if (month >= 5 && month <= 8) return "5:45 AM";
    if (month >= 3 && month <= 4) return "6:20 AM";
    if (month >= 9 && month <= 10) return "6:35 AM";

    return "6:50 AM";
  }

  function getEstimatedSunset(dateString) {
    const month = getDateMonth(dateString);

    if (month >= 5 && month <= 8) return "8:00 PM";
    if (month >= 3 && month <= 4) return "7:15 PM";
    if (month >= 9 && month <= 10) return "6:45 PM";

    return "5:00 PM";
  }

  function getDateMonth(dateString) {
    const date = dateString
      ? new Date(`${dateString}T12:00:00`)
      : new Date();

    return date.getMonth() + 1;
  }

  function isToday(dateString) {
    return dateString === getTodayString();
  }

  function getTodayString() {
    return toLocalDateString(new Date());
  }

  function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundOne(value) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return Number(Number(value).toFixed(1));
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

  function debug(...args) {
    if (DEBUG) console.log("[conditions.js]", ...args);
  }
})();
