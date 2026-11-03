import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Oil palm fraction per peat polygon by depth class, from oil_palm_by_depth.csv (REPORT.oil_palm).
// The published table holds the median, mean, share of zero polygons and polygon count per class.
// The polygon-level values (needed for quartiles / box plots) are not in the repository, so none are drawn.
const D = REPORT.oil_palm;
const SHORT = ['<100', '100–200', '200–300', '300–500', '500–700', '>700'];
const METRICS = {
  median: { label: 'Median fraction', key: 'median_oil_palm_fraction', max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], f: (v) => v.toFixed(2), color: '#f0bc2e' },
  mean: { label: 'Mean fraction', key: 'mean_oil_palm_fraction', max: 0.4, ticks: [0, 0.1, 0.2, 0.3, 0.4], f: (v) => v.toFixed(2), color: '#1cc8aa' },
  zero: { label: '% of polygons with no oil palm', key: 'pct_polygons_zero', max: 100, ticks: [0, 25, 50, 75, 100], f: (v) => v.toFixed(0) + '%', color: '#e8533a' },
};
const W = 760, H = 330, PL = 56, PR = 20, PT = 24, PB = 54;

export default function OilPalmByDepth({ caption }) {
  const [m, setM] = useState('median');
  const [hov, setHov] = useState(null);
  const M = METRICS[m];
  const y = (v) => PT + (H - PT - PB) * (1 - v / M.max);
  const pw = (W - PL - PR) / D.length;
  const r = hov !== null ? D[hov] : null;
  return (
    <figure className="pp-fig">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="Measure">
          {Object.entries(METRICS).map(([k, v]) => <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)}>{v.label}</button>)}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label={`${M.label} of oil palm per peat polygon, by depth class`}>
        {M.ticks.map((t) => (
          <g key={t}>
            <line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" />
            <text className="th-ax" x={PL - 8} y={y(t) + 4} textAnchor="end">{m === 'zero' ? t + '%' : t}</text>
          </g>
        ))}
        {D.map((d, i) => {
          const v = d[M.key];
          const bw = pw * 0.56, x0 = PL + pw * i + (pw - bw) / 2;
          const on = hov === null || hov === i;
          return (
            <g key={i} tabIndex={0} role="button" aria-label={`${d.depth_class}: ${M.label} ${M.f(v)}, ${d.polygons} polygons`} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
              <rect x={PL + pw * i} y={PT} width={pw} height={H - PT - PB} fill={hov === i ? 'rgba(255,255,255,.04)' : 'transparent'} />
              <rect x={x0} y={y(v)} width={bw} height={y(0) - y(v)} fill={M.color} fillOpacity={on ? 0.85 : 0.3} />
              {v === 0 && <line x1={x0} x2={x0 + bw} y1={y(0) - 1} y2={y(0) - 1} stroke={M.color} strokeWidth="3" />}
              <text x={PL + pw * (i + 0.5)} y={y(v) - 8} textAnchor="middle" className="th-val">{M.f(v)}</text>
              <text x={PL + pw * (i + 0.5)} y={H - PB + 18} textAnchor="middle" className="th-ax">{SHORT[i]}</text>
              <text x={PL + pw * (i + 0.5)} y={H - PB + 34} textAnchor="middle" className="th-ax" style={{ fill: 'var(--text-dim)' }}>n = {d.polygons}</text>
            </g>
          );
        })}
        <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.25)" />
      </svg>
      <p className="th-readout" aria-live="polite">
        {r
          ? <><b>{r.depth_class}</b> ({r.polygons} polygons): median {r.median_oil_palm_fraction.toFixed(2)}, mean {r.mean_oil_palm_fraction.toFixed(2)}, {r.pct_polygons_zero.toFixed(1)}% of polygons have no oil palm.</>
          : 'Hover a depth class. Switch the measure above: the median and mean fraction, or the share of polygons with no oil palm at all. n is the number of peat polygons in the class.'}
      </p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
