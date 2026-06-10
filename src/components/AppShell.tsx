import { Link } from "@tanstack/react-router";
import { Anchor, BarChart3, Fish, Home, Map, Newspaper, Waves } from "lucide-react";

type AppShellProps = {
  children: React.ReactNode;
};

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Forecast", href: "/forecast", icon: Waves },
  { label: "Conditions", href: "/conditions", icon: Map },
  { label: "Reports", href: "/reports", icon: Newspaper },
  { label: "Species", href: "/species", icon: Fish },
  { label: "Rankings", href: "/rankings", icon: BarChart3 },
];

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#031828] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#031828]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15">
              <Anchor className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <div className="text-lg font-bold tracking-wide">The SoCal Bite</div>
              <div className="text-xs text-cyan-200/80">Marine Fishing Intelligence</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="border-t border-white/10 bg-[#02111f] px-4 py-8 text-center text-sm text-white/60">
        © {new Date().getFullYear()} The SoCal Bite. Southern California fishing intelligence.
      </footer>
    </div>
  );
}

