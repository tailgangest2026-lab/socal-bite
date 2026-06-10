import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Anchor, Compass, Droplets, Fish, Moon, Thermometer, TrendingUp, Users, Wind } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, REGIONS, type Region, type RegionForecast } from "@/lib/socalbite";

export const Route = createFileRoute("/forecast")({
  head: () => ({
    meta: [
      { title: "Bite Forecast — The SoCal Bite" },
      { name: "description", content: "NOAA-driven bite forecasts using recent fish counts, wind, tide movement, water temperature, weather and moon phase." },
    ],
  }),
  component: ForecastPage,
});

function ForecastPage() {
  const forecasts = useQuery({ queryKey: ["regionForecasts"], queryFn: api.regionForecasts, staleTime: 15 * 60 * 1000 });
  const [region, setRegion] = useState<Region>("San Diego");

  const selected = useMemo(() => {
    return forecasts.data?.find((f) => f.region === region) ?? forecasts.data?.[0];
  }, [forecasts.data, region]);

  const chartData = useMemo(() => {
    return (forecasts.data ?? []).map((f) => ({ region: f.region.replace(" County", ""), score: f.finalScore }));
  }, [forecasts.data]);

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Bite Forecast</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Real forecast. Real fish counts. Real NOAA conditions.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            This score blends your recent daily reports with wind, gusts, tide movement,
            water temperature, weather, moon phase, trip volume and fish-per-angler trends.
          </p>
          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition ${
                  region === r
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-surface/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </section>

      {forecasts.isLoading || !selected ? (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
          <div className="surface-card p-10 text-center text-muted-foreground">Loading live forecast data…</div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <ScoreDial forecast={selected} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CondTile icon={<Thermometer className="h-4 w-4" />} label="Water" value={`${selected.condition.waterTemp.toFixed(1)}°F`} sub={selected.condition.weather.source} />
              <CondTile icon={<Wind className="h-4 w-4" />} label="Wind" value={`${selected.condition.windMph} mph ${selected.condition.windDirection}`} sub={`Gusts ${selected.condition.gustMph || 0} mph`} />
              <CondTile icon={<Compass className="h-4 w-4" />} label="Swell" value={`${selected.condition.swell.toFixed(1)} ft`} sub="regional avg" />
              <CondTile icon={<Droplets className="h-4 w-4" />} label="Tide" value={selected.condition.tideLabel} sub={`${selected.condition.tideMovementFt.toFixed(2)} ft movement`} />
              <CondTile icon={<Fish className="h-4 w-4" />} label="7-day fish" value={selected.last7Fish.toLocaleString()} />
              <CondTile icon={<Users className="h-4 w-4" />} label="FPA" value={selected.fpa.toFixed(2)} sub={`${selected.last7Anglers.toLocaleString()} anglers`} />
              <CondTile icon={<Anchor className="h-4 w-4" />} label="Trips" value={`${selected.last7Trips}`} sub={`prev ${selected.previous7Trips}`} />
              <CondTile icon={<Moon className="h-4 w-4" />} label="Moon" value={selected.moon.phase} sub={`score ${selected.moon.score}`} />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-10 grid gap-6 lg:grid-cols-2">
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-1">Regional scores</p>
                  <h3 className="font-display text-xl font-bold">Tomorrow's bite score</h3>
                </div>
                <span className="chip">Live NOAA</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <AreaChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <XAxis dataKey="region" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} tickLine={false} axisLine={false} width={28} />
                    <Tooltip contentStyle={{ background: "oklch(0.16 0.04 240)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.18} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="surface-card p-5 sm:p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-1">Score factors</p>
              <h3 className="font-display text-xl font-bold mb-4">Why {selected.region} scored {selected.finalScore}</h3>
              <div className="grid grid-cols-2 gap-3">
                <Factor label="Trend" value={selected.trendScore} />
                <Factor label="Volume" value={selected.volumeScore} />
                <Factor label="FPA" value={selected.fpaScore} />
                <Factor label="Trips" value={selected.tripScore} />
                <Factor label="Wind" value={scoreWind(selected)} />
                <Factor label="Tide" value={scoreTide(selected)} />
                <Factor label="Water" value={scoreTemp(selected)} />
                <Factor label="Moon" value={selected.moon.score} />
              </div>
              <p className="mt-5 text-sm text-muted-foreground">
                Forecast: {selected.condition.weather.shortForecast}. Rain chance {fmtPct(selected.condition.weather.precipitationProbability)}, cloud cover {fmtPct(selected.condition.weather.cloudCover)}, UV {selected.condition.weather.uvIndex ?? "N/A"}.
              </p>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Panel title="Top bite" rows={selected.topSpecies.map((s) => [s.species, s.count.toLocaleString()])} />
              <Panel title="Top boats" rows={selected.topBoats.map((b) => [b.boat, b.fish.toLocaleString()])} />
              <Panel title="Top landings" rows={selected.topLandings.map((l) => [l.landing, l.fish.toLocaleString()])} />
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

function ScoreDial({ forecast }: { forecast: RegionForecast }) {
  const color = forecast.finalScore >= 85 ? "var(--success)" : forecast.finalScore >= 70 ? "var(--gold)" : "var(--muted-foreground)";
  return (
    <div className="surface-card p-6 relative overflow-hidden">
      <div className="absolute inset-0 grid-mesh opacity-20" />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">{forecast.region}</p>
        <h3 className="font-display text-xl font-bold mt-1">Bite Score</h3>
        <div className="mt-5 relative h-44 grid place-items-center">
          <svg viewBox="0 0 200 120" className="absolute inset-0 w-full h-full">
            <path d="M20 110 A 80 80 0 0 1 180 110" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
            <path d="M20 110 A 80 80 0 0 1 180 110" fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray="251" strokeDashoffset={251 - (251 * forecast.finalScore) / 100} />
          </svg>
          <div className="text-center pt-6">
            <div className="font-display font-bold tabular text-6xl" style={{ color }}>{forecast.finalScore}</div>
            <div className="text-xs uppercase font-mono tracking-wider text-muted-foreground mt-1">{forecast.label}</div>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-surface-elevated p-3"><span className="text-muted-foreground">7-day fish</span><br /><strong>{forecast.last7Fish.toLocaleString()}</strong></div>
          <div className="rounded-md bg-surface-elevated p-3"><span className="text-muted-foreground">Previous 7</span><br /><strong>{forecast.previous7Fish.toLocaleString()}</strong></div>
        </div>
      </div>
    </div>
  );
}

function CondTile({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return <div className="surface-card p-3.5"><div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{icon}<span>{label}</span></div><div className="mt-1 font-display font-bold tabular text-xl">{value}</div>{sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}</div>;
}
function Factor({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-surface-elevated p-3"><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">{label}</div><div className="mt-1 font-display font-bold text-2xl tabular">{value}</div></div>; }
function Panel({ title, rows }: { title: string; rows: string[][] }) { return <div className="surface-card p-4"><h4 className="font-display font-bold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />{title}</h4><div className="space-y-2">{rows.length ? rows.map(([name, value]) => <div key={name} className="flex justify-between gap-3 text-sm"><span className="truncate text-muted-foreground">{name}</span><strong>{value}</strong></div>) : <p className="text-sm text-muted-foreground">No recent data.</p>}</div></div>; }
function fmtPct(v: number | null) { return v === null || v === undefined ? "N/A" : `${Math.round(v)}%`; }
function scoreWind(f: RegionForecast) { const w = f.condition.windMph, g = f.condition.gustMph; if (!w && !g) return 55; if (w <= 6 && g <= 12) return 90; if (w <= 10 && g <= 18) return 78; if (w <= 15 && g <= 24) return 62; if (w <= 20 && g <= 30) return 42; return 25; }
function scoreTide(f: RegionForecast) { const m = f.condition.tideMovementFt; if (!m) return 55; if (m >= 4) return 90; if (m >= 2.5) return 78; if (m >= 1.5) return 62; if (m >= 0.75) return 45; return 30; }
function scoreTemp(f: RegionForecast) { const t = f.condition.waterTemp; if (!t) return 55; if (t >= 64 && t <= 68) return 90; if (t >= 61 && t < 64) return 76; if (t > 68 && t <= 72) return 76; if (t >= 58 && t < 61) return 60; if (t > 72 && t <= 76) return 58; return 40; }
