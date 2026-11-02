import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../../lib/theme.js';
import { D, PH, PHK, monthLabel, phaseColors } from './shared.js';

export default function PhaseTimeline() {
  const theme = useTheme();
  const ref = useRef(null);
  useEffect(() => {
    let chart;
    (async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      Chart.defaults.color = P.muted; Chart.defaults.borderColor = ink(0.1); Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
      chart = new Chart(ref.current, {
        data: {
          labels: D.months,
          datasets: [
            { type: 'bar', label: 'Hotspots (all 11 kecamatan)', data: D.regency, yAxisID: 'y', barPercentage: 1, categoryPercentage: 0.9,
              backgroundColor: D.phase.map((p) => phaseColors(P)[PHK[p]]) },
            { type: 'line', label: 'ONI (°C)', data: D.oni, yAxisID: 'y1', borderColor: P.cGold, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 3, tension: 0.25 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { title: (it) => monthLabel(D.months[it[0].dataIndex]), afterBody: (it) => 'ENSO phase: ' + PHK[D.phase[it[0].dataIndex]] } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: false, callback: (v, i) => (D.months[i].endsWith('-01') ? D.months[i].slice(0, 4) : '') } },
            y: { beginAtZero: true, grid: { color: ink(0.05) }, title: { display: true, text: 'Hotspots per month' } },
            y1: { position: 'right', grid: { display: false }, min: -2, max: 3, title: { display: true, text: 'ONI (°C)' } },
          },
        },
      });
    })();
    return () => chart && chart.destroy();
  }, [theme]);
  return (
    <figure className="pp-fig pp-wide">
      <div className="pp-legend">
        {Object.entries(PH).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k} months</span>)}
        <span><i className="pp-line" />ONI</span>
      </div>
      <div className="pp-canvas" style={{ height: 320 }} role="img" aria-label="Monthly hotspot counts in Bengkalis 2015 to 2024, coloured by ENSO phase, with the ONI line.">
        <canvas ref={ref} />
      </div>
      <figcaption>Monthly hotspots summed over the 11 kecamatan, coloured by NOAA ENSO phase (≥ 5 consecutive months at ±0.5 °C). The yellow line is the ONI.</figcaption>
    </figure>
  );
}
