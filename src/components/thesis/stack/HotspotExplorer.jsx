import { useEffect, useMemo, useRef, useState } from 'react';
import { DEPTH, DEPTH_LABELS, MONTHS_LONG, useData, Loading, makeMap, num } from './util.jsx';

// Every one of the 3,402 filtered hotspots, clickable. Fields come straight from hotspots_filtered_3402.csv.
const YEARS = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const DEPTH_IX = Object.fromEntries(DEPTH_LABELS.map((l, i) => [l, i + 1]));
const TIER_COL = { anchor: '#1cc8aa', rescued: '#f0bc2e' };
const MODES = [['tier', 'Filter tier'], ['depth', 'Peat depth'], ['frp', 'Fire radiative power']];

function fmtDate(d) {
  const [y, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS_LONG[m - 1]} ${y}`;
}

export default function HotspotExplorer({ base }) {
  const { data, err } = useData([
    [`${base}/thesis-data/csv/hotspots_filtered_3402.csv`, 'csv'],
    [`${base}/thesis-data/kecamatan.geojson`, 'json'],
    [`${base}/thesis-data/peat.geojson`, 'json'],
  ]);
  const el = useRef(null);
  const mapRef = useRef(null);
  const detail = useRef(null);
  const [ready, setReady] = useState(false);
  const [year, setYear] = useState('all');
  const [mode, setMode] = useState('tier');
  const [pick, setPick] = useState(null);
  const [day, setDay] = useState(null);

  const pts = useMemo(() => {
    if (!data) return null;
    return data[0].objects.map((r, i) => ({
      i, date: r.date, year: +r.year, month: +r.month, lat: +r.latitude, lon: +r.longitude, kec: r.kecamatan,
      depth: DEPTH_IX[r.peat_depth_class] || 0, depthLabel: r.peat_depth_class, canal: r.canal_distance_m === '' ? null : +r.canal_distance_m,
      frp: +r.frp_mw, conf: +r.confidence, sat: r.satellite, dn: r.day_night, tier: +r.confidence >= 70 ? 'anchor' : 'rescued',
    }));
  }, [data]);

  const sel = useMemo(() => pts && pts.filter((p) => (day ? p.date === day : year === 'all' || p.year === year)), [pts, year, day]);
  const stats = useMemo(() => {
    if (!sel) return null;
    const anchors = sel.filter((p) => p.tier === 'anchor').length;
    const onPeat = sel.filter((p) => p.depth > 0).length;
    return { n: sel.length, anchors, rescued: sel.length - anchors, onPeat };
  }, [sel]);

  useEffect(() => {
    if (!data || !el.current) return;
    let map, dead = false;
    (async () => {
      const m = await makeMap(el.current);
      if (dead) { m.map.remove(); return; }
      map = m.map; mapRef.current = map;
      map.on('load', () => {
        map.addSource('peat', { type: 'geojson', data: data[2] });
        map.addSource('kec', { type: 'geojson', data: data[1] });
        map.addSource('hs', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.addLayer({ id: 'peat', type: 'fill', source: 'peat', paint: { 'fill-color': '#1b2a2a', 'fill-opacity': 0.9 } });
        map.addLayer({ id: 'kec', type: 'line', source: 'kec', paint: { 'line-color': 'rgba(242,237,228,.4)', 'line-width': 1 } });
        map.addLayer({ id: 'hs', type: 'circle', source: 'hs', paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 7, 2.2, 10, 4, 13, 7],
          'circle-color': ['get', 'c'], 'circle-opacity': 0.9,
          'circle-stroke-color': ['case', ['==', ['get', 'sel'], 1], '#ffffff', '#0d0e0f'],
          'circle-stroke-width': ['case', ['==', ['get', 'sel'], 1], 2.5, 0.4],
        } });
        map.on('click', 'hs', (e) => { const f = e.features?.[0]; if (f) setPick(f.properties.i); });
        map.on('mouseenter', 'hs', () => (map.getCanvas().style.cursor = 'pointer'));
        map.on('mouseleave', 'hs', () => (map.getCanvas().style.cursor = ''));
        setReady(true);
      });
    })();
    return () => { dead = true; if (map) map.remove(); mapRef.current = null; setReady(false); };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !sel) return;
    const colour = (p) => mode === 'tier' ? TIER_COL[p.tier]
      : mode === 'depth' ? (p.depth ? DEPTH[p.depth - 1] : '#9ca3af')
      : p.frp < 10 ? '#4b5d9e' : p.frp < 25 ? '#2cc4a0' : p.frp < 50 ? '#e6d23c' : p.frp < 100 ? '#f28f3b' : '#e8533a';
    // selected point last so it draws on top
    const order = [...sel].sort((a, b) => (a.i === pick) - (b.i === pick));
    map.getSource('hs').setData({ type: 'FeatureCollection', features: order.map((p) => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: { i: p.i, c: colour(p), sel: p.i === pick ? 1 : 0 },
    })) });
  }, [ready, sel, mode, pick]);

  const p = pick != null && pts ? pts[pick] : null;
  const sameDay = useMemo(() => (p ? pts.filter((q) => q.date === p.date) : []), [p, pts]);

  useEffect(() => {
    if (p && mapRef.current && day) mapRef.current.easeTo({ center: [p.lon, p.lat], zoom: Math.max(mapRef.current.getZoom(), 9.5) });
  }, [day]);

  // on narrow screens the detail sits under the map: bring it into view after a pick
  useEffect(() => {
    if (pick != null && detail.current && window.matchMedia('(max-width: 900px)').matches) detail.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pick]);

  if (!data) return <Loading err={err} />;
  return (
    <div className="sx-explorer">
      <div className="sx-toolbar">
        <div className="sx-chips" role="group" aria-label="Year">
          <button className={year === 'all' && !day ? 'on' : ''} onClick={() => { setDay(null); setYear('all'); }}>All years</button>
          {YEARS.map((y) => <button key={y} className={year === y && !day ? 'on' : ''} onClick={() => { setDay(null); setYear(y); }}>{y}</button>)}
        </div>
        <label className="sx-select">Colour by
          <select value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map(([k, t]) => <option key={k} value={k}>{t}</option>)}</select>
        </label>
      </div>
      <div className="sx-split">
        <div className="sx-mapwrap">
          <div ref={el} className="sx-map" />
          <div className="sx-legend">
            {mode === 'tier' && <><span><i style={{ background: TIER_COL.anchor }} />Anchor, confidence ≥ 70%</span><span><i style={{ background: TIER_COL.rescued }} />Rescued, 50–69% within 1.5 km of an anchor</span></>}
            {mode === 'depth' && <>{DEPTH_LABELS.map((l, i) => <span key={l}><i style={{ background: DEPTH[i] }} />{l}</span>)}<span><i style={{ background: '#9ca3af' }} />Not on mapped peat</span></>}
            {mode === 'frp' && [['#4b5d9e', '< 10 MW'], ['#2cc4a0', '10–25'], ['#e6d23c', '25–50'], ['#f28f3b', '50–100'], ['#e8533a', '≥ 100 MW']].map(([c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}
          </div>
        </div>
        <aside className="sx-detail" aria-live="polite" ref={detail}>
          {stats && (
            <p className="sx-tally">
              {day ? <>On <b>{fmtDate(day)}</b>: </> : year === 'all' ? <>All years: </> : <>{year}: </>}
              <b>{stats.n.toLocaleString('en-US')}</b> hotspots · {stats.anchors.toLocaleString('en-US')} anchors, {stats.rescued.toLocaleString('en-US')} rescued · {stats.n ? Math.round((stats.onPeat / stats.n) * 1000) / 10 : 0}% on peat
              {day && <button className="sx-link" onClick={() => setDay(null)}>Clear date</button>}
            </p>
          )}
          {!p && <p className="sx-hint">Click a hotspot on the map to see its record. Zoom in where points overlap.</p>}
          {p && (
            <div className="sx-card">
              <p className="sx-card-kick">Hotspot #{p.i + 1} of 3,402</p>
              <h4>{fmtDate(p.date)}</h4>
              <dl className="sx-kv">
                <div><dt>Satellite</dt><dd>{p.sat} · {p.dn === 'D' ? 'daytime' : 'night-time'} pass</dd></div>
                <div><dt>Confidence</dt><dd>{p.conf}% · <b style={{ color: TIER_COL[p.tier] }}>{p.tier === 'anchor' ? 'anchor (≥ 70%)' : 'rescued (50–69%, within 1.5 km of an anchor)'}</b></dd></div>
                <div><dt>Fire radiative power</dt><dd>{num(p.frp, 1)} MW</dd></div>
                <div><dt>Sub-district</dt><dd>{p.kec}</dd></div>
                <div><dt>Peat depth</dt><dd>{p.depth ? <><i className="sx-sw" style={{ background: DEPTH[p.depth - 1] }} />{p.depthLabel}</> : 'Not on mapped peat'}</dd></div>
                <div><dt>Distance to nearest canal</dt><dd>{p.canal == null ? '–' : `${num(p.canal, 0)} m`}</dd></div>
                <div><dt>Pixel centre</dt><dd>{p.lat.toFixed(4)}°N, {p.lon.toFixed(4)}°E</dd></div>
              </dl>
              <p className="sx-same">
                {sameDay.length === 1 ? 'The only filtered hotspot in the regency that day.' : <>{sameDay.length} filtered hotspots in the regency that day, in {new Set(sameDay.map((q) => q.kec)).size} sub-district(s).</>}
                {sameDay.length > 1 && day !== p.date && <button className="sx-link" onClick={() => setDay(p.date)}>Show only that day</button>}
              </p>
              <p className="sx-note">The position is the centre of the MODIS 1 km pixel, not the exact fire location. Canal distance is read from the 30 m distance raster at that point.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
