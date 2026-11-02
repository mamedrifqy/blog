import { useEffect, useMemo, useRef, useState } from 'react';
import REPORT from '../../../data/thesis-report.json';
import { DEPTH, DEPTH_LABELS, useData, Loading, makeMap, num } from './util.jsx';

// The spatial frame: sub-districts, peat polygons and the distance-to-canal raster. Click to inspect.
const DIST = [['rgb(28,200,170)', '< 0.5 km'], ['rgb(120,210,120)', '0.5–1 km'], ['rgb(240,188,46)', '1–2 km'], ['rgb(232,130,58)', '2–4 km'], ['rgb(232,83,58)', '> 4 km']];

export default function FrameExplorer({ base }) {
  const { data, err } = useData([
    [`${base}/thesis-data/kecamatan.geojson`, 'json'],
    [`${base}/thesis-data/peat.geojson`, 'json'],
    [`${base}/thesis-data/peat_polygons.json`, 'json'],
    [`${base}/thesis-data/csv/subdistrict_summary.csv`, 'csv'],
    [`${base}/thesis-data/csv/hotspots_by_subdistrict_peat.csv`, 'csv'],
    [`${base}/thesis-data/csv/enso_response_by_subdistrict.csv`, 'csv'],
  ]);
  const el = useRef(null);
  const mapRef = useRef(null);
  const detail = useRef(null);
  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState('depth');
  const [pick, setPick] = useState(null); // { kec, peat }

  const byKec = useMemo(() => {
    if (!data) return null;
    const idx = (o) => Object.fromEntries(o.objects.map((r) => [r.kecamatan, r]));
    return { sum: idx(data[3]), peat: idx(data[4]), enso: idx(data[5]) };
  }, [data]);

  useEffect(() => {
    if (!data || !el.current) return;
    let map, dead = false;
    (async () => {
      const m = await makeMap(el.current);
      if (dead) { m.map.remove(); return; }
      map = m.map; mapRef.current = map;
      map.on('load', () => {
        const b = REPORT.overlay.bounds;
        map.addSource('kec', { type: 'geojson', data: data[0], promoteId: 'kecamatan' });
        map.addSource('peat', { type: 'geojson', data: data[1], promoteId: 'gambut_id' });
        map.addSource('cdist', { type: 'image', url: `${base}/thesis-data/canal_distance.png`, coordinates: [[b.west, b.north], [b.east, b.north], [b.east, b.south], [b.west, b.south]] });
        map.addLayer({ id: 'kec-fill', type: 'fill', source: 'kec', paint: { 'fill-color': '#1c1f22', 'fill-opacity': 0.9 } });
        map.addLayer({ id: 'peat', type: 'fill', source: 'peat', paint: {
          'fill-color': ['match', ['get', 'depth'], 1, DEPTH[0], 2, DEPTH[1], 3, DEPTH[2], 4, DEPTH[3], 5, DEPTH[4], 6, DEPTH[5], '#555'],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'sel'], false], 1, 0.78] } });
        map.addLayer({ id: 'peat-sel', type: 'line', source: 'peat', paint: { 'line-color': '#ffffff', 'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.5, 0] } });
        map.addLayer({ id: 'cdist', type: 'raster', source: 'cdist', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-resampling': 'nearest' } });
        map.addLayer({ id: 'kec-line', type: 'line', source: 'kec', paint: {
          'line-color': ['case', ['boolean', ['feature-state', 'sel'], false], '#1cc8aa', 'rgba(242,237,228,.55)'],
          'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 3, 1] } });
        map.on('click', (e) => {
          const fs = map.queryRenderedFeatures(e.point, { layers: ['peat', 'kec-fill'] });
          const k = fs.find((f) => f.layer.id === 'kec-fill');
          const p = fs.find((f) => f.layer.id === 'peat');
          if (k) setPick({ kec: k.properties.kecamatan, peat: p ? String(p.properties.gambut_id) : null });
        });
        map.on('mousemove', (e) => {
          map.getCanvas().style.cursor = map.queryRenderedFeatures(e.point, { layers: ['kec-fill'] }).length ? 'pointer' : '';
        });
        setReady(true);
      });
    })();
    return () => { dead = true; if (map) map.remove(); mapRef.current = null; setReady(false); };
  }, [data]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.setLayoutProperty('cdist', 'visibility', layer === 'canal' ? 'visible' : 'none');
    map.setLayoutProperty('peat', 'visibility', layer === 'depth' ? 'visible' : 'none');
    map.setLayoutProperty('peat-sel', 'visibility', layer === 'depth' ? 'visible' : 'none');
  }, [ready, layer]);

  const prevSel = useRef({});
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const o = prevSel.current;
    if (o.kec) map.setFeatureState({ source: 'kec', id: o.kec }, { sel: false });
    if (o.peat) map.setFeatureState({ source: 'peat', id: o.peat }, { sel: false });
    if (pick?.kec) map.setFeatureState({ source: 'kec', id: pick.kec }, { sel: true });
    if (pick?.peat) map.setFeatureState({ source: 'peat', id: pick.peat }, { sel: true });
    prevSel.current = pick || {};
  }, [ready, pick]);

  // on narrow screens the detail sits under the map: bring it into view after a pick
  useEffect(() => {
    if (pick != null && detail.current && window.matchMedia('(max-width: 900px)').matches) detail.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pick]);

  if (!data) return <Loading err={err} />;
  const s = pick && byKec.sum[pick.kec], hp = pick && byKec.peat[pick.kec], en = pick && byKec.enso[pick.kec];
  const poly = pick?.peat ? data[2][pick.peat] : null;

  return (
    <div className="sx-explorer">
      <div className="sx-toolbar">
        <div className="sx-chips" role="group" aria-label="Layer">
          <button className={layer === 'depth' ? 'on' : ''} onClick={() => setLayer('depth')}>Peat depth</button>
          <button className={layer === 'canal' ? 'on' : ''} onClick={() => setLayer('canal')}>Distance to canal</button>
        </div>
      </div>
      <div className="sx-split">
        <div className="sx-mapwrap">
          <div ref={el} className="sx-map" />
          <div className="sx-legend">
            {layer === 'depth' ? DEPTH_LABELS.map((l, i) => <span key={l}><i style={{ background: DEPTH[i] }} />{l}</span>)
              : DIST.map(([c, t]) => <span key={t}><i style={{ background: c }} />{t}</span>)}
          </div>
        </div>
        <aside className="sx-detail" aria-live="polite" ref={detail}>
          {!pick && <p className="sx-hint">Click anywhere in the regency: you get the sub-district, and the peat polygon if you clicked on peat. The canal layer shows distance to the nearest mapped canal, on peat only.</p>}
          {poly && (
            <div className="sx-card">
              <p className="sx-card-kick">Peat polygon</p>
              <h4><i className="sx-sw" style={{ background: DEPTH[poly[0] - 1] }} />{DEPTH_LABELS[poly[0] - 1]}</h4>
              <dl className="sx-kv">
                <div><dt>Area</dt><dd>{num(poly[1], 0)} ha</dd></div>
                <div><dt>Hotspots inside, 2015–2024</dt><dd>{poly[2]}{poly[1] > 0 && poly[2] > 0 ? ` · ${num((poly[2] / poly[1]) * 1000, 2)} per 1,000 ha` : ''}</dd></div>
              </dl>
              <p className="sx-note">Area and counts use the simplified web outlines: 511,200 ha and 3,094 hotspots in total, against 511,265 ha and 3,100 on the full map.</p>
            </div>
          )}
          {s && (
            <div className="sx-card">
              <p className="sx-card-kick">Sub-district</p>
              <h4>{pick.kec}</h4>
              <dl className="sx-kv">
                <div><dt>Hotspots, 2015–2024</dt><dd>{num(s.hotspots_total_panel, 0)}{hp ? ` · ${hp.pct_on_peat}% on peat` : ''}</dd></div>
                <div><dt>Mapped peat</dt><dd>{num(s.peat_area_ha, 0)} ha</dd></div>
                {hp && <div><dt>Mean depth class</dt><dd>{num(hp.mean_depth_class_at_fire, 2)} where it burned vs {num(hp.mean_depth_class_of_landscape, 2)} across its peat</dd></div>}
                <div><dt>ONI and monthly hotspots</dt><dd>Spearman ρ = {num(s.spearman_r_hotspots_oni, 2)}; strongest at a {s.oni_lag_months}-month lag</dd></div>
                {en && <div><dt>Hotspots per +1 °C ONI</dt><dd>IRR {en.irr_per_oni_c} (95% CI {en.irr_ci95_low}–{en.irr_ci95_high}); BH-adjusted p = {en.p_irr_bh}</dd></div>}
                <div><dt>Oil palm fraction</dt><dd>{num(s.oil_palm_fraction, 2)}</dd></div>
                <div><dt>Deforested fraction, 2015–2024</dt><dd>{num(s.deforestation_fraction, 3)}</dd></div>
                <div><dt>Population density</dt><dd>{num(s.population_density_km2, 1)} per km²</dd></div>
                <div><dt>Vulnerability index</dt><dd>{num(s.vulnerability_index, 2)}</dd></div>
                <div><dt>Alert level (thesis table)</dt><dd>{s.alert_level}</dd></div>
              </dl>
              <p className="sx-note">From subdistrict_summary.csv, hotspots_by_subdistrict_peat.csv and enso_response_by_subdistrict.csv on this page. Alert labels are the Indonesian terms of the thesis table.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
