/**
 * PredictorChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Horizontal grouped bar chart ranking predictor variables by
 * absolute Spearman correlation with monthly hotspot count,
 * split into Climate vs Non-Climate categories.
 *
 * Props:
 *   data  : Array<{ polygon: string, Climate: number, 'Non-Climate': number }>
 *   title : string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const CATEGORY_COLORS = {
  Climate:     'rgba(58,176,110,0.85)',   /* green — natural drivers */
  NonClimate:  'rgba(224,92,40,0.85)',    /* orange — anthropogenic drivers */
};

const CATEGORY_LABELS = {
  Climate:    'Climate variable',
  NonClimate: 'Non-climate variable',
};

export default function PredictorChart({ data = [], title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      const categories = Object.keys(data[0]).filter(k => k !== 'polygon');

      /* Sort by total magnitude descending so strongest predictors appear at top */
      const sorted = [...data].sort((a, b) => {
        const sumA = categories.reduce((s, c) => s + (a[c] ?? 0), 0);
        const sumB = categories.reduce((s, c) => s + (b[c] ?? 0), 0);
        return sumB - sumA;
      });

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.polygon),
          datasets: categories.map(cat => ({
            label:           CATEGORY_LABELS[cat] || cat,
            data:            sorted.map(d => d[cat] ?? 0),
            backgroundColor: CATEGORY_COLORS[cat] || 'rgba(138,158,143,0.6)',
            borderColor:     'rgba(0,0,0,0)',
            borderRadius:    2,
          })),
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              title: { display: true, text: '|ρ| × 10', color: '#4a5e50', font: { size: 11 } },
              ticks: { color: '#4a5e50', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.04)' },
            },
            y: {
              ticks: { color: '#f0ece0', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.03)' },
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
                label: ctx => {
                  if (ctx.raw === 0) return null;
                  return ` ${ctx.dataset.label}: |ρ| = ${(ctx.raw / 10).toFixed(3)}`;
                },
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
      <div style={{ height: 340, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: CHIRPS v2.0 · ERA5-Land · GEE · MODIS hotspot archive · Bengkalis Regency, 2015–2024
      </p>
    </div>
  );
}
