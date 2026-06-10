import { createFileRoute } from "@tanstack/react-router";
import { Check, Compass, Radar, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Go Pro — The SoCal Bite" },
      { name: "description", content: "Unlock pro-tier marine intelligence: extended forecasts, push alerts, historical data and advanced species analytics." },
    ],
  }),
  component: SubscribePage,
});

const TIERS = [
  {
    name: "Tide",
    price: "Free",
    tagline: "Daily reports & today's bite",
    cta: "Keep using free",
    features: [
      "Today's regional dashboard",
      "Top boats & landings (24h)",
      "Live fish counts",
      "Basic species totals",
    ],
  },
  {
    name: "Captain",
    price: "$9",
    period: "/mo",
    tagline: "For weekend anglers who want the edge",
    cta: "Start 7-day trial",
    highlight: true,
    features: [
      "Everything in Tide",
      "7-day bite forecast (all 6 regions)",
      "Full NOAA marine conditions",
      "12-week species trends",
      "Boat & landing rankings, sortable",
      "Push alerts on hot bites",
    ],
  },
  {
    name: "Skipper",
    price: "$24",
    period: "/mo",
    tagline: "For pros, charter ops and serious data nerds",
    cta: "Talk to us",
    features: [
      "Everything in Captain",
      "Historical data export (CSV/API)",
      "Custom alerts by species + landing",
      "14-day extended forecast",
      "Pier & surf conditions",
      "Priority support",
    ],
  },
];

function SubscribePage() {
  return (
    <AppShell>
      <section className="relative border-b border-border overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 grid-mesh opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="chip chip-gold mx-auto"><Sparkles className="h-3 w-3" /> Pro tiers</span>
          <h1 className="mt-4 font-display text-4xl sm:text-6xl font-bold tracking-tight text-balance">
            The intel pro anglers <span className="gradient-text-sonar">refuse to fish without.</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Free is plenty for casual use. Pro unlocks the forecast model, push alerts,
            full historical data and species-level filters.
          </p>
        </div>
      </section>

      {/* PRICING */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`relative surface-card p-6 sm:p-7 ${
                tier.highlight ? "ring-2 ring-primary shadow-[var(--shadow-sonar)]" : ""
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip chip-cyan bg-background">
                  Most popular
                </span>
              )}
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-2">{tier.name}</p>
              <div className="flex items-baseline gap-1">
                <span className="font-display font-bold text-4xl sm:text-5xl">{tier.price}</span>
                {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{tier.tagline}</p>

              <button
                className={`mt-5 w-full py-2.5 rounded-md font-semibold transition ${
                  tier.highlight
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "border border-border-strong bg-surface hover:bg-surface-elevated"
                }`}
              >
                {tier.cta}
              </button>

              <ul className="mt-6 space-y-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* WHY PRO */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { icon: <Radar className="h-5 w-5" />, t: "7-day forecast model", d: "NOAA + tide + 12 weeks of our own catch data, blended into one score per region." },
            { icon: <Zap className="h-5 w-5" />, t: "Push alerts", d: "Yellowtail at H&M? Bluefin off the 9? You'll know before the parking lot fills up." },
            { icon: <Compass className="h-5 w-5" />, t: "Historical data + API", d: "Export full CSV history. Skipper tier ships an API key for power users and devs." },
          ].map((f) => (
            <div key={f.t} className="surface-card p-5">
              <div className="h-10 w-10 rounded-md bg-primary/15 text-primary grid place-items-center">{f.icon}</div>
              <h3 className="mt-3 font-display font-bold text-lg">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center text-xs text-muted-foreground font-mono uppercase tracking-wider">
          Cancel anytime · No hidden fees · Built by anglers, in California
        </div>
      </section>
    </AppShell>
  );
}
