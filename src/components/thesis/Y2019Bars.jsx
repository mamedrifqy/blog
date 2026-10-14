import { useState } from 'react';
import { Y2019 } from './data.js';

export default function Y2019Bars() {
  const [sortBy, setSortBy] = useState('mcd');
  const rows = Object.entries(Y2019).sort((a, b) => (sortBy === 'hs' ? b[1][0] - a[1][0] : sortBy === 'mcd' ? b[1][1] - a[1][1] : b[1][2] - a[1][2]));
  const mx = [Math.max(...rows.map((r) => r[1][0])), Math.max(...rows.map((r) => r[1][1])), Math.max(...rows.map((r) => r[1][2]))];
  const cols = ['#f0bc2e', '#e8533a', '#1cc8aa'];
  const names = ['Hotspots', 'MCD64A1 ha', 'dATBI ha'];
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls"><span className="th-lab">Sort by</span><div className="pp-seg" role="group" aria-label="Sort order">{[['hs', 'Hotspots'], ['mcd', 'MCD64A1'], ['datbi', 'dATBI']].map(([k, v]) => <button key={k} type="button" aria-pressed={sortBy === k} onClick={() => setSortBy(k)}>{v}</button>)}</div></div>
      <div className="th-grid3">
        {rows.map(([k, v]) => (
          <div className="th-grid3-row" key={k}>
            <span className="th-grid3-name">{k}</span>
            {v.map((x, i) => (
              <div className="th-bar" key={i}><div style={{ width: (x / mx[i]) * 100 + '%', background: cols[i] }} /><span>{i === 0 ? x : x.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span></div>
            ))}
          </div>
        ))}
        <div className="th-grid3-row th-grid3-head"><span /> {names.map((n, i) => <span key={n} style={{ color: cols[i] }}>{n}</span>)}</div>
      </div>
      <figcaption>2019, by kecamatan. Each column is scaled to its own maximum. Rupat leads on all three measures. The disagreements are the interesting rows: Bukit Batu has no hotspots but 571 ha of MODIS burned area, and Rupat Utara has 5 hotspots against 1,488 ha. Landsat dATBI finds little in either (9.7 and 37.7 ha), so those MODIS-only areas are unresolved, not confirmed fires.</figcaption>
    </figure>
  );
}
