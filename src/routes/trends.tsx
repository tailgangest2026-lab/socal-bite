import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { History, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatNumber, REGIONS, type Region } from "@/lib/socalbite";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Historical Trends — The SoCal Bite" },
      { name: "description", content: "Twelve weeks of catch history, sliced by species, region and effort — the long view of the SoCal bite." },
    ],
  }),
  component: TrendsPage,
});

type Metric = "fish" | "fpa" | "trips";
const METRICS: { id: Metric; label: string }[] = [
  { id: "fish", label: "Total fish" },
  { id: "fpa", label: "Fish per angler" },
  { id: "trips", label: "Trips" },
];

function TrendsPage() {
  const [metric, setMetric] = useState<Metric>("fish");
  const [region, setRegion] = useState<Region | "All">("All");
  const [species, setSpecies] = useState<string>("All");
  const trends = useQuery({ queryKey: ["trends"], queryFn: api.biteTrends });

  const allSpecies = useMemo(() => {
    const set = new Set<string>();
    (trends.data ?? []).forEach((t) => set.add(t.species));
    return ["All", ...Array.from(set).sort()];
  }, [trends.data]);

  const filtered = useMemo(() => {
    return (trends.data ?? []).filter(
      (t) => (region === "All" || t.region === region) && (species === "All" || t.species === species),
    );
  }, [trends.data, region, species]);

  const series = useMemo(() => {
    const m = new Map<string, { week: string; value: number; anglers: number }>();
    filtered.forEach((t) => {
      const k = `${t.year}-W${String(t.week).padStart(2, "0")}`;
      const e = m.get(k) ?? { week: k, value: 0, anglers: 0 };
      if (metric === "fpa") {
        e.value += t.fish;
        e.anglers += t.anglers;
      } else if (metric === "fish") {
        e.value += t.fish;
      } else {
        e.value += t.trips;
      }
      m.set(k, e);
    });
    return Array.from(m.values())
      .map((r) => ({ ...r, value: metric === "fpa" ? (r.anglers ? r.value / r.anglers : 0) : r.value }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered, metric]);

  const totals = filtered.reduce(
    (a, r) => ({ fish: a.fish + r.fish, trips: a.trips + r.trips, anglers: a.anglers + r.anglers }),
    { fish: 0, trips: 0, anglers: 0 },
  );

  const leaderboard = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((t) => m.set(t.species, (m.get(t.species) ?? 0) + t.fish));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [filtered]);
  const maxLb = leaderboard[0]?.[1] ?? 1;

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <History className="h-3.5 w-3.5" /> Historical explorer
          </p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            The long view of the SoCal bite.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Twelve weeks of catch data — slice by species, region and effort metric to spot the
            trends that turn into tomorrow's bite.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">
        {/* Controls */}
        <div className="surface-card p-4 grid gap-3 md:grid-cols-3">
          <Select label="Metric" value={metric} onChange={(v) => setMetric(v as Metric)} options={METRICS.map((m) => ({ value: m.id, label: m.label }))} />
          <Select label="Region" value={region} onChange={(v) => setRegion(v as Region | "All")} options={["All", ...REGIONS].map((r) => ({ value: r, label: r }))} />
          <Select label="Species" value={species} onChange={setSpecies} options={allSpecies.map((s) => ({ value: s, label: s }))} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <Kpi label="Fish" value={formatNumber(totals.fish)} />
          <Kpi label="Trips" value={formatNumber(totals.trips)} />
          <Kpi label="FPA" value={(totals.anglers ? totals.fish / totals.anglers : 0).toFixed(2)} accent />
        </div>

        {/* Trend chart */}
        <div className="surface-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-lg font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {METRICS.find((m) => m.id === metric)?.label}
            </h3>
            <span className="chip">{series.length} weeks</span>
          </div>
          {trends.isLoading ? (
            <div className="h-72 grid place-items-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={series} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gMain" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={36} />
                  <Tooltip
                    contentStyle={{ background: "oklch(0.16 0.04 240)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => (metric === "fpa" ? v.toFixed(2) : formatNumber(v))}
                  />
                  <Area type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#gMain)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Species leaderboard for current filter */}
        <div className="surface-card p-5">
          <h3 className="font-display text-lg font-bold mb-3">Top species in this slice</h3>
          {leaderboard.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No data for this filter.</div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.map(([name, v], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className={`font-mono text-xs tabular w-6 text-center ${i < 3 ? "text-gold" : "text-muted-foreground"}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold truncate">{name}</span>
                      <span className="tabular text-muted-foreground">{formatNumber(v)}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-gold" style={{ width: `${(v / maxLb) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-surface-elevated border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-card p-3.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={`mt-1 font-display font-bold tabular text-xl sm:text-2xl ${accent ? "text-primary" : ""}`}>{value}</div>
    </div>
  );
}
