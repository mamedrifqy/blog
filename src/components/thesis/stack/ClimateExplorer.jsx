import { useMemo, useState } from 'react';
import { PHASE, PHASE_LABEL, MONTHS_LONG, useData, Loading, num, signed } from './util.jsx';

// 120 months of ONI and DMI, regency-mean SPI-3 / SPEI-3 and total hotspots. Click a month for its detail.
const W = 960, PL = 44, PR = 12, IW = W - PL - PR;
const T1 = { y: 30, h: 110 }, T2 = { y: 184, h: 90 }, T3 = { y: 318, h: 90 }, H = 436;
const x = (t) => PL + (t + 0.5) * (IW / 120);
const bw = IW / 120;

export default function ClimateExplorer({ base }) {
  const { data, err } = useData([[`${base}/thesis-data/csv/monthly_panel_11x120.csv`, 'csv']]);
  const [t, setT] = useState(null);
  const [hov, setHov] = useState(null);

  const M = useMemo(() => {
    if (!data) return null;
    const out = Array.from({ length: 120 }, () => ({ rows: [] }));
    data[0].objects.forEach((r) => out[(+r.year - 2015) * 12 + +r.month - 1].rows.push(r));
    const mean = (rs, k) => rs.reduce((a, r) => a + +r[k], 0) / rs.length;
    return out.map((m, i) => {
      const r = m.rows[0];
      return {
        i, year: +r.year, month: +r.month, oni: +r.oni_c, dmi: +r.dmi, phase: r.enso_phase, fire: r.is_fire_season === '1',
        hot: m.rows.reduce((a, q) => a + +q.hotspot_count, 0), rain: mean(m.rows, 'precip_mm'), t2m: mean(m.rows, 't2m_mean_c'),
        spi: mean(m.rows, 'spi3'), spei: mean(m.rows, 'spei3'), rows: [...m.rows].sort((a, b) => +b.hotspot_count - +a.hotspot_count || a.kecamatan.localeCompare(b.kecamatan)),
      };
    });
  }, [data]);

  if (!M) return <Loading err={err} />;
  const yOni = (v) => T1.y + T1.h / 2 - (v / 3) * (T1.h / 2);
  const yIdx = (v) => T2.y + T2.h / 2 - (Math.max(-2.5, Math.min(2.5, v)) / 2.5) * (T2.h / 2);
  const hmax = Math.max(...M.map((m) => m.hot));
  const yHot = (v) => T3.y + T3.h - (Math.sqrt(v) / Math.sqrt(hmax)) * T3.h;
  const line = (k, f) => M.map((m, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${f(m[k]).toFixed(1)}`).join('');
  const cur = t != null ? M[t] : null;
  const show = hov ?? t;

  return (
    <div className="sx-explorer">
      <div className="sx-chartwrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="sx-chart" role="img" aria-label="Monthly ONI, DMI, drought indices and hotspots, 2015 to 2024">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => (
            <g key={k}>
              <line x1={PL + k * 12 * bw} x2={PL + k * 12 * bw} y1={T1.y} y2={T3.y + T3.h} stroke="rgba(255,255,255,.07)" />
              <text className="sx-ax" x={PL + (k * 12 + 6) * bw} y={H - 6} textAnchor="middle">{2015 + k}</text>
            </g>
          ))}
          {/* track 1: ONI bars by phase, DMI line */}
          <text className="sx-ax strong" x={PL} y={T1.y - 14}>ONI (bars) and DMI (line), °C</text>
          <line x1={PL} x2={W - PR} y1={yOni(0)} y2={yOni(0)} stroke="rgba(255,255,255,.25)" />
          {[-0.5, 0.5].map((v) => <line key={v} x1={PL} x2={W - PR} y1={yOni(v)} y2={yOni(v)} stroke="rgba(255,255,255,.12)" strokeDasharray="3 4" />)}
          {[-1, 1, 2].map((v) => <text key={v} className="sx-ax" x={PL - 6} y={yOni(v) + 4} textAnchor="end">{v > 0 ? '+' : ''}{v}</text>)}
          {M.map((m) => <rect key={m.i} x={x(m.i) - bw / 2 + 0.6} width={bw - 1.2} y={Math.min(yOni(0), yOni(m.oni))} height={Math.max(1, Math.abs(yOni(m.oni) - yOni(0)))} fill={PHASE[m.phase]} opacity={show == null || show === m.i ? 0.92 : 0.5} />)}
          <path d={line('dmi', yOni)} fill="none" stroke="#f2ede4" strokeWidth="1.3" opacity=".75" />
          {/* track 2: SPI-3, SPEI-3 regency means */}
          <text className="sx-ax strong" x={PL} y={T2.y - 14}>SPI-3 and SPEI-3, sub-district mean</text>
          <line x1={PL} x2={W - PR} y1={yIdx(0)} y2={yIdx(0)} stroke="rgba(255,255,255,.25)" />
          {[-2, 2].map((v) => <text key={v} className="sx-ax" x={PL - 6} y={yIdx(v) + 4} textAnchor="end">{v > 0 ? '+' : ''}{v}</text>)}
          <path d={line('spi', yIdx)} fill="none" stroke="#4f9be8" strokeWidth="1.5" />
          <path d={line('spei', yIdx)} fill="none" stroke="#f0bc2e" strokeWidth="1.5" opacity=".9" />
          {/* track 3: hotspots */}
          <text className="sx-ax strong" x={PL} y={T3.y - 14}>Hotspots, regency total</text>
          {M.map((m) => <rect key={m.i} x={x(m.i) - bw / 2 + 0.6} width={bw - 1.2} y={yHot(m.hot)} height={T3.y + T3.h - yHot(m.hot)} fill={m.fire ? '#1cc8aa' : '#4b5563'} opacity={show == null || show === m.i ? 0.95 : 0.55} />)}
          {[0, 50, 200].map((v) => <text key={v} className="sx-ax" x={PL - 6} y={yHot(v) + 4} textAnchor="end">{v}</text>)}
          {show != null && <rect x={x(show) - bw / 2} width={bw} y={T1.y} height={T3.y + T3.h - T1.y} fill="none" stroke="#f2ede4" strokeOpacity=".7" />}
          {M.map((m) => (
            <rect key={m.i} x={x(m.i) - bw / 2} width={bw} y={T1.y} height={T3.y + T3.h - T1.y} fill="transparent" style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHov(m.i)} onMouseLeave={() => setHov(null)} onClick={() => setT(m.i)}>
              <title>{MONTHS_LONG[m.month - 1]} {m.year}</title>
            </rect>
          ))}
        </svg>
        <div className="sx-legend in">
          <span><i style={{ background: PHASE['El Nino'] }} />El Niño month</span><span><i style={{ background: PHASE['La Nina'] }} />La Niña</span><span><i style={{ background: PHASE.Netral }} />Neutral</span>
          <span><i className="ln" style={{ background: '#f2ede4' }} />DMI</span><span><i className="ln" style={{ background: '#4f9be8' }} />SPI-3</span><span><i className="ln" style={{ background: '#f0bc2e' }} />SPEI-3</span>
          <span><i style={{ background: '#1cc8aa' }} />Hotspots in a fire month (Feb–Apr, Jul–Aug)</span>
        </div>
        <p className="sx-note">SPI-3 and SPEI-3 lines are the mean of the 11 sub-district values in each month; hotspots are the regency total (square-root scale). Dashed lines mark ONI ±0.5 °C. Click a month for the detail.</p>
      </div>
      <div className="sx-detail wide" aria-live="polite">
        {!cur && <p className="sx-hint">Click any month in the chart.</p>}
        {cur && (
          <div className="sx-card">
            <p className="sx-card-kick">{cur.fire ? 'Empirical fire month' : 'Outside the fire months'}</p>
            <h4>{MONTHS_LONG[cur.month - 1]} {cur.year} <span className="sx-pill" style={{ background: PHASE[cur.phase] }}>{PHASE_LABEL[cur.phase]}</span></h4>
            <div className="sx-stats">
              <div><b>{signed(cur.oni)} °C</b><span>ONI</span></div>
              <div><b>{signed(cur.dmi, 2)}</b><span>DMI</span></div>
              <div><b>{cur.hot}</b><span>hotspots, regency</span></div>
              <div><b>{num(cur.rain, 0)} mm</b><span>rainfall, sub-district mean</span></div>
              <div><b>{signed(cur.spi)}</b><span>SPI-3, mean</span></div>
              <div><b>{signed(cur.spei)}</b><span>SPEI-3, mean</span></div>
            </div>
            <div className="sx-tablewrap">
              <table className="sx-table">
                <thead><tr><th>Sub-district</th><th>Hotspots</th><th>Rain (mm)</th><th>Temp (°C)</th><th>SPI-3</th><th>SPEI-3</th></tr></thead>
                <tbody>{cur.rows.map((r) => (
                  <tr key={r.kecamatan}><td>{r.kecamatan}</td><td className={+r.hotspot_count ? 'hot' : ''}>{r.hotspot_count}</td><td>{num(r.precip_mm, 0)}</td><td>{num(r.t2m_mean_c, 1)}</td><td>{signed(r.spi3)}</td><td>{signed(r.spei3)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
