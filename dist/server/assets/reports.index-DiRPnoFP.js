import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import { a as api, R as REGIONS, b as formatDate } from "./socalbite-CWMCmBXz.js";
function ReportsIndex() {
  const idx = useQuery({
    queryKey: ["dailyIndex"],
    queryFn: api.dailyIndex
  });
  const [region, setRegion] = useState("All");
  const entries = (idx.data ?? []).slice(0, 30);
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsx("section", { className: "border-b border-border", style: {
      background: "var(--gradient-hero)"
    }, children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8", children: [
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "Daily reports" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight", children: "Every trip, every day." }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-muted-foreground max-w-2xl", children: "A scrollable archive of every sportfishing trip filed across SoCal. Tap a date to drill into boats, fish counts and trip types." }),
      /* @__PURE__ */ jsx("div", { className: "mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0", children: ["All", ...REGIONS].map((r) => /* @__PURE__ */ jsx("button", { onClick: () => setRegion(r), className: `shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${region === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"}`, children: r }, r)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-10", children: idx.isLoading ? /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: Array.from({
      length: 8
    }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "h-16 surface-card animate-pulse" }, i)) }) : /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: entries.map((e) => /* @__PURE__ */ jsxs(Link, { to: "/reports/$date", params: {
      date: e.date
    }, search: region === "All" ? {} : {
      region
    }, className: "surface-card p-4 flex items-center justify-between hover:border-primary/50 transition", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-md grid place-items-center bg-primary/10 text-primary", children: /* @__PURE__ */ jsx(Calendar, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-display font-bold", children: formatDate(e.date) }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground font-mono", children: e.date })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        region !== "All" && /* @__PURE__ */ jsx("span", { className: "chip chip-cyan", children: region }),
        /* @__PURE__ */ jsx(ChevronRight, { className: "h-5 w-5 text-muted-foreground" })
      ] })
    ] }, e.date)) }) })
  ] });
}
export {
  ReportsIndex as component
};
