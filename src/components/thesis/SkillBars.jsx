import { useState } from 'react';

// Thesis Table 4.29: skill of the nested ONI-plus-drought rule by sub-district
// (nested leave-one-year-out, 31 alarms in each). Regency-level PSS of the
// seasonal-calendar reference is 0.163 (Table 4.27).
const ROWS = [
  { name: 'Rupat Utara', pod: 0.562, far: 0.710, pss: 0.349 },
  { name: 'Pinggir', pod: 0.484, far: 0.516, pss: 0.302 },
  { name: 'Bengkalis', pod: 0.500, far: 0.677, pss: 0.288 },
  { name: 'Bandar Laksamana', pod: 0.377, far: 0.161, pss: 0.277 },
  { name: 'Siak Kecil', pod: 0.462, far: 0.613, pss: 0.257 },
  { name: 'Bantan', pod: 0.455, far: 0.677, pss: 0.238 },
  { name: 'Mandau', pod: 0.429, far: 0.903, pss: 0.179 },
  { name: 'Talang Muandau', pod: 0.382, far: 0.581, pss: 0.171 },
  { name: 'Bathin Solapan', pod: 0.391, far: 0.710, pss: 0.162 },
  { name: 'Rupat', pod: 0.354, far: 0.452, pss: 0.157 },
  { name: 'Bukit Batu', pod: 0.368, far: 0.774, pss: 0.128 },
];
const REF = 0.163, MAX = 0.4;

export default function SkillBars() {
  const [h, setH] = useState(null);
  const sel = h === null ? null : ROWS[h];
  return (
    <figure className="pp-fig">
      <div className="pp-legend">
        <span><i style={{ background: 'var(--c-teal)' }} />Peirce Skill Score, ONI + drought rule</span>
        <span><i className="pp-line" style={{ background: 'var(--c-gold)' }} />Regency-wide PSS of the every-fire-month alarm (0.163)</span>
      </div>
      {ROWS.map((r, i) => (
        <div key={r.name} className="th-skill-row" tabIndex={0}
          onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} onFocus={() => setH(i)} onBlur={() => setH(null)}>
          <span className="th-pair-label">{r.name}</span>
          <div className="th-skill-track">
            <div style={{ width: (r.pss / MAX) * 100 + '%', background: 'var(--c-teal)' }} />
            <span className="th-skill-ref" style={{ left: (REF / MAX) * 100 + '%' }} aria-hidden="true" />
          </div>
          <b className="th-pair-ratio">{r.pss.toFixed(2)}</b>
        </div>
      ))}
      <p className="th-readout" aria-live="polite">{sel ? `${sel.name}: POD ${sel.pod.toFixed(2)}, FAR ${sel.far.toFixed(2)}, PSS ${sel.pss.toFixed(2)}.` : 'Hover or focus a row for POD and FAR.'}</p>
      <figcaption>Skill of the nested ONI-plus-drought rule by sub-district, with 31 alarms issued in each. The gold line is a regency-wide reference, not a per-district one, so read it as a rough guide.</figcaption>
    </figure>
  );
}
