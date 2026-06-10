// Live data + NOAA/Open-Meteo helpers for The SoCal Bite.
// In production this reads same-origin JSON from /public. In local dev it falls back to thesocalbite.com.

const LIVE_BASE = "https://thesocalbite.com";

function getBase() {
  if (typeof window === "undefined") return LIVE_BASE;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return LIVE_BASE;
  return "";
}

async function fetchJson<T>(path: string): Promise<T> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${getBase()}${cleanPath}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${cleanPath}: ${res.status}`);
  return res.json() as Promise<T>;
}

export type Region =
  | "Los Angeles"
  | "Orange County"
  | "San Diego"
  | "Ventura"
  | "Santa Barbara"
  | "San Luis Obispo";

export const REGIONS: Region[] = [
  "Los Angeles",
  "Orange County",
  "San Diego",
  "Ventura",
  "Santa Barbara",
  "San Luis Obispo",
];

export const REGION_CONDITIONS: Record<Region, { lat: number; lon: number; station: string; fallbackWater: number; swell: number; targets: string[] }> = {
  "San Diego": { lat: 32.7157, lon: -117.1611, station: "9410170", fallbackWater: 67, swell: 2.4, targets: ["Yellowtail", "Tuna", "Bonito", "Calico Bass"] },
  "Orange County": { lat: 33.6037, lon: -117.9, station: "9410580", fallbackWater: 66, swell: 2.5, targets: ["Yellowtail", "Calico Bass", "Bonito", "Barracuda"] },
  "Los Angeles": { lat: 33.7405, lon: -118.2817, station: "9410660", fallbackWater: 65, swell: 2.6, targets: ["Calico Bass", "Rockfish", "Sculpin", "Yellowtail"] },
  "Ventura": { lat: 34.2746, lon: -119.229, station: "9411189", fallbackWater: 62, swell: 3.0, targets: ["Rockfish", "Whitefish", "Calico Bass", "Yellowtail"] },
  "Santa Barbara": { lat: 34.4208, lon: -119.6982, station: "9411340", fallbackWater: 61, swell: 2.8, targets: ["Rockfish", "Whitefish", "Sheephead", "Lingcod"] },
  "San Luis Obispo": { lat: 35.2828, lon: -120.6596, station: "9412110", fallbackWater: 58, swell: 3.2, targets: ["Rockfish", "Lingcod", "Cabezon", "Whitefish"] },
};

export interface HomeRegion { region: Region; total_trips_today: number; total_anglers_today: number; total_fish_today: number; top_boat_today: string; top_landing_today: string; top_species_today: string; best_boat_last_30_days: string; best_boat_last_90_days: string; most_caught_species_last_30_days: string; most_caught_species_last_90_days: string; }
export interface BoatRanking { rank: number; region: Region; trip_type: string; boat: string; landing: string; trips: number; anglers: number; fish: number; fpa: number; }
export interface LandingRanking { rank: number; region: Region; landing: string; trips: number; anglers: number; fish: number; fpa: number; }
export interface DailyTrip { trip_date: string; region: Region; landing: string; boat: string; trip_type: string; anglers: number; fish_counts: string; total_fish: number; }
export interface DailyIndexEntry { date: string; file: string; }
export interface BiteTrend { year: number; week: number; region: Region; species: string; trips: number; anglers: number; fish: number; fpa: number; }
export interface TripPrice { region: Region; landing: string; boat: string; trip_type: string; price: number; notes: string; booking_url: string; source_url: string; last_updated: string; }

export interface WeatherData {
  temperature: number;
  windSpeed: number;
  windGusts: number | null;
  windDirection: string;
  precipitationProbability: number | null;
  cloudCover: number | null;
  humidity: number | null;
  pressure: number | null;
  visibility: number | null;
  uvIndex: number | null;
  shortForecast: string;
  source: string;
}
export interface TidePrediction { t?: string; v?: string; type?: "H" | "L" | string; time?: string; height?: string; }
export interface RegionConditions {
  region: Region;
  date: string;
  weather: WeatherData;
  tides: TidePrediction[];
  formattedTides: { time: string; type: string; height: string }[];
  windMph: number;
  gustMph: number;
  windDirection: string;
  tideMovementFt: number;
  tideLabel: string;
  waterTemp: number;
  swell: number;
  rating: string;
  score: number;
  targets: string[];
}
export interface RegionForecast {
  region: Region;
  finalScore: number;
  label: string;
  last7Fish: number;
  previous7Fish: number;
  last7Anglers: number;
  last7Trips: number;
  previous7Trips: number;
  fpa: number;
  trendScore: number;
  volumeScore: number;
  fpaScore: number;
  tripScore: number;
  moon: { phase: string; score: number; age: number };
  condition: RegionConditions;
  topSpecies: { species: string; count: number }[];
  topBoats: { boat: string; fish: number }[];
  topLandings: { landing: string; fish: number }[];
}

export const api = {
  home: () => fetchJson<HomeRegion[]>("/home.json"),
  boats: () => fetchJson<BoatRanking[]>("/boat-ratings.json"),
  landings: () => fetchJson<LandingRanking[]>("/landings.json"),
  dailyIndex: () => fetchJson<DailyIndexEntry[]>("/daily-report-index.json"),
  dailyReport: (file: string) => fetchJson<DailyTrip[]>(`/${file}`),
  biteTrends: () => fetchJson<BiteTrend[]>("/bite-trends.json"),
  prices: () => fetchJson<TripPrice[]>("/trip-prices.json"),
  regionConditions: (region: Region, date = todayIso()) => loadRegionConditions(region, date),
  allRegionConditions: (date = todayIso()) => Promise.all(REGIONS.map((r) => loadRegionConditions(r, date))),
  regionForecasts: () => buildRegionForecasts(),
};

export async function buildRegionForecasts(daysBack = 14): Promise<RegionForecast[]> {
  const rows = await loadRecentReports(daysBack);
  const tomorrow = addDaysIso(1);
  const conditions = await Promise.all(REGIONS.map((region) => loadRegionConditions(region, tomorrow)));
  const conditionByRegion = new Map(conditions.map((c) => [c.region, c]));
  const today = new Date();

  return REGIONS.map((region) => {
    const regionRows = rows.filter((row) => clean(row.region) === clean(region));
    const last7Rows = regionRows.filter((row) => {
      const age = daysAgo(new Date(row.trip_date), today);
      return age >= 1 && age <= 7;
    });
    const previous7Rows = regionRows.filter((row) => {
      const age = daysAgo(new Date(row.trip_date), today);
      return age >= 8 && age <= 14;
    });
    return calculateRegionForecast(region, last7Rows, previous7Rows, conditionByRegion.get(region) ?? defaultRegionConditions(region, tomorrow));
  }).sort((a, b) => b.finalScore - a.finalScore);
}

async function loadRecentReports(daysBack: number) {
  const rows: DailyTrip[] = [];
  for (let i = 1; i <= daysBack; i++) {
    const dateStr = addDaysIso(-i);
    const files = [`reports/daily-report-${dateStr}.json`, `daily-report-${dateStr}.json`];
    for (const file of files) {
      try {
        const data = await fetchJson<DailyTrip[]>(file);
        if (Array.isArray(data)) { rows.push(...data); break; }
      } catch { /* skip missing report dates */ }
    }
  }
  return rows;
}

export async function loadRegionConditions(region: Region, date: string): Promise<RegionConditions> {
  const base = REGION_CONDITIONS[region];
  if (!base) return defaultRegionConditions(region, date);
  try {
    const [weather, tides, waterTempRaw] = await Promise.all([
      getWeather(base.lat, base.lon, date),
      getTides(base.station, date),
      getWaterTemp(base.station),
    ]);
    const windMph = parseWindSpeed(weather.windSpeed, 8);
    const gustMph = Number(weather.windGusts || 0);
    const waterTemp = Number(waterTempRaw || base.fallbackWater);
    const tideMovementFt = getTideMovementFeet(tides);
    const tideLabel = getTideLabel(tideMovementFt);
    const score = calculateConditionsScore(windMph, gustMph, base.swell, waterTemp, tideMovementFt, weather);
    return { region, date, weather, tides, formattedTides: formatTides(tides), windMph, gustMph, windDirection: weather.windDirection || "W", tideMovementFt, tideLabel, waterTemp, swell: base.swell, rating: rating(score), score, targets: base.targets };
  } catch {
    return defaultRegionConditions(region, date);
  }
}

async function getWeather(lat: number, lon: number, dateString: string): Promise<WeatherData> {
  const [nws, openMeteo] = await Promise.all([getNwsWeather(lat, lon, dateString), getOpenMeteoWeather(lat, lon, dateString)]);
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
    shortForecast: nws?.shortForecast ?? weatherSummary(openMeteo?.weatherCode),
    source: openMeteo ? "Open-Meteo + NOAA" : "NOAA",
  };
}

async function getNwsWeather(lat: number, lon: number, dateString: string) {
  try {
    const pointRes = await fetch(`https://api.weather.gov/points/${lat},${lon}`);
    if (!pointRes.ok) throw new Error("NWS point lookup failed");
    const pointData = await pointRes.json();
    const hourlyUrl = pointData.properties?.forecastHourly;
    const hourlyRes = await fetch(hourlyUrl);
    if (!hourlyRes.ok) throw new Error("NWS hourly forecast failed");
    const hourlyData = await hourlyRes.json();
    const periods = hourlyData.properties?.periods || [];
    const period = periods.find((p: any) => String(p.startTime).startsWith(dateString)) || periods[0];
    if (!period) return null;
    return { temperature: period.temperature, windSpeed: parseWindSpeed(period.windSpeed, 8), windDirection: period.windDirection || "W", shortForecast: period.shortForecast || "Forecast available" };
  } catch { return null; }
}

