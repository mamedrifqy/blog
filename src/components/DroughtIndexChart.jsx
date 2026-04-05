/**
 * DroughtIndexChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Vertical grouped bar chart comparing SPEI-3 (Thornthwaite) vs
 * SPI-3 (Gamma) Spearman correlation with monthly hotspot count
 * per kecamatan.
 *
 * Props:
 *   data  : Array<{ kecamatan: string, spei3: number, spi3: number }>
 *   title : string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const INDEX_COLORS = {
  spei3: 'rgba(224,92,40,0.85)',
  spi3:  'rgba(55,138,221,0.75)',
};

const INDEX_LABELS = {
  spei3: 'SPEI-3 (Thornthwaite)',
  spi3:  'SPI-3 (Gamma)',
};

export default function DroughtIndexChart({ data = [], title = '' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    async function build() {
      const { Chart, registerables } = await import('chart.js');
      Chart.register(...registerables);
      if (chartRef.current) chartRef.current.destroy();
      if (!data.length) return;

      /* Sort by |SPEI-3| descending so strongest correlations appear first */
      const sorted = [...data].sort((a, b) => Math.abs(b.spei3) - Math.abs(a.spei3));

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.kecamatan),
          datasets: [
            {
              label:           INDEX_LABELS.spei3,
              data:            sorted.map(d => d.spei3 ?? 0),
              backgroundColor: INDEX_COLORS.spei3,
              borderColor:     'rgba(0,0,0,0)',
              borderRadius:    2,
            },
            {
              label:           INDEX_LABELS.spi3,
              data:            sorted.map(d => d.spi3 ?? 0),
              backgroundColor: INDEX_COLORS.spi3,
              borderColor:     'rgba(0,0,0,0)',
              borderRadius:    2,
            },
          ],
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
              ticks: { color: '#f0ece0', font: { size: 10 } },
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
                label: ctx => {
                  const label = ctx.dataset.label.split(' ')[0];
                  return ` ${label}: ρ = ${ctx.raw.toFixed(3)}`;
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
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: '#4a5e50', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: SPEI-3 (Thornthwaite) · SPI-3 (Gamma) · CHIRPS v2.0 · MODIS hotspot archive · Bengkalis Regency, 2015–2024
      </p>
    </div>
  );
}
