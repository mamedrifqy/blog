import { useEffect, useRef } from 'react';
import { D, PH, MN } from './shared.js';

export default function SeasonProfile() {
  const ref = useRef(null);
  useEffect(() => {
    let chart;
    (async () => {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      Chart.defaults.color = '#7a8089'; Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
      chart = new Chart(ref.current, {
        type: 'bar',
        data: { labels: MN, datasets: ['La Niña', 'Neutral', 'El Niño'].map((k) => ({ label: k, data: D.calendar[k], backgroundColor: PH[k] })) },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
          scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, grid: { color: 'rgba(255,255,255,.05)' }, title: { display: true, text: 'Hotspots, 2015–2024 total' } } },
        },
      });
    })();
    return () => chart && chart.destroy();
  }, []);
  return (
    <figure className="pp-fig">
      <div className="pp-legend">{Object.entries(PH).map(([k, c]) => <span key={k}><i style={{ background: c }} />{k}</span>)}</div>
      <div className="pp-canvas" style={{ height: 280 }} role="img" aria-label="Hotspots by calendar month, stacked by ENSO phase."><canvas ref={ref} /></div>
      <figcaption>Hotspots summed by calendar month across ten years, split by the ENSO phase of the month they fell in.</figcaption>
    </figure>
  );
}
