import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Forest plot of the logistic regression behind the canal result (hotspot vs random burnable-peat point).
const NAMES = {
  log_d: 'Distance to canal, per 10× farther',
  'C(depth)[T.2]': 'Depth 100–<200 cm (vs 50–<100)',
  'C(depth)[T.3]': 'Depth 200–<300 cm',
  'C(depth)[T.4]': 'Depth 300–<500 cm',
  'C(depth)[T.5]': 'Depth 500–<700 cm',
  'C(depth)[T.6]': 'Depth >700 cm',
};
const ORDER = ['log_d', 'C(depth)[T.2]', 'C(depth)[T.3]', 'C(depth)[T.4]', 'C(depth)[T.5]', 'C(depth)[T.6]'];
const rows = ORDER.map((k) => ({ k, ...REPORT.canal_logit.find((r) => r.term === k) }));
const W = 760, PL = 250, PR = 30, PT = 30, ROW = 38;
const H = PT + rows.length * ROW + 34;
const lo = 0.1, hi = 5;
const x = (v) => PL + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - PL - PR);

export default function OddsForest({ caption }) {
  const [hov, setHov] = useState(null);
  const d = hov != null ? rows[hov] : null;
  return (
    <figure className="pp-fig">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Odds ratios of the canal-distance logistic regression with 95% confidence intervals">
        {[0.1, 0.25, 0.5, 1, 2, 4].map((t) => (
          <g key={t}><line x1={x(t)} x2={x(t)} y1={PT - 6} y2={H - 28} stroke={t === 1 ? 'rgb(var(--ink-rgb) / .4)' : 'rgb(var(--ink-rgb) / .08)'} /><text className="th-ax" x={x(t)} y={H - 12} textAnchor="middle">{t}</text></g>
        ))}
        <text className="th-ax" x={x(1)} y={14} textAnchor="middle" fill="var(--text-muted)">odds ratio (log scale); 1 = no effect</text>
        {rows.map((r, i) => {
          const cy = PT + i * ROW + ROW / 2;
          const c = r.odds_ratio < 1 ? 'var(--c-teal)' : 'var(--c-gold)';
          return (
            <g key={r.k} tabIndex={0} role="button" aria-label={NAMES[r.k]} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
              <rect x={0} y={cy - ROW / 2} width={W} height={ROW} fill={hov === i ? 'rgb(var(--ink-rgb) / .04)' : 'transparent'} />
              <text className="th-lab-s" x={PL - 14} y={cy + 4} textAnchor="end">{NAMES[r.k]}</text>
              <line x1={x(r.ci95_low)} x2={x(r.ci95_high)} y1={cy} y2={cy} stroke={c} strokeWidth="2.5" />
              <line x1={x(r.ci95_low)} x2={x(r.ci95_low)} y1={cy - 5} y2={cy + 5} stroke={c} strokeWidth="2" />
              <line x1={x(r.ci95_high)} x2={x(r.ci95_high)} y1={cy - 5} y2={cy + 5} stroke={c} strokeWidth="2" />
              <rect x={x(r.odds_ratio) - 5} y={cy - 5} width="10" height="10" fill={c} />
            </g>
          );
        })}
      </svg>
      <p className="th-readout" aria-live="polite">
        {d ? <><b>{NAMES[d.k]}</b>: OR {d.odds_ratio.toFixed(2)} (95% CI {d.ci95_low.toFixed(2)}–{d.ci95_high.toFixed(2)}), p {d.p_value < 0.001 ? '< 0.001' : '= ' + d.p_value.toFixed(3)}.</>
          : 'Hover a row. Teal = lower odds of a hotspot, gold = higher. The model compares each hotspot with random burnable-peat points.'}
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
