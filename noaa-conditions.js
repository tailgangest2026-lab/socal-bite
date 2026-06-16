window.SCBConditions = (() => {
  const LOCATIONS = {
    "NorCal": {
      lat: 40.8021,
      lon: -124.1637,
      station: "9418767",
      waterStation: "9418767",
      buoyStation: "46244"
    },
    "San Francisco Bay": {
      lat: 37.7749,
      lon: -122.4194,
      station: "9414290",
      waterStation: "9414750",
      buoyStation: "46237"
    },
    "Alameda County": {
      lat: 37.7652,
      lon: -122.2416,
      station: "9414750",
      waterStation: "9414750",
      buoyStation: "46237"
    },
    "Monterey County": {
      lat: 36.6002,
      lon: -121.8947,
      station: "9413450",
      waterStation: "9413450",
      buoyStation: "46240"
    },
    "Central California": {
      lat: 35.3658,
      lon: -120.8499,
      station: "9412110",
      waterStation: "9412110",
      buoyStation: "46028"
    },
    "San Luis Obispo County": {
      lat: 35.2828,
      lon: -120.6596,
      station: "9412110",
      waterStation: "9412110",
      buoyStation: "46028"
    },
    "Santa Barbara County": {
      lat: 34.4208,
      lon: -119.6982,
      station: "9411340",
      waterStation: "9411340",
      buoyStation: "46053"
    },
    "Ventura County": {
      lat: 34.2746,
      lon: -119.2290,
      station: "9411189",
      waterStation: "9411189",
      buoyStation: "46053"
    },
    "Los Angeles County": {
      lat: 33.7361,
      lon: -118.2922,
      station: "9410660",
      waterStation: "9410660",
      buoyStation: "46222"
    },
    "Orange County": {
      lat: 33.6020,
      lon: -117.8830,
      station: "9410580",
      waterStation: "9410580",
      buoyStation: "46256"
    },
    "San Diego County": {
      lat: 32.7157,
      lon: -117.1611,
      station: "9410170",
      waterStation: "9410170",
      buoyStation: "46258"
    }
  };

  const noaaStations = Object.fromEntries(
    Object.entries(LOCATIONS).map(([region, config]) => [region, config.station])
  );

  function getLocation(region) {
    return LOCATIONS[region] || LOCATIONS["Los Angeles County"];
  }

  async function getConditions(region, dateString) {
    const location = getLocation(region);
    const targetDate = dateString || getTodayString();

    const [weather, marine, tides, waterTemp] = await Promise.all([
      getWeather(location.lat, location.lon, targetDate),
      getMarine(location.lat, location.lon, targetDate),
      getTides(location.station, targetDate),
      getWaterTemp(location.waterStation || location.station)
    ]);

    return {
      date: targetDate,
      region,
      station: location.station,
      waterStation: location.waterStation || location.station,
      buoyStation: location.buoyStation || null,

      waterTemp,

      windSpeed: weather?.windSpeed ?? null,
      windGust: weather?.windGusts ?? null,
      windGusts: weather?.windGusts ?? null,
      windDirection: weather?.windDirection ?? "W",

      waveHeight: marine?.waveHeight ?? null,
      waveDirection: marine?.waveDirection ?? null,
      waveDirectionText: marine?.waveDirectionText ?? null,
      wavePeriod: marine?.wavePeriod ?? null,

      swellHeight: marine?.swellWaveHeight ?? null,
      swellDirection: marine?.swellWaveDirection ?? null,
      swellDirectionText: marine?.swellWaveDirectionText ?? null,
      swellPeriod: marine?.swellWavePeriod ?? null,

      tideMovement: calculateTideMovement(tides),
      tides: formatTides(tides),

      temperature: weather?.temperature ?? null,
      rainChance: weather?.precipitationProbability ?? null,
      cloudCover: weather?.cloudCover ?? null,
      uvIndex: weather?.uvIndex ?? null,
      sunrise: weather?.sunrise ?? null,
      sunset: weather?.sunset ?? null,
      shortForecast: weather?.shortForecast ?? "Forecast available",

      score: calculateConditionScore({
        windSpeed: weather?.windSpeed,
        windGust: weather?.windGusts,
        waveHeight: marine?.waveHeight,
        swellHeight: marine?.swellWaveHeight,
        rainChance: weather?.precipitationProbability,
        tideMovement: calculateTideMovement(tides)
      }),

      updatedAt: new Date().toISOString()
    };
  }

  async function getWeather(lat, lon, dateString) {
    const targetDate = dateString || getTodayString();

    const [nws, openMeteo] = await Promise.all([
      getNwsWeather(lat, lon, targetDate),
      getOpenMeteoWeather(lat, lon, targetDate)
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
      sunrise: openMeteo?.sunrise ?? null,
      sunset: openMeteo?.sunset ?? null,
      shortForecast: openMeteo?.shortForecast ?? nws?.shortForecast ?? "Forecast available",
      source: openMeteo ? "Open-Meteo + NOAA" : "NOAA"
    };
  }

  async function getNwsWeather(lat, lon, dateString) {
    try {
      const targetDate = dateString || getTodayString();
      const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);

      if (!pointRes.ok) throw new Error("NWS point lookup failed");

      const pointData = await pointRes.json();
      const hourlyUrl = pointData.properties.forecastHourly;
      const hourlyRes = await fetch(hourlyUrl);

      if (!hourlyRes.ok) throw new Error("NWS hourly forecast failed");

      const hourlyData = await hourlyRes.json();
      const periods = hourlyData.properties.periods || [];

      const period =
        periods.find(p => String(p.startTime).startsWith(`${targetDate}T12`)) ||
        periods.find(p => String(p.startTime).startsWith(`${targetDate}T13`)) ||
        periods.find(p => String(p.startTime).startsWith(`${targetDate}T14`)) ||
        periods.find(p => String(p.startTime).startsWith(`${targetDate}T11`)) ||
        periods.find(p => String(p.startTime).startsWith(`${targetDate}T10`)) ||
        periods.find(p => String(p.startTime).startsWith(targetDate)) ||
        null;

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
      const targetDate = dateString || getTodayString();

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

      const dailyVars = ["sunrise", "sunset", "uv_index_max"].join(",");

      const url =
        "https://api.open-meteo.com/v1/forecast" +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&hourly=${hourlyVars}` +
        `&daily=${dailyVars}` +
        "&temperature_unit=fahrenheit" +
        "&wind_speed_unit=mph" +
        "&precipitation_unit=inch" +
        "&timezone=America%2FLos_Angeles" +
        "&forecast_days=15";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo request failed");

      const data = await res.json();
      const hourly = data.hourly;
      const daily = data.daily;

      if (!hourly || !hourly.time) return null;

      const index = findForecastIndex(hourly.time, targetDate);
      const dailyIndex = findDailyIndex(daily?.time, targetDate);

      if (index < 0) return null;

      const weatherCode = hourly.weather_code?.[index];

      return {
        selectedDate: targetDate,
        selectedTime: hourly.time?.[index],
        temperature: hourly.temperature_2m?.[index],
        humidity: hourly.relative_humidity_2m?.[index],
        precipitationProbability: hourly.precipitation_probability?.[index],
        weatherCode,
        shortForecast: getWeatherSummary(weatherCode),
        cloudCover: hourly.cloud_cover?.[index],
        visibility: metersToMiles(hourly.visibility?.[index]),
        pressure: hourly.pressure_msl?.[index],
        windSpeed: hourly.wind_speed_10m?.[index],
        windDirection: hourly.wind_direction_10m?.[index],
        windDirectionText: degreesToCompass(hourly.wind_direction_10m?.[index]),
        windGusts: hourly.wind_gusts_10m?.[index],
        uvIndex: hourly.uv_index?.[index] ?? daily?.uv_index_max?.[dailyIndex],
        sunrise: formatTime(daily?.sunrise?.[dailyIndex]),
        sunset: formatTime(daily?.sunset?.[dailyIndex])
      };
    } catch (error) {
      console.warn("Open-Meteo fallback used:", error);
      return null;
    }
  }

  async function getMarine(lat, lon, dateString) {
    try {
      const targetDate = dateString || getTodayString();

      const hourlyVars = [
        "wave_height",
        "wave_direction",
        "wave_period",
        "wind_wave_height",
        "wind_wave_direction",
        "wind_wave_period",
        "swell_wave_height",
        "swell_wave_direction",
        "swell_wave_period"
      ].join(",");

      const url =
        "https://marine-api.open-meteo.com/v1/marine" +
        `?latitude=${lat}` +
        `&longitude=${lon}` +
        `&hourly=${hourlyVars}` +
        "&length_unit=imperial" +
        "&timezone=America%2FLos_Angeles" +
        "&forecast_days=15";

      const res = await fetch(url);
      if (!res.ok) throw new Error("Open-Meteo marine request failed");

      const data = await res.json();
      const hourly = data.hourly;

      if (!hourly || !hourly.time) return null;

      const index = findForecastIndex(hourly.time, targetDate);
      if (index < 0) return null;

      return {
        selectedDate: targetDate,
        selectedTime: hourly.time?.[index],

        waveHeight: roundOne(hourly.wave_height?.[index]),
        waveDirection: hourly.wave_direction?.[index],
        waveDirectionText: degreesToCompass(hourly.wave_direction?.[index]),
        wavePeriod: roundOne(hourly.wave_period?.[index]),

        windWaveHeight: roundOne(hourly.wind_wave_height?.[index]),
        windWaveDirection: hourly.wind_wave_direction?.[index],
        windWaveDirectionText: degreesToCompass(hourly.wind_wave_direction?.[index]),
        windWavePeriod: roundOne(hourly.wind_wave_period?.[index]),

        swellWaveHeight: roundOne(hourly.swell_wave_height?.[index]),
        swellWaveDirection: hourly.swell_wave_direction?.[index],
        swellWaveDirectionText: degreesToCompass(hourly.swell_wave_direction?.[index]),
        swellWavePeriod: roundOne(hourly.swell_wave_period?.[index]),

        source: "Open-Meteo Marine"
      };
    } catch (error) {
      console.warn("Marine fallback used:", error);
      return null;
    }
  }

  async function getTides(stationId, dateString) {
    try {
      const targetDate = dateString || getTodayString();
      const cleanDate = targetDate.replaceAll("-", "");

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

      const value = Number(data.data[0].v);
      return Number.isFinite(value) ? roundOne(value) : null;
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

  function calculateTideMovement(tides) {
    if (!Array.isArray(tides) || tides.length < 2) return null;

    const heights = tides
      .map(tide => Number(tide.v))
      .filter(value => Number.isFinite(value));

    if (heights.length < 2) return null;

    return roundOne(Math.max(...heights) - Math.min(...heights));
  }

  function calculateConditionScore(data = {}) {
    let score = 100;

    const wind = Number(data.windSpeed);
    const gust = Number(data.windGust);
    const wave = Number(data.waveHeight);
    const swell = Number(data.swellHeight);
    const rain = Number(data.rainChance);
    const tide = Number(data.tideMovement);

    if (Number.isFinite(wind)) {
      if (wind > 20) score -= 25;
      else if (wind > 15) score -= 15;
      else if (wind > 10) score -= 7;
    }

    if (Number.isFinite(gust)) {
      if (gust > 30) score -= 20;
      else if (gust > 22) score -= 12;
      else if (gust > 16) score -= 5;
    }

    if (Number.isFinite(wave)) {
      if (wave > 8) score -= 25;
      else if (wave > 6) score -= 16;
      else if (wave > 4) score -= 8;
    }

    if (Number.isFinite(swell)) {
      if (swell > 7) score -= 18;
      else if (swell > 5) score -= 10;
      else if (swell > 3.5) score -= 5;
    }

    if (Number.isFinite(rain)) {
      if (rain > 60) score -= 15;
      else if (rain > 35) score -= 8;
      else if (rain > 20) score -= 4;
    }

    if (Number.isFinite(tide)) {
      if (tide >= 4) score += 5;
      else if (tide < 2) score -= 5;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function buildDateDropdown(selectId = "dateSelect", days = 15) {
    const dateSelect = document.getElementById(selectId);
    if (!dateSelect) return;

    dateSelect.innerHTML = "";

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const value = toLocalDateString(date);

      const option = document.createElement("option");
      option.value = value;
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

  function findForecastIndex(times, dateString) {
    if (!Array.isArray(times)) return -1;

    const targetDate = dateString || getTodayString();

    const preferredHours = [
      "T12:00",
      "T13:00",
      "T14:00",
      "T11:00",
      "T10:00",
      "T15:00",
      "T09:00",
      "T16:00",
      "T08:00",
      "T17:00"
    ];

    for (const hour of preferredHours) {
      const index = times.findIndex(t => String(t).startsWith(`${targetDate}${hour}`));
      if (index >= 0) return index;
    }

    return times.findIndex(t => String(t).startsWith(targetDate));
  }

  function findDailyIndex(days, dateString) {
    if (!Array.isArray(days)) return -1;
    const targetDate = dateString || getTodayString();
    return days.findIndex(day => String(day) === targetDate);
  }

  function formatTime(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
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

  function roundOne(value) {
    if (value === null || value === undefined || isNaN(value)) return null;
    return Number(Number(value).toFixed(1));
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
    if (score >= 90) return "Excellent";
    if (score >= 75) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 45) return "Slow";
    return "Poor";
  }

  function stationForCounty(region) {
    return LOCATIONS[region]?.station || LOCATIONS["Los Angeles County"].station;
  }

  function waterStationForRegion(region) {
    return LOCATIONS[region]?.waterStation || stationForCounty(region);
  }

  function buoyForRegion(region) {
    return LOCATIONS[region]?.buoyStation || null;
  }

  function getTodayString() {
    return toLocalDateString(new Date());
  }

  function toLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return {
    LOCATIONS,
    noaaStations,
    getLocation,
    getConditions,
    getWeather,
    getNwsWeather,
    getOpenMeteoWeather,
    getMarine,
    getTides,
    getWaterTemp,
    formatTides,
    calculateTideMovement,
    calculateConditionScore,
    buildDateDropdown,
    parseWindSpeed,
    getWindDirection,
    degreesToCompass,
    rating,
    stationForCounty,
    waterStationForRegion,
    buoyForRegion
  };
})();
