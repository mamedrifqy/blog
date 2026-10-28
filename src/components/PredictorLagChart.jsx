/**
 * PredictorLagChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Line chart showing lag-decay of predictor correlations with
 * hotspot count (lag 0–6 months) for all major climate predictors.
 *
 * Props:
 *   data : Array<{ predictor: string, color: string, points: Array<{ lag: number, r: number }> }>
 *   title: string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

const DEFAULT_COLORS = ['#3ab06e', '#378add', '#e05c28', '#f4a023', '#a855f7'];

export default function PredictorLagChart({ data = [], title = '' }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      chartRef.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels: [0, 1, 2, 3, 4, 5, 6].map(l => `Lag ${l}`),
          datasets: data.map((series, idx) => ({
            label: series.predictor,
            data: series.points.map(p => p.r),
            borderColor: series.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
            backgroundColor: (series.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]).replace(')', ',0.1)').replace('rgb', 'rgba'),
            borderWidth: 2.5,
            pointRadius: 5,
            pointBackgroundColor: series.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
            pointBorderColor: '#121f16',
            pointBorderWidth: 2,
            tension: 0.3,
            fill: false,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              title: { display: true, text: 'Lag (months)', color: P.muted, font: { size: 11 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid: { color: ink(0.03) },
            },
            y: {
              title: { display: true, text: 'Spearman r', color: P.muted, font: { size: 11 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid: { color: ink(0.04) },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: P.muted,
                font: { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 14,
                padding: 16,
              },
            },
            tooltip: {
              backgroundColor: P.pop,
              titleColor: P.bright,
              bodyColor: P.muted,
              borderColor: ink(0.07),
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: r = ${ctx.raw.toFixed(3)}`,
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
        Source: CHIRPS v2.0 · ERA5-Land · NOAA ONI · MODIS hotspot · Panel Spearman r (n = 1,320)
      </p>
    </div>
  );
}
