import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Fish } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatNumber, REGIONS, slugify } from "@/lib/socalbite";

export const Route = createFileRoute("/species/")({
  head: () => ({
    meta: [
      { title: "Species Analytics — The SoCal Bite" },
      { name: "description", content: "Which fish are biting where — species-by-species totals and regional breakdowns across SoCal." },
    ],
  }),
  component: SpeciesPage,
});

function SpeciesPage() {
  const trends = useQuery({ queryKey: ["trends"], queryFn: api.biteTrends });

  const aggregate = useMemo(() => {
    const map = new Map<string, { fish: number; trips: number; anglers: number; byRegion: Map<string, number> }>();
    (trends.data ?? []).forEach((t) => {
      const e = map.get(t.species) ?? { fish: 0, trips: 0, anglers: 0, byRegion: new Map() };
      e.fish += t.fish; e.trips += t.trips; e.anglers += t.anglers;
      e.byRegion.set(t.region, (e.byRegion.get(t.region) ?? 0) + t.fish);
      map.set(t.species, e);
    });
    return Array.from(map.entries())
      .map(([species, v]) => ({ species, ...v, fpa: v.anglers ? v.fish / v.anglers : 0 }))
      .sort((a, b) => b.fish - a.fish);
  }, [trends.data]);

  const maxFish = aggregate[0]?.fish ?? 1;

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Species analytics</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            What's biting, where it's biting.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Twelve weeks of catch data, every species, every region — sorted by total fish landed.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {trends.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-24 surface-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {aggregate.slice(0, 24).map((row, i) => (
              <Link
                key={row.species}
                to="/species/$slug"
                params={{ slug: slugify(row.species) }}
                className="surface-card p-4 block hover:border-primary/50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-mono font-bold tabular text-sm w-7 text-center ${i < 3 ? "text-gold" : "text-muted-foreground"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="font-display font-bold text-lg truncate flex items-center gap-2">
                        <Fish className="h-4 w-4 text-primary shrink-0" />{row.species}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatNumber(row.trips)} trips · {formatNumber(row.anglers)} anglers · {row.fpa.toFixed(2)} FPA
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display font-bold tabular text-xl">{formatNumber(row.fish)}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">Fish</div>
                  </div>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-gold" style={{ width: `${(row.fish / maxFish) * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {REGIONS.map((r) => {
                    const v = row.byRegion.get(r) ?? 0;
                    if (!v) return null;
                    return (
                      <span key={r} className="chip text-[10px]">
                        {r}: <span className="text-foreground ml-1 tabular">{formatNumber(v)}</span>
                      </span>
                    );
                  })}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link to="/forecast" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold hover:opacity-90">
            See species in the forecast
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
