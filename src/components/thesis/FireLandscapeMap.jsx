import { useEffect, useMemo, useRef, useState } from 'react';
import { useTheme, palette, ink } from '../../lib/theme.js';
import 'maplibre-gl/dist/maplibre-gl.css';
import REPORT from '../../data/thesis-report.json';

// Interactive landscape map of Bengkalis: peat depth, distance to the nearest canal, and the 3,402 filtered hotspots.
// Everything is drawn from files built by scripts/build_thesis_report_data.py (public/thesis-data/*).
// No external tiles or fonts are used, so the map renders offline and the only "basemap" is the data itself.

const BASE = '/blog';
const DEPTH_COLORS = ['#4b5d9e', '#3b97b0', '#2cc4a0', '#8fd96a', '#e6d23c', '#f28f3b'];
const DEPTH_LABELS = ['50–<100 cm', '100–<200 cm', '200–<300 cm', '300–<500 cm', '500–<700 cm', '>700 cm'];
const DIST_COLORS = ['rgb(28,200,170)', 'rgb(120,210,120)', 'rgb(240,188,46)', 'rgb(232,130,58)', 'rgb(232,83,58)'];
const DIST_LABELS = ['< 0.5 km', '0.5–1 km', '1–2 km', '2–4 km', '> 4 km'];
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const distBin = (v) => (v < 500 ? 0 : v < 1000 ? 1 : v < 2000 ? 2 : v < 4000 ? 3 : 4);

function centroid(feature) {
  // centre of the bounding box of the largest ring: good enough for a label anchor
  const polys = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates;
  let best = null, bestArea = -1;
  for (const p of polys) {
    const ring = p[0];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [x, y] of ring) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const a = (x1 - x0) * (y1 - y0);
    if (a > bestArea) { bestArea = a; best = [(x0 + x1) / 2, (y0 + y1) / 2]; }
  }
  return best;
}

