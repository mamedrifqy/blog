import { useState } from 'react';
import { D, PH, PHK, MN, fmt, monthLabel } from '../paper/shared.js';
import { MCD_ANNUAL, MONTHLY, ANNUAL_AREA, Y2019 } from '../thesis/data.js';
import { mix, GOLD } from '../thesis/util.js';
import R from '../../data/fire-dashboard.json';

// Colour roles are fixed across every panel:
//   gold = hotspots on mapped peat · blue = hotspots off peat · coral = MODIS burned area · teal = Landsat dATBI
const C = { peat: '#f0bc2e', off: '#6fa8dc', burn: '#e8533a', landsat: '#1cc8aa' };
const GREY = [96, 104, 112];
const YEARS = R.years;
const NUDGE = { Bantan: [0, -30], Bengkalis: [-6, 26] };
const sum = (a) => a.reduce((s, v) => s + v, 0);
const ORDER = ['All', ...YEARS];

export default function FireDashboard() {
  const [year, setYear] = useState('All');
  const [sel, setSel] = useState('Rupat');
  const [pts, setPts] = useState(true);
  const [hov, setHov] = useState(null);

  const names = Object.keys(D.kec);
  const yi = year === 'All' ? null : year - 2015;
  const slice = (a) => (yi === null ? a : a.slice(yi * 12, yi * 12 + 12));
  const pick = (i) => setYear(YEARS[i]);

  // ---- Bengkalis (thesis v3, DBSCAN-filtered) ----
  const kv = Object.fromEntries(names.map((n) => [n, sum(slice(D.kec[n].monthly))]));
  const total = sum(Object.values(kv));
  const inPeat = yi === null ? sum(D.years.map((y) => y.inPeat)) : D.years[yi].inPeat;
  const months = slice(D.regency);
  const peakVal = Math.max(...months);
  const gi = yi === null ? D.regency.indexOf(peakVal) : yi * 12 + months.indexOf(peakVal);
  const ranked = [...names].sort((a, b) => kv[b] - kv[a]);
  const kmax = Math.max(...Object.values(kv), 1);
  const shown = D.points.filter((p) => yi === null || p[2] === year);

  // ---- burned area (MODIS MCD64A1 + Landsat dATBI, from thesis/data.js) ----
  const mcd = yi === null ? sum(Object.values(MCD_ANNUAL)) : MCD_ANNUAL[year];
  const landsat = yi === null ? null : ANNUAL_AREA.find((a) => a.year === year)?.datbi ?? null;

  // ---- Riau, 12 regencies (MODIS confidence >= 30%) ----
  const riauYear = (k) => (yi === null ? sum(R.hs[k]) : R.hs[k][yi]);
  const riauTotal = sum(R.regencies.map(riauYear));
  const regRanked = [...R.regencies].sort((a, b) => riauYear(b) - riauYear(a));
  const rmax = Math.max(...regRanked.map(riauYear), 1);

  const k = D.kec[sel];
  const bYear = MONTHLY[year] ? year : 2019;

  return (
    <div className="fd" role="region" aria-label="Riau fire dashboard">
      <div className="fd-bar">
        <span className="fd-bar-l">Year</span>
        <div className="pp-chips" role="group" aria-label="Year filter">
          {ORDER.map((y) => (
            <button key={y} type="button" aria-pressed={year === y} onClick={() => setYear(y)}>{y === 'All' ? '2015–24' : y}</button>
          ))}
        </div>
      </div>

      <div className="fd-kpis">
        <Kpi label="Hotspots · Bengkalis" value={fmt(total)} sub={yi === null ? 'DBSCAN-filtered, 11 kecamatan' : `${((total / 3402) * 100).toFixed(1)}% of the 3,402 in 2015–24`} tone="peat" />
        <Kpi label="On mapped peat" value={total ? ((inPeat / total) * 100).toFixed(1) + '%' : '–'} sub={`${fmt(inPeat)} of ${fmt(total)} hotspots`} tone="peat" />
        <Kpi label="Peak month" value={peakVal ? monthLabel(D.months[gi]) : '–'} sub={`${fmt(peakVal)} hotspots in the month`} />
        <Kpi label="MODIS burned area" value={fmt(mcd) + ' ha'} sub={yi === null ? 'MCD64A1, summed 2015–24' : 'MCD64A1, whole regency'} tone="burn" />
        <Kpi label="Landsat burned area" value={landsat === null ? 'n/a' : fmt(landsat) + ' ha'} sub={landsat === null ? 'dATBI was run for 2015, 2019, 2023 only' : 'dATBI ≥ 0.20, dry-season baseline'} tone="landsat" />
        <Kpi label="Hotspots · all Riau" value={fmt(riauTotal)} sub="12 regencies, MODIS conf. ≥ 30%" />
      </div>

      <div className="fd-grid2">
        <section className="fd-card" aria-label="Map of Bengkalis hotspots">
          <header><h3>Where · Bengkalis</h3>
            <label className="pp-check"><input type="checkbox" checked={pts} onChange={(e) => setPts(e.target.checked)} /> Points</label></header>
          <svg viewBox={`-60 -10 ${D.w + 120} ${D.h + 20}`} className="fd-map" role="img" aria-label={`Bengkalis kecamatan shaded by hotspot count, ${year === 'All' ? '2015 to 2024' : year}, with ${fmt(shown.length)} hotspot points.`}>
            {names.map((n) => (
              <path key={n} d={D.kec[n].d} fill={mix(Math.sqrt(kv[n] / kmax), GREY)} stroke={(hov || sel) === n ? '#f2ede4' : 'rgba(255,255,255,.25)'} strokeWidth={(hov || sel) === n ? 2.2 : 0.8}
                className="pp-kec" tabIndex={0} aria-label={`${n}: ${kv[n]} hotspots`}
                onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)} onFocus={() => setHov(n)} onBlur={() => setHov(null)}
                onClick={() => setSel(n)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setSel(n)} />
            ))}
            {pts && <g pointerEvents="none">{shown.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="1.8" fill={p[3] ? C.peat : C.off} fillOpacity=".8" />)}</g>}
            <g pointerEvents="none" className="pp-labels">
              {names.map((n) => { const o = NUDGE[n] || [0, 0]; return <text key={n} className={n === (hov || sel) ? 'on' : ''} x={D.kec[n].cx + o[0]} y={D.kec[n].cy + o[1]} textAnchor="middle">{n}</text>; })}
            </g>
          </svg>
          <div className="pp-legend fd-leg">
            <span><i className="pp-dot" style={{ background: C.peat }} />On mapped peat</span>
            <span><i className="pp-dot" style={{ background: C.off }} />Off peat</span>
            <span><i style={{ background: mix(1, GREY) }} />Shade = kecamatan hotspot count</span>
          </div>
        </section>

        <section className="fd-card" aria-label="Kecamatan ranking">
          <header><h3>Which kecamatan</h3><small>{year === 'All' ? '2015–2024' : year}</small></header>
          <div className="fd-ranks">
            {ranked.map((n) => (
              <button key={n} type="button" className="fd-rank" aria-pressed={sel === n} onClick={() => setSel(n)} onMouseEnter={() => setHov(n)} onMouseLeave={() => setHov(null)}>
                <span>{n}</span>
                <span className="fd-track"><i style={{ width: (kv[n] / kmax) * 100 + '%', background: C.peat }} /></span>
                <b>{fmt(kv[n])}</b>
              </button>
            ))}
          </div>
          <div className="fd-detail" aria-live="polite">
            <h4>{sel}</h4>
            <p>
              {fmt(kv[sel])} hotspots in {year === 'All' ? '2015–2024' : year}. Over the full decade {Math.round((k.inPeat / k.total) * 100)}% of its {fmt(k.total)} hotspots sit on mapped peat.
            </p>
            <Spark series={k.monthly} yi={yi} />
            {year === 2019 && Y2019[sel] && (
              <dl className="fd-mini">
                <div><dt>Hotspots</dt><dd>{fmt(Y2019[sel][0])}</dd></div>
                <div><dt>MODIS burned</dt><dd style={{ color: C.burn }}>{fmt(Math.round(Y2019[sel][1]))} ha</dd></div>
                <div><dt>Landsat dATBI</dt><dd style={{ color: C.landsat }}>{fmt(Math.round(Y2019[sel][2]))} ha</dd></div>
              </dl>
            )}
            {year !== 2019 && <p className="fd-hint">Select 2019 to see burned area for this kecamatan, the one year with a per-kecamatan burned-area breakdown.</p>}
          </div>
        </section>
      </div>

      <section className="fd-card fd-wide" aria-label="Monthly hotspot timeline">
        <header><h3>When · monthly hotspots, Bengkalis</h3><small>Click a bar to filter by its year</small></header>
        <Timeline year={year} onPick={pick} />
        <div className="pp-legend fd-leg">
          <span><i style={{ background: C.peat }} />Hotspots per month</span>
          {Object.entries(PH).map(([n, c]) => <span key={n}><i style={{ background: c }} />{n}</span>)}
          <span style={{ color: 'var(--text-dim)' }}>Strip under the bars = ENSO phase of the month</span>
        </div>
      </section>

      <div className="fd-grid2">
        <section className="fd-card" aria-label="Annual hotspots">
          <header><h3>Hotspots per year</h3><small>Bengkalis</small></header>
          <BarChart labels={YEARS} series={[D.years.map((y) => y.inPeat), D.years.map((y) => y.outPeat)]} colors={[C.peat, C.off]} hi={yi} onPick={pick}
            label="Annual hotspots in Bengkalis, split into on-peat and off-peat" unit="hotspots" />
          <div className="pp-legend fd-leg"><span><i style={{ background: C.peat }} />On mapped peat</span><span><i style={{ background: C.off }} />Off peat</span></div>
        </section>
        <section className="fd-card" aria-label="Annual burned area">
          <header><h3>Burned area per year</h3><small>Bengkalis</small></header>
          <BarChart labels={YEARS} series={[YEARS.map((y) => MCD_ANNUAL[y])]} colors={[C.burn]} hi={yi} onPick={pick}
            markers={YEARS.map((y) => ANNUAL_AREA.find((a) => a.year === y)?.datbi ?? null)} markerColor={C.landsat}
            label="Annual MODIS burned area in Bengkalis with Landsat estimates for three years" unit="ha" />
          <div className="pp-legend fd-leg"><span><i style={{ background: C.burn }} />MODIS MCD64A1 (ha)</span><span><i style={{ background: C.landsat, transform: 'rotate(45deg)' }} />Landsat dATBI (ha), three years only</span></div>
        </section>
      </div>

      <section className="fd-card fd-wide" aria-label="Hotspots against burned area by month">
        <header><h3>Hotspots vs burned area · {bYear}</h3><small>{MONTHLY[year] ? 'Bengkalis, monthly' : `Monthly burned area exists for 2015, 2019 and 2023 only, so ${bYear} is shown`}</small></header>
        <BurnMonthly yr={bYear} />
      </section>

      <section className="fd-card fd-wide" aria-label="Riau regencies">
        <header><h3>Across Riau · 12 regencies</h3><small>{year === 'All' ? '2015–2024' : year} · MODIS confidence ≥ 30%</small></header>
        <div className="fd-reg" role="table" aria-label="Hotspots, mapped peat and hotspot density by regency">
          <div className="fd-reg-h" role="row"><span role="columnheader">Regency</span><span role="columnheader">Hotspots</span><span role="columnheader">Mapped peat</span><span role="columnheader">Deep peat ≥ 3 m</span><span role="columnheader">Per 10,000 ha peat</span></div>
          {regRanked.map((n) => {
            const pe = sum(R.peatHa[n]);
            const deep = pe ? sum(R.peatHa[n].slice(3)) / pe : null;
            const h = riauYear(n);
            return (
              <div key={n} className="fd-reg-r" role="row">
                <span role="rowheader">{n}</span>
                <span role="cell" className="fd-reg-bar"><span className="fd-track"><i style={{ width: (h / rmax) * 100 + '%', background: C.peat }} /></span><b>{fmt(h)}</b></span>
                <span role="cell">{pe ? fmt(Math.round(pe / 1000)) + 'k ha' : 'none mapped'}</span>
                <span role="cell">{deep === null ? '–' : Math.round(deep * 100) + '%'}</span>
                <span role="cell">{pe ? fmt(Math.round(h / (pe / 10000))) : '–'}</span>
              </div>
            );
          })}
        </div>
        <p className="fd-note">The density column divides all hotspots in a regency, on peat or not, by its mapped peat area, so it flatters regencies with little peat (Pekanbaru, Kampar). Read it next to the peat column. Bengkalis here is {fmt(riauYear('Bengkalis'))} because this panel uses a looser hotspot filter than the thesis counts above.</p>
      </section>
    </div>
  );
}

