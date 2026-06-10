import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Anchor, Compass, Droplets, Fish, LifeBuoy, Sun, Thermometer, Users, Wind, Waves } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, REGIONS, todayIso, type Region, type RegionConditions } from "@/lib/socalbite";

export const Route = createFileRoute("/conditions")({
  head: () => ({
    meta: [
      { title: "Conditions — Pier · Surf · Boat — The SoCal Bite" },
      { name: "description", content: "Live NOAA and Open-Meteo wind, water temperature, tide movement and fishing condition scores for SoCal regions." },
    ],
  }),
  component: ConditionsPage,
});

type Mode = "pier" | "surf" | "boat";
const MODES: { id: Mode; label: string; icon: React.ComponentType<{ className?: string }>; tagline: string }[] = [
  { id: "pier", label: "Pier", icon: LifeBuoy, tagline: "Pier score based on wind, tide movement, water temperature, UV and bait activity." },
  { id: "surf", label: "Surf", icon: Waves, tagline: "Surf fishing view using wind, swell, tide and water temperature." },
  { id: "boat", label: "Boat", icon: Anchor, tagline: "Boat condition score using NOAA tide, water temp and marine weather." },
];

function ConditionsPage() {
  const [mode, setMode] = useState<Mode>("boat");
  const [region, setRegion] = useState<Region>("San Diego");
  const date = todayIso();
  const conditions = useQuery({ queryKey: ["allConditions", date], queryFn: () => api.allRegionConditions(date), staleTime: 15 * 60 * 1000 });

  const current = useMemo(() => conditions.data?.find((c) => c.region === region), [conditions.data, region]);
  const curMode = MODES.find((m) => m.id === mode)!;
  const score = current ? scoreForMode(current, mode) : 0;
  const rating = ratingFor(score);

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Conditions</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Wind, water, tide — live from the source.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">{curMode.tagline}</p>

          <div className="mt-6 inline-flex p-1 rounded-full border border-border bg-surface/60 backdrop-blur">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = mode === m.id;
              return (
                <button key={m.id} onClick={() => setMode(m.id)} className={`px-4 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1.5 transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" /> {m.label}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {REGIONS.map((r) => (
              <button key={r} onClick={() => setRegion(r)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${region === r ? "border-primary bg-primary/15 text-primary" : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </section>

      {conditions.isLoading || !current ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="surface-card p-10 text-center text-muted-foreground">Loading live NOAA conditions…</div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="surface-card p-6 relative overflow-hidden">
              <div className="absolute inset-0 grid-mesh opacity-20" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{region} · {curMode.label}</p>
                <h3 className="font-display text-xl font-bold mt-1">Live Conditions Score</h3>
                <div className="mt-6 flex items-end gap-3">
                  <div className="font-display font-bold tabular text-7xl text-primary">{score}</div>
                  <div className="pb-2 text-muted-foreground text-sm">/100 · {rating}</div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className={`chip ${rating === "Excellent" ? "chip-live" : rating === "Good" ? "chip-cyan" : "chip-gold"}`}>{curMode.label} window · {rating}</span>
                  <span className="chip">{current.weather.source}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Tile icon={<Thermometer className="h-4 w-4" />} label="Water" value={`${current.waterTemp.toFixed(1)}°F`} sub="NOAA latest" />
              <Tile icon={<Sun className="h-4 w-4" />} label="Air" value={`${Math.round(current.weather.temperature)}°F`} sub={current.weather.shortForecast} />
              <Tile icon={<Wind className="h-4 w-4" />} label="Wind" value={`${current.windMph} mph`} sub={`${current.windDirection} · gusts ${current.gustMph || 0}`} />
              <Tile icon={<Compass className="h-4 w-4" />} label="Swell" value={`${current.swell.toFixed(1)} ft`} sub="regional avg" />
              <Tile icon={<Droplets className="h-4 w-4" />} label="Tide" value={current.tideLabel} sub={`${current.tideMovementFt.toFixed(2)} ft movement`} />
              <Tile icon={<Fish className="h-4 w-4" />} label="Targets" value={current.targets.slice(0, 2).join(", ")} sub={current.targets.slice(2).join(", ")} />
              <Tile icon={<Sun className="h-4 w-4" />} label="Rain" value={fmtPct(current.weather.precipitationProbability)} />
              <Tile icon={<Waves className="h-4 w-4" />} label="Clouds" value={fmtPct(current.weather.cloudCover)} />
              <Tile icon={<Users className="h-4 w-4" />} label="UV" value={current.weather.uvIndex === null || current.weather.uvIndex === undefined ? "N/A" : String(Math.round(current.weather.uvIndex))} />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-5">
              <h3 className="font-display text-xl font-bold mb-4">NOAA tide table</h3>
              <div className="space-y-2">
                {current.formattedTides.map((t, i) => (
                  <div key={`${t.time}-${i}`} className="flex items-center justify-between rounded-md bg-surface-elevated p-3 text-sm">
                    <span className="text-muted-foreground">{t.time}</span>
                    <strong>{t.type}</strong>
                    <span className="font-mono text-primary">{t.height}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-card p-5">
              <h3 className="font-display text-xl font-bold mb-4">Forecast notes</h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p><strong className="text-foreground">{region}</strong> is showing <strong className="text-foreground">{rating}</strong> {curMode.label.toLowerCase()} conditions.</p>
                <p>Water is <strong className="text-foreground">{current.waterTemp.toFixed(1)}°F</strong>, tide movement is <strong className="text-foreground">{current.tideLabel}</strong>, and wind is <strong className="text-foreground">{current.windMph} mph {current.windDirection}</strong>.</p>
                <p>Likely targets: <strong className="text-foreground">{current.targets.join(", ")}</strong>.</p>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
            <h3 className="font-display text-xl font-bold mb-4">All regions · {curMode.label}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(conditions.data ?? []).map((c) => {
                const s = scoreForMode(c, mode);
                const r = ratingFor(s);
                return (
                  <button key={c.region} onClick={() => setRegion(c.region)} className={`text-left surface-card p-4 hover:border-primary/50 transition ${c.region === region ? "border-primary/60" : ""}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold">{c.region}</span>
                      <span className={`chip text-[10px] ${r === "Excellent" ? "chip-live" : r === "Good" ? "chip-cyan" : "chip-gold"}`}>{s} · {r}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <Mini label="Water" value={`${c.waterTemp.toFixed(0)}°F`} />
                      <Mini label="Wind" value={`${c.windMph} mph`} />
                      <Mini label="Tide" value={c.tideLabel} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function scoreForMode(c: RegionConditions, mode: Mode) {
  let score = c.score;
  if (mode === "pier") {
    if (c.windMph <= 8 && c.gustMph <= 16 && c.tideMovementFt >= 2.5) score += 6;
    if ((c.weather.uvIndex || 0) > 8) score -= 4;
  }
  if (mode === "surf") {
    if (c.swell <= 2.5 && c.windMph <= 10) score += 5;
    if (c.swell > 4.5 || c.windMph > 15) score -= 10;
  }
  if (mode === "boat") {
    if (c.windMph <= 8 && c.swell <= 3) score += 6;
    if (c.gustMph > 22 || c.swell > 4) score -= 12;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}
function ratingFor(score: number) { if (score >= 85) return "Excellent"; if (score >= 70) return "Good"; if (score >= 55) return "Fair"; return "Slow"; }
function fmtPct(v: number | null) { return v === null || v === undefined ? "N/A" : `${Math.round(v)}%`; }
function Tile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) { return <div className="surface-card p-3.5"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{icon}<span>{label}</span></div><div className="mt-1 font-display font-bold tabular text-xl">{value}</div>{sub && <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{sub}</div>}</div>; }
function Mini({ label, value }: { label: string; value: string }) { return <div><div className="text-muted-foreground font-mono text-[10px] uppercase">{label}</div><div className="font-display font-bold tabular">{value}</div></div>; }
