/**
 * BiTemporalChart.jsx
 * Side-by-side radar chart comparing Sentinel-1 backscatter
 * signatures between dry season and wet/flood season composites.
 */

import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

export default function BiTemporalChart({ data = [], title = '' }) {
  const theme = useTheme();
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      const P = palette();
      if (chartRef.current) chartRef.current.destroy();

      chartRef.current = new Chart(canvasRef.current, {
        type: 'radar',
        data: {
          labels: data.map(d => d.label),
          datasets: [
            {
              label:           'Dry season (Aug–Oct)',
              data:            data.map(d => d.dry),
              borderColor:     '#f4a023',
              backgroundColor: 'rgba(244,160,35,0.12)',
              pointBackgroundColor: '#f4a023',
              pointRadius:     4,
              borderWidth:     2,
            },
            {
              label:           'Flood season (Jan–Mar)',
              data:            data.map(d => d.wet),
              borderColor:     '#378add',
              backgroundColor: 'rgba(55,138,221,0.1)',
              pointBackgroundColor: '#378add',
              pointRadius:     4,
              borderWidth:     2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              min: -25,
              max: 0,
              ticks: {
                color:       P.muted,
                font:        { size: 9 },
                stepSize:    5,
                backdropColor: 'transparent',
                callback:    v => v + ' dB',
              },
              grid:        { color: ink(0.06) },
              angleLines:  { color: ink(0.06) },
              pointLabels: { color: P.muted, font: { size: 11, family: "'Source Sans 3', sans-serif" } },
            },
          },
          plugins: {
            legend: {
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
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toFixed(1)} dB`,
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
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
        Median VV/VH backscatter (dB) per land cover class · Sentinel-1 GRD IW · 10 m resolution
      </p>
    </div>
  );
}
