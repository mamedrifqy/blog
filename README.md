# Riau Geospatial Lab — GIS Blog

Scrollytelling GIS blog built with **Astro + React + MapLibre GL JS + Chart.js**.

## Quick start

```bash
npm install
npm run dev     # → http://localhost:4321
npm run build   # static output in ./dist/
```

## Project structure

```
src/
  components/
    ScrollyMap.jsx      ← sticky MapLibre map + Scrollama engine
    EnsoChart.jsx       ← Chart.js ENSO dual-axis chart
  content/
    articles/           ← MDX blog posts (add yours here)
  layouts/
    BaseLayout.astro
    ArticleLayout.astro
  pages/
    index.astro         ← article listing homepage
    blog/[slug].astro   ← dynamic article routes
    about.astro
  styles/
    global.css

public/
  data/
    riau_hotspots.geojson     ← MODIS/VIIRS hotspot points (replace with real data)
    riau_regencies.geojson    ← regency boundary polygons
```

## Writing a new article

1. Create `src/content/articles/my-article.mdx`
2. Add frontmatter:

```mdx
---
title: "My Analysis Title"
subtitle: "Optional subtitle"
date: "2025-06-01"
author: "Your name"
tags: ["peatland", "mangrove"]
---

import ScrollyMap from '../../components/ScrollyMap.jsx';
import EnsoChart from '../../components/EnsoChart.jsx';

export const STEPS = [
  { id: 'step1', year: 2019, title: 'Step heading', text: 'Body text.',
    center: [101.4, 0.5], zoom: 8 },
];

Your prose here...

<ScrollyMap steps={STEPS} dataUrl="/data/your_data.geojson" client:visible />
```

## Replacing sample data with real data

The `public/data/riau_hotspots.geojson` file uses generated sample data.
To use your real FIRMS data, export from Python/GEE as GeoJSON with these properties:

```json
{ "regency": "Indragiri Hilir", "year": 2015, "month": 9, "count": 42 }
```

## Deploying to Vercel

```bash
npm install -g vercel
vercel --prod
```

Or connect your GitHub repo to Vercel — it auto-detects Astro.

## Deploying to GitHub Pages

In `astro.config.mjs`, set:
```js
base: '/riau-gis-blog',   // your repo name
site: 'https://yourusername.github.io',
```

Then push and enable GitHub Pages in repo settings.
