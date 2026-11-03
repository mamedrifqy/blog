import { useEffect, useMemo, useRef, useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Cumulative distance to the nearest canal.
// Red: empirical CDF of the 3,100 filtered on-peat hotspots, computed from public/thesis-data/hotspots.json.
// Grey: the 30,001 random burnable-peat points. Their per-point distances are not in the repository, so only the five
// binned cumulative shares from hotspots_by_canal_distance.csv (REPORT.canal_bins) are drawn, as markers, not as a curve.
const BASE = '/blog';
const RED = '#e8533a', GREY = '#b8b2a6';
const W = 760, H = 360, PL = 56, PR = 24, PT = 20, PB = 50;
const XMIN = 10, XMAX = 5000;
const lx = (d) => Math.log10(Math.max(d, XMIN));
const x = (d) => PL + ((lx(d) - Math.log10(XMIN)) / (Math.log10(XMAX) - Math.log10(XMIN))) * (W - PL - PR);
const y = (p) => PT + (H - PT - PB) * (1 - p);
const EDGES = [500, 1000, 2000, 4000];

// Cumulative reference points from the binned CSV (percent -> fraction).
const bins = REPORT.canal_bins;
let ch = 0, cn = 0;
const REF = bins.slice(0, 4).map((b, i) => {
  ch += b.hotspot_share_pct; cn += b.peat_area_share_pct;
  return { d: EDGES[i], hot: ch / 100, nul: cn / 100, label: b.distance_to_canal };
});

export default function CanalCdf({ caption }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [depth, setDepth] = useState(0); // 0 = all
  const [cur, setCur] = useState(null);
  const [ref, setRef] = useState(null);
  const svg = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/thesis-data/hotspots.json`).then((r) => r.json()).then(setData).catch(() => setErr(true));
  }, []);

  const rows = useMemo(() => (data ? data.rows.filter((r) => r[5] > 0 && r[6] != null) : []), [data]);
  const sorted = useMemo(() => {
    const sel = depth ? rows.filter((r) => r[5] === depth) : rows;
    return sel.map((r) => r[6]).sort((a, b) => a - b);
  }, [rows, depth]);

  const path = useMemo(() => {
    const n = sorted.length;
    if (!n) return '';
    const pts = [];
    for (let i = 0; i < n; i++) {
      if (i === n - 1 || sorted[i + 1] !== sorted[i]) pts.push([sorted[i], (i + 1) / n]);
    }
    let s = `M${x(XMIN)},${y(0)}`;
    let prev = 0;
    for (const [d, p] of pts) {
      s += `L${x(d)},${y(prev)}L${x(d)},${y(p)}`;
      prev = p;
    }
    return s + `L${x(XMAX)},${y(1)}`;
  }, [sorted]);

  const at = (d) => {
    // fraction of hotspots with distance <= d (binary search)
    let lo = 0, hi = sorted.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= d) lo = mid + 1; else hi = mid; }
    return sorted.length ? lo / sorted.length : 0;
  };

  const move = (e) => {
    const el = svg.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const t = (px - PL) / (W - PL - PR);
    if (t < 0 || t > 1) { setCur(null); return; }
    const d = Math.pow(10, Math.log10(XMIN) + t * (Math.log10(XMAX) - Math.log10(XMIN)));
    setCur(d);
  };

  const labels = data ? data.depth_labels : {};
  const chips = [[0, 'All depths'], ...Object.entries(labels).map(([k, v]) => [Number(k), v])];
  // percent with one decimal, rounding half up so 69.85 reads 69.9 as in the source table
  const p1 = (v) => (Math.round(v * 1000 + 1e-6) / 10).toFixed(1);
  const fmtD = (d) => (d >= 1000 ? (d / 1000).toFixed(2) + ' km' : Math.round(d) + ' m');

  let read;
  if (ref !== null) {
    const r = REF[ref];
    read = <>Within <b>{r.label.replace('<', '')}</b> of a canal: <b>{p1(r.hot)}%</b> of hotspots against <b>{p1(r.nul)}%</b> of random peat points (binned shares from the thesis table).</>;
  } else if (cur !== null && sorted.length) {
    read = <>Within <b>{fmtD(cur)}</b> of a canal: <b>{(at(cur) * 100).toFixed(1)}%</b> of {depth ? labels[depth] : 'all'} hotspots ({sorted.length.toLocaleString('en-US')} on peat).</>;
  } else {
    read = err ? 'The hotspot file could not be loaded.' : !data ? 'Loading hotspot distances…' : `Move across the chart to read the share of hotspots within a distance.${depth ? ' The random-point reference is only published for all depths together.' : ' Click a grey or red marker for the binned shares.'}`;
  }

  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="Peat depth class">
          {chips.map(([k, l]) => <button key={k} type="button" aria-pressed={depth === k} onClick={() => { setDepth(k); setRef(null); }}>{l}</button>)}
        </div>
      </div>
      <div className="pp-legend">
        <span><i style={{ background: RED }} />Hotspots (cumulative share)</span>
        {depth === 0 && <span><i style={{ background: GREY }} />Random peat points (binned)</span>}
      </div>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Cumulative share of hotspots by distance to the nearest canal, with binned reference shares for random peat points" onMouseMove={move} onMouseLeave={() => setCur(null)} style={{ cursor: 'crosshair' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}><line x1={PL} x2={W - PR} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,.08)" /><text className="th-ax" x={PL - 8} y={y(t) + 4} textAnchor="end">{t * 100}%</text></g>
        ))}
        {[10, 30, 100, 300, 1000, 3000].map((t) => (
          <g key={t}><line x1={x(t)} x2={x(t)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.08)" /><text className="th-ax" x={x(t)} y={H - PB + 18} textAnchor="middle">{t >= 1000 ? t / 1000 + ' km' : t + ' m'}</text></g>
        ))}
        {depth === 0 && (
          <g>
            <polyline points={[`${x(XMIN)},${y(0)}`, ...REF.map((r) => `${x(r.d)},${y(r.nul)}`), `${x(XMAX)},${y(1)}`].join(' ')} fill="none" stroke={GREY} strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
            {REF.map((r, i) => (
              <g key={r.d} tabIndex={0} role="button" aria-label={`${r.label}: ${(r.hot * 100).toFixed(1)}% of hotspots, ${(r.nul * 100).toFixed(1)}% of random points`} onMouseEnter={() => setRef(i)} onMouseLeave={() => setRef(null)} onFocus={() => setRef(i)} onBlur={() => setRef(null)}>
                <circle cx={x(r.d)} cy={y(r.nul)} r={ref === i ? 7 : 5} fill={GREY} />
                <circle cx={x(r.d)} cy={y(r.hot)} r={ref === i ? 7 : 5} fill={RED} stroke="#0d0e0f" strokeWidth="1.5" />
              </g>
            ))}
          </g>
        )}
        <path d={path} fill="none" stroke={RED} strokeWidth="2.2" />
        {cur !== null && ref === null && sorted.length > 0 && (
          <g pointerEvents="none">
            <line x1={x(cur)} x2={x(cur)} y1={PT} y2={H - PB} stroke="rgba(255,255,255,.4)" />
            <circle cx={x(cur)} cy={y(at(cur))} r="5" fill={RED} stroke="#fff" strokeWidth="1.5" />
          </g>
        )}
        <line x1={PL} x2={W - PR} y1={y(0)} y2={y(0)} stroke="rgba(255,255,255,.25)" />
        <text className="th-ax" x={PL + (W - PL - PR) / 2} y={H - 8} textAnchor="middle">Distance to the nearest canal (log scale; 0–10 m plotted at 10 m)</text>
      </svg>
      <p className="th-readout" aria-live="polite">{read}</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
