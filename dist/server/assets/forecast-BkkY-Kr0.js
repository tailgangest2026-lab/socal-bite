import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Tooltip, Area } from "recharts";
import { Thermometer, Wind, Compass, Droplets, Fish, Users, Anchor, Moon, TrendingUp } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, R as REGIONS } from "./socalbite-CWMCmBXz.js";
import "@tanstack/react-router";
function ForecastPage() {
  const forecasts = useQuery({
    queryKey: ["regionForecasts"],
    queryFn: api.regionForecasts,
    staleTime: 15 * 60 * 1e3
  });
  const [region, setRegion] = useState("San Diego");
  const selected = useMemo(() => {
    return forecasts.data?.find((f) => f.region === region) ?? forecasts.data?.[0];
  }, [forecasts.data, region]);
  const chartData = useMemo(() => {
    return (forecasts.data ?? []).map((f) => ({
      region: f.region.replace(" County", ""),
      score: f.finalScore
    }));
  }, [forecasts.data]);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Bite Forecast" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "Real forecast. Real fish counts. Real NOAA conditions." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: "This score blends your recent daily reports with wind, gusts, tide movement, water temperature, weather, moon phase, trip volume and fish-per-angler trends." }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0", children: REGIONS.map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setRegion(r), className: `shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${region === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"}`, children: r }, r)) })
    ] }) }),
    forecasts.isLoading || !selected ? /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-16", children: /* @__PURE__ */ jsx("div", { className: "surface-card p-10 text-center text-muted-foreground", children: "Loading live forecast data…" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[1fr_2fr]", children: [
        /* @__PURE__ */ jsx(ScoreDial, { forecast: selected }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Thermometer, { className: "h-4 w-4" }), label: "Water", value: `${selected.condition.waterTemp.toFixed(1)}°F`, sub: selected.condition.weather.source }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Wind, { className: "h-4 w-4" }), label: "Wind", value: `${selected.condition.windMph} mph ${selected.condition.windDirection}`, sub: `Gusts ${selected.condition.gustMph || 0} mph` }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Compass, { className: "h-4 w-4" }), label: "Swell", value: `${selected.condition.swell.toFixed(1)} ft`, sub: "regional avg" }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Droplets, { className: "h-4 w-4" }), label: "Tide", value: selected.condition.tideLabel, sub: `${selected.condition.tideMovementFt.toFixed(2)} ft movement` }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4" }), label: "7-day fish", value: selected.last7Fish.toLocaleString() }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "FPA", value: selected.fpa.toFixed(2), sub: `${selected.last7Anglers.toLocaleString()} anglers` }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Anchor, { className: "h-4 w-4" }), label: "Trips", value: `${selected.last7Trips}`, sub: `prev ${selected.previous7Trips}` }),
          /* @__PURE__ */ jsx(CondTile, { icon: /* @__PURE__ */ jsx(Moon, { className: "h-4 w-4" }), label: "Moon", value: selected.moon.phase, sub: `score ${selected.moon.score}` })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-10 grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-card p-5 sm:p-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary mb-1", children: "Regional scores" }),
              /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold", children: "Tomorrow's bite score" })
            ] }),
            /* @__PURE__ */ jsx("span", { className: "chip", children: "Live NOAA" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-72 w-full", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, { data: chartData, margin: {
            top: 10,
            right: 12,
            left: 0,
            bottom: 0
          }, children: [
            /* @__PURE__ */ jsx(XAxis, { dataKey: "region", tick: {
              fill: "var(--muted-foreground)",
              fontSize: 10
            }, tickLine: false, axisLine: false }),
            /* @__PURE__ */ jsx(YAxis, { domain: [0, 100], tick: {
              fill: "var(--muted-foreground)",
              fontSize: 10
            }, tickLine: false, axisLine: false, width: 28 }),
            /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
              background: "oklch(0.16 0.04 240)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12
            } }),
            /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "score", stroke: "var(--primary)", fill: "var(--primary)", fillOpacity: 0.18, strokeWidth: 2 })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "surface-card p-5 sm:p-6", children: [
          /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary mb-1", children: "Score factors" }),
          /* @__PURE__ */ jsxs("h3", { className: "font-display text-xl font-bold mb-4", children: [
            "Why ",
            selected.region,
            " scored ",
            selected.finalScore
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsx(Factor, { label: "Trend", value: selected.trendScore }),
            /* @__PURE__ */ jsx(Factor, { label: "Volume", value: selected.volumeScore }),
            /* @__PURE__ */ jsx(Factor, { label: "FPA", value: selected.fpaScore }),
            /* @__PURE__ */ jsx(Factor, { label: "Trips", value: selected.tripScore }),
            /* @__PURE__ */ jsx(Factor, { label: "Wind", value: scoreWind(selected) }),
            /* @__PURE__ */ jsx(Factor, { label: "Tide", value: scoreTide(selected) }),
            /* @__PURE__ */ jsx(Factor, { label: "Water", value: scoreTemp(selected) }),
            /* @__PURE__ */ jsx(Factor, { label: "Moon", value: selected.moon.score })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-5 text-sm text-muted-foreground", children: [
            "Forecast: ",
            selected.condition.weather.shortForecast,
            ". Rain chance ",
            fmtPct(selected.condition.weather.precipitationProbability),
            ", cloud cover ",
            fmtPct(selected.condition.weather.cloudCover),
            ", UV ",
            selected.condition.weather.uvIndex ?? "N/A",
            "."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-16", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Panel, { title: "Top bite", rows: selected.topSpecies.map((s) => [s.species, s.count.toLocaleString()]) }),
        /* @__PURE__ */ jsx(Panel, { title: "Top boats", rows: selected.topBoats.map((b) => [b.boat, b.fish.toLocaleString()]) }),
        /* @__PURE__ */ jsx(Panel, { title: "Top landings", rows: selected.topLandings.map((l) => [l.landing, l.fish.toLocaleString()]) })
      ] }) })
    ] })
  ] });
}
function ScoreDial({
  forecast
}) {
  const color = forecast.finalScore >= 85 ? "var(--success)" : forecast.finalScore >= 70 ? "var(--gold)" : "var(--muted-foreground)";
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-mesh opacity-20" }),
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: forecast.region }),
      /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold mt-1", children: "Bite Score" }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 relative h-44 grid place-items-center", children: [
        /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 200 120", className: "absolute inset-0 w-full h-full", children: [
          /* @__PURE__ */ jsx("path", { d: "M20 110 A 80 80 0 0 1 180 110", fill: "none", stroke: "var(--border)", strokeWidth: "12", strokeLinecap: "round" }),
          /* @__PURE__ */ jsx("path", { d: "M20 110 A 80 80 0 0 1 180 110", fill: "none", stroke: color, strokeWidth: "12", strokeLinecap: "round", strokeDasharray: "251", strokeDashoffset: 251 - 251 * forecast.finalScore / 100 })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-center pt-6", children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular text-6xl", style: {
            color
          }, children: forecast.finalScore }),
          /* @__PURE__ */ jsx("div", { className: "text-xs uppercase font-mono tracking-wider text-muted-foreground mt-1", children: forecast.label })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 grid grid-cols-2 gap-2 text-xs", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-surface-elevated p-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "7-day fish" }),
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("strong", { children: forecast.last7Fish.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-md bg-surface-elevated p-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "Previous 7" }),
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("strong", { children: forecast.previous7Fish.toLocaleString() })
        ] })
      ] })
    ] })
  ] });
}
function CondTile({
  icon,
  label,
  value,
  sub
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-3.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: [
      icon,
      /* @__PURE__ */ jsx("span", { children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 font-display font-bold tabular text-xl", children: value }),
    sub && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground mt-0.5", children: sub })
  ] });
}
function Factor({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-surface-elevated p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: label }),
    /* @__PURE__ */ jsx("div", { className: "mt-1 font-display font-bold text-2xl tabular", children: value })
  ] });
}
function Panel({
  title,
  rows
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-4", children: [
    /* @__PURE__ */ jsxs("h4", { className: "font-display font-bold mb-3 flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-primary" }),
      title
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: rows.length ? rows.map(([name, value]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-3 text-sm", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate text-muted-foreground", children: name }),
      /* @__PURE__ */ jsx("strong", { children: value })
    ] }, name)) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "No recent data." }) })
  ] });
}
function fmtPct(v) {
  return v === null || v === void 0 ? "N/A" : `${Math.round(v)}%`;
}
function scoreWind(f) {
  const w = f.condition.windMph, g = f.condition.gustMph;
  if (!w && !g) return 55;
  if (w <= 6 && g <= 12) return 90;
  if (w <= 10 && g <= 18) return 78;
  if (w <= 15 && g <= 24) return 62;
  if (w <= 20 && g <= 30) return 42;
  return 25;
}
function scoreTide(f) {
  const m = f.condition.tideMovementFt;
  if (!m) return 55;
  if (m >= 4) return 90;
  if (m >= 2.5) return 78;
  if (m >= 1.5) return 62;
  if (m >= 0.75) return 45;
  return 30;
}
function scoreTemp(f) {
  const t = f.condition.waterTemp;
  if (!t) return 55;
  if (t >= 64 && t <= 68) return 90;
  if (t >= 61 && t < 64) return 76;
  if (t > 68 && t <= 72) return 76;
  if (t >= 58 && t < 61) return 60;
  if (t > 72 && t <= 76) return 58;
  return 40;
}
export {
  ForecastPage as component
};
