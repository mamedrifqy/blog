import { useState } from 'react';
import { SHARE } from './data.js';
import { pct } from './util.js';

const SETS = { dbscan: 'DBSCAN-filtered (study set)', conf50: 'Raw, confidence ≥ 50%', raw: 'All raw detections' };

export default function ExplainedShare() {
  const [set, setSet] = useState('dbscan');
  const [r, setR] = useState(1000);
  const s = SHARE[set];
  return (
    <figure className="pp-fig">
      <div className="pp-controls">
        <div className="pp-seg" role="group" aria-label="Hotspot set">{Object.entries(SETS).map(([k, v]) => <button key={k} type="button" aria-pressed={set === k} onClick={() => setSet(k)}>{v}</button>)}</div>
        <div className="pp-seg" role="group" aria-label="Radius">{[500, 1000, 2000].map((v) => <button key={v} type="button" aria-pressed={r === v} onClick={() => setR(v)}>{v >= 1000 ? v / 1000 + ' km' : v + ' m'}</button>)}</div>
      </div>
      <div className="th-share">
        {[2015, 2019, 2023].map((y) => {
          const sh = s.share[r][y], b = s.base[r][y];
          return (
            <div className="th-share-row" key={y}>
              <b>{y}</b>
              <div className="th-share-bars">
                <div className="th-bar"><div style={{ width: sh * 100 + '%', background: 'var(--teal)' }} /><span>{pct(sh, 1)} of burned area lies within {r >= 1000 ? r / 1000 + ' km' : r + ' m'} of a hotspot</span></div>
                <div className="th-bar base"><div style={{ width: b * 100 + '%' }} /><span>{pct(b, 1)} of the regency is that close to a hotspot</span></div>
              </div>
              <em>{(sh / b).toFixed(1)}×<small>{s.n[y].toLocaleString('en-US')} hotspots</small></em>
            </div>
          );
        })}
      </div>
      <figcaption>Share of Landsat-detected burned area (dATBI, T = 0.20) inside a buffer around hotspots, against the share of the regency that buffer covers. The right-hand number is the enrichment, share ÷ baseline. A ratio of 1 would mean hotspots tell you nothing about where fires burned.</figcaption>
    </figure>
  );
}
