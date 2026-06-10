(() => {
  const countyData = {
    "Santa Barbara County": { lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, swell: 2.4 },
    "Ventura County": { lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, swell: 2.8 },
    "Los Angeles County": { lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, swell: 2.4 },
    "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", water: 66, swell: 2.3 },
    "San Diego County": { lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, swell: 2.3 }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before pier-conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 10);
    document.getElementById("pierSelect")?.addEventListener("change", loadPierConditions);
    document.getElementById("dateSelect")?.addEventListener("change", loadPierConditions);
  });

  async function loadPierConditions() {
    const pierSelect = document.getElementById("pierSelect");
    const pier = pierSelect?.value;
    const date = document.getElementById("dateSelect")?.value || new Date().toISOString().split("T")[0];

    if (!pier) return;

    const county = pierSelect.selectedOptions[0].parentElement.label;
    const base = countyData[county] || countyData["Los Angeles County"];

    document.getElementById("pierConditionsSummary").innerHTML =
      `<div class="loading-card">Loading live pier conditions...</div>`;

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
      const baitActivity = getBaitActivity(wind, gusts, tideMovement, weather);

      const scoreBreakdown = calculatePierScore({
        wind,
        gusts,
        swell,
        waterTemp: temp,
        tideMovement,
        baitActivity,
        rainChance: weather?.precipitationProbability,
        uvIndex: weather?.uvIndex
      });

      const score = scoreBreakdown.finalScore;
      const rating = getRating(score);

      document.getElementById("pierConditionsUpdated").textContent =
        `Showing live weather and NOAA tide data for ${pier}.`;

      document.getElementById("pierConditionsSummary").innerHTML = `
        <div class="condition-card weather-card">
          <h3><i class="fa-solid fa-cloud-sun"></i> Weather Conditions</h3>

          <div class="condition-grid">
            <div><strong>Forecast:</strong> ${weather?.shortForecast || "Forecast available"}</div>
            <div><strong>Air Temp:</strong> ${formatValue(weather?.temperature, "°F")}</div>
            <div><strong>Wind:</strong> ${wind} mph ${weather?.windDirection || "W"}</div>
            <div><strong>Wind Gusts:</strong> ${formatValue(gusts, " mph")}</div>
            <div><strong>Rain Chance:</strong> ${formatValue(weather?.precipitationProbability, "%")}</div>
            <div><strong>Cloud Cover:</strong> ${formatValue(weather?.cloudCover, "%")}</div>
            <div><strong>Humidity:</strong> ${formatValue(weather?.humidity, "%")}</div>
            <div><strong>UV Index:</strong> ${formatValue(weather?.uvIndex)}</div>
          </div>
        </div>

        <div class="condition-card water-card">
          <h3><i class="fa-solid fa-fish-fins"></i> Pier Conditions</h3>

          <div class="condition-grid">
            <div><strong>Water Temp:</strong> ${temp.toFixed(1)}°F</div>
            <div><strong>Swell:</strong> ${swell.toFixed(1)} ft</div>
            <div><strong>Tide Movement:</strong> ${tideMovement}</div>
            <div><strong>Bait Activity:</strong> ${baitActivity}</div>
            <div><strong>Visibility:</strong> ${formatValue(weather?.visibility, " mi")}</div>
            <div><strong>Fishing Score:</strong> ${score}/100</div>
          </div>
        </div>
      `;

      document.getElementById("pierScoreCard").innerHTML = `
        <div class="score-circle">${score}</div>
        <div>
          <span class="forecast-kicker">Pier Fishing Score</span>
          <h3>${rating} Pier Fishing Conditions</h3>
          <p>${pier} has a ${rating.toLowerCase()} setup based on wind, gusts, rain chance, water temperature, tide movement, UV, and estimated bait activity.</p>
        </div>
      `;

      document.getElementById("pierSpeciesTargets").innerHTML = `
        <div class="species-pill-wrap">
          ${getPierTargets(county).map(s => `<span class="species-pill">${s}</span>`).join("")}
        </div>
      `;

      document.getElementById("pierTideTable").innerHTML =
        tideTable(SCBConditions.formatTides(tides));

      document.getElementById("pierForecastNotes").innerHTML = `
        <p><strong>${pier}</strong> currently shows <strong>${rating}</strong> pier fishing conditions.</p>
        <p>Water temperatures around ${temp.toFixed(1)}°F combined with ${tideMovement.toLowerCase()} tidal movement should help shape mackerel, bonito, halibut, croaker, bass, and shark/ray activity.</p>
        <p>Bait activity is estimated as <strong>${baitActivity}</strong>.</p>
        <p><strong>Score breakdown:</strong> Wind ${scoreBreakdown.windScore}, Swell ${scoreBreakdown.swellScore}, Water Temp ${scoreBreakdown.tempScore}, Tide ${scoreBreakdown.tideScore}, Bait ${scoreBreakdown.baitScore}, Rain ${scoreBreakdown.rainScore}, UV ${scoreBreakdown.uvScore}.</p>
      `;
    } catch (error) {
      console.error("Pier conditions error:", error);
      document.getElementById("pierConditionsSummary").innerHTML =
        `<div class="loading-card">Pier conditions could not be loaded. Check the console.</div>`;
    }
  }

  function calculatePierScore(data) {
    const windScore = getWindScore(data.wind, data.gusts);
    const swellScore = getSwellScore(data.swell);
    const tempScore = getWaterTempScore(data.waterTemp);
    const tideScore = getTideScore(data.tideMovement);
    const baitScore = getBaitScore(data.baitActivity);
    const rainScore = getRainScore(data.rainChance);
    const uvScore = getUvScore(data.uvIndex);

    const finalScore = Math.round(
      windScore * 0.24 +
      swellScore * 0.14 +
      tempScore * 0.16 +
      tideScore * 0.18 +
      baitScore * 0.18 +
      rainScore * 0.06 +
      uvScore * 0.04
    );

    return {
      finalScore: Math.max(0, Math.min(100, finalScore)),
      windScore,
      swellScore,
      tempScore,
      tideScore,
      baitScore,
      rainScore,
      uvScore
    };
  }

  function getWindScore(wind, gusts) {
    if (!wind && !gusts) return 55;
    if (wind <= 5 && gusts <= 10) return 90;
    if (wind <= 8 && gusts <= 15) return 82;
    if (wind <= 11 && gusts <= 20) return 70;
    if (wind <= 15 && gusts <= 25) return 55;
    if (wind <= 20 && gusts <= 32) return 38;
    return 22;
  }

  function getSwellScore(swell) {
    if (!swell) return 55;
    if (swell <= 1.5) return 88;
    if (swell <= 2.5) return 80;
    if (swell <= 3.5) return 68;
    if (swell <= 4.5) return 50;
    if (swell <= 6) return 32;
    return 18;
  }

  function getWaterTempScore(temp) {
    if (!temp) return 55;
    if (temp >= 64 && temp <= 68) return 88;
    if (temp >= 61 && temp < 64) return 74;
    if (temp > 68 && temp <= 72) return 74;
    if (temp >= 58 && temp < 61) return 58;
    if (temp > 72 && temp <= 76) return 56;
    return 38;
  }

  function getTideScore(tideMovement) {
    if (tideMovement === "Strong") return 84;
    if (tideMovement === "Moderate") return 72;
    if (tideMovement === "Weak") return 48;
    return 55;
  }

  function getBaitScore(baitActivity) {
    if (baitActivity === "High") return 86;
    if (baitActivity === "Medium") return 68;
    if (baitActivity === "Low") return 42;
    return 55;
  }

  function getRainScore(rainChance) {
    if (rainChance === null || rainChance === undefined) return 60;
    if (rainChance <= 5) return 82;
    if (rainChance <= 15) return 74;
    if (rainChance <= 30) return 60;
    if (rainChance <= 50) return 42;
    return 25;
  }

  function getUvScore(uvIndex) {
    if (uvIndex === null || uvIndex === undefined) return 65;
    if (uvIndex <= 3) return 82;
    if (uvIndex <= 6) return 72;
    if (uvIndex <= 8) return 58;
    return 45;
  }

  function getBaitActivity(wind, gusts, tideMovement, weather) {
    const rainChance = weather?.precipitationProbability || 0;
    const cloudCover = weather?.cloudCover || 0;

    if (wind <= 8 && gusts <= 16 && tideMovement === "Strong" && rainChance <= 25) return "High";
    if (wind > 15 || gusts > 28 || rainChance > 50) return "Low";
    if (tideMovement === "Moderate" || cloudCover >= 30) return "Medium";
    return "Medium";
  }

  function getTideMovement(tides) {
    const heights = tides.map(t => Number(t.v)).filter(n => Number.isFinite(n));
    if (heights.length < 2) return "Unknown";
    const range = Math.max(...heights) - Math.min(...heights);
    if (range >= 4) return "Strong";
    if (range >= 1.5) return "Moderate";
    return "Weak";
  }

  function getPierTargets(county) {
    if (county === "San Diego County") return ["Mackerel", "Bonito", "Halibut", "Spotted Bay Bass", "Shark/Ray"];
    if (county === "Orange County") return ["Mackerel", "Bonito", "Halibut", "Croaker", "Stingray"];
    if (county === "Los Angeles County") return ["Mackerel", "Bonito", "Halibut", "Croaker", "Bass"];
    return ["Mackerel", "Surfperch", "Halibut", "Shark/Ray"];
  }

  function getRating(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Fair";
    return "Slow";
  }

  function tideTable(tides) {
    return `
      <table>
        <thead><tr><th>Time</th><th>Tide</th><th>Height</th></tr></thead>
        <tbody>
          ${tides.map(t => `<tr><td>${t.time}</td><td>${t.type}</td><td>${t.height}</td></tr>`).join("")}
        </tbody>
      </table>
    `;
  }

  function formatValue(value, suffix = "") {
    if (value === null || value === undefined || value === "" || Number.isNaN(value)) return "N/A";
    if (typeof value === "number") return `${Math.round(value)}${suffix}`;
    return `${value}${suffix}`;
  }
})();
