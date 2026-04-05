/**
 * FireProbChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Grouped bar chart comparing fire probability (×10) across
 * ENSO scenarios (El Niño / Dry Season / La Niña) per kecamatan,
 * as estimated by a GBM classifier.
 *
 * Props:
 *   data  : Array<{ polygon: string, 'El Niño': number,
 *                   'Dry Season': number, 'La Niña': number }>
 *   title : string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const SCENARIO_COLORS = {
  'El Niño':    'rgba(224,92,40,0.85)',    /* warm orange-red — danger */
  'Dry Season': 'rgba(244,160,35,0.75)',    /* amber — caution */
  'La Niña':    'rgba(55,138,221,0.75)',    /* blue — suppression */
};

export default function FireProbChart({ data = [], title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      const scenarios = Object.keys(data[0]).filter(k => k !== 'polygon');

      /* Sort by El Niño probability descending */
      const sorted = [...data].sort((a, b) => (b['El Niño'] ?? 0) - (a['El Niño'] ?? 0));

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.polygon),
          datasets: scenarios.map(scenario => ({
            label:           scenario,
            data:            sorted.map(d => d[scenario] ?? 0),
            backgroundColor: SCENARIO_COLORS[scenario] || 'rgba(138,158,143,0.6)',
            borderColor:     'rgba(0,0,0,0)',
            borderRadius:    2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              ticks: { color: '#4a5e50', font: { size: 9 }, maxRotation: 55 },
              grid:  { color: 'rgba(255,255,255,0.03)' },
            },
            y: {
              title: { display: true, text: 'Fire probability (×10)', color: '#4a5e50', font: { size: 11 } },
              ticks: {
                color: '#4a5e50',
                font:  { size: 10 },
                callback: v => (v / 10).toFixed(1),
              },
              grid: { color: 'rgba(255,255,255,0.04)' },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color:    '#8a9e8f',
                font:     { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 12,
                padding:  14,
              },
            },
            tooltip: {
              backgroundColor: 'rgba(12,26,16,0.95)',
              titleColor:      '#f0ece0',
              bodyColor:       '#8a9e8f',
              borderColor:     'rgba(255,255,255,0.07)',
              borderWidth:     1,
              padding:         12,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: ${(ctx.raw / 10).toFixed(1)}%`,
              },
            },
          },
        },
      });
    }

    build();
    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div style={{
      background: 'var(--bg-card, #121f16)',
      border: '1px solid var(--border, rgba(255,255,255,0.07))',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '2rem 0',
    }}>
      {title && (
        <h4 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: '1.05rem',
          color: '#f0ece0',
          marginBottom: '1.25rem',
        }}>{title}</h4>
      )}
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: XGBoost (GroupKFold, k=11) · CHIRPS · ERA5-Land · MODIS hotspot · Bengkalis Regency
      </p>
    </div>
  );
}
