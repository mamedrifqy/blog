import { useState } from 'react';
import ThesisMap, { Scale } from './ThesisMap.jsx';
import { MK, LAGS, KEC, KECSTAT } from './data.js';
import { mix, TEAL, CORAL, GOLD, f3, sg } from './util.js';

const M = {
  tau: { label: 'Trend (Kendall τ)', note: 'Seasonal Mann-Kendall τ on monthly hotspots (more negative = steeper decline)', hi: TEAL, f: (k) => -MK[k][0], lo: 0, hiV: 0.28, fmt: (v) => sg(-v, 2) },
  lagOni: { label: 'ONI lead time', note: 'Months by which ONI leads hotspots at the strongest correlation', hi: GOLD, f: (k) => LAGS[k].oni[0], lo: 0, hiV: 6, fmt: (v) => v + ' mo' },
  rOni: { label: 'Peak ρ with ONI', note: 'Spearman ρ at the optimal lag', hi: CORAL, f: (k) => LAGS[k].oni[1], lo: 0.15, hiV: 0.45, fmt: (v) => sg(v, 2) },
  rSpei: { label: 'Peak |ρ| with SPEI-3', note: 'Strength of Spearman ρ at the optimal lag (SPEI-3 is the local drought index)', hi: CORAL, f: (k) => -LAGS[k].spei[1], lo: 0.15, hiV: 0.5, fmt: (v) => v.toFixed(2) },
};

export default function TrendMap() {
  const [m, setM] = useState('tau');
  const [sel, setSel] = useState('Siak Kecil');
  const c = M[m];
  const fills = Object.fromEntries(KEC.map((k) => [k, mix((c.f(k) - c.lo) / (c.hiV - c.lo), c.hi)]));
  const nsTrend = KEC.filter((k) => MK[k][1] >= 0.05);
  const dashed = m === 'tau' ? nsTrend : [];
  const stars = (p) => (p < 0.001 ? '***' : p < 0.01 ? '**' : p < 0.05 ? '*' : 'n.s.');
  return (
    <ThesisMap
      label="Map of kecamatan coloured by hotspot trend, or by lead time and strength of the ENSO and drought relationships"
      fills={fills} dashed={dashed} selected={sel} onSelect={setSel}
      controls={<div className="pp-controls"><div className="pp-seg" role="group" aria-label="Map variable">{Object.entries(M).map(([k, v]) => <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)}>{v.label}</button>)}</div></div>}
      panel={<>
        <h4>{sel}</h4>
        <dl>
          <div><dt>Seasonal Mann-Kendall</dt><dd>τ {sg(MK[sel][0], 3)}<small> · {stars(MK[sel][1])}</small></dd></div>
          <div><dt>ONI → hotspots</dt><dd>ρ {sg(LAGS[sel].oni[1], 2)}<small> · lead {LAGS[sel].oni[0]} mo</small></dd></div>
          <div><dt>SPEI-3 → hotspots</dt><dd>ρ {sg(LAGS[sel].spei[1], 2)}<small> · lag {LAGS[sel].spei[0]} mo</small></dd></div>
          <div><dt>Hotspots 2015–2024</dt><dd>{KECSTAT[sel].hs}</dd></div>
        </dl>
        <p className="pp-mini">Lags were searched from 0 to 6 months. The best lag is the one with the largest |ρ|; neighbouring lags are often close, so treat it as a window, not a point. Dashed outline (trend view): no significant trend.</p>
      </>}
      legend={<Scale lo={c.fmt(c.lo === 0 && m === 'tau' ? 0 : c.lo)} hi={c.fmt(c.hiV)} from={mix(0, c.hi)} to={mix(1, c.hi)} note={c.note} />}
      caption="Ten of eleven kecamatan show a significant decline in monthly hotspots over 2015–2024 (seasonal Mann-Kendall). Mandau shows no trend at all, and it has the fewest hotspots to detect one."
    />
  );
}
