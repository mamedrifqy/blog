import { SHAP_SHARE } from './data.js';

const ORDER = ['Climate', 'Seasonal', 'Biophysical-static', 'Anthropogenic'];
const COL = { Climate: '#1cc8aa', Seasonal: '#4f9be8', 'Biophysical-static': '#a78b5a', Anthropogenic: '#e8533a' };

export default function ShapShare() {
  return (
    <figure className="pp-fig">
      <div className="pp-legend">{ORDER.map((g) => <span key={g}><i style={{ background: COL[g] }} />{g}</span>)}</div>
      <div className="th-stack">
        {Object.entries(SHAP_SHARE).map(([name, sh]) => (
          <div className="th-stack-row" key={name}>
            <b>{name}</b>
            <div className="th-stack-bar" role="img" aria-label={`${name}: ` + ORDER.map((g) => `${g} ${sh[g]}%`).join(', ')}>
              {ORDER.map((g) => <div key={g} style={{ width: sh[g] + '%', background: COL[g] }} title={`${g} ${sh[g]}%`}><span>{sh[g].toFixed(1)}</span></div>)}
            </div>
          </div>
        ))}
      </div>
      <figcaption>Share of mean |SHAP| by feature group, computed on held-out predictions (the kecamatan was not in the training set). "Climate" here includes air temperature, which an earlier keyword-based grouping had wrongly counted as non-climate.</figcaption>
    </figure>
  );
}
