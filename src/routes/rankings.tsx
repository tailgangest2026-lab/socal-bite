import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Anchor, Building2, Fish, Search, Trophy } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatNumber, REGIONS, type Region } from "@/lib/socalbite";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Boats & Landings · The SoCal Bite" },
      { name: "description", content: "Top performing boats, landings and trip types across Southern California — sortable, filterable, live." },
    ],
  }),
  component: RankingsPage,
});

type Tab = "boats" | "landings";

function RankingsPage() {
  const [tab, setTab] = useState<Tab>("boats");
  const [region, setRegion] = useState<Region | "All">("All");
  const [q, setQ] = useState("");

  const boats = useQuery({ queryKey: ["boats"], queryFn: api.boats });
  const landings = useQuery({ queryKey: ["landings"], queryFn: api.landings });

  const filteredBoats = useMemo(() => {
    const list = (boats.data ?? []).filter((b) =>
      (region === "All" || b.region === region) &&
      (q === "" || `${b.boat} ${b.landing}`.toLowerCase().includes(q.toLowerCase())),
    );
    return list.slice().sort((a, b) => b.fpa - a.fpa).slice(0, 50);
  }, [boats.data, region, q]);

  const filteredLandings = useMemo(() => {
    const list = (landings.data ?? []).filter((l) =>
      (region === "All" || l.region === region) &&
      (q === "" || l.landing.toLowerCase().includes(q.toLowerCase())),
    );
    return list.slice().sort((a, b) => b.fish - a.fish).slice(0, 50);
  }, [landings.data, region, q]);

  const summary = useMemo(() => {
    const src = (boats.data ?? []).filter((b) => region === "All" || b.region === region);
    const trips = src.reduce((s, b) => s + b.trips, 0);
    const fish = src.reduce((s, b) => s + b.fish, 0);
    const anglers = src.reduce((s, b) => s + b.anglers, 0);
    const avgFpa = src.length ? src.reduce((s, b) => s + b.fpa, 0) / src.length : 0;
    return { trips, fish, anglers, avgFpa };
  }, [boats.data, region]);

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Rankings dashboard</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Who's actually putting fish on the deck.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Sortable boat and landing leaderboards across every SoCal region —
            ranked by fish-per-angler, total catch and trip volume.
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            <Stat label="Trips" value={formatNumber(summary.trips)} />
            <Stat label="Anglers" value={formatNumber(summary.anglers)} />
            <Stat label="Fish landed" value={formatNumber(summary.fish)} accent />
            <Stat label="Avg FPA" value={summary.avgFpa.toFixed(2)} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <div className="inline-flex p-1 rounded-lg surface-glass border border-border">
            <TabBtn active={tab === "boats"} onClick={() => setTab("boats")} icon={<Anchor className="h-3.5 w-3.5" />}>
              Boats
            </TabBtn>
            <TabBtn active={tab === "landings"} onClick={() => setTab("landings")} icon={<Building2 className="h-3.5 w-3.5" />}>
              Landings
            </TabBtn>
          </div>

          <div className="flex gap-2 flex-1 sm:max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={tab === "boats" ? "Search boats…" : "Search landings…"}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md bg-surface border border-border focus:border-primary focus:outline-none"
              />
            </div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as Region | "All")}
              className="px-3 py-2 text-sm rounded-md bg-surface border border-border focus:border-primary focus:outline-none"
            >
              <option value="All">All regions</option>
              {REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="surface-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm tabular">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground font-mono bg-surface-sunken/60">
                <tr>
                  <th className="text-left px-4 py-3 w-12">#</th>
                  <th className="text-left px-4 py-3">{tab === "boats" ? "Boat" : "Landing"}</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Region</th>
                  {tab === "boats" && <th className="text-left px-4 py-3 hidden lg:table-cell">Trip type</th>}
                  <th className="text-right px-4 py-3">Trips</th>
                  <th className="text-right px-4 py-3 hidden sm:table-cell">Anglers</th>
                  <th className="text-right px-4 py-3">Fish</th>
                  <th className="text-right px-4 py-3">FPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tab === "boats" ? filteredBoats.map((b, i) => (
                  <tr key={`${b.boat}-${b.trip_type}-${i}`} className="hover:bg-surface-elevated/40">
                    <td className="px-4 py-3">
                      <RankBadge rank={i + 1} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{b.boat}</div>
                      <div className="text-xs text-muted-foreground">{b.landing}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{b.region}</td>
                    <td className="px-4 py-3 hidden lg:table-cell"><span className="chip">{b.trip_type}</span></td>
                    <td className="px-4 py-3 text-right">{formatNumber(b.trips)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{formatNumber(b.anglers)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(b.fish)}</td>
                    <td className="px-4 py-3 text-right">
                      <FpaPill v={b.fpa} />
                    </td>
                  </tr>
                )) : filteredLandings.map((l, i) => (
                  <tr key={`${l.landing}-${i}`} className="hover:bg-surface-elevated/40">
                    <td className="px-4 py-3"><RankBadge rank={i + 1} /></td>
                    <td className="px-4 py-3">
                      <div className="font-semibold flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        {l.landing}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">{l.region}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(l.trips)}</td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">{formatNumber(l.anglers)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatNumber(l.fish)}</td>
                    <td className="px-4 py-3 text-right"><FpaPill v={l.fpa} /></td>
                  </tr>
                ))}
                {((tab === "boats" && boats.isLoading) || (tab === "landings" && landings.isLoading)) &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-5 bg-surface-elevated/60 rounded animate-pulse" /></td></tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function TabBtn({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-md transition ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-glass rounded-lg p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div>
      <div className={`mt-1 font-display font-bold tabular text-2xl ${accent ? "gradient-text-sonar" : ""}`}>{value}</div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-gold to-[oklch(0.68_0.16_60)] text-gold-foreground"><Trophy className="h-3.5 w-3.5" /></span>;
  return <span className={`inline-block w-7 text-center font-mono font-bold text-sm ${rank <= 3 ? "text-gold" : "text-muted-foreground"}`}>{String(rank).padStart(2, "0")}</span>;
}

function FpaPill({ v }: { v: number }) {
  const tone = v >= 6 ? "text-success border-success/30 bg-success/10"
    : v >= 3 ? "text-gold border-gold/30 bg-gold/10"
    : "text-muted-foreground border-border bg-surface-elevated/40";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs font-bold border ${tone}`}>
      <Fish className="h-3 w-3" />{v.toFixed(2)}
    </span>
  );
}
