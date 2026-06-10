import { jsxs, jsx } from "react/jsx-runtime";
import { Sparkles, Check, Radar, Zap, Compass } from "lucide-react";
import { A as AppShell } from "./AppShell-CcEFFR9Y.js";
import "@tanstack/react-router";
const TIERS = [{
  name: "Tide",
  price: "Free",
  tagline: "Daily reports & today's bite",
  cta: "Keep using free",
  features: ["Today's regional dashboard", "Top boats & landings (24h)", "Live fish counts", "Basic species totals"]
}, {
  name: "Captain",
  price: "$9",
  period: "/mo",
  tagline: "For weekend anglers who want the edge",
  cta: "Start 7-day trial",
  highlight: true,
  features: ["Everything in Tide", "7-day bite forecast (all 6 regions)", "Full NOAA marine conditions", "12-week species trends", "Boat & landing rankings, sortable", "Push alerts on hot bites"]
}, {
  name: "Skipper",
  price: "$24",
  period: "/mo",
  tagline: "For pros, charter ops and serious data nerds",
  cta: "Talk to us",
  features: ["Everything in Captain", "Historical data export (CSV/API)", "Custom alerts by species + landing", "14-day extended forecast", "Pier & surf conditions", "Priority support"]
}];
function SubscribePage() {
  return /* @__PURE__ */ jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxs("section", { className: "relative border-b border-border overflow-hidden", style: {
      background: "var(--gradient-hero)"
    }, children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 grid-mesh opacity-30" }),
      /* @__PURE__ */ jsxs("div", { className: "relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20 text-center", children: [
        /* @__PURE__ */ jsxs("span", { className: "chip chip-gold mx-auto", children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "h-3 w-3" }),
          " Pro tiers"
        ] }),
        /* @__PURE__ */ jsxs("h1", { className: "mt-4 font-display text-4xl sm:text-6xl font-bold tracking-tight text-balance", children: [
          "The intel pro anglers ",
          /* @__PURE__ */ jsx("span", { className: "gradient-text-sonar", children: "refuse to fish without." })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-muted-foreground max-w-2xl mx-auto", children: "Free is plenty for casual use. Pro unlocks the forecast model, push alerts, full historical data and species-level filters." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 py-12", children: /* @__PURE__ */ jsx("div", { className: "grid gap-5 md:grid-cols-3", children: TIERS.map((tier) => /* @__PURE__ */ jsxs("div", { className: `relative surface-card p-6 sm:p-7 ${tier.highlight ? "ring-2 ring-primary shadow-[var(--shadow-sonar)]" : ""}`, children: [
      tier.highlight && /* @__PURE__ */ jsx("span", { className: "absolute -top-3 left-1/2 -translate-x-1/2 chip chip-cyan bg-background", children: "Most popular" }),
      /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary mb-2", children: tier.name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-1", children: [
        /* @__PURE__ */ jsx("span", { className: "font-display font-bold text-4xl sm:text-5xl", children: tier.price }),
        tier.period && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: tier.period })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: tier.tagline }),
      /* @__PURE__ */ jsx("button", { className: `mt-5 w-full py-2.5 rounded-md font-semibold transition ${tier.highlight ? "bg-primary text-primary-foreground hover:opacity-90" : "border border-border-strong bg-surface hover:bg-surface-elevated"}`, children: tier.cta }),
      /* @__PURE__ */ jsx("ul", { className: "mt-6 space-y-2.5 text-sm", children: tier.features.map((f) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-2", children: [
        /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-primary shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsx("span", { children: f })
      ] }, f)) })
    ] }, tier.name)) }) }),
    /* @__PURE__ */ jsxs("section", { className: "mx-auto max-w-7xl px-4 sm:px-6 pb-16", children: [
      /* @__PURE__ */ jsx("div", { className: "grid gap-5 sm:grid-cols-3", children: [{
        icon: /* @__PURE__ */ jsx(Radar, { className: "h-5 w-5" }),
        t: "7-day forecast model",
        d: "NOAA + tide + 12 weeks of our own catch data, blended into one score per region."
      }, {
        icon: /* @__PURE__ */ jsx(Zap, { className: "h-5 w-5" }),
        t: "Push alerts",
        d: "Yellowtail at H&M? Bluefin off the 9? You'll know before the parking lot fills up."
      }, {
        icon: /* @__PURE__ */ jsx(Compass, { className: "h-5 w-5" }),
        t: "Historical data + API",
        d: "Export full CSV history. Skipper tier ships an API key for power users and devs."
      }].map((f) => /* @__PURE__ */ jsxs("div", { className: "surface-card p-5", children: [
        /* @__PURE__ */ jsx("div", { className: "h-10 w-10 rounded-md bg-primary/15 text-primary grid place-items-center", children: f.icon }),
        /* @__PURE__ */ jsx("h3", { className: "mt-3 font-display font-bold text-lg", children: f.t }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: f.d })
      ] }, f.t)) }),
      /* @__PURE__ */ jsx("div", { className: "mt-10 text-center text-xs text-muted-foreground font-mono uppercase tracking-wider", children: "Cancel anytime · No hidden fees · Built by anglers, in California" })
    ] })
  ] });
}
export {
  SubscribePage as component
};
