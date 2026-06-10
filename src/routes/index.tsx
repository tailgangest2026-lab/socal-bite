import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Anchor, ArrowRight, ArrowUpRight, Fish, Flame, MapPin,
  Sparkles, TrendingUp, Trophy, Users, Waves,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatNumber, REGIONS, type HomeRegion } from "@/lib/socalbite";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Today's Bite — The SoCal Bite Marine Intelligence" },
      { name: "description", content: "Live Southern California sportfishing snapshot: anglers on the water, top boats, hottest species and bite forecast." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const home = useQuery({ queryKey: ["home"], queryFn: api.home });
  const boats = useQuery({ queryKey: ["boats"], queryFn: api.boats });
  const landings = useQuery({ queryKey: ["landings"], queryFn: api.landings });

  const totals = (home.data ?? []).reduce(
    (acc, r) => ({
      trips: acc.trips + r.total_trips_today,
      anglers: acc.anglers + r.total_anglers_today,
      fish: acc.fish + r.total_fish_today,
    }),
    { trips: 0, anglers: 0, fish: 0 },
  );

  const topBoats = (boats.data ?? []).slice().sort((a, b) => b.fpa - a.fpa).slice(0, 5);
  const topLandings = (landings.data ?? []).slice().sort((a, b) => b.fish - a.fish).slice(0, 5);

  return (
    <AppShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 grid-mesh opacity-40" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-20">
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="chip chip-live"><span className="live-dot" /> Reporting now</span>
            <span className="chip">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</span>
            <span className="chip chip-cyan">SoCal Coast · 6 regions</span>
          </div>

          <h1 className="font-display font-bold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-balance">
            Today's bite, <span className="gradient-text-sonar">decoded.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground">
            Live sportfishing reports, NOAA-driven bite forecasts and species analytics
            from San Luis Obispo to San Diego — the way modern anglers read the water.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/forecast" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
              See the forecast <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/rankings" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md border border-border-strong bg-surface/40 backdrop-blur font-semibold hover:bg-surface-elevated transition">
              Explore rankings
            </Link>
          </div>

          {/* Totals strip */}
          <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-4 max-w-3xl">
            <StatTile icon={<Anchor className="h-4 w-4" />} label="Trips today" value={formatNumber(totals.trips)} loading={home.isLoading} />
            <StatTile icon={<Users className="h-4 w-4" />} label="Anglers" value={formatNumber(totals.anglers)} loading={home.isLoading} />
            <StatTile icon={<Fish className="h-4 w-4" />} label="Fish landed" value={formatNumber(totals.fish)} loading={home.isLoading} accent />
          </div>
        </div>
      </section>

      {/* REGIONAL BOARD */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <SectionHeader
          eyebrow="Regional board"
          title="The coastline, region by region"
          subtitle="Every region's top boat, landing and species — pulled from this morning's reports."
        />

        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {home.isLoading
            ? REGIONS.map((r) => <RegionCard key={r} region={{ region: r } as any} loading />)
            : (home.data ?? []).map((r) => <RegionCard key={r.region} region={r} />)}
        </div>
      </section>

      {/* TOP BOATS + LANDINGS */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16 border-t border-border">
        <div className="grid gap-6 lg:grid-cols-2">
          <RankCard
            title="Top boats this season"
            eyebrow="Fish-per-angler · 30 days"
            icon={<Trophy className="h-4 w-4 text-gold" />}
            rows={topBoats.map((b) => ({
              key: `${b.boat}-${b.trip_type}`,
              primary: b.boat,
              secondary: `${b.landing} · ${b.trip_type}`,
              value: b.fpa.toFixed(2),
              valueLabel: "FPA",
              region: b.region,
            }))}
            href="/rankings"
          />
          <RankCard
            title="Hottest landings"
            eyebrow="By total fish · 30 days"
            icon={<Flame className="h-4 w-4 text-gold" />}
            rows={topLandings.map((l) => ({
              key: l.landing,
              primary: l.landing,
              secondary: `${formatNumber(l.trips)} trips · ${formatNumber(l.anglers)} anglers`,
              value: formatNumber(l.fish),
              valueLabel: "Fish",
              region: l.region,
            }))}
            href="/rankings"
          />
        </div>
      </section>

      {/* FORECAST CALLOUT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden surface-card p-6 sm:p-10">
          <div className="absolute inset-0 grid-mesh opacity-30" />
          <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] items-center">
            <div>
              <span className="chip chip-cyan"><Sparkles className="h-3 w-3" /> Bite forecast</span>
              <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold text-balance">
                Tomorrow's bite, modeled on swell, tide and 12-week history.
              </h3>
              <p className="mt-3 text-muted-foreground max-w-md">
                Our forecast blends NOAA marine conditions with our own catch history
                to surface where the fish will be — before the boats leave the harbor.
              </p>
              <Link to="/forecast" className="mt-5 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
                Open forecast <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ForecastPreview region="San Diego" score={84} trend="up" />
              <ForecastPreview region="Orange County" score={72} trend="flat" />
              <ForecastPreview region="Los Angeles" score={67} trend="up" />
              <ForecastPreview region="Ventura" score={58} trend="down" />
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function StatTile({ icon, label, value, loading, accent }: { icon: React.ReactNode; label: string; value: string; loading?: boolean; accent?: boolean }) {
  return (
    <div className={`surface-glass rounded-lg p-3 sm:p-4 ${accent ? "ring-1 ring-primary/30" : ""}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider font-medium">
        {icon}<span>{label}</span>
      </div>
      <div className={`mt-1.5 font-display font-bold tabular text-2xl sm:text-4xl ${accent ? "gradient-text-sonar" : ""}`}>
        {loading ? "—" : value}
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-2">{eyebrow}</p>
      <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-balance">{title}</h2>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl">{subtitle}</p>}
    </div>
  );
}

function RegionCard({ region, loading }: { region: HomeRegion; loading?: boolean }) {
  return (
    <div className="surface-card p-5 hover:border-primary/40 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <MapPin className="h-3 w-3" />
            <span className="font-mono uppercase tracking-wider">{region.region}</span>
          </div>
          {!loading && (
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-bold tabular text-3xl">{formatNumber(region.total_fish_today)}</span>
              <span className="text-xs text-muted-foreground">fish today</span>
            </div>
          )}
          {loading && <div className="mt-2 h-8 w-24 bg-surface-elevated rounded animate-pulse" />}
        </div>
        <span className="chip">{loading ? "…" : `${region.total_trips_today}T · ${region.total_anglers_today}A`}</span>
      </div>

      {!loading && (
        <dl className="space-y-2 text-sm">
          <Row label="Top boat" value={region.top_boat_today || "—"} accent />
          <Row label="Top landing" value={region.top_landing_today || "—"} />
          <Row label="Top species" value={region.top_species_today || "—"} />
          <div className="pt-2 mt-2 border-t border-border flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">90-day boat</span>
            <span className="text-sm font-semibold text-gold">{region.best_boat_last_90_days || "—"}</span>
          </div>
        </dl>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">{label}</span>
      <span className={`truncate font-medium ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}

interface RankRow { key: string; primary: string; secondary: string; value: string; valueLabel: string; region: string }
function RankCard({ title, eyebrow, icon, rows, href }: { title: string; eyebrow: string; icon: React.ReactNode; rows: RankRow[]; href: string }) {
  return (
    <div className="surface-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1 flex items-center gap-1.5">
            {icon}{eyebrow}
          </p>
          <h3 className="font-display text-lg font-bold">{title}</h3>
        </div>
        <Link to={href} className="text-xs text-primary hover:text-primary/80 inline-flex items-center gap-1">
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ol className="divide-y divide-border">
        {rows.length === 0 && Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="px-5 py-3 h-14 animate-pulse" />
        ))}
        {rows.map((r, i) => (
          <li key={r.key} className="px-5 py-3 flex items-center gap-4 hover:bg-surface-elevated/40 transition">
            <span className={`w-6 text-center font-mono text-sm font-bold ${i === 0 ? "text-gold" : "text-muted-foreground"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{r.primary}</div>
              <div className="text-xs text-muted-foreground truncate">{r.secondary} · {r.region}</div>
            </div>
            <div className="text-right">
              <div className="font-display font-bold tabular">{r.value}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{r.valueLabel}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ForecastPreview({ region, score, trend }: { region: string; score: number; trend: "up" | "down" | "flat" }) {
  const color = score >= 75 ? "text-success" : score >= 60 ? "text-gold" : "text-muted-foreground";
  return (
    <div className="surface-glass rounded-md p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium truncate">{region}</span>
        <TrendingUp className={`h-3 w-3 ${trend === "down" ? "rotate-180 text-destructive" : trend === "flat" ? "rotate-90 text-muted-foreground" : "text-success"}`} />
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`font-display font-bold tabular text-3xl ${color}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground font-mono">/100</span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-elevated overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-gold" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
