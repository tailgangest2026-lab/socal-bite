import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Anchor, Building2, Search, Trophy, Fish } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, f as formatNumber, R as REGIONS } from "./socalbite-CWMCmBXz.js";
import "@tanstack/react-router";
function RankingsPage() {
  const [tab, setTab] = useState("boats");
  const [region, setRegion] = useState("All");
  const [q, setQ] = useState("");
  const boats = useQuery({
    queryKey: ["boats"],
    queryFn: api.boats
  });
  const landings = useQuery({
    queryKey: ["landings"],
    queryFn: api.landings
  });
  const filteredBoats = useMemo(() => {
    const list = (boats.data ?? []).filter((b) => (region === "All" || b.region === region) && (q === "" || `${b.boat} ${b.landing}`.toLowerCase().includes(q.toLowerCase())));
    return list.slice().sort((a, b) => b.fpa - a.fpa).slice(0, 50);
  }, [boats.data, region, q]);
  const filteredLandings = useMemo(() => {
    const list = (landings.data ?? []).filter((l) => (region === "All" || l.region === region) && (q === "" || l.landing.toLowerCase().includes(q.toLowerCase())));
    return list.slice().sort((a, b) => b.fish - a.fish).slice(0, 50);
  }, [landings.data, region, q]);
  const summary = useMemo(() => {
    const src = (boats.data ?? []).filter((b) => region === "All" || b.region === region);
    const trips = src.reduce((s, b) => s + b.trips, 0);
    const fish = src.reduce((s, b) => s + b.fish, 0);
    const anglers = src.reduce((s, b) => s + b.anglers, 0);
    const avgFpa = src.length ? src.reduce((s, b) => s + b.fpa, 0) / src.length : 0;
    return {
      trips,
      fish,
      anglers,
      avgFpa
    };
  }, [boats.data, region]);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Rankings dashboard" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "Who's actually putting fish on the deck." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: "Sortable boat and landing leaderboards across every SoCal region — ranked by fish-per-angler, total catch and trip volume." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl", children: [
        /* @__PURE__ */ jsx(Stat, { label: "Trips", value: formatNumber(summary.trips) }),
        /* @__PURE__ */ jsx(Stat, { label: "Anglers", value: formatNumber(summary.anglers) }),
        /* @__PURE__ */ jsx(Stat, { label: "Fish landed", value: formatNumber(summary.fish), accent: true }),
        /* @__PURE__ */ jsx(Stat, { label: "Avg FPA", value: summary.avgFpa.toFixed(2) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex p-1 rounded-lg surface-glass border border-border", children: [
          /* @__PURE__ */ jsx(TabBtn, { active: tab === "boats", onClick: () => setTab("boats"), icon: /* @__PURE__ */ jsx(Anchor, { className: "h-3.5 w-3.5" }), children: "Boats" }),
          /* @__PURE__ */ jsx(TabBtn, { active: tab === "landings", onClick: () => setTab("landings"), icon: /* @__PURE__ */ jsx(Building2, { className: "h-3.5 w-3.5" }), children: "Landings" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 flex-1 sm:max-w-md", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: tab === "boats" ? "Search boats…" : "Search landings…", className: "w-full pl-9 pr-3 py-2 text-sm rounded-md bg-surface border border-border focus:border-primary focus:outline-none" })
          ] }),
          /* @__PURE__ */ jsxs("select", { value: region, onChange: (e) => setRegion(e.target.value), className: "px-3 py-2 text-sm rounded-md bg-surface border border-border focus:border-primary focus:outline-none", children: [
            /* @__PURE__ */ jsx("option", { value: "All", children: "All regions" }),
            REGIONS.map((r) => /* @__PURE__ */ jsx("option", { children: r }, r))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "surface-card overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm tabular", children: [
        /* @__PURE__ */ jsx("thead", { className: "text-xs uppercase tracking-wider text-muted-foreground font-mono bg-surface-sunken/60", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 w-12", children: "#" }),
          /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3", children: tab === "boats" ? "Boat" : "Landing" }),
          /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 hidden md:table-cell", children: "Region" }),
          tab === "boats" && /* @__PURE__ */ jsx("th", { className: "text-left px-4 py-3 hidden lg:table-cell", children: "Trip type" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3", children: "Trips" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3 hidden sm:table-cell", children: "Anglers" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3", children: "Fish" }),
          /* @__PURE__ */ jsx("th", { className: "text-right px-4 py-3", children: "FPA" })
        ] }) }),
        /* @__PURE__ */ jsxs("tbody", { className: "divide-y divide-border", children: [
          tab === "boats" ? filteredBoats.map((b, i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-elevated/40", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(RankBadge, { rank: i + 1 }) }),
            /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold", children: b.boat }),
              /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground", children: b.landing })
            ] }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden md:table-cell text-muted-foreground", children: b.region }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden lg:table-cell", children: /* @__PURE__ */ jsx("span", { className: "chip", children: b.trip_type }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: formatNumber(b.trips) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right hidden sm:table-cell", children: formatNumber(b.anglers) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold", children: formatNumber(b.fish) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsx(FpaPill, { v: b.fpa }) })
          ] }, `${b.boat}-${b.trip_type}-${i}`)) : filteredLandings.map((l, i) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-elevated/40", children: [
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(RankBadge, { rank: i + 1 }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxs("div", { className: "font-semibold flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Building2, { className: "h-3.5 w-3.5 text-muted-foreground" }),
              l.landing
            ] }) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 hidden md:table-cell text-muted-foreground", children: l.region }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: formatNumber(l.trips) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right hidden sm:table-cell", children: formatNumber(l.anglers) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right font-semibold", children: formatNumber(l.fish) }),
            /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsx(FpaPill, { v: l.fpa }) })
          ] }, `${l.landing}-${i}`)),
          (tab === "boats" && boats.isLoading || tab === "landings" && landings.isLoading) && Array.from({
            length: 8
          }).map((_, i) => /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "px-4 py-4", children: /* @__PURE__ */ jsx("div", { className: "h-5 bg-surface-elevated/60 rounded animate-pulse" }) }) }, i))
        ] })
      ] }) }) })
    ] })
  ] });
}
function TabBtn({
  active,
  onClick,
  children,
  icon
}) {
  return /* @__PURE__ */ jsxs("button", { onClick, className: `inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-md transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`, children: [
    icon,
    children
  ] });
}
function Stat({
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-glass rounded-lg p-3", children: [
    /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: label }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 font-display font-bold tabular text-2xl ${accent ? "gradient-text-sonar" : ""}`, children: value })
  ] });
}
function RankBadge({
  rank
}) {
  if (rank === 1) return /* @__PURE__ */ jsx("span", { className: "inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gold to-[oklch(0.68_0.16_60)] text-gold-foreground", children: /* @__PURE__ */ jsx(Trophy, { className: "h-3.5 w-3.5" }) });
  return /* @__PURE__ */ jsx("span", { className: `inline-block w-7 text-center font-mono font-bold text-sm ${rank <= 3 ? "text-gold" : "text-muted-foreground"}`, children: String(rank).padStart(2, "0") });
}
function FpaPill({
  v
}) {
  const tone = v >= 6 ? "text-success border-success/30 bg-success/10" : v >= 3 ? "text-gold border-gold/30 bg-gold/10" : "text-muted-foreground border-border bg-surface-elevated/40";
  return /* @__PURE__ */ jsxs("span", { className: `inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-bold border ${tone}`, children: [
    /* @__PURE__ */ jsx(Fish, { className: "h-3 w-3" }),
    v.toFixed(2)
  ] });
}
export {
  RankingsPage as component
};
