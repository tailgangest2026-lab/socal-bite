(() => {
  const countyData = {
    "Santa Barbara County": { lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, swell: 2.4 },
    "Ventura County": { lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, swell: 2.8 },
    "Los Angeles County": { lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, swell: 2.4 },
    "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", water: 66, swell: 2.3 },
    "San Diego County": { lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, swell: 2.3 }
  };

  document.addEventListener("DOMContentLoaded", () => {
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

    document.getElementById("pierConditionsSummary").innerHTML = `<div class="loading-card">Loading live pier conditions...</div>`;

    const [weather, tides, waterTemp] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, date),
      SCBConditions.getTides(base.station, date),
      SCBConditions.getWaterTemp(base.station)
    ]);

    const wind = SCBConditions.parseWindSpeed(weather.windSpeed, 8);
    const temp = waterTemp || base.water;
    const tideMovement = getTideMovement(tides);
    const baitActivity = getBaitActivity(wind, tideMovement, weather);
    const score = calculatePierScore(wind, base.swell, temp, tideMovement, baitActivity, weather);
    const rating = SCBConditions.rating(score);

    document.getElementById("pierConditionsUpdated").textContent =
      `Showing live weather and NOAA tide data for ${pier}.`;

    document.getElementById("pierConditionsSummary").innerHTML = `
      ${card("Wind", `${wind} mph`, `${weather.windDirection || "W"} wind`)}
      ${card("Wind Gusts", value(weather.windGusts, "mph"), "Open-Meteo forecast")}
      ${card("Rain Chance", value(weather.precipitationProbability, "%"), "Precipitation probability")}
      ${card("Cloud Cover", value(weather.cloudCover, "%"), "Sky cover")}
      ${card("UV Index", value(weather.uvIndex), "Sun exposure")}
      ${card("Water Temp", `${Number(temp).toFixed(1)}°F`, "Nearest NOAA station")}
      ${card("Tide Movement", tideMovement, "Based on tide range")}
      ${card("Bait Activity", baitActivity, "Estimated pier activity")}
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

    document.getElementById("pierTideTable").innerHTML = tideTable(SCBConditions.formatTides(tides));

    document.getElementById("pierForecastNotes").innerHTML = `
      <p><strong>${pier}:</strong> Best pier fishing usually happens with moving tide, bait around the pier, clean water, light wind, and lower gusts.</p>
      <p>For mackerel and bonito, watch for bait schools, birds, current breaks, and surface activity near the end of the pier.</p>
      <p><strong>Data sources:</strong> NOAA tides/water temperature + Open-Meteo weather.</p>
    `;
  }

  function calculatePierScore(wind, swell, waterTemp, tideMovement, baitActivity, weather) {
    let score = 78;

    if (wind <= 8) score += 8;
    else if (wind > 12) score -= 15;

    if ((weather.windGusts || 0) > 20) score -= 10;
    if ((weather.precipitationProbability || 0) > 40) score -= 8;
    if ((weather.uvIndex || 0) > 7) score -= 3;

    if (swell <= 2.8) score += 6;
    else if (swell > 4) score -= 12;

    if (waterTemp >= 64 && waterTemp <= 69) score += 8;
    else if (waterTemp < 61) score -= 8;

    if (tideMovement === "Strong") score += 8;
    if (tideMovement === "Weak") score -= 5;

    if (baitActivity === "High") score += 8;
    if (baitActivity === "Low") score -= 4;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function getBaitActivity(wind, tideMovement, weather) {
    if (wind <= 8 && tideMovement === "Strong" && (weather.cloudCover || 0) < 80) return "High";
    if (wind > 13 || (weather.precipitationProbability || 0) > 50) return "Low";
    return "Medium";
  }

  function getPierTargets(county) {
    if (county === "San Diego County") return ["Mackerel", "Bonito", "Halibut", "Spotted Bay Bass", "Shark/Ray"];
    if (county === "Orange County") return ["Mackerel", "Bonito", "Halibut", "Croaker", "Stingray"];
    if (county === "Los Angeles County") return ["Mackerel", "Bonito", "Halibut", "Croaker", "Bass"];
    return ["Mackerel", "Surfperch", "Halibut", "Shark/Ray"];
  }

  function getTideMovement(tides) {
    const heights = tides.map(t => Number(t.v)).filter(n => !isNaN(n));
    if (heights.length < 2) return "Moderate";
    const range = Math.max(...heights) - Math.min(...heights);
    if (range >= 4) return "Strong";
    if (range >= 2) return "Moderate";
    return "Weak";
  }

  function card(title, big, sub) {
    return `<div class="condition-card"><h3>${title}</h3><p class="big-number">${big}</p><span>${sub}</span></div>`;
  }

  function value(v, suffix = "") {
    return v === null || v === undefined ? "N/A" : `${Math.round(v)}${suffix}`;
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
})();
