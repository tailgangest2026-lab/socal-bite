import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ArrowLeft, Trophy, Users, Fish, MapPin } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, b as formatDate, R as REGIONS, f as formatNumber } from "./socalbite-CWMCmBXz.js";
import { a as Route } from "./router-NVskPDW1.js";
import "zod";
function DailyReportPage() {
  const {
    date
  } = Route.useParams();
  const {
    region: initialRegion
  } = Route.useSearch();
  const idx = useQuery({
    queryKey: ["dailyIndex"],
    queryFn: api.dailyIndex
  });
  const file = idx.data?.find((e) => e.date === date)?.file ?? `reports/daily-report-${date}.json`;
  const report = useQuery({
    queryKey: ["dailyReport", file],
    queryFn: () => api.dailyReport(file),
    enabled: Boolean(file)
  });
  const [region, setRegion] = useState(initialRegion ?? "All");
  const trips = useMemo(() => {
    const all = report.data ?? [];
    return region === "All" ? all : all.filter((t) => t.region === region);
  }, [report.data, region]);
  const totals = trips.reduce((a, t) => ({
    trips: a.trips + 1,
    anglers: a.anglers + t.anglers,
    fish: a.fish + t.total_fish
  }), {
    trips: 0,
    anglers: 0,
    fish: 0
  });
  const fpa = totals.anglers ? totals.fish / totals.anglers : 0;
  const byBoat = useMemo(() => {
    return trips.slice().sort((a, b) => b.total_fish - a.total_fish);
  }, [trips]);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-8", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/reports", className: "inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-3.5 w-3.5" }),
        " All reports"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Daily report" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-1 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: formatDate(date) }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0", children: ["All", ...REGIONS].map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setRegion(r), className: `shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${region === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"}`, children: r }, r)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(Trophy, { className: "h-4 w-4" }), label: "Trips", value: formatNumber(totals.trips) }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(Users, { className: "h-4 w-4" }), label: "Anglers", value: formatNumber(totals.anglers) }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4" }), label: "Fish", value: formatNumber(totals.fish) }),
        /* @__PURE__ */ jsx(Stat, { icon: /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }), label: "FPA", value: fpa.toFixed(2), accent: true })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10", children: report.isLoading ? /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: Array.from({
      length: 6
    }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-20 surface-card animate-pulse" }, i)) }) : trips.length === 0 ? /* @__PURE__ */ jsx("div", { className: "surface-card p-10 text-center text-muted-foreground", children: "No trips on file for this date." }) : /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: byBoat.map((t, i) => {
      const tripFpa = t.anglers ? t.total_fish / t.anglers : 0;
      return /* @__PURE__ */ jsx("div", { className: "surface-card p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [
            /* @__PURE__ */ jsx("span", { className: "font-display font-bold truncate", children: t.boat }),
            /* @__PURE__ */ jsx("span", { className: "chip text-[10px]", children: t.trip_type }),
            /* @__PURE__ */ jsx("span", { className: "chip chip-cyan text-[10px]", children: t.region })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1 truncate", children: t.landing }),
          t.fish_counts && /* @__PURE__ */ jsx("div", { className: "mt-2 text-xs text-muted-foreground", children: /* @__PURE__ */ jsx("span", { className: "text-foreground/80", children: t.fish_counts }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular text-xl", children: formatNumber(t.total_fish) }),
          /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: [
            t.anglers,
            " anglers · ",
            tripFpa.toFixed(2),
            " FPA"
          ] })
        ] })
      ] }) }, `${t.boat}-${i}`);
    }) }) })
  ] });
}
function Stat({
  icon,
  label,
  value,
  accent
}) {
  return /* @__PURE__ */ jsxs("div", { className: "surface-card p-3.5", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: [
      icon,
      /* @__PURE__ */ jsx("span", { children: label })
    ] }),
    /* @__PURE__ */ jsx("div", { className: `mt-1 font-display font-bold tabular text-xl sm:text-2xl ${accent ? "text-primary" : ""}`, children: value })
  ] });
}
export {
  DailyReportPage as component
};
