import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { LifeBuoy, Waves, Anchor, Thermometer, Sun, Wind, Compass, Droplets, Fish, Users } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { t as todayIso, a as api, R as REGIONS } from "./socalbite-CWMCmBXz.js";
import "@tanstack/react-router";
const MODES = [{
  id: "pier",
  label: "Pier",
  icon: LifeBuoy,
  tagline: "Pier score based on wind, tide movement, water temperature, UV and bait activity."
}, {
  id: "surf",
  label: "Surf",
  icon: Waves,
  tagline: "Surf fishing view using wind, swell, tide and water temperature."
}, {
  id: "boat",
  label: "Boat",
  icon: Anchor,
  tagline: "Boat condition score using NOAA tide, water temp and marine weather."
}];
function ConditionsPage() {
  const [mode, setMode] = useState("boat");
  const [region, setRegion] = useState("San Diego");
  const date = todayIso();
  const conditions = useQuery({
    queryKey: ["allConditions", date],
    queryFn: () => api.allRegionConditions(date),
    staleTime: 15 * 60 * 1e3
  });
  const current = useMemo(() => conditions.data?.find((c) => c.region === region), [conditions.data, region]);
  const curMode = MODES.find((m) => m.id === mode);
  const score = current ? scoreForMode(current, mode) : 0;
  const rating = ratingFor(score);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Conditions" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "Wind, water, tide — live from the source." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: curMode.tagline }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 inline-flex p-1 rounded-full border border-border bg-surface/60 backdrop-blur", children: MODES.map((m) => {
        const Icon = m.icon;
        const active = mode === m.id;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setMode(m.id), className: `px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`, children: [
          /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" }),
          " ",
          m.label
        ] }, m.id);
      }) }),
      /* @__PURE__ */ jsx("div", { className: "mt-5 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0", children: REGIONS.map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setRegion(r), className: `shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${region === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"}`, children: r }, r)) })
    ] }) }),
    conditions.isLoading || !current ? /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-16", children: /* @__PURE__ */ jsx("div", { className: "surface-card p-10 text-center text-muted-foreground", children: "Loading live NOAA conditions…" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[1fr_2fr]", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-card p-6 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-mesh opacity-20" }),
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: [
              region,
              " · ",
              curMode.label
            ] }),
            /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold mt-1", children: "Live Conditions Score" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex items-end gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular text-7xl text-primary", children: score }),
              /* @__PURE__ */ jsxs("div", { className: "pb-2 text-muted-foreground text-sm", children: [
                "/100 · ",
                rating
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
              /* @__PURE__ */ jsxs("span", { className: `chip ${rating === "Excellent" ? "chip-live" : rating === "Good" ? "chip-cyan" : "chip-gold"}`, children: [
                curMode.label,
                " window · ",
                rating
              ] }),
              /* @__PURE__ */ jsx("span", { className: "chip", children: current.weather.source })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Thermometer, { className: "h-4 w-4" }), label: "Water", value: `${current.waterTemp.toFixed(1)}°F`, sub: "NOAA latest" }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }), label: "Air", value: `${Math.round(current.weather.temperature)}°F`, sub: current.weather.shortForecast }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Wind, { className: "h-4 w-4" }), label: "Wind", value: `${current.windMph} mph`, sub: `${current.windDirection} · gusts ${current.gustMph || 0}` }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Compass, { className: "h-4 w-4" }), label: "Swell", value: `${current.swell.toFixed(1)} ft`, sub: "regional avg" }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Droplets, { className: "h-4 w-4" }), label: "Tide", value: current.tideLabel, sub: `${current.tideMovementFt.toFixed(2)} ft movement` }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4" }), label: "Targets", value: current.targets.slice(0, 2).join(", "), sub: current.targets.slice(2).join(", ") }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Sun, { className: "h-4 w-4" }), label: "Rain", value: fmtPct(current.weather.precipitationProbability) }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Waves, { className: "h-4 w-4" }), label: "Clouds", value: fmtPct(current.weather.cloudCover) }),
          /* @__PURE__ */ jsx(Tile, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "UV", value: current.weather.uvIndex === null || current.weather.uvIndex === void 0 ? "N/A" : String(Math.round(current.weather.uvIndex)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-10 grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold mb-4", children: "NOAA tide table" }),
          /* @__PURE__ */ jsx("div", { className: "space-y-2", children: current.formattedTides.map((t, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-md bg-surface-elevated p-3 text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: t.time }),
            /* @__PURE__ */ jsx("strong", { children: t.type }),
            /* @__PURE__ */ jsx("span", { className: "font-mono text-primary", children: t.height })
          ] }, `${t.time}-${i}`)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-xl font-bold mb-4", children: "Forecast notes" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: region }),
              " is showing ",
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: rating }),
              " ",
              curMode.label.toLowerCase(),
              " conditions."
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Water is ",
              /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
                current.waterTemp.toFixed(1),
                "°F"
              ] }),
              ", tide movement is ",
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: current.tideLabel }),
              ", and wind is ",
              /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
                current.windMph,
                " mph ",
                current.windDirection
              ] }),
              "."
            ] }),
            /* @__PURE__ */ jsxs("p", { children: [
              "Likely targets: ",
              /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: current.targets.join(", ") }),
              "."
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-16", children: [
        /* @__PURE__ */ jsxs("h3", { className: "font-display text-xl font-bold mb-4", children: [
          "All regions · ",
          curMode.label
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: (conditions.data ?? []).map((c) => {
          const s = scoreForMode(c, mode);
          const r = ratingFor(s);
          return /* @__PURE__ */ jsxs("button", { onClick: () => setRegion(c.region), className: `text-left surface-card p-4 hover:border-primary/50 transition ${c.region === region ? "border-primary/60" : ""}`, children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsx("span", { className: "font-display font-bold", children: c.region }),
              /* @__PURE__ */ jsxs("span", { className: `chip text-[10px] ${r === "Excellent" ? "chip-live" : r === "Good" ? "chip-cyan" : "chip-gold"}`, children: [
                s,
                " · ",
                r
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-3 grid grid-cols-3 gap-2 text-xs", children: [
              /* @__PURE__ */ jsx(Mini, { label: "Water", value: `${c.waterTemp.toFixed(0)}°F` }),
              /* @__PURE__ */ jsx(Mini, { label: "Wind", value: `${c.windMph} mph` }),
              /* @__PURE__ */ jsx(Mini, { label: "Tide", value: c.tideLabel })
            ] })
          ] }, c.region);
        }) })
      ] })
    ] })
  ] });
}
function scoreForMode(c, mode) {
  let score = c.score;
  if (mode === "pier") {
    if (c.windMph <= 8 && c.gustMph <= 16 && c.tideMovementFt >= 2.5) score += 6;
    if ((c.weather.uvIndex || 0) > 8) score -= 4;
  }
  if (mode === "surf") {
    if (c.swell <= 2.5 && c.windMph <= 10) score += 5;
    if (c.swell > 4.5 || c.windMph > 15) score -= 10;
  }
  if (mode === "boat") {
    if (c.windMph <= 8 && c.swell <= 3) score += 6;
    if (c.gustMph > 22 || c.swell > 4) score -= 12;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
function ratingFor(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Slow";
}
function fmtPct(v) {
  return v === null || v === void 0 ? "N/A" : `${Math.round(v)}%`;
}
function Tile({
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
    sub && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-muted-foreground mt-0.5 line-clamp-2", children: sub })
  ] });
}
function Mini({
  label,
  value
}) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("div", { className: "text-muted-foreground font-mono text-[10px] uppercase", children: label }),
    /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular", children: value })
  ] });
}
export {
  ConditionsPage as component
};
