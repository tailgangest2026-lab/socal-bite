(() => {
  const countyData = {
    "Santa Barbara County": { lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, surf: 2.8 },
    "Ventura County": { lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, surf: 3.0 },
    "Los Angeles County": { lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, surf: 2.6 },
    "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", water: 66, surf: 2.5 },
    "San Diego County": { lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, surf: 2.4 }
  };

  document.addEventListener("DOMContentLoaded", () => {
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

    document.getElementById("beachConditionsSummary").innerHTML = `<div class="loading-card">Loading live beach conditions...</div>`;

    const [weather, tides, waterTemp] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, date),
      SCBConditions.getTides(base.station, date),
      SCBConditions.getWaterTemp(base.station)
    ]);

    const wind = SCBConditions.parseWindSpeed(weather.windSpeed, 8);
    const temp = waterTemp || base.water;
    const tideMovement = getTideMovement(tides);
    const score = calculateBeachScore(wind, base.surf, temp, tideMovement, weather);
    const rating = SCBConditions.rating(score);

    document.getElementById("beachConditionsUpdated").textContent =
      `Showing live weather and NOAA tide data for ${beach}.`;

document.getElementById("beachConditionsSummary").innerHTML = `
  <div class="condition-card weather-card">
    <h3><i class="fa-solid fa-cloud-sun"></i> Weather Conditions</h3>

    <div class="condition-grid">
      <div><strong>Forecast:</strong> ${weather.shortForecast}</div>
      <div><strong>Air Temp:</strong> ${Math.round(weather.temperature)}°F</div>
      <div><strong>Wind:</strong> ${wind} mph ${weather.windDirection}</div>
      <div><strong>Wind Gusts:</strong> ${value(weather.windGusts," mph")}</div>
      <div><strong>Rain Chance:</strong> ${value(weather.precipitationProbability,"%")}</div>
      <div><strong>Cloud Cover:</strong> ${value(weather.cloudCover,"%")}</div>
      <div><strong>Humidity:</strong> ${value(weather.humidity,"%")}</div>
      <div><strong>UV Index:</strong> ${value(weather.uvIndex)}</div>
    </div>
  </div>

  <div class="condition-card water-card">
    <h3><i class="fa-solid fa-person-swimming"></i> Surf Conditions</h3>

    <div class="condition-grid">
      <div><strong>Water Temp:</strong> ${Number(temp).toFixed(1)}°F</div>
      <div><strong>Surf Height:</strong> ${base.surf.toFixed(1)} ft</div>
      <div><strong>Tide Movement:</strong> ${tideMovement}</div>
      <div><strong>Visibility:</strong> ${value(weather.visibility," mi")}</div>
      <div><strong>Pressure:</strong> ${value(weather.pressure," mb")}</div>
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

    document.getElementById("beachTideTable").innerHTML = tideTable(SCBConditions.formatTides(tides));

    document.getElementById("beachForecastNotes").innerHTML = `
      <p><strong>${beach}:</strong> Best surf fishing usually happens with clean water, light wind, lower gusts, manageable surf, and moving tide.</p>
      <p>For corbina and croaker, look for troughs, holes, sand crab beds, and soft current edges.</p>
      <p><strong>Data sources:</strong> NOAA tides/water temperature + Open-Meteo weather.</p>
    `;
  }

  function calculateBeachScore(wind, surf, waterTemp, tideMovement, weather) {
    let score = 78;

    if (surf <= 2.8) score += 10;
    else if (surf > 4) score -= 18;

    if (wind <= 8) score += 8;
    else if (wind > 12) score -= 15;

    if ((weather.windGusts || 0) > 20) score -= 10;
    if ((weather.precipitationProbability || 0) > 40) score -= 8;
    if ((weather.uvIndex || 0) > 7) score -= 3;

    if (waterTemp >= 64 && waterTemp <= 69) score += 8;
    else if (waterTemp < 61) score -= 8;

    if (tideMovement === "Strong") score += 8;
    if (tideMovement === "Weak") score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function getBeachTargets(county) {
    if (county === "San Diego County") return ["Corbina", "Croaker", "Halibut", "Leopard Shark", "Surfperch"];
    if (county === "Orange County") return ["Corbina", "Spotfin Croaker", "Yellowfin Croaker", "Halibut", "Surfperch"];
    if (county === "Los Angeles County") return ["Corbina", "Croaker", "Halibut", "Leopard Shark", "Surfperch"];
    return ["Surfperch", "Halibut", "Croaker", "Leopard Shark"];
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
