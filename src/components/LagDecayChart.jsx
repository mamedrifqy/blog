/**
 * LagDecayChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Grouped bar chart showing ONI–hotspot Spearman correlation
 * decay across lags 0–3 months per sub-district.
 *
 * Props:
 *   data  : Array<{ polygon: string, 'Lag 0': number, 'Lag 1': number,
 *                   'Lag 2': number, 'Lag 3': number }>
 *   title : string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const LAG_COLORS = {
  'Lag 0': 'rgba(224,92,40,0.85)',   /* immediate — warm orange */
  'Lag 1': 'rgba(244,160,35,0.85)',   /* 1-month — amber */
  'Lag 2': 'rgba(126,200,80,0.85)',   /* 2-month — lime */
  'Lag 3': 'rgba(58,176,110,0.85)',   /* 3-month — green */
};

export default function LagDecayChart({ data = [], title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      const lags = Object.keys(data[0]).filter(k => k !== 'polygon');

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: data.map(d => d.polygon),
          datasets: lags.map(lag => ({
            label:           lag,
            data:            data.map(d => d[lag] ?? 0),
            backgroundColor: LAG_COLORS[lag] || 'rgba(138,158,143,0.6)',
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
              title: { display: true, text: 'Spearman ρ', color: '#4a5e50', font: { size: 11 } },
              ticks: { color: '#4a5e50', font: { size: 10 } },
              grid:  { color: 'rgba(255,255,255,0.04)' },
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
                label: ctx => ` ${ctx.dataset.label}: ρ = ${ctx.raw.toFixed(3)}`,
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
        Source: ONI (NOAA CPC) × MODIS hotspot (FIRMS C6.1) · Spearman ρ per kecamatan, 2015–2024
      </p>
    </div>
  );
}