async function getOpenMeteoWeather(lat: number, lon: number, dateString: string) {
  try {
    const hourlyVars = ["temperature_2m", "relative_humidity_2m", "precipitation_probability", "weather_code", "cloud_cover", "visibility", "pressure_msl", "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m", "uv_index"].join(",");
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=${hourlyVars}&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FLos_Angeles&forecast_days=10`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Open-Meteo request failed");
    const data = await res.json();
    const hourly = data.hourly;
    if (!hourly?.time) return null;
    let index = hourly.time.findIndex((t: string) => t.startsWith(`${dateString}T06`));
    if (index < 0) index = hourly.time.findIndex((t: string) => t.startsWith(dateString));
    if (index < 0) return null;
    return { temperature: hourly.temperature_2m?.[index], humidity: hourly.relative_humidity_2m?.[index], precipitationProbability: hourly.precipitation_probability?.[index], weatherCode: hourly.weather_code?.[index], cloudCover: hourly.cloud_cover?.[index], visibility: metersToMiles(hourly.visibility?.[index]), pressure: hourly.pressure_msl?.[index], windSpeed: hourly.wind_speed_10m?.[index], windDirectionText: degreesToCompass(hourly.wind_direction_10m?.[index]), windGusts: hourly.wind_gusts_10m?.[index], uvIndex: hourly.uv_index?.[index] };
  } catch { return null; }
}

async function getTides(stationId: string, dateString: string): Promise<TidePrediction[]> {
  try {
    const cleanDate = dateString.replaceAll("-", "");
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${cleanDate}&range=24&station=${stationId}&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("NOAA tide request failed");
    const data = await res.json();
    return data.predictions || [];
  } catch { return []; }
}

async function getWaterTemp(stationId: string): Promise<number | null> {
  try {
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=${stationId}&product=water_temperature&time_zone=lst_ldt&units=english&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("NOAA water temp request failed");
    const data = await res.json();
    if (!data.data?.length) return null;
    return Number(data.data[0].v);
  } catch { return null; }
}

function calculateRegionForecast(region: Region, last7Rows: DailyTrip[], previous7Rows: DailyTrip[], condition: RegionConditions): RegionForecast {
  const last7Fish = sumFish(last7Rows);
  const previous7Fish = sumFish(previous7Rows);
  const last7Anglers = sumAnglers(last7Rows);
  const last7Trips = countTrips(last7Rows);
  const previous7Trips = countTrips(previous7Rows);
  const fpa = last7Anglers > 0 ? last7Fish / last7Anglers : 0;
  const trendScore = getTrendScore(last7Fish, previous7Fish);
  const volumeScore = getVolumeScore(last7Fish);
  const fpaScore = getFpaScore(fpa);
  const tripScore = getTripScore(last7Trips, previous7Trips);
  const moon = getMoonPhaseScore(new Date(addDaysIso(1)));
  const windScore = getWindScore(condition.windMph, condition.gustMph);
  const tideScore = getTideScore(condition.tideMovementFt);
  const waterTempScore = getWaterTempScore(condition.waterTemp);
  const finalScore = Math.round(trendScore * 0.30 + volumeScore * 0.22 + fpaScore * 0.25 + tripScore * 0.10 + moon.score * 0.04 + windScore * 0.04 + tideScore * 0.03 + waterTempScore * 0.02);
  return { region, finalScore, label: rating(finalScore), last7Fish, previous7Fish, last7Anglers, last7Trips, previous7Trips, fpa, trendScore, volumeScore, fpaScore, tripScore, moon, condition, topSpecies: getTopSpecies(last7Rows), topBoats: getTopBoats(last7Rows), topLandings: getTopLandings(last7Rows) };
}

function calculateConditionsScore(wind: number, gusts: number, swell: number, waterTemp: number, tideMovement: number, weather: WeatherData) {
  let score = 78;
  if (wind <= 8) score += 10; else if (wind > 12) score -= 18;
  if (gusts > 20) score -= 10;
  if ((weather.precipitationProbability || 0) > 40) score -= 8;
  if ((weather.uvIndex || 0) > 7) score -= 3;
  if (swell <= 3) score += 8; else if (swell > 4) score -= 15;
  if (waterTemp >= 64 && waterTemp <= 69) score += 8; else if (waterTemp < 60) score -= 8;
  if (tideMovement >= 4) score += 8; else if (tideMovement < 1.5) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function defaultRegionConditions(region: Region, date: string): RegionConditions {
  const base = REGION_CONDITIONS[region];
  const weather = { temperature: 70, windSpeed: 8, windGusts: null, windDirection: "W", precipitationProbability: null, cloudCover: null, humidity: null, pressure: null, visibility: null, uvIndex: null, shortForecast: "Forecast available", source: "Fallback" };
  return { region, date, weather, tides: [], formattedTides: formatTides([]), windMph: 8, gustMph: 0, windDirection: "W", tideMovementFt: 0, tideLabel: "Unknown", waterTemp: base?.fallbackWater ?? 64, swell: base?.swell ?? 2.8, rating: "Fair", score: 60, targets: base?.targets ?? [] };
}

function getTopSpecies(rows: DailyTrip[]) {
  const totals = new Map<string, number>();
  rows.forEach((row) => String(row.fish_counts || "").split(",").forEach((item) => {
    const match = item.trim().match(/^(\d+)\s+(.+)$/);
    if (!match) return;
    totals.set(match[2].trim(), (totals.get(match[2].trim()) || 0) + Number(match[1]));
  }));
  return Array.from(totals.entries()).map(([species, count]) => ({ species, count })).sort((a, b) => b.count - a.count).slice(0, 5);
}
function getTopBoats(rows: DailyTrip[]) { return aggregateBy(rows, "boat").map(([boat, fish]) => ({ boat, fish })).slice(0, 5); }
function getTopLandings(rows: DailyTrip[]) { return aggregateBy(rows, "landing").map(([landing, fish]) => ({ landing, fish })).slice(0, 5); }
function aggregateBy(rows: DailyTrip[], key: "boat" | "landing") { const m = new Map<string, number>(); rows.forEach((r) => { const k = r[key]; if (k) m.set(k, (m.get(k) || 0) + Number(r.total_fish || 0)); }); return Array.from(m.entries()).sort((a, b) => b[1] - a[1]); }
function sumFish(rows: DailyTrip[]) { return rows.reduce((t, r) => t + Number(r.total_fish || 0), 0); }
function sumAnglers(rows: DailyTrip[]) { return rows.reduce((t, r) => t + Number(r.anglers || 0), 0); }
function countTrips(rows: DailyTrip[]) { return new Set(rows.map((r) => `${r.trip_date}|${r.landing}|${r.boat}|${r.trip_type}`)).size; }
function getTrendScore(last7: number, previous7: number) { if (last7 <= 0) return 0; if (previous7 <= 0) return 65; const change = (last7 - previous7) / previous7; if (change >= 0.75) return 95; if (change >= 0.40) return 85; if (change >= 0.15) return 75; if (change >= 0) return 65; if (change >= -0.25) return 48; return 30; }
function getVolumeScore(fish: number) { if (fish >= 10000) return 92; if (fish >= 5000) return 82; if (fish >= 2500) return 70; if (fish >= 1000) return 52; if (fish > 0) return 32; return 0; }
function getFpaScore(fpa: number) { if (fpa >= 8) return 92; if (fpa >= 5) return 82; if (fpa >= 3) return 70; if (fpa >= 1.5) return 52; if (fpa > 0) return 32; return 0; }
function getTripScore(last7Trips: number, previous7Trips: number) { if (last7Trips <= 0) return 0; if (previous7Trips <= 0) return 65; const change = (last7Trips - previous7Trips) / previous7Trips; if (change >= 0.50) return 90; if (change >= 0.25) return 80; if (change >= 0) return 65; if (change >= -0.25) return 48; return 30; }
function getMoonPhaseScore(date = new Date()) { const knownNewMoon = new Date("2000-01-06T18:14:00Z"); const lunarCycle = 29.53058867; const daysSinceNewMoon = (date.getTime() - knownNewMoon.getTime()) / 86400000; const age = ((daysSinceNewMoon % lunarCycle) + lunarCycle) % lunarCycle; if (age < 1.84566) return { phase: "New Moon", score: 85, age }; if (age < 5.53699) return { phase: "Waxing Crescent", score: 65, age }; if (age < 9.22831) return { phase: "First Quarter", score: 72, age }; if (age < 12.91963) return { phase: "Waxing Gibbous", score: 60, age }; if (age < 16.61096) return { phase: "Full Moon", score: 82, age }; if (age < 20.30228) return { phase: "Waning Gibbous", score: 60, age }; if (age < 23.99361) return { phase: "Last Quarter", score: 72, age }; if (age < 27.68493) return { phase: "Waning Crescent", score: 65, age }; return { phase: "New Moon", score: 85, age }; }
function getWindScore(wind: number, gusts: number) { if (!wind && !gusts) return 55; if (wind <= 6 && gusts <= 12) return 90; if (wind <= 10 && gusts <= 18) return 78; if (wind <= 15 && gusts <= 24) return 62; if (wind <= 20 && gusts <= 30) return 42; return 25; }
function getTideScore(movement: number) { if (!movement) return 55; if (movement >= 4) return 90; if (movement >= 2.5) return 78; if (movement >= 1.5) return 62; if (movement >= 0.75) return 45; return 30; }
function getWaterTempScore(temp: number) { if (!temp) return 55; if (temp >= 64 && temp <= 68) return 90; if (temp >= 61 && temp < 64) return 76; if (temp > 68 && temp <= 72) return 76; if (temp >= 58 && temp < 61) return 60; if (temp > 72 && temp <= 76) return 58; return 40; }
function getTideMovementFeet(tides: TidePrediction[]) { const heights = tides.map((t) => Number(t.v)).filter(Number.isFinite); if (heights.length < 2) return 0; return Math.max(...heights) - Math.min(...heights); }
function getTideLabel(movement: number) { if (!movement) return "Unknown"; if (movement >= 4) return "Strong"; if (movement >= 2.5) return "Good"; if (movement >= 1.5) return "Moderate"; if (movement >= 0.75) return "Weak"; return "Very Weak"; }
function formatTides(tides: TidePrediction[]) { if (!tides.length) return [{ time: "N/A", type: "High Tide", height: "Unavailable" }, { time: "N/A", type: "Low Tide", height: "Unavailable" }]; return tides.map((tide) => ({ time: new Date(String(tide.t).replace(" ", "T")).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }), type: tide.type === "H" ? "High Tide" : "Low Tide", height: `${Number(tide.v).toFixed(1)} ft` })); }
function parseWindSpeed(windSpeedText: unknown, fallback = 8) { if (typeof windSpeedText === "number") return Math.round(windSpeedText); if (!windSpeedText) return fallback; const match = String(windSpeedText).match(/\d+/); return match ? Number(match[0]) : fallback; }
function degreesToCompass(degrees: number | null | undefined) { if (degrees === null || degrees === undefined || Number.isNaN(degrees)) return "W"; return ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(degrees / 45) % 8]; }
function metersToMiles(meters: number | null | undefined) { if (meters === null || meters === undefined || Number.isNaN(meters)) return null; return Number((meters / 1609.344).toFixed(1)); }
function weatherSummary(code?: number) { const map: Record<number, string> = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 61: "Light rain", 63: "Rain", 65: "Heavy rain", 80: "Rain showers", 81: "Rain showers", 82: "Heavy rain showers", 95: "Thunderstorms" }; return code === undefined ? "Forecast available" : map[code] || "Forecast available"; }
function rating(score: number) { if (score >= 85) return "Excellent"; if (score >= 70) return "Good"; if (score >= 55) return "Fair"; return "Slow"; }
function daysAgo(date: Date, today: Date) { if (!date || Number.isNaN(date.getTime())) return 999; return Math.floor((today.getTime() - date.getTime()) / 86400000); }
function clean(value: unknown) { return String(value || "").trim().toLowerCase(); }
export function formatNumber(n: number) { return new Intl.NumberFormat("en-US").format(Math.round(n || 0)); }
export function formatDate(iso: string) { const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : "")); return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }); }
export function regionSlug(r: string) { return r.toLowerCase().replace(/\s+/g, "-"); }
export function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
export function unslugify(s: string, candidates: string[]): string | undefined { return candidates.find((c) => slugify(c) === s); }
export function todayIso() { return new Date().toISOString().slice(0, 10); }
export function addDaysIso(days: number) { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }
