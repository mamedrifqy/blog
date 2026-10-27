import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// Poisson incidence-rate ratio per +1 °C ONI, by sub-district (Table 4.17 of the thesis), with 95% CIs. Marker area ~ hotspots.
const R = [...REPORT.enso_het].sort((a, b) => b.irr_per_oni_c - a.irr_per_oni_c);
const W = 760, PL = 140, PR = 40, PT = 34, ROW = 34;
const H = PT + R.length * ROW + 34;
const lo = 0.6, hi = 5.5;
const x = (v) => PL + ((Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo))) * (W - PL - PR);
const rad = (n) => 3.5 + Math.sqrt(n) * 0.22;

export default function EnsoHeterogeneity({ caption }) {
  const [hov, setHov] = useState(null);
  const d = hov != null ? R[hov] : null;
  const pfmt = (p) => (p < 0.001 ? '< 0.001' : '= ' + p.toFixed(3));
  return (
    <figure className="pp-fig pp-wide">
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Incidence rate ratio of monthly hotspots per degree of ONI, by sub-district, with 95 percent confidence intervals">
        {[0.75, 1, 1.5, 2, 3, 4, 5].map((t) => (
          <g key={t}><line x1={x(t)} x2={x(t)} y1={PT - 8} y2={H - 28} stroke={t === 1 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.08)'} /><text className="th-ax" x={x(t)} y={H - 12} textAnchor="middle">{t}</text></g>
        ))}
        <text className="th-ax" x={x(1)} y={16} textAnchor="middle" fill="#b8b2a6">IRR per +1 °C ONI (log scale); 1 = no response. Marker size = hotspots.</text>
        {R.map((r, i) => {
          const cy = PT + i * ROW + ROW / 2;
          const sig = r.irr_ci95_low > 1;
          const c = sig ? '#e8533a' : '#8b93a0';
          return (
            <g key={r.kecamatan} tabIndex={0} role="button" aria-label={r.kecamatan} onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(i)} onBlur={() => setHov(null)}>
              <rect x={0} y={cy - ROW / 2} width={W} height={ROW} fill={hov === i ? 'rgba(255,255,255,.04)' : 'transparent'} />
              <text className="th-lab-s" x={PL - 12} y={cy + 4} textAnchor="end">{r.kecamatan}</text>
              <line x1={x(r.irr_ci95_low)} x2={x(r.irr_ci95_high)} y1={cy} y2={cy} stroke={c} strokeWidth="2.5" />
              <circle cx={x(r.irr_per_oni_c)} cy={cy} r={rad(r.hotspots_total)} fill={c} opacity=".9" />
              <text className="th-val" x={x(r.irr_ci95_high) + 10} y={cy + 4}>{r.irr_per_oni_c.toFixed(2)}</text>
            </g>
          );
        })}
      </svg>
      <p className="th-readout" aria-live="polite">
        {d ? <><b>{d.kecamatan}</b>: IRR {d.irr_per_oni_c.toFixed(2)} (95% CI {d.irr_ci95_low.toFixed(2)}–{d.irr_ci95_high.toFixed(2)}), p {pfmt(d.p_irr)}; {d.hotspots_total.toLocaleString('en-US')} hotspots. Fire in {d.fire_months_el_nino} El Niño months against {d.fire_months_other} other months (Fisher OR {d.odds_ratio_fisher}). Benjamini–Hochberg-adjusted p of the IRR {pfmt(d.p_irr_bh)} (from the analysis output; the thesis table does not show it).</>
          : 'Hover a row. Red intervals exclude 1 before multiplicity correction; grey ones do not. Every point estimate is above 1.'}
      </p>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
