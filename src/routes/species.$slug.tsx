import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { ArrowLeft, Fish, MapPin, TrendingUp, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatNumber, REGIONS, slugify, unslugify } from "@/lib/socalbite";

export const Route = createFileRoute("/species/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Species Analytics — The SoCal Bite` },
      { name: "description", content: `Catch trends, top boats and regional hotspots for ${params.slug.replace(/-/g, " ")} across Southern California.` },
    ],
  }),
  component: SpeciesDetailPage,
});

function SpeciesDetailPage() {
  const { slug } = Route.useParams();
  const trends = useQuery({ queryKey: ["trends"], queryFn: api.biteTrends });
  const boats = useQuery({ queryKey: ["boats"], queryFn: api.boats });

  const allSpecies = useMemo(() => {
    const set = new Set<string>();
    (trends.data ?? []).forEach((t) => set.add(t.species));
    return Array.from(set);
  }, [trends.data]);

  const speciesName = useMemo(() => unslugify(slug, allSpecies), [slug, allSpecies]);

  const rows = useMemo(
    () => (trends.data ?? []).filter((t) => t.species === speciesName),
    [trends.data, speciesName],
  );

  const totals = rows.reduce(
    (a, r) => ({ fish: a.fish + r.fish, trips: a.trips + r.trips, anglers: a.anglers + r.anglers }),
    { fish: 0, trips: 0, anglers: 0 },
  );
  const fpa = totals.anglers ? totals.fish / totals.anglers : 0;

  const byWeek = useMemo(() => {
    const m = new Map<string, { week: string; fish: number; fpa: number }>();
    rows.forEach((r) => {
      const k = `W${String(r.week).padStart(2, "0")}`;
      const e = m.get(k) ?? { week: k, fish: 0, fpa: 0 };
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
        anglers: sub.reduce((s, r) => s + r.anglers, 0),
      };
    }).sort((a, b) => b.fish - a.fish);
  }, [rows]);

  if (trends.isLoading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="h-72 surface-card animate-pulse" />
        </div>
      </AppShell>
    );
  }

  if (!speciesName) {
    throw notFound();
  }

  const topRegion = byRegion[0];

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-10">
          <Link to="/species" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All species
          </Link>
          <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Species dossier</p>
              <h1 className="mt-1 font-display text-4xl sm:text-6xl font-bold tracking-tight flex items-center gap-3">
                <Fish className="h-9 w-9 text-primary" />
                {speciesName}
              </h1>
            </div>
            <span className="chip chip-cyan">{rows.length} weekly samples</span>
          </div>

          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={<Fish className="h-4 w-4" />} label="Total fish" value={formatNumber(totals.fish)} />
            <Stat icon={<Users className="h-4 w-4" />} label="Anglers" value={formatNumber(totals.anglers)} />
            <Stat icon={<TrendingUp className="h-4 w-4" />} label="FPA" value={fpa.toFixed(2)} accent />
            <Stat icon={<MapPin className="h-4 w-4" />} label="Top region" value={topRegion?.region ?? "—"} small />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold">Weekly fish landed</h3>
            <span className="chip">Last {byWeek.length} weeks</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={byWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.16 0.04 240)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="fish" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-bold mb-3">Regional split</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byRegion} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="short" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.16 0.04 240)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatNumber(v)}
                  labelFormatter={(_l, p) => p?.[0]?.payload?.region ?? ""}
                />
                <Bar dataKey="fish" radius={[6, 6, 0, 0]}>
                  {byRegion.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "var(--gold)" : "var(--chart-1)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <h3 className="font-display text-xl font-bold mb-3 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" /> Top boats producing {speciesName}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          We don't have boat-level species data yet, but these are the highest-FPA boats fishing
          regions where {speciesName} is currently biting.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {(boats.data ?? [])
            .filter((b) => byRegion.slice(0, 3).some((r) => r.region === b.region))
            .sort((a, b) => b.fpa - a.fpa)
            .slice(0, 8)
            .map((b) => (
              <div key={`${b.boat}-${b.landing}`} className="surface-card p-3.5 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-display font-bold truncate">{b.boat}</div>
                  <div className="text-xs text-muted-foreground truncate">{b.landing} · {b.region}</div>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <div className="font-display font-bold tabular text-lg text-primary">{b.fpa.toFixed(2)}</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">FPA</div>
                </div>
              </div>
            ))}
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ icon, label, value, accent, small }: { icon: React.ReactNode; label: string; value: string; accent?: boolean; small?: boolean }) {
  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        {icon}<span>{label}</span>
      </div>
      <div className={`mt-1 font-display font-bold tabular ${small ? "text-base sm:text-lg" : "text-2xl sm:text-3xl"} ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
