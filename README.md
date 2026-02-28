# Puerto Rico Power Outage Atlas

A Vite + React spatial data story visualizing power outages across Puerto Rico's 78 municipios.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Architecture

```
src/
├── App.jsx                  # Root: state management, fetch, prop passing
├── utils/
│   ├── generateData.js      # Synthetic outage data + METRICS config
│   └── colorUtils.js        # Quantile breaks, color mapping, formatting
└── components/
    ├── MapView.jsx          # Leaflet choropleth map
    ├── Controls.jsx         # Metric buttons + time slider
    ├── SidePanel.jsx        # KPI cards + selected municipio panel
    ├── TimeSeriesChart.jsx  # Recharts line chart
    └── Legend.jsx           # Dynamic map legend
public/
└── data/
    └── PR.geojson           # Barrio-level geometries (fetched at runtime)
```

## Data Flow

1. `App.jsx` fetches `/data/PR.geojson` via `fetch()` on mount
2. Loading → success/error state drives UI
3. `outageData` (synthetic monthly metrics) computed once via `generateOutageData()`
4. `choroplethValues` derived via `useMemo` from current `metric` + `month`
5. All child components receive data via props — no local fetching

## Features

- **Choropleth map** — 5-quantile color scale, updates on metric/month change
- **Hover tooltip** — municipio name + current metric value
- **Click selection** — highlights municipio, populates side panel
- **Time slider** — scrub through 30 months (Jan 2021 – Jun 2023)
- **3 metrics**: Customer-Hours, Event Count, Peak Affected
- **KPI cards** — latest month values for selected municipio
- **Time series chart** — full trend with Hurricane Fiona reference line
- **Island average** default when no municipio selected

## Notes

- The outage data is synthetic but realistically modeled (Hurricane Fiona spike Sep 2022, seasonal patterns, recovery trend)
- Geometry is barrio-level; coloring aggregates by COUNTYFP (municipio)
- Uses CartoDB dark basemap, no API key required
