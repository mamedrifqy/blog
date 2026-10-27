import { useState } from 'react';

/**
 * Two bars per row (share of hotspots vs share of area) plus the ratio.
 * rows: [{ label, sub?, a, b, ratio, note? }]  a, b in percent.
 */
export default function PairedBars({ rows, aLabel = 'Share of hotspots', bLabel = 'Share of peat area', caption, scale }) {
  const [h, setH] = useState(null);
  const mx = scale ?? Math.max(...rows.flatMap((r) => [r.a, r.b]));
  const sel = h === null ? null : rows[h];
  return (
    <figure className="pp-fig">
      <div className="th-pair-head">
        <span />
        <span className="th-pair-key">
          <span><i style={{ background: '#e8533a' }} />{aLabel}</span>
          <span><i style={{ background: 'var(--text-dim)' }} />{bLabel}</span>
        </span>
        <span style={{ textAlign: 'right' }}>Ratio</span>
      </div>
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={'th-pair-row' + (h !== null && h !== i ? ' dim' : '')}
          tabIndex={0}
          onMouseEnter={() => setH(i)}
          onMouseLeave={() => setH(null)}
          onFocus={() => setH(i)}
          onBlur={() => setH(null)}
        >
          <div className="th-pair-label">{r.label}{r.sub && <small>{r.sub}</small>}</div>
          <div className="th-pair-bars">
            <div className="th-bar"><div style={{ width: (r.a / mx) * 100 + '%', background: '#e8533a' }} /><span>{r.a.toFixed(1)}%</span></div>
            <div className="th-bar base"><div style={{ width: (r.b / mx) * 100 + '%' }} /><span>{r.b.toFixed(1)}%</span></div>
          </div>
          <div className={'th-pair-ratio' + (r.ratio >= 1.2 ? ' hi' : r.ratio <= 0.8 ? ' lo' : '')}>{r.ratio.toFixed(2)}</div>
        </div>
      ))}
      <p className="th-readout" aria-live="polite">{sel ? sel.note ?? `${sel.label}: ${sel.a.toFixed(1)}% of hotspots on ${sel.b.toFixed(1)}% of the area, ratio ${sel.ratio.toFixed(2)}.` : 'Hover or focus a row.'}</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
