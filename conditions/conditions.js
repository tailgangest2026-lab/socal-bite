(() => {
  const DEBUG = true;
  const TIME_ZONE = "America/Los_Angeles";

  const REGION_ORDER = [
    "NorCal",
    "San Francisco Bay",
    "Alameda County",
    "Monterey County",
    "Central California",
    "San Luis Obispo County",
    "Santa Barbara County",
    "Ventura County",
    "Los Angeles County",
    "Orange County",
    "San Diego County"
  ];

  const LOCATIONS = {
    "NorCal": {
      lat: 38.4404,
      lon: -123.1190,
      tideStations: ["9415625"],
      waterStations: ["9415625"],
      marineBuoys: ["46013"]
    },
    "San Francisco Bay": {
      lat: 37.8060,
      lon: -122.4659,
      tideStations: ["9414290"],
      waterStations: ["9414290"],
      marineBuoys: ["46026"]
    },
    "Alameda County": {
      lat: 37.7749,
      lon: -122.2960,
      tideStations: ["9414750", "9414290"],
      waterStations: ["9414750", "9414290"],
      marineBuoys: ["46026"]
    },
    "Monterey County": {
      lat: 36.6002,
      lon: -121.8947,
      tideStations: ["9413450"],
      waterStations: ["9413450"],
      marineBuoys: ["46042"]
    },
    "Central California": {
      lat: 35.3658,
      lon: -120.8499,
      tideStations: ["9412110"],
      waterStations: ["9412110"],
      marineBuoys: ["46011", "46028"]
    },
    "San Luis Obispo County": {
      lat: 35.2828,
      lon: -120.6596,
      tideStations: ["9412110"],
      waterStations: ["9412110"],
      marineBuoys: ["46011", "46028"]
    },
    "Santa Barbara County": {
      lat: 34.4208,
      lon: -119.6982,
      tideStations: ["9411340"],
      waterStations: ["9411340"],
      marineBuoys: ["46054", "46053"]
    },
    "Ventura County": {
      lat: 34.2746,
      lon: -119.2290,
      tideStations: ["9411189"],
      waterStations: ["9411189"],
      marineBuoys: ["46053", "46025"]
    },
    "Los Angeles County": {
      lat: 33.7405,
      lon: -118.2817,
      tideStations: ["9410660"],
      waterStations: ["9410660"],
      marineBuoys: ["46222", "46025"]
    },
    "Orange County": {
      lat: 33.6037,
      lon: -117.9000,
      tideStations: ["9410580"],
      waterStations: ["9410580"],
      marineBuoys: ["46256", "46222"]
    },
    "San Diego County": {
      lat: 32.7157,
      lon: -117.1611,
      tideStations: ["9410170", "9410230"],
      waterStations: ["9410170", "9410230"],
      marineBuoys: ["46258", "46232"]
    }
  };

  let currentMode = "pier";
  let currentRegion = "Los Angeles County";
  let requestId = 0;

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 14);

    const activeMode = document.querySelector(".mode-tabs button.active");
    if (activeMode?.dataset?.mode) currentMode = normalizeMode(activeMode.dataset.mode);

    const dateSelect = document.getElementById("dateSelect");
    if (dateSelect) {
      dateSelect.addEventListener("change", loadConditions);
    }

    buildModeTabs();
    buildRegionTabs();
    loadConditions();
  });

  function buildModeTabs() {
    document.querySelectorAll(".mode-tabs button").forEach(button => {
      button.addEventListener("click", () => {
        currentMode = normalizeMode(button.dataset.mode || "pier");

        document.querySelectorAll(".mode-tabs button").forEach(btn => {
          btn.classList.remove("active");
        });

        button.classList.add("active");
        loadConditions();
      });
    });
  }

  function buildRegionTabs() {
    const tabs = document.getElementById("regionTabs");
    if (!tabs) return;

    tabs.innerHTML = REGION_ORDER.map(region => `
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
        currentRegion = button.dataset.region || "Los Angeles County";
        buildRegionTabs();
        loadConditions();
      });
    });
  }

  async function loadConditions() {
    const thisRequest = ++requestId;
    const base = LOCATIONS[currentRegion] || LOCATIONS["Los Angeles County"];
    const date = document.getElementById("dateSelect")?.value || getTodayString();

    debug("Loading conditions", { region: currentRegion, mode: currentMode, date, base });

    setLoadingState();

    try {
      const data = await fetchConditionData(base, date);

      if (thisRequest !== requestId) return;

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
      setText("conditionAdvisory", "Data temporarily unavailable");
    }
  }

  function setLoadingState() {
    setText("conditionLocationLabel", `${currentRegion} · ${labelMode(currentMode)}`);
    setText("conditionWaterTemp", "--°");
    setText("conditionAirOnlyTemp", "--°");
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
    const tideStation = base.tideStations[0];

    const [weather, tides, waterResult, marineResult] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, date).catch(() => null),
      SCBConditions.getTides(tideStation, date).catch(() => []),
      getDynamicWaterTemp(base, date),
      getDynamicMarine(base, date)
    ]);
console.log("DATA CHECK", {
  weather,
  tides,
  waterResult,
  marineResult
});
    const wind = parseOptionalNumber(weather?.windSpeed);
    const gusts = parseOptionalNumber(weather?.windGusts);
    const airTemp = parseOptionalNumber(weather?.temperature);

    const waterTemp = waterResult?.value;
    const swell = marineResult?.waveHeight;
    const swellPeriod = marineResult?.wavePeriod;
    const swellDirection = marineResult?.waveDirectionText;

    const tideMovement = getTideMovement(tides, date);
    const astronomy = getAstronomy(base.lat, base.lon, date);

    const score = calculateModeScore({
      mode: currentMode,
      wind,
      gusts,
      swell,
      waterTemp,
      tideMovement,
      rainChance: parseOptionalNumber(weather?.precipitationProbability),
      uvIndex: parseOptionalNumber(weather?.uvIndex)
    });

    return {
      date,
      weather,
      tides,
      waterResult,
      marineResult,
      wind,
      gusts,
      airTemp,
      waterTemp,
      swell,
      swellPeriod,
      swellDirection,
      tideMovement,
      astronomy,
      score,
      rating: getRating(score)
    };
  }

  async function getDynamicWaterTemp(base, date) {
    for (const station of base.waterStations || []) {
      const noaaValue = await getNoaaWaterTemperature(station);
      if (isFiniteNumber(noaaValue)) {
        return {
          value: isToday(date) ? roundOne(noaaValue) : estimateFutureWaterTemp(noaaValue, date),
          source: isToday(date) ? `NOAA ${station}` : `Estimated from NOAA ${station}`
        };
      }

      if (typeof SCBConditions.getWaterTemp === "function") {
        const scbValue = await SCBConditions.getWaterTemp(station).catch(() => null);
        if (isFiniteNumber(Number(scbValue))) {
          return {
            value: isToday(date) ? roundOne(Number(scbValue)) : estimateFutureWaterTemp(Number(scbValue), date),
            source: isToday(date) ? `NOAA ${station}` : `Estimated from NOAA ${station}`
          };
        }
      }
    }

    for (const buoy of base.marineBuoys || []) {
      const buoyData = await getNdbcLatest(buoy);
      if (isFiniteNumber(buoyData?.waterTemp)) {
        return {
          value: isToday(date)
            ? roundOne(buoyData.waterTemp)
            : estimateFutureWaterTemp(buoyData.waterTemp, date),
          source: isToday(date) ? `NDBC ${buoy}` : `Estimated from NDBC ${buoy}`
        };
      }
    }

    return {
      value: null,
      source: "Water temp unavailable"
    };
  }

  async function getDynamicMarine(base, date) {
    let marine = null;

    if (typeof SCBConditions.getMarine === "function") {
      marine = await SCBConditions.getMarine(base.lat, base.lon, date).catch(() => null);
    }

    const marineWave = firstNumber(
      marine?.waveHeight,
      marine?.swellWaveHeight,
      marine?.seas,
      marine?.combinedSeas
    );

    if (isFiniteNumber(marineWave)) {
      return {
        waveHeight: roundOne(marineWave),
        wavePeriod: firstNumber(marine?.wavePeriod, marine?.swellWavePeriod),
        waveDirectionText:
          marine?.waveDirectionText ||
          marine?.swellWaveDirectionText ||
          degreesToCompass(marine?.waveDirection),
        source: "Marine forecast"
      };
    }

    if (isToday(date)) {
      for (const buoy of base.marineBuoys || []) {
        const buoyData = await getNdbcLatest(buoy);
        if (isFiniteNumber(buoyData?.waveHeight)) {
          return {
            waveHeight: roundOne(buoyData.waveHeight),
            wavePeriod: buoyData.wavePeriod,
            waveDirectionText: buoyData.waveDirectionText,
            source: `NDBC ${buoy}`
          };
        }
      }
    }

    return {
      waveHeight: null,
      wavePeriod: null,
      waveDirectionText: null,
      source: "Marine data unavailable"
    };
  }

  async function getNoaaWaterTemperature(station) {
    const url =
      "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
      `?date=latest&station=${encodeURIComponent(station)}` +
      "&product=water_temperature&datum=MLLW&time_zone=lst_ldt" +
      "&units=english&format=json";

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const json = await response.json();
      const row = Array.isArray(json?.data) ? json.data[0] : null;
      const value = Number(row?.v);

      return isFiniteNumber(value) ? value : null;
    } catch (error) {
      debug("NOAA water temp failed", station, error);
      return null;
    }
  }

  async function getNdbcLatest(station) {
    const url = `https://www.ndbc.noaa.gov/data/realtime2/${encodeURIComponent(station)}.txt`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const text = await response.text();
      const lines = text.trim().split(/\n+/);
      if (lines.length < 3) return null;

      const headers = lines[0].replace(/^#/, "").trim().split(/\s+/);
      const units = lines[1].replace(/^#/, "").trim().split(/\s+/);

      for (let i = 2; i < lines.length; i++) {
        const values = lines[i].trim().split(/\s+/);
        const row = {};

        headers.forEach((key, index) => {
          row[key] = values[index];
        });

        const waveMeters = parseNdbcNumber(row.WVHT);
        const waterC = parseNdbcNumber(row.WTMP);
        const period = parseNdbcNumber(row.DPD || row.APD);
        const direction = parseNdbcNumber(row.MWD);

        if (
          isFiniteNumber(waveMeters) ||
          isFiniteNumber(waterC) ||
          isFiniteNumber(period)
        ) {
          return {
            waveHeight: isFiniteNumber(waveMeters) ? metersToFeet(waveMeters) : null,
            waterTemp: isFiniteNumber(waterC) ? celsiusToFahrenheit(waterC) : null,
            wavePeriod: isFiniteNumber(period) ? period : null,
            waveDirectionText: isFiniteNumber(direction) ? degreesToCompass(direction) : null,
            units
          };
        }
      }

      return null;
    } catch (error) {
      debug("NDBC latest failed", station, error);
      return null;
    }
  }

  function renderMainConditions(data) {
    const {
      mode,
      region,
      date,
      weather,
      waterResult,
      marineResult,
      wind,
      gusts,
      airTemp,
      waterTemp,
      swell,
      swellPeriod,
      swellDirection,
      tideMovement,
      astronomy,
      score,
      rating
    } = data;

    setText("conditionLocationLabel", `${region} · ${labelMode(mode)} · ${formatDateLabel(date)}`);
    setText("conditionTitle", `${formatDateLabel(date)} Conditions`);

    setText("conditionWaterTemp", isFiniteNumber(waterTemp) ? `${Math.round(waterTemp)}°` : "--°");
    setText("conditionWaterLabel", waterResult?.source || "Water temp unavailable");

    setText("conditionAirOnlyTemp", isFiniteNumber(airTemp) ? `${Math.round(airTemp)}°` : "--°");
    setText("conditionAirLabel", "Forecast air temp");

    const ratingEl = document.getElementById("conditionRating");
    if (ratingEl) {
      ratingEl.textContent = `${score}/100 · ${rating}`;
      ratingEl.className = ratingClass(score);
    }

    setText("conditionWind", isFiniteNumber(wind) ? `${Math.round(wind)} mph` : "--");
    setText(
      "conditionWindDir",
      isFiniteNumber(gusts)
        ? `Gusts ${Math.round(gusts)} mph`
        : weather?.windDirection || "Wind data unavailable"
    );

    setText("conditionForecast", weather?.shortForecast || "Forecast unavailable");

    setText(
      "conditionCloudRain",
      `${displayNumber(weather?.cloudCover)}% clouds · ${displayNumber(weather?.precipitationProbability)}% rain`
    );

    setText("conditionSwell", isFiniteNumber(swell) ? `${swell.toFixed(1)} ft` : "--");
    setText(
      "conditionSwellPeriod",
      isFiniteNumber(swellPeriod)
        ? `${roundOne(swellPeriod)} sec · ${swellDirection || "--"}`
        : marineResult?.source || "Marine data unavailable"
    );

    setText("conditionTide", tideMovement);
    setText("conditionNextTide", getNextTideLabel(data.tides, date));

    setText("conditionVisibility", estimateVisibility(wind, weather?.visibility));
    setText("conditionClarity", estimateClarity(mode, wind, swell));
    setText("conditionClarityNote", mode === "surf" ? "Surf zone" : mode === "pier" ? "Pier zone" : "Offshore zone");

    setText("conditionMoon", astronomy.moon);
    setText("conditionSunrise", astronomy.sunrise);
    setText("conditionSunset", astronomy.sunset);
    setText("conditionAdvisory", getAdvisory({ wind, gusts, swell, mode }));
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

    for (const region of REGION_ORDER) {
      if (activeRequest !== requestId) return;

      const base = LOCATIONS[region];

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
                <b>${isFiniteNumber(data.airTemp) ? Math.round(data.airTemp) + "°" : "--"}</b>
              </div>
              <div>
                <small>${isToday(date) ? "Water Now" : "Water Est."}</small>
                <b>${isFiniteNumber(data.waterTemp) ? Math.round(data.waterTemp) + "°" : "--"}</b>
              </div>
            </div>

            <div class="region-details">
              <p><span>Forecast</span>${safe(data.weather?.shortForecast || "Unavailable")}</p>
              <p><span>Clouds</span>${displayNumber(data.weather?.cloudCover)}%</p>
              <p><span>Rain</span>${displayNumber(data.weather?.precipitationProbability)}%</p>
              <p><span>Swell</span>${isFiniteNumber(data.swell) ? data.swell.toFixed(1) + " ft" : "--"}</p>
              <p><span>Tide</span>${safe(data.tideMovement)}</p>
              <p><span>Moon</span>${safe(data.astronomy.moon)}</p>
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

  function getAstronomy(lat, lon, dateString) {
    return {
      sunrise: calculateSunTime(lat, lon, dateString, true),
      sunset: calculateSunTime(lat, lon, dateString, false),
      moon: getMoonPhase(dateString)
    };
  }

  function calculateSunTime(lat, lon, dateString, isSunrise) {
    const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date();

    const zenith = 90.833;
    const dayOfYear = getDayOfYear(date);
    const lngHour = lon / 15;

    const t = isSunrise
      ? dayOfYear + ((6 - lngHour) / 24)
      : dayOfYear + ((18 - lngHour) / 24);

    const meanAnomaly = (0.9856 * t) - 3.289;

    let trueLongitude =
      meanAnomaly +
      (1.916 * Math.sin(toRadians(meanAnomaly))) +
      (0.020 * Math.sin(toRadians(2 * meanAnomaly))) +
      282.634;

    trueLongitude = normalizeDegrees(trueLongitude);

    let rightAscension = toDegrees(
      Math.atan(0.91764 * Math.tan(toRadians(trueLongitude)))
    );

    rightAscension = normalizeDegrees(rightAscension);

    const longitudeQuadrant = Math.floor(trueLongitude / 90) * 90;
    const raQuadrant = Math.floor(rightAscension / 90) * 90;

    rightAscension = rightAscension + longitudeQuadrant - raQuadrant;
    rightAscension = rightAscension / 15;

    const sinDeclination = 0.39782 * Math.sin(toRadians(trueLongitude));
    const cosDeclination = Math.cos(Math.asin(sinDeclination));

    const cosHourAngle =
      (Math.cos(toRadians(zenith)) -
        (sinDeclination * Math.sin(toRadians(lat)))) /
      (cosDeclination * Math.cos(toRadians(lat)));

    if (cosHourAngle > 1 || cosHourAngle < -1) return "--";

    let hourAngle = isSunrise
      ? 360 - toDegrees(Math.acos(cosHourAngle))
      : toDegrees(Math.acos(cosHourAngle));

    hourAngle = hourAngle / 15;

    const localMeanTime =
      hourAngle +
      rightAscension -
      (0.06571 * t) -
      6.622;

    const utcTime = normalizeHours(localMeanTime - lngHour);

    const utcDate = new Date(Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0
    ));

    utcDate.setUTCMinutes(Math.round(utcTime * 60));

    return utcDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: TIME_ZONE
    });
  }

  function getMoonPhase(dateString) {
    const date = dateString ? new Date(`${dateString}T12:00:00`) : new Date();

    const knownNewMoon = new Date("2000-01-06T18:14:00Z");
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

  function estimateFutureWaterTemp(currentWaterTemp, dateString) {
    const today = new Date(`${getTodayString()}T12:00:00`);
    const target = new Date(`${dateString}T12:00:00`);
    const daysAhead = Math.max(0, Math.round((target - today) / 86400000));

    if (!daysAhead) return roundOne(currentWaterTemp);

    const seasonalTrend = getSeasonalWaterTrend(dateString);
    const estimate = currentWaterTemp + daysAhead * seasonalTrend;

    return roundOne(clamp(estimate, currentWaterTemp - 3, currentWaterTemp + 3));
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

    if (isFiniteNumber(wind)) {
      if (wind <= 5) score += 15;
      else if (wind <= 8) score += 10;
      else if (wind <= 12) score += 5;
      else if (wind <= 16) score -= 5;
      else if (wind <= 20) score -= 15;
      else score -= 25;
    }

    if (isFiniteNumber(gusts)) {
      if (gusts > 25) score -= 15;
      else if (gusts > 18) score -= 8;
    }

    if (isFiniteNumber(swell)) {
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

      if (mode === "surf") {
        if (swell >= 2 && swell <= 4) score += 12;
        else if (swell > 6) score -= 15;
        else if (swell < 1.5) score -= 5;
      }
    }

    if (isFiniteNumber(waterTemp)) {
      if (waterTemp >= 63 && waterTemp <= 69) score += 8;
      else if (waterTemp < 58 || waterTemp > 74) score -= 8;
    }

    const tideText = String(tideMovement || "").toLowerCase();

    if (tideText.includes("moving")) score += 10;
    else if (tideText.includes("slack")) score -= 6;

    if (isFiniteNumber(rainChance)) {
      if (rainChance > 60) score -= 15;
      else if (rainChance > 30) score -= 8;
    }

    if (mode === "surf" && isFiniteNumber(uvIndex) && uvIndex > 9) {
      score -= 5;
    }

    return clamp(Math.round(score), 25, 100);
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

    return diff > 0
      ? "Rising / Moving"
      : "Falling / Moving";
  }

  function getNextTideLabel(tides, selectedDate) {
    if (!Array.isArray(tides) || !tides.length) {
      return "Tide data unavailable";
    }

    const parsed = parseTides(tides);

    if (!parsed.length) {
      return "Tide data unavailable";
    }

    const targetTime = getTargetTideTime(selectedDate);

    const next =
      parsed.find(t => t.time > targetTime) ||
      parsed[0];

    return `${next.type} ${next.height.toFixed(1)} ft · ${next.time.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
  }

  function parseTides(tides) {
    return tides
      .map(t => {
        const rawTime = String(
          t.t ||
          t.time ||
          t.date ||
          ""
        ).replace(" ", "T");

        return {
          time: new Date(rawTime),
          height: Number(
            t.v ||
            t.height ||
            t.prediction
          ),
          type:
            t.type === "H"
              ? "High"
              : t.type === "L"
                ? "Low"
                : "Tide"
        };
      })
      .filter(t =>
        !Number.isNaN(t.time.getTime()) &&
        isFiniteNumber(t.height)
      )
      .sort((a, b) => a.time - b.time);
  }

  function getTargetTideTime(selectedDate) {
    if (!selectedDate) return new Date();

    if (isToday(selectedDate)) {
      return new Date();
    }

    return new Date(`${selectedDate}T12:00:00`);
  }

  function estimateVisibility(wind, apiVisibility) {
    const vis = parseOptionalNumber(apiVisibility);

    if (isFiniteNumber(vis)) {
      return `${Math.round(vis)} mi`;
    }

    if (!isFiniteNumber(wind)) {
      return "Unavailable";
    }

    if (wind >= 20) return "Poor";
    if (wind >= 15) return "Reduced";
    if (wind >= 10) return "Fair";

    return "Good";
  }

  function estimateClarity(mode, wind, swell) {
    if (mode === "surf" && isFiniteNumber(swell) && swell > 4) {
      return "Choppy";
    }

    if (isFiniteNumber(wind) && wind > 14) {
      return "Stirred";
    }

    if (isFiniteNumber(swell) && swell < 3) {
      return "Clean";
    }

    return "Fair";
  }

  function getAdvisory({ wind, gusts, swell, mode }) {
    const notes = [];

    if (isFiniteNumber(wind) && wind >= 18) {
      notes.push("Strong Wind");
    }

    if (isFiniteNumber(gusts) && gusts >= 25) {
      notes.push("Wind Gusts");
    }

    if (isFiniteNumber(swell) && swell >= 5) {
      notes.push("Large Swell");
    }

    if (!notes.length) {
      return "None";
    }

    return notes.join(" · ");
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

  function normalizeMode(mode) {
    if (mode === "boat") return "boat";
    if (mode === "beach") return "surf";
    if (mode === "surf") return "surf";
    return "pier";
  }

  function labelMode(mode) {
    if (mode === "boat") return "Boat";
    if (mode === "surf") return "Surf";
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

    return new Date(`${dateString}T12:00:00`)
      .toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
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

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function parseOptionalNumber(value) {
    if (value === null || value === undefined || value === "") return null;

    if (typeof value === "string") {
      const match = value.match(/-?\d+(\.\d+)?/);
      if (!match) return null;
      value = match[0];
    }

    const number = Number(value);
    return isFiniteNumber(number) ? number : null;
  }

  function parseNdbcNumber(value) {
    if (!value || value === "MM") return null;

    const number = Number(value);
    return isFiniteNumber(number) ? number : null;
  }

  function firstNumber(...values) {
    for (const value of values) {
      const number = parseOptionalNumber(value);

      if (isFiniteNumber(number)) {
        return number;
      }
    }

    return null;
  }

  function displayNumber(value) {
    const number = parseOptionalNumber(value);
    return isFiniteNumber(number) ? Math.round(number) : "--";
  }

  function isFiniteNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function metersToFeet(meters) {
    if (!isFiniteNumber(meters)) return null;
    return meters * 3.28084;
  }

  function celsiusToFahrenheit(celsius) {
    if (!isFiniteNumber(celsius)) return null;
    return (celsius * 9 / 5) + 32;
  }

  function degreesToCompass(degrees) {
    const value = parseOptionalNumber(degrees);
    if (!isFiniteNumber(value)) return null;

    const directions = [
      "N", "NNE", "NE", "ENE",
      "E", "ESE", "SE", "SSE",
      "S", "SSW", "SW", "WSW",
      "W", "WNW", "NW", "NNW"
    ];

    const index = Math.round(value / 22.5) % 16;
    return directions[index];
  }

  function toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  function toDegrees(radians) {
    return radians * 180 / Math.PI;
  }

  function normalizeDegrees(value) {
    return ((value % 360) + 360) % 360;
  }

  function normalizeHours(value) {
    return ((value % 24) + 24) % 24;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function roundOne(value) {
    if (!isFiniteNumber(value)) return null;
    return Number(value.toFixed(1));
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value || "--";
    }
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
    if (DEBUG) {
      console.log("[conditions.js]", ...args);
    }
  }
})();
