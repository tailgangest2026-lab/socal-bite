import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { Anchor, Home, Waves, Map, Newspaper, Fish, BarChart3 } from "lucide-react";
const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Forecast", href: "/forecast", icon: Waves },
  { label: "Conditions", href: "/conditions", icon: Map },
  { label: "Reports", href: "/reports", icon: Newspaper },
  { label: "Species", href: "/species", icon: Fish },
  { label: "Rankings", href: "/rankings", icon: BarChart3 }
];
function AppShell({ children }) {
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#031828] text-white", children: [
    /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-50 border-b border-white/10 bg-[#031828]/95 backdrop-blur", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-4", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/15", children: /* @__PURE__ */ jsx(Anchor, { className: "h-6 w-6 text-cyan-300" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "text-lg font-bold tracking-wide", children: "The SoCal Bite" }),
          /* @__PURE__ */ jsx("div", { className: "text-xs text-cyan-200/80", children: "Marine Fishing Intelligence" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "hidden items-center gap-1 md:flex", children: navItems.map((item) => {
        const Icon = item.icon;
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: item.href,
            className: "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white",
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
              item.label
            ]
          },
          item.href
        );
      }) })
    ] }) }),
    /* @__PURE__ */ jsx("main", { children }),
    /* @__PURE__ */ jsxs("footer", { className: "border-t border-white/10 bg-[#02111f] px-4 py-8 text-center text-sm text-white/60", children: [
      "© ",
      (/* @__PURE__ */ new Date()).getFullYear(),
      " The SoCal Bite. Southern California fishing intelligence."
    ] })
  ] });
}
export {
  AppShell as A
};
