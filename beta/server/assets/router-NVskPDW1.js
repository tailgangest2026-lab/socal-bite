import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, useRouter, Link, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { z } from "zod";
const appCss = "/assets/styles-e4vwtuZK.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("p", { className: "font-mono text-xs uppercase tracking-[0.2em] text-primary", children: "No signal" }),
    /* @__PURE__ */ jsx("h1", { className: "mt-3 text-7xl font-display font-bold", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Off the chart" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "That waypoint isn't in our logs." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90",
        children: "Back to today's bite"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold tracking-tight", children: "Signal lost" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "We couldn't pull that data. Try again or head back to the dashboard." }),
    /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsx("a", { href: "/", className: "rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium hover:bg-surface-elevated", children: "Go home" })
    ] })
  ] }) });
}
const Route$c = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#031828" },
      { title: "The SoCal Bite — Marine Intelligence for Southern California Anglers" },
      { name: "description", content: "Real-time sportfishing reports, NOAA conditions, species analytics and boat rankings from San Luis Obispo to San Diego." },
      { property: "og:title", content: "The SoCal Bite — Marine Intelligence" },
      { property: "og:description", content: "Sportfishing reports, bite forecasts and rankings across Southern California." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "SoCal Bite" },
      { name: "mobile-web-app-capable", content: "yes" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icon-512.png" },
      { rel: "icon", type: "image/png", href: "/icon-512.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$c.useRouteContext();
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
        });
      });
    }
  }, []);
  return /* @__PURE__ */ jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx(Outlet, {}) });
}
const $$splitComponentImporter$b = () => import("./trends-G3nWywsG.js");
const Route$b = createFileRoute("/trends")({
  head: () => ({
    meta: [{
      title: "Historical Trends — The SoCal Bite"
    }, {
      name: "description",
      content: "Twelve weeks of catch history, sliced by species, region and effort — the long view of the SoCal bite."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./subscribe-BQVwlMsH.js");
const Route$a = createFileRoute("/subscribe")({
  head: () => ({
    meta: [{
      title: "Go Pro — The SoCal Bite"
    }, {
      name: "description",
      content: "Unlock pro-tier marine intelligence: extended forecasts, push alerts, historical data and advanced species analytics."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./species-BFsOu0JM.js");
const Route$9 = createFileRoute("/species")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./reports-BFsOu0JM.js");
const Route$8 = createFileRoute("/reports")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./rankings-CXn_NiY-.js");
const Route$7 = createFileRoute("/rankings")({
  head: () => ({
    meta: [{
      title: "Rankings — Boats & Landings · The SoCal Bite"
    }, {
      name: "description",
      content: "Top performing boats, landings and trip types across Southern California — sortable, filterable, live."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./forecast-BkkY-Kr0.js");
const Route$6 = createFileRoute("/forecast")({
  head: () => ({
    meta: [{
      title: "Bite Forecast — The SoCal Bite"
    }, {
      name: "description",
      content: "NOAA-driven bite forecasts using recent fish counts, wind, tide movement, water temperature, weather and moon phase."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./conditions-CgNe0gte.js");
const Route$5 = createFileRoute("/conditions")({
  head: () => ({
    meta: [{
      title: "Conditions — Pier · Surf · Boat — The SoCal Bite"
    }, {
      name: "description",
      content: "Live NOAA and Open-Meteo wind, water temperature, tide movement and fishing condition scores for SoCal regions."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./index-BOdvMEva.js");
const Route$4 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Today's Bite — The SoCal Bite Marine Intelligence"
    }, {
      name: "description",
      content: "Live Southern California sportfishing snapshot: anglers on the water, top boats, hottest species and bite forecast."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./species.index-D5_KyiLQ.js");
const Route$3 = createFileRoute("/species/")({
  head: () => ({
    meta: [{
      title: "Species Analytics — The SoCal Bite"
    }, {
      name: "description",
      content: "Which fish are biting where — species-by-species totals and regional breakdowns across SoCal."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./reports.index-DiRPnoFP.js");
const Route$2 = createFileRoute("/reports/")({
  head: () => ({
    meta: [{
      title: "Daily Reports — The SoCal Bite"
    }, {
      name: "description",
      content: "Every sportfishing trip in Southern California, day by day — boats, anglers, fish counts and trip type."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./species._slug-CfSwUUWD.js");
const Route$1 = createFileRoute("/species/$slug")({
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.slug.replace(/-/g, " ")} — Species Analytics — The SoCal Bite`
    }, {
      name: "description",
      content: `Catch trends, top boats and regional hotspots for ${params.slug.replace(/-/g, " ")} across Southern California.`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./reports._date-BS0gTd1i.js");
const searchSchema = z.object({
  region: z.string().optional()
});
const Route = createFileRoute("/reports/$date")({
  validateSearch: searchSchema,
  head: ({
    params
  }) => ({
    meta: [{
      title: `Sportfishing Report · ${params.date} — The SoCal Bite`
    }, {
      name: "description",
      content: `Every boat, every angler, every fish landed across SoCal on ${params.date}.`
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const TrendsRoute = Route$b.update({
  id: "/trends",
  path: "/trends",
  getParentRoute: () => Route$c
});
const SubscribeRoute = Route$a.update({
  id: "/subscribe",
  path: "/subscribe",
  getParentRoute: () => Route$c
});
const SpeciesRoute = Route$9.update({
  id: "/species",
  path: "/species",
  getParentRoute: () => Route$c
});
const ReportsRoute = Route$8.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => Route$c
});
const RankingsRoute = Route$7.update({
  id: "/rankings",
  path: "/rankings",
  getParentRoute: () => Route$c
});
const ForecastRoute = Route$6.update({
  id: "/forecast",
  path: "/forecast",
  getParentRoute: () => Route$c
});
const ConditionsRoute = Route$5.update({
  id: "/conditions",
  path: "/conditions",
  getParentRoute: () => Route$c
});
const IndexRoute = Route$4.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$c
});
const SpeciesIndexRoute = Route$3.update({
  id: "/",
  path: "/",
  getParentRoute: () => SpeciesRoute
});
const ReportsIndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => ReportsRoute
});
const SpeciesSlugRoute = Route$1.update({
  id: "/$slug",
  path: "/$slug",
  getParentRoute: () => SpeciesRoute
});
const ReportsDateRoute = Route.update({
  id: "/$date",
  path: "/$date",
  getParentRoute: () => ReportsRoute
});
const ReportsRouteChildren = {
  ReportsDateRoute,
  ReportsIndexRoute
};
const ReportsRouteWithChildren = ReportsRoute._addFileChildren(ReportsRouteChildren);
const SpeciesRouteChildren = {
  SpeciesSlugRoute,
  SpeciesIndexRoute
};
const SpeciesRouteWithChildren = SpeciesRoute._addFileChildren(SpeciesRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  ConditionsRoute,
  ForecastRoute,
  RankingsRoute,
  ReportsRoute: ReportsRouteWithChildren,
  SpeciesRoute: SpeciesRouteWithChildren,
  SubscribeRoute,
  TrendsRoute
};
const routeTree = Route$c._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$1 as R,
  Route as a,
  router as r
};
