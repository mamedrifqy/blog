/**
 * PeatDepthChart.jsx
 * ─────────────────────────────────────────────────────────────
 * Horizontal bar chart showing fire density by peat depth class
 * with area proportion and over/under-representation status.
 *
 * Props:
 *   data : Array<{ depth_label: string, n_hotspots: number, area_ha: number,
 *                   area_pct: number, fire_density: number, ratio: number, status: string }>
 *   title: string (optional)
 * ─────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';
import { useTheme, palette, ink } from '../lib/theme.js';

const STATUS_COLORS = {
  'Under-represented': 'rgba(55,138,221,0.75)',
  'Proportional':      'rgba(126,200,80,0.75)',
  'Over-represented':  'rgba(224,92,40,0.8)',
};

export default function PeatDepthChart({ data = [], title = '' }) {
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

      /* Sort by depth class ascending */
      const sorted = [...data].reverse();

      chartRef.current = new Chart(canvasRef.current, {
        type: 'bar',
        data: {
          labels: sorted.map(d => d.depth_label),
          datasets: [
            {
              label: 'Hotspots',
              data: sorted.map(d => d.n_hotspots),
              backgroundColor: sorted.map(d => STATUS_COLORS[d.status] || 'rgba(138,158,143,0.6)'),
              borderColor: 'rgba(0,0,0,0)',
              borderRadius: 2,
              yAxisID: 'y',
            },
            {
              label: 'Area (×10,000 ha)',
              data: sorted.map(d => +(d.area_ha / 10000).toFixed(1)),
              type: 'line',
              borderColor: P.muted,
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: P.bright,
              tension: 0.3,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: {
              stacked: false,
              ticks: { color: P.bright, font: { size: 10 } },
              grid: { color: ink(0.03) },
              title: { display: true, text: 'GBT peat depth class', color: P.muted, font: { size: 10 } },
            },
            y: {
              position: 'left',
              title: { display: true, text: 'Hotspot count', color: P.muted, font: { size: 11 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid: { color: ink(0.04) },
            },
            y1: {
              position: 'right',
              title: { display: true, text: 'Area (×10k ha)', color: P.muted, font: { size: 10 } },
              ticks: { color: P.muted, font: { size: 10 } },
              grid: { drawOnChartArea: false },
            },
          },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: P.muted,
                font: { family: "'Source Sans 3', sans-serif", size: 11 },
                boxWidth: 12,
                padding: 14,
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
                label: ctx => {
                  if (ctx.datasetIndex === 0) {
                    const d = sorted[ctx.dataIndex];
                    return ` Hotspots: ${ctx.raw.toLocaleString()} (${d.fire_pct}% of total)`;
                  }
                  return ` Area: ${(ctx.raw * 10000).toLocaleString()} ha (${sorted[ctx.dataIndex].area_pct}%)`;
                },
                afterBody: ctx => {
                  const d = sorted[ctx.dataIndex];
                  return [`Ratio: ${d.ratio.toFixed(2)}×`, `Status: ${d.status}`];
                },
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
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <StatusChip color="rgba(55,138,221,0.2)" textColor="#378add" label="Under-represented" />
        <StatusChip color="rgba(126,200,80,0.2)" textColor="#7ec850" label="Proportional" />
        <StatusChip color="rgba(224,92,40,0.2)" textColor="#e05c28" label="Over-represented" />
      </div>
      <div style={{ height: 320, position: 'relative' }}>
        <canvas ref={canvasRef} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0 }}>
        Source: MODIS C6.1 × GBT peat depth (GlobPeat) · DBSCAN filtered · Bengkalis Regency, 2015–2024
      </p>
    </div>
  );
}

function StatusChip({ color, textColor, label }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      fontSize: '0.75rem', color: textColor, background: color,
      padding: '0.2em 0.6em', borderRadius: '2px',
      fontFamily: "'Source Sans 3', sans-serif",
    }}>{label}</span>
  );
}
