import { useState } from 'react';
import { EMERGING, PERIODS, KEC } from './data.js';

const INFO = {
  HH: ['High–high', 'a hot kecamatan among hot neighbours', '#e8533a'],
  LH: ['Low–high', 'a cool kecamatan beside a hot neighbour', '#f0bc2e'],
  HL: ['High–low', 'a hot kecamatan among cool neighbours', '#e8533a'],
  LL: ['Low–low', 'a cool kecamatan among cool neighbours', '#4f9be8'],
  NS: ['Not significant', 'no spatial pattern beyond chance', 'rgba(255,255,255,.07)'],
};

export default function EmergingGrid() {
  const [tip, setTip] = useState(null);
  return (
    <figure className="pp-fig">
      <div className="th-emerg" role="table" aria-label="Local Moran's I class of each kecamatan in five two-year periods">
        <div role="row" className="th-emerg-head"><span /> {PERIODS.map((p) => <span key={p} role="columnheader">{p}</span>)}</div>
        {KEC.map((k) => (
          <div role="row" key={k}>
            <span role="rowheader" className="th-emerg-name">{k}</span>
            {EMERGING[k].map((c, i) => (
              <span key={i} role="cell" tabIndex={0} className={'th-cell ' + (c === 'NS' ? 'ns' : 'hit')} style={{ background: INFO[c][2] }}
                onMouseEnter={() => setTip(`${k}, ${PERIODS[i]}: ${INFO[c][0]}, ${INFO[c][1]}`)} onFocus={() => setTip(`${k}, ${PERIODS[i]}: ${INFO[c][0]}, ${INFO[c][1]}`)} onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}>
                {c === 'NS' ? '' : c}
              </span>
            ))}
          </div>
        ))}
      </div>
      <p className="th-readout" aria-live="polite">{tip || 'Hover or focus a cell. Of 55 kecamatan-periods, only 6 carry a significant spatial cluster label.'}</p>
      <figcaption>Local Moran's I (permutation test) on mean monthly hotspots in each two-year block. The cluster labels are sparse and jump around from period to period, so no kecamatan qualifies as a persistent, intensifying or diminishing hotspot.</figcaption>
    </figure>
  );
}
