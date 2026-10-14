import { useState } from 'react';
import ThesisMap, { Scale } from './ThesisMap.jsx';
import { LOKO, KECSTAT, KEC } from './data.js';
import { mix, TEAL, CORAL, f3, f2 } from './util.js';

const M = {
  auc: { label: 'Held-out AUC', lo: .72, hi: .9, hiC: TEAL, note: 'AUC when the kecamatan is the unseen fold' },
  f1: { label: 'Held-out F1', lo: .2, hi: .62, hiC: TEAL, note: 'F1 at the default 0.5 threshold' },
  hs: { label: 'Hotspots', lo: 0, hi: 976, hiC: CORAL, note: 'Filtered hotspots, 2015–2024 (context)' },
};

export default function LokoMap() {
  const [m, setM] = useState('auc');
  const [sel, setSel] = useState('Mandau');
  const val = (k) => (m === 'auc' ? LOKO[k][0] : m === 'f1' ? LOKO[k][1] : KECSTAT[k].hs);
  const fills = Object.fromEntries(KEC.map((k) => [k, mix((val(k) - M[m].lo) / (M[m].hi - M[m].lo), M[m].hiC)]));
  const ranked = [...KEC].sort((a, b) => LOKO[b][0] - LOKO[a][0]);
  return (
    <ThesisMap
      label="Map of kecamatan coloured by how well a model trained on the other ten predicts fire months there"
      fills={fills} selected={sel} onSelect={setSel}
      controls={<div className="pp-controls"><div className="pp-seg" role="group" aria-label="Map variable">{Object.entries(M).map(([k, v]) => <button key={k} type="button" aria-pressed={m === k} onClick={() => setM(k)}>{v.label}</button>)}</div></div>}
      panel={<>
        <h4>{sel}</h4>
        <dl>
          <div><dt>AUC when held out</dt><dd>{f3(LOKO[sel][0])}<small> · rank {ranked.indexOf(sel) + 1} of 11</small></dd></div>
          <div><dt>F1 when held out</dt><dd>{f2(LOKO[sel][1])}</dd></div>
          <div><dt>Hotspots 2015–2024</dt><dd>{KECSTAT[sel].hs}</dd></div>
          <div><dt>Mean modelled fire probability</dt><dd>{f2(KECSTAT[sel].prob)}</dd></div>
        </dl>
        <p className="pp-mini">Trained on the other ten kecamatan, tested on {sel}. Click a kecamatan.</p>
      </>}
      legend={<Scale lo={M[m].lo} hi={M[m].hi} from={mix(0, M[m].hiC)} to={mix(1, M[m].hiC)} note={M[m].note} />}
      caption="Mandau, the kecamatan with the fewest hotspots (23), has the highest held-out AUC (0.892) but a low F1 (0.316): the model ranks its fire months well but, with so few of them, mislabels many at a fixed threshold."
    />
  );
}
