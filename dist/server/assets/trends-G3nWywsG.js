import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from "recharts";
import { History, TrendingUp } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, R as REGIONS, f as formatNumber } from "./socalbite-CWMCmBXz.js";
import "@tanstack/react-router";
const METRICS = [{
  id: "fish",
  label: "Total fish"
}, {
  id: "fpa",
  label: "Fish per angler"
}, {
  id: "trips",
  label: "Trips"
}];
function TrendsPage() {
  const [metric, setMetric] = useState("fish");
  const [region, setRegion] = useState("All");
  const [species, setSpecies] = useState("All");
  const trends = useQuery({
    queryKey: ["trends"],
    queryFn: api.biteTrends
  });
  const allSpecies = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    (trends.data ?? []).forEach((t) => set.add(t.species));
    return ["All", ...Array.from(set).sort()];
  }, [trends.data]);
  const filtered = useMemo(() => {
    return (trends.data ?? []).filter((t) => (region === "All" || t.region === region) && (species === "All" || t.species === species));
  }, [trends.data, region, species]);
  const series = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    filtered.forEach((t) => {
      const k = `${t.year}-W${String(t.week).padStart(2, "0")}`;
      const e = m.get(k) ?? {
        week: k,
        value: 0,
        anglers: 0
      };
      if (metric === "fpa") {
        e.value += t.fish;
        e.anglers += t.anglers;
      } else if (metric === "fish") {
        e.value += t.fish;
      } else {
        e.value += t.trips;
      }
      m.set(k, e);
    });
    return Array.from(m.values()).map((r) => ({
      ...r,
      value: metric === "fpa" ? r.anglers ? r.value / r.anglers : 0 : r.value
    })).sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered, metric]);
  const totals = filtered.reduce((a, r) => ({
    fish: a.fish + r.fish,
    trips: a.trips + r.trips,
    anglers: a.anglers + r.anglers
  }), {
    fish: 0,
    trips: 0,
    anglers: 0
  });
  const leaderboard = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    filtered.forEach((t) => m.set(t.species, (m.get(t.species) ?? 0) + t.fish));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);
  const maxLb = leaderboard[0]?.[1] ?? 1;
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsxs("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(History, { className: "h-3.5 w-3.5" }),
        " Historical explorer"
      ] }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "The long view of the SoCal bite." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: "Twelve weeks of catch data — slice by species, region and effort metric to spot the trends that turn into tomorrow's bite." })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-card p-4 grid gap-3 md:grid-cols-3", children: [
        /* @__PURE__ */ jsx(Select, { label: "Metric", value: metric, onChange: (v) => setMetric(v), options: METRICS.map((m) => ({
          value: m.id,
          label: m.label
        })) }),
        /* @__PURE__ */ jsx(Select, { label: "Region", value: region, onChange: (v) => setRegion(v), options: ["All", ...REGIONS].map((r) => ({
          value: r,
          label: r
        })) }),
        /* @__PURE__ */ jsx(Select, { label: "Species", value: species, onChange: setSpecies, options: allSpecies.map((s) => ({
          value: s,
          label: s
        })) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsx(Kpi, { label: "Fish", value: formatNumber(totals.fish) }),
        /* @__PURE__ */ jsx(Kpi, { label: "Trips", value: formatNumber(totals.trips) }),
        /* @__PURE__ */ jsx(Kpi, { label: "FPA", value: (totals.anglers ? totals.fish / totals.anglers : 0).toFixed(2), accent: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-display text-lg font-bold flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4 text-primary" }),
            METRICS.find((m) => m.id === metric)?.label
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            series.length,
            " weeks"
          ] })
        ] }),
        trends.isLoading ? /* @__PURE__ */ jsx("div", { className: "h-72 grid place-items-center text-sm text-muted-foreground", children: "Loading…" }) : /* @__PURE__ */ jsx("div", { className: "h-72", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(AreaChart, { data: series, margin: {
          top: 10,
          right: 10,
          left: 0,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsxs("linearGradient", { id: "gMain", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsx("stop", { offset: "0%", stopColor: "var(--primary)", stopOpacity: 0.45 }),
            /* @__PURE__ */ jsx("stop", { offset: "100%", stopColor: "var(--primary)", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "week", tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false, width: 36 }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "oklch(0.16 0.04 240)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          }, formatter: (v) => metric === "fpa" ? v.toFixed(2) : formatNumber(v) }),
          /* @__PURE__ */ jsx(Area, { type: "monotone", dataKey: "value", stroke: "var(--primary)", strokeWidth: 2.5, fill: "url(#gMain)" })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-bold mb-3", children: "Top species in this slice" }),
        leaderboard.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-6 text-center text-sm text-muted-foreground", children: "No data for this filter." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: leaderboard.map(([name, v], i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: `font-mono text-xs tabular w-6 text-center ${i < 3 ? "text-gold" : "text-muted-foreground"}`, children: String(i + 1).padStart(2, "0") }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "font-semibold truncate", children: name }),
              /* @__PURE__ */ jsx("span", { className: "tabular text-muted-foreground", children: formatNumber(v) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1 h-1.5 rounded-full bg-surface-elevated overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-primary to-gold", style: {
              width: `${v / maxLb * 100}%`
            } }) })
          ] })
        ] }, name)) })
      ] })
    ] })
  ] });
}
function Select({
  label,
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1", children: label }),
    /* @__PURE__ */ jsx("select", { value, onChange: (e) => onChange(e.target.value), className: "w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary", children: options.map((o) => /* @__PURE__ */ jsx("option", { value: o.value, children: o.label }, o.value)) })
  ] });
}
function Kpi({
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-3.5", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 font-display font-bold tabular text-xl sm:text-2xl ${accent ? "text-primary" : ""}`, children: value })
  ] });
}
export {
  TrendsPage as component
};
