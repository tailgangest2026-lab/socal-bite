const beachData = {
  "Gaviota State Beach": { county: "Santa Barbara", waterTemp: 60, surf: 3.2, wind: 9, targets: ["Surfperch", "Halibut", "Leopard Shark", "Guitarfish"] },
  "Refugio State Beach": { county: "Santa Barbara", waterTemp: 61, surf: 2.8, wind: 8, targets: ["Surfperch", "Halibut", "Croaker"] },
  "El Capitan State Beach": { county: "Santa Barbara", waterTemp: 61, surf: 2.9, wind: 8, targets: ["Surfperch", "Halibut", "Leopard Shark"] },
  "Goleta Beach": { county: "Santa Barbara", waterTemp: 61, surf: 2.4, wind: 7, targets: ["Surfperch", "Halibut", "Croaker"] },
  "Leadbetter Beach": { county: "Santa Barbara", waterTemp: 61, surf: 2.6, wind: 7, targets: ["Surfperch", "Halibut"] },
  "East Beach Santa Barbara": { county: "Santa Barbara", waterTemp: 61, surf: 2.5, wind: 7, targets: ["Surfperch", "Croaker", "Halibut"] },
  "Carpinteria State Beach": { county: "Santa Barbara", waterTemp: 62, surf: 2.7, wind: 8, targets: ["Surfperch", "Corbina", "Croaker"] },

  "Rincon Beach": { county: "Ventura", waterTemp: 62, surf: 3.0, wind: 9, targets: ["Surfperch", "Halibut", "Leopard Shark"] },
  "Emma Wood State Beach": { county: "Ventura", waterTemp: 62, surf: 3.1, wind: 10, targets: ["Surfperch", "Halibut"] },
  "Surfers Point Ventura": { county: "Ventura", waterTemp: 62, surf: 3.2, wind: 10, targets: ["Surfperch", "Halibut", "Croaker"] },
  "San Buenaventura State Beach": { county: "Ventura", waterTemp: 63, surf: 2.8, wind: 9, targets: ["Surfperch", "Corbina", "Croaker"] },
  "Oxnard Beach Park": { county: "Ventura", waterTemp: 63, surf: 2.7, wind: 8, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Hollywood Beach Oxnard": { county: "Ventura", waterTemp: 63, surf: 2.7, wind: 8, targets: ["Surfperch", "Halibut", "Leopard Shark"] },
  "Port Hueneme Beach": { county: "Ventura", waterTemp: 63, surf: 2.9, wind: 9, targets: ["Surfperch", "Croaker", "Halibut"] },
  "Point Mugu State Beach": { county: "Ventura", waterTemp: 62, surf: 3.3, wind: 10, targets: ["Surfperch", "Leopard Shark", "Guitarfish"] },

  "Leo Carrillo State Beach": { county: "Los Angeles", waterTemp: 63, surf: 3.0, wind: 9, targets: ["Surfperch", "Halibut", "Leopard Shark"] },
  "Zuma Beach": { county: "Los Angeles", waterTemp: 64, surf: 3.0, wind: 8, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Point Dume State Beach": { county: "Los Angeles", waterTemp: 64, surf: 2.9, wind: 8, targets: ["Surfperch", "Halibut", "Croaker"] },
  "Malibu Surfrider Beach": { county: "Los Angeles", waterTemp: 64, surf: 2.7, wind: 7, targets: ["Corbina", "Yellowfin Croaker", "Halibut"] },
  "Topanga Beach": { county: "Los Angeles", waterTemp: 64, surf: 2.7, wind: 7, targets: ["Corbina", "Surfperch", "Halibut"] },
  "Will Rogers State Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.5, wind: 7, targets: ["Corbina", "Yellowfin Croaker", "Surfperch"] },
  "Santa Monica State Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.4, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Venice Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.5, wind: 7, targets: ["Corbina", "Croaker", "Leopard Shark"] },
  "Dockweiler State Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.6, wind: 8, targets: ["Corbina", "Croaker", "Halibut", "Leopard Shark"] },
  "El Segundo Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.6, wind: 8, targets: ["Corbina", "Croaker", "Surfperch"] },
  "Manhattan Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.5, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Hermosa Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.5, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Redondo Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.4, wind: 7, targets: ["Croaker", "Halibut", "Surfperch"] },
  "Torrance Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.4, wind: 7, targets: ["Croaker", "Halibut", "Surfperch"] },
  "Cabrillo Beach": { county: "Los Angeles", waterTemp: 66, surf: 2.0, wind: 7, targets: ["Croaker", "Halibut", "Bass"] },
  "White Point Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.3, wind: 8, targets: ["Surfperch", "Croaker", "Bass"] },
  "Royal Palms Beach": { county: "Los Angeles", waterTemp: 65, surf: 2.3, wind: 8, targets: ["Surfperch", "Croaker", "Bass"] },

  "Seal Beach": { county: "Orange County", waterTemp: 66, surf: 2.3, wind: 7, targets: ["Corbina", "Croaker", "Halibut", "Stingray"] },
  "Sunset Beach": { county: "Orange County", waterTemp: 66, surf: 2.4, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Bolsa Chica State Beach": { county: "Orange County", waterTemp: 66, surf: 2.5, wind: 7, targets: ["Corbina", "Yellowfin Croaker", "Surfperch"] },
  "Huntington Beach": { county: "Orange County", waterTemp: 66, surf: 2.6, wind: 7, targets: ["Corbina", "Croaker", "Halibut", "Leopard Shark"] },
  "Huntington State Beach": { county: "Orange County", waterTemp: 66, surf: 2.6, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Newport Beach": { county: "Orange County", waterTemp: 66, surf: 2.3, wind: 6, targets: ["Corbina", "Spotfin Croaker", "Halibut"] },
  "Balboa Beach": { county: "Orange County", waterTemp: 66, surf: 2.2, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Corona del Mar State Beach": { county: "Orange County", waterTemp: 66, surf: 2.2, wind: 6, targets: ["Corbina", "Halibut", "Bass"] },
  "Crystal Cove State Park": { county: "Orange County", waterTemp: 66, surf: 2.5, wind: 7, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Laguna Beach": { county: "Orange County", waterTemp: 66, surf: 2.4, wind: 7, targets: ["Surfperch", "Corbina", "Bass"] },
  "Aliso Beach": { county: "Orange County", waterTemp: 66, surf: 2.5, wind: 7, targets: ["Surfperch", "Corbina", "Leopard Shark"] },
  "Salt Creek Beach": { county: "Orange County", waterTemp: 66, surf: 2.6, wind: 7, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Doheny State Beach": { county: "Orange County", waterTemp: 67, surf: 2.1, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Capistrano Beach": { county: "Orange County", waterTemp: 67, surf: 2.2, wind: 6, targets: ["Corbina", "Croaker", "Surfperch"] },
  "San Clemente State Beach": { county: "Orange County", waterTemp: 67, surf: 2.6, wind: 7, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Trestles Beach": { county: "Orange County", waterTemp: 67, surf: 3.0, wind: 8, targets: ["Surfperch", "Corbina", "Leopard Shark"] },

  "Oceanside Beach": { county: "San Diego", waterTemp: 67, surf: 2.7, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "Carlsbad State Beach": { county: "San Diego", waterTemp: 67, surf: 2.6, wind: 7, targets: ["Corbina", "Surfperch", "Halibut"] },
  "Tamarack State Beach": { county: "San Diego", waterTemp: 67, surf: 2.6, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "South Ponto Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 7, targets: ["Corbina", "Surfperch", "Halibut"] },
  "Moonlight State Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 7, targets: ["Corbina", "Croaker", "Surfperch"] },
  "Cardiff State Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 7, targets: ["Corbina", "Croaker", "Halibut"] },
  "San Elijo State Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 7, targets: ["Corbina", "Surfperch", "Halibut"] },
  "Swami's Beach": { county: "San Diego", waterTemp: 67, surf: 2.6, wind: 7, targets: ["Surfperch", "Corbina", "Halibut"] },
  "Del Mar Beach": { county: "San Diego", waterTemp: 67, surf: 2.4, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Torrey Pines State Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 6, targets: ["Corbina", "Croaker", "Leopard Shark"] },
  "La Jolla Shores": { county: "San Diego", waterTemp: 67, surf: 2.2, wind: 6, targets: ["Corbina", "Halibut", "Leopard Shark"] },
  "Windansea Beach": { county: "San Diego", waterTemp: 67, surf: 2.7, wind: 7, targets: ["Surfperch", "Halibut", "Bass"] },
  "Pacific Beach": { county: "San Diego", waterTemp: 67, surf: 2.4, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Mission Beach": { county: "San Diego", waterTemp: 67, surf: 2.4, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Ocean Beach": { county: "San Diego", waterTemp: 67, surf: 2.5, wind: 7, targets: ["Croaker", "Halibut", "Leopard Shark"] },
  "Coronado Beach": { county: "San Diego", waterTemp: 68, surf: 2.2, wind: 6, targets: ["Corbina", "Croaker", "Halibut"] },
  "Silver Strand State Beach": { county: "San Diego", waterTemp: 68, surf: 2.2, wind: 6, targets: ["Corbina", "Croaker", "Leopard Shark"] },
  "Imperial Beach": { county: "San Diego", waterTemp: 68, surf: 2.4, wind: 7, targets: ["Corbina", "Croaker", "Leopard Shark"] }
};

document.addEventListener("DOMContentLoaded", () => {
  buildBeachDateDropdown();

  document.getElementById("beachSelect").addEventListener("change", loadBeachConditions);
  document.getElementById("dateSelect").addEventListener("change", loadBeachConditions);
});

function buildBeachDateDropdown() {
  const dateSelect = document.getElementById("dateSelect");
  dateSelect.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const option = document.createElement("option");
    option.value = date.toISOString().split("T")[0];
    option.textContent = i === 0 ? "Today" : i === 1 ? "Tomorrow" : date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });

    dateSelect.appendChild(option);
  }
}

function loadBeachConditions() {
  const beach = document.getElementById("beachSelect").value;
  const date = document.getElementById("dateSelect").value;

  if (!beach || !beachData[beach]) return;

  const data = getBeachForecast(beach, date);

  renderBeachCards(data);
  renderBeachScore(data);
  renderBeachTargets(data);
  renderBeachTides(data);
  renderBeachNotes(data);
}

function getBeachForecast(beach, date) {
  const base = beachData[beach];
  const offset = getBeachDayOffset(date);

  const surf = Math.max(1.2, base.surf + ((offset % 4) * 0.2));
  const wind = Math.max(3, base.wind + ((offset % 5) - 2));
  const waterTemp = base.waterTemp + (offset % 2);
  const tideMovement = ["Weak", "Moderate", "Strong"][offset % 3];

  return {
    beach,
    county: base.county,
    date,
    surf: surf.toFixed(1),
    wind,
    windDirection: ["W", "NW", "SW", "S"][offset % 4],
    waterTemp,
    tideMovement,
    targets: base.targets,
    score: calculateBeachScore(surf, wind, waterTemp, tideMovement),
    tides: generateBeachTides(offset)
  };
}

function getBeachDayOffset(dateString) {
  const today = new Date();
  const selected = new Date(dateString + "T00:00:00");
  today.setHours(0, 0, 0, 0);
  return Math.round((selected - today) / (1000 * 60 * 60 * 24));
}

function calculateBeachScore(surf, wind, waterTemp, tideMovement) {
  let score = 80;

  if (surf <= 2.8) score += 10;
  else if (surf > 4) score -= 18;

  if (wind <= 8) score += 8;
  else if (wind > 12) score -= 15;

  if (waterTemp >= 64 && waterTemp <= 69) score += 8;
  else if (waterTemp < 61) score -= 8;

  if (tideMovement === "Strong") score += 8;
  if (tideMovement === "Weak") score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function generateBeachTides(offset) {
  return [
    { time: `${(4 + offset) % 12 || 12}:18 AM`, type: "Low Tide", height: `${(0.7 + offset * 0.1).toFixed(1)} ft` },
    { time: `${(10 + offset) % 12 || 12}:42 AM`, type: "High Tide", height: `${(4.0 + (offset % 3) * 0.2).toFixed(1)} ft` },
    { time: `${(4 + offset) % 12 || 12}:25 PM`, type: "Low Tide", height: `${(1.1 + (offset % 2) * 0.2).toFixed(1)} ft` },
    { time: `${(9 + offset) % 12 || 12}:55 PM`, type: "High Tide", height: `${(3.7 + (offset % 2) * 0.3).toFixed(1)} ft` }
  ];
}

function renderBeachCards(data) {
  document.getElementById("beachConditionsUpdated").textContent =
    `Showing estimated conditions for ${data.beach}, ${data.county}`;

  document.getElementById("beachConditionsSummary").innerHTML = `
    <div class="condition-card">
      <h3>Surf</h3>
      <p class="big-number">${data.surf} ft</p>
      <span>Estimated surf height</span>
    </div>

    <div class="condition-card">
      <h3>Wind</h3>
      <p class="big-number">${data.wind} mph</p>
      <span>${data.windDirection} wind</span>
    </div>

    <div class="condition-card">
      <h3>Water Temp</h3>
      <p class="big-number">${data.waterTemp}°F</p>
      <span>Estimated surface temp</span>
    </div>

    <div class="condition-card">
      <h3>Tide Movement</h3>
      <p class="big-number">${data.tideMovement}</p>
      <span>Fishing current strength</span>
    </div>
  `;
}

function renderBeachScore(data) {
  const rating = getRating(data.score);

  document.getElementById("beachScoreCard").innerHTML = `
    <div class="score-circle">${data.score}</div>
    <div>
      <span class="forecast-kicker">Beach Fishing Score</span>
      <h3>${rating} Surf Fishing Conditions</h3>
      <p>${data.beach} has a ${rating.toLowerCase()} surf fishing setup based on surf height, wind, water temperature, and tide movement.</p>
    </div>
  `;
}

function renderBeachTargets(data) {
  document.getElementById("beachSpeciesTargets").innerHTML = `
    <div class="species-pill-wrap">
      ${data.targets.map(species => `<span class="species-pill">${species}</span>`).join("")}
    </div>
  `;
}

function renderBeachTides(data) {
  document.getElementById("beachTideTable").innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Tide</th>
          <th>Height</th>
        </tr>
      </thead>
      <tbody>
        ${data.tides.map(tide => `
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

function renderBeachNotes(data) {
  document.getElementById("beachForecastNotes").innerHTML = `
    <p><strong>${data.beach}:</strong> Best surf fishing usually happens with clean water, light wind, smaller manageable surf, and moving tide.</p>
    <p>For corbina and croaker, look for sand crab beds, troughs, holes, and soft edges around structure.</p>
  `;
}

function getRating(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Slow";
}
