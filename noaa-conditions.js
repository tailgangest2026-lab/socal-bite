const SCBConditions = (() => {
  const noaaStations = {
    "Santa Barbara": "9411340",
    "Ventura": "9411189",
    "Los Angeles": "9410660",
    "Orange County": "9410580",
    "San Diego": "9410170",
    "La Jolla": "9410230"
  };

  async function getWeather(lat, lon, dateString) {
    try {
      const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
      if (!pointRes.ok) throw new Error("NWS point lookup failed");

      const pointData = await pointRes.json();
      const hourlyUrl = pointData.properties.forecastHourly;

      const hourlyRes = await fetch(hourlyUrl);
      if (!hourlyRes.ok) throw new Error("NWS hourly forecast failed");

      const hourlyData = await hourlyRes.json();
      const periods = hourlyData.properties.periods || [];

      return periods.find(p => p.startTime.startsWith(dateString)) || periods[0] || null;
    } catch (error) {
      console.warn("Weather fallback used:", error);
      return null;
    }
  }

  async function getTides(stationId, dateString) {
    try {
      const cleanDate = dateString.replaceAll("-", "");

      const url =
        "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
        `?begin_date=${cleanDate}` +
        "&range=24" +
        `&station=${stationId}` +
        "&product=predictions" +
        "&datum=MLLW" +
        "&time_zone=lst_ldt" +
        "&interval=hilo" +
        "&units=english" +
        "&format=json";

      const res = await fetch(url);
      if (!res.ok) throw new Error("NOAA tide request failed");

      const data = await res.json();
      return data.predictions || [];
    } catch (error) {
      console.warn("Tide fallback used:", error);
      return [];
    }
  }

  async function getWaterTemp(stationId) {
    try {
      const url =
        "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" +
        "?date=latest" +
        `&station=${stationId}` +
        "&product=water_temperature" +
        "&time_zone=lst_ldt" +
        "&units=english" +
        "&format=json";

      const res = await fetch(url);
      if (!res.ok) throw new Error("NOAA water temp request failed");

      const data = await res.json();
      if (!data.data || !data.data.length) return null;

      return Number(data.data[0].v);
    } catch (error) {
      console.warn("Water temp fallback used:", error);
      return null;
    }
  }

  function formatTides(tides) {
    if (!tides.length) {
      return [
        { time: "N/A", type: "High Tide", height: "Unavailable" },
        { time: "N/A", type: "Low Tide", height: "Unavailable" }
      ];
    }

    return tides.map(tide => ({
      time: new Date(tide.t.replace(" ", "T")).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
      }),
      type: tide.type === "H" ? "High Tide" : "Low Tide",
      height: `${Number(tide.v).toFixed(1)} ft`
    }));
  }

  function buildDateDropdown(selectId = "dateSelect", days = 7) {
    const dateSelect = document.getElementById(selectId);
    if (!dateSelect) return;

    dateSelect.innerHTML = "";

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const option = document.createElement("option");
      option.value = date.toISOString().split("T")[0];
      option.textContent =
        i === 0
          ? "Today"
          : i === 1
            ? "Tomorrow"
            : date.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              });

      dateSelect.appendChild(option);
    }
  }

  function parseWindSpeed(windSpeedText, fallback = 8) {
    if (!windSpeedText) return fallback;
    const match = windSpeedText.match(/\d+/);
    return match ? Number(match[0]) : fallback;
  }

  function getWindDirection(text, fallback = "W") {
    if (!text) return fallback;
    const dirs = ["NW", "SW", "NE", "SE", "N", "S", "E", "W"];
    return dirs.find(dir => text.includes(dir)) || fallback;
  }

  function rating(score) {
    if (score >= 85) return "Excellent";
    if (score >= 70) return "Good";
    if (score >= 55) return "Fair";
    return "Slow";
  }

  function stationForCounty(county) {
    return noaaStations[county] || noaaStations["Los Angeles"];
  }

  return {
    noaaStations,
    getWeather,
    getTides,
    getWaterTemp,
    formatTides,
    buildDateDropdown,
    parseWindSpeed,
    getWindDirection,
    rating,
    stationForCounty
  };
})();
