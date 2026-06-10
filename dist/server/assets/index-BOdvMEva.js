import { jsxs, jsx } from "react/jsx-runtime";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Anchor, Users, Fish, Trophy, Flame, Sparkles, ArrowUpRight, MapPin, TrendingUp } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, f as formatNumber, R as REGIONS } from "./socalbite-CWMCmBXz.js";
function HomePage() {
  const home = useQuery({
    queryKey: ["home"],
    queryFn: api.home
  });
  const boats = useQuery({
    queryKey: ["boats"],
    queryFn: api.boats
  });
  const landings = useQuery({
    queryKey: ["landings"],
    queryFn: api.landings
  });
  const totals = (home.data ?? []).reduce((acc, r) => ({
    trips: acc.trips + r.total_trips_today,
    anglers: acc.anglers + r.total_anglers_today,
    fish: acc.fish + r.total_fish_today
  }), {
    trips: 0,
    anglers: 0,
    fish: 0
  });
  const topBoats = (boats.data ?? []).slice().sort((a, b) => b.fpa - a.fpa).slice(0, 5);
  const topLandings = (landings.data ?? []).slice().sort((a, b) => b.fish - a.fish).slice(0, 5);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxs("section", { className: "relative overflow-hidden border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-mesh opacity-40" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-5", children: [
          /* @__PURE__ */ jsxs("span", { className: "chip chip-live", children: [
            /* @__PURE__ */ jsx("span", { className: "live-dot" }),
            " Reporting now"
          ] }),
          /* @__PURE__ */ jsx("span", { className: "chip", children: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric"
          }) }),
          /* @__PURE__ */ jsx("span", { className: "chip chip-cyan", children: "SoCal Coast · 6 regions" })
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-balance", children: [
          "Today's bite, ",
          /* @__PURE__ */ jsx("span", { className: "gradient-text-sonar", children: "decoded." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground", children: "Live sportfishing reports, NOAA-driven bite forecasts and species analytics from San Luis Obispo to San Diego — the way modern anglers read the water." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-7 flex flex-wrap gap-3", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/forecast", className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition", children: [
            "See the forecast ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/rankings", className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border-strong bg-surface/40 backdrop-blur font-semibold hover:bg-surface-elevated transition", children: "Explore rankings" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl", children: [
          /* @__PURE__ */ jsx(StatTile, { icon: /* @__PURE__ */ jsx(Anchor, { className: "h-4 w-4" }), label: "Trips today", value: formatNumber(totals.trips), loading: home.isLoading }),
          /* @__PURE__ */ jsx(StatTile, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "Anglers", value: formatNumber(totals.anglers), loading: home.isLoading }),
          /* @__PURE__ */ jsx(StatTile, { icon: /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4" }), label: "Fish landed", value: formatNumber(totals.fish), loading: home.isLoading, accent: true })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16", children: [
      /* @__PURE__ */ jsx(SectionHeader, { eyebrow: "Regional board", title: "The coastline, region by region", subtitle: "Every region's top boat, landing and species — pulled from this morning's reports." }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3", children: home.isLoading ? REGIONS.map((r) => /* @__PURE__ */ jsx(RegionCard, { region: {
        region: r
      }, loading: true }, r)) : (home.data ?? []).map((r) => /* @__PURE__ */ jsx(RegionCard, { region: r }, r.region)) })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsx(RankCard, { title: "Top boats this season", eyebrow: "Fish-per-angler · 30 days", icon: /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4 text-gold" }), rows: topBoats.map((b) => ({
        key: `${b.boat}-${b.trip_type}`,
        primary: b.boat,
        secondary: `${b.landing} · ${b.trip_type}`,
        value: b.fpa.toFixed(2),
        valueLabel: "FPA",
        region: b.region
      })), href: "/rankings" }),
      /* @__PURE__ */ jsx(RankCard, { title: "Hottest landings", eyebrow: "By total fish · 30 days", icon: /* @__PURE__ */ jsx(Flame, { className: "h-4 w-4 text-gold" }), rows: topLandings.map((l) => ({
        key: l.landing,
        primary: l.landing,
        secondary: `${formatNumber(l.trips)} trips · ${formatNumber(l.anglers)} anglers`,
        value: formatNumber(l.fish),
        valueLabel: "Fish",
        region: l.region
      })), href: "/rankings" })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-16", children: /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden surface-card p-6 sm:p-10", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-mesh opacity-30" }),
      /* @__PURE__ */ jsxs("div", { className: "relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "chip chip-cyan", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
            " Bite forecast"
          ] }),
          /* @__PURE__ */ jsx("h3", { className: "mt-4 font-display text-2xl sm:text-3xl font-bold text-balance", children: "Tomorrow's bite, modeled on swell, tide and 12-week history." }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-md", children: "Our forecast blends NOAA marine conditions with our own catch history to surface where the fish will be — before the boats leave the harbor." }),
          /* @__PURE__ */ jsxs(Link, { to: "/forecast", className: "mt-5 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all", children: [
            "Open forecast ",
            /* @__PURE__ */ jsx(ArrowUpRight, { className: "h-4 w-4" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx(ForecastPreview, { region: "San Diego", score: 84, trend: "up" }),
          /* @__PURE__ */ jsx(ForecastPreview, { region: "Orange County", score: 72, trend: "flat" }),
          /* @__PURE__ */ jsx(ForecastPreview, { region: "Los Angeles", score: 67, trend: "up" }),
          /* @__PURE__ */ jsx(ForecastPreview, { region: "Ventura", score: 58, trend: "down" })
        ] })
      ] })
    ] }) })
  ] });
}
function StatTile({
  icon,
  label,
  value,
  loading,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: `surface-glass rounded-lg p-3 sm:p-4 ${accent ? "ring-1 ring-primary/30" : ""}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium", children: [
      icon,
      /* @__PURE__ */ jsx("span", { children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `mt-1.5 font-display font-bold tabular text-2xl sm:text-4xl ${accent ? "gradient-text-sonar" : ""}`, children: loading ? "—" : value })
  ] });
}
function SectionHeader({
  eyebrow,
  title,
  subtitle
}) {
  return /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary mb-2", children: eyebrow }),
    /* @__PURE__ */ jsx("h2", { className: "font-display text-2xl sm:text-4xl font-bold tracking-tight text-balance", children: title }),
    subtitle && /* @__PURE__ */ jsx("p", { className: "mt-2 text-muted-foreground max-w-2xl", children: subtitle })
  ] });
}
function RegionCard({
  region,
  loading
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-5 hover:border-primary/40 transition-all group", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground text-xs", children: [
          /* @__PURE__ */ jsx(MapPin, { className: "h-3 w-3" }),
          /* @__PURE__ */ jsx("span", { className: "font-mono uppercase tracking-wider", children: region.region })
        ] }),
        !loading && /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-baseline gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-display font-bold tabular text-3xl", children: formatNumber(region.total_fish_today) }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "fish today" })
        ] }),
        loading && /* @__PURE__ */ jsx("div", { className: "mt-2 h-8 w-24 bg-surface-elevated rounded animate-pulse" })
      ] }),
      /* @__PURE__ */ jsx("span", { className: "chip", children: loading ? "…" : `${region.total_trips_today}T · ${region.total_anglers_today}A` })
    ] }),
    !loading && /* @__PURE__ */ jsxs("dl", { className: "space-y-2 text-sm", children: [
      /* @__PURE__ */ jsx(Row, { label: "Top boat", value: region.top_boat_today || "—", accent: true }),
      /* @__PURE__ */ jsx(Row, { label: "Top landing", value: region.top_landing_today || "—" }),
      /* @__PURE__ */ jsx(Row, { label: "Top species", value: region.top_species_today || "—" }),
      /* @__PURE__ */ jsxs("div", { className: "pt-2 mt-2 border-t border-border flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-mono", children: "90-day boat" }),
        /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-gold", children: region.best_boat_last_90_days || "—" })
      ] })
    ] })
  ] });
}
function Row({
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[11px] uppercase tracking-wider text-muted-foreground font-mono", children: label }),
    /* @__PURE__ */ jsx("span", { className: `truncate font-medium ${accent ? "text-primary" : ""}`, children: value })
  ] });
}
function RankCard({
  title,
  eyebrow,
  icon,
  rows,
  href
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "px-5 py-4 border-b border-border flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("p", { className: "font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1.5", children: [
          icon,
          eyebrow
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "font-display text-lg font-bold", children: title })
      ] }),
      /* @__PURE__ */ jsxs(Link, { to: href, className: "text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1", children: [
        "All ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("ol", { className: "divide-y divide-border", children: [
      rows.length === 0 && Array.from({
        length: 5
      }).map((_, i) => /* @__PURE__ */ jsx("li", { className: "px-5 py-3 h-14 animate-pulse" }, i)),
      rows.map((r, i) => /* @__PURE__ */ jsxs("li", { className: "px-5 py-3 flex items-center gap-4 hover:bg-surface-elevated/40 transition", children: [
        /* @__PURE__ */ jsx("span", { className: `w-6 text-center font-mono text-sm font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`, children: String(i + 1).padStart(2, "0") }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold truncate", children: r.primary }),
          /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            r.secondary,
            " · ",
            r.region
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular", children: r.value }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: r.valueLabel })
        ] })
      ] }, r.key))
    ] })
  ] });
}
function ForecastPreview({
  region,
  score,
  trend
}) {
  const color = score >= 75 ? "text-success" : score >= 60 ? "text-gold" : "text-muted-foreground";
  return /* @__PURE__ */ jsxs("div", { className: "surface-glass rounded-md p-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium truncate", children: region }),
      /* @__PURE__ */ jsx(TrendingUp, { className: `h-3 w-3 ${trend === "down" ? "rotate-180 text-destructive" : trend === "flat" ? "rotate-90 text-muted-foreground" : "text-success"}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-baseline gap-1", children: [
      /* @__PURE__ */ jsx("span", { className: `font-display font-bold tabular text-3xl ${color}`, children: score }),
      /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground font-mono", children: "/100" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "mt-2 h-1 rounded-full bg-surface-elevated overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-primary to-gold", style: {
      width: `${score}%`
    } }) })
  ] });
}
export {
  HomePage as component
};
