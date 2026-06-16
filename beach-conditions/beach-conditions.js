(() => {
  const countyData = {
    "Santa Barbara County": { lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, surf: 2.8 },
    "Ventura County": { lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, surf: 3.0 },
    "Los Angeles County": { lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, surf: 2.6 },
    "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", water: 66, surf: 2.5 },
    "San Diego County": { lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, surf: 2.4 }
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (typeof SCBConditions === "undefined") {
      console.error("SCBConditions not found. Load noaa-conditions.js before beach-conditions.js.");
      return;
    }

    SCBConditions.buildDateDropdown("dateSelect", 10);
    document.getElementById("beachSelect")?.addEventListener("change", loadBeachConditions);
    document.getElementById("dateSelect")?.addEventListener("change", loadBeachConditions);
  });

  async function loadBeachConditions() {
    const beachSelect = document.getElementById("beachSelect");
    const beach = beachSelect?.value;
    const date = document.getElementById("dateSelect")?.value || new Date().toISOString().split("T")[0];

    if (!beach) return;

    const county = beachSelect.selectedOptions[0].parentElement.label;
    const base = countyData[county] || countyData["Los Angeles County"];

    document.getElementById("beachConditionsSummary").innerHTML =
      `<div class="loading-card">Loading live beach conditions...</div>`;

    try {
      const [weather, tides, waterTemp] = await Promise.all([
        SCBConditions.getWeather(base.lat, base.lon, date),
        SCBConditions.getTides(base.station, date),
        SCBConditions.getWaterTemp(base.station)
      ]);

      const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, 8);
      const gusts = Number(weather?.windGusts || 0);
      const temp = Number(waterTemp || base.water);
      const surf = Number(base.surf);
      const tideMovement = getTideMovement(tides);

      const scoreBreakdown = calculateBeachScore({
        wind,
        gusts,
        surf,
        waterTemp: temp,
        tideMovement,
        rainChance: weather?.precipitationProbability,
        uvIndex: weather?.uvIndex
      });

      const score = scoreBreakdown.finalScore;
      const rating = getRating(score);

      document.getElementById("beachConditionsUpdated").textContent =
        `Showing live weather and NOAA tide data for ${beach}.`;

      document.getElementById("beachConditionsSummary").innerHTML = `
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
          <h3><i class="fa-solid fa-person-swimming"></i> Surf Conditions</h3>

          <div class="condition-grid">
            <div><strong>Water Temp:</strong> ${temp.toFixed(1)}°F</div>
            <div><strong>Surf Height:</strong> ${surf.toFixed(1)} ft</div>
            <div><strong>Tide Movement:</strong> ${tideMovement}</div>
            <div><strong>Visibility:</strong> ${formatValue(weather?.visibility, " mi")}</div>
            <div><strong>Pressure:</strong> ${formatValue(weather?.pressure, " mb")}</div>
            <div><strong>Fishing Score:</strong> ${score}/100</div>
          </div>
        </div>
      `;

      document.getElementById("beachScoreCard").innerHTML = `
        <div class="score-circle">${score}</div>
        <div>
          <span class="forecast-kicker">Beach Fishing Score</span>
          <h3>${rating} Surf Fishing Conditions</h3>
          <p>${beach} has a ${rating.toLowerCase()} surf fishing setup based on surf, wind, gusts, rain chance, water temperature, UV, and tide movement.</p>
        </div>
      `;

      document.getElementById("beachSpeciesTargets").innerHTML = `
        <div class="species-pill-wrap">
          ${getBeachTargets(county).map(s => `<span class="species-pill">${s}</span>`).join("")}
        </div>
      `;

      document.getElementById("beachTideTable").innerHTML =
        tideTable(SCBConditions.formatTides(tides));

      document.getElementById("beachForecastNotes").innerHTML = `
        <p><strong>${beach}</strong> currently shows <strong>${rating}</strong> surf fishing conditions.</p>
        <p>Water temperatures around ${temp.toFixed(1)}°F combined with ${tideMovement.toLowerCase()} tidal movement should help shape corbina, croaker, surfperch, halibut, and leopard shark activity.</p>
        <p>Wind is forecast around ${wind} mph with gusts reaching ${formatValue(gusts, " mph")}.</p>
        <p><strong>Score breakdown:</strong> Surf ${scoreBreakdown.surfScore}, Wind ${scoreBreakdown.windScore}, Water Temp ${scoreBreakdown.tempScore}, Tide ${scoreBreakdown.tideScore}, Rain ${scoreBreakdown.rainScore}, UV ${scoreBreakdown.uvScore}.</p>
      `;
    } catch (error) {
      console.error("Beach conditions error:", error);
      document.getElementById("beachConditionsSummary").innerHTML =
        `<div class="loading-card">Beach conditions could not be loaded. Check the console.</div>`;
    }
  }

  function calculateBeachScore(data) {
    const surfScore = getSurfScore(data.surf);
    const windScore = getWindScore(data.wind, data.gusts);
    const tempScore = getWaterTempScore(data.waterTemp);
    const tideScore = getTideScore(data.tideMovement);
    const rainScore = getRainScore(data.rainChance);
    const uvScore = getUvScore(data.uvIndex);

    const finalScore = Math.round(
      surfScore * 0.27 +
      windScore * 0.24 +
      tempScore * 0.18 +
      tideScore * 0.16 +
      rainScore * 0.10 +
      uvScore * 0.05
    );

    return {
      finalScore: Math.max(0, Math.min(100, finalScore)),
      surfScore,
      windScore,
      tempScore,
      tideScore,
      rainScore,
      uvScore
    };
  }

  function getSurfScore(surf) {
    if (!surf) return 55;
    if (surf <= 1.5) return 82;
    if (surf <= 2.5) return 88;
    if (surf <= 3.5) return 72;
    if (surf <= 4.5) return 52;
    if (surf <= 6) return 34;
    return 20;
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

  function getTideMovement(tides) {
    const heights = tides.map(t => Number(t.v)).filter(n => Number.isFinite(n));
    if (heights.length < 2) return "Unknown";
    const range = Math.max(...heights) - Math.min(...heights);
    if (range >= 4) return "Strong";
    if (range >= 1.5) return "Moderate";
    return "Weak";
  }

  function getBeachTargets(county) {
    if (county === "San Diego County") return ["Corbina", "Croaker", "Halibut", "Leopard Shark", "Surfperch"];
    if (county === "Orange County") return ["Corbina", "Spotfin Croaker", "Yellowfin Croaker", "Halibut", "Leopard Shark"];
    if (county === "Los Angeles County") return ["Corbina", "Yellowfin Croaker", "Spotfin Croaker", "Halibut", "Leopard Shark"];
    if (county === "Ventura County") return ["Surfperch", "Corbina", "Croaker", "Halibut"];
    return ["Surfperch", "Corbina", "Leopard Shark", "Halibut"];
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