function Kpi({ label, value, sub, tone }) {
  return (
    <div className={'fd-kpi' + (tone ? ' ' + tone : '')}>
      <span>{label}</span>
      <b>{value}</b>
      <small>{sub}</small>
    </div>
  );
}

function Spark({ series, yi }) {
  const w = 280, h = 54, mx = Math.max(...series, 1), n = series.length;
  const pts = series.map((v, i) => `${(i / (n - 1)) * w},${h - (v / mx) * (h - 4) - 2}`).join(' ');
  return (
    <svg className="pp-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label="Monthly hotspot series, 2015 to 2024">
      {yi !== null && <rect x={(yi * 12 / (n - 1)) * w} y="0" width={(12 / (n - 1)) * w} height={h} fill="rgba(240,188,46,.16)" />}
      <polyline points={pts} fill="none" stroke={C.peat} strokeWidth="1.4" />
    </svg>
  );
}

function Timeline({ year, onPick }) {
  const [h, setH] = useState(null);
  const W = 1000, H = 230, L = 10, Rr = 10, T = 16, B = 46, n = 120, pw = (W - L - Rr) / n;
  const mx = Math.max(...D.regency);
  const y = (v) => T + (H - T - B) * (1 - v / mx);
  const inSel = (i) => year === 'All' || Math.floor(i / 12) === year - 2015;
  const read = h === null
    ? 'Hover a month. Peak: ' + monthLabel(D.months[D.regency.indexOf(mx)]) + ' with ' + mx + ' hotspots.'
    : `${monthLabel(D.months[h])}: ${D.regency[h]} hotspots · ${PHK[D.phase[h]]} · ONI ${D.oni[h] >= 0 ? '+' : '−'}${Math.abs(D.oni[h]).toFixed(2)}`;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label="Monthly hotspot counts in Bengkalis from 2015 to 2024 with the ENSO phase of each month">
        {D.regency.map((v, i) => (
          <g key={i} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} onClick={() => onPick(Math.floor(i / 12))}>
            <rect x={L + pw * i} y={T} width={pw} height={H - T - B + 12} fill="transparent" />
            <rect x={L + pw * i + 0.6} y={y(v)} width={Math.max(pw - 1.2, 1)} height={Math.max(0, H - B - y(v))} fill={C.peat} fillOpacity={(h === i ? 1 : inSel(i) ? 0.9 : 0.28)} />
            <rect x={L + pw * i} y={H - B + 6} width={pw + 0.3} height={9} fill={PH[PHK[D.phase[i]]]} fillOpacity={inSel(i) ? 0.95 : 0.35} />
          </g>
        ))}
        {YEARS.map((yr, j) => (
          <text key={yr} x={L + pw * (j * 12 + 6)} y={H - 12} textAnchor="middle" className="th-ax" fontWeight={year === yr ? 700 : 400} fill={year === yr ? '#f2ede4' : undefined}>{yr}</text>
        ))}
        <line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.2)" />
      </svg>
      <p className="th-readout" aria-live="polite">{read}</p>
    </>
  );
}

