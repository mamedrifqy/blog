import { useEffect, useState } from 'react';

export const DEPTH = ['#4b5d9e', '#3b97b0', '#2cc4a0', '#8fd96a', '#e6d23c', '#f28f3b'];
export const DEPTH_LABELS = ['50–<100 cm', '100–<200 cm', '200–<300 cm', '300–<500 cm', '500–<700 cm', '>700 cm'];
export const PHASE = { 'El Nino': '#e8533a', 'La Nina': '#4f9be8', Netral: '#6b7280' };
export const PHASE_LABEL = { 'El Nino': 'El Niño', 'La Nina': 'La Niña', Netral: 'Neutral' };
export const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const BOUNDS = [[100.95, 0.97], [102.52, 2.07]];

// Small RFC-4180 parser: quoted fields, doubled quotes, commas and newlines inside quotes.
export function parseCSV(text) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); f = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = rows.shift();
  return { head, rows, objects: rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]]))) };
}

const cache = new Map();
export function load(url, kind = 'json') {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return kind === 'csv' ? r.text().then(parseCSV) : r.json();
    }).catch((e) => { cache.delete(url); throw e; }));
  }
  return cache.get(url);
}

export function useData(urls) {
  const key = JSON.stringify(urls);
  const [state, setState] = useState({ data: null, err: null });
  useEffect(() => {
    let dead = false;
    Promise.all(urls.map(([u, k]) => load(u, k)))
      .then((d) => !dead && setState({ data: d, err: null }))
      .catch((e) => !dead && setState({ data: null, err: String(e) }));
    return () => { dead = true; };
  }, [key]);
  return state;
}

export const num = (v, d = 2) => (v === '' || v == null || Number.isNaN(+v) ? '–' : (+v).toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: 0 }));
export const signed = (v, d = 2) => (v === '' || v == null ? '–' : (+v >= 0 ? '+' : '−') + Math.abs(+v).toFixed(d));

export function Loading({ err }) {
  return <div className="sx-loading">{err ? `Could not load the data: ${err}` : 'Loading data…'}</div>;
}

// MapLibre map with no external tiles: dark background, data layers only.
export async function makeMap(el, extra = {}) {
  const maplibregl = (await import('maplibre-gl')).default;
  await import('maplibre-gl/dist/maplibre-gl.css');
  const map = new maplibregl.Map({
    container: el,
    style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0f1112' } }] },
    bounds: BOUNDS, fitBoundsOptions: { padding: 12 }, minZoom: 7, maxZoom: 14, attributionControl: false, ...extra,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
  return { map, maplibregl };
}
