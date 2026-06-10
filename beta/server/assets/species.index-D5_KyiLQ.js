import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Fish } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, f as formatNumber, R as REGIONS, s as slugify } from "./socalbite-CWMCmBXz.js";
function SpeciesPage() {
  const trends = useQuery({
    queryKey: ["trends"],
    queryFn: api.biteTrends
  });
  const aggregate = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    (trends.data ?? []).forEach((t) => {
      const e = map.get(t.species) ?? {
        fish: 0,
        trips: 0,
        anglers: 0,
        byRegion: /* @__PURE__ */ new Map()
      };
      e.fish += t.fish;
      e.trips += t.trips;
      e.anglers += t.anglers;
      e.byRegion.set(t.region, (e.byRegion.get(t.region) ?? 0) + t.fish);
      map.set(t.species, e);
    });
    return Array.from(map.entries()).map(([species, v]) => ({
      species,
      ...v,
      fpa: v.anglers ? v.fish / v.anglers : 0
    })).sort((a, b) => b.fish - a.fish);
  }, [trends.data]);
  const maxFish = aggregate[0]?.fish ?? 1;
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Species analytics" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "What's biting, where it's biting." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: "Twelve weeks of catch data, every species, every region — sorted by total fish landed." })
    ] }) }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10", children: [
      trends.isLoading ? /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: Array.from({
        length: 8
      }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-24 surface-card animate-pulse" }, i)) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: aggregate.slice(0, 24).map((row, i) => /* @__PURE__ */ jsxs(Link, { to: "/species/$slug", params: {
        slug: slugify(row.species)
      }, className: "surface-card p-4 block hover:border-primary/50 transition", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
            /* @__PURE__ */ jsx("span", { className: `font-mono font-bold tabular text-sm w-7 text-center ${i < 3 ? "text-gold" : "text-muted-foreground"}`, children: String(i + 1).padStart(2, "0") }),
            /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-display font-bold text-lg truncate flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Fish, { className: "h-4 w-4 text-primary shrink-0" }),
                row.species
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground", children: [
                formatNumber(row.trips),
                " trips · ",
                formatNumber(row.anglers),
                " anglers · ",
                row.fpa.toFixed(2),
                " FPA"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsx("div", { className: "font-display font-bold tabular text-xl", children: formatNumber(row.fish) }),
            /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-mono", children: "Fish" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-gradient-to-r from-primary to-gold", style: {
          width: `${row.fish / maxFish * 100}%`
        } }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: REGIONS.map((r) => {
          const v = row.byRegion.get(r) ?? 0;
          if (!v) return null;
          return /* @__PURE__ */ jsxs("span", { className: "chip text-[10px]", children: [
            r,
            ": ",
            /* @__PURE__ */ jsx("span", { className: "text-foreground ml-1 tabular", children: formatNumber(v) })
          ] }, r);
        }) })
      ] }, row.species)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-10 text-center", children: /* @__PURE__ */ jsx(Link, { to: "/forecast", className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90", children: "See species in the forecast" }) })
    ] })
  ] });
}
export {
  SpeciesPage as component
};
