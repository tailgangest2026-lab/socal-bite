window.SCBConditions = (() => {
  const noaaStations = {
    "Santa Barbara": "9411340",
    "Ventura": "9411189",
    "Los Angeles": "9410660",
    "Orange County": "9410580",
    "San Diego": "9410170",
    "La Jolla": "9410230"
  };

  async function getWeather(lat, lon, dateString) {
    const [nws, openMeteo] = await Promise.all([
      getNwsWeather(lat, lon, dateString),
      getOpenMeteoWeather(lat, lon, dateString)
    ]);

    return {
      temperature: openMeteo?.temperature ?? nws?.temperature ?? 70,
      windSpeed: openMeteo?.windSpeed ?? nws?.windSpeed ?? 8,
      windGusts: openMeteo?.windGusts ?? null,
      windDirection: openMeteo?.windDirectionText ?? nws?.windDirection ?? "W",
      precipitationProbability: openMeteo?.precipitationProbability ?? null,
      cloudCover: openMeteo?.cloudCover ?? null,
      humidity: openMeteo?.humidity ?? null,
      pressure: openMeteo?.pressure ?? null,
      visibility: openMeteo?.visibility ?? null,
      uvIndex: openMeteo?.uvIndex ?? null,
      shortForecast: nws?.shortForecast ?? getWeatherSummary(openMeteo?.weatherCode),
      source: openMeteo ? "Open-Meteo + NOAA" : "NOAA"
    };
  }

  async function getNwsWeather(lat, lon, dateString) {
    try {
      const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
      if (!pointRes.ok) throw new Error("NWS point lookup failed");

      const pointData = await pointRes.json();
      const hourlyUrl = pointData.properties.forecastHourly;

      const hourlyRes = await fetch(hourlyUrl);
      if (!hourlyRes.ok) throw new Error("NWS hourly forecast failed");

      const hourlyData = await hourlyRes.json();
      const periods = hourlyData.properties.periods || [];
      const period = periods.find(p => p.startTime.startsWith(dateString)) || periods[0];

      if (!period) return null;

      return {
        temperature: period.temperature,
        windSpeed: parseWindSpeed(period.windSpeed, 8),
        windDirection: period.windDirection || "W",
        shortForecast: period.shortForecast || ""
      };
    } catch (error) {
      console.warn("NWS fallback used:", error);
      return null;
    }
  }

  async function getOpenMeteoWeather(lat, lon, dateString) {
    try {
      const hourlyVars = [
        "temperature_2m",
        "relative_humidity_2m",
        "precipitation_probability",
        "weather_code",
        "cloud_cover",
        "visibility",
        "pressure_msl",
        "wind_speed_10m",
        "wind_direction_10m",
        "wind_gusts_10m",
        "uv_index"
      ].join(",");

      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&hourly=${hourlyVars}` +
        "&temperature_unit=fahrenheit" +
        "&wind_speed_unit=mph" +
        "&precipitation_unit=inch" +
        "&timezone=America%2FLos_Angeles" +
        "&forecast_days=10";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo request failed");

      const data = await res.json();
      const hourly = data.hourly;

      if (!hourly || !hourly.time) return null;

      const index =
        hourly.time.findIndex(t => t.startsWith(`${dateString}T06`)) >= 0
          ? hourly.time.findIndex(t => t.startsWith(`${dateString}T06`))
          : hourly.time.findIndex(t => t.startsWith(dateString));

      if (index < 0) return null;

      return {
        temperature: hourly.temperature_2m?.[index],
        humidity: hourly.relative_humidity_2m?.[index],
        precipitationProbability: hourly.precipitation_probability?.[index],
        weatherCode: hourly.weather_code?.[index],
        cloudCover: hourly.cloud_cover?.[index],
        visibility: metersToMiles(hourly.visibility?.[index]),
        pressure: hourly.pressure_msl?.[index],
        windSpeed: hourly.wind_speed_10m?.[index],
        windDirection: hourly.wind_direction_10m?.[index],
        windDirectionText: degreesToCompass(hourly.wind_direction_10m?.[index]),
        windGusts: hourly.wind_gusts_10m?.[index],
        uvIndex: hourly.uv_index?.[index]
      };
    } catch (error) {
      console.warn("Open-Meteo fallback used:", error);
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

  function buildDateDropdown(selectId = "dateSelect", days = 10) {
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
    if (typeof windSpeedText === "number") return Math.round(windSpeedText);
    if (!windSpeedText) return fallback;

    const match = String(windSpeedText).match(/\d+/);
    return match ? Number(match[0]) : fallback;
  }

  function degreesToCompass(degrees) {
    if (degrees === null || degrees === undefined || isNaN(degrees)) return "W";

    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(degrees / 45) % 8;

    return directions[index];
  }

  function getWindDirection(text, fallback = "W") {
    if (!text) return fallback;
    const dirs = ["NW", "SW", "NE", "SE", "N", "S", "E", "W"];
    return dirs.find(dir => String(text).includes(dir)) || fallback;
  }

  function metersToMiles(meters) {
    if (meters === null || meters === undefined || isNaN(meters)) return null;
    return Number((meters / 1609.344).toFixed(1));
  }

  function getWeatherSummary(code) {
    const map = {
      0: "Clear",
      1: "Mostly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Fog",
      48: "Fog",
      51: "Light drizzle",
      53: "Drizzle",
      55: "Heavy drizzle",
      61: "Light rain",
      63: "Rain",
      65: "Heavy rain",
      80: "Rain showers",
      81: "Rain showers",
      82: "Heavy rain showers",
      95: "Thunderstorms"
    };

    return map[code] || "Forecast available";
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
    getNwsWeather,
    getOpenMeteoWeather,
    getTides,
    getWaterTemp,
    formatTides,
    buildDateDropdown,
    parseWindSpeed,
    getWindDirection,
    degreesToCompass,
    rating,
    stationForCounty
  };
})();
