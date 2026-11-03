import { useState } from 'react';
import REPORT from '../../data/thesis-report.json';

// The 2x2 behind the Peirce Skill Score.
// Source numbers: REPORT.skill (early_warning_skill.csv) gives POD, FAR, POFD, CSI, PSS, alarms and hits per rule, and the
// post gives the evaluation set as 1,309 sub-district-months. The other cells follow from those, not from a separate table:
//   fire months     P  = hits / POD
//   misses          FN = P - hits
//   false alarms    FP = alarms - hits
//   correct negs    TN = 1,309 - P - FP
// Recomputing POD, FAR, POFD, CSI and PSS from these four counts reproduces every value in the CSV to three decimals.
const N = 1309;
const NAMES = ['ONI + drought rule (nested)', 'Alarm every fire month'];
const RULES = REPORT.skill.map((r) => {
  const TP = r.hits, P = Math.round(r.hits / r.POD);
  return { TP, FN: P - TP, FP: r.n_alarm - TP, TN: N - P - (r.n_alarm - TP) };
});

const CELLS = [
  { k: 'TP', name: 'Hit', sub: 'alarm, fire', color: '#1cc8aa', row: 0, col: 0 },
  { k: 'FP', name: 'False alarm', sub: 'alarm, no fire', color: '#e8533a', row: 0, col: 1 },
  { k: 'FN', name: 'Miss', sub: 'no alarm, fire', color: '#f0bc2e', row: 1, col: 0 },
  { k: 'TN', name: 'Correct negative', sub: 'no alarm, no fire', color: '#8d897f', row: 1, col: 1 },
];
// Which cells go into each score's top (num) and bottom (den). PSS is a difference of two rates, so it uses all four.
const MEASURES = [
  { k: 'POD', num: ['TP'], den: ['TP', 'FN'] },
  { k: 'FAR', num: ['FP'], den: ['TP', 'FP'] },
  { k: 'POFD', num: ['FP'], den: ['FP', 'TN'] },
  { k: 'CSI', num: ['TP'], den: ['TP', 'FN', 'FP'] },
  { k: 'PSS', num: ['TP', 'FP'], den: ['TP', 'FN', 'FP', 'TN'] },
];
const score = (k, c) => {
  const pod = c.TP / (c.TP + c.FN), pofd = c.FP / (c.FP + c.TN);
  return { POD: pod, FAR: c.FP / (c.TP + c.FP), POFD: pofd, CSI: c.TP / (c.TP + c.FN + c.FP), PSS: pod - pofd }[k];
};
const f3 = (v) => v.toFixed(3);
const n0 = (v) => v.toLocaleString('en-US');

export default function PssMatrix({ caption }) {
  const [rule, setRule] = useState(0);
  const [m, setM] = useState(null); // hovered / focused score
  const [cell, setCell] = useState(null); // hovered / focused cell
  const onCell = (k) => { if (k) setM(null); setCell(k); }; // a cell under the pointer takes over from a score
  const c = RULES[rule];
  const M = MEASURES.find((x) => x.k === m);
  const usedBy = cell ? MEASURES.filter((x) => x.den.includes(cell)).map((x) => x.k) : [];
  const state = (k) => (M ? (M.num.includes(k) && M.k !== 'PSS' ? 'num' : M.den.includes(k) ? 'den' : 'off') : cell ? (cell === k ? 'num' : 'off') : 'idle');

  let read;
  if (M) {
    const s = score(M.k, c);
    if (M.k === 'POD') read = <><b>POD</b> = hits ÷ all fire months = {n0(c.TP)} ÷ ({n0(c.TP)} + {n0(c.FN)}) = <b>{f3(s)}</b>. The share of fire months that had an alarm.</>;
    if (M.k === 'FAR') read = <><b>FAR</b> = false alarms ÷ all alarms = {n0(c.FP)} ÷ ({n0(c.TP)} + {n0(c.FP)}) = <b>{f3(s)}</b>. The share of alarms raised in a month without fire.</>;
    if (M.k === 'POFD') read = <><b>POFD</b> = false alarms ÷ all months without fire = {n0(c.FP)} ÷ ({n0(c.FP)} + {n0(c.TN)}) = <b>{f3(s)}</b>. The share of fire-free months that still got an alarm.</>;
    if (M.k === 'CSI') read = <><b>CSI</b> = hits ÷ (hits + misses + false alarms) = {n0(c.TP)} ÷ {n0(c.TP + c.FN + c.FP)} = <b>{f3(s)}</b>. Correct negatives do not enter, which is why the two rules look alike on this score.</>;
    if (M.k === 'PSS') read = <><b>PSS</b> = POD − POFD = {f3(score('POD', c))} − {f3(score('POFD', c))} = <b>{f3(s)}</b>. All four cells count: it rewards catching fire months and charges for alarms in fire-free months. 0 is no skill, 1 is perfect.</>;
  } else if (cell) {
    const cd = CELLS.find((x) => x.k === cell);
    read = <><b>{cd.name}</b> ({cd.sub}): {n0(c[cell])} of {n0(N)} sub-district-months. Used in {usedBy.join(', ')}.</>;
  } else {
    read = 'Hover or focus a score to see which cells it divides, or a cell to see which scores use it. Counts other than hits and alarms are derived from the published scores.';
  }

  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-controls">
        <div className="pp-chips" role="group" aria-label="Rule">
          {NAMES.map((n, i) => <button key={n} type="button" aria-pressed={rule === i} onClick={() => setRule(i)}>{n}</button>)}
        </div>
      </div>
      <div className="th-pss">
        <div className="th-pss-grid" role="table" aria-label="Alarms against fire months">
          <span />
          <span className="th-pss-h">Fire month</span>
          <span className="th-pss-h">No fire</span>
          <span className="th-pss-h th-pss-r">Alarm raised</span>
          <Cell d={CELLS[0]} v={c.TP} st={state('TP')} on={onCell} />
          <Cell d={CELLS[1]} v={c.FP} st={state('FP')} on={onCell} />
          <span className="th-pss-h th-pss-r">No alarm</span>
          <Cell d={CELLS[2]} v={c.FN} st={state('FN')} on={onCell} />
          <Cell d={CELLS[3]} v={c.TN} st={state('TN')} on={onCell} />
        </div>
        <div className="th-pss-tiles" role="group" aria-label="Scores">
          {MEASURES.map((x) => (
            <button key={x.k} type="button" className={'th-pss-tile' + (m === x.k ? ' on' : '') + (x.k === 'PSS' ? ' head' : '')}
              onMouseEnter={() => { setCell(null); setM(x.k); }} onMouseLeave={() => setM(null)} onFocus={() => { setCell(null); setM(x.k); }} onBlur={() => setM(null)}>
              <small>{x.k}</small>
              <b>{f3(score(x.k, c))}</b>
            </button>
          ))}
        </div>
      </div>
      <p className="th-readout" aria-live="polite">{read}</p>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function Cell({ d, v, st, on }) {
  return (
    <div className={'th-pss-cell ' + st} tabIndex={0} role="cell" aria-label={`${d.name}: ${v}`}
      style={{ '--c': d.color }}
      onMouseEnter={() => on(d.k)} onMouseLeave={() => on(null)} onFocus={() => on(d.k)} onBlur={() => on(null)}>
      <b>{v.toLocaleString('en-US')}</b>
      <span>{d.name}</span>
      <small>{d.sub}</small>
    </div>
  );
}
