import { useMemo, useState } from 'react';
import { D, sig, sgn, fmt } from './shared.js';

const MODES = {
  total: { label: 'Hotspots', note: 'Hotspots 2015–2024 (DBSCAN-filtered)', hi: [232, 83, 58] },
  oni: { label: 'ρ with ONI', note: 'Spearman ρ, ONI vs monthly hotspots', hi: [28, 200, 170] },
  spi: { label: 'ρ with SPI-3', note: 'Spearman ρ, SPI-3 vs monthly hotspots (strength, |ρ|)', hi: [28, 200, 170] },
};
const LO = [38, 44, 48];
const mix = (t, hi) => 'rgb(' + LO.map((c, i) => Math.round(c + (hi[i] - c) * t)).join(',') + ')';
const NUDGE = { Bantan: [0, -30], Bengkalis: [-6, 26] };
const YEARS = ['All', ...Array.from({ length: 10 }, (_, i) => String(2015 + i))];

export default function KecMap() {
  const names = Object.keys(D.kec);
  const [mode, setMode] = useState('total');
  const [pts, setPts] = useState(true);
  const [year, setYear] = useState('All');
  const [sel, setSel] = useState('Rupat');
  const [hov, setHov] = useState(null);

  const val = (k) => (mode === 'total' ? D.kec[k].total : mode === 'oni' ? D.kec[k].rhoOni : Math.abs(D.kec[k].rhoSpi));
  const vmax = useMemo(() => Math.max(...names.map(val)), [mode]);
  const vmin = mode === 'total' ? 0 : Math.min(...names.map(val)) * 0.6;
  const shade = (k) => mix(Math.pow((val(k) - vmin) / (vmax - vmin), mode === 'total' ? 0.6 : 1), MODES[mode].hi);
  const shown = useMemo(() => D.points.filter((p) => year === 'All' || p[2] === +year), [year]);
  const k = D.kec[sel], active = hov || sel;
  const nsFlag = (kk) => mode === 'oni' ? D.kec[kk].pOniAdj >= 0.05 : mode === 'spi' ? D.kec[kk].pSpiAdj >= 0.05 : false;

  return (
    <figure className="pp-fig pp-wide pp-map">
      <div className="pp-controls">
        <div className="pp-seg" role="group" aria-label="Map variable">
          {Object.entries(MODES).map(([m, v]) => <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>{v.label}</button>)}
        </div>
        <label className="pp-check"><input type="checkbox" checked={pts} onChange={(e) => setPts(e.target.checked)} /> Show hotspot points</label>
        <div className="pp-chips" role="group" aria-label="Year">
          {YEARS.map((y) => <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)}>{y}</button>)}
        </div>
      </div>
      <div className="pp-map-grid">
        <svg viewBox={`-60 -10 ${D.w + 120} ${D.h + 20}`} role="img" aria-label="Map of the 11 kecamatan of Bengkalis Regency coloured by the selected variable, with hotspot points.">
          {names.map((n) => (
            <path key={n} d={D.kec[n].d} fill={shade(n)} stroke={active === n ? '#f2ede4' : 'rgba(255,255,255,.28)'} strokeWidth={active === n ? 2.2 : 0.8}
              strokeDasharray={nsFlag(n) ? '5 4' : undefined} className="pp-kec" tabIndex={0}
              onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(n)} onBlur={() => setHov(null)}
              onClick={() => setSel(n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(n)} aria-label={n} />
          ))}
          {pts && <g pointerEvents="none">{shown.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.7" fill={p[3] ? '#f0bc2e' : '#f6dc8a'} fillOpacity={p[3] ? 0.75 : 0.45} />)}</g>}
          <g pointerEvents="none" className="pp-labels">
            {names.map((n) => { const o = NUDGE[n] || [0, 0]; return <text key={n} className={n === active ? 'on' : ''} x={D.kec[n].cx + o[0]} y={D.kec[n].cy + o[1]} textAnchor="middle">{n}</text>; })}
          </g>
        </svg>
        <aside className="pp-panel" aria-live="polite">
          <h4>{sel}</h4>
          <dl>
            <div><dt>Hotspots</dt><dd>{fmt(k.total)}<small> · {Math.round((k.inPeat / k.total) * 100)}% on mapped peat</small></dd></div>
            <div><dt>ρ with ONI</dt><dd>{sgn(k.rhoOni, 3)}<small> · {sig(k.pOniAdj)}</small></dd></div>
            <div><dt>ρ with SPI-3</dt><dd>{sgn(k.rhoSpi, 3)}<small> · {sig(k.pSpiAdj)} <em>(manuscript)</em></small></dd></div>
          </dl>
          <Spark series={k.monthly} />
          <p className="pp-mini">Monthly hotspots, 2015–2024. Click a kecamatan to inspect it. Dashed outline: not significant after FDR correction for the variable shown.</p>
        </aside>
      </div>
      <div className="pp-scale" aria-hidden="true">
        <span>{mode === 'total' ? '0' : vmin.toFixed(2)}</span><i style={{ background: `linear-gradient(90deg, ${mix(0, MODES[mode].hi)}, ${mix(1, MODES[mode].hi)})` }} /><span>{mode === 'total' ? fmt(vmax) : vmax.toFixed(2)}</span>
        <em>{MODES[mode].note}</em>
      </div>
      <figcaption>{fmt(shown.length)} filtered MODIS points{year === 'All' ? ' (2015–2024)' : ' in ' + year}. Bright points are high-confidence anchors; pale points are medium-confidence detections rescued by DBSCAN.</figcaption>
    </figure>
  );
}

function Spark({ series }) {
  const w = 260, h = 54, mx = Math.max(...series, 1);
  const pts = series.map((v, i) => `${(i / 119) * w},${h - (v / mx) * (h - 4) - 2}`).join(' ');
  return (
    <svg className="pp-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Monthly hotspot series">
      <polyline points={pts} fill="none" stroke="#e8533a" strokeWidth="1.4" />
    </svg>
  );
}
