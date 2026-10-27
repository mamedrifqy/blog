import { useState } from 'react';
import ThesisMap from './ThesisMap.jsx';
import { KEC } from './data.js';
import REPORT from '../../data/thesis-report.json';

// Operational alert levels per sub-district (descriptive scheme from the thesis, not a forecast).
const LEVEL = {
  'SIAGA 1': { fill: '#e8533a', label: 'Alert 1 (SIAGA 1)' },
  'SIAGA 2': { fill: '#e8833a', label: 'Alert 2 (SIAGA 2)' },
  'SIAGA 3': { fill: '#f0bc2e', label: 'Alert 3 (SIAGA 3)' },
  WASPADA: { fill: '#2f7a8a', label: 'Watch (WASPADA)' },
  NORMAL: { fill: '#4b5563', label: 'Normal' },
};
const E = Object.fromEntries(REPORT.ews.map((r) => [r.kecamatan, r]));
const K = Object.fromEntries(REPORT.kecamatan.map((r) => [r.kecamatan, r]));
const p = (v) => (v == null ? '–' : Math.round(v * 100) + '%');

export default function EwsAlertMap({ caption }) {
  const [sel, setSel] = useState('Bandar Laksamana');
  const e = E[sel], k = K[sel];
  const fills = Object.fromEntries(KEC.map((n) => [n, LEVEL[E[n].alert_level].fill]));
  const panel = (
    <>
      <h4>{sel}</h4>
      <p className="pp-mini" style={{ color: LEVEL[e.alert_level].fill, fontWeight: 700 }}>{LEVEL[e.alert_level].label}</p>
      <dl>
        <div><dt>Best ONI lag</dt><dd>{e.oni_lag_months} months <small>(Spearman r = {e.spearman_r_oni_best_lag.toFixed(2)})</small></dd></div>
        <div><dt>P(fire in a month), all months</dt><dd>{p(e.p_fire_annual)}</dd></div>
        <div><dt>P(fire), El Niño months</dt><dd>{p(e.p_fire_el_nino)}</dd></div>
        <div><dt>P(fire), El Niño and dry season</dt><dd>{p(e.p_fire_el_nino_dry)}</dd></div>
        <div><dt>Hotspots 2015–2024</dt><dd>{k.hotspots_total_panel.toLocaleString('en-US')} <small>on {Math.round(k.peat_area_ha).toLocaleString('en-US')} ha of peat</small></dd></div>
      </dl>
      <p className="pp-mini">Trigger for every sub-district: ONI at or above 0.5 °C in a fire month. Adding an SPEI condition was not shown to add skill.</p>
    </>
  );
  const legend = (
    <div className="flm-legend" aria-hidden="true">
      {Object.values(LEVEL).map((l) => <span key={l.label}><i style={{ background: l.fill }} />{l.label}</span>)}
    </div>
  );
  return <ThesisMap fills={fills} selected={sel} onSelect={setSel} panel={panel} legend={legend} caption={caption} label="Operational alert level by sub-district" />;
}
