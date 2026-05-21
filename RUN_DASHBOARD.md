# HaFAS modern dashboard

A **new** dashboard UI lives alongside the classic app. Existing pages, API, Redux, and database are unchanged.

## What was added

| File | Purpose |
|------|---------|
| `components/dashboard/DashboardSidebar.js` | Sidebar navigation (completes `AppDashboard.js`) |
| `components/dashboard/DashboardStatCard.js` | KPI stat cards |
| `components/dashboard/dashboardNavConfig.js` | Advisory quick links & nav items |
| `AppDashboardModern.js` | Full app with modern layout + metrics page |
| `index.dashboard.modern.js` | CRA entry for modern dashboard |
| `pages/dashboard/DashboardHomeModern.js` | Hero, progress steps, session panel |
| `pages/dashboard/DashboardMetrics.js` | Live metrics charts (same API as Report) |

## Run the modern dashboard

**Option A — one-line swap (recommended for local dev)**

In `src/index.js`, change the import:

```javascript
import App from './src/App';
```

to:

```javascript
import App from './src/AppDashboardModern';
```

Then:

```bash
cd fertilizer_frontend/src
npm start
```

Open **http://localhost:3000/dashboard** after selecting a country.

**Option B — use the alternate entry file**

Copy `index.dashboard.modern.js` over `src/index.js`, then `npm start`.

Restore `index.js` when you want the classic map-first UI (`App.js`).

## Run the basic dashboard (no hero / metrics page)

Use `AppDashboard` instead of `AppDashboardModern` in `index.js`, or use existing `indexDashboard.js` pattern with `AppDashboard`.

## Prerequisites

1. **MongoDB + API**: `fertilizer_webapi` on port 5000 (see `Configuration.js`).
2. **Data**: Import notebook `import_data_database.ipynb` so `/metrics` returns values.
3. **GeoServer**: Maps still use Aclimate WMS (unchanged).

## Dashboard routes

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview, quick links, setup progress |
| `/dashboard/location` | Redux location & layer flags |
| `/dashboard/advisories` | All advisory modules |
| `/dashboard/metrics` | Bar charts preview (modern app only) |
| `/dashboard/insights` | API / GeoServer status |

All classic routes (`/fertilizer_advisories`, `/report`, etc.) work unchanged.
