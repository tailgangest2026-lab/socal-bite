# SoCal Bite Lovable Merge Notes

This repo is the Lovable redesign merged with the working data files from the original SoCal Bite repository.

## What changed

- The Lovable React/TanStack app remains the main frontend.
- The real SoCal Bite JSON files were copied into `public/` so the built app can serve them at the same root URLs:
  - `/home.json`
  - `/boat-ratings.json`
  - `/landings.json`
  - `/daily-report-index.json`
  - `/bite-trends.json`
  - `/reports/daily-report-YYYY-MM-DD.json`
- The app data layer was updated in `src/lib/socalbite.ts`.
- The forecast page now uses real recent daily reports plus NOAA/Open-Meteo/tide/water-temperature logic.
- The conditions page now uses live NOAA/Open-Meteo/tide/water-temperature logic instead of fake demo conditions.
- The old GitHub Actions, scripts, socials, reports, and JSON files were preserved.
- A GitHub Pages React deploy workflow was added: `.github/workflows/deploy-react.yml`.

## Important files

- `src/lib/socalbite.ts` — live JSON and NOAA/Open-Meteo data functions.
- `src/routes/forecast.tsx` — real bite forecast page.
- `src/routes/conditions.tsx` — real pier/surf/boat conditions page.
- `public/` — static files served with the React app.
- `.github/workflows/update-json.yml` — still updates JSON and now syncs data into `public/`.

## How to test locally

```bash
npm install
npm run dev
```

Open the local URL, usually:

```text
http://localhost:5173
```

Test these pages:

```text
/
/forecast
/conditions
/rankings
/reports
/species
/trends
/subscribe
```

## Before replacing production

Create a new branch first:

```bash
git checkout -b lovable-react-redesign
```

Push and test before merging into `main`.

## GitHub Pages setting

For the React deploy workflow, GitHub Pages should be set to deploy from **GitHub Actions**, not directly from the `main` branch root.
