import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { z } from "zod";
import { ArrowLeft, Fish, MapPin, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatDate, formatNumber, REGIONS, type Region } from "@/lib/socalbite";

const searchSchema = z.object({
  region: z.string().optional(),
});

export const Route = createFileRoute("/reports/$date")({
  validateSearch: searchSchema,
  head: ({ params }) => ({
    meta: [
      { title: `Sportfishing Report · ${params.date} — The SoCal Bite` },
      { name: "description", content: `Every boat, every angler, every fish landed across SoCal on ${params.date}.` },
    ],
  }),
  component: DailyReportPage,
});

function DailyReportPage() {
  const { date } = Route.useParams();
  const { region: initialRegion } = Route.useSearch();
  const idx = useQuery({ queryKey: ["dailyIndex"], queryFn: api.dailyIndex });
  const file = idx.data?.find((e) => e.date === date)?.file ?? `reports/daily-report-${date}.json`;
  const report = useQuery({
    queryKey: ["dailyReport", file],
    queryFn: () => api.dailyReport(file),
    enabled: Boolean(file),
  });

  const [region, setRegion] = useState<Region | "All">(
    (initialRegion as Region) ?? "All",
  );

  const trips = useMemo(() => {
    const all = report.data ?? [];
    return region === "All" ? all : all.filter((t) => t.region === region);
  }, [report.data, region]);

  const totals = trips.reduce(
    (a, t) => ({ trips: a.trips + 1, anglers: a.anglers + t.anglers, fish: a.fish + t.total_fish }),
    { trips: 0, anglers: 0, fish: 0 },
  );
  const fpa = totals.anglers ? totals.fish / totals.anglers : 0;

  const byBoat = useMemo(() => {
    return trips
      .slice()
      .sort((a, b) => b.total_fish - a.total_fish);
  }, [trips]);

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-8 pb-8">
          <Link to="/reports" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" /> All reports
          </Link>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-primary">Daily report</p>
          <h1 className="mt-1 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            {formatDate(date)}
          </h1>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {(["All", ...REGIONS] as const).map((r) => (
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

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat icon={<Trophy className="h-4 w-4" />} label="Trips" value={formatNumber(totals.trips)} />
            <Stat icon={<Users className="h-4 w-4" />} label="Anglers" value={formatNumber(totals.anglers)} />
            <Stat icon={<Fish className="h-4 w-4" />} label="Fish" value={formatNumber(totals.fish)} />
            <Stat icon={<MapPin className="h-4 w-4" />} label="FPA" value={fpa.toFixed(2)} accent />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {report.isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 surface-card animate-pulse" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="surface-card p-10 text-center text-muted-foreground">
            No trips on file for this date.
          </div>
        ) : (
          <div className="grid gap-2">
            {byBoat.map((t, i) => {
              const tripFpa = t.anglers ? t.total_fish / t.anglers : 0;
              return (
                <div key={`${t.boat}-${i}`} className="surface-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold truncate">{t.boat}</span>
                        <span className="chip text-[10px]">{t.trip_type}</span>
                        <span className="chip chip-cyan text-[10px]">{t.region}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 truncate">{t.landing}</div>
                      {t.fish_counts && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <span className="text-foreground/80">{t.fish_counts}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display font-bold tabular text-xl">{formatNumber(t.total_fish)}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                        {t.anglers} anglers · {tripFpa.toFixed(2)} FPA
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="surface-card p-3.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
        {icon}<span>{label}</span>
      </div>
      <div className={`mt-1 font-display font-bold tabular text-xl sm:text-2xl ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
