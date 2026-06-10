import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Calendar, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, formatDate, REGIONS, type Region } from "@/lib/socalbite";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Daily Reports — The SoCal Bite" },
      { name: "description", content: "Every sportfishing trip in Southern California, day by day — boats, anglers, fish counts and trip type." },
    ],
  }),
  component: ReportsIndex,
});

function ReportsIndex() {
  const idx = useQuery({ queryKey: ["dailyIndex"], queryFn: api.dailyIndex });
  const [region, setRegion] = useState<Region | "All">("All");

  const entries = (idx.data ?? []).slice(0, 30);

  return (
    <AppShell>
      <section className="border-b border-border" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Daily reports</p>
          <h1 className="mt-2 font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Every trip, every day.
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            A scrollable archive of every sportfishing trip filed across SoCal. Tap a date to
            drill into boats, fish counts and trip types.
          </p>

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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        {idx.isLoading ? (
          <div className="grid gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 surface-card animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-2">
            {entries.map((e) => (
              <Link
                key={e.date}
                to="/reports/$date"
                params={{ date: e.date }}
                search={region === "All" ? {} : { region }}
                className="surface-card p-4 flex items-center justify-between hover:border-primary/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-md grid place-items-center bg-primary/10 text-primary">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-display font-bold">{formatDate(e.date)}</div>
                    <div className="text-xs text-muted-foreground font-mono">{e.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {region !== "All" && <span className="chip chip-cyan">{region}</span>}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

