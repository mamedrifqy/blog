/**
 * SuitabilityChart.jsx
 * Stacked bar chart showing suitability class distribution
 * across the 31 polygons of PRM_2026_Riau_349Ha.
 */

import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

const CLASS_COLORS = {
  'Class 1 — Highly suitable':   '#3ab06e',
  'Class 2 — Suitable':          '#7ec850',
  'Class 3 — Marginally suitable':'#f4a023',
  'Class 4 — Not suitable':      '#e05c28',
  'No data / cloud':             '#2a3e30',
};

export default function SuitabilityChart({ data = [], title = '' }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      if (chartRef.current) chartRef.current.destroy();

      const labels   = data.map(d => d.polygon);
      const classes  = Object.keys(CLASS_COLORS);

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels,
          datasets: classes.map(cls => ({
            label:           cls,
            data:            data.map(d => d[cls] ?? 0),
            backgroundColor: CLASS_COLORS[cls],
            borderColor:     'rgba(0,0,0,0)',
            borderRadius:    { topLeft: 0, topRight: 0, bottomLeft: 0, bottomRight: 0 },
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              stacked: true,
              ticks:   { color: P.muted, font: { size: 9 }, maxRotation: 60 },
              grid:    { color: ink(0.03) },
              title:   { display: true, text: 'Polygon ID', color: P.muted, font: { size: 10 } },
            },
            y: {
              stacked: true,
              ticks:   { color: P.muted, font: { size: 10 },
                         callback: v => v + ' ha' },
              grid:    { color: ink(0.04) },
              title:   { display: true, text: 'Area (ha)', color: P.muted, font: { size: 10 } },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color:    P.muted,
                font:     { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 12,
                padding:  14,
              },
            },
            tooltip: {
              backgroundColor: P.pop,
              titleColor:      P.bright,
              bodyColor:       P.muted,
              borderColor:     ink(0.07),
              borderWidth:     1,
              padding:         12,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label.split('—')[0].trim()}: ${ctx.raw.toFixed(1)} ha`,
              },
            },
          },
        },
      });
    }

    build();
    return () => chartRef.current?.destroy();
  }, [data, theme]);

  return (
    <div style={{
      background: 'var(--bg-card, #121f16)',
      border: '1px solid var(--border, rgba(255,255,255,0.07))',
      borderRadius: '8px',
      padding: '1.5rem',
      margin: '2rem 0',
    }}>
      {title && (
        <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem',
          color: 'var(--text-bright)', marginBottom: '1.25rem' }}>{title}</h4>
      )}
      <div style={{ height: 300, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: GEE analysis · Sentinel-1 SAR + Sentinel-2 + FABDEM · PRM_2026_Riau_349Ha (31 polygons)
      </p>
    </div>
  );
}
