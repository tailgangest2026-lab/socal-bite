const regionData = {
  "Los Angeles": {
    waterTemp: 64,
    windBase: 8,
    swellBase: 2.8,
    tideRange: "Moderate",
    notes: "Good local conditions for bass, rockfish, sculpin, and surface activity when wind stays light."
  },
  "Orange County": {
    waterTemp: 65,
    windBase: 7,
    swellBase: 2.5,
    tideRange: "Strong",
    notes: "Good yellowtail, bass, bonito, and mixed surface potential when water is clean and current is moving."
  },
  "San Diego": {
    waterTemp: 66,
    windBase: 6,
    swellBase: 2.2,
    tideRange: "Moderate",
    notes: "Strong offshore and island potential. Watch wind and swell for longer trips."
  },
  "Ventura": {
    waterTemp: 62,
    windBase: 10,
    swellBase: 3.1,
    tideRange: "Moderate",
    notes: "Good rockfish, whitefish, lingcod, and island fishing when wind stays under control."
  },
  "Santa Barbara": {
    waterTemp: 61,
    windBase: 9,
    swellBase: 2.9,
    tideRange: "Weak",
    notes: "Best for rockfish, whitefish, sheephead, and local structure fishing."
  }
};

document.addEventListener("DOMContentLoaded", () => {
  buildDateDropdown();

  document.getElementById("regionSelect").addEventListener("change", loadConditions);
  document.getElementById("dateSelect").addEventListener("change", loadConditions);

  loadConditions();
});

function buildDateDropdown() {
  const dateSelect = document.getElementById("dateSelect");
  dateSelect.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const value = date.toISOString().split("T")[0];
    const label = i === 0
      ? "Today"
      : i === 1
        ? "Tomorrow"
        : date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric"
          });

    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    dateSelect.appendChild(option);
  }
}

function loadConditions() {
  const region = document.getElementById("regionSelect").value;
  const selectedDate = document.getElementById("dateSelect").value;
  const data = getForecastForRegion(region, selectedDate);

  renderConditions(data);
  renderBiteScore(data);
  renderTides(data);
  renderForecastNotes(data);
}

function getForecastForRegion(region, selectedDate) {
  const base = regionData[region];

  const dayOffset = getDayOffset(selectedDate);

  const wind = Math.max(3, base.windBase + ((dayOffset % 4) - 1));
  const swell = Math.max(1.5, base.swellBase + ((dayOffset % 3) * 0.3));
  const waterTemp = base.waterTemp + (dayOffset % 2);
  const airTemp = 70 + (dayOffset % 5);

  return {
    region,
    date: selectedDate,
    airTemp,
    wind,
    windDirection: getWindDirection(dayOffset),
    swell: swell.toFixed(1),
    swellPeriod: 11 + (dayOffset % 4),
    waterTemp,
    tideRange: base.tideRange,
    notes: base.notes,
    tides: generateTides(dayOffset),
    score: calculateFishingScore(wind, swell, waterTemp, base.tideRange)
  };
}

function getDayOffset(dateString) {
  const today = new Date();
  const selected = new Date(dateString + "T00:00:00");

  today.setHours(0, 0, 0, 0);

  return Math.round((selected - today) / (1000 * 60 * 60 * 24));
}

function getWindDirection(offset) {
  const directions = ["W", "NW", "SW", "S", "W"];
  return directions[offset % directions.length];
}

function generateTides(offset) {
  return [
    {
      time: `${4 + offset % 3}:18 AM`,
      type: "Low Tide",
      height: `${(0.8 + offset * 0.1).toFixed(1)} ft`
    },
    {
      time: `${10 + offset % 2}:42 AM`,
      type: "High Tide",
      height: `${4.1 + (offset % 3) * 0.2} ft`
    },
    {
      time: `${4 + offset % 4}:25 PM`,
      type: "Low Tide",
      height: `${1.2 + (offset % 2) * 0.2} ft`
    },
    {
      time: `${9 + offset % 3}:55 PM`,
      type: "High Tide",
      height: `${3.8 + (offset % 2) * 0.3} ft`
    }
  ];
}

function calculateFishingScore(wind, swell, waterTemp, tideRange) {
  let score = 100;

  if (wind > 12) score -= 25;
  else if (wind > 9) score -= 12;

  if (swell > 4) score -= 20;
  else if (swell > 3) score -= 10;

  if (waterTemp >= 64 && waterTemp <= 68) score += 8;
  else if (waterTemp < 60) score -= 8;

  if (tideRange === "Strong") score += 8;
  if (tideRange === "Weak") score -= 6;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function renderConditions(data) {
  const container = document.getElementById("conditionsSummary");

  container.innerHTML = `
    <div class="condition-card">
      <h3>Weather</h3>
      <p class="big-number">${data.airTemp}°F</p>
      <span>Air Temperature</span>
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
      <h3>Swell</h3>
      <p class="big-number">${data.swell} ft</p>
      <span>${data.swellPeriod} sec period</span>
    </div>
  `;
}

function renderBiteScore(data) {
  const card = document.getElementById("biteScoreCard");

  let rating = "Poor";
  if (data.score >= 85) rating = "Excellent";
  else if (data.score >= 70) rating = "Good";
  else if (data.score >= 55) rating = "Fair";

  card.innerHTML = `
    <div class="score-circle">${data.score}</div>
    <div>
      <h3>${rating} Conditions</h3>
      <p>${data.region} has a ${rating.toLowerCase()} fishing setup for this date based on wind, swell, water temperature, and tide movement.</p>
    </div>
  `;
}

function renderTides(data) {
  const table = document.getElementById("tideTable");

  table.innerHTML = `
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

function renderForecastNotes(data) {
  const notes = document.getElementById("forecastNotes");

  notes.innerHTML = `
    <p>${data.notes}</p>
    <p><strong>Best setup:</strong> Look for lighter wind, cleaner water, good tidal movement, and stable water temperature.</p>
  `;
}
