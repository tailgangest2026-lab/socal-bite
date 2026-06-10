import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, X, Radar, Download } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function useInstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  return {
    canInstall: !!evt || (isIOS && !installed),
    installed,
    isIOS,
    install: async () => {
      if (evt) { await evt.prompt(); await evt.userChoice; setEvt(null); }
      else if (isIOS) {
        alert("To install: tap the Share icon in Safari, then 'Add to Home Screen'.");
      }
    },
  };
}

import logo from "@/assets/socal-bite-logo.webp.asset.json";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/forecast", label: "Forecast" },
  { to: "/conditions", label: "Conditions" },
  { to: "/rankings", label: "Rankings" },
  { to: "/species", label: "Species" },
  { to: "/reports", label: "Reports" },
  { to: "/trends", label: "Trends" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { canInstall, install } = useInstallPrompt();


  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 surface-glass border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative h-8 w-8 rounded-md overflow-hidden ring-1 ring-border-strong">
              <img src={logo.url} alt="" className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-sm sm:text-base tracking-tight">
                The SoCal Bite
              </span>
              <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Marine Intelligence
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    active
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-elevated"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {canInstall && (
              <button
                onClick={install}
                className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
              >
                <Download className="h-3.5 w-3.5" /> Install app
              </button>
            )}
            <span className="chip chip-live"><span className="live-dot" /> Live</span>
          </div>


          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 -mr-2 text-foreground"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-border bg-surface-sunken">
            <div className="px-4 py-3 space-y-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium hover:bg-surface-elevated"
                >
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 flex items-center justify-between gap-2">
                <span className="chip chip-live"><span className="live-dot" /> Live data</span>
                {canInstall && (
                  <button
                    onClick={() => { install(); setOpen(false); }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"
                  >
                    <Download className="h-3.5 w-3.5" /> Install app
                  </button>
                )}
              </div>

            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-surface-sunken">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 grid gap-8 md:grid-cols-4 text-sm">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-primary" />
              <span className="font-display font-bold">The SoCal Bite</span>
            </div>
            <p className="text-muted-foreground max-w-sm">
              Real-time fishing intelligence for Southern California — from San Luis Obispo
              to San Diego. Sportfishing reports, NOAA conditions, species analytics, and
              boat rankings.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Data refresh · every 15 min
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">Intelligence</h4>
            <ul className="space-y-2">
              <li><Link to="/forecast" className="hover:text-primary">Bite Forecast</Link></li>
              <li><Link to="/rankings" className="hover:text-primary">Rankings</Link></li>
              <li><Link to="/species" className="hover:text-primary">Species</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold mb-3 text-xs uppercase tracking-wider text-muted-foreground">Account</h4>
            <ul className="space-y-2">
              <li><a href="https://thesocalbite.com" className="hover:text-primary">Legacy site</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} The SoCal Bite · Built for anglers
        </div>
      </footer>
    </div>
  );
}
