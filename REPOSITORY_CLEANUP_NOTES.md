# SoCal Bite Repository Cleanup Notes

## Changes Made

- Removed invalid historical daily report files that contained Apps Script error HTML instead of JSON.
- Rebuilt `daily-report-index.json` so it only points to valid local report files.
- Removed invalid placeholder/unused JSON files:
  - `daily-report-YYYY-MM-DD.json`
  - `top-boats.json`
  - `reports/daily`
- Hardened GitHub Actions so invalid JSON and `{ "error": ... }` responses are rejected or skipped.
- Updated the backfill workflow so it only commits valid daily report arrays.
- Added `site-config.js` with a shared data version helper.
- Replaced `?v=` + `Date.now()` cache busting with stable versioned URLs.
- Moved inline JavaScript out of:
  - `landings.html` → `landings.js`
  - `news.html` → `news.js`
- Fixed broken HTML structure on `news.html`.
- Fixed the extra closing element in `bite-trends.html`.
- Added SEO basics:
  - meta descriptions
  - canonical URLs
  - Open Graph tags
  - `robots.txt`
  - `sitemap.xml`
- Added `defer` to local scripts for better page loading.
- Added lazy loading to footer/social images.
- Compressed the oversized Instagram icon from about 1.3 MB to about 47 KB.
- Added mobile CSS improvements for nav buttons, spacing, and tap targets.

## Important Notes

- I did not move all HTML, JS, CSS, and JSON into new folders yet. That is a bigger refactor and could break existing GitHub Pages paths if done all at once.
- The safest next step is to upload this ZIP, confirm the site still works, then do the folder reorganization as a separate phase.
- Only 5 valid daily report JSON files were present in the uploaded repository. The old invalid daily files were removed so the site does not try to load broken report pages.

## Recommended Next Step

After confirming this version works on GitHub Pages, run the updated `Backfill Daily Reports` workflow from GitHub Actions. It will only keep valid reports and skip broken/missing reports.

## News tab hotfix
- Fixed `news.js` to load `news.json` with a relative path instead of `/news.json`.
- Added fallback behavior so the News page still works if `site-config.js` does not load.
- Added support for multiple possible RSS field names: `headline/title`, `link/url`, and `date/pubDate/published`.
- Escaped rendered news content to avoid broken HTML when headlines contain special characters.
