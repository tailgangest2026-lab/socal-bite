const pierData = {
  "Stearns Wharf": { county: "Santa Barbara", waterTemp: 61, wind: 7, swell: 2.4, targets: ["Mackerel", "Surfperch", "Halibut", "Shark/Ray"] },
  "Goleta Pier": { county: "Santa Barbara", waterTemp: 61, wind: 7, swell: 2.3, targets: ["Mackerel", "Surfperch", "Halibut", "Croaker"] },

  "Ventura Pier": { county: "Ventura", waterTemp: 62, wind: 9, swell: 2.8, targets: ["Mackerel", "Surfperch", "Halibut", "Shark/Ray"] },
  "Port Hueneme Pier": { county: "Ventura", waterTemp: 63, wind: 8, swell: 2.7, targets: ["Mackerel", "Surfperch", "Croaker", "Halibut"] },

  "Malibu Pier": { county: "Los Angeles", waterTemp: 64, wind: 7, swell: 2.5, targets: ["Mackerel", "Halibut", "Surfperch", "Leopard Shark"] },
  "Santa Monica Pier": { county: "Los Angeles", waterTemp: 65, wind: 7, swell: 2.4, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Venice Fishing Pier": { county: "Los Angeles", waterTemp: 65, wind: 7, swell: 2.4, targets: ["Mackerel", "Halibut", "Croaker", "Shark/Ray"] },
  "Manhattan Beach Pier": { county: "Los Angeles", waterTemp: 65, wind: 7, swell: 2.3, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Hermosa Beach Pier": { county: "Los Angeles", waterTemp: 65, wind: 7, swell: 2.3, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Redondo Beach Pier": { county: "Los Angeles", waterTemp: 65, wind: 7, swell: 2.2, targets: ["Mackerel", "Bonito", "Bass", "Halibut"] },
  "Cabrillo Pier": { county: "Los Angeles", waterTemp: 66, wind: 7, swell: 2.0, targets: ["Mackerel", "Bass", "Halibut", "Croaker"] },

  "Seal Beach Pier": { county: "Orange County", waterTemp: 66, wind: 7, swell: 2.2, targets: ["Mackerel", "Croaker", "Halibut", "Stingray"] },
  "Huntington Beach Pier": { county: "Orange County", waterTemp: 66, wind: 7, swell: 2.5, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Newport Pier": { county: "Orange County", waterTemp: 66, wind: 6, swell: 2.2, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Balboa Pier": { county: "Orange County", waterTemp: 66, wind: 6, swell: 2.1, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Dana Point Pier": { county: "Orange County", waterTemp: 67, wind: 6, swell: 2.0, targets: ["Mackerel", "Bass", "Halibut", "Croaker"] },
  "San Clemente Pier": { county: "Orange County", waterTemp: 67, wind: 7, swell: 2.4, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },

  "Oceanside Pier": { county: "San Diego", waterTemp: 67, wind: 7, swell: 2.5, targets: ["Mackerel", "Bonito", "Halibut", "Croaker"] },
  "Crystal Pier": { county: "San Diego", waterTemp: 67, wind: 6, swell: 2.3, targets: ["Mackerel", "Halibut", "Croaker", "Surfperch"] },
  "Ocean Beach Pier": { county: "San Diego", waterTemp: 67, wind: 7, swell: 2.4, targets: ["Mackerel", "Bonito", "Halibut", "Shark/Ray"] },
  "Shelter Island Pier": { county: "San Diego", waterTemp: 68, wind: 6, swell: 1.5, targets: ["Bass", "Mackerel", "Halibut", "Spotted Bay Bass"] },
  "Embarcadero Marina Park Pier": { county: "San Diego", waterTemp: 68, wind: 6, swell: 1.4, targets: ["Bass", "Mackerel", "Halibut", "Spotted Bay Bass"] },
  "Coronado Ferry Landing Pier": { county: "San Diego", waterTemp: 68, wind: 6, swell: 1.3, targets: ["Bass", "Mackerel", "Halibut", "Spotted Bay Bass"] },
  "Imperial Beach Pier": { county: "San Diego", waterTemp: 68, wind: 7, swell: 2.4, targets: ["Mackerel", "Croaker", "Halibut", "Shark/Ray"] }
};

document.addEventListener("DOMContentLoaded", () => {
  buildPierDateDropdown();

  document.getElementById("pierSelect").addEventListener("change", loadPierConditions);
  document.getElementById("dateSelect").addEventListener("change", loadPierConditions);
});

function buildPierDateDropdown() {
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

function loadPierConditions() {
  const pier = document.getElementById("pierSelect").value;
  const date = document.getElementById("dateSelect").value;

  if (!pier || !pierData[pier]) return;

  const data = getPierForecast(pier, date);

  renderPierCards(data);
  renderPierScore(data);
  renderPierTargets(data);
  renderPierTides(data);
  renderPierNotes(data);
}

function getPierForecast(pier, date) {
  const base = pierData[pier];
  const offset = getPierDayOffset(date);

  const wind = Math.max(3, base.wind + ((offset % 5) - 2));
  const swell = Math.max(1.0, base.swell + ((offset % 4) * 0.2));
  const waterTemp = base.waterTemp + (offset % 2);
  const tideMovement = ["Weak", "Moderate", "Strong"][offset % 3];
  const baitActivity = ["Low", "Medium", "High"][(offset + 1) % 3];

  return {
    pier,
    county: base.county,
    date,
    wind,
    windDirection: ["W", "NW", "SW", "S"][offset % 4],
    swell: swell.toFixed(1),
    waterTemp,
    tideMovement,
    baitActivity,
    targets: base.targets,
    score: calculatePierScore(wind, swell, waterTemp, tideMovement, baitActivity),
    tides: generatePierTides(offset)
  };
}

function getPierDayOffset(dateString) {
  const today = new Date();
  const selected = new Date(dateString + "T00:00:00");
  today.setHours(0, 0, 0, 0);
  return Math.round((selected - today) / (1000 * 60 * 60 * 24));
}

function calculatePierScore(wind, swell, waterTemp, tideMovement, baitActivity) {
  let score = 78;

  if (wind <= 8) score += 8;
  else if (wind > 12) score -= 15;

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

function generatePierTides(offset) {
  return [
    { time: `${(4 + offset) % 12 || 12}:18 AM`, type: "Low Tide", height: `${(0.8 + offset * 0.1).toFixed(1)} ft` },
    { time: `${(10 + offset) % 12 || 12}:42 AM`, type: "High Tide", height: `${(4.1 + (offset % 3) * 0.2).toFixed(1)} ft` },
    { time: `${(4 + offset) % 12 || 12}:25 PM`, type: "Low Tide", height: `${(1.2 + (offset % 2) * 0.2).toFixed(1)} ft` },
    { time: `${(9 + offset) % 12 || 12}:55 PM`, type: "High Tide", height: `${(3.8 + (offset % 2) * 0.3).toFixed(1)} ft` }
  ];
}

function renderPierCards(data) {
  document.getElementById("pierConditionsUpdated").textContent =
    `Showing estimated conditions for ${data.pier}, ${data.county}`;

  document.getElementById("pierConditionsSummary").innerHTML = `
    <div class="condition-card">
      <h3>Wind</h3>
      <p class="big-number">${data.wind} mph</p>
      <span>${data.windDirection} wind</span>
    </div>

    <div class="condition-card">
      <h3>Swell</h3>
      <p class="big-number">${data.swell} ft</p>
      <span>Estimated swell near pier</span>
    </div>

    <div class="condition-card">
      <h3>Water Temp</h3>
      <p class="big-number">${data.waterTemp}°F</p>
      <span>Estimated surface temp</span>
    </div>

    <div class="condition-card">
      <h3>Bait Activity</h3>
      <p class="big-number">${data.baitActivity}</p>
      <span>Estimated bait movement</span>
    </div>
  `;
}

function renderPierScore(data) {
  const rating = getPierRating(data.score);

  document.getElementById("pierScoreCard").innerHTML = `
    <div class="score-circle">${data.score}</div>
    <div>
      <span class="forecast-kicker">Pier Fishing Score</span>
      <h3>${rating} Pier Fishing Conditions</h3>
      <p>${data.pier} has a ${rating.toLowerCase()} pier fishing setup based on wind, swell, water temperature, tide movement, and bait activity.</p>
    </div>
  `;
}

function renderPierTargets(data) {
  document.getElementById("pierSpeciesTargets").innerHTML = `
    <div class="species-pill-wrap">
      ${data.targets.map(species => `<span class="species-pill">${species}</span>`).join("")}
    </div>
  `;
}

function renderPierTides(data) {
  document.getElementById("pierTideTable").innerHTML = `
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

function renderPierNotes(data) {
  document.getElementById("pierForecastNotes").innerHTML = `
    <p><strong>${data.pier}:</strong> Best pier fishing usually happens with moving tide, clean water, bait near the pier, and light wind.</p>
    <p>For mackerel and bonito, watch for bait schools, birds, current breaks, and surface activity around the end of the pier.</p>
  `;
}

function getPierRating(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Slow";
}
