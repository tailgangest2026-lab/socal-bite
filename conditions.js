const boatRegions = {
  "Santa Barbara": {
    lat: 34.4208,
    lon: -119.6982,
    station: "9411340",
    fallbackWaterTemp: 61,
    fallbackWind: 8,
    fallbackSwell: 2.8,
    targets: ["Rockfish", "Whitefish", "Sheephead", "Lingcod"]
  },
  "Ventura": {
    lat: 34.2746,
    lon: -119.2290,
    station: "9411189",
    fallbackWaterTemp: 62,
    fallbackWind: 9,
    fallbackSwell: 3.0,
    targets: ["Rockfish", "Whitefish", "Calico Bass", "Yellowtail"]
  },
  "Los Angeles": {
    lat: 33.7405,
    lon: -118.2817,
    station: "9410660",
    fallbackWaterTemp: 65,
    fallbackWind: 8,
    fallbackSwell: 2.6,
    targets: ["Calico Bass", "Rockfish", "Sculpin", "Yellowtail"]
  },
  "Orange County": {
    lat: 33.6037,
    lon: -117.9000,
    station: "9410580",
    fallbackWaterTemp: 66,
    fallbackWind: 7,
    fallbackSwell: 2.5,
    targets: ["Yellowtail", "Calico Bass", "Bonito", "Barracuda"]
  },
  "San Diego": {
    lat: 32.7157,
    lon: -117.1611,
    station: "9410170",
    fallbackWaterTemp: 67,
    fallbackWind: 7,
    fallbackSwell: 2.4,
    targets: ["Yellowtail", "Tuna", "Bonito", "Calico Bass"]
  }
};

document.addEventListener("DOMContentLoaded", () => {
  SCBConditions.buildDateDropdown("dateSelect", 7);

  document.getElementById("regionSelect")?.addEventListener("change", loadBoatConditions);
  document.getElementById("dateSelect")?.addEventListener("change", loadBoatConditions);

  loadBoatConditions();
});

async function loadBoatConditions() {
  const region = document.getElementById("regionSelect")?.value || "Los Angeles";
  const date = document.getElementById("dateSelect")?.value || new Date().toISOString().split("T")[0];
  const base = boatRegions[region] || boatRegions["Los Angeles"];

  renderBoatLoading();

  const [weather, tides, waterTemp] = await Promise.all([
    SCBConditions.getWeather(base.lat, base.lon, date),
    SCBConditions.getTides(base.station, date),
    SCBConditions.getWaterTemp(base.station)
  ]);

  const wind = SCBConditions.parseWindSpeed(weather?.windSpeed, base.fallbackWind);
  const windDirection = SCBConditions.getWindDirection(weather?.windDirection, "W");
  const airTemp = weather?.temperature || 70;
  const temp = waterTemp || base.fallbackWaterTemp;
  const swell = base.fallbackSwell;
  const tideList = SCBConditions.formatTides(tides);
  const tideMovement = getTideMovement(tides);
  const score = calculateBoatScore(wind, swell, temp, tideMovement);
  const rating = SCBConditions.rating(score);

  const data = {
    region,
    date,
    airTemp,
    wind,
    windDirection,
    waterTemp: temp,
    swell,
    tideMovement,
    tideList,
    score,
    rating,
    targets: base.targets
  };

  renderBoatConditions(data);
}

function calculateBoatScore(wind, swell, waterTemp, tideMovement) {
  let score = 78;

  if (wind <= 8) score += 10;
  else if (wind > 12) score -= 18;

  if (swell <= 3) score += 8;
  else if (swell > 4) score -= 15;

  if (waterTemp >= 64 && waterTemp <= 69) score += 8;
  else if (waterTemp < 60) score -= 8;

  if (tideMovement === "Strong") score += 8;
  if (tideMovement === "Weak") score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTideMovement(tides) {
  if (!tides || tides.length < 2) return "Moderate";

  const heights = tides.map(t => Number(t.v)).filter(n => !isNaN(n));
  if (heights.length < 2) return "Moderate";

  const range = Math.max(...heights) - Math.min(...heights);

  if (range >= 4) return "Strong";
  if (range >= 2) return "Moderate";
  return "Weak";
}

function renderBoatLoading() {
  document.getElementById("conditionsSummary").innerHTML =
    `<div class="loading-card">Loading live NOAA conditions...</div>`;
}

function renderBoatConditions(data) {
  document.getElementById("conditionsUpdated").textContent =
    `Showing live conditions for ${data.region}. Water temp may use the nearest NOAA station when available.`;

  document.getElementById("conditionsSummary").innerHTML = `
    <div class="condition-card">
      <h3>Weather</h3>
      <p class="big-number">${Math.round(data.airTemp)}°F</p>
      <span>Air temperature</span>
    </div>

    <div class="condition-card">
      <h3>Wind</h3>
      <p class="big-number">${data.wind} mph</p>
      <span>${data.windDirection} wind</span>
    </div>

    <div class="condition-card">
      <h3>Water Temp</h3>
      <p class="big-number">${Number(data.waterTemp).toFixed(1)}°F</p>
      <span>Nearest NOAA station</span>
    </div>

    <div class="condition-card">
      <h3>Tide Movement</h3>
      <p class="big-number">${data.tideMovement}</p>
      <span>Based on tide range</span>
    </div>
  `;

  document.getElementById("biteScoreCard").innerHTML = `
    <div class="score-circle">${data.score}</div>
    <div>
      <span class="forecast-kicker">Boat Fishing Score</span>
      <h3>${data.rating} Boat Conditions</h3>
      <p>${data.region} has a ${data.rating.toLowerCase()} boat fishing setup based on wind, water temperature, swell estimate, and tide movement.</p>
    </div>
  `;

  document.getElementById("tideTable").innerHTML = renderTideTable(data.tideList);

  document.getElementById("forecastNotes").innerHTML = `
    <p><strong>${data.region}:</strong> Best boat conditions usually line up with light wind, manageable swell, clean water, and moving tide.</p>
    <p><strong>Likely targets:</strong> ${data.targets.join(", ")}</p>
  `;
}

function renderTideTable(tides) {
  return `
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Tide</th>
          <th>Height</th>
        </tr>
      </thead>
      <tbody>
        ${tides.map(tide => `
          <tr>
            <td>${tide.time}</td>
            <td>${tide.type}</td>
            <td>${tide.height}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}
