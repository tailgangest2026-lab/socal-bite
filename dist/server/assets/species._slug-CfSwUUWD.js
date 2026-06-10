import { jsx, jsxs } from "react/jsx-runtime";
import { notFound, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, BarChart, Bar, Cell } from "recharts";
import { ArrowLeft, Fish, Users, TrendingUp, MapPin, Trophy } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, u as unslugify, R as REGIONS, f as formatNumber } from "./socalbite-CWMCmBXz.js";
import { R as Route } from "./router-NVskPDW1.js";
import "zod";
function SpeciesDetailPage() {
  const {
    slug
  } = Route.useParams();
  const trends = useQuery({
    queryKey: ["trends"],
    queryFn: api.biteTrends
  });
  const boats = useQuery({
    queryKey: ["boats"],
    queryFn: api.boats
  });
  const allSpecies = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    (trends.data ?? []).forEach((t) => set.add(t.species));
    return Array.from(set);
  }, [trends.data]);
  const speciesName = useMemo(() => unslugify(slug, allSpecies), [slug, allSpecies]);
  const rows = useMemo(() => (trends.data ?? []).filter((t) => t.species === speciesName), [trends.data, speciesName]);
  const totals = rows.reduce((a, r) => ({
    fish: a.fish + r.fish,
    trips: a.trips + r.trips,
    anglers: a.anglers + r.anglers
  }), {
    fish: 0,
    trips: 0,
    anglers: 0
  });
  const fpa = totals.anglers ? totals.fish / totals.anglers : 0;
  const byWeek = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    rows.forEach((r) => {
      const k = `W${String(r.week).padStart(2, "0")}`;
      const e = m.get(k) ?? {
        week: k,
        fish: 0,
        fpa: 0
      };
      e.fish += r.fish;
      e.fpa = Math.max(e.fpa, r.fpa);
      m.set(k, e);
    });
    return Array.from(m.values()).sort((a, b) => a.week.localeCompare(b.week));
  }, [rows]);
  const byRegion = useMemo(() => {
    return REGIONS.map((region) => {
      const sub = rows.filter((r) => r.region === region);
      return {
        region,
        short: region.split(" ").map((w) => w[0]).join(""),
        fish: sub.reduce((s, r) => s + r.fish, 0),
        anglers: sub.reduce((s, r) => s + r.anglers, 0)
      };
    }).sort((a, b) => b.fish - a.fish);
  }, [rows]);
  if (trends.isLoading) {
    return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-16", children: /* @__PURE__ */ jsx("div", { className: "h-72 surface-card animate-pulse" }) }) });
  }
  if (!speciesName) {
    throw notFound();
  }
  const topRegion = byRegion[0];
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-10", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/species", className: "inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
        " All species"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap items-end gap-x-6 gap-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Species dossier" }),
          /* @__PURE__ */ jsxs("h1", { className: "mt-1 font-display text-4xl sm:text-6xl font-bold tracking-tight flex items-center gap-3", children: [
            /* @__PURE__ */ jsx(Fish, { className: "h-9 w-9 text-primary" }),
            speciesName
          ] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "chip chip-cyan", children: [
          rows.length,
          " weekly samples"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4" }), label: "Total fish", value: formatNumber(totals.fish) }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "Anglers", value: formatNumber(totals.anglers) }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(TrendingUp, { className: "h-4 w-4" }), label: "FPA", value: fpa.toFixed(2), accent: true }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }), label: "Top region", value: topRegion?.region ?? "—", small: true })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[2fr_1fr]", children: [
      /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-bold", children: "Weekly fish landed" }),
          /* @__PURE__ */ jsxs("span", { className: "chip", children: [
            "Last ",
            byWeek.length,
            " weeks"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-72", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(LineChart, { data: byWeek, margin: {
          top: 10,
          right: 10,
          left: 0,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { stroke: "var(--border)", strokeDasharray: "3 3", vertical: false }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "week", tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false, width: 32 }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "oklch(0.16 0.04 240)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "fish", stroke: "var(--chart-1)", strokeWidth: 2.5, dot: {
            r: 2
          } })
        ] }) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-bold mb-3", children: "Regional split" }),
        /* @__PURE__ */ jsx("div", { className: "h-72", children: /* @__PURE__ */ jsx(ResponsiveContainer, { children: /* @__PURE__ */ jsxs(BarChart, { data: byRegion, margin: {
          top: 10,
          right: 10,
          left: 0,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsx(XAxis, { dataKey: "short", tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsx(YAxis, { tick: {
            fill: "var(--muted-foreground)",
            fontSize: 10
          }, tickLine: false, axisLine: false, width: 32 }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: {
            background: "oklch(0.16 0.04 240)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          }, formatter: (v) => formatNumber(v), labelFormatter: (_l, p) => p?.[0]?.payload?.region ?? "" }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "fish", radius: [6, 6, 0, 0], children: byRegion.map((_, i) => /* @__PURE__ */ jsx(Cell, { fill: i === 0 ? "var(--gold)" : "var(--chart-1)" }, i)) })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-16", children: [
      /* @__PURE__ */ jsxs("h3", { className: "font-display text-xl font-bold mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Trophy, { className: "h-5 w-5 text-gold" }),
        " Top boats producing ",
        speciesName
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
        "We don't have boat-level species data yet, but these are the highest-FPA boats fishing regions where ",
        speciesName,
        " is currently biting."
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-2 sm:grid-cols-2", children: (boats.data ?? []).filter((b) => byRegion.slice(0, 3).some((r) => r.region === b.region)).sort((a, b) => b.fpa - a.fpa).slice(0, 8).map((b) => /* @__PURE__ */ jsxs("div", { className: "surface-card p-3.5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold truncate", children: b.boat }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            b.landing,
            " · ",
            b.region
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0 ml-3", children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular text-lg text-primary", children: b.fpa.toFixed(2) }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: "FPA" })
        ] })
      ] }, `${b.boat}-${b.landing}`)) })
    ] })
  ] });
}
function Stat({
  icon,
  label,
  value,
  accent,
  small
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: [
      icon,
      /* @__PURE__ */ jsx("span", { children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 font-display font-bold tabular ${small ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"} ${accent ? "text-primary" : ""}`, children: value })
  ] });
}
export {
  SpeciesDetailPage as component
};
