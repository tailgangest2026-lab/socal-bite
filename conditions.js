(() => {
  const boatRegions = {
    "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340", water: 61, swell: 2.8, targets: ["Rockfish", "Whitefish", "Sheephead", "Lingcod"] },
    "Ventura": { lat: 34.2746, lon: -119.2290, station: "9411189", water: 62, swell: 3.0, targets: ["Rockfish", "Whitefish", "Calico Bass", "Yellowtail"] },
    "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660", water: 65, swell: 2.6, targets: ["Calico Bass", "Rockfish", "Sculpin", "Yellowtail"] },
    "Orange County": { lat: 33.6037, lon: -117.9000, station: "9410580", water: 66, swell: 2.5, targets: ["Yellowtail", "Calico Bass", "Bonito", "Barracuda"] },
    "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170", water: 67, swell: 2.4, targets: ["Yellowtail", "Tuna", "Bonito", "Calico Bass"] }
  };

  document.addEventListener("DOMContentLoaded", () => {
    SCBConditions.buildDateDropdown("dateSelect", 10);
    document.getElementById("regionSelect")?.addEventListener("change", loadBoatConditions);
    document.getElementById("dateSelect")?.addEventListener("change", loadBoatConditions);
    loadBoatConditions();
  });

  async function loadBoatConditions() {
    const region = document.getElementById("regionSelect")?.value || "Los Angeles";
    const date = document.getElementById("dateSelect")?.value || new Date().toISOString().split("T")[0];
    const base = boatRegions[region];

    document.getElementById("conditionsSummary").innerHTML = `<div class="loading-card">Loading live conditions...</div>`;

    const [weather, tides, waterTemp] = await Promise.all([
      SCBConditions.getWeather(base.lat, base.lon, date),
      SCBConditions.getTides(base.station, date),
      SCBConditions.getWaterTemp(base.station)
    ]);

    const wind = SCBConditions.parseWindSpeed(weather.windSpeed, 8);
    const temp = waterTemp || base.water;
    const tideMovement = getTideMovement(tides);
    const score = calculateScore(wind, base.swell, temp, tideMovement, weather);
    const rating = SCBConditions.rating(score);

    document.getElementById("conditionsUpdated").textContent =
      `Showing live weather and NOAA tide data for ${region}.`;

document.getElementById("conditionsSummary").innerHTML = `
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
    <h3><i class="fa-solid fa-water"></i> Water Conditions</h3>

    <div class="condition-grid">
      <div><strong>Water Temp:</strong> ${Number(temp).toFixed(1)}°F</div>
      <div><strong>Swell:</strong> ${base.swell} ft</div>
      <div><strong>Tide Movement:</strong> ${tideMovement}</div>
      <div><strong>Visibility:</strong> ${value(weather.visibility," mi")}</div>
      <div><strong>Pressure:</strong> ${value(weather.pressure," mb")}</div>
    </div>
  </div>
`;

    document.getElementById("biteScoreCard").innerHTML = `
      <div class="score-circle">${score}</div>
      <div>
        <span class="forecast-kicker">Boat Fishing Score</span>
        <h3>${rating} Boat Conditions</h3>
        <p>${region} has a ${rating.toLowerCase()} setup based on wind, gusts, weather, water temperature, swell, and tide movement.</p>
      </div>
    `;

    document.getElementById("tideTable").innerHTML = tideTable(SCBConditions.formatTides(tides));

    document.getElementById("forecastNotes").innerHTML = `
      <p><strong>${region}:</strong> Best boat fishing usually lines up with light wind, lower gusts, manageable swell, clean water, and moving tide.</p>
      <p><strong>Likely targets:</strong> ${base.targets.join(", ")}</p>
      <p><strong>Data sources:</strong> NOAA tides/water temperature + Open-Meteo weather.</p>
    `;
  }

  function calculateScore(wind, swell, waterTemp, tideMovement, weather) {
    let score = 78;

    if (wind <= 8) score += 10;
    else if (wind > 12) score -= 18;

    if ((weather.windGusts || 0) > 20) score -= 10;
    if ((weather.precipitationProbability || 0) > 40) score -= 8;
    if ((weather.uvIndex || 0) > 7) score -= 3;

    if (swell <= 3) score += 8;
    else if (swell > 4) score -= 15;

    if (waterTemp >= 64 && waterTemp <= 69) score += 8;
    else if (waterTemp < 60) score -= 8;

    if (tideMovement === "Strong") score += 8;
    if (tideMovement === "Weak") score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
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