function BarChart({ labels, series, colors, hi, onPick, markers, markerColor, label, unit }) {
  const [h, setH] = useState(null);
  const W = 480, H = 190, L = 8, Rr = 8, T = 18, B = 24, n = labels.length, pw = (W - L - Rr) / n;
  const tot = labels.map((_, i) => sum(series.map((s) => s[i])));
  const mx = Math.max(...tot, ...(markers || []).filter((v) => v != null)) || 1;
  const y = (v) => T + (H - T - B) * (1 - v / mx);
  const active = h ?? hi;
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label={label}>
        {labels.map((lb, i) => {
          let base = 0;
          return (
            <g key={lb} role="button" tabIndex={0} aria-label={`${lb}: ${fmt(tot[i])} ${unit}`} className="fd-bar-g"
              onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)} onFocus={() => setH(i)} onBlur={() => setH(null)}
              onClick={() => onPick(i)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(i)}>
              <rect x={L + pw * i} y={T} width={pw} height={H - T - B + 14} fill="transparent" />
              {series.map((s, j) => {
                const y0 = y(base + s[i]), hgt = Math.max(0, y(base) - y0);
                base += s[i];
                return <rect key={j} x={L + pw * i + 5} y={y0} width={pw - 10} height={hgt} fill={colors[j]} fillOpacity={active === null || active === i ? 0.92 : 0.32} />;
              })}
              {markers && markers[i] != null && (
                <rect x={L + pw * (i + 0.5) - 5} y={y(markers[i]) - 5} width="10" height="10" fill={markerColor} stroke="#0d0e0f" strokeWidth="1" transform={`rotate(45 ${L + pw * (i + 0.5)} ${y(markers[i])})`} />
              )}
              <text x={L + pw * (i + 0.5)} y={H - 8} textAnchor="middle" className="th-ax" fontWeight={active === i ? 700 : 400} fill={active === i ? '#f2ede4' : undefined}>{String(lb).slice(2)}</text>
              {active === i && <text x={L + pw * (i + 0.5)} y={y(Math.max(tot[i], markers?.[i] ?? 0)) - 10} textAnchor="middle" className="th-val">{fmt(tot[i])}</text>}
            </g>
          );
        })}
        <line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.2)" />
      </svg>
    </>
  );
}

