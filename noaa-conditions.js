async function getNwsHourlyForecast(lat, lon) {
  const pointUrl = `https://api.weather.gov/points/${lat},${lon}`;
  const pointRes = await fetch(pointUrl);
  const pointData = await pointRes.json();

  const hourlyUrl = pointData.properties.forecastHourly;
  const hourlyRes = await fetch(hourlyUrl);
  const hourlyData = await hourlyRes.json();

  return hourlyData.properties.periods;
}

async function getNoaaTides(stationId, dateString) {
  const cleanDate = dateString.replaceAll("-", "");

  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?begin_date=${cleanDate}` +
    `&range=24` +
    `&station=${stationId}` +
    `&product=predictions` +
    `&datum=MLLW` +
    `&time_zone=lst_ldt` +
    `&interval=hilo` +
    `&units=english` +
    `&format=json`;

  const res = await fetch(url);
  const data = await res.json();

  return data.predictions || [];
}

async function getNoaaWaterTemp(stationId) {
  const url =
    `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter` +
    `?date=latest` +
    `&station=${stationId}` +
    `&product=water_temperature` +
    `&time_zone=lst_ldt` +
    `&units=english` +
    `&format=json`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.data || !data.data.length) return null;

    return Number(data.data[0].v).toFixed(1);
  } catch {
    return null;
  }
}

function pickForecastForDate(hourlyPeriods, dateString) {
  return hourlyPeriods.find(period => period.startTime.startsWith(dateString)) || hourlyPeriods[0];
}

function formatNoaaTides(tides) {
  return tides.map(tide => ({
    time: new Date(tide.t.replace(" ", "T")).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    }),
    type: tide.type === "H" ? "High Tide" : "Low Tide",
    height: `${Number(tide.v).toFixed(1)} ft`
  }));
}
