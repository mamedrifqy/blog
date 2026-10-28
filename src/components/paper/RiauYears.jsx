import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../../lib/theme.js';
import S from '../../data/riau-summary.json';

export default function RiauYears() {
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
        type: 'bar',
        data: { labels: S.years.map((y) => y[0]), datasets: [{ data: S.years.map((y) => y[1]), backgroundColor: S.years.map((y) => (y[1] > 7000 ? P.cCoral : P.grey)) }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: ink(0.05) }, title: { display: true, text: 'Hotspots per year' } } } },
      });
    })();
    return () => chart && chart.destroy();
  }, [theme]);
  return (
    <figure className="pp-fig">
      <div className="pp-canvas" style={{ height: 260 }} role="img" aria-label="Annual hotspot totals for Riau, 2015 to 2024."><canvas ref={ref} /></div>
      <figcaption>Annual MODIS hotspots (confidence ≥ 30%) summed over the twelve regencies and cities of Riau.</figcaption>
    </figure>
  );
}