function BurnMonthly({ yr }) {
  const [h, setH] = useState(null);
  const { mcd, hs } = MONTHLY[yr];
  const mM = Math.max(...mcd), hM = Math.max(...hs);
  const W = 1000, H = 250, L = 10, Rr = 10, T = 16, B = 30, pw = (W - L - Rr) / 12;
  const y = (v, mx) => T + (H - T - B) * (1 - v / mx);
  const line = hs.map((v, i) => `${L + pw * (i + 0.5)},${y(v, hM)}`).join(' ');
  return (
    <>
      <div className="pp-legend fd-leg"><span><i style={{ background: C.burn }} />MODIS burned area (ha)</span><span><i className="pp-line" />DBSCAN hotspots (count)</span><span style={{ color: 'var(--text-dim)' }}>Each series is scaled to its own peak</span></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="th-svg" role="img" aria-label={`Monthly MODIS burned hectares and hotspot counts in ${yr}`}>
        {mcd.map((v, i) => (
          <g key={i} onMouseEnter={() => setH(i)} onMouseLeave={() => setH(null)}>
            <rect x={L + pw * i} y={T} width={pw} height={H - T - B} fill="transparent" />
            <rect x={L + pw * i + 14} y={y(v, mM)} width={pw - 28} height={Math.max(0, H - B - y(v, mM))} fill={C.burn} fillOpacity={h === null || h === i ? 0.85 : 0.35} />
            <text x={L + pw * (i + 0.5)} y={H - 10} textAnchor="middle" className="th-ax">{MN[i]}</text>
          </g>
        ))}
        <polyline points={line} fill="none" stroke={C.peat} strokeWidth="2" />
        {hs.map((v, i) => <circle key={i} cx={L + pw * (i + 0.5)} cy={y(v, hM)} r={h === i ? 5 : 3} fill={C.peat} />)}
        <line x1={L} x2={W - Rr} y1={H - B} y2={H - B} stroke="rgba(255,255,255,.2)" />
      </svg>
      <p className="th-readout" aria-live="polite">{h === null ? `Peak month: burned area ${MN[mcd.indexOf(mM)]} (${fmt(mM)} ha), hotspots ${MN[hs.indexOf(hM)]} (${hM}). Hover a month.` : `${MN[h]} ${yr}: ${fmt(mcd[h])} ha burned · ${hs[h]} hotspots`}</p>
    </>
  );
}
