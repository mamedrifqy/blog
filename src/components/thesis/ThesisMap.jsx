import { useState } from 'react';
import { D, KEC } from './data.js';

const NUDGE = { Bantan: [0, -30], Bengkalis: [-6, 26] };

// Generic choropleth of the 11 Bengkalis kecamatan, reusing the pre-projected paths of the paper post.
export default function ThesisMap({ fills, dashed = [], selected, onSelect, controls, panel, legend, caption, label }) {
  const [hov, setHov] = useState(null);
  const active = hov || selected;
  return (
    <figure className="pp-fig pp-wide pp-map">
      {controls}
      <div className="pp-map-grid">
        <svg viewBox={`-60 -10 ${D.w + 120} ${D.h + 20}`} role="img" aria-label={label}>
          {KEC.map((n) => (
            <path key={n} d={D.kec[n].d} fill={fills[n]} stroke={active === n ? 'var(--text-bright)' : 'rgb(var(--ink-rgb) / .28)'} strokeWidth={active === n ? 2.2 : 0.8}
              strokeDasharray={dashed.includes(n) ? '5 4' : undefined} className="pp-kec" tabIndex={0} aria-label={n}
              onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(n)} onBlur={() => setHov(null)}
              onClick={() => onSelect(n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(n)} />
          ))}
          <g pointerEvents="none" className="pp-labels">
            {KEC.map((n) => { const o = NUDGE[n] || [0, 0]; return <text key={n} className={n === active ? 'on' : ''} x={D.kec[n].cx + o[0]} y={D.kec[n].cy + o[1]} textAnchor="middle">{n}</text>; })}
          </g>
        </svg>
        <aside className="pp-panel" aria-live="polite">{panel}</aside>
      </div>
      {legend}
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function Scale({ lo, hi, from, to, note }) {
  return (
    <div className="pp-scale" aria-hidden="true">
      <span>{lo}</span><i style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} /><span>{hi}</span><em>{note}</em>
    </div>
  );
}