export default function FireLandscapeMap({ initial = 'peat', caption, height = 560 }) {
  const theme = useTheme();
  const el = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef([]);
  const [data, setData] = useState(null);
  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState(initial);
  const [showHs, setShowHs] = useState(true);
  const [showCanals, setShowCanals] = useState(initial === 'canal');
  const [year, setYear] = useState('all');
  const [pick, setPick] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let dead = false;
    Promise.all([
      fetch(`${BASE}/thesis-data/hotspots.json`).then((r) => r.json()),
      fetch(`${BASE}/thesis-data/peat.geojson`).then((r) => r.json()),
      fetch(`${BASE}/thesis-data/kecamatan.geojson`).then((r) => r.json()),
    ]).then(([hs, peat, kec]) => { if (!dead) setData({ hs, peat, kec, ob: REPORT.overlay.bounds }); }).catch((e) => !dead && setErr(String(e)));
    return () => { dead = true; };
  }, []);

  const points = useMemo(() => {
    if (!data) return null;
    const { fields, rows, kecamatan } = data.hs;
    const ix = Object.fromEntries(fields.map((f, i) => [f, i]));
    return rows.map((r, i) => ({
      i, lon: r[ix.lon], lat: r[ix.lat], year: r[ix.year], month: r[ix.month], kec: kecamatan[r[ix.kecamatan]],
      depth: r[ix.depth], canal: r[ix.canal_m], frp: r[ix.frp],
    }));
  }, [data]);

  // live tallies for the side panel
  const tally = useMemo(() => {
    if (!points) return null;
    const sel = points.filter((p) => year === 'all' || p.year === year);
    const onPeat = sel.filter((p) => p.depth > 0);
    const byDepth = [0, 0, 0, 0, 0, 0];
    const byDist = [0, 0, 0, 0, 0];
    onPeat.forEach((p) => { byDepth[p.depth - 1]++; if (p.canal != null) byDist[distBin(p.canal)]++; });
    return { n: sel.length, onPeat: onPeat.length, byDepth, byDist };
  }, [points, year]);

  useEffect(() => {
    if (!data || !el.current) return;
    let map;
    let cancelled = false;
    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;
      if (cancelled) return;
      const PAL = palette();
      map = new maplibregl.Map({
        container: el.current,
        style: { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': PAL.mapBg } }] },
        bounds: [[100.95, 0.97], [102.52, 2.07]], fitBoundsOptions: { padding: 10 },
        minZoom: 7.2, maxZoom: 13, attributionControl: false, cooperativeGestures: true,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: 'Data: thesis analysis (FIRMS MODIS, peat map, canal raster)' }));

      map.on('load', () => {
        const b = data.ob;
        const coords = [[b.west, b.north], [b.east, b.north], [b.east, b.south], [b.west, b.south]];
        map.addSource('peat', { type: 'geojson', data: data.peat });
        map.addSource('kec', { type: 'geojson', data: data.kec });
        map.addSource('cdist', { type: 'image', url: `${BASE}/thesis-data/canal_distance.png`, coordinates: coords });
        map.addSource('clines', { type: 'image', url: `${BASE}/thesis-data/canal_lines.png`, coordinates: coords });
        map.addSource('hs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

        map.addLayer({ id: 'peat-fill', type: 'fill', source: 'peat', paint: {
          'fill-color': ['match', ['get', 'depth'], 1, DEPTH_COLORS[0], 2, DEPTH_COLORS[1], 3, DEPTH_COLORS[2], 4, DEPTH_COLORS[3], 5, DEPTH_COLORS[4], 6, DEPTH_COLORS[5], '#555'],
          'fill-opacity': 0.82 } });
        map.addLayer({ id: 'cdist', type: 'raster', source: 'cdist', paint: { 'raster-opacity': 1, 'raster-fade-duration': 0, 'raster-resampling': 'nearest' } });
        map.addLayer({ id: 'clines', type: 'raster', source: 'clines', paint: { 'raster-opacity': 0.8, 'raster-fade-duration': 0 } });
        map.addLayer({ id: 'kec-line', type: 'line', source: 'kec', paint: { 'line-color': ink(0.55), 'line-width': 1 } });
        map.addLayer({ id: 'hs-dot', type: 'circle', source: 'hs', paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 1.6, 10, 3, 13, 5],
          'circle-color': ['case', ['==', ['get', 'sel'], 1], '#ff4d6d', PAL.bright],
          'circle-opacity': 0.9, 'circle-stroke-color': PAL.halo, 'circle-stroke-width': 0.5 } });

        // sub-district labels as DOM markers (no glyph server needed)
        data.kec.features.forEach((f) => {
          const d = document.createElement('div');
          d.className = 'flm-label';
          d.textContent = f.properties.kecamatan;
          const m = new maplibregl.Marker({ element: d, anchor: 'center' }).setLngLat(centroid(f)).addTo(map);
          markers.current.push(m);
        });

        map.on('click', 'hs-dot', (e) => {
          const f = e.features && e.features[0];
          if (f) setPick(f.properties.i);
        });
        map.on('mouseenter', 'hs-dot', () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'hs-dot', () => (map.getCanvas().style.cursor = ''));
        setReady(true);
      });
    })();
    return () => { cancelled = true; markers.current.forEach((m) => m.remove()); markers.current = []; if (map) map.remove(); mapRef.current = null; setReady(false); };
  }, [data, theme]);

  // layer visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const v = (id, on) => map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none');
    v('peat-fill', layer === 'peat');
    v('cdist', layer === 'canal');
    v('clines', showCanals);
    v('hs-dot', showHs);
  }, [ready, layer, showHs, showCanals]);

  // hotspot filter by year + selection highlight
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !points) return;
    const feats = points.filter((p) => year === 'all' || p.year === year).map((p) => ({
      type: 'Feature', properties: { i: p.i, sel: p.i === pick ? 1 : 0 }, geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
    }));
    map.getSource('hs').setData({ type: 'FeatureCollection', features: feats });
  }, [ready, points, year, pick]);

  const sel = pick != null && points ? points[pick] : null;
  const T = tally || { n: 0, onPeat: 0, byDepth: [0, 0, 0, 0, 0, 0], byDist: [0, 0, 0, 0, 0] };
  const maxDepth = Math.max(1, ...T.byDepth);
  const maxDist = Math.max(1, ...T.byDist);
  const fmt = (n) => n.toLocaleString('en-US');

  return (
    <figure className="pp-fig pp-wide flm">
      <div className="flm-ctl">
        <div className="pp-seg" role="group" aria-label="Map layer">
          <button aria-pressed={layer === 'peat'} onClick={() => setLayer('peat')}>Peat depth</button>
          <button aria-pressed={layer === 'canal'} onClick={() => setLayer('canal')}>Distance to canal</button>
        </div>
        <label className="flm-chk"><input type="checkbox" checked={showHs} onChange={(e) => setShowHs(e.target.checked)} /> Hotspots</label>
        <label className="flm-chk"><input type="checkbox" checked={showCanals} onChange={(e) => setShowCanals(e.target.checked)} /> Canal lines</label>
      </div>
      <div className="pp-chips flm-years" role="group" aria-label="Year filter">
        <button aria-pressed={year === 'all'} onClick={() => { setYear('all'); setPick(null); }}>All years</button>
        {YEARS.map((y) => <button key={y} aria-pressed={year === y} onClick={() => { setYear(y); setPick(null); }}>{y}</button>)}
      </div>

      <div className="flm-grid">
        <div className="flm-mapwrap" style={{ height }}>
          <div ref={el} className="flm-map" role="application" aria-label="Map of Bengkalis showing peat depth, canals and hotspots" />
          {!ready && <div className="flm-loading">{err ? 'The map data could not be loaded.' : 'Loading map…'}</div>}
        </div>
        <aside className="pp-panel flm-panel" aria-live="polite">
          <h4>{year === 'all' ? '2015–2024' : year}</h4>
          <p className="flm-big">{tally ? <><b>{fmt(T.n)}</b> hotspots, <b>{T.n ? Math.round((100 * T.onPeat) / T.n) : 0}%</b> on peat</> : 'Loading hotspots…'}</p>
          {layer === 'peat' ? (
            <>
              <div className="flm-sub">Hotspots by peat depth</div>
              {DEPTH_LABELS.map((l, i) => (
                <div className="flm-row" key={l}>
                  <i style={{ background: DEPTH_COLORS[i] }} /><span>{l}</span>
                  <div className="flm-track"><div style={{ width: `${(100 * T.byDepth[i]) / maxDepth}%`, background: DEPTH_COLORS[i] }} /></div>
                  <em>{fmt(T.byDepth[i])}</em>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="flm-sub">Hotspots on peat by distance to nearest canal</div>
              {DIST_LABELS.map((l, i) => (
                <div className="flm-row" key={l}>
                  <i style={{ background: DIST_COLORS[i] }} /><span>{l}</span>
                  <div className="flm-track"><div style={{ width: `${(100 * T.byDist[i]) / maxDist}%`, background: DIST_COLORS[i] }} /></div>
                  <em>{fmt(T.byDist[i])}</em>
                </div>
              ))}
            </>
          )}
          <div className="flm-sub flm-pick">Selected hotspot</div>
          {sel ? (
            <p className="flm-sel">
              <b>{MN[sel.month - 1]} {sel.year}</b>, {sel.kec}.<br />
              {sel.depth ? `Peat ${DEPTH_LABELS[sel.depth - 1]}` : 'Not on mapped peat'}
              {sel.canal != null ? `, ${sel.canal < 1000 ? Math.round(sel.canal) + ' m' : (sel.canal / 1000).toFixed(1) + ' km'} from the nearest canal` : ''}
              {sel.frp != null ? `. FRP ${sel.frp} MW.` : '.'}
            </p>
          ) : <p className="flm-sel flm-dim">Click a white dot on the map.</p>}
        </aside>
      </div>
      <div className="flm-legend" aria-hidden="true">
        {layer === 'peat'
          ? DEPTH_LABELS.map((l, i) => <span key={l}><i style={{ background: DEPTH_COLORS[i] }} />{l}</span>)
          : DIST_LABELS.map((l, i) => <span key={l}><i style={{ background: DIST_COLORS[i] }} />{l}</span>)}
        <span><i className="dot" />Hotspot</span>
      </div>
      <figcaption>
        {caption}
        {' '}Counts in the side panel are re-tallied from the plotted points, so they can differ from the thesis tables by a few points
        (for example 742 against 743 hotspots in the 100–200 cm class), because of how each point is matched to the peat polygons and to the 30 m distance raster.
        The distance layer is shown on peat only. Use two fingers or Ctrl + scroll to zoom the map.
      </figcaption>
    </figure>
  );
}
